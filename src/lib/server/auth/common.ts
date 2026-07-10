import { createHash } from 'crypto';
import type { Filter, UpdateFilter, UpdateOptions } from 'mongodb';
import type { AuthUser, AuthUserSummary } from '$lib/types';
import { db } from '$server/data';
import { getAvatarBgClass } from '$lib/shared/utils/avatar';

const AUTH_COLLECTION_NAME = 'ZugaTableFinder';
const NICKNAME_LIMIT = 48;
const GUID_LIMIT = 128;

export const AVATAR_MAX_BYTES = 1_500_000;
export const AVATAR_ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;

export type UserDoc = {
  _id: string;
  kind: 'user';
  guid: string;
  codeHash?: string;
  codePreview?: string;
  avatarColor?: string;
  nickname: string | null;
  avatarDataUrl: string | null;
  isAdmin: boolean;
  createdAt: number;
  updatedAt: number;
  lastLoginAt: number | null;
};

export type SessionDoc = {
  _id: string;
  kind: 'session';
  userId: string;
  tokenHash: string;
  createdAt: number;
  expiresAt: number;
};

export type AuthDoc = UserDoc | SessionDoc;

export const authCollection = async () => (await db()).collection<AuthDoc>(AUTH_COLLECTION_NAME);

export const hashValue = (value: string) => createHash('sha256').update(value).digest('hex');

export const toAuthUser = (doc: UserDoc): AuthUser => ({
  id: doc._id,
  nickname: doc.nickname,
  avatarDataUrl: doc.avatarDataUrl,
  avatarColor: doc.avatarColor ?? getAvatarBgClass(doc._id),
  isAdmin: doc.isAdmin
});

export const toAuthUserSummary = (doc: UserDoc): AuthUserSummary => ({
  ...toAuthUser(doc),
  code: doc.guid,
  createdAt: doc.createdAt
});

export const cleanNickname = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const trimmed = value.trim().slice(0, NICKNAME_LIMIT);
  return trimmed.length > 0 ? trimmed : null;
};

export const normalizeCode = (value: string | null | undefined) => (value ?? '').trim().slice(0, 128);
export const normalizeGuid = (value: string | null | undefined) => (value ?? '').trim().slice(0, GUID_LIMIT);

export const propagateNicknameToParticipations = async (userId: string, nickname: string | null) => {
  if (!nickname) return;

  const collection = await authCollection();

  const tableFilter = { kind: 'table', 'players.userId': userId } as unknown as Filter<AuthDoc>;
  const tableUpdate = { $set: { 'players.$[player].name': nickname } } as unknown as UpdateFilter<AuthDoc>;
  const tableOptions = { arrayFilters: [{ 'player.userId': userId }] } as unknown as UpdateOptions;
  await collection.updateMany(
    tableFilter,
    tableUpdate,
    tableOptions
  );

  const spareFilter = { kind: 'spare', userId } as unknown as Filter<AuthDoc>;
  const spareUpdate = { $set: { name: nickname } } as unknown as UpdateFilter<AuthDoc>;
  await collection.updateMany(
    spareFilter,
    spareUpdate
  );
};

export const toUserDoc = (doc: AuthDoc | null): UserDoc | null => {
  if (!doc || doc.kind !== 'user') return null;
  const userDoc = doc as Partial<UserDoc> & { kind: 'user'; _id: string };
  if (typeof userDoc.guid === 'string' && userDoc.guid.length > 0) {
    return userDoc as UserDoc;
  }

  return null;
};

export const toSessionDoc = (doc: AuthDoc | null): SessionDoc | null => {
  if (!doc || doc.kind !== 'session') return null;
  return doc;
};
