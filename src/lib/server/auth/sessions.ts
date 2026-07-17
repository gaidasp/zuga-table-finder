import { createHmac, randomUUID, timingSafeEqual } from 'crypto';
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

const JWT_ALG = 'HS256';
const JWT_TYP = 'JWT';

type SessionJwtPayload = {
  sub: string;
  jti: string;
  iat: number;
  exp: number;
};

const encodeBase64Url = (value: string) =>
  Buffer.from(value, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

const decodeBase64Url = (value: string) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(padded, 'base64').toString('utf8');
};

const getJwtSecret = () =>
  process.env.JWT_SECRET?.trim() || process.env.ADMIN_MASTER_CODE?.trim() || 'zuga-dev-secret-change-me';

const createSignature = (input: string) => {
  const secret = getJwtSecret();
  return createHmac('sha256', secret)
    .update(input)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
};

const signJwt = (payload: SessionJwtPayload) => {
  const header = encodeBase64Url(JSON.stringify({ alg: JWT_ALG, typ: JWT_TYP }));
  const body = encodeBase64Url(JSON.stringify(payload));
  const signingInput = `${header}.${body}`;
  const signature = createSignature(signingInput);
  return `${signingInput}.${signature}`;
};

const safeEqual = (a: string, b: string) => {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
};

const verifyJwt = (token: string): SessionJwtPayload | null => {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [headerPart, payloadPart, signaturePart] = parts;
  const expectedSignature = createSignature(`${headerPart}.${payloadPart}`);
  if (!safeEqual(signaturePart, expectedSignature)) return null;

  try {
    const header = JSON.parse(decodeBase64Url(headerPart)) as { alg?: string; typ?: string };
    if (header.alg !== JWT_ALG || header.typ !== JWT_TYP) return null;

    const payload = JSON.parse(decodeBase64Url(payloadPart)) as Partial<SessionJwtPayload>;
    if (
      typeof payload.sub !== 'string' ||
      typeof payload.jti !== 'string' ||
      typeof payload.iat !== 'number' ||
      typeof payload.exp !== 'number'
    ) {
      return null;
    }

    if (payload.exp * 1000 <= Date.now()) return null;

    return payload as SessionJwtPayload;
  } catch {
    return null;
  }
};

export const createSession = async (userId: string): Promise<{ token: string; expiresAt: number }> => {
  const collection = await authCollection();
  const now = Date.now();
  const issuedAt = Math.floor(now / 1000);
  const expiresAt = issuedAt + SESSION_COOKIE_MAX_AGE;
  const token = signJwt({
    sub: userId,
    jti: randomUUID(),
    iat: issuedAt,
    exp: expiresAt
  });
  const tokenHash = hashValue(token);

  const sessionDoc: SessionDoc = {
    _id: randomUUID(),
    kind: 'session',
    userId,
    tokenHash,
    createdAt: now,
    expiresAt: expiresAt * 1000
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

  const payload = verifyJwt(token);
  if (!payload) return null;

  const collection = await authCollection();
  const tokenHash = hashValue(token);
  const session = toSessionDoc(await collection.findOne({ kind: 'session', tokenHash }));
  if (!session) return null;

  if (session.userId !== payload.sub) {
    await collection.deleteOne({ _id: session._id, kind: 'session' });
    return null;
  }

  const now = Date.now();
  if (session.expiresAt <= now || payload.exp * 1000 <= now) {
    await collection.deleteOne({ _id: session._id, kind: 'session' });
    return null;
  }

  const user = toUserDoc(await collection.findOne({ _id: payload.sub, kind: 'user' }));
  return user ? toAuthUser(user) : null;
};
