import { MongoClient, ServerApiVersion } from 'mongodb';
import { MONGODB_URI } from '$env/static/private';

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI is not set');
}

const dbName = 'Zuga';

const globalForMongo = globalThis as typeof globalThis & {
  __mongoClient?: MongoClient;
  __mongoClientPromise?: Promise<MongoClient>;
};

const client =
  globalForMongo.__mongoClient ??
  new MongoClient(MONGODB_URI, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true
    }
  });
const clientPromise =
  globalForMongo.__mongoClientPromise ??
  client.connect().then((connected) => {
    globalForMongo.__mongoClient = connected;
    return connected;
  });

if (!globalForMongo.__mongoClientPromise) {
  globalForMongo.__mongoClientPromise = clientPromise;
}

export const db = async () => {
  const connected = await clientPromise;
  return connected.db(dbName);
};

import { randomUUID } from 'crypto';
import type { SparePlayer, Player, GameWeight, Table } from '$lib/types';

type TableDoc = Omit<Table, 'id'> & { _id: string; kind: 'table' };
type SparePlayerDoc = Omit<SparePlayer, 'id'> & { _id: string; kind: 'spare' };
type SettingsDoc = { _id: 'settings'; kind: 'settings'; nightDate: string; updatedAt: number };
type ZugaDoc = TableDoc | SparePlayerDoc | SettingsDoc;

export const weights = ['Party', 'Leggero (max 45 min)', 'Medio (1-2h)', 'Estremo (>2h)'] as const;
const zugaCollection = async () => (await db()).collection<ZugaDoc>('ZugaTableFinder');

const mapTable = (doc: TableDoc): Table => ({
  id: doc._id,
  title: doc.title,
  description: doc.description,
  weight: doc.weight,
  seats: doc.seats,
  players: doc.players,
  nightDate: doc.nightDate ?? new Date(doc.createdAt).toISOString().slice(0, 10),
  createdAt: doc.createdAt
});

const mapSparePlayer = (doc: SparePlayerDoc): SparePlayer => ({
  id: doc._id,
  name: doc.name,
  weight: doc.weight,
  nightDate: doc.nightDate,
  createdAt: doc.createdAt
});

// TABLE APIS// 

export async function listTables(nightDate?: string): Promise<Table[]> {
  const collection = await zugaCollection();
  const items = await collection
  .find({ kind: 'table', nightDate: nightDate })
  .sort({ createdAt: -1 })
  .toArray();
  return (items as TableDoc[]).map(mapTable);
}

export async function createTable(input: {
  title: string;
  description: string;
  seats: number;
  weight: GameWeight;
  nightDate?: string;
}): Promise<Table> {
  const createdAt = Date.now();
  const nightDate = input.nightDate ?? new Date(createdAt).toISOString().slice(0, 10);
  const table: TableDoc = {
    _id: randomUUID(),
    kind: 'table',
    title: input.title,
    description: input.description,
    weight: input.weight,
    seats: input.seats,
    players: [],
    nightDate,
    createdAt
  };
  await (await zugaCollection()).insertOne(table);
  return mapTable(table);
}

export async function updateTable(
  tableId: string,
  input: { title: string; description: string; seats: number; weight: GameWeight }
): Promise<Table | undefined> {
  const collection = await zugaCollection();
  const result = await collection.findOneAndUpdate(
    { _id: tableId, kind: 'table' },
    {
      $set: {
        title: input.title,
        description: input.description,
        seats: Number.isFinite(input.seats) ? Math.min(Math.max(1, input.seats), 30) : 4,
        weight: input.weight
      }
    },
    { returnDocument: 'after' }
  );
  const updatedDoc = result && (result as any).value ? (result as any).value : result;

  if (!updatedDoc) {
    return undefined;
  }
  return mapTable(updatedDoc as TableDoc);
}


export async function joinTable(
  tableId: string,
  name: string,
  isBeginner: boolean,
  isTeacher: boolean
): Promise<Table | undefined> {
  const collection = await zugaCollection();
  const newPlayer: Player = { id: randomUUID(), name, isBeginner, isTeacher };

  await collection.updateOne(
    { _id: tableId, kind: 'table', 'players.name': { $ne: name } },
    { $push: { players: newPlayer } }
  );

  const table = await collection.findOne({ _id: tableId, kind: 'table' });
  return table ? mapTable(table as TableDoc) : undefined;
}

export async function deleteTable(tableId: string): Promise<boolean> {
  const result = await (await zugaCollection()).deleteOne({ _id: tableId, kind: 'table' });
  return result.deletedCount > 0;
}

// PLAYER APIS

export async function deletePlayer(tableId: string, playerId: string): Promise<Table | undefined> {
  const collection = await zugaCollection();
  const result = await collection.findOneAndUpdate(
    { _id: tableId, kind: 'table' },
    { $pull: { players: { id: playerId } } },
    { returnDocument: 'after' }
  );

  const updatedDoc = (result && (result as any).value) ? (result as any).value : result;
  return updatedDoc ? mapTable(updatedDoc as TableDoc) : undefined;
}

export async function updatePlayer(
  tableId: string,
  player: { id: string; name: string; isBeginner: boolean; isTeacher: boolean }
): Promise<Table | undefined> {
  const collection = await zugaCollection();
  const result = await collection.findOneAndUpdate(
    { _id: tableId, kind: 'table', 'players.id': player.id },
    {
      $set: {
        'players.$.name': player.name,
        'players.$.isBeginner': player.isBeginner,
        'players.$.isTeacher': player.isTeacher
      }
    },
    { returnDocument: 'after' }
  );
  const updatedDoc = (result && (result as any).value) ? (result as any).value : result;
  return updatedDoc ? mapTable(updatedDoc as TableDoc) : undefined;
}

export async function listSparePlayers(nightDate?: string): Promise<SparePlayer[]> {
  const collection = await zugaCollection();
  const items = await collection
    .find({ kind: 'spare', nightDate: nightDate })
    .sort({ createdAt: -1 })
    .toArray();
  
  return (items as SparePlayerDoc[]).map(mapSparePlayer);
}

export async function addSparePlayer(
  weight: GameWeight,
  name: string,
  nightDate: string,
  createdAt: number = Date.now()
): Promise<SparePlayer> {
  const sparePlayer: SparePlayerDoc = {
    _id: randomUUID(),
    kind: 'spare',
    weight,
    name,
    nightDate,
    createdAt
  };
  await (await zugaCollection()).insertOne(sparePlayer);
  return mapSparePlayer(sparePlayer);
}

export async function deleteSparePlayer(sparePlayerId: string): Promise<boolean> {
  const result = await (await zugaCollection()).deleteOne({ _id: sparePlayerId, kind: 'spare' });
  return result.deletedCount > 0;
}

export async function getTableById(tableId: string): Promise<Table | undefined> {
  const collection = await zugaCollection();
  const tableDoc = await collection.findOne({ _id: tableId, kind: 'table' });
  return tableDoc ? mapTable(tableDoc as TableDoc) : undefined;
} 

export { getDefaultNightDate } from '$lib/utils/date';

// write a function that returns the PageData given a nightdate, using the listTables and listSparePlayers functions
// export async function getPageData(nightDate?: string) {
//   const tables = await listTables(nightDate);
//   const sparePlayers = await listSparePlayers(nightDate);
//   console.log(tables);
//   return {
//     tables: tables,
//     sparePlayers: sparePlayers,
//     nightDate: nightDate,
//     weights: ['Party', 'Leggero (max 45 min)', 'Medio (1-2h)', 'Estremo (>2h)'] as GameWeight[]
//   };
// }

