import cheerio from 'cheerio';
import fsPromises from 'fs/promises';
import { config } from '../config';
import path from 'path';
import { ensurePathExists, getDataDirPath } from '../files';
import { formatDateToFileName } from '../formatDate';
import { timeStart } from '../performance';
import { IOffersInfo, IRepository } from '../types';

const offerClasses = {
	link: '.offer-link',
	index: '.offer-index',
	image: '.offer-image',
	title: '.offer-title',
	price: '.offer-price',
	date: '.offer-date',
	description: '.offer-description',
	scrape: '.offer-scrape-date',
	site: '.offer-site'
} as const;

export async function createVisualization(storage: IRepository) {
	const offersInfo = await getDataForVisualization(storage);
	const [pageHtml, offerTemplateHtml] = await getTemplates();
	const html = generateOffersPageHtml(pageHtml, offerTemplateHtml, offersInfo);
	const visualizationPath = getDataDirPath('visualization');
	const fileName =
		'vis_' + formatDateToFileName() + (config.isDev ? Date.now() : '') + '.html';
	await ensurePathExists(visualizationPath);
	const filePath = path.join(visualizationPath, fileName);
	await fsPromises.writeFile(filePath, html);

	openVisualization(filePath);
}

export function openVisualization(filePath: string) {
	let timeStop = timeStart('Open visualization in the  default browser.');
	require('child_process').spawn('explorer', [filePath]);
	timeStop();
}

export function generateOffersPageHtml(
	pageHtml: string,
	offerTemplateHtml: string,
	offersInfo: IOffersInfo | null
) {
	let timeStop = timeStart(
		`Generate html of the offers (cnt: ${offersInfo?.offerList.length})`
	);
	const $ = cheerio.load(pageHtml);
	$('.offer-list-count').text(offersInfo?.offerList.length + ' offers');
	const $offerList = $('.offer-list');
	const $offerTemplateHtml = $(offerTemplateHtml);
	fillOffersList($offerList, $offerTemplateHtml, offersInfo);
	const html = $.html();
	timeStop();
	return html;
}

export async function getDataForVisualization(
	storage: IRepository
): Promise<IOffersInfo | null> {
	let timeStop = timeStart('Read data for the visualization');

	// const [dirFiles, directoryPath] = await getDirFiles('all_offers');
	// const files = sortFilesByDate(dirFiles);

	// if (dirFiles.length === 0) {
	// 	l.warn('There is no files with data for the visualization.');
	// 	return null;
	// }

	// const youngestFile = files[files.length - 1];

	// const fileData = await readOffersFile(directoryPath, youngestFile.fileName);

	// return mapFileData(fileData);
	const offersInfo = await storage.getNewOffers();
	timeStop();
	return offersInfo;
}

export async function getTemplates(): Promise<[page: string, offer: string]> {
	const timeStop = timeStart('Read the html templates');
	const dirPath = path.join(process.cwd(), 'src', 'assets');
	const [page, offer] = await Promise.all([
		fsPromises.readFile(path.join(dirPath, 'template.html'), 'utf-8'),
		fsPromises.readFile(path.join(dirPath, 'templateOffer.html'), 'utf-8')
	]);
	timeStop();
	return [page, offer];
}

export function fillOffersList(
	$offerList: cheerio.Cheerio,
	$offerTemplate: cheerio.Cheerio,
	offersInfo: IOffersInfo | null
) {
	if (offersInfo === null || offersInfo.offerList.length === 0) {
		$offerList.html(`<p>There is no data to show 😱</p>`);
	} else {
		const offers = offersInfo.offerList;
		offers.forEach((offer, idx) => {
			const $offer = $offerTemplate.clone();
			const $idx = $offer.find(offerClasses.index);
			$idx.text(idx + 1 + '.');
			const $link = $offer.find(offerClasses.link);
			$link.attr('href', offer.url);
			const $image = $offer.find(offerClasses.image);
			$image.attr('src', offer.imgUrl);
			const $title = $offer.find(offerClasses.title);
			$title.text(offer.title);
			const $price = $offer.find(offerClasses.price);

			const priceArr = offer.price.split('.');
			let price = priceArr[0]
				.split('')
				.reverse()
				.reduce((value, element, idx) => {
					if (idx === 3 || idx === 6) {
						return element + ' ' + value;
					}
					return element + value;
				});
			if (priceArr.length > 1) {
				price += '.' + priceArr[1];
			}
			$price.text(price);
			const $date = $offer.find(offerClasses.date);
			$date.text(offer.dt);
			const $description = $offer.find(offerClasses.description);
			$description.html(offer.description.replace(/\n/g, '<br />'));
			const $scrape = $offer.find(offerClasses.scrape);
			$scrape.text('null');
			const $site = $offer.find(offerClasses.site);
			$site.text(offer.site);
			$offer.appendTo($offerList);
		});
	}

	return $offerList;
}
