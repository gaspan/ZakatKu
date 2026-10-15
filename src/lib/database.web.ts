import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';
import { Wallet, GoldItem, GoldItemWithWallet, ZakatHistoryItem } from '@/types';

export const DATABASE_NAME = 'zakatku_web';

const KEYS = {
  WALLETS: 'zakatku_web_wallets',
  GOLD_ITEMS: 'zakatku_web_gold_items',
  HISTORY: 'zakatku_web_history',
  INIT: 'zakatku_web_initialized',
};

export async function migrateDbIfNeeded(_db?: any): Promise<void> {
  const isInit = await AsyncStorage.getItem(KEYS.INIT);
  if (isInit === 'true') return;

  const defaultWallets: Wallet[] = [
    { id: 1, name: 'Brankas Rumah', description: 'Emas batangan fisik simpanan pribadi', icon: 'shield-checkmark-outline', color: '#059669', is_active: 1 },
    { id: 2, name: 'Pegadaian Tabungan Emas', description: 'Akun tabungan emas digital & konsinyasi', icon: 'card-outline', color: '#D97706', is_active: 1 },
    { id: 3, name: 'Antam Digital / Logam Mulia', description: 'Portfolio emas batangan bersertifikat LBMA', icon: 'cube-outline', color: '#10B981', is_active: 1 },
    { id: 4, name: 'Perhiasan Simpanan', description: 'Koleksi perhiasan emas bernilai investasi', icon: 'sparkles-outline', color: '#E11D48', is_active: 1 },
  ];

  const sampleDate1 = dayjs().subtract(370, 'day').format('YYYY-MM-DD');
  const sampleDate2 = dayjs().subtract(180, 'day').format('YYYY-MM-DD');
  const sampleDate3 = dayjs().subtract(45, 'day').format('YYYY-MM-DD');

  const defaultGoldItems: GoldItem[] = [
    { id: 1, wallet_id: 1, name: 'Antam CertiCard 50g', weight_gram: 50.0, purity: 24.0, purchase_date: sampleDate1, notes: 'Pembelian tahun lalu untuk simpanan haul' },
    { id: 2, wallet_id: 1, name: 'Emas Batangan 25g', weight_gram: 25.0, purity: 24.0, purchase_date: sampleDate1, notes: 'Hadiah investasi keluarga' },
    { id: 3, wallet_id: 2, name: 'Tabungan Saldo Emas', weight_gram: 15.5, purity: 24.0, purchase_date: sampleDate2, notes: 'Rutin nabung tiap awal bulan' },
    { id: 4, wallet_id: 3, name: 'Logam Mulia 10g', weight_gram: 10.0, purity: 24.0, purchase_date: sampleDate3, notes: 'Bonus tahunan' },
  ];

  await AsyncStorage.setItem(KEYS.WALLETS, JSON.stringify(defaultWallets));
  await AsyncStorage.setItem(KEYS.GOLD_ITEMS, JSON.stringify(defaultGoldItems));
  await AsyncStorage.setItem(KEYS.HISTORY, JSON.stringify([]));
  await AsyncStorage.setItem(KEYS.INIT, 'true');
}

// ─────────────────────────────────────────────────────────────────────────────
// CRUD for Wallets (Web)
// ─────────────────────────────────────────────────────────────────────────────

export async function getWallets(_db?: any): Promise<Wallet[]> {
  await migrateDbIfNeeded();
  const raw = await AsyncStorage.getItem(KEYS.WALLETS);
  return raw ? JSON.parse(raw) : [];
}

export async function addWallet(
  _db: any,
  wallet: Omit<Wallet, 'id' | 'created_at'>
): Promise<number> {
  const wallets = await getWallets();
  const newId = wallets.length > 0 ? Math.max(...wallets.map((w) => w.id)) + 1 : 1;
  const newWallet: Wallet = {
    ...wallet,
    id: newId,
    created_at: new Date().toISOString(),
  };
  wallets.push(newWallet);
  await AsyncStorage.setItem(KEYS.WALLETS, JSON.stringify(wallets));
  return newId;
}

export async function updateWallet(
  _db: any,
  id: number,
  updates: Partial<Wallet>
): Promise<void> {
  const wallets = await getWallets();
  const idx = wallets.findIndex((w) => w.id === id);
  if (idx !== -1) {
    wallets[idx] = { ...wallets[idx], ...updates };
    await AsyncStorage.setItem(KEYS.WALLETS, JSON.stringify(wallets));
  }
}

export async function deleteWallet(_db: any, id: number): Promise<void> {
  const wallets = await getWallets();
  const filtered = wallets.filter((w) => w.id !== id);
  await AsyncStorage.setItem(KEYS.WALLETS, JSON.stringify(filtered));

  // Also delete associated gold items
  const items = await getGoldItems();
  const filteredItems = items.filter((it) => it.wallet_id !== id);
  await AsyncStorage.setItem(KEYS.GOLD_ITEMS, JSON.stringify(filteredItems));
}

