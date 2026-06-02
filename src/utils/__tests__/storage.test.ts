import AsyncStorage from '@react-native-async-storage/async-storage';
import { getHistory, saveRecord, deleteRecord, clearHistory, updateRecord } from '../storage';
import type { DropRecord } from '../../types';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem:    jest.fn(),
  setItem:    jest.fn(),
  removeItem: jest.fn(),
}));

const get    = AsyncStorage.getItem    as jest.Mock;
const set    = AsyncStorage.setItem    as jest.Mock;
const remove = AsyncStorage.removeItem as jest.Mock;

const HISTORY_KEY = 'egg_drop_history';

function makeRecord(id: string, overrides: Partial<DropRecord> = {}): DropRecord {
  return {
    id,
    date: '2024-01-01T00:00:00.000Z',
    peakG: 15,
    estG: 12,
    velocity: 3.13,
    height: 0.5,
    freefallMs: 319,
    stopMs: 30,
    score: 63,
    prediction: 'safe',
    eggTested: false,
    actualResult: null,
    predictionCorrect: null,
    ...overrides,
  };
}

function storedAs(records: DropRecord[]): void {
  get.mockResolvedValue(JSON.stringify(records));
}

function savedValue(): DropRecord[] {
  return JSON.parse(set.mock.calls[0][1]) as DropRecord[];
}

beforeEach(() => jest.clearAllMocks());

// ─── getHistory ───────────────────────────────────────────────────────────────

describe('getHistory', () => {
  it('returns empty array when nothing is stored', async () => {
    get.mockResolvedValue(null);
    expect(await getHistory()).toEqual([]);
    expect(get).toHaveBeenCalledWith(HISTORY_KEY);
  });

  it('returns parsed records when data exists', async () => {
    const records = [makeRecord('1'), makeRecord('2')];
    storedAs(records);
    expect(await getHistory()).toEqual(records);
  });
});

// ─── saveRecord ───────────────────────────────────────────────────────────────

describe('saveRecord', () => {
  it('prepends the new record to an empty history', async () => {
    get.mockResolvedValue(null);
    await saveRecord(makeRecord('1'));
    expect(savedValue()).toEqual([makeRecord('1')]);
  });

  it('prepends so the newest record is first', async () => {
    storedAs([makeRecord('1')]);
    await saveRecord(makeRecord('2'));
    const saved = savedValue();
    expect(saved[0].id).toBe('2');
    expect(saved[1].id).toBe('1');
  });

  it('writes to the correct storage key', async () => {
    get.mockResolvedValue(null);
    await saveRecord(makeRecord('x'));
    expect(set).toHaveBeenCalledWith(HISTORY_KEY, expect.any(String));
  });
});

// ─── deleteRecord ─────────────────────────────────────────────────────────────

describe('deleteRecord', () => {
  it('removes the record with the matching id', async () => {
    storedAs([makeRecord('1'), makeRecord('2'), makeRecord('3')]);
    await deleteRecord('2');
    const saved = savedValue();
    expect(saved).toHaveLength(2);
    expect(saved.find((r) => r.id === '2')).toBeUndefined();
  });

  it('leaves other records untouched', async () => {
    storedAs([makeRecord('1'), makeRecord('2')]);
    await deleteRecord('1');
    expect(savedValue()[0].id).toBe('2');
  });

  it('is a no-op when the id does not exist', async () => {
    storedAs([makeRecord('1')]);
    await deleteRecord('999');
    expect(savedValue()).toHaveLength(1);
  });
});

// ─── clearHistory ─────────────────────────────────────────────────────────────

describe('clearHistory', () => {
  it('removes the history key from storage', async () => {
    await clearHistory();
    expect(remove).toHaveBeenCalledWith(HISTORY_KEY);
    expect(remove).toHaveBeenCalledTimes(1);
  });
});

// ─── updateRecord ─────────────────────────────────────────────────────────────

describe('updateRecord', () => {
  it('merges partial changes into the matching record', async () => {
    storedAs([makeRecord('1')]);
    await updateRecord('1', { eggTested: true, actualResult: 'safe', predictionCorrect: true });
    const updated = savedValue()[0];
    expect(updated.eggTested).toBe(true);
    expect(updated.actualResult).toBe('safe');
    expect(updated.predictionCorrect).toBe(true);
  });

  it('preserves unchanged fields on the updated record', async () => {
    storedAs([makeRecord('1')]);
    await updateRecord('1', { eggTested: true });
    const updated = savedValue()[0];
    expect(updated.score).toBe(63);
    expect(updated.peakG).toBe(15);
  });

  it('does not modify other records', async () => {
    storedAs([makeRecord('1'), makeRecord('2')]);
    await updateRecord('1', { eggTested: true });
    const other = savedValue().find((r) => r.id === '2')!;
    expect(other.eggTested).toBe(false);
  });

  it('is a no-op for unknown id (record count unchanged)', async () => {
    storedAs([makeRecord('1')]);
    await updateRecord('999', { eggTested: true });
    expect(savedValue()).toHaveLength(1);
  });
});
