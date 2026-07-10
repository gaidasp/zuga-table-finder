import type { BGGGame } from './bgg';

export type PlayerLevel = 'Richiede spiegazione' | 'Modestamente esperto';

export type GameWeight = 'Party' | 'Leggero (max 45 min)' | 'Medio (1-2h)' | 'Estremo (>2h)';

export type Player = {
  id: string;
  name: string;
  userId?: string;
  avatarColor?: string;
  isBeginner?: boolean;
  isTeacher?: boolean;
};

export type SparePlayer = {
  id: string;
  name: string;
  userId?: string;
  avatarColor?: string;
  weight: GameWeight;
  nightDate: string;
  createdAt: number;
};

export type Table = {
  id: string;
  title: string;
  description: string;
  creatorUserId?: string;
  weight: GameWeight;
  seats: number;
  players: Player[];
  nightDate: string;
  createdAt: number;
  bggGame?: BGGGame | null;
};
