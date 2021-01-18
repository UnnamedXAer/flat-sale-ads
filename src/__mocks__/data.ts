import { config } from '../config';
import { IOffersInfo, siteNames, IOffer } from '../types';

export const mockOffersListInfos: IOffersInfo[] = siteNames.map((site, siteIdx) => {
	const date = new Date();
	const offerList: IOffer[] = new Array(5).fill(1).map((_, i) => ({
		_dt: date,
		dt: date.toLocaleString(...config.dateTimeFormatParams),
		offerId: process.hrtime.bigint().toString() + i,
		price: [
			siteIdx.toString(),
			process.hrtime.bigint().toString().substr(-5, 2),
			i,
			'00'
		].join(''),
		scrapedAt: date,
		site: site,
		title: `The offer #${i + 1}`,
		description: `The offer #${i + 1}. Size: ${10 * (i + 1) + siteIdx * 1.5}`,
		url: 'https://jestjs.io',
		imgUrl: 'https://docs.mongodb.com/images/mongodb-logo.png'
	}));
	return {
		date: date,
		offerList
	};
});
