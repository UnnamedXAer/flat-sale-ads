const data = require('./data/analyzed/2021-01-06-14-17_1609939035102.json');

const prop = process.argv[2] || 'url';
const values = data.map((x) => x[prop]);

values.forEach((value, i, arr) => {
	const idx = arr.indexOf(value, i + 1);
	if (idx > -1) {
		console.log(i, '->', idx, prop + ': ', value);
		console.log(idx + '. ' + data[i]['url'].toString().slice(0, 100));
		console.log(idx + '. ' + data[idx]['url'].toString().slice(0, 100));
	}
});

console.log(`<${prop}> manual data check - Done!`);
