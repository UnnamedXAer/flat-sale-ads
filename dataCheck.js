const data = require('./data/all_offers/2021-01-09-17-05_1610208307192');

const prop = process.argv[2] || 'url';
const values = data.offers.map((x) => x[prop]);

values.forEach((value, i, arr) => {
	const idx = arr.indexOf(value, i + 1);
	if (idx > -1) {
		console.log(i, '->', idx, prop + ': ', value);
		console.log(idx + '. ' + data[i]['url'].toString().slice(0, 100));
		console.log(idx + '. ' + data[idx]['url'].toString().slice(0, 100));
	}
});

console.log(`<${prop}> manual data check - Done!`);
