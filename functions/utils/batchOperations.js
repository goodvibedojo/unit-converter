/**
 * Batch Operations Utilities for Firestore
 *
 * Provides helper functions for efficient batch operations
 * and query optimizations
 */

const admin = require('firebase-admin');

/**
 * Batch write documents with automatic chunking
 * Firestore batches are limited to 500 operations
 *
 * @param {Array} operations - Array of {ref, data, operation: 'set'|'update'|'delete'}
 * @returns {Promise<number>} Number of operations completed
 */
async function batchWrite(operations) {
  const BATCH_SIZE = 500;
  const db = admin.firestore();

  let completed = 0;

  for (let i = 0; i < operations.length; i += BATCH_SIZE) {
    const chunk = operations.slice(i, i + BATCH_SIZE);
    const batch = db.batch();

    for (const op of chunk) {
      switch (op.operation) {
        case 'set':
          batch.set(op.ref, op.data, op.options || {});
          break;
        case 'update':
          batch.update(op.ref, op.data);
          break;
        case 'delete':
          batch.delete(op.ref);
          break;
        default:
          throw new Error(`Unknown operation: ${op.operation}`);
      }
    }

    await batch.commit();
    completed += chunk.length;
  }

  return completed;
}

/**
 * Paginate through a large collection
 *
 * @param {Query} query - Firestore query
 * @param {Function} callback - Function to call for each batch
 * @param {number} batchSize - Size of each batch (default: 100)
 */
async function paginateThroughCollection(query, callback, batchSize = 100) {
  let lastDoc = null;
  let hasMore = true;

  while (hasMore) {
    let paginatedQuery = query.limit(batchSize);

    if (lastDoc) {
      paginatedQuery = paginatedQuery.startAfter(lastDoc);
    }

    const snapshot = await paginatedQuery.get();

    if (snapshot.empty) {
      hasMore = false;
      break;
    }

    await callback(snapshot.docs);

    lastDoc = snapshot.docs[snapshot.docs.length - 1];
    hasMore = snapshot.docs.length === batchSize;
  }
}

/**
 * Bulk delete documents from a collection
 *
 * @param {CollectionReference} collectionRef - Collection reference
 * @param {Query} query - Optional query to filter documents
 * @param {number} batchSize - Batch size (default: 500)
 * @returns {Promise<number>} Number of documents deleted
 */
async function bulkDelete(collectionRef, query = null, batchSize = 500) {
  const db = admin.firestore();
  const targetQuery = query || collectionRef;

  let deletedCount = 0;

  await paginateThroughCollection(
    targetQuery,
    async (docs) => {
      const batch = db.batch();

      docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      deletedCount += docs.length;
    },
    batchSize
  );

  return deletedCount;
}

/**
 * Bulk update documents
 *
 * @param {CollectionReference} collectionRef - Collection reference
 * @param {Object} updateData - Data to update
 * @param {Query} query - Optional query to filter documents
 * @param {number} batchSize - Batch size (default: 500)
 * @returns {Promise<number>} Number of documents updated
 */
async function bulkUpdate(collectionRef, updateData, query = null, batchSize = 500) {
  const db = admin.firestore();
  const targetQuery = query || collectionRef;

  let updatedCount = 0;

  await paginateThroughCollection(
    targetQuery,
    async (docs) => {
      const batch = db.batch();

      docs.forEach((doc) => {
        batch.update(doc.ref, updateData);
      });

      await batch.commit();
      updatedCount += docs.length;
    },
    batchSize
  );

  return updatedCount;
}

/**
 * Get documents in batches by IDs
 * Firestore getAll() is limited to 100 documents
 *
 * @param {CollectionReference} collectionRef - Collection reference
 * @param {Array<string>} ids - Document IDs
 * @returns {Promise<Array>} Array of document data
 */
async function getDocumentsByIds(collectionRef, ids) {
  const BATCH_SIZE = 100;
  const results = [];

  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const chunk = ids.slice(i, i + BATCH_SIZE);
    const refs = chunk.map((id) => collectionRef.doc(id));

    const snapshot = await admin.firestore().getAll(...refs);

    snapshot.forEach((doc) => {
      if (doc.exists) {
        results.push({ id: doc.id, ...doc.data() });
      }
    });
  }

  return results;
}

/**
 * Check if document exists (optimized)
 *
 * @param {DocumentReference} docRef - Document reference
 * @returns {Promise<boolean>}
 */
async function documentExists(docRef) {
  const snapshot = await docRef.get();
  return snapshot.exists;
}

/**
 * Get document count for a query (efficient)
 *
 * @param {Query} query - Firestore query
 * @returns {Promise<number>}
 */
async function getCount(query) {
  const snapshot = await query.count().get();
  return snapshot.data().count;
}

/**
 * Atomic counter increment/decrement
 *
 * @param {DocumentReference} docRef - Document reference
 * @param {string} field - Field name
 * @param {number} value - Value to add (can be negative)
 */
async function incrementCounter(docRef, field, value = 1) {
  await docRef.update({
    [field]: admin.firestore.FieldValue.increment(value),
  });
}

/**
 * Transaction with retry logic
 *
 * @param {Function} transactionFn - Transaction function
 * @param {number} maxRetries - Maximum number of retries (default: 3)
 */
async function runTransactionWithRetry(transactionFn, maxRetries = 3) {
  const db = admin.firestore();
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      return await db.runTransaction(transactionFn);
    } catch (error) {
      attempt++;

      if (attempt >= maxRetries) {
        throw error;
      }

      // Exponential backoff
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 100));
    }
  }
}

/**
 * Merge arrays in document (add unique items)
 *
 * @param {DocumentReference} docRef - Document reference
 * @param {string} field - Array field name
 * @param {Array} items - Items to add
 */
async function arrayUnion(docRef, field, items) {
  await docRef.update({
    [field]: admin.firestore.FieldValue.arrayUnion(...items),
  });
}

/**
 * Remove items from array in document
 *
 * @param {DocumentReference} docRef - Document reference
 * @param {string} field - Array field name
 * @param {Array} items - Items to remove
 */
async function arrayRemove(docRef, field, items) {
  await docRef.update({
    [field]: admin.firestore.FieldValue.arrayRemove(...items),
  });
}

/**
 * Cache helper for frequently accessed data
 */
class FirestoreCache {
  constructor(ttlSeconds = 300) {
    this.cache = new Map();
    this.ttl = ttlSeconds * 1000; // Convert to milliseconds
  }

  set(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  get(key) {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    // Check if expired
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }
}

// Export all utilities
module.exports = {
  batchWrite,
  paginateThroughCollection,
  bulkDelete,
  bulkUpdate,
  getDocumentsByIds,
  documentExists,
  getCount,
  incrementCounter,
  runTransactionWithRetry,
  arrayUnion,
  arrayRemove,
  FirestoreCache,
};
