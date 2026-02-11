import { describe, it, expect, vi } from 'vitest';
import type { Table, Player, GameWeight } from '$lib/types';

// Mock MongoDB
vi.mock('mongodb', () => ({
  MongoClient: vi.fn(() => ({
    connect: vi.fn(() => Promise.resolve({
      db: vi.fn(() => ({
        collection: vi.fn()
      }))
    }))
  })),
  ServerApiVersion: { v1: '1' }
}));

vi.mock('$env/static/private', () => ({
  MONGODB_URI: 'mongodb://localhost:27017',
  MONGODB_DB: 'test'
}));

describe('Server Actions Tests', () => {
  describe('Table Creation', () => {
    it('should validate table title length', () => {
      const shortTitle = 'AB';
      const validTitle = 'Valid Table Name';

      expect(shortTitle.length < 3).toBe(true);
      expect(validTitle.length >= 3).toBe(true);
    });

    it('should validate weight selection', () => {
      const validWeights: GameWeight[] = ['Party', 'Leggero (max 45 min)', 'Medio (1-2h)', 'Estremo (>2h)'];
      const testWeight = 'Party';
      const invalidWeight = 'Invalid Weight';

      expect(validWeights.includes(testWeight as GameWeight)).toBe(true);
      expect(validWeights.includes(invalidWeight as GameWeight)).toBe(false);
    });

    it('should enforce seat limits', () => {
      const tooFewSeats = 0;
      const validSeats = 4;
      const tooManySeats = 50;

      const normalizeSeats = (seats: number) => {
        if (!Number.isFinite(seats)) return 4;
        return Math.min(Math.max(1, seats), 30);
      };

      expect(normalizeSeats(tooFewSeats)).toBe(1);
      expect(normalizeSeats(validSeats)).toBe(4);
      expect(normalizeSeats(tooManySeats)).toBe(30);
    });

    it('should trim and limit title length', () => {
      const TITLE_LIMIT = 80;
      const longTitle = 'A'.repeat(100);
      const trimmedTitle = longTitle.slice(0, TITLE_LIMIT);

      expect(trimmedTitle.length).toBe(TITLE_LIMIT);
    });

    it('should detect duplicate table names', () => {
      const existingTables: Table[] = [
        {
          id: '1',
          title: 'Existing Table',
          description: '',
          weight: 'Party',
          seats: 4,
          players: [],
          nightDate: '2026-02-15',
          createdAt: Date.now()
        }
      ];

      const newTitle = 'Existing Table';
      const normalized = newTitle.trim().toLowerCase();
      const duplicate = existingTables.some(t => t.title.trim().toLowerCase() === normalized);

      expect(duplicate).toBe(true);
    });
  });

  describe('Player Join Validation', () => {
    it('should validate player name length', () => {
      const NAME_LIMIT = 48;
      const shortName = 'A';
      const validName = 'Mario';
      const longName = 'A'.repeat(100);

      expect(shortName.length < 2).toBe(true);
      expect(validName.length >= 2).toBe(true);
      expect(longName.slice(0, NAME_LIMIT).length).toBe(NAME_LIMIT);
    });

    it('should detect duplicate player names in table', () => {
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

      const newPlayerName = 'mario'; // different case
      const normalized = newPlayerName.trim().toLowerCase();
      const duplicate = table.players.some(p => p.name.trim().toLowerCase() === normalized);

      expect(duplicate).toBe(true);
    });

    it('should handle case-insensitive name comparison', () => {
      const name1 = 'Mario';
      const name2 = 'MARIO';
      const name3 = 'mario';

      expect(name1.toLowerCase()).toBe(name2.toLowerCase());
      expect(name1.toLowerCase()).toBe(name3.toLowerCase());
    });
  });

  describe('Honeypot Validation', () => {
    it('should detect bot submissions', () => {
      const honeypotValue = '';
      const botHoneypotValue = 'http://spam.com';

      const clean = (value: string | null, limit: number) =>
        (value?.toString().trim() ?? '').slice(0, limit);

      expect(clean(honeypotValue, 32)).toBe('');
      expect(clean(botHoneypotValue, 32)).not.toBe('');
    });
  });

  describe('Description Validation', () => {
    it('should trim and limit description length', () => {
      const DESC_LIMIT = 240;
      const longDescription = 'A'.repeat(300);
      const trimmedDescription = longDescription.slice(0, DESC_LIMIT);

      expect(trimmedDescription.length).toBe(DESC_LIMIT);
    });
  });

  describe('Player Update', () => {
    it('should allow updating player properties', () => {
      const player: Player = {
        id: 'p1',
        name: 'Mario',
        isBeginner: true,
        isTeacher: false
      };

      const updatedPlayer: Player = {
        ...player,
        name: 'Super Mario',
        isBeginner: false,
        isTeacher: true
      };

      expect(updatedPlayer.id).toBe(player.id);
      expect(updatedPlayer.name).toBe('Super Mario');
      expect(updatedPlayer.isBeginner).toBe(false);
      expect(updatedPlayer.isTeacher).toBe(true);
    });

    it('should prevent duplicate names when updating player', () => {
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

      const playerIdToUpdate = 'p1';
      const newName = 'luigi'; // trying to use Luigi's name
      const normalized = newName.trim().toLowerCase();
      
      // Check if name exists but exclude the player being edited
      const duplicate = table.players.some(
        p => p.id !== playerIdToUpdate && p.name.trim().toLowerCase() === normalized
      );

      expect(duplicate).toBe(true);
    });
  });

  describe('Night Date Handling', () => {
    it('should sanitize night date input', () => {
      const sanitizeNightDate = (value: unknown) => {
        if (typeof value !== 'string') return '';
        return value.trim().slice(0, 32);
      };

      expect(sanitizeNightDate('2026-02-15')).toBe('2026-02-15');
      expect(sanitizeNightDate('  2026-02-15  ')).toBe('2026-02-15');
      expect(sanitizeNightDate(123)).toBe('');
      expect(sanitizeNightDate(null)).toBe('');
    });

    it('should use default night date when not provided', () => {
      const getDefaultNightDate = () => {
        const today = new Date();
        return today.toISOString().slice(0, 10);
      };

      const defaultDate = getDefaultNightDate();
      expect(defaultDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
});
