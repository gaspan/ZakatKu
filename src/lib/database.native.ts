import { SQLiteDatabase } from 'expo-sqlite';
import dayjs from 'dayjs';
import { Wallet, GoldItem, GoldItemWithWallet, ZakatHistoryItem } from '@/types';

export const DATABASE_NAME = 'zakatku.db';
const DATABASE_VERSION = 1;

export async function migrateDbIfNeeded(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA busy_timeout = 5000');
  await db.getFirstAsync('PRAGMA journal_mode = WAL');
  await db.execAsync('PRAGMA foreign_keys = ON');

  let { user_version: currentDbVersion } = (await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  )) ?? { user_version: 0 };

  if (currentDbVersion >= DATABASE_VERSION) {
    return;
  }

  if (currentDbVersion === 0) {
    await db.withTransactionAsync(async () => {
      // 1. Wallets table
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS wallets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          icon TEXT NOT NULL DEFAULT 'wallet-outline',
          color TEXT NOT NULL DEFAULT '#059669',
          is_active INTEGER NOT NULL DEFAULT 1,
          created_at TEXT DEFAULT (datetime('now'))
        );
      `);

      // 2. Gold Items table
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS gold_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          wallet_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          weight_gram REAL NOT NULL,
          purity REAL NOT NULL DEFAULT 24,
          purchase_date TEXT NOT NULL,
          notes TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE
        );
      `);

      // 3. Zakat History table
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS zakat_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          type TEXT NOT NULL CHECK(type IN ('emas', 'padi')),
          title TEXT NOT NULL,
          total_weight REAL NOT NULL,
          nishab_threshold REAL NOT NULL,
          is_wajib INTEGER NOT NULL DEFAULT 0,
          zakat_rate REAL NOT NULL,
          zakat_amount_display TEXT NOT NULL,
          zakat_amount_money REAL NOT NULL,
          price_per_unit REAL NOT NULL,
          irrigation_type TEXT,
          haul_date TEXT,
          details_json TEXT,
          notes TEXT,
          created_at TEXT DEFAULT (datetime('now'))
        );
      `);

      // Seed initial wallets if empty
      const walletCount = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM wallets'
      );

      if (!walletCount || walletCount.count === 0) {
        await db.runAsync(
          `INSERT INTO wallets (name, description, icon, color, is_active) VALUES
           ('Brankas Rumah', 'Emas batangan fisik simpanan pribadi', 'shield-checkmark-outline', '#059669', 1),
           ('Pegadaian Tabungan Emas', 'Akun tabungan emas digital & konsinyasi', 'card-outline', '#D97706', 1),
           ('Antam Digital / Logam Mulia', 'Portfolio emas batangan bersertifikat LBMA', 'cube-outline', '#10B981', 1),
           ('Perhiasan Simpanan', 'Koleksi perhiasan emas bernilai investasi', 'sparkles-outline', '#E11D48', 1);`
        );

        // Seed sample gold items for a rich first experience
        const sampleDate1 = dayjs().subtract(370, 'day').format('YYYY-MM-DD'); // Past haul
        const sampleDate2 = dayjs().subtract(180, 'day').format('YYYY-MM-DD'); // Mid haul
        const sampleDate3 = dayjs().subtract(45, 'day').format('YYYY-MM-DD');  // Recent

        await db.runAsync(
          `INSERT INTO gold_items (wallet_id, name, weight_gram, purity, purchase_date, notes) VALUES
           (1, 'Antam CertiCard 50g', 50.0, 24.0, '${sampleDate1}', 'Pembelian tahun lalu untuk simpanan haul'),
           (1, 'Emas Batangan 25g', 25.0, 24.0, '${sampleDate1}', 'Hadiah investasi keluarga'),
           (2, 'Tabungan Saldo Emas', 15.5, 24.0, '${sampleDate2}', 'Rutin nabung tiap awal bulan'),
           (3, 'Logam Mulia 10g', 10.0, 24.0, '${sampleDate3}', 'Bonus tahunan');`
        );
      }

      await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CRUD for Wallets
// ─────────────────────────────────────────────────────────────────────────────

export async function getWallets(db: SQLiteDatabase): Promise<Wallet[]> {
  return await db.getAllAsync<Wallet>('SELECT * FROM wallets ORDER BY id ASC');
}

export async function addWallet(
  db: SQLiteDatabase,
  wallet: Omit<Wallet, 'id' | 'created_at'>
): Promise<number> {
  const result = await db.runAsync(
    'INSERT INTO wallets (name, description, icon, color, is_active) VALUES (?, ?, ?, ?, ?)',
    [wallet.name, wallet.description || '', wallet.icon, wallet.color, wallet.is_active ? 1 : 0]
  );
  return result.lastInsertRowId;
}

export async function updateWallet(
  db: SQLiteDatabase,
  id: number,
  wallet: Partial<Wallet>
): Promise<void> {
  const fields: string[] = [];
  const values: any[] = [];

  if (wallet.name !== undefined) { fields.push('name = ?'); values.push(wallet.name); }
  if (wallet.description !== undefined) { fields.push('description = ?'); values.push(wallet.description); }
  if (wallet.icon !== undefined) { fields.push('icon = ?'); values.push(wallet.icon); }
  if (wallet.color !== undefined) { fields.push('color = ?'); values.push(wallet.color); }
  if (wallet.is_active !== undefined) { fields.push('is_active = ?'); values.push(wallet.is_active ? 1 : 0); }

  if (fields.length === 0) return;
  values.push(id);
  await db.runAsync(`UPDATE wallets SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function deleteWallet(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM wallets WHERE id = ?', [id]);
}

