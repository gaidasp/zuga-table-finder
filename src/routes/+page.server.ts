import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';
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
  getSparePlayerById,
  getTableById
} from '$server/data';
import {
  authenticateWithGuid,
  createSession,
  revokeSession,
  SESSION_COOKIE_MAX_AGE,
  SESSION_COOKIE_NAME
} from '$server/auth';
import type { GameWeight, Table, BGGGame } from '$lib/types';


const NAME_LIMIT = 48;
const TITLE_LIMIT = 80;
const DESC_LIMIT = 240;
const HONEYPOT_FIELD = 'website';
const WEIGHTS: GameWeight[] = ['Party', 'Leggero (max 45 min)', 'Medio (1-2h)', 'Estremo (>2h)'];
const DATABASE_ERROR_MESSAGE = 'Database non disponibile al momento. Riprova piu tardi o verifica la configurazione MongoDB.';
const AUTH_REQUIRED_MESSAGE = 'Effettua il login per modificare dati.';

const sanitizeNightDate = (value: unknown) => {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, 32);
};

const isDatabaseError = (error: unknown) =>
  error instanceof Error && /(ENOTFOUND|ECONNREFUSED|Mongo|querySrv|MONGODB_URI|MONGO_URI)/i.test(error.message);

const buildFallbackPageData = (nightDate: string) => ({
  tables: [] as Table[],
  sparePlayers: [],
  weights: WEIGHTS,
  nightDate,
  databaseError: DATABASE_ERROR_MESSAGE
});

const handleDatabaseActionError = (error: unknown, form: string) => {
  if (isDatabaseError(error)) {
    return fail(503, { message: DATABASE_ERROR_MESSAGE, form, databaseUnavailable: true });
  }

  throw error;
};

const buildPageData = async (nightDateInput?: string) => {
  const nightDate = nightDateInput || getDefaultNightDate();

  try {
    const tables = await listTables(nightDate);
    const sparePlayers = await listSparePlayers(nightDate);
    return {
      tables: tables,
      sparePlayers: sparePlayers,
      weights: WEIGHTS,
      nightDate: nightDate,
      databaseError: null
    };
  } catch (error) {
    if (isDatabaseError(error)) {
      return buildFallbackPageData(nightDate);
    }

    throw error;
  }
};

const clean = (value: FormDataEntryValue | null, limit: number) =>
  (value?.toString().trim() ?? '').slice(0, limit);

const requireAuthenticated = (locals: App.Locals, form: string) => {
  if (!locals.user) {
    return fail(401, { message: AUTH_REQUIRED_MESSAGE, form, unauthorized: true });
  }

  return null;
};

const getNicknameForJoin = (locals: App.Locals, form: string) => {
  const nickname = clean(locals.user?.nickname ?? '', NAME_LIMIT);
  if (nickname.length < 2) {
    return fail(400, {
      message: 'Imposta prima un nickname nel profilo per unirti a tavoli o liste.',
      form
    });
  }

  return nickname;
};

const isAdminUser = (locals: App.Locals) => Boolean(locals.user?.isAdmin);



export const load: PageServerLoad = async () => buildPageData();

