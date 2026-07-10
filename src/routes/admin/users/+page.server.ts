import type { Actions, PageServerLoad } from './$types';
import { error, fail } from '@sveltejs/kit';
import {
  createUserWithGuid,
  deleteManagedUser,
  listUsers,
  updateManagedUser
} from '$server/auth';

const NICKNAME_LIMIT = 48;
const GUID_LIMIT = 128;
const MAX_BATCH = 30;

const clean = (value: FormDataEntryValue | null, limit: number) =>
  (value?.toString().trim() ?? '').slice(0, limit);

const requireAdmin = (locals: App.Locals) => {
  if (!locals.user?.isAdmin) {
    throw error(403, 'Permesso negato. Solo gli admin possono accedere a questa pagina.');
  }
};

export const load: PageServerLoad = async ({ locals }) => {
  requireAdmin(locals);

  return {
    isAdmin: true,
    users: await listUsers()
  };
};

export const actions: Actions = {
  createUsers: async ({ request, locals }) => {
    requireAdmin(locals);

    const data = await request.formData();

    const nickname = clean(data.get('nickname'), NICKNAME_LIMIT);
    const requestedCountRaw = Number(clean(data.get('count'), 4));
    const requestedCount = Number.isFinite(requestedCountRaw)
      ? Math.min(Math.max(1, requestedCountRaw), MAX_BATCH)
      : 1;
    const makeAdmin = data.get('makeAdmin') !== null;

    const created = [] as Array<{ guid: string }>;

    for (let i = 0; i < requestedCount; i += 1) {
      const nicknameForUser = requestedCount === 1 ? nickname : null;
      const { guid } = await createUserWithGuid({
        nickname: nicknameForUser,
        isAdmin: makeAdmin
      });
      created.push({ guid });
    }

    return {
      success: true,
      form: 'createUsers',
      message: `${created.length} codice/i creati con successo.`,
      generatedCodes: created.map((item) => item.guid),
      users: await listUsers()
    };
  },

  editUser: async ({ request, locals }) => {
    requireAdmin(locals);

    const data = await request.formData();
    const userId = clean(data.get('userId'), 128);
    const nickname = clean(data.get('nickname'), NICKNAME_LIMIT);
    const guid = clean(data.get('guid'), GUID_LIMIT);
    const isAdmin = data.get('isAdmin') !== null;
    const usersBefore = await listUsers();
    const targetUser = usersBefore.find((user) => user.id === userId);
    const adminCount = usersBefore.filter((user) => user.isAdmin).length;

    if (!userId) {
      return fail(400, { form: 'editUser', message: 'Utente non valido.' });
    }

    if (!targetUser) {
      return fail(404, { form: 'editUser', message: 'Utente non trovato.' });
    }

    if (guid.length < 8) {
      return fail(400, { form: 'editUser', message: 'GUID troppo corto (minimo 8 caratteri).' });
    }

    const duplicateGuid = usersBefore.find((user) => user.id !== userId && user.code === guid);
    if (duplicateGuid) {
      return fail(400, { form: 'editUser', message: 'GUID gia in uso da un altro utente.' });
    }

    if (locals.user?.id === userId && !isAdmin) {
      return fail(400, {
        form: 'editUser',
        message: 'Non puoi rimuovere il ruolo admin dal tuo account mentre sei loggato.'
      });
    }

    if (targetUser.isAdmin && !isAdmin && adminCount <= 2) {
      return fail(400, {
        form: 'editUser',
        message: 'Devi mantenere almeno 2 admin. Non puoi rimuovere questo ruolo adesso.'
      });
    }

    const updated = await updateManagedUser(userId, {
      nickname,
      isAdmin,
      guid
    });

    if (!updated) {
      return fail(404, { form: 'editUser', message: 'Utente non trovato.' });
    }

    return {
      success: true,
      form: 'editUser',
      message: 'Utente aggiornato con successo.',
      users: await listUsers()
    };
  },

  deleteUser: async ({ request, locals }) => {
    requireAdmin(locals);

    const data = await request.formData();
    const userId = clean(data.get('userId'), 128);
    const usersBefore = await listUsers();
    const targetUser = usersBefore.find((user) => user.id === userId);
    const adminCount = usersBefore.filter((user) => user.isAdmin).length;

    if (!userId) {
      return fail(400, { form: 'deleteUser', message: 'Utente non valido.' });
    }

    if (!targetUser) {
      return fail(404, { form: 'deleteUser', message: 'Utente non trovato.' });
    }

    if (locals.user?.id === userId) {
      return fail(400, { form: 'deleteUser', message: 'Non puoi eliminare il tuo account attuale.' });
    }

    if (targetUser.isAdmin && adminCount <= 2) {
      return fail(400, {
        form: 'deleteUser',
        message: 'Devi mantenere almeno 2 admin. Non puoi eliminare questo utente adesso.'
      });
    }

    const deleted = await deleteManagedUser(userId);
    if (!deleted) {
      return fail(404, { form: 'deleteUser', message: 'Utente non trovato.' });
    }

    return {
      success: true,
      form: 'deleteUser',
      message: 'Utente eliminato con successo.',
      users: await listUsers()
    };
  }
};
