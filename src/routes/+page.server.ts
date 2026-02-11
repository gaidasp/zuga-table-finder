import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import {
  addSparePlayer,
  createTable,
  deleteSparePlayer,
  deletePlayer,
  deleteTable,
  updatePlayer,
  joinTable,
  listSparePlayers,
  listTables,
  updateTable,
  getDefaultNightDate,
  getTableById
} from '$server/data';
import type { GameWeight, Table } from '$lib/types';


const NAME_LIMIT = 48;
const TITLE_LIMIT = 80;
const DESC_LIMIT = 240;
const HONEYPOT_FIELD = 'website';
const WEIGHTS: GameWeight[] = ['Party', 'Leggero (max 45 min)', 'Medio (1-2h)', 'Estremo (>2h)'];

const sanitizeNightDate = (value: unknown) => {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, 32);
};

const buildPageData = async (nightDateInput?: string) => {
  const nightDate = nightDateInput || getDefaultNightDate();

  const tables = await listTables(nightDate);
  const sparePlayers = await listSparePlayers(nightDate);
  return { tables: tables, sparePlayers: sparePlayers, weights: WEIGHTS, nightDate: nightDate };
};

const clean = (value: FormDataEntryValue | null, limit: number) =>
  (value?.toString().trim() ?? '').slice(0, limit);



export const load: PageServerLoad = async () => buildPageData();

