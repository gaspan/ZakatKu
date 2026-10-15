import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { formatKg } from '@/utils/format';
import { hapticLight } from '@/utils/haptic';

interface ConversionVisualizerProps {
  gkpKg: number;
  susutPct: number;
  gkgKg: number;
  rendemenPct: number;
  berasKg: number;
  onChangeSusut: (val: number) => void;
  onChangeRendemen: (val: number) => void;
}

export const ConversionVisualizer: React.FC<ConversionVisualizerProps> = ({
  gkpKg,
  susutPct,
  gkgKg,
  rendemenPct,
  berasKg,
  onChangeSusut,
  onChangeRendemen,
}) => {
  const { theme } = useTheme();

  return (
    <Card elevated style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="git-merge-outline" size={20} color={theme.colors.primary} />
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
          Alur Konversi Bertahap Hasil Panen
        </Text>
      </View>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        Sesuaikan rasio susut jemur dan rendemen giling sesuai kondisi riil gabah Anda.
      </Text>

      {/* Step 1: GKP */}
      <View style={[styles.stepCard, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}>
        <View style={styles.stepHeader}>
          <View style={[styles.stepNumber, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.stepNumberText}>1</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.stepLabel, { color: theme.colors.textSecondary }]}>
              Gabah Kering Panen (GKP)
            </Text>
            <Text style={[styles.stepValue, { color: theme.colors.textPrimary }]}>
              {formatKg(gkpKg)}
            </Text>
          </View>
          <Text style={[styles.stepTag, { color: theme.colors.textMuted }]}>Input Panen</Text>
        </View>
      </View>

      {/* Arrow + Slider 1: Susut Jemur */}
      <View style={styles.connectorWrap}>
        <View style={[styles.connectorLine, { backgroundColor: theme.colors.border }]} />
        <View style={[styles.sliderCard, { backgroundColor: theme.colors.surfaceCard, borderColor: theme.colors.border }]}>
          <View style={styles.sliderHeader}>
            <Text style={[styles.sliderTitle, { color: theme.colors.textPrimary }]}>
              Pengeringan (GKP ➔ GKG)
            </Text>
            <Text style={[styles.sliderValue, { color: theme.colors.gold }]}>
              Rasio: {susutPct.toFixed(0)}%
            </Text>
          </View>

          <Slider
            style={styles.slider}
            minimumValue={60}
            maximumValue={95}
            step={1}
            value={susutPct}
            onValueChange={(v) => {
              onChangeSusut(v);
            }}
            minimumTrackTintColor={theme.colors.gold}
            maximumTrackTintColor={theme.colors.track}
            thumbTintColor={theme.colors.gold}
          />

          <View style={styles.quickButtons}>
            <TouchableOpacity
              onPress={() => {
                hapticLight();
                onChangeSusut(85);
              }}
              style={[styles.presetBtn, { backgroundColor: theme.colors.surfaceElevated }]}
            >
              <Text style={[styles.presetText, { color: theme.colors.textSecondary }]}>Default (85%)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                hapticLight();
                onChangeSusut(80);
              }}
              style={[styles.presetBtn, { backgroundColor: theme.colors.surfaceElevated }]}
            >
              <Text style={[styles.presetText, { color: theme.colors.textSecondary }]}>Gabah Basah (80%)</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={[styles.connectorLine, { backgroundColor: theme.colors.border }]} />
      </View>

      {/* Step 2: GKG */}
      <View style={[styles.stepCard, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.gold }]}>
        <View style={styles.stepHeader}>
          <View style={[styles.stepNumber, { backgroundColor: theme.colors.gold }]}>
            <Text style={styles.stepNumberText}>2</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.stepLabel, { color: theme.colors.textSecondary }]}>
              Taksiran Gabah Kering Giling (GKG)
            </Text>
            <Text style={[styles.stepValue, { color: theme.colors.gold }]}>
              {formatKg(gkgKg)}
            </Text>
          </View>
          <Text style={[styles.stepTag, { color: theme.colors.gold, fontWeight: '700' }]}>
            Nishab: 653 kg
          </Text>
        </View>
      </View>

      {/* Arrow + Slider 2: Rendemen Giling */}
      <View style={styles.connectorWrap}>
        <View style={[styles.connectorLine, { backgroundColor: theme.colors.border }]} />
        <View style={[styles.sliderCard, { backgroundColor: theme.colors.surfaceCard, borderColor: theme.colors.border }]}>
          <View style={styles.sliderHeader}>
            <Text style={[styles.sliderTitle, { color: theme.colors.textPrimary }]}>
              Rendemen Penggilingan (GKG ➔ Beras)
            </Text>
            <Text style={[styles.sliderValue, { color: theme.colors.primary }]}>
              Rasio: {rendemenPct.toFixed(0)}%
            </Text>
          </View>

          <Slider
            style={styles.slider}
            minimumValue={45}
            maximumValue={75}
            step={1}
            value={rendemenPct}
            onValueChange={(v) => {
              onChangeRendemen(v);
            }}
            minimumTrackTintColor={theme.colors.primary}
            maximumTrackTintColor={theme.colors.track}
            thumbTintColor={theme.colors.primary}
          />

          <View style={styles.quickButtons}>
            <TouchableOpacity
              onPress={() => {
                hapticLight();
                onChangeRendemen(64);
              }}
              style={[styles.presetBtn, { backgroundColor: theme.colors.surfaceElevated }]}
            >
              <Text style={[styles.presetText, { color: theme.colors.textSecondary }]}>Standar BPS (64%)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                hapticLight();
                onChangeRendemen(60);
              }}
              style={[styles.presetBtn, { backgroundColor: theme.colors.surfaceElevated }]}
            >
              <Text style={[styles.presetText, { color: theme.colors.textSecondary }]}>Giling Manual (60%)</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={[styles.connectorLine, { backgroundColor: theme.colors.border }]} />
      </View>

      {/* Step 3: Beras */}
      <View style={[styles.stepCard, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.primary }]}>
        <View style={styles.stepHeader}>
          <View style={[styles.stepNumber, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.stepNumberText}>3</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.stepLabel, { color: theme.colors.textSecondary }]}>
              Taksiran Beras Siap Konsumsi
            </Text>
            <Text style={[styles.stepValue, { color: theme.colors.primary }]}>
              {formatKg(berasKg)}
            </Text>
          </View>
          <Text style={[styles.stepTag, { color: theme.colors.primary, fontWeight: '700' }]}>
            Nishab: 520 kg
          </Text>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginBottom: 16,
    lineHeight: 16,
  },
  stepCard: {
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 12,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  stepValue: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  stepTag: {
    fontSize: 11,
  },
  connectorWrap: {
    alignItems: 'center',
    marginVertical: 4,
  },
  connectorLine: {
    width: 2,
    height: 12,
  },
  sliderCard: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sliderTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  sliderValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  slider: {
    width: '100%',
    height: 36,
  },
  quickButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  presetBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  presetText: {
    fontSize: 10,
    fontWeight: '600',
  },
});
