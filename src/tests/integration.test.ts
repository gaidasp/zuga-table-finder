import { describe, it, expect } from 'vitest';
import type { Table, SparePlayer, GameWeight } from '$lib/types';

// Mock data helpers
const createMockTable = (overrides?: Partial<Table>): Table => ({
  id: 'table-1',
  title: 'Test Table',
  description: 'Test description',
  weight: 'Medio (1-2h)',
  seats: 4,
  players: [],
  nightDate: '2026-02-15',
  createdAt: Date.now(),
  ...overrides
});

const createMockSparePlayer = (overrides?: Partial<SparePlayer>): SparePlayer => ({
  id: 'spare-1',
  name: 'Test Player',
  weight: 'Party',
  nightDate: '2026-02-15',
  createdAt: Date.now(),
  ...overrides
});

describe('Page Data Integration Tests', () => {
  it('should display tables for the selected night date', () => {
    const table1 = createMockTable({ id: '1', nightDate: '2026-02-15', title: 'Table 1' });
    const table2 = createMockTable({ id: '2', nightDate: '2026-02-15', title: 'Table 2' });
    const table3 = createMockTable({ id: '3', nightDate: '2026-02-16', title: 'Table 3' });

    const tables = [table1, table2, table3];
    const filteredTables = tables.filter(t => t.nightDate === '2026-02-15');

    expect(filteredTables).toHaveLength(2);
    expect(filteredTables[0].title).toBe('Table 1');
    expect(filteredTables[1].title).toBe('Table 2');
  });

  it('should group spare players by weight category', () => {
    const sparePlayers: SparePlayer[] = [
      createMockSparePlayer({ id: '1', weight: 'Party', name: 'Player 1' }),
      createMockSparePlayer({ id: '2', weight: 'Party', name: 'Player 2' }),
      createMockSparePlayer({ id: '3', weight: 'Medio (1-2h)', name: 'Player 3' })
    ];

    const weights: GameWeight[] = ['Party', 'Leggero (max 45 min)', 'Medio (1-2h)', 'Estremo (>2h)'];
    
    const grouped = weights.map((weight) => ({
      weight,
      players: sparePlayers.filter(sp => sp.weight === weight)
    }));

    const partyGroup = grouped.find(g => g.weight === 'Party');
    const medioGroup = grouped.find(g => g.weight === 'Medio (1-2h)');

    expect(partyGroup?.players).toHaveLength(2);
    expect(medioGroup?.players).toHaveLength(1);
  });

  it('should reactively update when night date changes', () => {
    let currentDate = '2026-02-15';
    const allTables = [
      createMockTable({ id: '1', nightDate: '2026-02-15' }),
      createMockTable({ id: '2', nightDate: '2026-02-16' })
    ];

    // Simulate initial load
    let filteredTables = allTables.filter(t => t.nightDate === currentDate);
    expect(filteredTables).toHaveLength(1);

    // Simulate date change
    currentDate = '2026-02-16';
    filteredTables = allTables.filter(t => t.nightDate === currentDate);
    expect(filteredTables).toHaveLength(1);
    expect(filteredTables[0].id).toBe('2');
  });

  it('should detect when table is full', () => {
    const fullTable = createMockTable({
      seats: 4,
      players: [
        { id: 'p1', name: 'Player 1', isBeginner: false, isTeacher: false },
        { id: 'p2', name: 'Player 2', isBeginner: false, isTeacher: false },
        { id: 'p3', name: 'Player 3', isBeginner: false, isTeacher: false },
        { id: 'p4', name: 'Player 4', isBeginner: false, isTeacher: false }
      ]
    });

    expect(fullTable.players.length).toBe(fullTable.seats);
    expect(fullTable.players.length >= fullTable.seats).toBe(true);
  });

  it('should detect when table is overfull', () => {
    const overfullTable = createMockTable({
      seats: 4,
      players: [
        { id: 'p1', name: 'Player 1', isBeginner: false, isTeacher: false },
        { id: 'p2', name: 'Player 2', isBeginner: false, isTeacher: false },
        { id: 'p3', name: 'Player 3', isBeginner: false, isTeacher: false },
        { id: 'p4', name: 'Player 4', isBeginner: false, isTeacher: false },
        { id: 'p5', name: 'Player 5', isBeginner: false, isTeacher: false }
      ]
    });

    expect(overfullTable.players.length).toBeGreaterThan(overfullTable.seats);
  });

  it('should validate player name uniqueness in a table', () => {
    const table = createMockTable({
      players: [
        { id: 'p1', name: 'Mario', isBeginner: false, isTeacher: false },
        { id: 'p2', name: 'Luigi', isBeginner: false, isTeacher: false }
      ]
    });

    const newPlayerName = 'Mario';
    const normalized = newPlayerName.trim().toLowerCase();
    const isDuplicate = table.players.some(p => p.name.trim().toLowerCase() === normalized);

    expect(isDuplicate).toBe(true);
  });

  it('should allow same name in different tables', () => {
    const table1 = createMockTable({
      id: 'table-1',
      players: [
        { id: 'p1', name: 'Mario', isBeginner: false, isTeacher: false }
      ]
    });

    const table2 = createMockTable({
      id: 'table-2',
      players: [
        { id: 'p2', name: 'Mario', isBeginner: false, isTeacher: false }
      ]
    });

    expect(table1.players[0].name).toBe(table2.players[0].name);
    expect(table1.players[0].id).not.toBe(table2.players[0].id);
  });
});
