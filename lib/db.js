import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI || process.env.NEXT_PUBLIC_MONGODB_URI

if (!MONGODB_URI) {
  console.warn('MONGODB_URI not set. Set environment variable to connect to DB.')
}

let cached = globalThis._mongoose_cache || (globalThis._mongoose_cache = { conn: null, promise: null })

async function dbConnect() {
  if (cached.conn) return cached.conn

  if (!cached.promise) {
    if (!MONGODB_URI) {
      throw new Error('Please define the MONGODB_URI environment variable inside .env.local')
    }
    const opts = {
      bufferCommands: false,
    }
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose
    })
  }

  cached.conn = await cached.promise
  return cached.conn
}

export default dbConnect
