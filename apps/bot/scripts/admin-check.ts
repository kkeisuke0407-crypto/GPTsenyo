import { renderAdminDashboard } from "../src/pages/admin";
import type { Stats } from "../src/db/stats";

const mock: Stats = {
  totalUsers: 1247,
  usersWithBirthdate: 1183,
  activeUsers30d: 842,
  payingUsers: { light: 87, standard: 32, premium: 8 },
  mrrJpy: 87 * 980 + 32 * 1980 + 8 * 4980,
  sessionsByType30d: {
    tarot: 1842,
    astrology: 712,
    numerology: 318,
    sizhu: 156,
    iching: 89,
  },
  sessionsLast14Days: Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.now() - (13 - i) * 86400000);
    return { date: d.toISOString().slice(0, 10), count: 80 + Math.floor(Math.random() * 120) };
  }),
};

const html = renderAdminDashboard(mock);
if (!html.includes("¥") || !html.includes("MRR")) throw new Error("admin page missing key labels");
if (!html.includes("セレネ 管理ダッシュボード")) throw new Error("title missing");
console.log(`OK admin: ${html.length} bytes`);
console.log(`mock MRR: ¥${mock.mrrJpy.toLocaleString()}`);