export async function toggleWalletActive(
  _db: any,
  id: number,
  isActive: boolean
): Promise<void> {
  await updateWallet(_db, id, { is_active: isActive ? 1 : 0 });
}

// ─────────────────────────────────────────────────────────────────────────────
// CRUD for Gold Items (Web)
// ─────────────────────────────────────────────────────────────────────────────

export async function getGoldItems(
  _db?: any,
  walletId?: number
): Promise<GoldItemWithWallet[]> {
  await migrateDbIfNeeded();
  const [itemsRaw, walletsRaw] = await Promise.all([
    AsyncStorage.getItem(KEYS.GOLD_ITEMS),
    AsyncStorage.getItem(KEYS.WALLETS),
  ]);

  const items: GoldItem[] = itemsRaw ? JSON.parse(itemsRaw) : [];
  const wallets: Wallet[] = walletsRaw ? JSON.parse(walletsRaw) : [];
  const walletMap = new Map(wallets.map((w) => [w.id, w]));

  const enriched: GoldItemWithWallet[] = items.map((it) => {
    const w = walletMap.get(it.wallet_id);
    return {
      ...it,
      wallet_name: w?.name,
      wallet_color: w?.color,
      wallet_icon: w?.icon,
    };
  });

  if (walletId) {
    return enriched.filter((it) => it.wallet_id === walletId);
  }
  return enriched;
}

export async function addGoldItem(
  _db: any,
  item: Omit<GoldItem, 'id' | 'created_at'>
): Promise<number> {
  const itemsRaw = await AsyncStorage.getItem(KEYS.GOLD_ITEMS);
  const items: GoldItem[] = itemsRaw ? JSON.parse(itemsRaw) : [];
  const newId = items.length > 0 ? Math.max(...items.map((i) => i.id)) + 1 : 1;

  const newItem: GoldItem = {
    ...item,
    id: newId,
    created_at: new Date().toISOString(),
  };
  items.push(newItem);
  await AsyncStorage.setItem(KEYS.GOLD_ITEMS, JSON.stringify(items));
  return newId;
}

export async function updateGoldItem(
  _db: any,
  id: number,
  updates: Partial<GoldItem>
): Promise<void> {
  const itemsRaw = await AsyncStorage.getItem(KEYS.GOLD_ITEMS);
  const items: GoldItem[] = itemsRaw ? JSON.parse(itemsRaw) : [];
  const idx = items.findIndex((i) => i.id === id);
  if (idx !== -1) {
    items[idx] = { ...items[idx], ...updates };
    await AsyncStorage.setItem(KEYS.GOLD_ITEMS, JSON.stringify(items));
  }
}

export async function deleteGoldItem(_db: any, id: number): Promise<void> {
  const itemsRaw = await AsyncStorage.getItem(KEYS.GOLD_ITEMS);
  const items: GoldItem[] = itemsRaw ? JSON.parse(itemsRaw) : [];
  const filtered = items.filter((i) => i.id !== id);
  await AsyncStorage.setItem(KEYS.GOLD_ITEMS, JSON.stringify(filtered));
}

// ─────────────────────────────────────────────────────────────────────────────
// CRUD for Zakat History (Web)
// ─────────────────────────────────────────────────────────────────────────────

export async function getZakatHistory(
  _db?: any,
  type?: 'emas' | 'padi'
): Promise<ZakatHistoryItem[]> {
  await migrateDbIfNeeded();
  const raw = await AsyncStorage.getItem(KEYS.HISTORY);
  const list: ZakatHistoryItem[] = raw ? JSON.parse(raw) : [];
  list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (type) {
    return list.filter((it) => it.type === type);
  }
  return list;
}

export async function addZakatHistory(
  _db: any,
  item: Omit<ZakatHistoryItem, 'id' | 'created_at'>
): Promise<number> {
  const list = await getZakatHistory();
  const newId = list.length > 0 ? Math.max(...list.map((i) => i.id)) + 1 : 1;
  const newItem: ZakatHistoryItem = {
    ...item,
    id: newId,
    created_at: new Date().toISOString(),
  };
  list.unshift(newItem);
  await AsyncStorage.setItem(KEYS.HISTORY, JSON.stringify(list));
  return newId;
}

export async function deleteZakatHistory(_db: any, id: number): Promise<void> {
  const list = await getZakatHistory();
  const filtered = list.filter((i) => i.id !== id);
  await AsyncStorage.setItem(KEYS.HISTORY, JSON.stringify(filtered));
}

export async function clearAllZakatHistory(_db?: any): Promise<void> {
  await AsyncStorage.setItem(KEYS.HISTORY, JSON.stringify([]));
}
