/* ==========================================================================
   Đào Vàng Cổ Điển — lớp tương thích di động / desktop
   --------------------------------------------------------------------------
   File này nạp TRƯỚC goldminer.min.js và tự vá vào lúc window 'load'.
   Vì bundle game đã minify (26k dòng) nên mọi thay đổi hành vi đều nằm ở đây,
   không sửa thẳng vào bundle. Xem memory: goldminer-responsive-redesign-decisions.

   Nội dung:
     1. Tính lại kích thước khung hình (thay ScaleManager.SizeCalculation)
     2. Sửa lỗi camera lệch khung trên màn hình rộng hơn 4:3
     3. Neo lại HUD / nền / thanh trên theo mép màn hình thật + safe-area
     4. Cổng chặn khi cầm máy dọc
     5. Mở khoá AudioContext, chặn tracking và link quảng cáo ngoài
   ========================================================================== */

(function () {
  'use strict';

  /* --- Hằng số ---------------------------------------------------------- */

  var DESIGN_W = 640;   // khung thiết kế gốc của game
  var DESIGN_H = 480;
  var MIN_AR = 4 / 3;   // không bao giờ hẹp hơn khung gốc
  /* Trần tỉ lệ khung hình.
     Đo trên iPhone 414x896 (dpr 3), Brave, nằm ngang:
         vùng nhìn thấy      896 x 336   (thanh địa chỉ chiếm 78pt)
         iframe game         896 x 307   (thanh Thoát chiếm thêm 29pt)
         tỉ lệ vùng game     896/307 = 2.92
     Trần cũ 20/9 = 2.22 kẹp tỉ lệ xuống, nên canvas chỉ rộng 683/896 = 76%
     và để lại hai dải đen tổng cộng 213pt — đúng phần "màn chơi vẫn nhỏ".

     Nới lên 3.0 thì tỉ lệ 2.92 lọt trong ngưỡng, canvas phủ kín 896x307.
     An toàn vì applyLayout() đã kéo nền hầm mỏ và thanh HUD ra hết view.width,
     còn hai vách đá được neo về mép màn hình thật — camera rộng bao nhiêu cũng
     không hở. Vẫn giữ MỘT trần thay vì bỏ hẳn, để cửa sổ máy tính rất rộng
     không kéo camera ra vô hạn. */
  var MAX_AR = 3.0;
  var EDGE_PAD = 8;     // đệm mép, tránh góc bo tròn của màn hình điện thoại
  var HUD_BAR_H = 71;   // chiều cao thanh HUD trên cùng, theo đơn vị thiết kế

  /* --- Trạng thái khung hình -------------------------------------------- */

  var view = { left: 0, top: 0, width: DESIGN_W, height: DESIGN_H, scale: 1 };
  var safe = { top: 0, right: 0, bottom: 0, left: 0 };
  var refs = newRefs();
  var loadingHidden = false;

  function newRefs() {
    return { bg: null, panel: null, anchors: [] };
  }

  function getGame() {
    return (window.Phaser && Phaser.GAMES && Phaser.GAMES[0]) || null;
  }

  /* --- Safe-area (tai thỏ khi nằm ngang) -------------------------------- */

  function readSafeArea() {
    var probe = document.getElementById('safe-area-probe');
    if (!probe || !window.getComputedStyle) return;
    var cs = window.getComputedStyle(probe);
    safe.top = parseFloat(cs.paddingTop) || 0;
    safe.right = parseFloat(cs.paddingRight) || 0;
    safe.bottom = parseFloat(cs.paddingBottom) || 0;
    safe.left = parseFloat(cs.paddingLeft) || 0;
  }

  /* --- Tính khung hình --------------------------------------------------- */

  // Sidebar bảng xếp hạng chiếm bớt bề ngang, nên canvas phải tính theo phần
  // còn lại chứ không phải cả cửa sổ. ranking.js đặt biến --sidebar-w; khi
  // không có sidebar thì biến này bằng 0 và mọi thứ như cũ.
  function beRongSidebar() {
    var v = getComputedStyle(document.documentElement).getPropertyValue('--sidebar-w');
    var n = parseFloat(v);
    return (isFinite(n) && n > 0) ? n : 0;
  }

  /**
   * Kích thước THẬT của vùng nhìn thấy, đo từ tài liệu chứ không từ window.
   *
   * window.innerWidth/innerHeight không đáng tin khi trang chạy trong iframe
   * trên iOS: sau khi xoay máy hoặc khi thanh công cụ trình duyệt co/giãn, hai
   * giá trị này có thể còn giữ số cũ trong lúc iframe đã đổi kích thước. Hậu
   * quả đo được trên máy thật: game tính scale theo một chiều cao nhỏ hơn thực
   * tế nên canvas chỉ chiếm khoảng 3/4 chiều cao và 3/5 chiều ngang của iframe,
   * để lại viền đen dày quanh màn chơi.
   *
   * documentElement.clientWidth/clientHeight là vùng bố cục của CHÍNH tài liệu
   * này — đúng bằng cái mà CSS 100% nhìn thấy — nên bám sát iframe hơn.
   * visualViewport (nếu có) còn phản ánh cả phần bị thanh công cụ che.
   */
  /**
   * Bàn phím ảo cũng làm visualViewport co lại, y như thanh công cụ trình duyệt.
   * Nếu tính cả trường hợp đó thì vừa chạm vào ô nhập tên là canvas thu nhỏ,
   * gõ xong lại bung ra — nhấp nháy vô cớ giữa lúc chơi. Ô nhập đang được focus
   * là dấu hiệu đủ tin cậy để bỏ qua.
   */
  function banPhimDangMo() {
    var el = document.activeElement;
    if (!el) return false;
    var tag = (el.tagName || '').toUpperCase();
    return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable === true;
  }

  /**
   * Trang này có đang nằm trong iframe không?
   *
   * Quyết định việc CÓ dùng visualViewport hay không, và đây là chỗ dễ sai:
   *
   *   - Ở trang cấp cao nhất, visualViewport phản ánh phần thực sự nhìn thấy
   *     sau khi trừ thanh công cụ trình duyệt. Dùng nó là đúng.
   *
   *   - Trong IFRAME thì không. Trên iOS, visualViewport của khung con phản ánh
   *     khung nhìn của trang CẤP CAO NHẤT chứ không phải hộp iframe. Lấy min()
   *     với nó là trừ chiều cao thanh trình duyệt LẦN THỨ HAI — trong khi trang
   *     cha đã trừ rồi lúc đặt kích thước iframe.
   *
   * Đo trên iPhone 414x896, Brave, nằm ngang: iframe cao 307pt nhưng game tính
   * ra 237pt, hụt đúng 76pt = chiều cao thanh địa chỉ. Canvas vì thế chỉ cao
   * 237pt và để lại dải đen phía dưới.
   *
   * Trong iframe, kích thước hộp do trang cha quyết định, nên
   * documentElement.clientHeight mới là số đúng — không cần điều chỉnh gì thêm.
   */
  function trongIframe() {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;   // chặn cross-origin => chắc chắn đang ở trong iframe
    }
  }

  /**
   * Kích thước do TRANG CHA gửi sang, qua postMessage.
   *
   * Vì sao phải làm vậy: trên iOS, MỌI cách đo khung nhìn từ bên trong iframe
   * đều sai, mỗi cách sai một kiểu. Đo trên iPhone 414x896, Brave, nằm ngang —
   * iframe thật cao 307pt:
   *     window.innerHeight            -> lệch
   *     visualViewport.height         -> trả khung nhìn của trang CẤP CAO NHẤT
   *     documentElement.clientHeight  -> ~237pt, hụt ~70pt
   * Kết quả: game tính tỉ lệ 896/237 = 3.78, bị kẹp về trần 3.0, canvas ra
   * 711x237 và chừa một dải đen dày phía dưới.
   *
   * Trang cha thì biết chắc: chính nó đặt kích thước iframe và đọc được bằng
   * getBoundingClientRect(). Nên nguồn tin đúng là trang cha, không phải phép
   * đo tại chỗ. Chỉ nhận thông điệp cùng origin.
   *
   * Vẫn giữ nguyên đường đo cũ làm dự phòng: mở game trực tiếp (không qua
   * iframe) thì không có ai gửi kích thước sang.
   */
  var kichThuocTuCha = null;

  window.addEventListener('message', function (ev) {
    if (!ev.data || ev.data.type !== 'dvcd-kich-thuoc') return;
    if (ev.origin !== window.location.origin) return;
    var w = Math.round(ev.data.w);
    var h = Math.round(ev.data.h);
    if (!(w > 0 && h > 0)) return;
    if (kichThuocTuCha && kichThuocTuCha.w === w && kichThuocTuCha.h === h) return;
    kichThuocTuCha = { w: w, h: h };
    onResize();
  });

  /**
   * Chủ động XIN kích thước từ trang cha.
   *
   * Không chờ trang cha tự gửi, vì game được nhúng ở hai luồng khác nhau
   * (trang chủ và trang view game) và không luồng nào chắc chắn gửi đúng lúc
   * game đã sẵn sàng. Hỏi thì chắc ăn hơn đợi.
   *
   * Hỏi lại vài lần trong mấy giây đầu: script của trang cha có thể nạp sau
   * game, và bố cục toàn màn hình trên iOS ổn định khá trễ.
   */
  function xinKichThuocTuCha() {
    if (!trongIframe()) return;
    try {
      window.parent.postMessage({ type: 'dvcd-xin-kich-thuoc' }, window.location.origin);
    } catch (e) { /* cha khac origin */ }
  }

  function xinKichThuocNhieuLan() {
    [0, 200, 500, 1000, 2000, 3500].forEach(function (tre) {
      setTimeout(xinKichThuocTuCha, tre);
    });
  }

  function docRong() {
    if (kichThuocTuCha) return kichThuocTuCha.w;
    var d = document.documentElement;
    var w = (d && d.clientWidth) || 0;
    if (!trongIframe() && window.visualViewport && window.visualViewport.width) {
      w = Math.max(w, Math.round(window.visualViewport.width));
    }
    return w || window.innerWidth || DESIGN_W;
  }

  function docCao() {
    if (kichThuocTuCha) return kichThuocTuCha.h;
    var d = document.documentElement;
    var h = (d && d.clientHeight) || 0;
    if (!trongIframe() && window.visualViewport && window.visualViewport.height && !banPhimDangMo()) {
      // Chỉ ở trang cấp cao nhất: visualViewport trừ đi phần bị thanh công cụ
      // che, vẽ tràn ra dưới thanh đó thì người chơi không thấy.
      var vv = Math.round(window.visualViewport.height);
      h = h ? Math.min(h, vv) : vv;
    }
    return h || window.innerHeight || DESIGN_H;
  }

  /**
   * Cửa sổ chẩn đoán: trả về đúng những gì lớp này ĐANG đo được.
   * chan-doan-man-hinh.html đọc hàm này để in ra màn hình, nhờ đó so được
   * "game nghĩ vùng game to bằng này" với "iframe thật to bằng này" mà không
   * cần DevTools — thứ iOS không có.
   */
  window.dvcdDoDac = function () {
    return {
      trongIframe: trongIframe(),
      chaGuiSang: kichThuocTuCha ? (kichThuocTuCha.w + 'x' + kichThuocTuCha.h) : '(chua nhan duoc)',
      doRong: docRong(),
      doCao: docCao(),
      clientWH: document.documentElement.clientWidth + 'x' + document.documentElement.clientHeight,
      visualVP: window.visualViewport
        ? Math.round(window.visualViewport.width) + 'x' + Math.round(window.visualViewport.height)
        : '(khong co)',
      view: { w: view.width, h: view.height, scale: +view.scale.toFixed(4) }
    };
  };

  function vungGameRong() {
    return Math.max(320, docRong() - beRongSidebar());
  }

  function vungGameCao() {
    return Math.max(200, docCao());
  }

  function computeView() {
    var w = vungGameRong();
    var h = vungGameCao();
    var ar = w / h;
    if (!isFinite(ar) || ar <= 0) ar = DESIGN_W / DESIGN_H;
    ar = Math.max(MIN_AR, Math.min(MAX_AR, ar));

    var gw = DESIGN_W;
    var gh = DESIGN_H;
    if (ar >= DESIGN_W / DESIGN_H) gw = Math.round(DESIGN_H * ar);
    else gh = Math.round(DESIGN_W / ar);

    view.width = gw;
    view.height = gh;
    // Khung thiết kế 640x480 luôn nằm giữa vùng nhìn thấy.
    view.left = -(gw - DESIGN_W) / 2;
    view.top = -(gh - DESIGN_H) / 2;
    view.scale = Math.min(w / gw, h / gh);
    return view;
  }

  /* --- Thay thế ScaleManager.SizeCalculation ----------------------------- */

  function sizeCalculation(game) {
    if (!game || !game.scale) return;
    /* jshint validthis:true */
    if (this) this.game = game;

    readSafeArea();
    computeView();

    game.scale.setUserScale(view.scale, view.scale, 0, 0);
    game.scale.setGameSize(view.width, view.height);

    if (window.ScaleManager && ScaleManager.inSplash) {
      // Màn hình splash tự căn theo game.width nên gốc toạ độ giữ nguyên ở 0.
      game.world.setBounds(0, 0, view.width, view.height);
      setCameraBounds(game, 0, 0, view.width, view.height);
    } else {
      // World giữ đúng 640x480 để mọi toạ độ trong game không đổi ý nghĩa,
      // nhưng camera được phép nhìn rộng hơn. Bản gốc truyền 640x480 cho cả
      // camera nên khi màn hình rộng hơn 4:3, checkBounds() kéo view lệch hẳn
      // sang một bên (view.x = bounds.right - camera.width) làm vỡ bố cục.
      game.world.setBounds(view.left, view.top, DESIGN_W, DESIGN_H);
      setCameraBounds(game, view.left, view.top, view.width, view.height);
    }

    game.scale.refresh();
    syncOverlayGeometry();
    applyLayout();
  }

  // Các nút DOM phải bám theo mép CANVAS chứ không phải mép cửa sổ: khi tỉ lệ
  // màn hình bị kẹp (letterbox) hai bên là nền trang, đặt nút theo cửa sổ sẽ
  // làm nút trôi ra ngoài vùng chơi. Tính bằng công thức thay vì đọc DOM vì
  // Phaser chỉ áp kích thước canvas ở vòng lặp kế tiếp.
  function syncOverlayGeometry() {
    var cssW = view.width * view.scale;
    var cssH = view.height * view.scale;
    var gapX = Math.max(0, (vungGameRong() - cssW) / 2);
    var gapY = Math.max(0, (vungGameCao() - cssH) / 2);
    var px = function (n) { return (Math.round(n * 100) / 100) + 'px'; };
    var s = document.documentElement.style;
    s.setProperty('--canvas-x', px(gapX));
    s.setProperty('--canvas-y', px(gapY));
    s.setProperty('--hud-h', px(HUD_BAR_H * view.scale));
  }

  function setCameraBounds(game, x, y, w, h) {
    var cam = game.camera;
    if (!cam || !cam.bounds) return;
    cam.bounds.setTo(x, y, w, h);
    try { cam.checkBounds(); } catch (e) { /* camera chưa sẵn sàng */ }
  }

  /* --- Neo phần tử giao diện theo mép màn hình --------------------------- */

  // pad = false dành cho khung viền: phải nằm đúng mép màn hình, không lùi vào.
  function registerAnchor(obj, pad) {
    if (!obj || obj.__mlAnchored) return;
    obj.__mlAnchored = true;
    obj.__mlx = obj.x;
    obj.__mly = obj.y;
    obj.__mlPad = (pad !== false);
    refs.anchors.push(obj);
  }

  // Nhãn HUD trái được căn phải về x=66 nên chữ càng dài càng thò sang trái.
  // Font tiếng Việt rộng hơn font ASCII gốc, "Mục tiêu" chạm mép màn hình.
  // Đẩy cả cột trái sang phải đúng bằng phần thiếu, giữ nguyên khoảng cách nội bộ.
  function nudgeLeftColumn() {
    var MIN_X = 6;
    var i, obj, min = Infinity;
    for (i = 0; i < refs.anchors.length; i++) {
      obj = refs.anchors[i];
      if (obj.__mlx < DESIGN_W / 2 && obj.__mlx < min) min = obj.__mlx;
    }
    if (min === Infinity || min >= MIN_X) return;
    var delta = MIN_X - min;
    for (i = 0; i < refs.anchors.length; i++) {
      obj = refs.anchors[i];
      if (obj.__mlx < DESIGN_W / 2) obj.__mlx += delta;
    }
  }

  function applyLayout() {
    var insetL = safe.left / (view.scale || 1);
    var insetR = safe.right / (view.scale || 1);

    var alive = [];
    for (var i = 0; i < refs.anchors.length; i++) {
      var obj = refs.anchors[i];
      if (!obj || !obj.game) continue;          // đã bị destroy khi đổi state
      var pad = obj.__mlPad ? EDGE_PAD : 0;
      var dx = obj.__mlx < DESIGN_W / 2
        ? view.left + insetL + pad
        : view.left + view.width - DESIGN_W - insetR - pad;
      obj.x = obj.__mlx + dx;
      alive.push(obj);
    }
    refs.anchors = alive;

    // Nền hầm mỏ: kéo ngang cho phủ hết bề rộng nhìn thấy. Cố ý kéo không đều
    // (chỉ giãn ngang) để giữ nguyên các lớp đất theo chiều dọc.
    if (refs.bg && refs.bg.game) {
      refs.bg.x = view.left;
      refs.bg.y = refs.bg.__mly;
      refs.bg.width = view.width;
      refs.bg.height = (view.top + view.height) - refs.bg.__mly;
    }

    // Thanh HUD trên cùng (ảnh nine-slice) giãn hết bề ngang.
    if (refs.panel && refs.panel.game) {
      refs.panel.x = view.left;
      refs.panel.width = view.width;
    }
  }

  /* --- Cổng chặn khi cầm máy dọc ----------------------------------------- */

  var allowPortraitPlay = false;

  function shouldBlock(game) {
    if (allowPortraitPlay) return false;
    if (game && game.device && game.device.desktop) return false;
    if (!game && !isTouchDevice()) return false;
    return window.innerHeight > window.innerWidth * 1.02;
  }

  function isTouchDevice() {
    return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  }

  // "Ngón tay là con trỏ chính" - chính xác hơn isTouchDevice() vì laptop cảm
  // ứng vẫn báo có touch nhưng người dùng chủ yếu dùng chuột.
  function prefersTouchUI() {
    try {
      if (window.matchMedia) return window.matchMedia('(pointer: coarse)').matches;
    } catch (e) { /* trình duyệt cũ */ }
    return isTouchDevice();
  }

  function updateOrientation() {
    if (window.innerWidth >= window.innerHeight) {
      allowPortraitPlay = false;
    }
    var blocked = shouldBlock(getGame());
    var el = document.getElementById('orientation');
    if (el) {
      el.classList.toggle('is-visible', blocked);
      el.setAttribute('aria-hidden', blocked ? 'false' : 'true');
    }
    capNhatTrangThaiDung();
  }

  /* --- Tạm dừng ----------------------------------------------------------- */

  var tamDungThuCong = false;
  var tamDungPhu     = false;   // lớp khác yêu cầu dừng, ví dụ bảng xếp hạng

  // Hai thứ cùng muốn dừng game: người chơi bấm nút, và cổng chặn khi cầm máy
  // dọc. Gộp về một nơi quyết định, nếu không thì xoay máy qua lại sẽ vô tình
  // huỷ trạng thái tạm dừng của người chơi.
  function capNhatTrangThaiDung() {
    var game = getGame();
    var chanXoay = shouldBlock(game);
    var hienLopDung = tamDungThuCong && !chanXoay;

    var el = document.getElementById('paused');
    if (el) {
      el.classList.toggle('is-visible', hienLopDung);
      el.setAttribute('aria-hidden', hienLopDung ? 'false' : 'true');
    }
    if (game) game.paused = tamDungThuCong || chanXoay || tamDungPhu;
  }

  // Bảng xếp hạng gọi hàm này để dừng game khi mở hộp phủ. Không hiện lớp phủ
  // "Tạm dừng" vì đã có hộp xếp hạng che màn hình rồi.
  window.dvcdTamDungPhu = function (bat) {
    tamDungPhu = !!bat;
    capNhatTrangThaiDung();
  };

  function datTamDung(dung) {
    var game = getGame();
    if (!game) return;
    // Chỉ có ý nghĩa trong màn chơi - các màn khác không có đồng hồ đếm ngược.
    if (dung && game.state.current !== 'Game') return;
    tamDungThuCong = !!dung;
    capNhatTrangThaiDung();
  }

  /* --- Màn hình tải ------------------------------------------------------ */

  // Các state chạy trước khi vào menu; màn hình tải phải che suốt giai đoạn này.
  var INTRO_STATES = { '': 1, 'Boot': 1, 'preSplash': 1, 'funnySplashScreen': 1 };

  function hideLoading() {
    if (loadingHidden) return;
    loadingHidden = true;
    var el = document.getElementById('loading');
    if (el) el.classList.add('is-hidden');
  }

  // Thay hoạt hình FunnyGames bằng thanh tiến trình thật của bộ nạp.
  function setLoadingProgress(percent) {
    if (loadingHidden) return;
    var bar = document.querySelector('#loading .loading__bar');
    var fill = document.querySelector('#loading .loading__bar i');
    if (!bar || !fill) return;
    bar.classList.add('is-determinate');
    fill.style.width = Math.max(4, Math.min(100, percent)) + '%';
  }

  /* --- Mở khoá âm thanh --------------------------------------------------- */

  function hookAudioUnlock(game) {
    // Phaser 2.4.6 không hề gọi AudioContext.resume(), trong khi chính sách
    // autoplay hiện nay khởi tạo context ở trạng thái "suspended".
    var resume = function () {
      try {
        var ctx = game.sound && game.sound.context;
        if (ctx && ctx.state === 'suspended' && ctx.resume) ctx.resume();
      } catch (e) { /* không có Web Audio */ }
    };
    var events = ['pointerdown', 'touchend', 'mousedown', 'keydown'];
    for (var i = 0; i < events.length; i++) {
      window.addEventListener(events[i], resume, { passive: true });
    }
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) resume();
    });
  }

  /* --- Nút điều khiển nổi trên canvas ------------------------------------- */

  function vibrate(ms) {
    try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* bỏ qua */ }
  }

  function fsElement() {
    return document.fullscreenElement || document.webkitFullscreenElement || null;
  }

  function toggleFullscreen() {
    var el = document.documentElement;
    if (fsElement()) {
      (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      return;
    }
    var req = el.requestFullscreen || el.webkitRequestFullscreen;
    if (!req) return;
    var p = req.call(el);
    if (p && p.catch) p.catch(function () {});
    // Android khoá được hướng khi đang toàn màn hình; iOS thì không hỗ trợ.
    try {
      if (screen.orientation && screen.orientation.lock) {
        var q = screen.orientation.lock('landscape');
        if (q && q.catch) q.catch(function () {});
      }
    } catch (e) { /* trình duyệt không cho khoá hướng */ }
  }

  // Chặn sự kiện rơi xuống canvas, nếu không một lần chạm nút sẽ kèm luôn
  // thao tác thả móc.
  function blockGameInput(el) {
    ['pointerdown', 'touchstart', 'mousedown'].forEach(function (ev) {
      el.addEventListener(ev, function (e) { e.stopPropagation(); });
    });
  }

  function setupHudButtons() {
    var fs = document.getElementById('btn-fullscreen');
    var dyn = document.getElementById('btn-dynamite');
    var docEl = document.documentElement;

    // Nút toàn màn hình CHỈ hiện trên máy tính.
    //  - iOS Safari không cho phần tử thường vào toàn màn hình, nút luôn vô dụng.
    //  - Trên di động, việc vào/ra toàn màn hình đổi kích thước khung nhìn giữa
    //    chừng và làm lệch neo của HUD (nhãn TG/Cấp bị đẩy khỏi mép phải).
    //  - Muốn chơi toàn màn hình thật thì thêm vào màn hình chính: manifest.json
    //    đã khai báo display "fullscreen" + orientation "landscape".
    //
    // ...VÀ chỉ hiện khi game chạy ĐỘC LẬP, không nằm trong iframe.
    //
    // Lý do: toggleFullscreen() bên dưới gọi requestFullscreen trên
    // document.documentElement CỦA CHÍNH TRANG NÀY. Khi game được nhúng vào
    // trang chủ của site, phần vào toàn màn hình chỉ là nội dung bên trong
    // iframe — thanh nút của site (thích / cài đặt / chia sẻ / thoát) nằm ở
    // trang cha nên biến mất hoàn toàn, và người chơi không còn đường thoát
    // ngoài phím Esc.
    //
    // Trang cha đã có nút toàn màn hình riêng ở thanh dưới; nút đó cho cả khối
    // #gameDiv vào toàn màn hình nên giữ được thanh nút. Để lộ hai nút làm cùng
    // một việc mà cho ra hai kết quả khác nhau chỉ khiến người dùng bấm nhầm.
    var dangNhung = false;
    try {
        dangNhung = window.self !== window.top;
    } catch (e) {
        // Truy cập window.top khác nguồn gốc bị chặn — tức chắc chắn đang bị nhúng.
        dangNhung = true;
    }

    var coHoTroFullscreen = !!(docEl.requestFullscreen || docEl.webkitRequestFullscreen);
    if (fs && coHoTroFullscreen && !prefersTouchUI() && !dangNhung) {
      fs.hidden = false;
      blockGameInput(fs);
      fs.addEventListener('click', function (e) {
        e.preventDefault();
        toggleFullscreen();
      });
      ['fullscreenchange', 'webkitfullscreenchange'].forEach(function (ev) {
        document.addEventListener(ev, function () {
          document.body.classList.toggle('is-fullscreen', !!fsElement());
          // Khung nhìn còn co giãn thêm một nhịp sau khi sự kiện bắn ra, nên
          // căn lại lần nữa để không dùng số đo dở dang.
          onResizeDebounced();
          setTimeout(onResize, 400);
        });
      });
    }

    var nutDung = document.getElementById('btn-pause');
    var nutTiepTuc = document.getElementById('btn-resume');
    var lopDung = document.getElementById('paused');
    var nutDoc = document.getElementById('btn-portrait-anyway');

    if (nutDoc) {
      blockGameInput(nutDoc);
      var unblock = function (e) {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        allowPortraitPlay = true;
        updateOrientation();
      };
      nutDoc.addEventListener('click', unblock);
      nutDoc.addEventListener('touchend', unblock);
    }

    if (nutDung) {
      blockGameInput(nutDung);
      nutDung.addEventListener('click', function (e) {
        e.preventDefault();
        datTamDung(true);
      });
    }
    if (nutTiepTuc) {
      blockGameInput(nutTiepTuc);
      nutTiepTuc.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        datTamDung(false);
      });
    }
    if (lopDung) {
      blockGameInput(lopDung);
      lopDung.addEventListener('click', function () { datTamDung(false); });
    }
    window.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        datTamDung(!tamDungThuCong);
      }
    });

    if (dyn) {
      blockGameInput(dyn);
      dyn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (tamDungThuCong) return;      // đang dừng thì không cho ném
        var game = getGame();
        var st = game && game.state.states[game.state.current];
        if (st && typeof st.onMakeBoomKey === 'function') {
          st.onMakeBoomKey();
          vibrate(15);
        }
      });
    }
  }

  var dynKey = null;

  function updateHudForState(stateName) {
    var trongManChoi = (stateName === 'Game');
    var dyn = document.getElementById('btn-dynamite');
    dynKey = null;
    // Trong màn chơi thì syncDynamiteButton() quyết định ẩn/hiện theo số thuốc nổ.
    if (dyn && !trongManChoi) dyn.hidden = true;

    var nutDung = document.getElementById('btn-pause');
    if (nutDung) nutDung.hidden = !trongManChoi;
    if (!trongManChoi && tamDungThuCong) {
      tamDungThuCong = false;          // rời màn chơi thì bỏ trạng thái dừng
      capNhatTrangThaiDung();
    }
  }

  // Thuốc nổ chỉ dùng được khi: còn thuốc nổ trong túi, móc đang kéo về VÀ đang
  // vướng vật nặng. Nút phải nói đúng điều đó, nếu không người chơi bấm mãi mà
  // không thấy gì xảy ra. Game cũng tự ẩn chỉ báo thuốc nổ khi số lượng bằng 0.
  function syncDynamiteButton(state) {
    var btn = document.getElementById('btn-dynamite');
    if (!btn) return;
    var count = (window.Game && Game.bonuses && Game.bonuses.stick) || 0;
    var pod = state && state.pod;
    var ready = count > 0 && !!pod && pod.podStatus === 'rewind' && pod.slowDown > 0;

    var key = count + '|' + (ready ? 1 : 0);
    if (key === dynKey) return;          // chỉ đụng DOM khi trạng thái đổi
    dynKey = key;

    btn.hidden = !(prefersTouchUI() && count > 0);
    btn.setAttribute('data-count', count);
    btn.classList.toggle('is-ready', ready);
    btn.setAttribute('aria-disabled', ready ? 'false' : 'true');
    btn.setAttribute('title', ready
      ? 'Ném thuốc nổ (còn ' + count + ')'
      : 'Thuốc nổ: còn ' + count + ' - chỉ dùng được khi móc đang kéo vật nặng');
  }

  // Nút loa trong canvas chỉ ~30px, nhỏ hơn ngưỡng vùng chạm 44px. Giữ nguyên
  // kích thước hiển thị nhưng nới rộng vùng bấm.
  function enlargeTouchTargets(game) {
    if (!isTouchDevice() || !window.Phaser) return;
    var kids = game.world.children;
    for (var i = 0; i < kids.length; i++) {
      var k = kids[i];
      if (k.frameName === 'soundOn.png' || k.frameName === 'soundOff.png') {
        var tw = (k.texture && k.texture.width) || 0;
        var th = (k.texture && k.texture.height) || 0;
        if (tw && th) k.hitArea = new Phaser.Rectangle(-24, -24, tw + 48, th + 48);
      }
    }
  }

  /* --- Giữ màn hình sáng --------------------------------------------------- */

  var wakeLock = null;
  function requestWakeLock() {
    if (!navigator.wakeLock) return;
    try {
      navigator.wakeLock.request('screen').then(function (w) {
        wakeLock = w;
      }).catch(function () { /* pin yếu hoặc bị từ chối */ });
    } catch (e) { /* không hỗ trợ */ }
  }

  /* --- Ảnh WebP ------------------------------------------------------------ */

  var webpOK = false;

  function probeWebp() {
    try {
      var cv = document.createElement('canvas');
      cv.width = cv.height = 1;
      webpOK = cv.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    } catch (e) { /* giữ false */ }
    // Safari giải mã được WebP nhưng canvas không mã hoá được, nên thử thêm
    // bằng cách giải mã một ảnh WebP tí hon.
    var img = new Image();
    img.onload = function () { if (img.width === 1) webpOK = true; };
    img.src = 'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==';
  }

  function patchAssetUrls() {
    if (!window.Phaser || !Phaser.Loader) return;
    var L = Phaser.Loader.prototype;

    var origAtlas = L.atlasJSONArray;
    L.atlasJSONArray = function (key, textureURL) {
      if (webpOK && typeof textureURL === 'string') {
        arguments[1] = textureURL.replace(/\.png(\?.*)?$/i, '.webp?v=gf_miner_v1');
      } else if (typeof textureURL === 'string') {
        arguments[1] = textureURL.replace(/(\?.*)?$/, '?v=gf_miner_v1');
      }
      return origAtlas.apply(this, arguments);
    };

    var origFont = L.bitmapFont;
    L.bitmapFont = function (key, textureURL) {
      if (webpOK && typeof textureURL === 'string') {
        arguments[1] = textureURL.replace(/\.png$/i, '.webp');
      }
      return origFont.apply(this, arguments);
    };
  }

  /* --- Chạy ngoại tuyến ---------------------------------------------------- */

  function registerServiceWorker() {
    // Disabled in LoveCapsule iframe mode
  }

  /* --- Chặn tracking và link quảng cáo ngoài ------------------------------ */

  function blockThirdParty() {
    try {
      if (window.GA && typeof GA.getInstance === 'function') {
        var proto = Object.getPrototypeOf(GA.getInstance());
        if (proto) {
          proto.init = function () { return this; };
          proto.addEvent = function () { return this; };
          proto.sendData = function () { return this; };
          proto.scheduleSendData = function () { return this; };
        }
      }
    } catch (e) { /* bundle đổi cấu trúc thì bỏ qua */ }

    if (window.ExternalLinks) {
      ExternalLinks.getUtmCampaignLink = function () { return ''; };
    }

    var origOpen = window.open;
    window.open = function (url) {
      var s = String(url || '');
      if (!s || s === 'null' || s === 'undefined' || /funnygames/i.test(s)) return null;
      return origOpen.apply(window, arguments);
    };
  }

  /* --- Vá các state của game --------------------------------------------- */

  /* --- Bỏ màn giới thiệu FunnyGames -------------------------------------- */

  // Luồng gốc: Boot -> preSplash -> funnySplashScreen -> MainMenu.
  // preSplash nạp logo/quái vật spine/nhạc hiệu FunnyGames, còn funnySplashScreen
  // mới là màn chạy hoạt hình, phát sound.play("fg") VÀ gọi config.preloadHandler()
  // để nạp toàn bộ tài nguyên game. Vì vậy không thể xoá suông hai state này -
  // phải giữ lại phần nạp tài nguyên và bỏ toàn bộ phần thương hiệu.
  function removeBrandingSplash() {
    if (!window.Fabrique || !Fabrique.PreSplash || !Fabrique.PreSplash.prototype) return;
    var P = Fabrique.PreSplash.prototype;

    P.init = function (config) {
      this.config = config || {};
    };

    P.preload = function () {
      // Chỉ nạp tài nguyên game thật, bỏ logo, nút play, spine và nhạc hiệu.
      if (typeof this.config.preloadHandler === 'function') this.config.preloadHandler();
    };

    P.create = function () {
      this.game.state.start(this.config.nextState || 'MainMenu');
    };

    // Các hàm này trong bản gốc đều đụng tới this.background của màn splash.
    P.loadUpdate = function () {};
    P.update = function () {};
    P.resize = function () {};
    P.shutdown = function () {};
  }

  /* --- Bảng "Điều khiển" ở màn hình chính --------------------------------- */

  // Bản gốc dùng ảnh goalBack.png cố định 315x143 rồi nhét chữ vào, nên khi
  // chuyển sang tiếng Việt có dấu thì chật cứng: nhãn cột đặt ở y=30 trong khi
  // tiêu đề chiếm 10-35 (chồng 5px), hai cột chỉ cách nhau 26px. Ở đây vẽ lại
  // nền theo đúng kích thước chữ thật, dùng chung cho cả máy tính lẫn di động.
  var PANEL = {
    pad: 22,        // lề trong
    gapCot: 38,     // khoảng cách giữa hai cột
    gapTieuDe: 18,  // dưới tiêu đề
    gapNhan: 12,    // giữa nhãn và biểu tượng
    gapThaoTac: 12, // giữa biểu tượng và chữ thao tác
    bo: 16          // bán kính bo góc
  };

  function veKhungBo(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  // Nền bảng dùng chung: bo góc, chuyển sắc nâu hầm mỏ, viền vàng quặng.
  function veNenBang(game, W, H) {
    var bmd = game.make.bitmapData(Math.ceil(W), Math.ceil(H));
    var ctx = bmd.ctx;
    veKhungBo(ctx, 1, 1, W - 2, H - 2, PANEL.bo);
    var grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, 'rgba(60, 38, 20, 0.94)');
    grad.addColorStop(1, 'rgba(20, 12, 6, 0.94)');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255, 176, 46, 0.55)';
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(PANEL.bo, 2.5);
    ctx.lineTo(W - PANEL.bo, 2.5);
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.10)';
    ctx.stroke();
    bmd.dirty = true;
    return bmd;
  }

  /* --- Hộp "Mục tiêu" giữa các màn ---------------------------------------- */

  // Màn Goal/Win/Loose cũng xài chung ảnh goalBack.png 315x143, trong khi chữ
  // cỡ 36 tiếng Việt rộng hơn hẳn -> tràn ra ngoài hộp. Vẽ lại hộp vừa chữ.
  function redesignGoalBox(state) {
    var game = state.game;
    var hop = null, logo = null;
    game.world.children.forEach(function (c) {
      if (c.frameName === 'goalBack.png') hop = c;
      if (c.frameName === 'goldMiner.png') logo = c;   // logo tựa game, không phải nhân vật
    });
    if (!hop) return;

    // Màn thắng/thua gắn chữ vào trong hộp, màn mục tiêu thì thả ra world.
    var chu = [];
    if (hop.children && hop.children.length) {
      hop.children.forEach(function (c) {
        if (typeof c.text === 'string' && c.text.length) chu.push(c);
      });
    } else {
      game.world.children.forEach(function (c) {
        if (typeof c.text === 'string' && c.text.length) chu.push(c);
      });
    }
    if (!chu.length) return;
    chu.forEach(function (t) { t.cacheAsBitmap = false; });

    var PAD_X = 48, PAD_Y = 34, GAP = 12;
    var rong = 0, cao = 0;
    chu.forEach(function (t) {
      if (t.width > rong) rong = t.width;
      cao += t.height;
    });
    cao += GAP * (chu.length - 1);

    var W = Math.ceil(rong + PAD_X * 2);
    var H = Math.ceil(cao + PAD_Y * 2);
    hop.loadTexture(veNenBang(game, W, H));

    // Xếp chữ vào giữa hộp (hộp anchor giữa nên toạ độ con tính từ tâm).
    var y = -cao / 2;
    chu.forEach(function (t) {
      if (t.parent === hop) {
        t.x = -t.width / 2;
        t.y = y;
      } else {
        t.x = hop.x - t.width / 2;
        t.y = hop.y - cao / 2 + (y + cao / 2);
      }
      y += t.height + GAP;
    });

    // Logo nằm hẳn phía trên hộp. Bản gốc tính vị trí theo chiều cao hộp cũ
    // (cách 39px); hộp mới cao hơn nên phải tính lại từ mép trên thật.
    var CACH_LOGO = 22;
    if (logo && logo.game) {
      logo.y = Math.round(hop.y - H / 2 - CACH_LOGO - logo.height / 2);
    }
  }

  function redesignControlPanel(state) {
    var game = state.game;
    var panel = null;
    game.world.children.forEach(function (c) {
      if (c.frameName === 'goalBack.png') panel = c;
    });
    // Thứ tự con do MainMenu.create tạo ra: tiêu đề, rồi từng cột
    // (biểu tượng, nhãn, chữ thao tác).
    if (!panel || !panel.children || panel.children.length !== 7) return;

    var k = panel.children;
    var tieuDe = k[0], bt1 = k[1], nhan1 = k[2], tt1 = k[3],
        bt2 = k[4], nhan2 = k[5], tt2 = k[6];
    var chuList = [tieuDe, nhan1, tt1, nhan2, tt2];

    // Phải bỏ cache thì đổi màu chữ mới có tác dụng.
    chuList.forEach(function (t) { t.cacheAsBitmap = false; });
    tieuDe.tint = 0xffd45e;
    nhan1.tint = nhan2.tint = 0xf3e3c6;
    tt1.tint = tt2.tint = 0xffb02e;

    // Nhãn cỡ 22 làm bảng rộng 332, lấn sang thợ mỏ ở khổ 4:3. Hạ về 20 thì
    // bảng còn hẹp hơn bản gốc mà khoảng cách giữa hai cột vẫn rộng gấp rưỡi.
    nhan1.fontSize = nhan2.fontSize = 20;
    nhan1.updateText();
    nhan2.updateText();

    var P = PANEL;
    var rongCot1 = Math.max(nhan1.width, tt1.width, bt1.width);
    var rongCot2 = Math.max(nhan2.width, tt2.width, bt2.width);
    var caoTieuDe = tieuDe.height;
    var caoNhan = Math.max(nhan1.height, nhan2.height);
    var caoBt = Math.max(bt1.height, bt2.height);
    var caoTt = Math.max(tt1.height, tt2.height);

    var W = P.pad * 2 + rongCot1 + P.gapCot + rongCot2;
    var H = P.pad + caoTieuDe + P.gapTieuDe + caoNhan + P.gapNhan +
            caoBt + P.gapThaoTac + caoTt + P.pad;

    var tam1 = P.pad + rongCot1 / 2;
    var tam2 = P.pad + rongCot1 + P.gapCot + rongCot2 / 2;
    var yNhan = P.pad + caoTieuDe + P.gapTieuDe;
    var yBtTam = yNhan + caoNhan + P.gapNhan + caoBt / 2;
    var yTt = yBtTam + caoBt / 2 + P.gapThaoTac;

    tieuDe.x = (W - tieuDe.width) / 2; tieuDe.y = P.pad;
    nhan1.x = tam1 - nhan1.width / 2;  nhan1.y = yNhan;
    nhan2.x = tam2 - nhan2.width / 2;  nhan2.y = yNhan;
    tt1.x = tam1 - tt1.width / 2;      tt1.y = yTt;
    tt2.x = tam2 - tt2.width / 2;      tt2.y = yTt;
    bt1.x = tam1; bt1.y = yBtTam;      // hai biểu tượng đều anchor giữa theo trục Y
    bt2.x = tam2; bt2.y = yBtTam;

    panel.loadTexture(veNenBang(game, W, H));

    // Giữ bảng sát mép trái như bản gốc (đẩy sang phải sẽ lấn vào thợ mỏ), và
    // dời nút loa lên phía trên bảng - bản gốc để chúng chồng lên nhau ở góc.
    panel.x = 20;
    panel.y = Math.round(DESIGN_H - H - 14);

    game.world.children.forEach(function (c) {
      if (c.frameName === 'soundOn.png' || c.frameName === 'soundOff.png') {
        c.x = 14;
        c.y = Math.round(panel.y - c.height - 12);
      }
    });

    tranhChongNutChoi(game, panel);
    return panel;
  }

  // Bảng cao hơn bản gốc nên đụng đáy nút "Chơi"; đẩy cả cụm nút và quầng sáng
  // lên vừa đủ để hở ra, phần trên màn hình vẫn còn trống.
  function tranhChongNutChoi(game, panel) {
    var nut = null, quang = null;
    game.world.children.forEach(function (c) {
      if (c.frameName === 'menuGlow.png') quang = c;
      if (c.animations && c.animations.currentAnim &&
          c.animations.currentAnim.name === 'gold') nut = c;
    });
    if (!nut) return;
    var thua = (nut.y + nut.height) - (panel.y - 10);
    if (thua <= 0) return;
    var day = Math.min(thua, nut.y - 12);   // chừa 12px sát mép trên
    if (day <= 0) return;
    nut.y -= day;
    if (quang) quang.y -= day;
  }

  /* --- Cửa hàng trên thiết bị cảm ứng ------------------------------------- */

  // Bản gốc gắn mô tả vào onInputOver (rê chuột) và mua vào onInputDown. Trên
  // cảm ứng không có trạng thái "rê" nên vừa không đọc được mô tả, vừa nguy
  // hiểm: chạm một cái là trừ tiền ngay. Đổi thành hai nhịp: chạm lần 1 xem
  // mô tả, chạm lần 2 mới mua.
  /* --- Bảng tiền trong cửa hàng ------------------------------------------- */

  // Bản gốc chỉ hiện giá từng món, không hiện người chơi đang có bao nhiêu,
  // nên không thể cân nhắc mua gì. Tệ hơn: buyItem() trừ tiền mà KHÔNG kiểm
  // tra đủ hay không, mua quá tay là số dư âm.
  var TIEN_X = 20, TIEN_Y = 18;

  function themBangTien(state) {
    var game = state.game;

    var tien = game.make.bitmapText(TIEN_X, TIEN_Y, 'font', '', 26);
    tien.tint = 0x9be15d;                      // xanh lá như chữ tiền trong game
    game.add.existing(tien);

    var conLai = game.make.bitmapText(TIEN_X, TIEN_Y + 32, 'font', '', 20);
    conLai.tint = 0xf3e3c6;
    game.add.existing(conLai);

    state.__mlTien = tien;
    state.__mlConLai = conLai;

    registerAnchor(tien);
    registerAnchor(conLai);
    capNhatTien(state);
  }

  function capNhatTien(state) {
    if (!state.__mlTien || !state.__mlTien.game) return;
    var co = (window.Game && Game.currentMoney) || 0;
    state.__mlTien.text = 'Tiền: $' + co;
    state.__mlTien.updateText();
    state.__mlTien.tint = co < 0 ? 0xff6b6b : 0x9be15d;
    if (state.__mlConLai && state.__mlConLai.game) {
      state.__mlConLai.text = '';
      state.__mlConLai.updateText();
    }
    lamMoMonKhongDuTien(state);
  }

  function hienConLai(state, btn) {
    var t = state.__mlConLai;
    if (!t || !t.game || !btn || typeof btn.price !== 'number') return;
    var con = ((window.Game && Game.currentMoney) || 0) - btn.price;
    if (con >= 0) {
      t.text = 'Mua món này còn: $' + con;
      t.tint = 0xf3e3c6;
    } else {
      t.text = 'Không đủ tiền, thiếu $' + (-con);
      t.tint = 0xff6b6b;
    }
    t.updateText();
  }

  // Món không mua nổi thì làm mờ đi cho dễ nhìn.
  function lamMoMonKhongDuTien(state) {
    var co = (window.Game && Game.currentMoney) || 0;
    (state.btns || []).forEach(function (b) {
      if (!b || !b.game || !b.alive) return;
      b.alpha = (b.price > co) ? 0.45 : 1;
    });
  }

  function patchShopForTouch() {
    if (!window.Shop || !Shop.prototype) return;
    var origCreate = Shop.prototype.create;
    var origShowDescript = Shop.prototype.showDescript;
    var origBuyItem = Shop.prototype.buyItem;

    Shop.prototype.showDescript = function (btn) {
      origShowDescript.call(this, btn);
      hienConLai(this, btn);
      if (!prefersTouchUI()) return;
      var d = this.descript;
      if (!d) return;
      d.text = d.text + '\n(Chạm lần nữa để mua)';
      d.updateText();
      repositionDescript(this);
    };

    Shop.prototype.buyItem = function () {
      var kq = origBuyItem.apply(this, arguments);
      capNhatTien(this);                       // số dư đổi thì cập nhật ngay
      return kq;
    };

    Shop.prototype.create = function () {
      origCreate.call(this);

      // Bảng tiền áp dụng cho cả máy tính lẫn di động.
      themBangTien(this);
      applyLayout();

      if (!prefersTouchUI()) return;
      var state = this;

      // Mô tả thuốc nổ bảo "ấn mũi tên lên" - đúng với bàn phím, sai trên
      // di động vì ở đó thao tác là chạm nút thuốc nổ.
      if (state.descriptions && state.descriptions.length) {
        state.descriptions[0] = 'Khi móc đang kéo một vật nặng, chạm\n' +
                                'nút thuốc nổ để phá vật đó và\n' +
                                'kéo móc lên nhanh hơn.';
      }

      state.__mlChon = null;
      (state.btns || []).forEach(function (btn) {
        if (!btn || !btn.onInputDown) return;
        btn.onInputDown.removeAll();
        btn.onInputDown.add(function (b) {
          if (state.__mlChon !== b.name) {
            state.__mlChon = b.name;
            state.showDescript(b);
          } else {
            state.__mlChon = null;
            state.buyItem(b);
          }
        });
      });
    };
  }

  // Bóng thoại của ông chủ chỉ chứa được ~49px chữ (vùng trắng kết thúc ở y=205
  // trong khi chữ bắt đầu ở y=156), vừa đúng 2 dòng cỡ 20 của bản gốc. Thêm
  // dòng thứ ba là tràn ra ngoài, nên gợi ý phải nằm ở phần mô tả món hàng.
  //
  // Nhưng showDescript() gốc đặt chữ bằng công thức y = -height với anchor
  // giữa, tức MÉP DƯỚI cố định còn mép trên chạy lên theo số dòng - thêm dòng
  // thứ tư là tràn khỏi mặt bàn. Thay bằng quy tắc giữ MÉP TRÊN cố định đúng
  // chỗ bản gốc, chữ dài thêm thì nở xuống dưới, nơi mặt bàn còn trống.
  var DESC_TOP_TU_DAY_BAN = 26;   // chừa dải mặt bàn phía trên

  function repositionDescript(state) {
    var d = state.descript;
    if (!d || !d.parent) return;
    var topLocal = -(d.parent.height - DESC_TOP_TU_DAY_BAN);
    d.anchor.set(0.5, 0.5);
    d.y = topLocal + d.height / 2;
  }

  function patchStates() {
    if (window.FadeInOut && FadeInOut.prototype) {
      // Lớp phủ chuyển cảnh phải trùm cả phần màn hình rộng ra ngoài khung 640.
      FadeInOut.prototype.createBkg = function () {
        this.spr_bg = this.game.make.graphics(0, 0);
        this.spr_bg.beginFill(this.fadeColor, 1);
        this.spr_bg.drawRect(view.left - 100, view.top - 100,
                             view.width + 200, view.height + 200);
        this.spr_bg.endFill();
      };
    }

    if (window.Game && Game.prototype) {
      var origCreate = Game.prototype.create;
      Game.prototype.create = function () {
        refs = newRefs();
        origCreate.call(this);
        captureBackdrop(this.game);
        enlargeTouchTargets(this.game);
        applyLayout();
        requestWakeLock();
      };

      var origUpdate = Game.prototype.update;
      Game.prototype.update = function () {
        origUpdate.apply(this, arguments);
        syncDynamiteButton(this);
      };

      // Rung nhẹ đúng lúc móc thật sự được thả, không rung khi chạm vô hiệu.
      var origClick = Game.prototype.onMouseClick;
      Game.prototype.onMouseClick = function () {
        if (this.pod && this.pod.podStatus === 'rotate') vibrate(8);
        return origClick.apply(this, arguments);
      };

      var origCreateUI = Game.prototype.createUI;
      Game.prototype.createUI = function () {
        var self = this;
        var before = this.game.world.children.slice();
        origCreateUI.call(this);
        eachNewChild(this.game, before, function (child) {
          if (child === self.addScoreTxt) return;   // bám theo móc, không neo mép
          if (window.Phaser && child instanceof Phaser.Group) {
            for (var i = 0; i < child.children.length; i++) {
              registerAnchor(child.children[i]);
            }
            return;
          }
          registerAnchor(child);
        });
        nudgeLeftColumn();
        applyLayout();
      };
    }

    if (window.MainMenu && MainMenu.prototype) {
      var origMenu = MainMenu.prototype.create;
      MainMenu.prototype.create = function () {
        refs = newRefs();
        var before = this.game.world.children.slice();
        origMenu.call(this);
        // phải chạy trước khi ghi nhận neo mép
        var bangDieuKhien = redesignControlPanel(this);
        eachNewChild(this.game, before, function (child) {
          // Chỉ dàn ra mép những thứ vốn nằm ở rìa: thợ mỏ (phải), bảng hướng
          // dẫn và nút loa (trái). Cụm nút "Chơi" giữ nguyên chỗ cũ, nếu không
          // trên màn hình rộng nó bị đẩy sát mép trái và giữa màn trống hoác.
          // Bảng và nút loa nay nằm cao hơn 300 nên phải nêu đích danh.
          var laNutLoa = /^soundO/.test(child.frameName || '');
          if (child === bangDieuKhien || laNutLoa ||
              child.x >= DESIGN_W / 2 || child.y >= 300) {
            registerAnchor(child);
          }
        });
        enlargeTouchTargets(this.game);
        applyLayout();
      };
    }

    patchShopForTouch();

    if (window.Goal && Goal.prototype) {
      var origGoalCreate = Goal.prototype.create;
      Goal.prototype.create = function () {
        origGoalCreate.call(this);
        redesignGoalBox(this);
      };
    }

    if (window.ScaleManager) {
      ScaleManager.SizeCalculation = sizeCalculation;
      ScaleManager.checkOrientation = updateOrientation;
      ScaleManager.enterIncorrectOrientation = updateOrientation;
      ScaleManager.leaveIncorrectOrientation = updateOrientation;
    }
  }

  function eachNewChild(game, before, fn) {
    var kids = game.world.children;
    for (var i = 0; i < kids.length; i++) {
      var child = kids[i];
      if (before.indexOf(child) >= 0) continue;
      // Graphics ở đây luôn là lớp phủ toàn màn hình (fade), không neo mép.
      if (window.Phaser && child instanceof Phaser.Graphics) continue;
      fn(child);
    }
  }

  function captureBackdrop(game) {
    var kids = game.world.children;
    for (var i = 0; i < kids.length; i++) {
      var k = kids[i];
      if (!refs.bg && typeof k.key === 'string' && /\.jpg$/i.test(k.key)) {
        k.__mly = k.y;
        refs.bg = k;
        continue;
      }
      if (!refs.panel && k.x === 0 && k.y === 0 && Math.round(k.height) === 71) {
        refs.panel = k;
        continue;
      }
      // Game vẽ sẵn hai "vách đá" che phần ngoài khung 640 cùng hai đường viền
      // dọc. Chúng phải chạy ra mép màn hình thật, nếu không sẽ thành hai cột
      // tối lơ lửng giữa nền hầm mỏ đã kéo rộng.
      if (k.height >= 400 && (k.x === 0 || k.x === DESIGN_W)) {
        registerAnchor(k, false);
      }
    }
  }

  /* --- Khởi động ---------------------------------------------------------- */

  function onResize() {
    readSafeArea();
    updateOrientation();
    var game = getGame();
    if (game && game.scale) sizeCalculation.call(window.ScaleManager || {}, game);
  }

  /**
   * Xoay máy: iOS trả về kích thước CŨ ngay sau sự kiện orientationchange, có
   * khi tới vài trăm mili giây. Tính một lần rồi thôi là khoá luôn số sai cho
   * tới lần resize kế tiếp — mà lần đó có thể không bao giờ tới. Tính lại nhiều
   * mốc cho tới khi số liệu ổn định.
   */
  function tinhLaiSauKhiXoay() {
    [0, 150, 350, 700].forEach(function (tre) {
      setTimeout(onResize, tre);
    });
  }

  var resizeTimer = 0;
  function onResizeDebounced() {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(onResize, 120);
  }

  function whenGameReady(cb) {
    var tries = 0;
    (function poll() {
      var game = getGame();
      if (game) return cb(game);
      if (++tries > 200) return;          // ~10 giây rồi thôi
      setTimeout(poll, 50);
    })();
  }

  function install() {
    if (typeof window.ScaleManager === 'undefined') {
      console.warn('[mobile-layer] Không tìm thấy ScaleManager — bỏ qua các bản vá.');
      return;
    }

    readSafeArea();
    computeView();
    syncOverlayGeometry();
    probeWebp();
    patchAssetUrls();
    removeBrandingSplash();
    patchStates();
    blockThirdParty();
    setupHudButtons();
    updateOrientation();
    registerServiceWorker();

    xinKichThuocNhieuLan();

    window.addEventListener('resize', onResizeDebounced);
    window.addEventListener('orientationchange', function () {
      // Xoay máy thì kích thước cũ chắc chắn hết đúng: hỏi lại trang cha.
      xinKichThuocNhieuLan();
      tinhLaiSauKhiXoay();
    });

    // iframe đổi kích thước KHÔNG phải lúc nào cũng bắn 'resize' vào window bên
    // trong nó — trên iOS thường là không. ResizeObserver bắt được thay đổi
    // thật của hộp tài liệu nên không bỏ sót trường hợp nào.
    if (window.ResizeObserver) {
      try {
        new ResizeObserver(onResizeDebounced).observe(document.documentElement);
      } catch (e) { /* trình duyệt cũ */ }
    }

    // Thanh công cụ trình duyệt co/giãn làm đổi visualViewport mà không đổi
    // documentElement, nên phải nghe riêng.
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', onResizeDebounced);
    }

    whenGameReady(function (game) {
      hookAudioUnlock(game);
      updateOrientation();

      // Phaser giữ MỘT chế độ scale riêng cho lúc toàn màn hình:
      //   get currentScaleMode() { return isFullScreen ? _fullScreenScaleMode : _scaleMode }
      // Game chỉ đặt scaleMode = USER_SCALE, còn _fullScreenScaleMode vẫn là
      // NO_SCALE mặc định - nên vừa vào toàn màn hình là canvas rơi về kích
      // thước gốc và co lại giữa màn hình lớn.
      try {
        if (game.scale && window.Phaser && Phaser.ScaleManager) {
          game.scale.fullScreenScaleMode = Phaser.ScaleManager.USER_SCALE;
        }
      } catch (e) { /* bản Phaser khác */ }
      if (game.load && game.load.onFileComplete) {
        game.load.onFileComplete.add(function () {
          setLoadingProgress(game.load.progress);
        });
      }
      if (game.state && game.state.onStateChange) {
        game.state.onStateChange.add(function (newState) {
          refs = newRefs();
          updateHudForState(newState);
          if (!INTRO_STATES[newState]) hideLoading();
        });
      }
    });

    // Lưới an toàn: không để màn hình tải kẹt vĩnh viễn nếu asset lỗi.
    setTimeout(hideLoading, 20000);
  }

  // ranking.js gọi lại mỗi khi sidebar mở/đóng để canvas co giãn theo.
  window.dvcdTinhLaiKhung = onResize;
  window.dvcdInstall = install;

  // Đăng ký trước khi bundle gán window.onload, nên handler này chạy trước
  // lúc Phaser.Game được tạo — kịp thay ScaleManager.SizeCalculation.
  window.addEventListener('load', install);
})();
