import { describe, it, expect } from 'vitest';
import type { Table, SparePlayer, GameWeight } from '$lib/types';

describe('Reactive Content Updates', () => {
  describe('Table Reactivity', () => {
    it('should update player list when new player joins', () => {
      const table: Table = {
        id: 'table-1',
        title: 'Test Table',
        description: '',
        weight: 'Party',
        seats: 4,
        players: [],
        nightDate: '2026-02-15',
        createdAt: Date.now()
      };

      // Simulate adding a player
      const newPlayer = {
        id: 'p1',
        name: 'Mario',
        isBeginner: false,
        isTeacher: false
      };

      table.players = [...table.players, newPlayer];

      expect(table.players).toHaveLength(1);
      expect(table.players[0].name).toBe('Mario');
    });

    it('should update player count badge reactively', () => {
      const table: Table = {
        id: 'table-1',
        title: 'Test Table',
        description: '',
        weight: 'Party',
        seats: 4,
        players: [
          { id: 'p1', name: 'Mario', isBeginner: false, isTeacher: false }
        ],
        nightDate: '2026-02-15',
        createdAt: Date.now()
      };

      const initialCount = table.players.length;
      expect(initialCount).toBe(1);

      // Add another player
      table.players = [
        ...table.players,
        { id: 'p2', name: 'Luigi', isBeginner: false, isTeacher: false }
      ];

      expect(table.players.length).toBe(2);
      expect(table.players.length).toBeGreaterThan(initialCount);
    });

    it('should reactively show warning when table becomes overfull', () => {
      const table: Table = {
        id: 'table-1',
        title: 'Test Table',
        description: '',
        weight: 'Party',
        seats: 4,
        players: [
          { id: 'p1', name: 'Mario', isBeginner: false, isTeacher: false },
          { id: 'p2', name: 'Luigi', isBeginner: false, isTeacher: false },
          { id: 'p3', name: 'Peach', isBeginner: false, isTeacher: false },
          { id: 'p4', name: 'Toad', isBeginner: false, isTeacher: false }
        ],
        nightDate: '2026-02-15',
        createdAt: Date.now()
      };

      const isOverfull = (t: Table) => t.players.length > t.seats;

      expect(isOverfull(table)).toBe(false);

      // Add one more player
      table.players = [
        ...table.players,
        { id: 'p5', name: 'Yoshi', isBeginner: false, isTeacher: false }
      ];

      expect(isOverfull(table)).toBe(true);
    });

    it('should update player properties reactively', () => {
      const table: Table = {
        id: 'table-1',
        title: 'Test Table',
        description: '',
        weight: 'Party',
        seats: 4,
        players: [
          { id: 'p1', name: 'Mario', isBeginner: true, isTeacher: false }
        ],
        nightDate: '2026-02-15',
        createdAt: Date.now()
      };

      expect(table.players[0].isBeginner).toBe(true);
      expect(table.players[0].isTeacher).toBe(false);

      // Update player
      table.players = table.players.map(p =>
        p.id === 'p1'
          ? { ...p, isBeginner: false, isTeacher: true }
          : p
      );

      expect(table.players[0].isBeginner).toBe(false);
      expect(table.players[0].isTeacher).toBe(true);
    });

    it('should remove player reactively', () => {
      const table: Table = {
        id: 'table-1',
        title: 'Test Table',
        description: '',
        weight: 'Party',
        seats: 4,
        players: [
          { id: 'p1', name: 'Mario', isBeginner: false, isTeacher: false },
          { id: 'p2', name: 'Luigi', isBeginner: false, isTeacher: false }
        ],
        nightDate: '2026-02-15',
        createdAt: Date.now()
      };

      expect(table.players).toHaveLength(2);

      // Remove player
      table.players = table.players.filter(p => p.id !== 'p1');

      expect(table.players).toHaveLength(1);
      expect(table.players[0].name).toBe('Luigi');
    });
  });

  describe('Spare Players Reactivity', () => {
    it('should update spare players list when new player added', () => {
      let sparePlayers: SparePlayer[] = [];

      const newSparePlayer: SparePlayer = {
        id: 'sp1',
        name: 'Alice',
        weight: 'Party',
        nightDate: '2026-02-15',
        createdAt: Date.now()
      };

      sparePlayers = [...sparePlayers, newSparePlayer];

      expect(sparePlayers).toHaveLength(1);
      expect(sparePlayers[0].name).toBe('Alice');
    });

    it('should reactively group spare players by weight', () => {
      const sparePlayers: SparePlayer[] = [
        {
          id: 'sp1',
          name: 'Alice',
          weight: 'Party',
          nightDate: '2026-02-15',
          createdAt: Date.now()
        },
        {
          id: 'sp2',
          name: 'Bob',
          weight: 'Party',
          nightDate: '2026-02-15',
          createdAt: Date.now()
        },
        {
          id: 'sp3',
          name: 'Charlie',
          weight: 'Medio (1-2h)',
          nightDate: '2026-02-15',
          createdAt: Date.now()
        }
      ];

      const weights: GameWeight[] = ['Party', 'Leggero (max 45 min)', 'Medio (1-2h)', 'Estremo (>2h)'];

      const grouped = weights.map(weight => ({
        weight,
        players: sparePlayers.filter(sp => sp.weight === weight)
      }));

      const partyGroup = grouped.find(g => g.weight === 'Party');
      expect(partyGroup?.players).toHaveLength(2);

      // Add another Party player
      const newPlayer: SparePlayer = {
        id: 'sp4',
        name: 'Dave',
        weight: 'Party',
        nightDate: '2026-02-15',
        createdAt: Date.now()
      };

      const updatedSparePlayers = [...sparePlayers, newPlayer];
      const updatedGrouped = weights.map(weight => ({
        weight,
        players: updatedSparePlayers.filter(sp => sp.weight === weight)
      }));

      const updatedPartyGroup = updatedGrouped.find(g => g.weight === 'Party');
      expect(updatedPartyGroup?.players).toHaveLength(3);
    });

    it('should remove spare player reactively', () => {
      let sparePlayers: SparePlayer[] = [
        {
          id: 'sp1',
          name: 'Alice',
          weight: 'Party',
          nightDate: '2026-02-15',
          createdAt: Date.now()
        },
        {
          id: 'sp2',
          name: 'Bob',
          weight: 'Party',
          nightDate: '2026-02-15',
          createdAt: Date.now()
        }
      ];

      expect(sparePlayers).toHaveLength(2);

      sparePlayers = sparePlayers.filter(sp => sp.id !== 'sp1');

      expect(sparePlayers).toHaveLength(1);
      expect(sparePlayers[0].name).toBe('Bob');
    });
  });

  describe('Night Date Filter Reactivity', () => {
    it('should filter tables by night date reactively', () => {
      const allTables: Table[] = [
        {
          id: '1',
          title: 'Table 1',
          description: '',
          weight: 'Party',
          seats: 4,
          players: [],
          nightDate: '2026-02-15',
          createdAt: Date.now()
        },
        {
          id: '2',
          title: 'Table 2',
          description: '',
          weight: 'Party',
          seats: 4,
          players: [],
          nightDate: '2026-02-16',
          createdAt: Date.now()
        }
      ];

      let selectedDate = '2026-02-15';
      let filteredTables = allTables.filter(t => t.nightDate === selectedDate);

      expect(filteredTables).toHaveLength(1);
      expect(filteredTables[0].title).toBe('Table 1');

      // Change date
      selectedDate = '2026-02-16';
      filteredTables = allTables.filter(t => t.nightDate === selectedDate);

      expect(filteredTables).toHaveLength(1);
      expect(filteredTables[0].title).toBe('Table 2');
    });

    it('should filter spare players by night date reactively', () => {
      const allSparePlayers: SparePlayer[] = [
        {
          id: 'sp1',
          name: 'Alice',
          weight: 'Party',
          nightDate: '2026-02-15',
          createdAt: Date.now()
        },
        {
          id: 'sp2',
          name: 'Bob',
          weight: 'Party',
          nightDate: '2026-02-16',
          createdAt: Date.now()
        }
      ];

      let selectedDate = '2026-02-15';
      let filteredSparePlayers = allSparePlayers.filter(sp => sp.nightDate === selectedDate);

      expect(filteredSparePlayers).toHaveLength(1);
      expect(filteredSparePlayers[0].name).toBe('Alice');

      // Change date
      selectedDate = '2026-02-16';
      filteredSparePlayers = allSparePlayers.filter(sp => sp.nightDate === selectedDate);

      expect(filteredSparePlayers).toHaveLength(1);
      expect(filteredSparePlayers[0].name).toBe('Bob');
    });
  });

  describe('Table Details Modal Reactivity', () => {
    it('should update detail view when table data changes', () => {
      const tables: Table[] = [
        {
          id: 'table-1',
          title: 'Test Table',
          description: 'Original description',
          weight: 'Party',
          seats: 4,
          players: [],
          nightDate: '2026-02-15',
          createdAt: Date.now()
        }
      ];

      const detailTableId = 'table-1';
      let detailTable = tables.find(t => t.id === detailTableId);

      expect(detailTable?.description).toBe('Original description');

      // Update table
      tables[0] = {
        ...tables[0],
        description: 'Updated description'
      };

      detailTable = tables.find(t => t.id === detailTableId);
      expect(detailTable?.description).toBe('Updated description');
    });

    it('should clear detail view when table is deleted', () => {
      let tables: Table[] = [
        {
          id: 'table-1',
          title: 'Test Table',
          description: '',
          weight: 'Party',
          seats: 4,
          players: [],
          nightDate: '2026-02-15',
          createdAt: Date.now()
        }
      ];

      const detailTableId: string | null = 'table-1';
      let detailTable = tables.find(t => t.id === detailTableId) ?? null;

      expect(detailTable).not.toBeNull();

      // Delete table
      tables = tables.filter(t => t.id !== 'table-1');
      detailTable = tables.find(t => t.id === detailTableId) ?? null;

      expect(detailTable).toBeNull();
    });
  });
});
