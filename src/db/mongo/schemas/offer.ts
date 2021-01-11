import mongoose from 'mongoose';

const OfferSchema = new mongoose.Schema({
	id: String,
	dt: Date,
	dtText: String,
	site: {
		type: String,
		match: /rzeszowiak|olx|otodom|gethome/
	},
	title: String,
	price: String,
	description: String,
	url: String,
	imgUrl: String,
	_debugInfo: {
		idx: Number,
		url: String
	}
});

export default OfferSchema;
