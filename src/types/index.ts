export type HaulSystem = 'hijri' | 'masehi';

export interface Wallet {
  id: number;
  name: string;
  description?: string;
  icon: string;
  color: string;
  is_active: number; // 1 = selected for zakat, 0 = excluded
  created_at?: string;
}

export interface GoldItem {
  id: number;
  wallet_id: number;
  name: string;
  weight_gram: number;
  purity: number; // e.g. 24 for 24K (99.9%), 22 for 22K (91.6%), etc.
  purchase_date: string; // ISO string 'YYYY-MM-DD'
  notes?: string;
  created_at?: string;
}

export interface GoldItemWithWallet extends GoldItem {
  wallet_name?: string;
  wallet_color?: string;
  wallet_icon?: string;
}

export interface GoldCalculationResult {
  total_weight_gram: number;
  equivalent_24k_gram: number;
  nishab_threshold_gram: number; // 85 gram
  is_nishab: boolean;
  progress_pct: number;
  haul_system: HaulSystem;
  haul_days_threshold: number; // 354 or 365
  days_elapsed: number;
  days_remaining: number;
  is_haul: boolean;
  earliest_purchase_date: string | null;
  target_haul_date: string | null;
  is_wajib_zakat: boolean;
  zakat_rate: number; // 0.025
  zakat_weight_gram: number;
  gold_price_per_gram: number;
  zakat_rupiah: number;
}

export type IrrigationType = 'tadah_hujan' | 'irigasi';
export type PriceBasis = 'gkg' | 'beras';

export interface PadiCalculationState {
  gkp_weight_kg: number;
  susut_kadar_air_pct: number; // default 85% (hasil GKG = GKP * susut)
  rendemen_giling_pct: number; // default 64% (hasil Beras = GKG * rendemen)
  irrigation_type: IrrigationType;
  price_basis: PriceBasis;
  price_per_kg: number;
}

export interface PadiCalculationResult {
  gkp_kg: number;
  gkg_kg: number;
  beras_kg: number;
  susut_pct: number;
  rendemen_pct: number;
  nishab_gkg_kg: number; // 653 kg
  nishab_beras_kg: number; // 520 kg
  is_nishab: boolean;
  progress_pct: number;
  irrigation_type: IrrigationType;
  zakat_rate: number; // 0.10 for tadah hujan, 0.05 for irigasi
  zakat_rate_display: string; // '10%' or '5%'
  zakat_gkg_kg: number;
  zakat_beras_kg: number;
  price_basis: PriceBasis;
  price_per_kg: number;
  zakat_rupiah: number;
}

export interface ZakatHistoryItem {
  id: number;
  type: 'emas' | 'padi';
  title: string;
  total_weight: number; // gram for emas, kg for padi
  nishab_threshold: number;
  is_wajib: number;
  zakat_rate: number;
  zakat_amount_display: string;
  zakat_amount_money: number;
  price_per_unit: number;
  irrigation_type?: IrrigationType;
  haul_date?: string;
  details_json?: string;
  notes?: string;
  created_at: string;
}

export interface AppSettings {
  haul_system: HaulSystem;
  default_gold_price: number;
  default_gkg_price: number;
  default_beras_price: number;
  default_susut_pct: number;
  default_rendemen_pct: number;
  reminder_enabled: boolean;
  theme_mode: 'light' | 'dark' | 'system';
}
