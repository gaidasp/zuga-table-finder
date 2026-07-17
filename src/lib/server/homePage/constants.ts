import type { GameWeight } from '$lib/types';

export const NAME_LIMIT = 48;
export const TITLE_LIMIT = 80;
export const DESC_LIMIT = 240;
export const HONEYPOT_FIELD = 'website';
export const NIGHT_DATE_COOKIE = 'zuga_night_date';
export const WEIGHTS: GameWeight[] = ['Party', 'Leggero (max 45 min)', 'Medio (1-2h)', 'Estremo (>2h)'];
export const DATABASE_ERROR_MESSAGE =
  'Database non disponibile al momento. Riprova piu tardi o verifica la configurazione MongoDB.';
export const AUTH_REQUIRED_MESSAGE = 'Effettua il login per modificare dati.';

export const sanitizeNightDate = (value: unknown) => {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, 32);
};

export const sanitizeTableId = (value: unknown) => {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, 128);
};
