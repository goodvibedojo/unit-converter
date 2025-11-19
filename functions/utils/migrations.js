/**
 * Data Migration Utilities
 *
 * Tools for migrating Firestore data between schema versions
 */

const admin = require('firebase-admin');
const { paginateThroughCollection, batchWrite } = require('./batchOperations');

/**
 * Migration registry
 * Keeps track of all migrations
 */
const migrations = [];

/**
 * Register a migration
 *
 * @param {Object} migration - Migration definition
 */
function registerMigration(migration) {
  const { version, name, up, down, validate } = migration;

  if (!version || !name || !up) {
    throw new Error('Migration must have version, name, and up function');
  }

  migrations.push({
    version,
    name,
    up,
    down,
    validate,
    registeredAt: new Date().toISOString(),
  });

  // Sort by version
  migrations.sort((a, b) => a.version - b.version);
}

/**
 * Get migration status
 */
async function getMigrationStatus() {
  const db = admin.firestore();
  const migrationDoc = await db.collection('_migrations').doc('status').get();

  if (!migrationDoc.exists) {
    return {
      currentVersion: 0,
      appliedMigrations: [],
    };
  }

  return migrationDoc.data();
}

/**
 * Set migration status
 */
async function setMigrationStatus(status) {
  const db = admin.firestore();
  await db.collection('_migrations').doc('status').set({
    ...status,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

/**
 * Run pending migrations
 *
 * @param {Object} options - Migration options
 * @returns {Promise<Array>} Applied migrations
 */
async function runMigrations(options = {}) {
  const { dryRun = false, targetVersion = null } = options;

  const status = await getMigrationStatus();
  const currentVersion = status.currentVersion || 0;

  // Filter pending migrations
  const pendingMigrations = migrations.filter((m) => {
    if (m.version <= currentVersion) {
      return false;
    }
    if (targetVersion && m.version > targetVersion) {
      return false;
    }
    return true;
  });

  if (pendingMigrations.length === 0) {
    console.log('No pending migrations');
    return [];
  }

  console.log(`Found ${pendingMigrations.length} pending migrations`);

  const appliedMigrations = [];

  for (const migration of pendingMigrations) {
    console.log(`Running migration v${migration.version}: ${migration.name}`);

    if (dryRun) {
      console.log('[DRY RUN] Would apply migration:', migration.name);
      continue;
    }

    try {
      // Run migration
      const startTime = Date.now();
      await migration.up();
      const duration = Date.now() - startTime;

      // Validate if validation function provided
      if (migration.validate) {
        const isValid = await migration.validate();
        if (!isValid) {
          throw new Error('Migration validation failed');
        }
      }

      // Record migration
      appliedMigrations.push({
        version: migration.version,
        name: migration.name,
        appliedAt: new Date().toISOString(),
        duration,
      });

      // Update status
      await setMigrationStatus({
        currentVersion: migration.version,
        appliedMigrations: [
          ...status.appliedMigrations,
          appliedMigrations[appliedMigrations.length - 1],
        ],
      });

      console.log(`✓ Migration v${migration.version} completed in ${duration}ms`);
    } catch (error) {
      console.error(`✗ Migration v${migration.version} failed:`, error);
      throw error;
    }
  }

  return appliedMigrations;
}

/**
 * Rollback migrations
 *
 * @param {number} targetVersion - Target version to rollback to
 * @param {Object} options - Rollback options
 */
async function rollbackMigrations(targetVersion, options = {}) {
  const { dryRun = false } = options;

  const status = await getMigrationStatus();
  const currentVersion = status.currentVersion || 0;

  if (targetVersion >= currentVersion) {
    console.log('No rollback needed');
    return [];
  }

  // Find migrations to rollback (in reverse order)
  const migrationsToRollback = migrations
    .filter((m) => m.version > targetVersion && m.version <= currentVersion)
    .reverse();

  if (migrationsToRollback.length === 0) {
    console.log('No migrations to rollback');
    return [];
  }

  const rolledBackMigrations = [];

  for (const migration of migrationsToRollback) {
    console.log(`Rolling back migration v${migration.version}: ${migration.name}`);

    if (!migration.down) {
      throw new Error(`Migration v${migration.version} has no down function`);
    }

    if (dryRun) {
      console.log('[DRY RUN] Would rollback migration:', migration.name);
      continue;
    }

    try {
      await migration.down();

      rolledBackMigrations.push({
        version: migration.version,
        name: migration.name,
        rolledBackAt: new Date().toISOString(),
      });

      console.log(`✓ Rolled back migration v${migration.version}`);
    } catch (error) {
      console.error(`✗ Rollback failed for v${migration.version}:`, error);
      throw error;
    }
  }

  // Update status
  const newAppliedMigrations = status.appliedMigrations.filter(
    (m) => m.version <= targetVersion
  );

  await setMigrationStatus({
    currentVersion: targetVersion,
    appliedMigrations: newAppliedMigrations,
  });

  return rolledBackMigrations;
}

/**
 * Example migrations
 */

// Migration v1: Add new field to users
registerMigration({
  version: 1,
  name: 'add-user-preferences',
  async up() {
    const db = admin.firestore();
    await paginateThroughCollection(
      db.collection('users'),
      async (docs) => {
        const operations = docs.map((doc) => ({
          ref: doc.ref,
          data: {
            preferences: {
              theme: 'light',
              defaultLanguage: 'python',
              voiceEnabled: false,
            },
          },
          operation: 'update',
        }));
        await batchWrite(operations);
      }
    );
    console.log('Added preferences to all users');
  },
  async down() {
    const db = admin.firestore();
    await paginateThroughCollection(
      db.collection('users'),
      async (docs) => {
        const operations = docs.map((doc) => ({
          ref: doc.ref,
          data: {
            preferences: admin.firestore.FieldValue.delete(),
          },
          operation: 'update',
        }));
        await batchWrite(operations);
      }
    );
    console.log('Removed preferences from all users');
  },
  async validate() {
    const db = admin.firestore();
    const usersSnapshot = await db.collection('users').limit(10).get();
    return usersSnapshot.docs.every((doc) => doc.data().preferences !== undefined);
  },
});

// Migration v2: Add stats to problems
registerMigration({
  version: 2,
  name: 'add-problem-stats',
  async up() {
    const db = admin.firestore();
    await paginateThroughCollection(
      db.collection('problems'),
      async (docs) => {
        const operations = docs.map((doc) => ({
          ref: doc.ref,
          data: {
            stats: {
              totalAttempts: 0,
              successRate: 0,
              averageTime: 0,
            },
          },
          operation: 'update',
        }));
        await batchWrite(operations);
      }
    );
    console.log('Added stats to all problems');
  },
  async down() {
    const db = admin.firestore();
    await paginateThroughCollection(
      db.collection('problems'),
      async (docs) => {
        const operations = docs.map((doc) => ({
          ref: doc.ref,
          data: {
            stats: admin.firestore.FieldValue.delete(),
          },
          operation: 'update',
        }));
        await batchWrite(operations);
      }
    );
  },
});

/**
 * Data transformation utilities
 */

/**
 * Transform field across collection
 *
 * @param {string} collectionName - Collection name
 * @param {Function} transformer - Transformation function
 */
async function transformField(collectionName, transformer) {
  const db = admin.firestore();
  let transformedCount = 0;

  await paginateThroughCollection(
    db.collection(collectionName),
    async (docs) => {
      const operations = [];

      for (const doc of docs) {
        const data = doc.data();
        const transformed = await transformer(data);

        if (transformed) {
          operations.push({
            ref: doc.ref,
            data: transformed,
            operation: 'update',
          });
        }
      }

      if (operations.length > 0) {
        await batchWrite(operations);
        transformedCount += operations.length;
      }
    }
  );

  console.log(`Transformed ${transformedCount} documents in ${collectionName}`);
  return transformedCount;
}

/**
 * Rename field across collection
 */
async function renameField(collectionName, oldFieldName, newFieldName) {
  return await transformField(collectionName, (data) => {
    if (data[oldFieldName] !== undefined) {
      return {
        [newFieldName]: data[oldFieldName],
        [oldFieldName]: admin.firestore.FieldValue.delete(),
      };
    }
    return null;
  });
}

/**
 * Remove field from collection
 */
async function removeField(collectionName, fieldName) {
  return await transformField(collectionName, (data) => {
    if (data[fieldName] !== undefined) {
      return {
        [fieldName]: admin.firestore.FieldValue.delete(),
      };
    }
    return null;
  });
}

/**
 * Data consistency checks
 */
async function checkDataConsistency(checks) {
  const results = {};

  for (const [name, checkFn] of Object.entries(checks)) {
    try {
      const result = await checkFn();
      results[name] = {
        status: 'passed',
        ...result,
      };
    } catch (error) {
      results[name] = {
        status: 'failed',
        error: error.message,
      };
    }
  }

  return results;
}

module.exports = {
  registerMigration,
  runMigrations,
  rollbackMigrations,
  getMigrationStatus,
  transformField,
  renameField,
  removeField,
  checkDataConsistency,
  migrations,
};
