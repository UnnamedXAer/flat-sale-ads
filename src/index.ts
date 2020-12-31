require('dotenv').config();
import { scrapeAnnouncements } from './announcement';
import { config } from './config';
import l from './logger';

const programStartTime = Date.now();
l.info('Program START');

async function start() {
	await scrapeAnnouncements();
}

start()
	.catch((err) => {
		l.error(
			'There was en error, check the previous console output.',
			config.isDev ? err : void 0
		);
	})
	.finally(() => {
		l.info('Program END!');
		const executionTime = Date.now() - programStartTime;
		const executionTimeText =
			executionTime >= 1000 ? executionTime / 1000 + ' s' : executionTime + ' ms';
		l.debug('Execution time: ', executionTimeText);
	});
