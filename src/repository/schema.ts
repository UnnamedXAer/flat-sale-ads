import { Schema, Document, model } from 'mongoose';
import { IOffer, siteNames } from '../types';

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
	title: { type: String, required: true },
	price: { type: String, required: true },
	description: { type: String, required: true },
	url: { type: String, required: true },
	imgUrl: { type: String, required: true },
	_debugInfo: {
		idx: { type: Number },
		url: { type: String }
	}
});
