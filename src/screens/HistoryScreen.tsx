import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Modal, Pressable,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList, DropRecord, Prediction } from '../types';
import { getHistory, deleteRecord, updateRecord } from '../utils/storage';

type Props = NativeStackScreenProps<RootStackParamList, 'History'>;

// Filter values as a union type so the compiler catches any stray strings.
type FilterValue = 'All' | 'Safe' | 'Cracked';
const FILTERS: FilterValue[] = ['All', 'Safe', 'Cracked'];

// ─── HistoryCard ──────────────────────────────────────────────────────────────

interface HistoryCardProps {
  record: DropRecord;
  onDelete: () => void;
  onTestEgg: () => void;
}

function HistoryCard({ record, onDelete, onTestEgg }: HistoryCardProps): React.JSX.Element {
  const safe = record.prediction === 'safe';
  const date = new Date(record.date);
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  const predictionBadge = record.eggTested
    ? record.predictionCorrect
      ? <Text style={styles.badgeCorrect}>✅ Prediction correct</Text>
      : <Text style={styles.badgeWrong}>❌ Prediction wrong</Text>
    : null;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardEmoji}>{safe ? '🥚' : '💥'}</Text>
        <View style={styles.cardInfo}>
          <Text style={styles.cardPrediction}>{safe ? 'Egg safe' : 'Egg cracked'}</Text>
          <Text style={styles.cardDate}>{dateStr} · {timeStr}</Text>
          <Text style={styles.cardG}>{record.estG}g · {record.height}m drop</Text>
        </View>
        {record.score != null && (
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreValue}>{record.score}</Text>
            <Text style={styles.scoreLabel}>score</Text>
          </View>
        )}
        <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}>
          <Text style={styles.deleteText}>🗑</Text>
        </TouchableOpacity>
      </View>

      {predictionBadge}

      {!record.eggTested && (
        <TouchableOpacity style={styles.testEggBtn} onPress={onTestEgg}>
          <Text style={styles.testEggText}>I tested a real egg →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── HistoryScreen ────────────────────────────────────────────────────────────

export default function HistoryScreen({ navigation: _navigation }: Props): React.JSX.Element {
  const [history, setHistory] = useState<DropRecord[]>([]);
  const [modalRecord, setModalRecord] = useState<DropRecord | null>(null);
  const [filter, setFilter] = useState<FilterValue>('All');

  useFocusEffect(
    useCallback(() => {
      getHistory().then(setHistory);
    }, [])
  );

  // Generic: FlatList<DropRecord> uses React Native's built-in generic component.
  // The type parameter ensures renderItem receives DropRecord, not `any`.
  const filtered = useMemo<DropRecord[]>(() => history.filter((r) => {
    if (filter === 'Safe')    return r.prediction === 'safe';
    if (filter === 'Cracked') return r.prediction === 'cracked';
    return true;
  }), [history, filter]);

  async function handleDelete(id: string): Promise<void> {
    Alert.alert('Delete this drop?', '', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteRecord(id);
          setHistory((h) => h.filter((r) => r.id !== id));
        },
      },
    ]);
  }

  async function handleEggResult(actualResult: Prediction): Promise<void> {
    if (!modalRecord) return;
    const predictionCorrect = actualResult === modalRecord.prediction;
    await updateRecord(modalRecord.id, { eggTested: true, actualResult, predictionCorrect });
    setHistory((h) =>
      h.map((r) =>
        r.id === modalRecord.id
          ? { ...r, eggTested: true, actualResult, predictionCorrect }
          : r
      )
    );
    setModalRecord(null);
  }

  if (history.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyEmoji}>🥚</Text>
        <Text style={styles.emptyText}>No drops yet.{'\n'}Go drop something!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* FlatList<DropRecord> — generic ensures type-safe renderItem */}
      <FlatList<DropRecord>
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <HistoryCard
            record={item}
            onDelete={() => handleDelete(item.id)}
            onTestEgg={() => setModalRecord(item)}
          />
        )}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No {filter.toLowerCase()} drops yet.</Text>
          </View>
        }
      />

      <Modal visible={!!modalRecord} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>How'd the real egg do?</Text>
            <Text style={styles.modalSub}>
              App predicted: {modalRecord?.prediction === 'safe' ? '🥚 Safe' : '💥 Cracked'}
            </Text>
            <Pressable
              style={[styles.modalBtn, { backgroundColor: '#4CAF50' }]}
              onPress={() => handleEggResult('safe')}
            >
              <Text style={styles.modalBtnText}>🥚 Egg survived</Text>
            </Pressable>
            <Pressable
              style={[styles.modalBtn, { backgroundColor: '#E53935' }]}
              onPress={() => handleEggResult('cracked')}
            >
              <Text style={styles.modalBtnText}>💥 Egg cracked</Text>
            </Pressable>
            <Pressable onPress={() => setModalRecord(null)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8E7' },
  empty: { flex: 1, backgroundColor: '#FFF8E7', alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyText: { fontSize: 20, color: '#888', textAlign: 'center', lineHeight: 28 },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: '#EEE',
  },
  filterChipActive: { backgroundColor: '#F5C842' },
  filterChipText: { fontSize: 15, fontWeight: '600', color: '#888' },
  filterChipTextActive: { color: '#2D2D2D' },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  cardEmoji: { fontSize: 36, marginRight: 12 },
  cardInfo: { flex: 1 },
  cardPrediction: { fontSize: 18, fontWeight: '800', color: '#2D2D2D' },
  cardDate: { fontSize: 13, color: '#999', marginTop: 2 },
  cardG: { fontSize: 14, color: '#666', marginTop: 2 },
  scoreBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF3CC',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 4,
  },
  scoreValue: { fontSize: 20, fontWeight: '900', color: '#B8860B' },
  scoreLabel: { fontSize: 10, color: '#B8860B', textTransform: 'uppercase', letterSpacing: 0.5 },
  deleteBtn: { padding: 8 },
  deleteText: { fontSize: 20 },
  testEggBtn: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#FFF3CC',
    alignItems: 'center',
  },
  testEggText: { fontSize: 15, fontWeight: '700', color: '#B8860B' },
  badgeCorrect: { marginTop: 10, fontSize: 14, color: '#4CAF50', fontWeight: '700' },
  badgeWrong: { marginTop: 10, fontSize: 14, color: '#E53935', fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 28,
    paddingBottom: 40,
  },
  modalTitle: { fontSize: 24, fontWeight: '900', color: '#2D2D2D', marginBottom: 6 },
  modalSub: { fontSize: 16, color: '#666', marginBottom: 24 },
  modalBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  modalBtnText: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  modalCancel: { textAlign: 'center', color: '#999', fontSize: 16, marginTop: 4 },
});
