require('dotenv').config();
import { scrapeAnnouncements } from './announcement';
import l, { lTime } from './logger';

const programStartTime = Date.now();
l.info('Program START');

async function start() {
	await scrapeAnnouncements();
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
