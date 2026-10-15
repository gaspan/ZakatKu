import { Platform, Alert } from 'react-native';
import { isRunningInExpoGo } from 'expo';

type NotificationsModule = typeof import('expo-notifications');

let Notifications: NotificationsModule | null = null;
let handlerConfigured = false;

function getNotifications(): NotificationsModule | null {
  if (Notifications) return Notifications;
  if (Platform.OS === 'web') return null;
  // Di Expo Go Android (SDK 53+), expo-notifications native push dimatikan oleh Expo.
  if (Platform.OS === 'android' && isRunningInExpoGo()) {
    return null;
  }
  try {
    Notifications = require('expo-notifications');
    if (Notifications && !handlerConfigured) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
      handlerConfigured = true;
    }
  } catch {
    Notifications = null;
  }
  return Notifications;
}

export async function requestNotificationPermissions(): Promise<boolean> {
  const notif = getNotifications();
  if (!notif) return false;
  try {
    const { status: existingStatus } = await notif.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await notif.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  } catch (e) {
    console.warn('Failed to get notification permissions', e);
    return false;
  }
}

/**
 * Picu notifikasi instan apabila Haul Zakat Emas telah terpenuhi
 */
export async function triggerHaulDueNotification(totalGram: number, zakatRupiah: number): Promise<void> {
  const notif = getNotifications();
  if (!notif) return;
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return;

    await notif.scheduleNotificationAsync({
      content: {
        title: '🌟 Waktunya Menunaikan Zakat Emas!',
        body: `Alhamdulillah, simpanan emas Anda (${totalGram.toFixed(1)}g) telah genap mencapai Nishab & Haul. Bersihkan harta Anda hari ini.`,
        data: { screen: 'emas', totalGram, zakatRupiah },
        sound: true,
      },
      trigger: null,
    });
  } catch (error) {
    console.warn('Error triggering haul notification:', error);
  }
}

/**
 * Notifikasi uji coba (dari menu pengaturan)
 */
export async function sendTestNotification(): Promise<void> {
  const notif = getNotifications();
  if (!notif) {
    Alert.alert(
      'Notifikasi Simpanan',
      Platform.OS === 'web'
        ? 'Pengingat haul aktif (Mode Web).'
        : 'Mode Expo Go aktif. Notifikasi lokal otomatis berjalan saat Anda membuat Development Build atau berjalan di perangkat fisik.'
    );
    return;
  }
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      Alert.alert('Izin Notifikasi', 'Izin notifikasi belum diaktifkan di pengaturan perangkat.');
      return;
    }

    await notif.scheduleNotificationAsync({
      content: {
        title: '🔔 Uji Coba Pengingat ZakatKu',
        body: 'Pengingat Haul & Nishab ZakatKu aktif dan siap memberi tahu Anda saat waktu zakat tiba.',
        sound: true,
      },
      trigger: null,
    });
  } catch (e) {
    console.warn('Error sending test notification', e);
  }
}
