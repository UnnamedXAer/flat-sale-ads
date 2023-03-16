import { ConnectOptions } from 'mongoose';
import { IRepository, RepositoryName } from '../types';

export async function connectToStorage(repoName: RepositoryName): Promise<IRepository> {
  let connString: string = '';
  let connOptions: { [key: string]: string } | undefined;

  switch (repoName) {
    case RepositoryName.Files:
      throw new Error('Repository not implemented.');
    case RepositoryName.Mongo:
      connString = process.env.MONGO_URI as string;
      connOptions = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
        useCreateIndex: true
      } as ConnectOptions as typeof connOptions;

      break;
    case RepositoryName.PostgreSql:
      break;

    default:
      throw new Error(`Repository "${repoName}" not recognized.`);
  }

  const module = (await import(`./${repoName}`)) as { storage: IRepository };

  await module.storage.connect(connString, connOptions);
  const storage: IRepository = module.storage;
  return storage;
}
