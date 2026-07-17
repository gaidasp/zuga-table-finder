import { fail } from '@sveltejs/kit';
import { AUTH_REQUIRED_MESSAGE, DATABASE_ERROR_MESSAGE, NAME_LIMIT } from './constants';

export const clean = (value: FormDataEntryValue | null, limit: number) =>
  (value?.toString().trim() ?? '').slice(0, limit);

export const cleanInt = (
  value: FormDataEntryValue | null,
  min: number,
  max: number
): number | undefined => {
  if (value === null) return undefined;
  const raw = Number(value);
  if (!Number.isFinite(raw)) return undefined;
  return Math.min(max, Math.max(min, Math.round(raw)));
};

export const requireAuthenticated = (locals: App.Locals, form: string) => {
  if (!locals.user) {
    return fail(401, { message: AUTH_REQUIRED_MESSAGE, form, unauthorized: true });
  }

  return null;
};

export const getNicknameForJoin = (locals: App.Locals, form: string) => {
  const nickname = clean(locals.user?.nickname ?? '', NAME_LIMIT);
  if (nickname.length < 2) {
    return fail(400, {
      message: 'Imposta prima un nickname nel profilo per unirti a tavoli o liste.',
      form
    });
  }

  return nickname;
};

export const isAdminUser = (locals: App.Locals) => Boolean(locals.user?.isAdmin);

export const isDatabaseError = (error: unknown) =>
  error instanceof Error &&
  /(ENOTFOUND|ECONNREFUSED|Mongo|querySrv|MONGODB_URI|MONGO_URI)/i.test(error.message);

export const handleDatabaseActionError = (error: unknown, form: string) => {
  if (isDatabaseError(error)) {
    console.error('[db-error][action]', form, error);
    return fail(503, { message: DATABASE_ERROR_MESSAGE, form, databaseUnavailable: true });
  }

  throw error;
};
