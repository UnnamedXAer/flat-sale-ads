require('dotenv').config();
import { MongoClient, Db } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI as string;
const DB_NAME = process.env.MONGO_DB as string;
const COL_NAME = 'alloffers';

const client = new MongoClient(MONGO_URI);

/** @type Db */
let db: Db | null = null;

async function getDB() {
	if (db === null) {
		await client.connect();
		db = client.db(DB_NAME);
	}
	return db;
}

export async function getLatestOffersInfo() {
	const col = await getDB().then((db) => db.collection(COL_NAME));
	const results = await col.findOne({});

	return results;
}