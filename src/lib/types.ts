export type PlayerLevel = 'Richiede spiegazione' | 'Modestamente esperto';

export type Player = {
  id: string;
  name: string;
  isBeginner?: boolean;
  isTeacher?: boolean;
};

export type SparePlayer = {
  id: string;
  name: string;
  weight: GameWeight;
  nightDate: string;
  createdAt: number
};

export type GameWeight = 'Party' | 'Leggero (max 45 min)' | 'Medio (1-2h)' | 'Estremo (>2h)';

export type Table = {
  id: string;
  title: string;
  description: string;
  weight: GameWeight;
  seats: number; // max 30
  players: Player[];
  nightDate: string;
  createdAt: number;
};