export const actions: Actions = {
  pageData: async ({ request }) => {
    const form = await request.formData();
    const nightDate = sanitizeNightDate(form.get('nightDate'));
    const payload = await buildPageData(nightDate);
    return payload;
  },

  signIn: async ({ request, cookies }) => {
    try {
      const data = await request.formData();
      if (clean(data.get(HONEYPOT_FIELD), 32)) return fail(400, { message: 'Bot rilevato', form: 'signIn' });

      const guid = clean(data.get('guid'), 128);
      if (guid.length < 8) {
        return fail(400, { message: 'Inserisci un codice valido', form: 'signIn' });
      }

      const user = await authenticateWithGuid(guid);
      if (!user) {
        return fail(401, { message: 'Codice non valido', form: 'signIn' });
      }

      const session = await createSession(user.id);
      cookies.set(SESSION_COOKIE_NAME, session.token, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: !dev,
        maxAge: SESSION_COOKIE_MAX_AGE
      });

      throw redirect(303, '/');
    } catch (error) {
      return handleDatabaseActionError(error, 'signIn');
    }
  },

  signOut: async ({ cookies }) => {
    try {
      const sessionToken = cookies.get(SESSION_COOKIE_NAME);
      await revokeSession(sessionToken);
      cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
      throw redirect(303, '/');
    } catch (error) {
      return handleDatabaseActionError(error, 'signOut');
    }
  },

  createTable: async ({ request, locals }) => {
    try {
      const authFailure = requireAuthenticated(locals, 'create');
      if (authFailure) return authFailure;

      const data = await request.formData();
      if (clean(data.get(HONEYPOT_FIELD), 32)) return fail(400, { message: 'Bot rilevato' });

      const title = clean(data.get('title'), TITLE_LIMIT);
      const description = clean(data.get('description'), DESC_LIMIT);
      const weightRaw = clean(data.get('weight'), 64);
      const seatsRaw = Number(data.get('seats'));
      const seats = Number.isFinite(seatsRaw) ? Math.min(Math.max(1, seatsRaw), 30) : 4;
      const nightDate = clean(data.get('nightDate'), 32);
      
      // Parse BGG game data
      const bggGameId = clean(data.get('bggGameId'), 64);
      const bggGameName = clean(data.get('bggGameName'), 256);
      const bggGameYear = clean(data.get('bggGameYear'), 16);
      const bggGame: BGGGame | null = bggGameId && bggGameName ? {
        id: bggGameId,
        name: bggGameName,
        yearPublished: bggGameYear || undefined,
        url: `https://boardgamegeek.com/boardgame/${bggGameId}`
      } : null;

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
      const createdTable = await createTable({
        title,
        description,
        seats,
        weight,
        creatorUserId: locals.user?.id,
        nightDate: nightDate,
        bggGame
      });
      return { success: true, form: 'create', table: createdTable as Table };
    } catch (error) {
      return handleDatabaseActionError(error, 'create');
    }
  },

  updateTable: async ({ request, locals }) => {
    try {
      const authFailure = requireAuthenticated(locals, 'update');
      if (authFailure) return authFailure;

      const data = await request.formData();
      if (clean(data.get(HONEYPOT_FIELD), 32)) return fail(400, { message: 'Bot rilevato' });

      const tableId = clean(data.get('tableId'), 128);
      const title = clean(data.get('title'), TITLE_LIMIT);
      const description = clean(data.get('description'), DESC_LIMIT);
      const weightRaw = clean(data.get('weight'), 64);
      const seatsRaw = Number(data.get('seats'));
      const seats = Number.isFinite(seatsRaw) ? Math.min(Math.max(1, seatsRaw), 30) : 4;
      
      // Parse BGG game data
      const bggGameId = clean(data.get('bggGameId'), 64);
      const bggGameName = clean(data.get('bggGameName'), 256);
      const bggGameYear = clean(data.get('bggGameYear'), 16);
      const bggGame: BGGGame | null = bggGameId && bggGameName ? {
        id: bggGameId,
        name: bggGameName,
        yearPublished: bggGameYear || undefined,
        url: `https://boardgamegeek.com/boardgame/${bggGameId}`
      } : null;

      if (title.length < 3) {
        return fail(400, { message: 'Titolo troppo corto', form: 'update' });
      }

      if (!WEIGHTS.includes(weightRaw as (typeof WEIGHTS)[number])) {
        return fail(400, { message: 'Seleziona il peso del tavolo', form: 'update' });
      }

      // Check for duplicate title
      const existingTable = await getTableById(tableId);
      if (!existingTable) return fail(404, { message: 'Tavolo non trovato', form: 'update' });

      if (!existingTable.creatorUserId || existingTable.creatorUserId !== locals.user?.id) {
        if (!isAdminUser(locals)) {
          return fail(403, {
            message: 'Solo il creatore del tavolo o un admin può modificarlo.',
            form: 'update'
          });
        }
      }

      const tablesForNight = await listTables(existingTable.nightDate);
      const duplicateTitle = tablesForNight.some(t => t.id !== tableId && t.title.trim().toLowerCase() === title.trim().toLowerCase());
      if (duplicateTitle) {
        return fail(400, { message: 'Esiste già un tavolo con questo titolo per questa serata', form: 'update' });
      }

      const weight = weightRaw as (typeof WEIGHTS)[number];
      const table = await updateTable(tableId, { title, description, seats, weight, bggGame });
      if (!table) return fail(404, { message: 'Tavolo non trovato', form: 'update' });

      
      return { success: true, form: 'update', table: table as Table };
    } catch (error) {
      return handleDatabaseActionError(error, 'update');
    }
  },

  updatePlayer: async ({ request, locals }) => {
    try {
      const authFailure = requireAuthenticated(locals, 'updatePlayer');
      if (authFailure) return authFailure;

      const data = await request.formData();
      if (clean(data.get(HONEYPOT_FIELD), 32)) return fail(400, { message: 'Bot rilevato' });

      const tableId = clean(data.get('tableId'), 128);
      const playerId = clean(data.get('playerId'), 128);
      const isBeginner = data.get('isBeginner') !== null;
      const isTeacher = data.get('isTeacher') !== null;

      const tableForCheck = await getTableById(tableId);
      if (!tableForCheck) return fail(404, { message: 'Tavolo non trovato :( Forse qualcuno l\'ha cancellato nel frattempo', form: 'updatePlayer' });
      const targetPlayer = tableForCheck.players.find((player) => player.id === playerId);
      if (!targetPlayer) return fail(404, { message: 'Giocatore non trovato', form: 'updatePlayer' });

      const canManageTargetPlayer =
        isAdminUser(locals) || Boolean(targetPlayer.userId && targetPlayer.userId === locals.user?.id);
      if (!canManageTargetPlayer) {
        return fail(403, {
          message: 'Puoi modificare solo il tuo giocatore. Gli admin possono modificare tutti.',
          form: 'updatePlayer'
        });
      }

      const table = await updatePlayer(tableId, { id: playerId, isBeginner, isTeacher });
      if (!table) return fail(404, { message: 'Errore nella modifica del giocatore.', form: 'updatePlayer' });
      
      return { success: true, form: 'updatePlayer', table: table as Table };
    } catch (error) {
      return handleDatabaseActionError(error, 'updatePlayer');
    }
  },

  joinTable: async ({ request, locals }) => {
    try {
      const authFailure = requireAuthenticated(locals, 'joinTable');
      if (authFailure) return authFailure;

      const data = await request.formData();
      if (clean(data.get(HONEYPOT_FIELD), 32)) return fail(400, { message: 'Bot rilevato' });

      const tableId = clean(data.get('tableId'), 128);
      const name = clean(data.get('name'), NAME_LIMIT);
      if (name.length < 2) {
        return fail(400, { message: 'Inserisci un nome valido (almeno 2 caratteri).', form: 'joinTable' });
      }
      const nightDate = clean(data.get('nightDate'), 32);
      const isBeginner = data.get('isBeginner') !== null;
      const isTeacher = data.get('isTeacher') !== null;

      const ownNickname = clean(locals.user?.nickname ?? '', NAME_LIMIT);
      const isOwnProfilePlayer =
        ownNickname.length > 0 && ownNickname.trim().toLowerCase() === name.trim().toLowerCase();
      const linkedUserId = isOwnProfilePlayer ? locals.user?.id : undefined;
      const linkedAvatarColor = isOwnProfilePlayer ? locals.user?.avatarColor : undefined;

      let table = await listTables(nightDate).then(tables => tables.find(t => t.id === tableId));
      
      if (!table) {
        return fail(404, { message: 'Tavolo non trovato', form: 'joinTable' });
      }
      // add method to check if player name already exists in the table and return error if so
      const normalized = name.trim().toLowerCase();
      const duplicate = table.players.some((p) => p.name.trim().toLowerCase() === normalized);
      if (duplicate) return fail(400, { message: 'Nome già presente nel tavolo. Usa il tuo nickname!', form: 'joinTable' });
      
      table = await joinTable(tableId, name, linkedUserId, linkedAvatarColor, isBeginner, isTeacher);
      if (!table) {
        return fail(404, { message: 'Tavolo non trovato', form: 'joinTable' });
      }
      return { success: true, form: 'joinTable', table: table as Table};
    } catch (error) {
      return handleDatabaseActionError(error, 'joinTable');
    }
  },

  joinCategory: async ({ request, locals }) => {
    try {
      const authFailure = requireAuthenticated(locals, 'joinCategory');
      if (authFailure) return authFailure;

      const data = await request.formData();
      if (clean(data.get(HONEYPOT_FIELD), 32)) return fail(400, { message: 'Bot rilevato' });

      const weightRaw = clean(data.get('weight'), 64);
      const nameOrFailure = getNicknameForJoin(locals, 'joinCategory');
      if (typeof nameOrFailure !== 'string') return nameOrFailure;
      const name = nameOrFailure;
      const nightDate = clean(data.get('nightDate'), 32);
      const createdAt = Date.now();
      if (!WEIGHTS.includes(weightRaw as (typeof WEIGHTS)[number])) {
        return fail(400, { message: 'Scegli il peso preferito', form: 'joinCategory' });
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

      await addSparePlayer(weight, name, locals.user?.id, locals.user?.avatarColor, nightDate);
      return {
        success: true,
        form: 'joinCategory',
        sparePlayer: { name, avatarColor: locals.user?.avatarColor, weight, nightDate, createdAt }
      };
    } catch (error) {
      return handleDatabaseActionError(error, 'joinCategory');
    }
  },

  deleteTable: async ({ request, locals }) => {
    try {
      const authFailure = requireAuthenticated(locals, 'deleteTable');
      if (authFailure) return authFailure;

      const data = await request.formData();
      if (clean(data.get(HONEYPOT_FIELD), 32)) return fail(400, { message: 'Bot rilevato' });

      const tableId = clean(data.get('tableId'), 128);
      const table = await getTableById(tableId);
      if (!table) return fail(404, { message: 'Tavolo non trovato', form: 'deleteTable' });
      if (!table.creatorUserId || table.creatorUserId !== locals.user?.id) {
        if (!isAdminUser(locals)) {
          return fail(403, {
            message: 'Solo il creatore del tavolo o un admin può eliminarlo.',
            form: 'deleteTable'
          });
        }
      }

      const ok = await deleteTable(tableId);
      if (!ok) return fail(404, { message: 'Tavolo non trovato', form: 'deleteTable' });
      return { success: true, form: 'deleteTable', tableId: tableId as string };
    } catch (error) {
      return handleDatabaseActionError(error, 'deleteTable');
    }
  },

  deletePlayer: async ({ request, locals }) => {
    try {
      const authFailure = requireAuthenticated(locals, 'deletePlayer');
      if (authFailure) return authFailure;

      const data = await request.formData();
      if (clean(data.get(HONEYPOT_FIELD), 32)) return fail(400, { message: 'Bot rilevato' });

      const tableId = clean(data.get('tableId'), 128);
      const playerId = clean(data.get('playerId'), 128);
      const tableBeforeDelete = await getTableById(tableId);
      if (!tableBeforeDelete) return fail(404, { message: 'Tavolo non trovato', form: 'deletePlayer' });

      const targetPlayer = tableBeforeDelete.players.find((player) => player.id === playerId);
      if (!targetPlayer) return fail(404, { message: 'Giocatore non trovato', form: 'deletePlayer' });

      const canDeleteTargetPlayer =
        isAdminUser(locals) || Boolean(targetPlayer.userId && targetPlayer.userId === locals.user?.id);
      if (!canDeleteTargetPlayer) {
        return fail(403, {
          message: 'Puoi rimuovere solo il tuo nome dal tavolo. Gli admin possono rimuovere tutti.',
          form: 'deletePlayer'
        });
      }

      const table = await deletePlayer(tableId, playerId);
      if (!table) return fail(404, { message: 'Giocatore o tavolo non trovato', form: 'deletePlayer' });
      return { success: true, form: 'deletePlayer', table: table as Table };
    } catch (error) {
      return handleDatabaseActionError(error, 'deletePlayer');
    }
  },

  deleteSparePlayer: async ({ request, locals }) => {
    try {
      const authFailure = requireAuthenticated(locals, 'deleteSparePlayer');
      if (authFailure) return authFailure;

      const data = await request.formData();
      if (clean(data.get(HONEYPOT_FIELD), 32)) return fail(400, { message: 'Bot rilevato' });

      const sparePlayerId = clean(data.get('id'), 128);
      const sparePlayer = await getSparePlayerById(sparePlayerId);
      if (!sparePlayer) return fail(404, { message: 'Giocatore non trovato', form: 'deleteSparePlayer' });

      const canDeleteSpare =
        isAdminUser(locals) || Boolean(sparePlayer.userId && sparePlayer.userId === locals.user?.id);
      if (!canDeleteSpare) {
        return fail(403, {
          message: 'Puoi rimuovere solo il tuo nome dalla lista. Gli admin possono rimuovere tutti.',
          form: 'deleteSparePlayer'
        });
      }

      const ok = await deleteSparePlayer(sparePlayerId);
      if (!ok) return fail(404, { message: 'Giocatore non trovato', form: 'deleteSparePlayer' });
      return { success: true, form: 'deleteSparePlayer', sparePlayerId: sparePlayerId as string };
    } catch (error) {
      return handleDatabaseActionError(error, 'deleteSparePlayer');
    }
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
