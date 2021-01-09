require('dotenv').config();
import pp from 'puppeteer';
import { config } from './config';
import { analyzeData } from './dataAnalyzer/uniqueOffers';
import globals from './globals';
import l, { lTime } from './logger';
import { Scraper } from './pageScraper/scraper';
import { timeStart } from './performance';
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
	const scraper = new Scraper();
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

	await start_scrape();
	await start_analyze();
	await start_generateVisualization();
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
