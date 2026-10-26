import mongoose from "mongoose"

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://rachya:Y8FseKXRbJoZGSdW@cluster0.9yz8ir7.mongodb.net/rachya?retryWrites=true&w=majority&appName=Cluster0"

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable")
}

// Extend the global object to include mongooseConnection
declare global {
  var mongooseConnection: {
    conn: typeof mongoose | null
    promise: Promise<typeof mongoose> | null
  }
}

let cached = global.mongooseConnection

if (!cached) {
  cached = global.mongooseConnection = { conn: null, promise: null }
}

// Older databases have a global unique index on guests.guestId, which breaks the second
// account's first guest. The per-account index in the Guest model replaces it.
async function dropLegacyGuestIdIndex(m: typeof mongoose) {
  try {
    const guests = m.connection.db?.collection("guests")
    if (guests && (await guests.indexExists("guestId_1"))) {
      await guests.dropIndex("guestId_1")
      console.log("Dropped legacy guests.guestId_1 index")
    }
  } catch (error) {
    // Collection may not exist yet; nothing to drop
    if ((error as { codeName?: string }).codeName !== "NamespaceNotFound") {
      console.error("Could not drop legacy guestId index:", error)
    }
  }
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    }

    cached.promise = mongoose.connect(MONGODB_URI, opts).then(async (mongoose) => {
      console.log("Connected to MongoDB")
      await dropLegacyGuestIdIndex(mongoose)
      return mongoose
    })
  }

  try {
    cached.conn = await cached.promise
  } catch (e) {
    cached.promise = null
    console.error("MongoDB connection error:", e)
    throw e
  }

  return cached.conn
}

export default connectDB
