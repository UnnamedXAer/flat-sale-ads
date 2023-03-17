import { PrismaClient } from '@prisma/client';
import {
  ConnectToStorage,
  IOffer,
  IOffersInfo,
  IRepository,
  Logger,
  siteNames
} from '../../types';

class PostgreSqlRepository implements IRepository {
  private l: Logger;
  private conn: PrismaClient;

  constructor(logger: Logger) {
    this.conn = new PrismaClient();
    this.l = logger;
  }

  async getAllOffers(): Promise<IOffer[]> {
    const results = await this.conn.offer.findMany();
    return results;
  }

  saveNewOffers(o: IOffer[], date: Date): Promise<void> {
    return this.saveOffers('New', this.conn.offersInfo, this.conn.offer, o, date);
  }

  getNewOffers(): Promise<IOffersInfo | null> {
    return this.getOffers('Temporary', this.conn.offersInfo, this.conn.offer, 1).then(
      (x) => (x.length > 0 ? x[0] : null)
    );
  }

  saveTmpOffers(o: IOffer[], date: Date): Promise<void> {
    return this.saveOffers(
      'Temporary',
      this.conn.tmpOffersInfo,
      this.conn.tmpOffer,
      o,
      date
    );
  }

  getTmpOffers(): Promise<IOffersInfo[]> {
    return this.getOffers('Temporary', this.conn.tmpOffersInfo, this.conn.tmpOffer);
  }

  deleteAllOffers(): Promise<void> {
    return this.deleteOffers('All', this.conn.tmpOffersInfo, this.conn.tmpOffer);
  }

  deleteTmpOffers(): Promise<void> {
    return this.deleteOffers('Temporary', this.conn.tmpOffersInfo, this.conn.tmpOffer);
  }

  async connect(): Promise<void> {
    this.l.info('Connecting to postgresql...');
    await this.conn.$connect();
    this.l.info('Successfully connected to postgresql');
  }

  async disconnect(): Promise<void> {
    this.conn.$disconnect();
    this.l.info('Disconnected from postgresql');
  }

  private async saveOffers(
    label: 'Temporary' | 'New',
    offersInfoTable: PrismaClient['offersInfo'] | PrismaClient['tmpOffersInfo'],
    offersTable: PrismaClient['offer'] | PrismaClient['tmpOffer'],
    o: IOffer[],
    date: Date
  ): Promise<void> {
    if (o.length === 0) {
      this.l.debug(`${label} offers - nothing to save.`);
      return;
    }

    const offersInfo = await offersInfoTable.create({ data: { date } });

    const offers = await offersTable.createMany({
      data: o.map((o) => ({
        ...o,
        offersInfoId: offersInfo.id
      }))
    });
    this.l.debug(
      `${label} offers saved. offers info id: ${offersInfo.id}, offers count: ${offers.count}`
    );
  }

  private async getOffers(
    label: 'Temporary' | 'New',
    offersInfoTable: PrismaClient['offersInfo'] | PrismaClient['tmpOffersInfo'],
    offersTable: PrismaClient['offer'] | PrismaClient['tmpOffer'],
    limit?: number
  ): Promise<IOffersInfo[]> {
    const offersInfos = await offersInfoTable.findMany({
      orderBy: {
        id: 'desc'
      },
      take: limit
    });

    if (offersInfos.length === 0) {
      this.l.debug(`There are no [${label.toLowerCase()}] offers infos.`);
      return [];
    }

    this.l.debug(
      `Number of ${label.toLowerCase()} offers infos in storage is: `,
      offersInfos.length
    );

    if (offersInfos.length != siteNames.length) {
      this.l.warn(
        `Number of ${label.toLowerCase()} offers infos in storage (${
          offersInfos.length
        }) is different than number of sites (${siteNames.length}).`
      );
    }

    const offers = offersInfos.map<Promise<IOffersInfo>>(async (oi) => {
      return {
        id: oi.id,
        date: oi.date,
        offerList: await offersTable.findMany({
          where: {
            offersInfoId: oi.id
          }
        })
      };
    });
    return Promise.all(offers);
  }

  private async deleteOffers(
    label: 'Temporary' | 'All',
    offersInfoTable: PrismaClient['offersInfo'] | PrismaClient['tmpOffersInfo'],
    offersTable: PrismaClient['offer'] | PrismaClient['tmpOffer']
  ): Promise<void> {
    const offersResult = await offersTable.deleteMany();
    const infoResult = await offersInfoTable.deleteMany();

    this.l.debug(
      `${label} offers removed. offersInfo:${infoResult.count} / offers: ${offersResult.count} `
    );
    return;
  }
}

export const connectToStorage: ConnectToStorage = async (logger: Logger) => {
  const storage = new PostgreSqlRepository(logger);
  await storage.connect();
  return storage;
};
