const data = require('./data/gethome/2021-01-04-15-05.json');

const prop = 'url';
const values = data.map((x) => x[prop]);

values.forEach((value, i, arr) => {
	const idx = arr.indexOf(value, i + 1);
	if (idx > -1) console.log(i, '->', idx, prop + ': ', value);
});

console.log('manual data check - Done!');
