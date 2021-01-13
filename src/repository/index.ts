import mongoose from 'mongoose';
import l from '../logger';
import { IOffer, Logger } from '../types';
import { IOfferModel, OfferModel } from './model';

export class MongoRepository {
	private offerModel: typeof OfferModel;
	private l: Logger;
	private connection: typeof mongoose | null = null;

	constructor(logger: Logger, model: typeof OfferModel) {
		this.offerModel = model;
		this.l = logger;
	}

	async deleteById(id: string): Promise<void> {
		await this.offerModel.deleteOne({ id });
	}

	private mapOffer(o: IOfferModel): IOffer {
		return {
			url: o.url,
			_debugInfo: o._debugInfo,
			_dt: o._dt,
			description: o.description,
			dt: o.dt,
			id: o.id,
			imgUrl: o.imgUrl,
			price: o.price,
			scrapedAt: o.scrapedAt,
			site: o.site,
			title: o.title
		};
	}

	async create(o: IOffer | IOffer[]): Promise<void> {
		let offers: IOffer[] | IOffer;
		if (Array.isArray(o)) {
			offers = o.map<IOffer>((offer) => ({
				...offer
			}));
		} else {
			offers = {
				url: o.url,
				_debugInfo: o._debugInfo,
				_dt: o._dt,
				description: o.description,
				dt: o.dt,
				id: o.id,
				imgUrl: o.imgUrl,
				price: o.price,
				scrapedAt: o.scrapedAt,
				site: o.site,
				title: o.title
			};
		}
		const _results = await this.offerModel.create(offers);
		return;
	}

	async getAll(): Promise<IOffer[]> {
		const results = await this.offerModel.find({});
		const users: IOffer[] = results.map(this.mapOffer);
		return users;
	}

	async getById(id: string): Promise<IOffer | null> {
		const o = await this.offerModel.findById(id);
		if (o === null) {
			return null;
		}
		return this.mapOffer(o);
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

export const storage = new MongoRepository(l, OfferModel);
