import React from 'react';
import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { useTheme } from '@/constants/theme';
import { CustomTabBar } from '@/components/ui/CustomTabBar';

export default function TabLayout() {
  const { theme } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: {
            backgroundColor: 'transparent',
            elevation: 0,
            borderTopWidth: 0,
          },
        }}
        tabBar={(props) => <CustomTabBar {...props} />}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Beranda',
          }}
        />
        <Tabs.Screen
          name="emas"
          options={{
            title: 'Zakat Emas',
          }}
        />
        <Tabs.Screen
          name="padi"
          options={{
            title: 'Zakat Padi',
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: 'Riwayat & Pengaturan',
          }}
        />
      </Tabs>
    </View>
  );
}
