import { randomUUID } from 'crypto';
import { getRandomAvatarBgClass } from '$lib/shared/utils/avatar';
import type { AuthUser, AuthUserSummary } from '$lib/types';
import {
  authCollection,
  cleanNickname,
  hashValue,
  normalizeCode,
  normalizeGuid,
  propagateNicknameToParticipations,
  toAuthUser,
  toAuthUserSummary,
  toUserDoc,
  type UserDoc
} from './common';

export const hasAdminMasterCode = () => Boolean(process.env.ADMIN_MASTER_CODE?.trim());

export const validateAdminMasterCode = (input: string | null | undefined) => {
  const expected = process.env.ADMIN_MASTER_CODE?.trim();
  if (!expected) return false;
  return normalizeCode(input) === expected;
};

export const createUserWithCode = async (input?: {
  nickname?: string | null;
  isAdmin?: boolean;
}): Promise<{ user: AuthUser; code: string }> => {
  const collection = await authCollection();
  let code = randomUUID();

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const exists = await collection.findOne({ kind: 'user', code });
    if (!exists) break;
    code = randomUUID();
  }

  const now = Date.now();
  const userDoc: UserDoc = {
    _id: randomUUID(),
    kind: 'user',
    code,
    avatarColor: getRandomAvatarBgClass(),
    nickname: cleanNickname(input?.nickname),
    avatarDataUrl: null,
    isAdmin: Boolean(input?.isAdmin),
    createdAt: now,
    updatedAt: now,
    lastLoginAt: null,
    preferredView: 'vertical',
  };

  await collection.insertOne(userDoc);

  return {
    user: toAuthUser(userDoc),
    code
  };
};

export const authenticateWithCode = async (codeInput: string): Promise<AuthUser | null> => {
  const code = normalizeCode(codeInput);
  if (!code) return null;

  const collection = await authCollection();
  const plainCodeMatch = toUserDoc(await collection.findOne({ kind: 'user', code }));
  const codeHash = hashValue(code);
  const legacyHashedMatch = toUserDoc(
    await collection.findOne({ kind: 'user', codeHash, code: { $exists: false } })
  );
  const doc = plainCodeMatch ?? legacyHashedMatch;
  if (!doc) return null;

  const now = Date.now();
  await collection.updateOne(
    { _id: doc._id, kind: 'user' },
    { $set: { lastLoginAt: now, updatedAt: now } }
  );

  return toAuthUser({ ...doc, lastLoginAt: now, updatedAt: now });
};

export const getUserById = async (userId: string): Promise<AuthUser | null> => {
  const collection = await authCollection();
  const user = toUserDoc(await collection.findOne({ _id: userId, kind: 'user' }));
  return user ? toAuthUser(user) : null;
};

export const listUsers = async (): Promise<AuthUserSummary[]> => {
  const collection = await authCollection();
  const users = await collection
    .find({ kind: 'user' })
    .sort({ createdAt: -1 })
    .toArray();

  return users
    .map((doc) => toUserDoc(doc))
    .filter((doc): doc is UserDoc => Boolean(doc))
    .map(toAuthUserSummary);
};

export const updateManagedUser = async (
  userId: string,
  input: {
    nickname?: string | null;
    isAdmin?: boolean;
    code?: string | null;
  }
): Promise<AuthUserSummary | null> => {
  const collection = await authCollection();
  const now = Date.now();
  const set: Partial<UserDoc> = {
    updatedAt: now
  };

  if (input.nickname !== undefined) {
    set.nickname = cleanNickname(input.nickname);
  }

  if (input.isAdmin !== undefined) {
    set.isAdmin = Boolean(input.isAdmin);
  }

  if (input.code !== undefined) {
    const code = normalizeGuid(input.code);
    if (!code) {
      throw new Error('GUID_INVALID');
    }

    const existingWithGuid = await collection.findOne({ kind: 'user', code });
    if (existingWithGuid && typeof existingWithGuid._id === 'string' && existingWithGuid._id !== userId) {
      throw new Error('GUID_ALREADY_IN_USE');
    }

    set.code = code;
  }

  const result = await collection.findOneAndUpdate(
    { _id: userId, kind: 'user' },
    { $set: set },
    { returnDocument: 'after' }
  );

  const userDoc = toUserDoc(result);

  if (userDoc && input.nickname !== undefined) {
    await propagateNicknameToParticipations(userId, userDoc.nickname);
  }

  return userDoc ? toAuthUserSummary(userDoc) : null;
};

export const deleteManagedUser = async (userId: string): Promise<boolean> => {
  const collection = await authCollection();
  await collection.deleteMany({ kind: 'session', userId });
  const result = await collection.deleteOne({ _id: userId, kind: 'user' });
  return result.deletedCount > 0;
};

export const updateUserProfile = async (
  userId: string,
  input: {
    nickname?: string | null;
    avatarDataUrl?: string | null;
  }
): Promise<AuthUser | null> => {
  const collection = await authCollection();
  const now = Date.now();
  const set: Partial<UserDoc> = {
    updatedAt: now
  };

  if (input.nickname !== undefined) {
    set.nickname = cleanNickname(input.nickname);
  }

  if (input.avatarDataUrl !== undefined) {
    set.avatarDataUrl = input.avatarDataUrl;
  }

  const result = await collection.findOneAndUpdate(
    { _id: userId, kind: 'user' },
    { $set: set },
    { returnDocument: 'after' }
  );
  const userDoc = toUserDoc(result);

  if (userDoc && input.nickname !== undefined) {
    await propagateNicknameToParticipations(userId, userDoc.nickname);
  }

  return userDoc ? toAuthUser(userDoc) : null;
};

export const removeUserAvatar = async (userId: string): Promise<AuthUser | null> =>
  updateUserProfile(userId, { avatarDataUrl: null });

export const updateUserPreferredView = async (
  userId: string,
  preferredView: 'vertical' | 'horizontal'
): Promise<AuthUser | null> => {
  const collection = await authCollection();
  const now = Date.now();

  const result = await collection.findOneAndUpdate(
    { _id: userId, kind: 'user' },
    { $set: { preferredView, updatedAt: now } },
    { returnDocument: 'after' }
  );

  const userDoc = toUserDoc(result);
  return userDoc ? toAuthUser(userDoc) : null;
};
