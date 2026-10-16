import mongoose from "mongoose";

// Eén gedeelde verbinding, ook bij hot reload in dev en hergebruik in serverless functies.

type Cache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };

const globalCache = globalThis as unknown as { __mongoose?: Cache };
const cache: Cache = (globalCache.__mongoose ??= { conn: null, promise: null });

export async function connectDb(uri = process.env.MONGODB_URI) {
  if (cache.conn) return cache.conn;
  if (!uri) throw new Error("MONGODB_URI ontbreekt (zie .env.example)");

  cache.promise ??= mongoose.connect(uri, { bufferCommands: false, serverSelectionTimeoutMS: 8000 });
  try {
    cache.conn = await cache.promise;
  } catch (error) {
    cache.promise = null;
    throw error;
  }
  return cache.conn;
}

export async function disconnectDb() {
  await mongoose.disconnect();
  cache.conn = null;
  cache.promise = null;
}
