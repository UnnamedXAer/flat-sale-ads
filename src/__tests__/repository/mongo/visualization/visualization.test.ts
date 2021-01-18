import cheerioModule from 'cheerio';
import mongoose from 'mongoose';
const fsPromises = require('fs/promises');
const child_process = require('child_process');
import { MongoModels, MongoRepository } from '../../../../repository/mongo';
import {
	createVisualization,
	fillOffersList,
	generateOffersPageHtml,
	getDataForVisualization,
	getTemplates,
	openVisualization
} from '../../../../visualization/visualization';
import { mockOffersListInfos } from '../../../../__mocks__/data';
import { l } from '../../../../__mocks__/logger';

describe('test generation of the html for the offers', () => {
	let [page, offer]: [string, string] = ['', ''];

	test('should return page and offer html templates as texts', async () => {
		[page, offer] = await getTemplates();

		expect(typeof page).toBe('string');
		expect(typeof offer).toBe('string');
	});

	test('should call mongo repository for new offers', async () => {
		const storage = new MongoRepository(l, {} as MongoModels);
		const mockStorageGetNewOffers = jest.spyOn(storage, 'getNewOffers');
		mockStorageGetNewOffers.mockImplementation(async () => mockOffersListInfos[0]);
		const _offers = await getDataForVisualization(storage);

		expect(mockStorageGetNewOffers).toBeCalled();
	});

	test('should fill offer list template with offers', async () => {
		const $ = cheerioModule.load(page);
		const $offerList = $('.offer-list');
		const $offerTemplateHtml = $(offer);
		const offerTemplateCloneSpy = jest.spyOn($offerTemplateHtml, 'clone');
		const $offerListUpdated = fillOffersList(
			$offerList,
			$offerTemplateHtml,
			mockOffersListInfos[0]
		);
		expect(offerTemplateCloneSpy).toBeCalledTimes(
			mockOffersListInfos[0].offerList.length
		);

		expect($offerListUpdated.find('.offer').length).toBe(
			mockOffersListInfos[0].offerList.length
		);
	});

	test('should fill offer list with info about lack of new offers', () => {
		const $ = cheerioModule.load(page);
		const $offerList = $('.offer-list');
		const $offerTemplateHtml = $(offer);
		const offerTemplateCloneSpy = jest.spyOn($offerTemplateHtml, 'clone');
		const $offerListUpdated = fillOffersList($offerList, $offerTemplateHtml, null);
		expect(offerTemplateCloneSpy).toBeCalledTimes(0);

		expect($offerListUpdated.find('p').text()).toBe('There is no data to show 😱');
	});

	test('should return full page html with offers', () => {
		const cheerioLoadSpy = jest.spyOn(cheerioModule, 'load');
		const html = generateOffersPageHtml(page, offer, mockOffersListInfos[0]);
		expect(cheerioLoadSpy).toBeCalledTimes(1);
		expect(typeof html).toBe('string');
		expect(html.includes('class="offer"')).toBe(true);
	});

	test('should spawn new process', () => {
		const spawnSpy = jest.spyOn(child_process, 'spawn');
		spawnSpy.mockImplementationOnce(() => {});
		const pathExample = 'C:/my_path/my_file.html';
		openVisualization(pathExample);
		expect(spawnSpy).toBeCalledWith('explorer', [pathExample]);
	});

	test('should create and save html file with offers', async () => {
		// jest.doMock('mongoose');
		const storage = {
			getNewOffers: async () => mockOffersListInfos[0]
		} as MongoRepository;

		jest.mock('fs/promises', () => {
			writeFile: async () => {};
		});

		const writeFileSpy = jest.spyOn(fsPromises, 'writeFile');
		writeFileSpy.mockImplementationOnce(async (...args: any) => {
			console.log('args', args);
			return await undefined;
		});

		// await createVisualization(storage);
		expect(writeFileSpy).toBeCalledTimes(1);
	});
});
