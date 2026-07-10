import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import {
  AVATAR_ALLOWED_MIME_TYPES,
  AVATAR_MAX_BYTES,
  getUserById,
  removeUserAvatar,
  updateUserProfile
} from '$server/auth';

const NICKNAME_LIMIT = 48;

const clean = (value: FormDataEntryValue | null, limit: number) =>
  (value?.toString().trim() ?? '').slice(0, limit);

const requireAuthenticated = (locals: App.Locals) => {
  if (!locals.user) {
    return fail(401, { message: 'Effettua il login per modificare il profilo.' });
  }

  return null;
};

export const load: PageServerLoad = async ({ locals, setHeaders, url }) => {
  setHeaders({
    'cache-control': 'no-store, no-cache, must-revalidate, max-age=0'
  });

  if (!locals.user) {
    throw redirect(303, '/');
  }

  const freshUser = await getUserById(locals.user.id);
  const user = freshUser ?? locals.user;

  const message =
    url.searchParams.get('updated') === '1'
      ? 'Profilo aggiornato con successo.'
      : url.searchParams.get('avatarRemoved') === '1'
        ? 'Avatar rimosso.'
        : null;

  return { user, message };
};

export const actions: Actions = {
  updateProfile: async ({ request, locals }) => {
    const authFailure = requireAuthenticated(locals);
    if (authFailure) return authFailure;

    const data = await request.formData();
    const nickname = clean(data.get('nickname'), NICKNAME_LIMIT);
    const avatar = data.get('avatar');

    let avatarDataUrl: string | null | undefined;
    if (avatar instanceof File && avatar.size > 0) {
      if (!AVATAR_ALLOWED_MIME_TYPES.includes(avatar.type as (typeof AVATAR_ALLOWED_MIME_TYPES)[number])) {
        return fail(400, {
          message: 'Formato immagine non supportato. Usa PNG, JPG o WEBP.'
        });
      }

      if (avatar.size > AVATAR_MAX_BYTES) {
        return fail(400, {
          message: 'Immagine troppo grande. Usa un file entro 1.5MB.'
        });
      }

      const bytes = Buffer.from(await avatar.arrayBuffer());
      avatarDataUrl = `data:${avatar.type};base64,${bytes.toString('base64')}`;
    }

    const updatedUser = await updateUserProfile(locals.user!.id, {
      nickname,
      avatarDataUrl
    });

    if (!updatedUser) {
      return fail(404, { message: 'Utente non trovato.' });
    }

    locals.user = updatedUser;
    throw redirect(303, '/profile?updated=1');
  },

  removeAvatar: async ({ locals }) => {
    const authFailure = requireAuthenticated(locals);
    if (authFailure) return authFailure;

    const updatedUser = await removeUserAvatar(locals.user!.id);
    if (!updatedUser) {
      return fail(404, { message: 'Utente non trovato.' });
    }

    locals.user = updatedUser;
    throw redirect(303, '/profile?avatarRemoved=1');
  }
};
