import { randomUUID } from 'crypto';
import type { GameWeight, SparePlayer } from '$lib/types';
import { db } from './mongo';

type SparePlayerDoc = Omit<SparePlayer, 'id'> & { _id: string; kind: 'spare' };

const spareCollection = async () => (await db()).collection<SparePlayerDoc>('ZugaTableFinder');

const mapSparePlayer = (doc: SparePlayerDoc): SparePlayer => ({
  id: doc._id,
  name: doc.name,
  userId: doc.userId,
  ownerUserId: doc.ownerUserId,
  avatarColor: doc.avatarColor,
  weight: doc.weight,
  nightDate: doc.nightDate,
  createdAt: doc.createdAt
});

export async function listSparePlayers(nightDate?: string): Promise<SparePlayer[]> {
  const collection = await spareCollection();
  const items = await collection
    .find({ kind: 'spare', nightDate: nightDate })
    .sort({ createdAt: -1 })
    .toArray();

  return items.map(mapSparePlayer);
}

export async function addSparePlayer(
  weight: GameWeight,
  name: string,
  userId: string | undefined,
  ownerUserId: string | undefined,
  avatarColor: string | undefined,
  nightDate: string,
  createdAt: number = Date.now()
): Promise<SparePlayer> {
  const sparePlayer: SparePlayerDoc = {
    _id: randomUUID(),
    kind: 'spare',
    weight,
    name,
    userId,
    ownerUserId,
    avatarColor,
    nightDate,
    createdAt
  };
  await (await spareCollection()).insertOne(sparePlayer);
  return mapSparePlayer(sparePlayer);
}

export async function deleteSparePlayer(sparePlayerId: string): Promise<boolean> {
  const result = await (await spareCollection()).deleteOne({ _id: sparePlayerId, kind: 'spare' });
  return result.deletedCount > 0;
}

export async function getSparePlayerById(sparePlayerId: string): Promise<SparePlayer | undefined> {
  const collection = await spareCollection();
  const spareDoc = await collection.findOne({ _id: sparePlayerId, kind: 'spare' });
  return spareDoc ? mapSparePlayer(spareDoc) : undefined;
}

export async function updateSparePlayer(
  sparePlayerId: string,
  input: { name: string; weight: GameWeight }
): Promise<SparePlayer | undefined> {
  const collection = await spareCollection();
  const result = await collection.findOneAndUpdate(
    { _id: sparePlayerId, kind: 'spare' },
    {
      $set: {
        name: input.name,
        weight: input.weight
      }
    },
    { returnDocument: 'after' }
  );

  return result ? mapSparePlayer(result) : undefined;
}
