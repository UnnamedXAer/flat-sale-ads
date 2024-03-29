export type NODE_ENV = 'production' | 'development' | 'test';
export type EnvPrefix = 'test' | 'dev' | 'prod';

export const siteNames = [
  'rzeszowiakAgencje',
  'rzeszowiak',
  'olx',
  'otodom',
  'gethome'
] as const;
export type SiteName = typeof siteNames[number];
export type DataDirectory = SiteName | 'analyzed' | 'visualization' | 'all_offers';

export interface SimplyFile {
  createTime: number;
  fileName: string;
}

export interface Logger {
  silly(...args: any[]): void;
  trace(...args: any[]): void;
  debug(...args: any[]): void;
  info(...args: any[]): void;
  warn(...args: any[]): void;
  error(...args: any[]): void;
  fatal(...args: any[]): void;
}

export enum TLogLevel {
  silly,
  trace,
  debug,
  info,
  warn,
  error,
  fatal
}

export interface Config {
  NODE_ENV: NODE_ENV;
  isDev: boolean;
  envPrefix: EnvPrefix;
  scrapeSiteTimeout: number;
  startMaximized: boolean;
  skipVisualization: boolean;
  logsLevel: TLogLevel;
  appTemporaryDataFolder: string;
  dateTimeFormatParams: [string, Intl.DateTimeFormatOptions];
  dateFormatParams: [string, Intl.DateTimeFormatOptions];
  timeFormatParams: [string, Intl.DateTimeFormatOptions];
  urls: {
    [key in SiteName]: string;
  };
}

export interface IRepository {
  getAllOffers(): Promise<IOffer[]>;
  saveNewOffers(o: IOffer[], date: Date): Promise<void>;
  getNewOffers(): Promise<IOffersInfo | null>;
  saveTmpOffers(o: IOffer[], date: Date): Promise<void>;
  getTmpOffers(): Promise<IOffersInfo[]>;
  deleteAllOffers(): Promise<void>;
  deleteTmpOffers(): Promise<void>;
  connect(uri: string, options?: { [key: string]: string }): Promise<void>;
  disconnect(): Promise<void>;
}

export type ConnectToStorage = (logger: Logger) => Promise<IRepository>;

export enum RepositoryName {
  Mongo = 'mongo',
  Files = 'files',
  PostgreSql = 'postgreSql'
}

export interface IOffer {
  site: SiteName;
  offerId: string;
  scrapedAt: Date;
  dt: string;
  dt_: Date;
  title: string;
  price: string;
  description: string;
  url: string;
  imgUrl: string;
}

export interface OfferTextFileData {
  site: SiteName;
  id: string;
  dt: string;
  scrapedAt: string;
  _dt: string;
  title: string;
  price: string;
  description: string;
  url: string;
  imgUrl: string;
}

export interface DirectoryOffers {
  offers: IOffer[];
  directory: DataDirectory;
  scrapedAt: Date;
}

export interface IOffersInfo {
  id?: number;
  date: Date;
  offerList: IOffer[];
}

export interface ReadTextFileData {
  date: string;
  offers: OfferTextFileData[];
}
