import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI);
let db;

// connect once and reuse the same connection
export async function collections() {
  if (!db) {
    await client.connect();
    db = client.db(process.env.DB_NAME || "kindcircle");
  }
  return { events: db.collection("events"), joins: db.collection("joins") };
}