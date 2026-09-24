import { emptyState, type CommunityState } from './model';
const database = 'hellosrilanka-community-preview';
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(database, 1);
    request.onupgradeneeded = () => request.result.createObjectStore('community');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Close other community tabs and try again.'));
  });
}
export async function readCommunity(): Promise<CommunityState> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('community', 'readonly');
    const request = transaction.objectStore('community').get('state');
    request.onsuccess = () => {
      const value = request.result as CommunityState | undefined;
      resolve(value?.version === 1 && Array.isArray(value.posts) && Array.isArray(value.likes) && Array.isArray(value.saves) && Array.isArray(value.comments) && Array.isArray(value.hidden) && typeof value.profile?.name === 'string' ? value : structuredClone(emptyState));
    };
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => { db.close(); reject(transaction.error); };
  });
}
// Serialize snapshots so a slower earlier write cannot replace a newer journal.
let pendingWrite: Promise<void> = Promise.resolve();
export function saveCommunity(value: CommunityState): Promise<void> {
  const snapshot = structuredClone(value);
  const write = pendingWrite.catch(() => undefined).then(() => writeCommunity(snapshot));
  pendingWrite = write;
  return write;
}
async function writeCommunity(value: CommunityState): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('community', 'readwrite');
    transaction.objectStore('community').put(value, 'state');
    transaction.oncomplete = () => { db.close(); resolve(); };
    transaction.onerror = () => { db.close(); reject(transaction.error); };
    transaction.onabort = () => { db.close(); reject(transaction.error); };
  });
}

/** Decode and re-encode uploads to bound memory, remove EXIF, and reject unsupported files. */
export async function preparePhoto(file: File): Promise<{ src: string; width: number; height: number }> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Choose a JPG, PNG, or WebP photograph.');
  if (file.size > 12 * 1024 * 1024) throw new Error('Please choose a photograph smaller than 12 MB.');
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 1400 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('This browser could not prepare your photograph.');
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return { src: canvas.toDataURL('image/webp', .82), width: canvas.width, height: canvas.height };
  } finally { bitmap.close(); }
}
