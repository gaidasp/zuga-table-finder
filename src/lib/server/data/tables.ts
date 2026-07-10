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
  players: doc.players,
  nightDate: doc.nightDate ?? new Date(doc.createdAt).toISOString().slice(0, 10),
  createdAt: doc.createdAt,
  bggGame: doc.bggGame ?? null
});

export async function listTables(nightDate?: string): Promise<Table[]> {
  const collection = await tableCollection();
  const items = await collection
    .find({ kind: 'table', nightDate: nightDate })
    .sort({ createdAt: -1 })
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
  const createdAt = Date.now();
  const nightDate = input.nightDate ?? new Date(createdAt).toISOString().slice(0, 10);
  const table: TableDoc = {
    _id: randomUUID(),
    kind: 'table',
    title: input.title,
    description: input.description,
    creatorUserId: input.creatorUserId,
    weight: input.weight,
    seats: input.seats,
    players: [],
    nightDate,
    createdAt,
    bggGame: input.bggGame ?? null
  };
  await (await tableCollection()).insertOne(table);
  return mapTable(table);
}

export async function updateTable(
  tableId: string,
  input: { title: string; description: string; seats: number; weight: GameWeight; bggGame?: BGGGame | null }
): Promise<Table | undefined> {
  const collection = await tableCollection();
  const updateFields: Partial<Pick<TableDoc, 'title' | 'description' | 'seats' | 'weight' | 'bggGame'>> = {
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
