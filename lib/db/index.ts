import Dexie, { type EntityTable } from 'dexie';
import type { Spot } from '@/lib/types/spot';

const db = new Dexie('AstroDashDB') as Dexie & {
  spots: EntityTable<Spot, 'id'>;
};

db.version(1).stores({
  spots: 'id, isFavorite, bortleClass, createdAt, name',
});

export { db };
