import { Schema, Document, Model } from 'mongoose';
import { IOffer, IOffersInfo, siteNames } from '../../types';

const offerSchema = new Schema<Document<IOffer>, Model<Document<IOffer>>>({
	offerId: { type: String, required: true },
	site: {
		type: String,
		required: true,
		match: new RegExp(siteNames.join('|'))
	},
	dt: { type: String, required: true },
	scrapedAt: { type: Date, required: true },
	_dt: { type: Date, required: true },
	title: { type: String },
	price: { type: String },
	description: { type: String },
	url: { type: String, required: true },
	imgUrl: { type: String }
});

export const offersInfoSchema = new Schema<
	Document<IOffersInfo>,
	Model<Document<IOffersInfo>>
>({
	date: { type: Date, required: true },
	offerList: { type: [offerSchema], required: true, _id: false }
});
