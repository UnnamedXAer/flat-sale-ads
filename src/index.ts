require('dotenv').config();
import pp from 'puppeteer';
import { config } from './config';
import { analyzeData } from './dataAnalyzer/uniqueOffers';
import globals from './globals';
import l, { lTime } from './logger';
import { Scraper } from './pageScraper/scraper';
import { timeStart } from './performance';
import { MongoRepository, storage } from './repository/mongo';
import { IOffer } from './types';
import { createVisualization } from './visualization/visualization';

async function start_scrape() {
	const browserLaunchOptions: pp.LaunchOptions = {
		headless: true,
		timeout: 0,
		defaultViewport: null,
		args: [],
		devtools: false
	};
	if (config.startMaximized === true) {
		browserLaunchOptions.args!.push('--start-maximized');
		browserLaunchOptions.headless = false;
		browserLaunchOptions.devtools = true;
	}
	const browser = await pp.launch(browserLaunchOptions);
	const scraper = new Scraper(storage);
	await scraper.scrapeOffers(browser, [
		'olx', //
		'rzeszowiak', //
		'otodom', //
		'gethome' //
	]);
	await browser.close();
}

async function start_analyze() {
	await analyzeData(['gethome', 'olx', 'otodom', 'rzeszowiak']);
}
async function start_generateVisualization() {
	await createVisualization();
}
const main = async () => {
	timeStop = timeStart('main');
	globals.programStartTime = Date.now();
	l.info('Program START');
	const _config = config;
	storage.connect();
	// await doMongo(storage);

	await start_scrape();
	// await start_analyze();
	// await start_generateVisualization();

	await storage.disconnect();
};

let timeStop: Function;
main()
	.catch((err) => {
		l.error(err);
		l.fatal('Program crashed. Please check the previous console output.');
		process.exit(1);
	})
	.finally(() => {
		timeStop();
		const executionTime = Date.now() - globals.programStartTime;
		l.info('Total execution time: ', lTime(executionTime));
		l.info('Program END!');
	});

async function doMongo(s: MongoRepository) {
	const offerTest: IOffer = {
		id: 'sdfsafdsafsa' + Date.now(),
		site: 'gethome',
		dt: new Date().toLocaleString(),
		_dt: new Date(),
		imgUrl: 'https://mongoosejs.com/docs/images/mongoose5_62x30_transparent.png',
		price: '322500',
		scrapedAt: new Date(),
		title: 'What is a SchemaType?',
		url: 'https://mongoosejs.com/docs/schematypes.html',
		description:
			'You can think of a Mongoose schema as the configuration object for a Mongoose model. A SchemaType is then a configuration object for an individual property. A SchemaType says what type a given path should have, whether it has any getters/setters, and what values are valid for that path.',
	};

	await s.create(offerTest);

	const offers = await s.getAll();
	console.log('\n Offers:', offers);
}
