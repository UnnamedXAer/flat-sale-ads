import { Config, NODE_ENV } from './types';
import { getEnvPrefix } from './envPrefix';
import path from 'path';
import os from 'os';
const { name } = require('../package.json');

export const createConfig = (process: NodeJS.Process): Config => {
	const lang = process.env.LOCALE_LANG || 'pl-PL';
	const timeFormatOptions: Intl.DateTimeFormatOptions = {
		hour12: false,
		hour: '2-digit',
		minute: '2-digit'
	};
	const dateFormatOptions: Intl.DateTimeFormatOptions = {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	};

	return {
		NODE_ENV: (process.env.NODE_ENV as NODE_ENV) || 'development',
		isDev: process.env.NODE_ENV !== 'production',
		envPrefix: getEnvPrefix(),
		scrapeSiteTimeout: 1000 * 160,
		startMaximized: !!process.env.START_BROWSER_MAXIMIZED,
		skipVisualization: !!process.env.SKIP_VISUALIZATION,
		logsLevel:
			(process.env.LOGS_LEVEL as Config['logsLevel'] | undefined) ||
			(process.env.NODE_ENV === 'production' ? 'warn' : 'silly'),
		appTemporaryDataFolder: path.join(
			process.env.LOCALAPPDATA
				? process.env.LOCALAPPDATA
				: path.join(os.homedir(), 'AppData', 'Local'),
			name
		),
		timeFormatParams: [lang, timeFormatOptions],
		dateFormatParams: [lang, dateFormatOptions],
		dateTimeFormatParams: [
			lang,
			{
				...dateFormatOptions,
				...timeFormatOptions
			}
		],
		urls: {
			rzeszowiak:
				process.env.URL_RZESZOWIAK ||
				'http://www.rzeszowiak.pl/Nieruchomosci-Sprzedam-agencje-2580011252?r=mieszkania',

			// location = Rzeszów +10km
			// price = 100k-400k
			// category = sell
			// ordered by create date
			olx:
				process.env.URL_OLX ||
				'https://www.olx.pl/nieruchomosci/mieszkania/sprzedaz/rzeszow/?search%5Bfilter_float_price%3Afrom%5D=100000&search%5Bfilter_float_price%3Ato%5D=400000&search%5Border%5D=created_at%3Adesc&search%5Bdist%5D=10',

			// location = Rzeszów +10km
			// price = 100k-400k
			// last 3 days,
			// category = sell
			// ordered by create date
			otodom:
				process.env.URL_OTODOM ||
				'https://www.otodom.pl/sprzedaz/mieszkanie/rzeszow/?search%5Bfilter_float_price_per_m%3Afrom%5D=100000&search%5Bfilter_float_price_per_m%3Ato%5D=400000&search%5Bcreated_since%5D=3&search%5Bcity_id%5D=201&search%5Bdist%5D=10&search%5Border%5D=created_at_first%3Adesc&nrAdsPerPage=72',
			gethome:
				process.env.URL_GETHOME ||
				'https://gethome.pl/mieszkania/na-sprzedaz/rzeszow/?price__gte=100000&price__lte=400000&sort=-created'
		}
	};
};

export const config = createConfig(process);
