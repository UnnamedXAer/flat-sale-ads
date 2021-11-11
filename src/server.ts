require('dotenv').config();
import express, { Request, Response } from 'express';
import debug from 'debug';
import http from 'http';
import cors from 'cors';
import { main } from './scraper';
import { connectToStorage, createStorage } from './repository/mongo';
import { globals } from './global';
import { ScrapeEmitter } from './ScrapeEmitter';
import l from './logger';
import { inspect } from 'util';
import { onError, PORT, serverListenHandler } from './serverSupport';

const storage = createStorage();

const scrapeEmitter = new ScrapeEmitter();


const app = express();
const server = http.createServer(app);

app.use(cors({}));

app.use((req, _, next) => {
	l.info(
		`[${req.method}] ${req.path}, from: ${
			req.headers.referer || req.headers.origin
		} with: ${req.headers['user-agent']}`
	);
	next();
});

app.get('/', (req, res) => {
	res.send({ bla: 'bla bla' });
});

app.get('/data', async (req, res) => {
	if (isScraping) {
		l.debug('scraping, subscribe with request to wait for new data');
		subscribeToScraper(req, res);
		return;
	}
	try {
		const data = await storage.getNewOffers();
		res.send(data);
	} catch (err) {
		res.status(500).send(err);
	}
});

let isScraping = false;
app.get('/exec', async (req, res) => {
	subscribeToScraper(req, res);
	if (isScraping) {
		l.debug('scraping, prevent from another run');
		return;
	}

	try {
		isScraping = true;
		await main();
		scrapeEmitter.emit('done');
	} catch (err) {
		scrapeEmitter.emit('error', err as Error);
	} finally {
		isScraping = false;
	}
});

function subscribeToScraper(req: Request, res: Response) {
	scrapeEmitter.subscribe(res);

	req.on('error', () => {
		scrapeEmitter.unsubscribe(res);
	});
	req.on('close', () => {
		scrapeEmitter.unsubscribe(res);
	});
}

connectToStorage()
	.then(() => {
		server.listen(PORT);
		server.on('listening', serverListenHandler)
	})
	.catch((err) => {
		l.info('server could not run due to storage connection error: %v', err);
	});



server.on('error', onError);

process.on('uncaughtException', function (err) {
	l.error(`I've crashed!!! - ${err.stack || err}`);
});

process.on('unhandledRejection', (reason, p) => {
	l.error(`Unhandled Rejection at: ${inspect(p)} reason: ${reason}`);
});

async function catchProcessDeath() {
	debug('urk...');
	storage.disconnect(true);
	process.exit(0);
}

process.on('SIGTERM', catchProcessDeath);
process.on('SIGINT', catchProcessDeath);
process.on('SIGHUP', catchProcessDeath);

process.on('exit', () => {
	l.info('exiting...');
});

l.info('exit handlers set.');


