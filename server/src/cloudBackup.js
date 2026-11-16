import fs from 'node:fs';
import path from 'node:path';

let lastSha = null;
let lastBackupMtime = 0;
let isBackingUp = false;

const GITHUB_REPO = process.env.GITHUB_REPO || 'auuoq/iuiu';
const BACKUP_BRANCH = process.env.BACKUP_BRANCH || 'data-storage';
const BACKUP_FILE = 'lovecapsule_data.db';

export async function restoreDatabaseFromCloud(dbFilePath) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.log('ℹ️ [CloudBackup] GITHUB_TOKEN chưa được cấu hình. Dữ liệu sẽ lưu ở ổ đĩa cục bộ.');
    return false;
  }

  console.log(`🔄 [CloudBackup] Đang kiểm tra bản sao lưu từ GitHub repo: ${GITHUB_REPO} (nhánh ${BACKUP_BRANCH})...`);
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${BACKUP_FILE}?ref=${BACKUP_BRANCH}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'LoveCapsule-AutoBackup'
      }
    });

    if (res.status === 200) {
      const data = await res.json();
      lastSha = data.sha;
      const buffer = Buffer.from(data.content.replace(/\n/g, ''), 'base64');

      const dir = path.dirname(dbFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(dbFilePath, buffer);
      const stat = fs.statSync(dbFilePath);
      lastBackupMtime = stat.mtimeMs;
      console.log(`✅ [CloudBackup] KHÔI PHỤC THÀNH CÔNG! Đã nạp lại cơ sở dữ liệu (${buffer.length} bytes) từ GitHub!`);
      return true;
    } else if (res.status === 404) {
      console.log('ℹ️ [CloudBackup] Chưa có bản sao lưu trên GitHub. Sẽ tự động tạo sau lần ghi dữ liệu đầu tiên.');
      return false;
    } else {
      const err = await res.text();
      console.error(`⚠️ [CloudBackup] Không thể tải bản sao lưu (HTTP ${res.status}):`, err);
      return false;
    }
  } catch (e) {
    console.error('⚠️ [CloudBackup] Lỗi khi kết nối GitHub API để khôi phục DB:', e.message);
    return false;
  }
}

export async function backupDatabaseToCloud(dbFilePath) {
  const token = process.env.GITHUB_TOKEN;
  if (!token || isBackingUp) return false;
  if (!fs.existsSync(dbFilePath)) return false;

  const stat = fs.statSync(dbFilePath);
  if (stat.mtimeMs <= lastBackupMtime && lastSha) {
    return false; // Chưa có thay đổi mới
  }

  isBackingUp = true;
  try {
    const buffer = fs.readFileSync(dbFilePath);
    const contentBase64 = buffer.toString('base64');

    // Nếu chưa có SHA, thử lấy SHA hiện tại của file trên GitHub
    if (!lastSha) {
      try {
        const getRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${BACKUP_FILE}?ref=${BACKUP_BRANCH}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'LoveCapsule-AutoBackup'
          }
        });
        if (getRes.status === 200) {
          const getData = await getRes.json();
          lastSha = getData.sha;
        }
      } catch (e) {}
    }

    const payload = {
      message: `💾 auto-save lovecapsule database [${new Date().toISOString()}] [skip ci]`,
      content: contentBase64,
      branch: BACKUP_BRANCH
    };
    if (lastSha) {
      payload.sha = lastSha;
    }

    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${BACKUP_FILE}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'LoveCapsule-AutoBackup'
      },
      body: JSON.stringify(payload)
    });

    if (res.status === 200 || res.status === 201) {
      const data = await res.json();
      lastSha = data.content?.sha || lastSha;
      lastBackupMtime = stat.mtimeMs;
      console.log(`☁️ [CloudBackup] ĐÃ ĐỒNG BỘ THÀNH CÔNG lên GitHub nhánh ${BACKUP_BRANCH} (${buffer.length} bytes)!`);
      return true;
    } else {
      const err = await res.text();
      console.error(`⚠️ [CloudBackup] Lỗi đồng bộ GitHub (HTTP ${res.status}):`, err);
      // Nếu lỗi SHA mismatch (409 Conflict), reset lastSha để lần sau lấy lại
      if (res.status === 409) {
        lastSha = null;
      }
      return false;
    }
  } catch (e) {
    console.error('⚠️ [CloudBackup] Lỗi sao lưu DB:', e.message);
    return false;
  } finally {
    isBackingUp = false;
  }
}

export function startAutoBackupLoop(dbFilePath, intervalMs = 15000) {
  if (!process.env.GITHUB_TOKEN) return;

  console.log(`⏱️ [CloudBackup] Đã kích hoạt vòng lặp tự động đồng bộ (mỗi ${intervalMs / 1000}s kiểm tra 1 lần).`);
  setInterval(() => {
    backupDatabaseToCloud(dbFilePath).catch(() => {});
  }, intervalMs);

  const cleanup = () => {
    console.log('🛑 [CloudBackup] Đang sao lưu cơ sở dữ liệu trước khi dừng server...');
    backupDatabaseToCloud(dbFilePath).finally(() => {
      process.exit(0);
    });
  };

  process.on('SIGTERM', cleanup);
  process.on('SIGINT', cleanup);
}
