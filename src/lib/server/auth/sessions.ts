import { randomBytes, randomUUID } from 'crypto';
import type { AuthUser } from '$lib/types';
import {
  authCollection,
  hashValue,
  toAuthUser,
  toSessionDoc,
  toUserDoc,
  type SessionDoc
} from './common';

export const SESSION_COOKIE_NAME = 'zuga_session';
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const SESSION_COOKIE_MAX_AGE = Math.floor(SESSION_TTL_MS / 1000);

export const createSession = async (userId: string): Promise<{ token: string; expiresAt: number }> => {
  const collection = await authCollection();
  const now = Date.now();
  const token = randomBytes(32).toString('hex');
  const tokenHash = hashValue(token);
  const expiresAt = now + SESSION_TTL_MS;

  const sessionDoc: SessionDoc = {
    _id: randomUUID(),
    kind: 'session',
    userId,
    tokenHash,
    createdAt: now,
    expiresAt
  };

  await collection.insertOne(sessionDoc);

  return { token, expiresAt };
};

export const revokeSession = async (token: string | undefined) => {
  if (!token) return;
  const collection = await authCollection();
  const tokenHash = hashValue(token);
  await collection.deleteMany({ kind: 'session', tokenHash });
};

export const resolveUserFromSession = async (token: string | undefined): Promise<AuthUser | null> => {
  if (!token) return null;

  const collection = await authCollection();
  const tokenHash = hashValue(token);
  const session = toSessionDoc(await collection.findOne({ kind: 'session', tokenHash }));
  if (!session) return null;

  const now = Date.now();
  if (session.expiresAt <= now) {
    await collection.deleteOne({ _id: session._id, kind: 'session' });
    return null;
  }

  const user = toUserDoc(await collection.findOne({ _id: session.userId, kind: 'user' }));
  return user ? toAuthUser(user) : null;
};
