// Verificar si estamos en un entorno de navegador
const isBrowser = typeof window !== 'undefined';

export const openDB = () => {
    return new Promise((resolve, reject) => {
        if (!isBrowser) {
            reject('IndexedDB solo está disponible en el navegador');
            return;
        }

        const request = indexedDB.open('DestinyManifestDB', 1);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('manifest')) {
                db.createObjectStore('manifest', { keyPath: 'id' });
            }
        };

        request.onsuccess = (event) => {
            resolve(event.target.result);
        };

        request.onerror = (event) => {
            reject('Error al abrir la base de datos');
        };
    });
};

export const saveManifestToIndexedDB = async (data) => {
    if (!isBrowser) {
        console.error('IndexedDB solo está disponible en el navegador');
        return;
    }

    const db = await openDB();
    const transaction = db.transaction('manifest', 'readwrite');
    const store = transaction.objectStore('manifest');
    const request = store.put({ id: 'manifestData', data });

    request.onsuccess = () => {
        console.log('Manifiesto guardado en IndexedDB');
    };

    request.onerror = () => {
        console.error('Error al guardar el manifiesto');
    };
};

export const getManifestFromIndexedDB = async () => {
    if (!isBrowser) {
        console.error('IndexedDB solo está disponible en el navegador');
        return null;
    }

    const db = await openDB();
    const transaction = db.transaction('manifest', 'readonly');
    const store = transaction.objectStore('manifest');
    const request = store.get('manifestData');

    return new Promise((resolve, reject) => {
        request.onsuccess = () => {
            resolve(request.result ? request.result.data : null);
        };

        request.onerror = () => {
            reject('Error al recuperar los datos');
        };
    });
};
