// Database Seeding Script
// Engineer 5 - Seed Firestore with Problem Bank Data

import { collection, doc, setDoc, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../services/firebase';
import { allProblems, getProblemStats } from './extendedProblemBank';

/**
 * Seed all problems to Firestore
 * @returns {Promise<{success: number, failed: number}>}
 */
export async function seedAllProblems() {
  console.log('Starting database seeding...');
  console.log(`Total problems to seed: ${allProblems.length}`);

  const results = {
    success: 0,
    failed: 0,
    errors: []
  };

  // Use batched writes for better performance (max 500 per batch)
  const batchSize = 500;
  const batches = [];

  for (let i = 0; i < allProblems.length; i += batchSize) {
    const batch = writeBatch(db);
    const problemsChunk = allProblems.slice(i, i + batchSize);

    problemsChunk.forEach((problem) => {
      const problemRef = doc(db, 'problems', problem.id);

      // Add metadata
      const problemData = {
        ...problem,
        createdAt: new Date(),
        updatedAt: new Date(),
        stats: {
          totalAttempts: 0,
          totalSolved: 0,
          averageTime: 0,
          successRate: 0
        }
      };

      batch.set(problemRef, problemData);
    });

    batches.push(batch);
  }

  // Commit all batches
  try {
    for (const batch of batches) {
      await batch.commit();
    }
    results.success = allProblems.length;
    console.log(`✅ Successfully seeded ${results.success} problems`);
  } catch (error) {
    console.error('❌ Error seeding problems:', error);
    results.failed = allProblems.length;
    results.errors.push(error.message);
  }

  return results;
}

/**
 * Seed a single problem
 * @param {Object} problem - Problem data
 * @returns {Promise<boolean>}
 */
export async function seedProblem(problem) {
  try {
    const problemRef = doc(db, 'problems', problem.id);

    const problemData = {
      ...problem,
      createdAt: new Date(),
      updatedAt: new Date(),
      stats: {
        totalAttempts: 0,
        totalSolved: 0,
        averageTime: 0,
        successRate: 0
      }
    };

    await setDoc(problemRef, problemData);
    console.log(`✅ Seeded problem: ${problem.title}`);
    return true;
  } catch (error) {
    console.error(`❌ Error seeding problem ${problem.id}:`, error);
    return false;
  }
}

/**
 * Check if problems already exist in database
 * @returns {Promise<number>} Number of existing problems
 */
export async function checkExistingProblems() {
  try {
    const problemsSnapshot = await getDocs(collection(db, 'problems'));
    return problemsSnapshot.size;
  } catch (error) {
    console.error('Error checking existing problems:', error);
    return 0;
  }
}

/**
 * Clear all problems from database (use with caution!)
 * @returns {Promise<boolean>}
 */
export async function clearAllProblems() {
  try {
    const problemsSnapshot = await getDocs(collection(db, 'problems'));
    const batch = writeBatch(db);

    problemsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`✅ Cleared ${problemsSnapshot.size} problems from database`);
    return true;
  } catch (error) {
    console.error('❌ Error clearing problems:', error);
    return false;
  }
}

/**
 * Seed problems by difficulty
 * @param {string} difficulty - 'easy', 'medium', or 'hard'
 * @returns {Promise<{success: number, failed: number}>}
 */
export async function seedProblemsByDifficulty(difficulty) {
  const filteredProblems = allProblems.filter(p => p.difficulty === difficulty);

  console.log(`Seeding ${filteredProblems.length} ${difficulty} problems...`);

  const results = {
    success: 0,
    failed: 0,
    errors: []
  };

  for (const problem of filteredProblems) {
    try {
      const success = await seedProblem(problem);
      if (success) {
        results.success++;
      } else {
        results.failed++;
      }
    } catch (error) {
      results.failed++;
      results.errors.push(`${problem.id}: ${error.message}`);
    }
  }

  console.log(`✅ ${results.success} seeded, ❌ ${results.failed} failed`);
  return results;
}

/**
 * Display problem statistics
 */
export function displayProblemStats() {
  const stats = getProblemStats();

  console.log('\n========================================');
  console.log('📊 Problem Bank Statistics');
  console.log('========================================');
  console.log(`Total Problems: ${stats.total}`);
  console.log('\nBy Difficulty:');
  console.log(`  Easy:   ${stats.byDifficulty.easy}`);
  console.log(`  Medium: ${stats.byDifficulty.medium}`);
  console.log(`  Hard:   ${stats.byDifficulty.hard}`);
  console.log('\nBy Category:');

  Object.entries(stats.byCategory)
    .sort((a, b) => b[1] - a[1])
    .forEach(([category, count]) => {
      console.log(`  ${category.padEnd(25)}: ${count}`);
    });

  console.log('========================================\n');
}

/**
 * Validate all problems have required fields
 * @returns {Array} Array of validation errors
 */
export function validateProblems() {
  const errors = [];
  const requiredFields = [
    'id', 'title', 'difficulty', 'category', 'companyTags',
    'description', 'constraints', 'examples', 'starterCode', 'testCases', 'hints'
  ];

  allProblems.forEach((problem, index) => {
    requiredFields.forEach(field => {
      if (!problem[field]) {
        errors.push(`Problem #${index + 1} (${problem.id || 'unknown'}) missing field: ${field}`);
      }
    });

    // Validate starterCode has required languages
    if (problem.starterCode) {
      if (!problem.starterCode.python) {
        errors.push(`Problem ${problem.id} missing Python starter code`);
      }
      if (!problem.starterCode.javascript) {
        errors.push(`Problem ${problem.id} missing JavaScript starter code`);
      }
    }

    // Validate testCases
    if (problem.testCases && problem.testCases.length === 0) {
      errors.push(`Problem ${problem.id} has no test cases`);
    }

    // Validate examples
    if (problem.examples && problem.examples.length === 0) {
      errors.push(`Problem ${problem.id} has no examples`);
    }
  });

  if (errors.length === 0) {
    console.log('✅ All problems validated successfully!');
  } else {
    console.error(`❌ Found ${errors.length} validation errors:`);
    errors.forEach(error => console.error(`  - ${error}`));
  }

  return errors;
}

// Export main seeding function for use in admin panel or CLI
export default seedAllProblems;
