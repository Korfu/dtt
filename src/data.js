export const HOURS = Array.from({ length: 15 }, (_, i) => 7 + i); // 7..21

export const DAY_NAMES_SHORT = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd'];
export const DAY_NAMES_FULL = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela'];
export const MONTH_NAMES = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'];

export function getWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday = 0
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getWeekDays(weekStart) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
}

export function toISODate(date) {
  return date.toISOString().slice(0, 10);
}

export function fmtHour(h) {
  return `${String(h).padStart(2, '0')}:00`;
}

export function fmtRange(h, dur = 1) {
  const endH = Math.floor(h + dur);
  const endM = (dur % 1) !== 0 ? 30 : 0;
  const end = `${String(endH).padStart(2, '0')}:${endM === 0 ? '00' : '30'}`;
  return `${fmtHour(h)} – ${end}`;
}

export function isToday(date) {
  const today = new Date();
  return date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();
}

export const USER_COLORS = [
  '#E07856', '#5B8FB9', '#7C9A6B', '#B58A4F', '#8A6BAA', '#C76A8E', '#4A8E8E', '#A06040',
];
