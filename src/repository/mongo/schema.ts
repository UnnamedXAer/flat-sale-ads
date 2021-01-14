import { Schema, Document } from 'mongoose';
import { IOffer, siteNames } from '../../types';

export const offerSchema = new Schema<Document<IOffer>>({
	id: { type: String, required: true },
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
