import { MongoClient } from 'mongodb';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const globalForMongo = globalThis as typeof globalThis & {
  __mongoClient?: MongoClient;
  __mongoClientPromise?: Promise<MongoClient>;
  __mongoDotEnv?: Record<string, string>;
};

const getDotEnv = () => {
  if (globalForMongo.__mongoDotEnv) {
    return globalForMongo.__mongoDotEnv;
  }

  const envPath = resolve('.env');
  if (!existsSync(envPath)) {
    globalForMongo.__mongoDotEnv = {};
    return globalForMongo.__mongoDotEnv;
  }

  const parsed = Object.fromEntries(
    readFileSync(envPath, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const idx = line.indexOf('=');
        return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()];
      })
  );

  globalForMongo.__mongoDotEnv = parsed;
  return parsed;
};

const getMongoUri = () => {
  const dotEnv = getDotEnv();
  return process.env.MONGO_URI || process.env.MONGODB_URI || dotEnv.MONGO_URI || dotEnv.MONGODB_URI;
};

const getMongoDbName = () => {
  const dotEnv = getDotEnv();
  return process.env.MONGODB_DB || dotEnv.MONGODB_DB || 'Zuga';
};

const getClientPromise = () => {
  if (globalForMongo.__mongoClientPromise) {
    return globalForMongo.__mongoClientPromise;
  }

  const mongoUri = getMongoUri();
  if (!mongoUri) {
    throw new Error('MongoDB connection string is missing. Set MONGO_URI or MONGODB_URI.');
  }

  const client = new MongoClient(mongoUri, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 5000
  });

  globalForMongo.__mongoClientPromise = client.connect().then((connected) => {
    globalForMongo.__mongoClient = connected;
    return connected;
  });

  return globalForMongo.__mongoClientPromise;
};

export const db = async () => {
  try {
    const connected = await getClientPromise();
    return connected.db(getMongoDbName());
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `MongoDB connection failed. Check runtime env (MONGO_URI or MONGODB_URI), credentials, and network reachability. Original error: ${message}`
    );
  }
};
