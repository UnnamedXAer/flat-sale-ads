require('dotenv').config();
import pp from 'puppeteer';
import { config } from './config';
import path from 'path';
import { access, mkdir, writeFile } from 'fs/promises';
import l from './logger';
import { DayAnnouncements } from './types';
import { formatDateToFileName } from './formatDate';
import { getAnnouncements } from './announcement';

l.info('START');

async function start() {
	const browser = await pp.launch({ headless: true });
	const todayAnnouncements: DayAnnouncements = {
		olx: null,
		rzeszowiak: null
	};
	const todayRzAnnouncements = await getAnnouncements(browser, 'rzeszowiak');
	l.info(
		'Number of todays "Rzeszowiak" announcements is: ',
		todayRzAnnouncements.length
	);
	todayAnnouncements.rzeszowiak = todayRzAnnouncements;
	await browser.close();

	
	throw new Error('make it generic - data for olx / rzeszowiak overrides each other');
	const dirPath = path.resolve(__dirname, '..', 'data', 'announcements');
	try {
		await access(dirPath);
	} catch (err) {
		l.warn('Folder for the announcements does not exist or is not accessible.');
		l.info('Try to create folder for the announcements.');
		try {
			await mkdir(dirPath, { recursive: true });
		} catch (err) {
			l.error('Fail to create folder for the announcements.', err);
			throw err;
		}
	}
	const pathName = path.join(dirPath, `${formatDateToFileName()}.json`);
	const text = JSON.stringify(todayAnnouncements, null, config.isDev ? '\t' : 0);
	try {
		l.info('About to save the announcements.');
		await writeFile(pathName, text);
	} catch (err) {
		l.error('Fail to save the announcements to file.', err);
		throw err;
	}
}

start()
	.catch((err) => {
		l.error(
			'There was en error, check the previous console output.',
			config.isDev ? err : void 0
		);
	})
	.finally(() => {
		l.info('End!');
	});
