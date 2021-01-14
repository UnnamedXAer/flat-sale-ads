import mongoose from 'mongoose';
import logger from '../../logger';
import { IOffer, IRepository, Logger } from '../../types';
import { IOfferModel, OfferModel, TemporaryOfferModel } from './model';

interface MongoModels {
	offer: typeof OfferModel;
	tmpOffer: typeof TemporaryOfferModel;
}

export class MongoRepository implements IRepository {
	private models: MongoModels;
	private l: Logger;
	private connection: typeof mongoose | null = null;

	constructor(logger: Logger, models: MongoModels) {
		this.models = models;
		this.l = logger;
	}

	async deleteById(id: string): Promise<void> {
		await this.models.offer.deleteOne({ id });
		this.l.debug(`Offer deleted, id: "${id}"`);
	}

	private mapOffer(offer: IOfferModel): IOffer {
		return {
			url: offer.url,
			_dt: offer._dt,
			description: offer.description,
			dt: offer.dt,
			id: offer.id,
			imgUrl: offer.imgUrl,
			price: offer.price,
			scrapedAt: offer.scrapedAt,
			site: offer.site,
			title: offer.title
		};
	}

	async saveOffers(offers: IOffer | IOffer[]): Promise<void> {
		const isManyOffers = Array.isArray(offers);

		const _results = await this.models.offer.create(offers);
		this.l.debug(
			'Offers saved. Count: ',
			isManyOffers ? (offers as IOffer[]).length : 1
		);

		return;
	}

	async update(): Promise<void> {
		throw new Error('Method not implemented yet.');
	}

	async getAll(): Promise<IOffer[]> {
		const results = await this.models.offer.find({});
		const users: IOffer[] = results.map(this.mapOffer);
		this.l.debug('Number of all offers in storage is: ', users.length);
		return users;
	}

	async getById(id: string): Promise<IOffer | null> {
		const offer = await this.models.offer.findById(id);
		if (offer === null) {
			this.l.debug(`Offer does not exist, id: "${id}"`);

			return null;
		}
		return this.mapOffer(offer);
	}

	async saveTmpOffers(offers: IOffer[]): Promise<void> {
		const _results = await this.models.tmpOffer.create(offers);
		this.l.debug(`Temporary offers saved. count: ${offers.length}`);

		return;
	}

	async getTmpOffers(): Promise<IOffer[]> {
		const offers = await this.models.tmpOffer.find({}); //.sort({ created_at: -1 });

		this.l.debug('Number of temporary offers in storage is: ', offers.length);

		return offers.map(this.mapOffer);
	}

	async deleteTmpOffers(): Promise<void> {
		const _results = await this.models.tmpOffer.remove({});
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
	offer: OfferModel,
	tmpOffer: TemporaryOfferModel
});
