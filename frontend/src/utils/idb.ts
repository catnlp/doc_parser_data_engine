const DB_NAME = 'doc_parser_images';
const DB_VERSION = 1;
const STORE_NAME = 'page_images';

export interface StoredImage {
  id: string;        // "{docId}_{pageIndex}"
  imageBase64: string;
  width: number;
  height: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(request.error);
      };

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };
    } catch (e) {
      console.warn('IndexedDB unavailable (e.g. privacy mode):', e);
      reject(e);
    }
  });

  return dbPromise;
}

export async function saveImage(
  docId: string,
  pageIndex: number,
  imageBase64: string,
  width: number,
  height: number,
): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put({
      id: `${docId}_${pageIndex}`,
      imageBase64,
      width,
      height,
    });
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.warn('Failed to save image to IndexedDB:', e);
  }
}

export async function getImage(docId: string, pageIndex: number): Promise<StoredImage | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(`${docId}_${pageIndex}`);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.warn('Failed to get image from IndexedDB:', e);
    return null;
  }
}

export async function getDocImages(docId: string): Promise<Map<number, StoredImage>> {
  const result = new Map<number, StoredImage>();
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const prefix = `${docId}_`;

    return new Promise((resolve, reject) => {
      const request = store.openCursor();
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          if (cursor.value.id.startsWith(prefix)) {
            const pageIdx = parseInt(cursor.value.id.slice(prefix.length), 10);
            if (!isNaN(pageIdx)) {
              result.set(pageIdx, cursor.value);
            }
          }
          cursor.continue();
        } else {
          resolve(result);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.warn('Failed to get doc images from IndexedDB:', e);
    return result;
  }
}

export async function deleteDocImages(docId: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const prefix = `${docId}_`;

    return new Promise((resolve, reject) => {
      const request = store.openCursor();
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          if (cursor.value.id.startsWith(prefix)) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.warn('Failed to delete images from IndexedDB:', e);
  }
}
