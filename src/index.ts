require('dotenv').config();
import pp from 'puppeteer';
import { config } from './config';
import l, { lTime } from './logger';
import { Scraper } from './pageScraper/scraper';

const programStartTime = Date.now();
l.info('Program START');

async function start() {
	const _config = config;
	const browserLaunchOptions: pp.LaunchOptions = {
		headless: true,
		timeout: 0,
		defaultViewport: null,
		args: [],
		devtools: false
	};
	if (_config.startMaximized === true) {
		browserLaunchOptions.args!.push('--start-maximized');
		browserLaunchOptions.headless = false;
		browserLaunchOptions.devtools = true;
	}
	const browser = await pp.launch(browserLaunchOptions);
	const scraper = new Scraper();
	await scraper.scrapeAnnouncements(browser, [
		// 'olx', //
		// 'rzeszowiak', //
		// 'otodom', //
		'gethome' //
	]);
	await browser.close();
}

start()
	.catch((err) => {
		l.error(err);
		l.fatal('Program crashed. Please check the previous console output.');
		process.exit(1);
	})
	.finally(() => {
		const executionTime = Date.now() - programStartTime;
		l.info('Total execution time: ', lTime(executionTime));
		l.info('Program END!');
	});
