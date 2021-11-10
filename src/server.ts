require('dotenv').config();
import express from 'express';
import debug from 'debug';
import http from 'http';
import cors from 'cors';
import { main } from './scraper';
import { connectToStorage, createStorage } from './repository/mongo';
import { globals } from './global';

const storage = createStorage();

const PORT = process.env.PORT || '3009';

const app = express();
const server = http.createServer(app);

app.use(cors({}));

app.use((req, _, next) => {
	debug.log(`${new Date().toLocaleString('en-US')} - [${req.method}] ${req.path}`);
	next();
});

app.get('/', (req, res) => {
	res.send('bla bla');
});

app.get('/data', async (req, res) => {
	try {
		// const data = await getLatestOffersInfo();
		const data = await storage.getNewOffers();
		debug.log('sending data...:');
		res.send(data);
	} catch (err) {
		res.status(500).send(err);
	}
});

app.get('/exec', async (req, res) => {
	try {
		await main();
		res.redirect('/data');
	} catch (err) {
		const msg = (err as Error).toString();
		res.status(500).send(msg);
	}
});

connectToStorage()
	.then(() => {
		server.listen(PORT, () => {
			globals.SERVER_UP = true;
			debug.log('server is up and running at: %s', PORT);
		});
	})
	.catch((err) => {
		debug.log('server could not run due to storage connection error: %v', err);
	});
