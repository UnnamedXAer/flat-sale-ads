import { MongoMemoryServer } from 'mongodb-memory-server';
import { config } from '../../../config';
import l from '../../../logger';
import { MongoRepository } from '../../../repository/mongo';
import { OfferModel, TemporaryOfferModel } from '../../../repository/mongo/model';
import { IOffer, IOffersInfo, siteNames } from '../../../types';

const mongoServer = new MongoMemoryServer();
const storage = new MongoRepository(l, {
	allOffers: OfferModel,
	tmpOffers: TemporaryOfferModel
});
beforeAll(async () => {
	const uri = await mongoServer.getUri();

	await storage.connect(uri);
});

afterAll(() => storage.disconnect());

describe('test mongo repository', () => {
	test('should save temporary offers info', async () => {
		const mockOffersInfo: IOffersInfo = mockOffersListInfos[0];

		await storage.saveTmpOffers(mockOffersInfo.offerList, mockOffersInfo.date);

		const offersInfoResults = await TemporaryOfferModel.find();

		expect(offersInfoResults).toEqual(mockOffersInfo);
	});
});

const mockOffersListInfos: IOffersInfo[] = siteNames.map((site, siteIdx) => {
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

// [
// 	{
// 		_dt: new Date(),
// 		dt: new Date().toLocaleString(...config.dateTimeFormatParams),
// 		offerId: process.hrtime.bigint().toString(),
// 		price: process.hrtime.bigint().toString().slice(-6),
// 		scrapedAt: new Date(),
// 		site: 'gethome',
// 		title: 'The first',
// 		description: 'The first offer.',
// 		url: 'https://jestjs.io',
// 		imgUrl: 'https://docs.mongodb.com/images/mongodb-logo.png'
// 	},
// 	{
// 		_dt: new Date(),
// 		dt: new Date().toLocaleString(...config.dateTimeFormatParams),
// 		offerId: process.hrtime.bigint().toString(),
// 		price: process.hrtime.bigint().toString().slice(-6),
// 		scrapedAt: new Date(),
// 		site: 'gethome',
// 		title: 'The second',
// 		description: 'The second offer.',
// 		url: 'https://jestjs.io',
// 		imgUrl: 'https://docs.mongodb.com/images/mongodb-logo.png'
// 	},
// 	{
// 		_dt: new Date(),
// 		dt: new Date().toLocaleString(...config.dateTimeFormatParams),
// 		offerId: process.hrtime.bigint().toString(),
// 		price: process.hrtime.bigint().toString().slice(-6),
// 		scrapedAt: new Date(),
// 		site: 'gethome',
// 		title: 'The third',
// 		description: 'The third offer.',
// 		url: 'https://jestjs.io',
// 		imgUrl: 'https://docs.mongodb.com/images/mongodb-logo.png'
// 	}
// ]
