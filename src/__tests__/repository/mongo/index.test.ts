import { MongoMemoryServer } from 'mongodb-memory-server';
import { config } from '../../../config';
import { l } from '../../../__mocks__/logger';
import { MongoRepository } from '../../../repository/mongo';
import { OfferModel, TemporaryOfferModel } from '../../../repository/mongo/model';
import { IOffer, IOffersInfo, siteNames } from '../../../types';
import { ConnectOptions } from 'mongoose';

let mongoServer: MongoMemoryServer;
const storage = new MongoRepository(l, {
	allOffers: OfferModel,
	tmpOffers: TemporaryOfferModel
});
beforeAll(async () => {
	mongoServer = new MongoMemoryServer();
	const uri = await mongoServer.getUri();
	const mongooseOpts: ConnectOptions = {
		// options for mongoose 4.11.3 and above
		autoReconnect: true,
		reconnectTries: Number.MAX_VALUE,
		reconnectInterval: 1000
	};
	await storage.connect(uri, mongooseOpts);
});

afterAll(async () => {
	await storage.disconnect();
	mongoServer.stop();
});

describe('test mongo repository', () => {
	describe('test temporary offers storage', () => {
		test('should save temporary offers info', async () => {
			const mockOffersInfo: IOffersInfo = mockOffersListInfos[0];

			await storage.saveTmpOffers(mockOffersInfo.offerList, mockOffersInfo.date);

			const offersInfoResults = await TemporaryOfferModel.find({
				date: mockOffersInfo.date
			});

			expect(offersInfoResults.length).toBe(1);
			expect(offersInfoResults[0].offerList.length).toBe(
				mockOffersInfo.offerList.length
			);

			mockOffersInfo.offerList.forEach((mockOffer, idx) => {
				for (const key in mockOffer) {
					expect(
						offersInfoResults[0].offerList[idx][key as keyof IOffer]
					).toStrictEqual(mockOffer[key as keyof IOffer]);
				}
			});
		});

		test('should delete all temporary offers', async () => {
			await storage.deleteTmpOffers();

			expect(await TemporaryOfferModel.count()).toBe(0);
		});

		test('should read temporary offers info', async () => {
			await TemporaryOfferModel.create(mockOffersListInfos);
			const results = await storage.getTmpOffers();

			expect(results.length).toBe(mockOffersListInfos.length);
			expect(results).toEqual(mockOffersListInfos);
		});
	});

	describe('test new offers', () => {
		test('should save new offers info', async () => {
			const mockOffersInfo: IOffersInfo = mockOffersListInfos[0];

			await storage.saveNewOffers(mockOffersInfo.offerList, mockOffersInfo.date);

			const offersInfoResults = await OfferModel.find({
				date: mockOffersInfo.date
			});

			expect(offersInfoResults.length).toBe(1);
			expect(offersInfoResults[0].offerList.length).toBe(
				mockOffersInfo.offerList.length
			);

			mockOffersInfo.offerList.forEach((mockOffer, idx) => {
				for (const key in mockOffer) {
					expect(
						offersInfoResults[0].offerList[idx][key as keyof IOffer]
					).toStrictEqual(mockOffer[key as keyof IOffer]);
				}
			});
		});

		test('should read new offers info', async () => {
			await OfferModel.deleteMany();
			let results = await storage.getNewOffers();
			expect(results).toBe(null);

			await OfferModel.create(mockOffersListInfos);
			results = await storage.getNewOffers();

			expect(results).toEqual(mockOffersListInfos[mockOffersListInfos.length - 1]);
		});
	});

	describe('test all offers', () => {
		test('should return all offers', async () => {
			const results = await storage.getAllOffers();

			expect(results).toEqual(
				mockOffersListInfos.flatMap((offerInfo) => offerInfo.offerList)
			);
		});
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
