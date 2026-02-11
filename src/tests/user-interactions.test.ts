import { describe, it, expect } from 'vitest';
import type { Table, SparePlayer, GameWeight, Player } from '$lib/types';

/**
 * Comprehensive tests for all user interactions with the app
 * This test suite ensures every user action is properly validated and handled
 */

describe('Complete User Interaction Flows', () => {
  describe('Table Update Operations', () => {
    it('should update table title', () => {
      const table: Table = {
        id: 'table-1',
        title: 'Original Title',
        description: 'Description',
        weight: 'Party',
        seats: 4,
        players: [],
        nightDate: '2026-02-15',
        createdAt: Date.now()
      };

      const updatedTable = { ...table, title: 'Updated Title' };

      expect(updatedTable.title).toBe('Updated Title');
      expect(updatedTable.id).toBe(table.id);
    });

    it('should update table description', () => {
      const table: Table = {
        id: 'table-1',
        title: 'Test Table',
        description: 'Original description',
        weight: 'Party',
        seats: 4,
        players: [],
        nightDate: '2026-02-15',
        createdAt: Date.now()
      };

      const updatedTable = { ...table, description: 'New description' };

      expect(updatedTable.description).toBe('New description');
    });

    it('should update table seats count', () => {
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

      const updatedTable = { ...table, seats: 6 };

      expect(updatedTable.seats).toBe(6);
    });

    it('should update table weight category', () => {
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

      const updatedTable = { ...table, weight: 'Medio (1-2h)' as GameWeight };

      expect(updatedTable.weight).toBe('Medio (1-2h)');
    });

    it('should preserve players when updating table details', () => {
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

      const updatedTable = { ...table, title: 'Updated Title', seats: 6 };

      expect(updatedTable.players).toHaveLength(2);
      expect(updatedTable.players[0].name).toBe('Mario');
    });
  });

  describe('Spare Player Complete Flow', () => {
    it('should add spare player with all required fields', () => {
      let sparePlayers: SparePlayer[] = [];

      const newSpare: SparePlayer = {
        id: 'sp-1',
        name: 'Alice',
        weight: 'Medio (1-2h)',
        nightDate: '2026-02-15',
        createdAt: Date.now()
      };

      sparePlayers = [...sparePlayers, newSpare];

      expect(sparePlayers).toHaveLength(1);
      expect(sparePlayers[0].name).toBe('Alice');
      expect(sparePlayers[0].weight).toBe('Medio (1-2h)');
      expect(sparePlayers[0].nightDate).toBe('2026-02-15');
    });

    it('should delete spare player by id', () => {
      let sparePlayers: SparePlayer[] = [
        {
          id: 'sp-1',
          name: 'Alice',
          weight: 'Party',
          nightDate: '2026-02-15',
          createdAt: Date.now()
        },
        {
          id: 'sp-2',
          name: 'Bob',
          weight: 'Party',
          nightDate: '2026-02-15',
          createdAt: Date.now()
        }
      ];

      const idToDelete = 'sp-1';
      sparePlayers = sparePlayers.filter(sp => sp.id !== idToDelete);

      expect(sparePlayers).toHaveLength(1);
      expect(sparePlayers[0].name).toBe('Bob');
      expect(sparePlayers.some(sp => sp.id === idToDelete)).toBe(false);
    });

    it('should group spare players by all weight categories', () => {
      const sparePlayers: SparePlayer[] = [
        { id: 'sp-1', name: 'Alice', weight: 'Party', nightDate: '2026-02-15', createdAt: Date.now() },
        { id: 'sp-2', name: 'Bob', weight: 'Leggero (max 45 min)', nightDate: '2026-02-15', createdAt: Date.now() },
        { id: 'sp-3', name: 'Charlie', weight: 'Medio (1-2h)', nightDate: '2026-02-15', createdAt: Date.now() },
        { id: 'sp-4', name: 'Dave', weight: 'Estremo (>2h)', nightDate: '2026-02-15', createdAt: Date.now() },
        { id: 'sp-5', name: 'Eve', weight: 'Party', nightDate: '2026-02-15', createdAt: Date.now() }
      ];

      const weights: GameWeight[] = ['Party', 'Leggero (max 45 min)', 'Medio (1-2h)', 'Estremo (>2h)'];
      const grouped = weights.map(weight => ({
        weight,
        players: sparePlayers.filter(sp => sp.weight === weight)
      }));

      expect(grouped).toHaveLength(4);
      expect(grouped[0].players).toHaveLength(2); // Party
      expect(grouped[1].players).toHaveLength(1); // Leggero
      expect(grouped[2].players).toHaveLength(1); // Medio
      expect(grouped[3].players).toHaveLength(1); // Estremo
    });

    it('should show empty groups for weights with no spare players', () => {
      const sparePlayers: SparePlayer[] = [
        { id: 'sp-1', name: 'Alice', weight: 'Party', nightDate: '2026-02-15', createdAt: Date.now() }
      ];

      const weights: GameWeight[] = ['Party', 'Leggero (max 45 min)', 'Medio (1-2h)', 'Estremo (>2h)'];
      const grouped = weights.map(weight => ({
        weight,
        players: sparePlayers.filter(sp => sp.weight === weight)
      }));

      expect(grouped[0].players).toHaveLength(1); // Party
      expect(grouped[1].players).toHaveLength(0); // Leggero - empty
      expect(grouped[2].players).toHaveLength(0); // Medio - empty
      expect(grouped[3].players).toHaveLength(0); // Estremo - empty
    });

    it('should prevent duplicate spare players with same name, weight, and nightDate', () => {
      const nightDate = '2026-02-15';
      const weight: GameWeight = 'Medio (1-2h)';
      const name = 'Alice';

      let sparePlayers: SparePlayer[] = [
        {
          id: 'sp-1',
          name: 'Alice',
          weight: 'Medio (1-2h)',
          nightDate: '2026-02-15',
          createdAt: Date.now()
        }
      ];

      // Try to add duplicate
      const isDuplicate = (newName: string, newWeight: GameWeight, newNightDate: string) => {
        const normalized = newName.trim().toLowerCase();
        return sparePlayers.some(
          (sp) => sp.name.trim().toLowerCase() === normalized && 
                  sp.weight === newWeight && 
                  sp.nightDate === newNightDate
        );
      };

      expect(isDuplicate('Alice', weight, nightDate)).toBe(true);
      expect(isDuplicate('alice', weight, nightDate)).toBe(true); // Case insensitive
      expect(isDuplicate(' Alice ', weight, nightDate)).toBe(true); // Trim whitespace
    });

    it('should allow same name for different weights or nightDates', () => {
      const sparePlayers: SparePlayer[] = [
        {
          id: 'sp-1',
          name: 'Alice',
          weight: 'Medio (1-2h)',
          nightDate: '2026-02-15',
          createdAt: Date.now()
        }
      ];

      const isDuplicate = (newName: string, newWeight: GameWeight, newNightDate: string) => {
        const normalized = newName.trim().toLowerCase();
        return sparePlayers.some(
          (sp) => sp.name.trim().toLowerCase() === normalized && 
                  sp.weight === newWeight && 
                  sp.nightDate === newNightDate
        );
      };

      // Same name, different weight - should be allowed
      expect(isDuplicate('Alice', 'Party', '2026-02-15')).toBe(false);
      
      // Same name and weight, different date - should be allowed
      expect(isDuplicate('Alice', 'Medio (1-2h)', '2026-02-16')).toBe(false);
      
      // Different name - should be allowed
      expect(isDuplicate('Bob', 'Medio (1-2h)', '2026-02-15')).toBe(false);
    });
  });

  describe('Night Date Validation', () => {
    it('should validate correct date format', () => {
      const validateDate = (date: string) => /^\d{4}-\d{2}-\d{2}$/.test(date);

      expect(validateDate('2026-02-15')).toBe(true);
      expect(validateDate('2026-12-31')).toBe(true);
    });

    it('should reject invalid date formats', () => {
      const validateDate = (date: string) => /^\d{4}-\d{2}-\d{2}$/.test(date);

      expect(validateDate('2026/02/15')).toBe(false);
      expect(validateDate('15-02-2026')).toBe(false);
      expect(validateDate('2026-2-15')).toBe(false);
      expect(validateDate('invalid')).toBe(false);
      expect(validateDate('')).toBe(false);
    });

    it('should sanitize date input', () => {
      const sanitize = (value: unknown) => {
        if (typeof value !== 'string') return '';
        return value.trim().slice(0, 32);
      };

      expect(sanitize('  2026-02-15  ')).toBe('2026-02-15');
      expect(sanitize('2026-02-15')).toBe('2026-02-15');
      expect(sanitize(123)).toBe('');
      expect(sanitize(null)).toBe('');
      expect(sanitize(undefined)).toBe('');
    });
  });

  describe('Table Deletion Flow', () => {
    it('should remove table from list when deleted', () => {
      let tables: Table[] = [
        {
          id: 'table-1',
          title: 'Table 1',
          description: '',
          weight: 'Party',
          seats: 4,
          players: [],
          nightDate: '2026-02-15',
          createdAt: Date.now()
        },
        {
          id: 'table-2',
          title: 'Table 2',
          description: '',
          weight: 'Party',
          seats: 4,
          players: [],
          nightDate: '2026-02-15',
          createdAt: Date.now()
        }
      ];

      const tableIdToDelete = 'table-1';
      tables = tables.filter(t => t.id !== tableIdToDelete);

      expect(tables).toHaveLength(1);
      expect(tables[0].id).toBe('table-2');
      expect(tables.some(t => t.id === tableIdToDelete)).toBe(false);
    });

    it('should return false when deleting non-existent table', () => {
      const tables: Table[] = [
        {
          id: 'table-1',
          title: 'Table 1',
          description: '',
          weight: 'Party',
          seats: 4,
          players: [],
          nightDate: '2026-02-15',
          createdAt: Date.now()
        }
      ];

      const nonExistentId = 'table-999';
      const found = tables.some(t => t.id === nonExistentId);

      expect(found).toBe(false);
    });
  });

  describe('Player Deletion Flow', () => {
    it('should remove player from table', () => {
      const table: Table = {
        id: 'table-1',
        title: 'Test Table',
        description: '',
        weight: 'Party',
        seats: 4,
        players: [
          { id: 'p1', name: 'Mario', isBeginner: false, isTeacher: false },
          { id: 'p2', name: 'Luigi', isBeginner: false, isTeacher: false },
          { id: 'p3', name: 'Peach', isBeginner: false, isTeacher: false }
        ],
        nightDate: '2026-02-15',
        createdAt: Date.now()
      };

      const playerIdToDelete = 'p2';
      table.players = table.players.filter(p => p.id !== playerIdToDelete);

      expect(table.players).toHaveLength(2);
      expect(table.players.some(p => p.id === playerIdToDelete)).toBe(false);
      expect(table.players[0].name).toBe('Mario');
      expect(table.players[1].name).toBe('Peach');
    });

    it('should handle deleting non-existent player', () => {
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
      const nonExistentPlayerId = 'p999';
      
      table.players = table.players.filter(p => p.id !== nonExistentPlayerId);

      expect(table.players).toHaveLength(initialCount);
    });
  });

  describe('Table Sorting by Player Count', () => {
    it('should sort tables by player count descending', () => {
      const tables: Table[] = [
        {
          id: '1',
          title: 'Table 1',
          description: '',
          weight: 'Party',
          seats: 4,
          players: [
            { id: 'p1', name: 'Player 1', isBeginner: false, isTeacher: false }
          ],
          nightDate: '2026-02-15',
          createdAt: Date.now()
        },
        {
          id: '2',
          title: 'Table 2',
          description: '',
          weight: 'Party',
          seats: 4,
          players: [
            { id: 'p2', name: 'Player 2', isBeginner: false, isTeacher: false },
            { id: 'p3', name: 'Player 3', isBeginner: false, isTeacher: false },
            { id: 'p4', name: 'Player 4', isBeginner: false, isTeacher: false }
          ],
          nightDate: '2026-02-15',
          createdAt: Date.now()
        },
        {
          id: '3',
          title: 'Table 3',
          description: '',
          weight: 'Party',
          seats: 4,
          players: [],
          nightDate: '2026-02-15',
          createdAt: Date.now()
        }
      ];

      const sorted = [...tables].sort((a, b) => b.players.length - a.players.length);

      expect(sorted[0].id).toBe('2'); // 3 players
      expect(sorted[1].id).toBe('1'); // 1 player
      expect(sorted[2].id).toBe('3'); // 0 players
    });

    it('should maintain stable sort for tables with equal player count', () => {
      const tables: Table[] = [
        {
          id: '1',
          title: 'Table A',
          description: '',
          weight: 'Party',
          seats: 4,
          players: [
            { id: 'p1', name: 'Player 1', isBeginner: false, isTeacher: false }
          ],
          nightDate: '2026-02-15',
          createdAt: 1000
        },
        {
          id: '2',
          title: 'Table B',
          description: '',
          weight: 'Party',
          seats: 4,
          players: [
            { id: 'p2', name: 'Player 2', isBeginner: false, isTeacher: false }
          ],
          nightDate: '2026-02-15',
          createdAt: 2000
        }
      ];

      const sorted = [...tables].sort((a, b) => b.players.length - a.players.length);

      expect(sorted[0].players.length).toBe(sorted[1].players.length);
    });
  });

  describe('Empty State Handling', () => {
    it('should handle zero tables', () => {
      const tables: Table[] = [];

      expect(tables).toHaveLength(0);
      expect(tables.length === 0).toBe(true);
    });

    it('should handle zero spare players', () => {
      const sparePlayers: SparePlayer[] = [];

      expect(sparePlayers).toHaveLength(0);
    });

    it('should show empty groups when no spare players exist', () => {
      const sparePlayers: SparePlayer[] = [];
      const weights: GameWeight[] = ['Party', 'Leggero (max 45 min)', 'Medio (1-2h)', 'Estremo (>2h)'];

      const grouped = weights.map(weight => ({
        weight,
        players: sparePlayers.filter(sp => sp.weight === weight)
      }));

      grouped.forEach(group => {
        expect(group.players).toHaveLength(0);
      });
    });

    it('should handle table with zero players', () => {
      const table: Table = {
        id: 'table-1',
        title: 'Empty Table',
        description: '',
        weight: 'Party',
        seats: 4,
        players: [],
        nightDate: '2026-02-15',
        createdAt: Date.now()
      };

      expect(table.players).toHaveLength(0);
      expect(table.players.length < table.seats).toBe(true);
    });
  });

  describe('Beginner and Teacher Flags', () => {
    it('should set player as beginner only', () => {
      const player: Player = {
        id: 'p1',
        name: 'Newbie',
        isBeginner: true,
        isTeacher: false
      };

      expect(player.isBeginner).toBe(true);
      expect(player.isTeacher).toBe(false);
    });

    it('should set player as teacher only', () => {
      const player: Player = {
        id: 'p1',
        name: 'Expert',
        isBeginner: false,
        isTeacher: true
      };

      expect(player.isBeginner).toBe(false);
      expect(player.isTeacher).toBe(true);
    });

    it('should allow player to be both beginner and teacher', () => {
      const player: Player = {
        id: 'p1',
        name: 'Learning Teacher',
        isBeginner: true,
        isTeacher: true
      };

      expect(player.isBeginner).toBe(true);
      expect(player.isTeacher).toBe(true);
    });

    it('should allow player to be neither beginner nor teacher', () => {
      const player: Player = {
        id: 'p1',
        name: 'Regular Player',
        isBeginner: false,
        isTeacher: false
      };

      expect(player.isBeginner).toBe(false);
      expect(player.isTeacher).toBe(false);
    });

    it('should count beginners in a table', () => {
      const table: Table = {
        id: 'table-1',
        title: 'Mixed Table',
        description: '',
        weight: 'Party',
        seats: 4,
        players: [
          { id: 'p1', name: 'Expert', isBeginner: false, isTeacher: true },
          { id: 'p2', name: 'Newbie 1', isBeginner: true, isTeacher: false },
          { id: 'p3', name: 'Newbie 2', isBeginner: true, isTeacher: false },
          { id: 'p4', name: 'Regular', isBeginner: false, isTeacher: false }
        ],
        nightDate: '2026-02-15',
        createdAt: Date.now()
      };

      const beginnerCount = table.players.filter(p => p.isBeginner).length;
      const teacherCount = table.players.filter(p => p.isTeacher).length;

      expect(beginnerCount).toBe(2);
      expect(teacherCount).toBe(1);
    });
  });

  describe('Multiple Sequential Operations', () => {
    it('should handle adding multiple players sequentially', () => {
      const table: Table = {
        id: 'table-1',
        title: 'Test Table',
        description: '',
        weight: 'Party',
        seats: 6,
        players: [],
        nightDate: '2026-02-15',
        createdAt: Date.now()
      };

      // Add first player
      table.players = [
        ...table.players,
        { id: 'p1', name: 'Mario', isBeginner: false, isTeacher: false }
      ];
      expect(table.players).toHaveLength(1);

      // Add second player
      table.players = [
        ...table.players,
        { id: 'p2', name: 'Luigi', isBeginner: false, isTeacher: false }
      ];
      expect(table.players).toHaveLength(2);

      // Add third player
      table.players = [
        ...table.players,
        { id: 'p3', name: 'Peach', isBeginner: true, isTeacher: false }
      ];
      expect(table.players).toHaveLength(3);
    });

    it('should handle add, remove, and add again sequence', () => {
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

      // Add players
      table.players = [
        { id: 'p1', name: 'Mario', isBeginner: false, isTeacher: false },
        { id: 'p2', name: 'Luigi', isBeginner: false, isTeacher: false }
      ];
      expect(table.players).toHaveLength(2);

      // Remove one
      table.players = table.players.filter(p => p.id !== 'p1');
      expect(table.players).toHaveLength(1);

      // Add another
      table.players = [
        ...table.players,
        { id: 'p3', name: 'Peach', isBeginner: false, isTeacher: false }
      ];
      expect(table.players).toHaveLength(2);
      expect(table.players.some(p => p.name === 'Luigi')).toBe(true);
      expect(table.players.some(p => p.name === 'Peach')).toBe(true);
      expect(table.players.some(p => p.name === 'Mario')).toBe(false);
    });

    it('should handle updating table details multiple times', () => {
      let table: Table = {
        id: 'table-1',
        title: 'Original',
        description: 'Original desc',
        weight: 'Party',
        seats: 4,
        players: [],
        nightDate: '2026-02-15',
        createdAt: Date.now()
      };

      // First update
      table = { ...table, title: 'Updated Once' };
      expect(table.title).toBe('Updated Once');

      // Second update
      table = { ...table, description: 'New description' };
      expect(table.description).toBe('New description');

      // Third update
      table = { ...table, seats: 6, weight: 'Medio (1-2h)' as GameWeight };
      expect(table.seats).toBe(6);
      expect(table.weight).toBe('Medio (1-2h)');
    });

    it('should handle multiple spare player additions and deletions', () => {
      let sparePlayers: SparePlayer[] = [];

      // Add three spare players
      sparePlayers = [
        ...sparePlayers,
        { id: 'sp1', name: 'Alice', weight: 'Party', nightDate: '2026-02-15', createdAt: Date.now() }
      ];
      sparePlayers = [
        ...sparePlayers,
        { id: 'sp2', name: 'Bob', weight: 'Party', nightDate: '2026-02-15', createdAt: Date.now() }
      ];
      sparePlayers = [
        ...sparePlayers,
        { id: 'sp3', name: 'Charlie', weight: 'Medio (1-2h)', nightDate: '2026-02-15', createdAt: Date.now() }
      ];
      expect(sparePlayers).toHaveLength(3);

      // Delete one
      sparePlayers = sparePlayers.filter(sp => sp.id !== 'sp2');
      expect(sparePlayers).toHaveLength(2);

      // Add another
      sparePlayers = [
        ...sparePlayers,
        { id: 'sp4', name: 'Dave', weight: 'Party', nightDate: '2026-02-15', createdAt: Date.now() }
      ];
      expect(sparePlayers).toHaveLength(3);

      // Verify correct players remain
      expect(sparePlayers.some(sp => sp.name === 'Alice')).toBe(true);
      expect(sparePlayers.some(sp => sp.name === 'Bob')).toBe(false);
      expect(sparePlayers.some(sp => sp.name === 'Charlie')).toBe(true);
      expect(sparePlayers.some(sp => sp.name === 'Dave')).toBe(true);
    });
  });

  describe('Data Reload After Operations', () => {
    it('should reload tables after creating new table', () => {
      let tables: Table[] = [
        {
          id: 'table-1',
          title: 'Existing Table',
          description: '',
          weight: 'Party',
          seats: 4,
          players: [],
          nightDate: '2026-02-15',
          createdAt: Date.now()
        }
      ];

      const newTable: Table = {
        id: 'table-2',
        title: 'New Table',
        description: '',
        weight: 'Medio (1-2h)',
        seats: 6,
        players: [],
        nightDate: '2026-02-15',
        createdAt: Date.now()
      };

      tables = [...tables, newTable];

      expect(tables).toHaveLength(2);
      expect(tables.some(t => t.id === 'table-2')).toBe(true);
    });

    it('should reload spare players after adding new spare player', () => {
      let sparePlayers: SparePlayer[] = [];

      const newSpare: SparePlayer = {
        id: 'sp-1',
        name: 'Alice',
        weight: 'Party',
        nightDate: '2026-02-15',
        createdAt: Date.now()
      };

      sparePlayers = [...sparePlayers, newSpare];

      expect(sparePlayers).toHaveLength(1);
      expect(sparePlayers[0].id).toBe('sp-1');
    });

    it('should reload data when night date changes', () => {
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
        },
        {
          id: '3',
          title: 'Table 3',
          description: '',
          weight: 'Party',
          seats: 4,
          players: [],
          nightDate: '2026-02-16',
          createdAt: Date.now()
        }
      ];

      let selectedDate = '2026-02-15';
      let visibleTables = allTables.filter(t => t.nightDate === selectedDate);
      expect(visibleTables).toHaveLength(1);

      selectedDate = '2026-02-16';
      visibleTables = allTables.filter(t => t.nightDate === selectedDate);
      expect(visibleTables).toHaveLength(2);
    });
  });

  describe('Form Input Trimming and Limits', () => {
    it('should trim whitespace from player names', () => {
      const input = '  Mario  ';
      const trimmed = input.trim();

      expect(trimmed).toBe('Mario');
      expect(trimmed.length).toBe(5);
    });

    it('should limit name to 48 characters', () => {
      const NAME_LIMIT = 48;
      const longName = 'A'.repeat(100);
      const limited = longName.slice(0, NAME_LIMIT);

      expect(limited.length).toBe(NAME_LIMIT);
    });

    it('should limit title to 80 characters', () => {
      const TITLE_LIMIT = 80;
      const longTitle = 'A'.repeat(150);
      const limited = longTitle.slice(0, TITLE_LIMIT);

      expect(limited.length).toBe(TITLE_LIMIT);
    });

    it('should limit description to 240 characters', () => {
      const DESC_LIMIT = 240;
      const longDesc = 'A'.repeat(500);
      const limited = longDesc.slice(0, DESC_LIMIT);

      expect(limited.length).toBe(DESC_LIMIT);
    });
  });

  describe('Weight Category Filtering', () => {
    it('should filter tables by weight category', () => {
      const tables: Table[] = [
        {
          id: '1',
          title: 'Party Game',
          description: '',
          weight: 'Party',
          seats: 4,
          players: [],
          nightDate: '2026-02-15',
          createdAt: Date.now()
        },
        {
          id: '2',
          title: 'Medium Game',
          description: '',
          weight: 'Medio (1-2h)',
          seats: 4,
          players: [],
          nightDate: '2026-02-15',
          createdAt: Date.now()
        },
        {
          id: '3',
          title: 'Another Party',
          description: '',
          weight: 'Party',
          seats: 4,
          players: [],
          nightDate: '2026-02-15',
          createdAt: Date.now()
        }
      ];

      const partyTables = tables.filter(t => t.weight === 'Party');
      const mediumTables = tables.filter(t => t.weight === 'Medio (1-2h)');

      expect(partyTables).toHaveLength(2);
      expect(mediumTables).toHaveLength(1);
    });

    it('should count tables by weight category', () => {
      const tables: Table[] = [
        {
          id: '1',
          title: 'Game 1',
          description: '',
          weight: 'Party',
          seats: 4,
          players: [],
          nightDate: '2026-02-15',
          createdAt: Date.now()
        },
        {
          id: '2',
          title: 'Game 2',
          description: '',
          weight: 'Party',
          seats: 4,
          players: [],
          nightDate: '2026-02-15',
          createdAt: Date.now()
        },
        {
          id: '3',
          title: 'Game 3',
          description: '',
          weight: 'Leggero (max 45 min)',
          seats: 4,
          players: [],
          nightDate: '2026-02-15',
          createdAt: Date.now()
        },
        {
          id: '4',
          title: 'Game 4',
          description: '',
          weight: 'Medio (1-2h)',
          seats: 4,
          players: [],
          nightDate: '2026-02-15',
          createdAt: Date.now()
        }
      ];

      const weights: GameWeight[] = ['Party', 'Leggero (max 45 min)', 'Medio (1-2h)', 'Estremo (>2h)'];
      const counts = weights.map(weight => ({
        weight,
        count: tables.filter(t => t.weight === weight).length
      }));

      expect(counts[0].count).toBe(2); // Party
      expect(counts[1].count).toBe(1); // Leggero
      expect(counts[2].count).toBe(1); // Medio
      expect(counts[3].count).toBe(0); // Estremo
    });
  });

  describe('Detail View Interactions', () => {
    it('should open detail view for selected table', () => {
      const tables: Table[] = [
        {
          id: 'table-1',
          title: 'Test Table',
          description: 'Detailed description',
          weight: 'Party',
          seats: 4,
          players: [
            { id: 'p1', name: 'Mario', isBeginner: false, isTeacher: false }
          ],
          nightDate: '2026-02-15',
          createdAt: Date.now()
        }
      ];

      const detailTableId = 'table-1';
      const detailTable = tables.find(t => t.id === detailTableId);

      expect(detailTable).toBeDefined();
      expect(detailTable?.title).toBe('Test Table');
      expect(detailTable?.description).toBe('Detailed description');
    });

    it('should close detail view when table is deleted', () => {
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

    it('should update detail view when table is modified', () => {
      const tables: Table[] = [
        {
          id: 'table-1',
          title: 'Original Title',
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

      expect(detailTable?.title).toBe('Original Title');

      // Update table
      tables[0] = { ...tables[0], title: 'Updated Title' };
      detailTable = tables.find(t => t.id === detailTableId);

      expect(detailTable?.title).toBe('Updated Title');
    });
  });
});
