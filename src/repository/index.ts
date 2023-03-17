import { ConnectionOptions } from 'mongoose';
import { ConnectToStorage, IRepository, Logger, RepositoryName } from '../types';

export async function connectToStorage(
  l: Logger,
  repoName: RepositoryName
): Promise<IRepository> {
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
      } as ConnectionOptions as typeof connOptions;

      break;
    case RepositoryName.PostgreSql:
      break;

    default:
      throw new Error(`Repository "${repoName}" not recognized.`);
  }

  const { connectToStorage } = (await import(`./${repoName}`)) as {
    connectToStorage: ConnectToStorage;
  };

  const storage: IRepository = await connectToStorage(l);
  return storage;
}
