/**
 * Cloud Function: seedProblems
 *
 * Type: HTTP Callable (Admin only)
 * Purpose: Seed the database with initial problems
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Sample problems for seeding
const SAMPLE_PROBLEMS = [
  {
    id: 'two-sum',
    title: 'Two Sum',
    slug: 'two-sum',
    difficulty: 'easy',
    category: ['array', 'hash-table'],
    companyTags: ['google', 'amazon', 'apple', 'meta'],
    description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      '-10^9 <= target <= 10^9',
      'Only one valid answer exists.',
    ],
    examples: [
      {
        input: 'nums = [2,7,11,15], target = 9',
        output: '[0,1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].',
      },
      {
        input: 'nums = [3,2,4], target = 6',
        output: '[1,2]',
        explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2].',
      },
    ],
    starterCode: {
      python: `def two_sum(nums, target):
    """
    :type nums: List[int]
    :type target: int
    :rtype: List[int]
    """
    # Your code here
    pass`,
      javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function twoSum(nums, target) {
    // Your code here
}`,
      java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Your code here
        return new int[]{};
    }
}`,
    },
    testCases: [
      {
        id: 'tc1',
        input: '[2,7,11,15]\n9',
        expectedOutput: '[0,1]',
        isHidden: false,
        weight: 1,
      },
      {
        id: 'tc2',
        input: '[3,2,4]\n6',
        expectedOutput: '[1,2]',
        isHidden: false,
        weight: 1,
      },
      {
        id: 'tc3',
        input: '[3,3]\n6',
        expectedOutput: '[0,1]',
        isHidden: true,
        weight: 1,
      },
    ],
    hints: [
      'A really brute force way would be to search for all possible pairs of numbers but that would be too slow. Can you think of a better way?',
      'What if you could access the complement of an element in constant time? Think about what data structure would allow that.',
      'Try using a hash map to store numbers you\'ve seen and their indices.',
    ],
    stats: {
      totalAttempts: 0,
      successRate: 0,
      averageTime: 0,
    },
  },
  {
    id: 'reverse-string',
    title: 'Reverse String',
    slug: 'reverse-string',
    difficulty: 'easy',
    category: ['string', 'two-pointers'],
    companyTags: ['google', 'amazon', 'microsoft'],
    description: `Write a function that reverses a string. The input string is given as an array of characters \`s\`.

You must do this by modifying the input array in-place with O(1) extra memory.`,
    constraints: [
      '1 <= s.length <= 10^5',
      's[i] is a printable ascii character.',
    ],
    examples: [
      {
        input: 's = ["h","e","l","l","o"]',
        output: '["o","l","l","e","h"]',
        explanation: '',
      },
      {
        input: 's = ["H","a","n","n","a","h"]',
        output: '["h","a","n","n","a","H"]',
        explanation: '',
      },
    ],
    starterCode: {
      python: `def reverse_string(s):
    """
    :type s: List[str]
    :rtype: None Do not return anything, modify s in-place instead.
    """
    # Your code here
    pass`,
      javascript: `/**
 * @param {character[]} s
 * @return {void} Do not return anything, modify s in-place instead.
 */
function reverseString(s) {
    // Your code here
}`,
      java: `class Solution {
    public void reverseString(char[] s) {
        // Your code here
    }
}`,
    },
    testCases: [
      {
        id: 'tc1',
        input: '["h","e","l","l","o"]',
        expectedOutput: '["o","l","l","e","h"]',
        isHidden: false,
        weight: 1,
      },
      {
        id: 'tc2',
        input: '["H","a","n","n","a","h"]',
        expectedOutput: '["h","a","n","n","a","H"]',
        isHidden: false,
        weight: 1,
      },
    ],
    hints: [
      'Use two pointers: one at the start and one at the end.',
      'Swap elements and move pointers towards the center.',
    ],
    stats: {
      totalAttempts: 0,
      successRate: 0,
      averageTime: 0,
    },
  },
];

exports.seedProblems = functions.https.onCall(async (data, context) => {
  try {
    // Check authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    // TODO: Add admin check in production
    // For now, any authenticated user can seed (for development)
    const isAdmin = true; // In production: check user role

    if (!isAdmin) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only administrators can seed problems'
      );
    }

    const db = admin.firestore();
    const batch = db.batch();

    let count = 0;

    for (const problem of SAMPLE_PROBLEMS) {
      const problemRef = db.collection('problems').doc(problem.id);
      const problemData = {
        ...problem,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      batch.set(problemRef, problemData);
      count++;
    }

    await batch.commit();

    console.log(`Seeded ${count} problems`);

    return {
      success: true,
      count,
      message: `Successfully seeded ${count} problems`,
    };
  } catch (error) {
    console.error('Error seeding problems:', error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError('internal', 'Failed to seed problems');
  }
});
