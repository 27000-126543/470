/**
 * local server entry file, for local development
 */
import cron from 'node-cron';
import app from './app.js';
import { readDB, writeDB, initDB } from './db.js';

const GIFT_SUGGESTIONS = [
  '精选茶叶礼盒',
  '健康保健品',
  '定制相册',
  '鲜花束',
  '购物卡',
  '书籍',
];

function formatDateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getNextBirthday(birthDate: string, now: Date): Date {
  const [by, bm, bd] = birthDate.split('-').map(Number);
  const currentYear = now.getFullYear();
  let nextBirthday = new Date(currentYear, bm - 1, bd);
  if (nextBirthday < now) {
    nextBirthday = new Date(currentYear + 1, bm - 1, bd);
  }
  return nextBirthday;
}

function checkBirthdayReminders() {
  try {
    initDB();
    const db = readDB();
    const now = new Date();
    const today = formatDateLocal(now);
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const isFirstOfMonth = now.getDate() === 1;

    const lastScan = db.lastBirthdayScanDate ? new Date(db.lastBirthdayScanDate) : null;
    const hasScannedThisMonth = lastScan &&
      lastScan.getMonth() === currentMonth &&
      lastScan.getFullYear() === currentYear;

    if (!lastScan || (isFirstOfMonth && !hasScannedThisMonth)) {
      const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const reminders = (db.members || [])
        .filter((m: any) => !m.deathDate)
        .map((m: any) => {
          const nextBirthday = getNextBirthday(m.birthDate, now);
          return { ...m, nextBirthday };
        })
        .filter((m: any) => m.nextBirthday >= now && m.nextBirthday <= sevenDaysLater)
        .map((m: any) => {
          const daysUntil = Math.ceil((m.nextBirthday.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
          const age = m.nextBirthday.getFullYear() - new Date(m.birthDate).getFullYear();
          return {
            memberId: m.id,
            memberName: m.name,
            birthDate: m.birthDate,
            nextBirthday: formatDateLocal(m.nextBirthday),
            daysUntil,
            age,
            giftSuggestions: GIFT_SUGGESTIONS,
            scanDate: today,
          };
        })
        .sort((a: any, b: any) => a.daysUntil - b.daysUntil);

      const persisted = reminders.filter((r: any) => {
        const d = new Date(r.nextBirthday);
        const diff = Math.ceil((d.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
        return diff >= -1;
      });

      db.birthdayReminders = persisted;
      db.lastBirthdayScanDate = today;
      writeDB(db);
      console.log(`[BirthdayScan] 生日提醒扫描完成，发现${persisted.length}条提醒`);
    } else {
      console.log('[BirthdayScan] 本月已完成生日提醒扫描，跳过');
    }
  } catch (error) {
    console.error('[BirthdayScan] 启动时扫描生日提醒失败:', error);
  }
}

/**
 * start server with port
 */
const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  console.log(`Server ready on port ${PORT}`);
  checkBirthdayReminders();

  const cronJob = cron.schedule('0 0 0 1 * *', () => {
    console.log(`[Cron] ${new Date().toISOString()} - 每月1日自动扫描生日提醒`);
    checkBirthdayReminders();
  }, {
    scheduled: true,
    timezone: 'Asia/Shanghai',
  });

  console.log('[Cron] 已启用每月1日0点自动扫描生日提醒任务');
});

/**
 * close server
 */
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
