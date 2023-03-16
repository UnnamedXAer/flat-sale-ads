require('dotenv').config();
import pp from 'puppeteer';
import { config } from './config';
import { analyzeData } from './dataAnalyzer/uniqueOffers';
import globals from './globals';
import l, { lTime } from './logger';
import { Scraper } from './pageScraper/scraper';
import { timeStart } from './performance';
import { connectToStorage } from './repository';
import { IRepository, RepositoryName } from './types';
import { createVisualization } from './visualization/visualization';

async function start_scrape(storage: IRepository) {
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
  const scraper = new Scraper(storage, globals.programStartTime);
  await scraper.scrapeOffers(browser, [
    'olx', //
    'rzeszowiakAgencje', //
    'rzeszowiak', //
    'otodom', //
    'gethome' //
  ]);
  await browser.close();
}

async function start_analyze(storage: IRepository) {
  await analyzeData(storage);
}
async function start_generateVisualization(storage: IRepository) {
  await createVisualization(storage);
}
const main = async () => {
  timeStop = timeStart('main');
  globals.programStartTime = Date.now();
  l.info('Program START');
  const _config = config; // to keep import from being auto removed as unused
  const storage = await connectToStorage(RepositoryName.PostgreSql);

  await start_scrape(storage);
  await start_analyze(storage);
  await start_generateVisualization(storage);

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
    // process.exit(0);
  });
