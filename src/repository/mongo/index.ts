import mongoose from 'mongoose';
import logger from '../../logger';
import { IOffer, IOffersInfo, IRepository, Logger } from '../../types';
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
		const offersInfo = await this.models.tmpOffers.findOne().sort({ created_at: -1 });

		if (offersInfo === null) {
			this.l.debug('There are no [new] offers.');
			return null;
		}

		this.l.debug(
			`Number of new offers in storage is: ${offersInfo.offerList.length}, scraped at: ${offersInfo.date}`
		);

		return this.mapOffersInfo(offersInfo);
	}

	async saveNewOffers(offers: IOffer | IOffer[], date: Date): Promise<void> {
		const isManyOffers = Array.isArray(offers);

		const _results = await this.models.allOffers.create(offers);
		this.l.debug(
			'Offers saved. Count: ',
			isManyOffers ? (offers as IOffer[]).length : 1
		);

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

	async getTmpOffers(): Promise<IOffersInfo | null> {
		const offersInfo = await this.models.tmpOffers.find({}).sort({ created_at: -1 });
		throw new Error('tmp offers are not merged into one "IOffersInfo".');
		// @todo: merge offers for all sites into one list ore return them as list od offers infos.
		if (offersInfo.length === 0) {
			this.l.debug('There are no [temporary] offers infos.');
			return null;
		}

		this.l.debug(
			'Number of temporary offers infos in storage is: ',
			offersInfo.length
		);
		if (offersInfo.length > 1) {
			this.l.warn(
				'Number of temporary offers infos in storage is is more then one- > returning the newest "offers info". _id:',
				offersInfo[0]._id,
				'offers info date:',
				offersInfo[0].date
			);
		}

		return this.mapOffersInfo(offersInfo[0]);
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