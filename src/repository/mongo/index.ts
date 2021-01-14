import mongoose from 'mongoose';
import logger from '../../logger';
import { IOffer, IOffersInfo, IRepository, Logger, siteNames } from '../../types';
import { IOffersInfoDocument, OfferModel, TemporaryOfferModel } from './model';

interface MongoModels {
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

	private mapOffer(offer: IOffer): IOffer {
		return {
			url: offer.url,
			_dt: offer._dt,
			description: offer.description,
			dt: offer.dt,
			offerId: offer.offerId,
			imgUrl: offer.imgUrl,
			price: offer.price,
			scrapedAt: offer.scrapedAt,
			site: offer.site,
			title: offer.title
		};
	}

	private mapOffersInfo(offersInfo: IOffersInfoDocument): IOffersInfo {
		return {
			date: offersInfo.date,
			offerList: offersInfo.offerList.map(this.mapOffer)
		};
	}

	async getNewOffers(): Promise<IOffersInfo | null> {
		const offersInfo = await this.models.allOffers.findOne().sort({ created_at: -1 });

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
		this.l.debug('Offers saved. Count: ', offers.length);

		return;
	}

	async getAllOffers(): Promise<IOffer[]> {
		const results = await this.models.allOffers.find({});
		const offers = results.flatMap((oI: IOffersInfoDocument) =>
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
		const offersInfos = await this.models.tmpOffers.find({}).sort({ created_at: -1 });

		// @todo: merge offers for all sites into one list ore return them as list od offers infos.
		if (offersInfos.length === 0) {
			this.l.debug('There are no [temporary] offers infos.');
			return [];
		}

		this.l.debug(
			'Number of temporary offers infos in storage is: ',
			offersInfos.length
		);
		if (offersInfos.length != siteNames.length) {
			this.l.warn(
				'Number of temporary offers infos in storage is different than number of sites.'
			);
		}

		return offersInfos.map((oi) => this.mapOffersInfo(oi));
	}

	async deleteTmpOffers(): Promise<void> {
		const _results = await this.models.tmpOffers.remove({});
		this.l.debug(`Temporary offers removed.`);
		return;
	}

	async connect() {
		this.l.info('Connecting to mongodb...');
		this.connection = await mongoose.connect(process.env.MONGO_URI as string, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
			useFindAndModify: false,
			useCreateIndex: true
		});
		this.l.info('Successfully connected to mongodb.');
	}

	async disconnect() {
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
