import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

interface FaceDB extends DBSchema {
  users: {
    key: string;
    value: {
      id: string;
      username: string;
      descriptor: number[];
      createdAt: number;
    };
  };
}

let dbInstance: IDBPDatabase<FaceDB> | null = null;

export const initDB = async (): Promise<IDBPDatabase<FaceDB>> => {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<FaceDB>('FaceAuthDB', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('users')) {
        db.createObjectStore('users', { keyPath: 'id' });
      }
    },
  });

  return dbInstance;
};

export const saveUser = async (
  username: string,
  descriptor: Float32Array
): Promise<string> => {
  const db = await initDB();
  const id = crypto.randomUUID();
  
  await db.add('users', {
    id,
    username,
    descriptor: Array.from(descriptor),
    createdAt: Date.now(),
  });

  return id;
};

export const getAllUsers = async () => {
  const db = await initDB();
  return await db.getAll('users');
};

export const getUserById = async (id: string) => {
  const db = await initDB();
  return await db.get('users', id);
};

export const deleteUser = async (id: string) => {
  const db = await initDB();
  await db.delete('users', id);
};