import dayjs from 'dayjs';
import 'dayjs/locale/id';

dayjs.locale('id');

export const formatRupiah = (val: number): string => {
  const rounded = Math.round(val);
  return `Rp ${rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
};

export const formatRupiahNumberOnly = (val: number): string => {
  const rounded = Math.round(val);
  return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

export const formatDecimal = (val: number, maxDecimals: number = 2): string => {
  if (isNaN(val)) return '0';
  const factor = Math.pow(10, maxDecimals);
  const rounded = Math.round(val * factor) / factor;
  return rounded.toLocaleString('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  });
};

export const formatGram = (val: number): string => {
  return `${formatDecimal(val, 2)} gram`;
};

export const formatKg = (val: number): string => {
  return `${formatDecimal(val, 1)} kg`;
};

export const formatDateIndo = (dateStr?: string | null): string => {
  if (!dateStr) return '-';
  const d = dayjs(dateStr);
  if (!d.isValid()) return '-';
  return d.format('DD MMMM YYYY');
};

export const formatDateShort = (dateStr?: string | null): string => {
  if (!dateStr) return '-';
  const d = dayjs(dateStr);
  if (!d.isValid()) return '-';
  return d.format('DD/MM/YYYY');
};

/**
 * Menghitung selisih hari antara tanggal awal dan hari ini
 */
export const calculateDaysElapsed = (startDateStr: string): number => {
  const start = dayjs(startDateStr);
  const now = dayjs();
  if (!start.isValid()) return 0;
  const diff = now.diff(start, 'day');
  return Math.max(0, diff);
};

/**
 * Menghitung tanggal target haul
 */
export const calculateHaulTargetDate = (startDateStr: string, haulDays: number): string => {
  const start = dayjs(startDateStr);
  if (!start.isValid()) return dayjs().add(haulDays, 'day').format('YYYY-MM-DD');
  return start.add(haulDays, 'day').format('YYYY-MM-DD');
};
