const DB_NAME =
  "finCapitalMedia";

const DB_VERSION = 1;

const STORE_NAME =
  "photos";

function openDatabase() {
  return new Promise(
    (resolve, reject) => {

      const request =
        indexedDB.open(
          DB_NAME,
          DB_VERSION
        );

      request.onupgradeneeded =
        () => {

          const db =
            request.result;

          if (
            !db.objectStoreNames.contains(
              STORE_NAME
            )
          ) {
            db.createObjectStore(
              STORE_NAME
            );
          }
        };

      request.onsuccess =
        () => {
          resolve(
            request.result
          );
        };

      request.onerror =
        () => {
          reject(
            request.error
          );
        };
    }
  );
}

function makeKey(
  customerId,
  type
) {
  return `${customerId}:${type}`;
}

export async function savePhoto(
  customerId,
  type,
  file
) {
  if (!file) {
    return;
  }

  const db =
    await openDatabase();

  return new Promise(
    (resolve, reject) => {

      const transaction =
        db.transaction(
          STORE_NAME,
          "readwrite"
        );

      const store =
        transaction.objectStore(
          STORE_NAME
        );

      store.put(
        file,
        makeKey(
          customerId,
          type
        )
      );

      transaction.oncomplete =
        () => {

          db.close();

          resolve();
        };

      transaction.onerror =
        () => {

          db.close();

          reject(
            transaction.error
          );
        };
    }
  );
}

export async function getPhoto(
  customerId,
  type
) {
  const db =
    await openDatabase();

  return new Promise(
    (resolve, reject) => {

      const transaction =
        db.transaction(
          STORE_NAME,
          "readonly"
        );

      const store =
        transaction.objectStore(
          STORE_NAME
        );

      const request =
        store.get(
          makeKey(
            customerId,
            type
          )
        );

      request.onsuccess =
        () => {

          db.close();

          resolve(
            request.result || null
          );
        };

      request.onerror =
        () => {

          db.close();

          reject(
            request.error
          );
        };
    }
  );
}

export async function deleteCustomerPhotos(
  customerId
) {
  const types = [
    "customerPhoto",
    "customerDocument",
    "jaminPhoto",
    "jaminDocument",
  ];

  const db =
    await openDatabase();

  return new Promise(
    (resolve, reject) => {

      const transaction =
        db.transaction(
          STORE_NAME,
          "readwrite"
        );

      const store =
        transaction.objectStore(
          STORE_NAME
        );

      types.forEach(
        (type) => {

          store.delete(
            makeKey(
              customerId,
              type
            )
          );
        }
      );

      transaction.oncomplete =
        () => {

          db.close();

          resolve();
        };

      transaction.onerror =
        () => {

          db.close();

          reject(
            transaction.error
          );
        };
    }
  );
}