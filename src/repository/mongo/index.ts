import mongoose, { ConnectOptions } from 'mongoose';
import { globals } from '../../global';
import logger from '../../logger';
import { IOffer, IOffersInfo, IRepository, Logger, siteNames } from '../../types';
import { IOffersInfoDocument, OfferModel, TemporaryOfferModel } from './model';

export interface MongoModels {
	allOffers: typeof OfferModel;
	tmpOffers: typeof TemporaryOfferModel;
}

export class MongoRepository implements IRepository {
	private models: MongoModels;
	private l: Logger;
	private connection: typeof mongoose | null = null;

	constructor(logger: Logger, models: MongoModels) {
		this.models = models;
		this.l = logger;
	}

	private mapOffer(offerDoc: IOffer /* wrong type */): IOffer {
		const offer: IOffer = {
			url: offerDoc.url,
			dt_: offerDoc.dt_,
			description: offerDoc.description,
			dt: offerDoc.dt,
			offerId: offerDoc.offerId,
			imgUrl: offerDoc.imgUrl,
			price: offerDoc.price,
			scrapedAt: offerDoc.scrapedAt,
			site: offerDoc.site,
			title: offerDoc.title
		};

		return offer;
	}

	private mapOffers(
		offerDocs: IOffer[] /* wrong type, -> create IOfferDocument // CoreDocumentArray*/
	): IOffer[] {
		const offers: IOffer[] = [];
		for (let i = 0, count = offerDocs.length; i < count; i++) {
			offers.push(this.mapOffer(offerDocs[i]));
		}

		return offers;
	}

	private mapOffersInfo(offersInfoDoc: IOffersInfoDocument): IOffersInfo {
		const offerInfo: IOffersInfo = {
			date: offersInfoDoc.date,
			offerList: this.mapOffers(offersInfoDoc.offerList)
		};

		return offerInfo;
	}

	async getNewOffers(): Promise<IOffersInfo | null> {
		const offersInfo = await this.models.allOffers.findOne().sort({ _id: -1 });

		if (offersInfo === null) {
			this.l.debug('There are no [new] offers.');
			return null;
		}

		this.l.debug(
			`Number of new offers in storage is: ${offersInfo.offerList.length}, scraped at: ${offersInfo.date}`
		);

		return this.mapOffersInfo(offersInfo);
	}

	async saveNewOffers(offers: IOffer[], date: Date): Promise<void> {
		const _results = await this.models.allOffers.create<IOffersInfo>({
			date,
			offerList: offers
		});
		this.l.debug('Offers saved. count: ', offers.length);

		return;
	}

	async getAllOffers(): Promise<IOffer[]> {
		const results = await this.models.allOffers.find({});
		const offers = results.flatMap((oI: IOffersInfoDocument) =>
			//
			// this.mapOffers(oI.offerList)
			oI.offerList.map(this.mapOffer)
		);
		this.l.debug('Number of all offers in storage is: ', offers.length);
		return offers;
	}

	async saveTmpOffers(offers: IOffer[], date: Date): Promise<void> {
		const _results = await this.models.tmpOffers.create<IOffersInfo>({
			date: date,
			offerList: offers
		});
		this.l.debug(`Temporary offers saved. count: ${offers.length}`);

		return;
	}

	async getTmpOffers(): Promise<IOffersInfo[]> {
		const offersInfoDocs = await this.models.tmpOffers
			.find({})
			.sort({ created_at: -1 });

		// @todo: merge offers for all sites into one list ore return them as list od offers infos.
		if (offersInfoDocs.length === 0) {
			this.l.debug('There are no [temporary] offers infos.');
			return [];
		}

		this.l.debug(
			'Number of temporary offers infos in storage is: ',
			offersInfoDocs.length
		);
		if (offersInfoDocs.length != siteNames.length) {
			this.l.warn(
				`Number of temporary offers infos in storage (${offersInfoDocs.length}) is different than number of sites (${siteNames.length}).`
			);
		}

		const offersInfos = offersInfoDocs.map((oi: IOffersInfoDocument) =>
			this.mapOffersInfo(oi)
		);
		return offersInfos;
	}

	async deleteTmpOffers(): Promise<void> {
		const _results = await this.models.tmpOffers.deleteMany({});
		this.l.debug(`"Temporary Offers" removed all. count: `, _results.deletedCount);
		return;
	}

	async deleteAllOffers(): Promise<void> {
		const _results = await this.models.allOffers.deleteMany({});
		this.l.debug(`"All Offers" removed all. count: `, _results.deletedCount);
		return;
	}

	async connect(uri: string, options?: ConnectOptions) {
		this.l.info('Connecting to mongodb...');
		this.connection = await mongoose.connect(uri, options);
		this.l.info('Successfully connected to mongodb.');
	}

	async disconnect(force?: boolean) {
		if (!force && globals.SERVER_UP) {
			this.l.info('Disconnecting prevented due to server being up!');
			return;
		}
		if (this.connection !== null) {
			this.connection.disconnect();
			this.l.info('Disconnected from mongodb');
		}
	}
}

export const storage = new MongoRepository(logger, {
	allOffers: OfferModel,
	tmpOffers: TemporaryOfferModel
});

export const createStorage = () => {
	return new MongoRepository(logger, {
		allOffers: OfferModel,
		tmpOffers: TemporaryOfferModel
	});
};
export const connectToStorage = () => {
	const connectOptions = {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useFindAndModify: false,
		useCreateIndex: true
	};
	return storage.connect(
		process.env.MONGO_URI as string,
		connectOptions as ConnectOptions
	);
};
