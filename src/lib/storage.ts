import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings, HaulSystem } from '@/types';

const STORAGE_KEYS = {
  SETTINGS: 'zakatku_settings',
  LAST_GOLD_PRICE: 'zakatku_last_gold_price',
  LAST_GKG_PRICE: 'zakatku_last_gkg_price',
  LAST_BERAS_PRICE: 'zakatku_last_beras_price',
};

export const DEFAULT_SETTINGS: AppSettings = {
  haul_system: 'hijri', // default 1 tahun Hijriah (354 hari)
  default_gold_price: 1450000, // Rp 1.450.000 / gram
  default_gkg_price: 7500, // Rp 7.500 / kg GKG
  default_beras_price: 15000, // Rp 15.000 / kg Beras
  default_susut_pct: 85, // 85%
  default_rendemen_pct: 64, // 64%
  reminder_enabled: true,
  theme_mode: 'light',
};

export async function getSettings(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function updateSettings(partial: Partial<AppSettings>): Promise<AppSettings> {
  try {
    const current = await getSettings();
    const updated = { ...current, ...partial };
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    return updated;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function setHaulSystem(system: HaulSystem): Promise<void> {
  await updateSettings({ haul_system: system });
}
