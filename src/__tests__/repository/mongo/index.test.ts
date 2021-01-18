import { MongoMemoryServer } from 'mongodb-memory-server';
import { l } from '../../../__mocks__/logger';
import { MongoRepository } from '../../../repository/mongo';
import { OfferModel, TemporaryOfferModel } from '../../../repository/mongo/model';
import { IOffer, IOffersInfo } from '../../../types';
import { ConnectOptions } from 'mongoose';
import { mockOffersListInfos } from '../../../__mocks__/data';

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
		reconnectInterval: 1000,
		useNewUrlParser: true,
		useUnifiedTopology: true,
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

			expect(await TemporaryOfferModel.countDocuments()).toBe(0);
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

