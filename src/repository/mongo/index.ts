import mongoose from 'mongoose';
import logger from '../../logger';
import { IOffer, IRepository, Logger } from '../../types';
import { IOfferModel, OfferModel } from './model';

export class MongoRepository implements IRepository {
	private offerModel: typeof OfferModel;
	private l: Logger;
	private connection: typeof mongoose | null = null;

	constructor(logger: Logger, model: typeof OfferModel) {
		this.offerModel = model;
		this.l = logger;
	}

	async deleteById(id: string): Promise<void> {
		await this.offerModel.deleteOne({ id });
		this.l.debug(`Offer deleted, id: "${id}"`);
	}

	private mapOffer(offer: IOfferModel): IOffer {
		return {
			url: offer.url,
			_debugInfo: offer._debugInfo,
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

	async create(offers: IOffer | IOffer[]): Promise<void> {
		const isManyOffers = Array.isArray(offers);

		const _results = await this.offerModel.create(offers);
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
		const results = await this.offerModel.find({});
		const users: IOffer[] = results.map(this.mapOffer);
		this.l.debug('Number of all offers in storage is: ', users.length);
		return users;
	}

	async getById(id: string): Promise<IOffer | null> {
		const offer = await this.offerModel.findById(id);
		if (offer === null) {
			this.l.debug(`Offer does not exist, id: "${id}"`);

			return null;
		}
		return this.mapOffer(offer);
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

export const storage = new MongoRepository(logger, OfferModel);
