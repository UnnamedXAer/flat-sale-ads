const data = require('./data/analyzed/2021-01-05-21-52_1609879929615.json');

const prop = 'url';
const values = data.map((x) => x[prop]);

values.forEach((value, i, arr) => {
	const idx = arr.indexOf(value, i + 1);
	if (idx > -1) console.log(i, '->', idx, prop + ': ', value);
});

console.log('manual data check - Done!');