export async function toggleWalletActive(
  db: SQLiteDatabase,
  id: number,
  isActive: boolean
): Promise<void> {
  await db.runAsync('UPDATE wallets SET is_active = ? WHERE id = ?', [isActive ? 1 : 0, id]);
}

// ─────────────────────────────────────────────────────────────────────────────
// CRUD for Gold Items
// ─────────────────────────────────────────────────────────────────────────────

export async function getGoldItems(
  db: SQLiteDatabase,
  walletId?: number
): Promise<GoldItemWithWallet[]> {
  if (walletId) {
    return await db.getAllAsync<GoldItemWithWallet>(
      `SELECT g.*, w.name as wallet_name, w.color as wallet_color, w.icon as wallet_icon
       FROM gold_items g
       JOIN wallets w ON g.wallet_id = w.id
       WHERE g.wallet_id = ?
       ORDER BY g.purchase_date ASC, g.id DESC`,
      [walletId]
    );
  }
  return await db.getAllAsync<GoldItemWithWallet>(
    `SELECT g.*, w.name as wallet_name, w.color as wallet_color, w.icon as wallet_icon
     FROM gold_items g
     JOIN wallets w ON g.wallet_id = w.id
     ORDER BY g.purchase_date ASC, g.id DESC`
  );
}

export async function addGoldItem(
  db: SQLiteDatabase,
  item: Omit<GoldItem, 'id' | 'created_at'>
): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO gold_items (wallet_id, name, weight_gram, purity, purchase_date, notes)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [item.wallet_id, item.name, item.weight_gram, item.purity, item.purchase_date, item.notes || '']
  );
  return result.lastInsertRowId;
}

export async function updateGoldItem(
  db: SQLiteDatabase,
  id: number,
  item: Partial<GoldItem>
): Promise<void> {
  const fields: string[] = [];
  const values: any[] = [];

  if (item.wallet_id !== undefined) { fields.push('wallet_id = ?'); values.push(item.wallet_id); }
  if (item.name !== undefined) { fields.push('name = ?'); values.push(item.name); }
  if (item.weight_gram !== undefined) { fields.push('weight_gram = ?'); values.push(item.weight_gram); }
  if (item.purity !== undefined) { fields.push('purity = ?'); values.push(item.purity); }
  if (item.purchase_date !== undefined) { fields.push('purchase_date = ?'); values.push(item.purchase_date); }
  if (item.notes !== undefined) { fields.push('notes = ?'); values.push(item.notes); }

  if (fields.length === 0) return;
  values.push(id);
  await db.runAsync(`UPDATE gold_items SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function deleteGoldItem(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM gold_items WHERE id = ?', [id]);
}

// ─────────────────────────────────────────────────────────────────────────────
// CRUD for Zakat History
// ─────────────────────────────────────────────────────────────────────────────

export async function getZakatHistory(
  db: SQLiteDatabase,
  type?: 'emas' | 'padi'
): Promise<ZakatHistoryItem[]> {
  if (type) {
    return await db.getAllAsync<ZakatHistoryItem>(
      'SELECT * FROM zakat_history WHERE type = ? ORDER BY created_at DESC, id DESC',
      [type]
    );
  }
  return await db.getAllAsync<ZakatHistoryItem>(
    'SELECT * FROM zakat_history ORDER BY created_at DESC, id DESC'
  );
}

export async function addZakatHistory(
  db: SQLiteDatabase,
  item: Omit<ZakatHistoryItem, 'id' | 'created_at'>
): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO zakat_history 
     (type, title, total_weight, nishab_threshold, is_wajib, zakat_rate, zakat_amount_display, zakat_amount_money, price_per_unit, irrigation_type, haul_date, details_json, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      item.type,
      item.title,
      item.total_weight,
      item.nishab_threshold,
      item.is_wajib,
      item.zakat_rate,
      item.zakat_amount_display,
      item.zakat_amount_money,
      item.price_per_unit,
      item.irrigation_type || null,
      item.haul_date || null,
      item.details_json || null,
      item.notes || '',
    ]
  );
  return result.lastInsertRowId;
}

export async function deleteZakatHistory(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM zakat_history WHERE id = ?', [id]);
}

export async function clearAllZakatHistory(db: SQLiteDatabase): Promise<void> {
  await db.runAsync('DELETE FROM zakat_history');
}
