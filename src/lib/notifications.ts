import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
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
  if (Platform.OS === 'web') return;
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🌟 Waktunya Menunaikan Zakat Emas!',
        body: `Alhamdulillah, simpanan emas Anda (${totalGram.toFixed(1)}g) telah genap mencapai Nishab & Haul. Bersihkan harta Anda hari ini.`,
        data: { screen: 'emas', totalGram, zakatRupiah },
        sound: true,
      },
      trigger: null, // trigger immediately
    });
  } catch (error) {
    console.warn('Error triggering haul notification:', error);
  }
}

/**
 * Notifikasi uji coba (dari menu pengaturan)
 */
export async function sendTestNotification(): Promise<void> {
  if (Platform.OS === 'web') {
    alert('Notifikasi diuji coba (Platform Web)');
    return;
  }
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      alert('Izin notifikasi belum diaktifkan di pengaturan perangkat.');
      return;
    }

    await Notifications.scheduleNotificationAsync({
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
