import mongoose from 'mongoose';
import l from '../../logger';

let db: Promise<typeof mongoose> | null = null;

async function connectToMongo() {
	l.info('About to connecting to (mongo) db.');
	const conn = await mongoose.connect('mongodb://localhost:27017/flat-sale-offers', {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useFindAndModify: false,
		useCreateIndex: true
	});
	l.info('Connected to (mongo) db.');
	return conn;
}
export function getDb() {
	if (db === null) {
		return connectToMongo();
	}
	return db;
}
