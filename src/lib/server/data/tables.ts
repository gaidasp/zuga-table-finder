import { randomUUID } from 'crypto';
import type { BGGGame, GameWeight, Player, Table } from '$lib/types';
import { db } from './mongo';

type TableDoc = Omit<Table, 'id'> & { _id: string; kind: 'table' };

export const weights = ['Party', 'Leggero (max 45 min)', 'Medio (1-2h)', 'Estremo (>2h)'] as const;

const tableCollection = async () => (await db()).collection<TableDoc>('ZugaTableFinder');

const mapTable = (doc: TableDoc): Table => ({
  id: doc._id,
  title: doc.title,
  description: doc.description,
  creatorUserId: doc.creatorUserId,
  weight: doc.weight,
  seats: doc.seats,
  sortOrder: doc.sortOrder,
  players: doc.players,
  nightDate: doc.nightDate ?? new Date(doc.createdAt).toISOString().slice(0, 10),
  createdAt: doc.createdAt,
  bggGame: doc.bggGame ?? null
});

export async function listTables(nightDate?: string): Promise<Table[]> {
  const collection = await tableCollection();
  const items = await collection
    .find({ kind: 'table', nightDate: nightDate })
    .sort({ sortOrder: 1, createdAt: 1 })
    .toArray();
  return items.map(mapTable);
}

export async function createTable(input: {
  title: string;
  description: string;
  seats: number;
  weight: GameWeight;
  creatorUserId?: string;
  nightDate?: string;
  bggGame?: BGGGame | null;
}): Promise<Table> {
  const collection = await tableCollection();
  const createdAt = Date.now();
  const nightDate = input.nightDate ?? new Date(createdAt).toISOString().slice(0, 10);
  const lastForNight = await collection
    .find({ kind: 'table', nightDate })
    .sort({ sortOrder: -1, createdAt: -1 })
    .limit(1)
    .toArray();
  const nextSortOrder = (lastForNight[0]?.sortOrder ?? lastForNight.length) + 1;

  const table: TableDoc = {
    _id: randomUUID(),
    kind: 'table',
    title: input.title,
    description: input.description,
    creatorUserId: input.creatorUserId,
    weight: input.weight,
    seats: input.seats,
    sortOrder: nextSortOrder,
    players: [],
    nightDate,
    createdAt,
    bggGame: input.bggGame ?? null
  };
  await collection.insertOne(table);
  return mapTable(table);
}

export async function updateTable(
  tableId: string,
  input: {
    title: string;
    description: string;
    seats: number;
    weight: GameWeight;
    bggGame?: BGGGame | null;
  }
): Promise<Table | undefined> {
  const collection = await tableCollection();
  const updateFields: Partial<
    Pick<TableDoc, 'title' | 'description' | 'seats' | 'weight' | 'bggGame'>
  > = {
    title: input.title,
    description: input.description,
    seats: Number.isFinite(input.seats) ? Math.min(Math.max(1, input.seats), 30) : 4,
    weight: input.weight
  };

  if (input.bggGame !== undefined) {
    updateFields.bggGame = input.bggGame;
  }

  const result = await collection.findOneAndUpdate(
    { _id: tableId, kind: 'table' },
    { $set: updateFields },
    { returnDocument: 'after' }
  );
  if (!result) {
    return undefined;
  }
  return mapTable(result);
}

export async function joinTable(
  tableId: string,
  name: string,
  userId: string | undefined,
  avatarColor: string | undefined,
  isBeginner: boolean,
  isTeacher: boolean
): Promise<Table | undefined> {
  const collection = await tableCollection();
  const newPlayer: Player = { id: randomUUID(), name, userId, avatarColor, isBeginner, isTeacher };

  await collection.updateOne(
    { _id: tableId, kind: 'table', 'players.name': { $ne: name } },
    { $push: { players: newPlayer } }
  );

  const table = await collection.findOne({ _id: tableId, kind: 'table' });
  return table ? mapTable(table) : undefined;
}

export async function deleteTable(tableId: string): Promise<boolean> {
  const result = await (await tableCollection()).deleteOne({ _id: tableId, kind: 'table' });
  return result.deletedCount > 0;
}

export async function deletePlayer(tableId: string, playerId: string): Promise<Table | undefined> {
  const collection = await tableCollection();
  const result = await collection.findOneAndUpdate(
    { _id: tableId, kind: 'table' },
    { $pull: { players: { id: playerId } } },
    { returnDocument: 'after' }
  );

  return result ? mapTable(result) : undefined;
}

export async function updatePlayer(
  tableId: string,
  player: { id: string; isBeginner: boolean; isTeacher: boolean }
): Promise<Table | undefined> {
  const collection = await tableCollection();
  const result = await collection.findOneAndUpdate(
    { _id: tableId, kind: 'table', 'players.id': player.id },
    {
      $set: {
        'players.$.isBeginner': player.isBeginner,
        'players.$.isTeacher': player.isTeacher
      }
    },
    { returnDocument: 'after' }
  );
  return result ? mapTable(result) : undefined;
}

export async function getTableById(tableId: string): Promise<Table | undefined> {
  const collection = await tableCollection();
  const tableDoc = await collection.findOne({ _id: tableId, kind: 'table' });
  return tableDoc ? mapTable(tableDoc) : undefined;
}

export async function moveTable(tableId: string, direction: 'left' | 'right'): Promise<boolean> {
  const collection = await tableCollection();
  const current = await collection.findOne({ _id: tableId, kind: 'table' });
  if (!current) return false;

  const tables = await collection
    .find({ kind: 'table', nightDate: current.nightDate })
    .sort({ sortOrder: 1, createdAt: 1 })
    .toArray();

  if (tables.length < 2) return false;

  const ordered = [...tables].sort((a, b) => {
    const aOrder = typeof a.sortOrder === 'number' ? a.sortOrder : Number.MAX_SAFE_INTEGER;
    const bOrder = typeof b.sortOrder === 'number' ? b.sortOrder : Number.MAX_SAFE_INTEGER;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return a.createdAt - b.createdAt;
  });

  const index = ordered.findIndex((table) => table._id === tableId);
  if (index < 0) return false;

  const targetIndex = direction === 'left' ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= ordered.length) return false;

  const temp = ordered[index];
  ordered[index] = ordered[targetIndex];
  ordered[targetIndex] = temp;

  await collection.bulkWrite(
    ordered.map((table, idx) => ({
      updateOne: {
        filter: { _id: table._id, kind: 'table' },
        update: { $set: { sortOrder: idx + 1 } }
      }
    }))
  );

  return true;
}