export const actions: Actions = {
  pageData: async ({ request }) => {
    const form = await request.formData();
    const nightDate = sanitizeNightDate(form.get('nightDate'));
    const payload = await buildPageData(nightDate);
    return payload;
  },

  createTable: async ({ request }) => {
    const data = await request.formData();
    if (clean(data.get(HONEYPOT_FIELD), 32)) return fail(400, { message: 'Bot rilevato' });

    const title = clean(data.get('title'), TITLE_LIMIT);
    const description = clean(data.get('description'), DESC_LIMIT);
    const weightRaw = clean(data.get('weight'), 64);
    const seatsRaw = Number(data.get('seats'));
    const seats = Number.isFinite(seatsRaw) ? Math.min(Math.max(1, seatsRaw), 30) : 4;
    const nightDate = clean(data.get('nightDate'), 32);

    if (title.length < 3) {
      return fail(400, { message: 'Titolo troppo corto', form: 'create' });
    }

    if (!WEIGHTS.includes(weightRaw as (typeof WEIGHTS)[number])) {
      return fail(400, { message: 'Seleziona il peso del tavolo', form: 'create' });
    }
    // load data and check if table with same title for the same nightdate exists, do not allow creation if same title exists
    const allTables = await listTables(nightDate);
    const duplicate = allTables.some((t) => t.title.trim().toLowerCase() === title.trim().toLowerCase());
    if (duplicate) return fail(400, { message: 'Esiste già un tavolo con lo stesso nome per questa serata. Inserisci un nome diverso.', form: 'create' });

    const weight = weightRaw as (typeof WEIGHTS)[number];
    const createdTable = await createTable({ title, description, seats, weight, nightDate: nightDate });
    return { success: true, form: 'create', table: createdTable as Table };
  },

  updateTable: async ({ request }) => {
    const data = await request.formData();
    if (clean(data.get(HONEYPOT_FIELD), 32)) return fail(400, { message: 'Bot rilevato' });

    const tableId = clean(data.get('tableId'), 128);
    const title = clean(data.get('title'), TITLE_LIMIT);
    const description = clean(data.get('description'), DESC_LIMIT);
    const weightRaw = clean(data.get('weight'), 64);
    const seatsRaw = Number(data.get('seats'));
    const seats = Number.isFinite(seatsRaw) ? Math.min(Math.max(1, seatsRaw), 30) : 4;

    if (title.length < 3) {
      return fail(400, { message: 'Titolo troppo corto', form: 'update' });
    }

    if (!WEIGHTS.includes(weightRaw as (typeof WEIGHTS)[number])) {
      return fail(400, { message: 'Seleziona il peso del tavolo', form: 'update' });
    }

    const weight = weightRaw as (typeof WEIGHTS)[number];
    const table = await updateTable(tableId, { title, description, seats, weight });
    if (!table) return fail(404, { message: 'Tavolo non trovato', form: 'update' });

    
    return { success: true, form: 'update', table: table as Table };
  },

  updatePlayer: async ({ request }) => {
    const data = await request.formData();
    if (clean(data.get(HONEYPOT_FIELD), 32)) return fail(400, { message: 'Bot rilevato' });

    const tableId = clean(data.get('tableId'), 128);
    const playerId = clean(data.get('playerId'), 128);
    const name = clean(data.get('name'), NAME_LIMIT);
    const isBeginner = data.get('isBeginner') !== null;
    const isTeacher = data.get('isTeacher') !== null;

    if (name.length < 2) {
      return fail(400, { message: 'Inserisci il nome del giocatore', form: 'updatePlayer' });
    }
    // Prevent duplicate names on the same table (exclude the player being edited)
    // just load the table with the given tableId and check if any other player has the same name, if so return error
    const tableForCheck = await getTableById(tableId);
    if (!tableForCheck) return fail(404, { message: 'Tavolo non trovato :( Forse qualcuno l\'ha cancellato nel frattempo', form: 'updatePlayer' });
    const normalized = name.trim().toLowerCase();
    const duplicate = tableForCheck.players.some((p) => p.id !== playerId && p.name.trim().toLowerCase() === normalized);
    if (duplicate) return fail(400, { message: 'Nome già presente nel tavolo. Usa il tuo nickname!', form: 'updatePlayer' });

    const table = await updatePlayer(tableId, { id: playerId, name, isBeginner, isTeacher });
    if (!table) return fail(404, { message: 'Errore nella modifica del giocatore.', form: 'updatePlayer' });
    
    return { success: true, form: 'updatePlayer', table: table as Table };
  },

  joinTable: async ({ request }) => {
    const data = await request.formData();
    if (clean(data.get(HONEYPOT_FIELD), 32)) return fail(400, { message: 'Bot rilevato' });

    const tableId = clean(data.get('tableId'), 128);
    const name = clean(data.get('name'), NAME_LIMIT);
    const nightDate = clean(data.get('nightDate'), 32);
    const isBeginner = data.get('isBeginner') !== null;
    const isTeacher = data.get('isTeacher') !== null;
    
    if (name.length < 2) {
      return fail(400, { message: 'Inserisci il tuo nome', form: 'joinTable' });
    }
    let table = await listTables(nightDate).then(tables => tables.find(t => t.id === tableId));
    
    if (!table) {
      return fail(404, { message: 'Tavolo non trovato', form: 'joinTable' });
    }
    // add method to check if player name already exists in the table and return error if so
    const normalized = name.trim().toLowerCase();
    const duplicate = table.players.some((p) => p.name.trim().toLowerCase() === normalized);
    if (duplicate) return fail(400, { message: 'Nome già presente nel tavolo. Usa il tuo nickname!', form: 'joinTable' });
    
    table = await joinTable(tableId, name, isBeginner, isTeacher);
    if (!table) {
      return fail(404, { message: 'Tavolo non trovato', form: 'joinTable' });
    }
    return { success: true, form: 'joinTable', table: table as Table};
  },

  joinCategory: async ({ request }) => {
    const data = await request.formData();
    if (clean(data.get(HONEYPOT_FIELD), 32)) return fail(400, { message: 'Bot rilevato' });

    const weightRaw = clean(data.get('weight'), 64);
    const name = clean(data.get('name'), NAME_LIMIT);
    const nightDate = clean(data.get('nightDate'), 32);
    const createdAt = Date.now();
    if (!WEIGHTS.includes(weightRaw as (typeof WEIGHTS)[number])) {
      return fail(400, { message: 'Scegli il peso preferito', form: 'joinCategory' });
    }

    if (name.length < 2) {
      return fail(400, { message: 'Inserisci il tuo nome', form: 'joinCategory' });
    }

    // Check if spare player with same name, weight, and nightDate already exists
    const existingSparePlayers = await listSparePlayers(nightDate);
    const normalized = name.trim().toLowerCase();
    const weight = weightRaw as (typeof WEIGHTS)[number];
    const duplicate = existingSparePlayers.some(
      (sp) => sp.name.trim().toLowerCase() === normalized && sp.weight === weight
    );
    if (duplicate) {
      return fail(400, { 
        message: 'Un giocatore con questo nome è già presente nella lista per questo peso. Usa il tuo nickname!', 
        form: 'joinCategory' 
      });
    }

    await addSparePlayer(weight, name, nightDate);
    return { success: true, form: 'joinCategory', sparePlayer: { name, weight, nightDate, createdAt } };
  },

  deleteTable: async ({ request }) => {
    const data = await request.formData();
    if (clean(data.get(HONEYPOT_FIELD), 32)) return fail(400, { message: 'Bot rilevato' });

    const tableId = clean(data.get('tableId'), 128);
    const ok = await deleteTable(tableId);
    if (!ok) return fail(404, { message: 'Tavolo non trovato', form: 'deleteTable' });
    return { success: true, form: 'deleteTable', tableId: tableId as string };
  },

  deletePlayer: async ({ request }) => {
    const data = await request.formData();
    if (clean(data.get(HONEYPOT_FIELD), 32)) return fail(400, { message: 'Bot rilevato' });

    const tableId = clean(data.get('tableId'), 128);
    const playerId = clean(data.get('playerId'), 128);
    const table = await deletePlayer(tableId, playerId);
    if (!table) return fail(404, { message: 'Giocatore o tavolo non trovato', form: 'deletePlayer' });
    return { success: true, form: 'deletePlayer', table: table as Table };
  },

  deleteSparePlayer: async ({ request }) => {
    const data = await request.formData();
    if (clean(data.get(HONEYPOT_FIELD), 32)) return fail(400, { message: 'Bot rilevato' });

    const sparePlayerId = clean(data.get('id'), 128);
    const ok = await deleteSparePlayer(sparePlayerId);
    if (!ok) return fail(404, { message: 'Giocatore non trovato', form: 'deleteSparePlayer' });
    return { success: true, form: 'deleteSparePlayer', sparePlayerId: sparePlayerId as string };
  },

  setNightDate: async ({ request }) => {
    const data = await request.formData();
    if (clean(data.get(HONEYPOT_FIELD), 32)) return fail(400, { message: 'Bot rilevato' });

    const nightDate = clean(data.get('nightDate'), 32);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(nightDate)) {
      return fail(400, { message: 'Data non valida', form: 'setNightDate' });
    }

    return { success: true, form: 'setNightDate', nightDate: nightDate as string };
  }
};
