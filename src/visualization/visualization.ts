import cheerio from 'cheerio';
import { readFile, writeFile } from 'fs/promises';
import { config } from '../config';
import path from 'path';
import {
	ensurePathExists,
	getDataDirPath,
	getDirFiles,
	getFileData,
	sortFilesByDate
} from '../files';
import { formatDateToFileName } from '../formatDate';
import l from '../logger';
import { timeStart } from '../performance';

const offerClasses = {
	link: '.offer-link',
	image: '.offer-image',
	title: '.offer-title',
	price: '.offer-price',
	date: '.offer-date',
	description: '.offer-description',
	scrape: '.offer-scrape-date',
	site: '.offer-site'
} as const;

export async function createVisualization() {
	let timeStop = timeStart('Read data for the visualization');
	const offers = await getDataForVisualization();
	timeStop();
	timeStop = timeStart('Read the html templates');
	const [pageHtml, offerHtml] = await getTemplates();
	timeStop();
	timeStop = timeStart('Load html template into the cheerio');
	const $ = cheerio.load(pageHtml);
	timeStop();
	const $offerList = $('.offer-list');
	const $offerTemplate = $(offerHtml);
	timeStop = timeStart(`Generate html of the offers (${offers.length})`);
	offers.forEach((offer, i) => {
		const $offer = $offerTemplate.clone();
		const link = $offer.find(offerClasses.link);
		link.attr('href', offer.url);
		const image = $offer.find(offerClasses.image);
		image.attr('src', offer.imgUrl);
		const title = $offer.find(offerClasses.title);
		title.text(offer.title);
		const price = $offer.find(offerClasses.price);
		price.text(offer.price);
		const date = $offer.find(offerClasses.date);
		date.text(offer.dt);
		const scrape = $offer.find(offerClasses.scrape);
		scrape.text('null');
		const site = $offer.find(offerClasses.site);
		site.text(offer.site);
		$offer.appendTo($offerList);
	});
	timeStop();
	timeStop = timeStart('Retrieve html complete html');
	const html = $.html();
	timeStop();

	const visualizationPath = getDataDirPath('visualization');
	const fileName =
		'vis_' + formatDateToFileName() + (config.isDev ? Date.now() : '') + '.html';
	await ensurePathExists(visualizationPath);
	const filePath = path.join(visualizationPath, fileName);
	timeStop = timeStart(`Save html to: "${filePath}".`);
	await writeFile(filePath, html);
	timeStop();
	timeStop = timeStart('Open visualization in the  default browser.');
	require('child_process').spawn('explorer', [filePath]);
	timeStop();
}

async function getDataForVisualization() {
	const [dirFiles, directoryPath] = await getDirFiles('analyzed');
	const files = sortFilesByDate(dirFiles);

	if (dirFiles.length === 0) {
		l.warn('There is no files with data for the visualization.');
		return [];
	}

	const youngestFile = files[files.length - 1];

	const fileData = await getFileData(directoryPath, youngestFile.fileName);

	return fileData;
}

async function getTemplates(): Promise<[page: string, offer: string]> {
	const dirPath = path.join(process.cwd(), 'src', 'assets');
	const page = await readFile(path.join(dirPath, 'template.html'), 'utf-8');
	const offer = await readFile(path.join(dirPath, 'templateOffer.html'), 'utf-8');
	return [page, offer];
}
