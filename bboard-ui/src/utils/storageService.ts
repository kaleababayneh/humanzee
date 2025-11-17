import { initDB as initIndexedDB, saveUser as saveUserIndexedDB, getAllUsers as getAllUsersIndexedDB, getUserById as getUserByIdIndexedDB, deleteUser as deleteUserIndexedDB } from './faceDB';

export const initDB = async () => {
  await initIndexedDB(); // Using IndexedDB for local storage
  console.log('Using IndexedDB (local storage)');
};

export const saveUser = async (username: string, descriptor: Float32Array): Promise<string> => {
  return await saveUserIndexedDB(username, descriptor);
};

export const getAllUsers = async () => {
  return await getAllUsersIndexedDB();
};

export const getUserById = async (id: string) => {
  return await getUserByIdIndexedDB(id);
};

export const deleteUser = async (id: string) => {
  await deleteUserIndexedDB(id);
};