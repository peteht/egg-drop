import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import * as Haptics from 'expo-haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList, DropRecord, Surface } from '../types';
import { createDropDetector, magnitude, SAMPLE_INTERVAL_MS } from '../utils/dropDetection';
import type { DropDetector } from '../utils/dropDetection';
import { saveRecord } from '../utils/storage';

type Props = NativeStackScreenProps<RootStackParamList, 'Drop'>;

// Persists the last-chosen surface across navigation so the student
// doesn't have to re-pick after every drop.
let rememberedSurface: Surface = 'solid';

const SURFACES: { value: Surface; label: string; emoji: string }[] = [
  { value: 'solid',  label: 'Solid',  emoji: '🪨' },
  { value: 'carpet', label: 'Carpet', emoji: '🟫' },
  { value: 'grass',  label: 'Grass',  emoji: '🌱' },
];

export default function DropScreen({ navigation }: Props): React.JSX.Element {
  const [currentG, setCurrentG]     = useState<number>(0);
  const [surface, setSurface]       = useState<Surface>(rememberedSurface);
  const pulseAnim                   = useRef(new Animated.Value(1)).current;
  const detectorRef                 = useRef<DropDetector | null>(null);
  const subscriptionRef             = useRef<{ remove: () => void } | null>(null);
  const surfaceRef                  = useRef<Surface>(surface);

  // Keep a ref in sync so the detector callback always reads the latest surface
  // without needing to be re-created when the user taps a different button.
  // Also remember the choice for the next drop.
  useEffect(() => {
    surfaceRef.current = surface;
    rememberedSurface = surface;
  }, [surface]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 700, useNativeDriver: true }),
      ])
    ).start();

    detectorRef.current = createDropDetector(SAMPLE_INTERVAL_MS, async (result) => {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const record: DropRecord = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        surface: surfaceRef.current,
        ...result,
        eggTested: false,
        actualResult: null,
        predictionCorrect: null,
      };
      await saveRecord(record);
      navigation.replace('Result', { record });
    });

    Accelerometer.setUpdateInterval(SAMPLE_INTERVAL_MS);
    subscriptionRef.current = Accelerometer.addListener((accel) => {
      setCurrentG(parseFloat(magnitude(accel).toFixed(1)));
      detectorRef.current?.handleReading(accel);
    });

    return () => {
      subscriptionRef.current?.remove();
      detectorRef.current?.reset();
    };
  }, [navigation, pulseAnim]);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Ready to drop!</Text>
      <Text style={styles.instructions}>
        Wrap your phone in your armor,{'\n'}then drop from at least <Text style={styles.instructionsBold}>1 meter</Text>.{'\n'}Higher = more accurate results.
      </Text>

      <View style={styles.surfaceRow}>
        {SURFACES.map(({ value, label, emoji }) => (
          <TouchableOpacity
            key={value}
            style={[styles.surfaceChip, surface === value && styles.surfaceChipActive]}
            onPress={() => setSurface(value)}
          >
            <Text style={styles.surfaceEmoji}>{emoji}</Text>
            <Text style={[styles.surfaceLabel, surface === value && styles.surfaceLabelActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Animated.View style={[styles.gCircle, { transform: [{ scale: pulseAnim }] }]}>
        <Text style={styles.gValue}>{currentG.toFixed(1)}</Text>
        <Text style={styles.gLabel}>g-force</Text>
      </Animated.View>

      <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8E7',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  heading: {
    fontSize: 32,
    fontWeight: '900',
    color: '#2D2D2D',
    marginBottom: 12,
  },
  instructions: {
    fontSize: 17,
    color: '#666',
    textAlign: 'center',
    lineHeight: 25,
    marginBottom: 28,
  },
  instructionsBold: {
    fontWeight: '800',
    color: '#2D2D2D',
  },
  surfaceRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 36,
  },
  surfaceChip: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#EEE',
    gap: 4,
  },
  surfaceChipActive: {
    backgroundColor: '#F5C842',
  },
  surfaceEmoji: {
    fontSize: 18,
  },
  surfaceLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#888',
  },
  surfaceLabelActive: {
    color: '#2D2D2D',
  },
  gCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#F5C842',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: 60,
  },
  gValue: {
    fontSize: 44,
    fontWeight: '900',
    color: '#2D2D2D',
  },
  gLabel: {
    fontSize: 15,
    color: '#666',
    marginTop: 2,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#CCC',
  },
  cancelText: {
    fontSize: 16,
    color: '#888',
    fontWeight: '600',
  },
});
