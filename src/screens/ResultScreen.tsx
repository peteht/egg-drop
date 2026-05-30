import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import { SAMPLE_INTERVAL_MS } from '../utils/dropDetection';
import { deleteRecord } from '../utils/storage';

type Props = NativeStackScreenProps<RootStackParamList, 'Result'>;

export default function ResultScreen({ navigation, route }: Props): React.JSX.Element {
  const { record } = route.params;
  const safe = record.prediction === 'safe';
  const [showInfo, setShowInfo] = useState<boolean>(false);

  const atFloor = record.stopMs <= SAMPLE_INTERVAL_MS;

  function handleDiscard(): void {
    Alert.alert('Discard this drop?', 'It will be removed from history.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: async () => {
          await deleteRecord(record.id);
          navigation.navigate('Home');
        },
      },
    ]);
  }
  const cushionLabel = atFloor ? `< ${SAMPLE_INTERVAL_MS}ms` : `${record.stopMs}ms`;
  const cushionPhrase = atFloor ? `under ${SAMPLE_INTERVAL_MS}ms` : `${record.stopMs}ms`;

  return (
    <View style={[styles.container, { backgroundColor: safe ? '#E8F8E8' : '#FDE8E8' }]}>
      <Text style={styles.emoji}>{safe ? '🥚' : '💥'}</Text>
      <Text style={styles.verdict}>{safe ? 'Your armor held!' : 'Shell shock!'}</Text>
      <Text style={styles.subtext}>
        {safe
          ? "That egg would've survived. Nice build!"
          : "That impact would've cracked the egg. Back to the drawing board!"}
      </Text>

      <View style={styles.dataCard}>
        <TouchableOpacity style={styles.infoIcon} onPress={() => setShowInfo(true)} hitSlop={10}>
          <Text style={styles.infoIconText}>?</Text>
        </TouchableOpacity>

        <Text style={styles.dataLabel}>Protection Score</Text>
        <Text style={styles.dataValue}>
          {record.score}<Text style={styles.dataValueMax}>/100</Text>
        </Text>

        <View style={styles.statRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{record.estG}g</Text>
            <Text style={styles.statLabel}>Force</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{cushionLabel}</Text>
            <Text style={styles.statLabel}>Cushion</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{record.height}m</Text>
            <Text style={styles.statLabel}>Drop</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>
              {record.surface.charAt(0).toUpperCase() + record.surface.slice(1)}
            </Text>
            <Text style={styles.statLabel}>Surface</Text>
          </View>
        </View>
      </View>

      <Modal visible={showInfo} transparent animationType="fade" onRequestClose={() => setShowInfo(false)}>
        <Pressable style={styles.infoOverlay} onPress={() => setShowInfo(false)}>
          <Pressable style={styles.infoBox}>
            <Text style={styles.infoTitle}>What is the protection score?</Text>
            <Text style={styles.infoText}>
              A 0–100 rating of how gentle the landing was — higher is better. The less force your
              armor lets through, the higher you score. Try to beat your best!
            </Text>
            <Text style={styles.infoText}>
              {safe
                ? `Your armor stretched the stop to ${cushionPhrase}, softening the hit to ${record.estG}g — scoring ${record.score}.`
                : `The phone stopped in ${cushionPhrase} and hit with ${record.estG}g, scoring just ${record.score}. More cushioning = a longer stop = a higher score.`}
            </Text>
            <Text style={styles.infoText}>
              Tip: drop from higher up. A faster fall spreads designs apart and makes the score more
              meaningful.
            </Text>
            {atFloor && (
              <Text style={styles.infoNote}>
                Why "{`< ${SAMPLE_INTERVAL_MS}ms`}"? The phone's motion sensor only takes a reading
                every {SAMPLE_INTERVAL_MS}ms ({Math.round(1000 / SAMPLE_INTERVAL_MS)} times a
                second), so that's the shortest stop it can measure. A truly hard impact is even
                faster — it just registers as the {SAMPLE_INTERVAL_MS}ms floor.
              </Text>
            )}
            <TouchableOpacity style={styles.infoClose} onPress={() => setShowInfo(false)}>
              <Text style={styles.infoCloseText}>Got it</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: safe ? '#4CAF50' : '#E53935' }]}
        onPress={() => navigation.navigate('Drop')}
      >
        <Text style={styles.buttonText}>Drop Again</Text>
      </TouchableOpacity>

      <View style={styles.secondaryRow}>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('History')}>
          <Text style={styles.secondaryButtonText}>History</Text>
        </TouchableOpacity>
        <Text style={styles.secondarySep}>·</Text>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleDiscard}>
          <Text style={[styles.secondaryButtonText, styles.discardText]}>Discard</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emoji: {
    fontSize: 60,
    marginBottom: 10,
  },
  verdict: {
    fontSize: 28,
    fontWeight: '900',
    color: '#2D2D2D',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtext: {
    fontSize: 17,
    color: '#555',
    textAlign: 'center',
    lineHeight: 25,
    marginBottom: 36,
  },
  dataCard: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 36,
    alignSelf: 'stretch',
  },
  dataLabel: {
    fontSize: 14,
    color: '#888',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  dataValue: {
    fontSize: 52,
    fontWeight: '900',
    color: '#2D2D2D',
    marginTop: 2,
    marginBottom: 18,
  },
  dataValueMax: {
    fontSize: 24,
    fontWeight: '700',
    color: '#AAA',
  },
  infoIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#BBB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoIconText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#999',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignSelf: 'stretch',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
    paddingTop: 14,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2D2D2D',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 64,
    borderRadius: 32,
    marginBottom: 16,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
  },
  secondaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  secondaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  secondaryButtonText: {
    fontSize: 15,
    color: '#888',
    textDecorationLine: 'underline',
  },
  secondarySep: {
    fontSize: 15,
    color: '#CCC',
  },
  discardText: {
    color: '#E53935',
  },
  infoOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  infoBox: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    alignSelf: 'stretch',
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#2D2D2D',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
    marginBottom: 12,
  },
  infoNote: {
    fontSize: 13,
    color: '#888',
    lineHeight: 19,
    fontStyle: 'italic',
    backgroundColor: '#F7F4EC',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  infoClose: {
    marginTop: 4,
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#F5C842',
  },
  infoCloseText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2D2D2D',
  },
});
