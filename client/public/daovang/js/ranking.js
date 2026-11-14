/* ==========================================================================
   Đào Vàng Cổ Điển — Bảng xếp hạng
   --------------------------------------------------------------------------
   Máy tính: sidebar cố định bên phải, canvas tự thu hẹp lại.
   Di động : nút 🏆 mở hộp phủ toàn màn hình, dùng chung đúng một thẻ bảng.
   ========================================================================== */

(function () {
  'use strict';

  var API        = 'api/';
  var SIDEBAR_W  = 320;                       // px, khớp với ảnh mẫu
  var CAN_TOI_THIEU = 640;                    // canvas không được hẹp hơn mức này
  var K_SESSION  = 'dvcd_session';
  var K_TEN      = 'dvcd_name';

  var kyHan        = 'day';
  var dangTai     = false;
  var trongManChoi = false;

  /* --- Định danh máy chơi ------------------------------------------------- */

  // Băm FNV-1a, đủ dùng để sinh tên tự động ổn định.
  function bam(chuoi) {
    var h = 0x811c9dc5;
    for (var i = 0; i < chuoi.length; i++) {
      h ^= chuoi.charCodeAt(i);
      h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
    }
    return h >>> 0;
  }

  function maMay() {
    var v = null;
    try { v = localStorage.getItem(K_SESSION); } catch (e) { /* chặn cookie */ }
    if (v && /^[A-Za-z0-9_-]{8,64}$/.test(v)) return v;

    // Ưu tiên bám theo mã sẵn có của game để cùng máy giữ nguyên định danh.
    var goc = '';
    try {
      if (window.SaveAPI && SaveAPI.UNIQ_ID) goc = String(SaveAPI.getAccess(SaveAPI.UNIQ_ID) || '');
    } catch (e) { /* bỏ qua */ }
    if (!goc) goc = String(Math.random()) + navigator.userAgent;

    v = 'dv' + bam(goc).toString(36) + Date.now().toString(36);
    v = v.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 64);
    while (v.length < 8) v += '0';
    try { localStorage.setItem(K_SESSION, v); } catch (e) { /* bỏ qua */ }
    return v;
  }

  function tenTuDong() {
    var hex = ('0000' + (bam(maMay()) & 0xffff).toString(16).toUpperCase()).slice(-4);
    return 'Người chơi #' + hex;
  }

  function tenHienTai() {
    var t = null;
    try { t = localStorage.getItem(K_TEN); } catch (e) { /* bỏ qua */ }
    return (t && t.trim()) ? t.trim() : tenTuDong();
  }

  function luuTen(t) {
    try { localStorage.setItem(K_TEN, t); } catch (e) { /* bỏ qua */ }
  }

  /* --- Gọi API ------------------------------------------------------------ */

  function guiJson(duongDan, du_lieu) {
    return fetch(API + duongDan, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(du_lieu)
    }).then(function (r) { return r.json(); });
  }

  var luotVuaXong = null;   // {diem, cap} của lượt vừa kết thúc, dùng cho hộp hỏi tên

  function guiDiem(diem, cap) {
    if (!(diem > 0)) return;                  // bỏ lượt chơi không kiếm được gì
    guiJson('submit.php', {
      session: maMay(), name: tenHienTai(), score: diem, level: cap
    }).then(function () {
      luotVuaXong = { diem: diem, cap: cap };
      napBang();                              // cập nhật ngay để người chơi thấy
      canHoiTen = true;
    }).catch(function () { /* mất mạng thì thôi */ });
  }

  /* --- Hộp hỏi tên sau khi chơi xong -------------------------------------- */

  var canHoiTen = false;

  function daDatTen() {
    try { return !!(localStorage.getItem(K_TEN) || '').trim(); } catch (e) { return false; }
  }

  function hienHopTen() {
    var modal = document.getElementById('name-modal');
    var input = document.getElementById('name-input');
    var mo_ta = document.getElementById('name-score');
    if (!modal) return;

    if (mo_ta) {
      mo_ta.textContent = luotVuaXong
        ? 'Bạn vừa được ' + luotVuaXong.diem.toLocaleString('vi-VN') +
          ' điểm ở cấp ' + luotVuaXong.cap +
          '. Đặt tên để ghi vào bảng xếp hạng, bỏ qua thì giữ "' + tenTuDong() + '".'
        : '';
    }
    modal.hidden = false;
    if (input) {
      // Đã đặt tên rồi thì điền sẵn để chỉ việc bấm Lưu hoặc đóng.
      var cu = '';
      try { cu = (localStorage.getItem(K_TEN) || '').trim(); } catch (e) { /* bỏ qua */ }
      input.value = cu;
      try { input.focus(); } catch (e) { /* bỏ qua */ }
    }
  }

  function anHopTen() {
    var modal = document.getElementById('name-modal');
    if (modal) modal.hidden = true;
  }

  function luuTenTuHop() {
    var input = document.getElementById('name-input');
    var nut   = document.getElementById('name-save');
    if (!input) return;
    var t = input.value.trim();
    if (!t) { anHopTen(); return; }

    if (nut) nut.disabled = true;
    guiJson('name.php', { session: maMay(), name: t }).then(function (d) {
      if (nut) nut.disabled = false;
      if (d && d.ok) {
        luuTen(d.name);
        var o = document.getElementById('rank-name-input');
        if (o) o.placeholder = d.name;
        napBang();
      }
      anHopTen();
    }).catch(function () {
      if (nut) nut.disabled = false;
      anHopTen();
    });
  }

  function chiaSe() {
    var noi_dung = luotVuaXong
      ? 'Tôi vừa được ' + luotVuaXong.diem.toLocaleString('vi-VN') +
        ' điểm ở cấp ' + luotVuaXong.cap + ' trong Đào Vàng Cổ Điển!'
      : 'Cùng chơi Đào Vàng Cổ Điển nào!';
    var url = location.href.split('?')[0];

    if (navigator.share) {
      navigator.share({ title: 'Đào Vàng Cổ Điển', text: noi_dung, url: url })
        .catch(function () { /* người dùng huỷ */ });
      return;
    }
    var nut = document.getElementById('name-share');
    if (navigator.clipboard) {
      navigator.clipboard.writeText(noi_dung + ' ' + url).then(function () {
        if (nut) {
          var cu = nut.innerHTML;
          nut.textContent = 'Đã chép!';
          setTimeout(function () { nut.innerHTML = cu; }, 1500);
        }
      }).catch(function () { /* bỏ qua */ });
    }
  }

  /* --- Vẽ bảng ------------------------------------------------------------ */

  var HUY_CHUONG = ['🥇', '🥈', '🥉'];

  function veDanhSach(rows) {
    var ol = document.getElementById('rank-list');
    if (!ol) return;
    ol.innerHTML = '';

    if (!rows.length) {
      var li = document.createElement('li');
      li.className = 'rank-empty';
      li.textContent = 'Chưa có ai ghi điểm trong kỳ này.';
      ol.appendChild(li);
      return;
    }

    rows.forEach(function (r) {
      var li = document.createElement('li');
      li.className = 'rank-row' + (r.me ? ' is-me' : '');

      var no = document.createElement('span');
      no.className = 'rank-row__no' + (r.rank <= 3 ? ' is-medal' : '');
      no.textContent = r.rank <= 3 ? HUY_CHUONG[r.rank - 1] : r.rank;

      var ten = document.createElement('span');
      ten.className = 'rank-row__name';
      ten.textContent = r.name;                     // textContent nên không dính XSS
      ten.title = r.name + ' — cấp ' + r.level;

      var diem = document.createElement('span');
      diem.className = 'rank-row__score';
      diem.textContent = r.score.toLocaleString('vi-VN');

      li.appendChild(no);
      li.appendChild(ten);
      li.appendChild(diem);
      ol.appendChild(li);
    });
  }

  function veDongCuaToi(mine) {
    var el = document.getElementById('rank-mine');
    if (!el) return;
    el.textContent = mine
      ? 'Bạn đang hạng ' + mine.rank + ' — ' + mine.score.toLocaleString('vi-VN') +
        ' (cấp ' + mine.level + ')'
      : 'Bạn chưa có điểm trong kỳ này.';
  }

  function napBang() {
    if (dangTai) return;
    dangTai = true;
    var url = API + 'top.php?period=' + encodeURIComponent(kyHan) +
              '&session=' + encodeURIComponent(maMay());
    fetch(url).then(function (r) {
      // Kể cả khi HTTP 500, thân phản hồi vẫn là JSON có trường error do
      // api/config.php đặt bộ bắt ngoại lệ. Đọc JSON trước, xét ok sau.
      return r.json().catch(function () { return null; });
    }).then(function (d) {
      dangTai = false;
      var el = document.getElementById('rank-mine');

      // Bản cũ chỉ "return" khi d.ok sai, nên khi máy chủ báo lỗi thì hộp xếp
      // hạng đứng im không nói gì. Hiện đúng nguyên nhân máy chủ trả về để còn
      // biết đường sửa, thay vì một câu chung chung cho mọi sự cố.
      if (!d || !d.ok) {
        veDanhSach([]);
        if (el) el.textContent = (d && d.error) ? d.error : 'Không kết nối được máy chủ xếp hạng.';
        return;
      }
      veDanhSach(d.rows || []);
      veDongCuaToi(d.mine);
    }).catch(function () {
      dangTai = false;
      var el = document.getElementById('rank-mine');
      if (el) el.textContent = 'Không kết nối được máy chủ xếp hạng.';
    });
  }

  /* --- Chuyển giữa sidebar và hộp phủ ------------------------------------- */

  function dungSidebar() {
    var duRong = (window.innerWidth - SIDEBAR_W) >= CAN_TOI_THIEU;
    var chuotThat = true;
    try { chuotThat = !window.matchMedia('(pointer: coarse)').matches; } catch (e) { /* cũ */ }
    return duRong && chuotThat;
  }

  function datBoCuc() {
    var panel   = document.getElementById('rank-panel');
    var sidebar = document.getElementById('rank-sidebar');
    var modal   = document.getElementById('rank-modal');
    var nutRank = document.getElementById('btn-rank');
    if (!panel || !sidebar || !modal) return;

    if (dungSidebar()) {
      document.documentElement.style.setProperty('--sidebar-w', SIDEBAR_W + 'px');
      sidebar.hidden = false;
      modal.hidden = true;
      if (panel.parentNode !== sidebar) sidebar.appendChild(panel);
      panel.hidden = false;
      if (nutRank) nutRank.hidden = true;     // đã thấy sẵn thì không cần nút
    } else {
      document.documentElement.style.setProperty('--sidebar-w', '0px');
      sidebar.hidden = true;
      if (panel.parentNode !== modal.firstElementChild) {
        modal.firstElementChild.appendChild(panel);
      }
      if (nutRank) nutRank.hidden = false;
    }

    // Canvas phải tính lại vì bề ngang khả dụng vừa đổi.
    if (typeof window.dvcdTinhLaiKhung === 'function') window.dvcdTinhLaiKhung();
  }

  function moHopPhu() {
    var modal = document.getElementById('rank-modal');
    if (!modal || dungSidebar()) return;
    modal.hidden = false;
    // Hộp phủ che kín màn hình, nên phải dừng game kẻo đồng hồ chạy tiếp
    // sau lưng và người chơi mất màn oan.
    if (trongManChoi && typeof window.dvcdTamDungPhu === 'function') {
      window.dvcdTamDungPhu(true);
    }
    napBang();
  }

  function dongHopPhu() {
    var modal = document.getElementById('rank-modal');
    if (modal) modal.hidden = true;
    if (typeof window.dvcdTamDungPhu === 'function') window.dvcdTamDungPhu(false);
  }

  /* --- Bắt điểm khi kết thúc lượt ----------------------------------------- */

  function mocDiem() {
    if (!window.Game || !Game.prototype || Game.prototype.__dvcdRank) return false;
    var goc = Game.prototype.endLevel;
    if (typeof goc !== 'function') return false;

    Game.prototype.endLevel = function () {
      // Phải đọc TRƯỚC khi gọi hàm gốc: nhánh thua sẽ reset tiền về 0.
      var thua = this.currentLevelGoal > Game.currentMoney;
      var diem = Game.currentMoney;
      var cap  = Game.currentLevelNum;
      var kq = goc.apply(this, arguments);
      if (thua) guiDiem(diem, cap);           // hết giờ hoặc bấm Thoát đều tính
      return kq;
    };
    Game.prototype.__dvcdRank = true;
    return true;
  }

  /* --- Khởi động ---------------------------------------------------------- */

  function gan() {
    var input = document.getElementById('rank-name-input');
    var luu   = document.getElementById('rank-name-save');
    var dong  = document.getElementById('rank-close');
    var modal = document.getElementById('rank-modal');
    var nut   = document.getElementById('btn-rank');

    if (input) {
      input.value = '';
      input.placeholder = tenHienTai();
    }

    if (luu && input) {
      luu.addEventListener('click', function () {
        var t = input.value.trim();
        if (!t) return;
        luu.disabled = true;
        guiJson('name.php', { session: maMay(), name: t }).then(function (d) {
          luu.disabled = false;
          if (d && d.ok) {
            luuTen(d.name);
            input.value = '';
            input.placeholder = d.name;
            napBang();
          }
        }).catch(function () { luu.disabled = false; });
      });
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') luu.click();
      });
    }

    Array.prototype.forEach.call(document.querySelectorAll('.rank-tab'), function (tab) {
      tab.addEventListener('click', function () {
        Array.prototype.forEach.call(document.querySelectorAll('.rank-tab'), function (t) {
          t.classList.remove('is-active');
        });
        tab.classList.add('is-active');
        kyHan = tab.getAttribute('data-period') || 'day';
        napBang();
      });
    });

    // Hộp hỏi tên sau khi kết thúc lượt
    var nLuu   = document.getElementById('name-save');
    var nDong  = document.getElementById('name-close');
    var nChia  = document.getElementById('name-share');
    var nInput = document.getElementById('name-input');
    if (nLuu)  nLuu.addEventListener('click', luuTenTuHop);
    if (nDong) nDong.addEventListener('click', anHopTen);
    if (nChia) nChia.addEventListener('click', chiaSe);
    if (nInput) {
      nInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') luuTenTuHop();
        if (e.key === 'Escape') anHopTen();
      });
    }

    if (nut) nut.addEventListener('click', moHopPhu);
    if (dong) dong.addEventListener('click', dongHopPhu);
    if (modal) {
      modal.addEventListener('click', function (e) {
        if (e.target === modal) dongHopPhu();   // chạm nền thì đóng
      });
    }
    window.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') dongHopPhu();
    });

    var hen = 0;
    window.addEventListener('resize', function () {
      clearTimeout(hen);
      hen = setTimeout(datBoCuc, 150);
    });
  }

  function batDau() {
    gan();
    datBoCuc();
    napBang();

    // Bundle game nạp không đồng bộ nên chờ tới khi lớp Game và thực thể game
    // có mặt rồi mới móc vào.
    var thu = 0;
    (function doi() {
      var xong = mocDiem();
      var game = (window.Phaser && Phaser.GAMES && Phaser.GAMES[0]) || null;
      if (game && game.state && game.state.onStateChange && !game.__dvcdRankState) {
        game.__dvcdRankState = true;
        game.state.onStateChange.add(function (moi) {
          trongManChoi = (moi === 'Game');
          datBoCuc();
          // Hỏi tên sau khi lượt chơi đã kết thúc hẳn và người chơi về menu,
          // để không che màn hình "Bạn chưa hoàn thành nhiệm vụ".
          if (moi === 'MainMenu' && canHoiTen) {
            canHoiTen = false;
            hienHopTen();
          }
        });
      } else {
        xong = false;
      }
      if (xong) return;
      if (++thu > 200) return;                  // ~10 giây rồi thôi
      setTimeout(doi, 50);
    })();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', batDau);
  } else {
    batDau();
  }
})();
