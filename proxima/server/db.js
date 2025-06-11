import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbFile = path.resolve(__dirname, './users.json');

const db = new Low(new JSONFile(dbFile), { users: [], goals: [] });

export const initializeDB = async () => {
  await db.read();
  db.data ||= { users: [], goals: [] };
  await db.write();
};

export default db; 