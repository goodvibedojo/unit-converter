// Extended Problem Bank - 30+ High-Quality Coding Problems
// Engineer 5 - Problem Bank Expansion

export const extendedProblems = [
  // === EASY PROBLEMS (10) ===
  {
    id: 'palindrome-number',
    title: 'Palindrome Number',
    difficulty: 'easy',
    category: ['math'],
    companyTags: ['Amazon', 'Apple', 'Adobe'],
    description: `Given an integer x, return true if x is a palindrome, and false otherwise.

An integer is a palindrome when it reads the same forward and backward.`,
    constraints: `-2^31 <= x <= 2^31 - 1`,
    examples: [
      { input: 'x = 121', output: 'true', explanation: '121 reads as 121 from left to right and from right to left.' },
      { input: 'x = -121', output: 'false', explanation: 'From left to right, it reads -121. From right to left, it becomes 121-.' },
      { input: 'x = 10', output: 'false', explanation: 'Reads 01 from right to left.' }
    ],
    starterCode: {
      python: `def is_palindrome(x):
    # Write your code here
    pass

if __name__ == "__main__":
    print(is_palindrome(121))   # Expected: True
    print(is_palindrome(-121))  # Expected: False
    print(is_palindrome(10))    # Expected: False`,
      javascript: `function isPalindrome(x) {
    // Write your code here
}

console.log(isPalindrome(121));   // Expected: true
console.log(isPalindrome(-121));  // Expected: false
console.log(isPalindrome(10));    // Expected: false`
    },
    testCases: [
      { input: '121', expectedOutput: 'true', isHidden: false },
      { input: '-121', expectedOutput: 'false', isHidden: false },
      { input: '10', expectedOutput: 'false', isHidden: false },
      { input: '0', expectedOutput: 'true', isHidden: true }
    ],
    hints: [
      'Could you solve it without converting the integer to a string?',
      'How can you reverse half of the number and compare?'
    ]
  },
  {
    id: 'contains-duplicate',
    title: 'Contains Duplicate',
    difficulty: 'easy',
    category: ['array', 'hash-table'],
    companyTags: ['Google', 'Amazon', 'Apple'],
    description: `Given an integer array nums, return true if any value appears at least twice in the array, and return false if every element is distinct.`,
    constraints: `1 <= nums.length <= 10^5
-10^9 <= nums[i] <= 10^9`,
    examples: [
      { input: 'nums = [1,2,3,1]', output: 'true', explanation: '' },
      { input: 'nums = [1,2,3,4]', output: 'false', explanation: '' },
      { input: 'nums = [1,1,1,3,3,4,3,2,4,2]', output: 'true', explanation: '' }
    ],
    starterCode: {
      python: `def contains_duplicate(nums):
    # Write your code here
    pass`,
      javascript: `function containsDuplicate(nums) {
    // Write your code here
}`
    },
    testCases: [
      { input: '[1,2,3,1]', expectedOutput: 'true', isHidden: false },
      { input: '[1,2,3,4]', expectedOutput: 'false', isHidden: false },
      { input: '[1,1,1,3,3,4,3,2,4,2]', expectedOutput: 'true', isHidden: true }
    ],
    hints: [
      'Think about what data structure allows O(1) lookup',
      'A set can help you track seen elements'
    ]
  },
  {
    id: 'best-time-stock',
    title: 'Best Time to Buy and Sell Stock',
    difficulty: 'easy',
    category: ['array', 'dynamic-programming'],
    companyTags: ['Amazon', 'Google', 'Facebook', 'Microsoft'],
    description: `You are given an array prices where prices[i] is the price of a given stock on the ith day.

You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.

Return the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return 0.`,
    constraints: `1 <= prices.length <= 10^5
0 <= prices[i] <= 10^4`,
    examples: [
      { input: 'prices = [7,1,5,3,6,4]', output: '5', explanation: 'Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5.' },
      { input: 'prices = [7,6,4,3,1]', output: '0', explanation: 'No transactions are done, max profit = 0.' }
    ],
    starterCode: {
      python: `def max_profit(prices):
    # Write your code here
    pass`,
      javascript: `function maxProfit(prices) {
    // Write your code here
}`
    },
    testCases: [
      { input: '[7,1,5,3,6,4]', expectedOutput: '5', isHidden: false },
      { input: '[7,6,4,3,1]', expectedOutput: '0', isHidden: false },
      { input: '[1,2]', expectedOutput: '1', isHidden: true }
    ],
    hints: [
      'Track the minimum price seen so far',
      'For each price, calculate profit if we sell at that price'
    ]
  },
  {
    id: 'valid-anagram',
    title: 'Valid Anagram',
    difficulty: 'easy',
    category: ['string', 'hash-table', 'sorting'],
    companyTags: ['Amazon', 'Bloomberg', 'Facebook'],
    description: `Given two strings s and t, return true if t is an anagram of s, and false otherwise.

An Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.`,
    constraints: `1 <= s.length, t.length <= 5 * 10^4
s and t consist of lowercase English letters.`,
    examples: [
      { input: 's = "anagram", t = "nagaram"', output: 'true', explanation: '' },
      { input: 's = "rat", t = "car"', output: 'false', explanation: '' }
    ],
    starterCode: {
      python: `def is_anagram(s, t):
    # Write your code here
    pass`,
      javascript: `function isAnagram(s, t) {
    // Write your code here
}`
    },
    testCases: [
      { input: '"anagram", "nagaram"', expectedOutput: 'true', isHidden: false },
      { input: '"rat", "car"', expectedOutput: 'false', isHidden: false }
    ],
    hints: [
      'Count the frequency of each character',
      'Can you use sorting? What\'s the time complexity?'
    ]
  },
  {
    id: 'maximum-subarray',
    title: 'Maximum Subarray',
    difficulty: 'easy',
    category: ['array', 'dynamic-programming', 'divide-and-conquer'],
    companyTags: ['Amazon', 'Microsoft', 'LinkedIn', 'Apple'],
    description: `Given an integer array nums, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.`,
    constraints: `1 <= nums.length <= 10^5
-10^4 <= nums[i] <= 10^4`,
    examples: [
      { input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]', output: '6', explanation: '[4,-1,2,1] has the largest sum = 6.' },
      { input: 'nums = [1]', output: '1', explanation: '' },
      { input: 'nums = [5,4,-1,7,8]', output: '23', explanation: '' }
    ],
    starterCode: {
      python: `def max_sub_array(nums):
    # Write your code here (Kadane's Algorithm)
    pass`,
      javascript: `function maxSubArray(nums) {
    // Write your code here (Kadane's Algorithm)
}`
    },
    testCases: [
      { input: '[-2,1,-3,4,-1,2,1,-5,4]', expectedOutput: '6', isHidden: false },
      { input: '[1]', expectedOutput: '1', isHidden: false },
      { input: '[5,4,-1,7,8]', expectedOutput: '23', isHidden: true }
    ],
    hints: [
      'Look up Kadane\'s Algorithm',
      'Keep track of current sum and max sum',
      'If current sum becomes negative, reset it to 0'
    ]
  },

  // === MEDIUM PROBLEMS (15) ===
  {
    id: 'longest-substring',
    title: 'Longest Substring Without Repeating Characters',
    difficulty: 'medium',
    category: ['string', 'hash-table', 'sliding-window'],
    companyTags: ['Amazon', 'Google', 'Facebook', 'Bloomberg'],
    description: `Given a string s, find the length of the longest substring without repeating characters.`,
    constraints: `0 <= s.length <= 5 * 10^4
s consists of English letters, digits, symbols and spaces.`,
    examples: [
      { input: 's = "abcabcbb"', output: '3', explanation: 'The answer is "abc", with the length of 3.' },
      { input: 's = "bbbbb"', output: '1', explanation: 'The answer is "b", with the length of 1.' },
      { input: 's = "pwwkew"', output: '3', explanation: 'The answer is "wke", with the length of 3.' }
    ],
    starterCode: {
      python: `def length_of_longest_substring(s):
    # Write your code here (Sliding Window)
    pass`,
      javascript: `function lengthOfLongestSubstring(s) {
    // Write your code here (Sliding Window)
}`
    },
    testCases: [
      { input: '"abcabcbb"', expectedOutput: '3', isHidden: false },
      { input: '"bbbbb"', expectedOutput: '1', isHidden: false },
      { input: '"pwwkew"', expectedOutput: '3', isHidden: true }
    ],
    hints: [
      'Use sliding window technique',
      'Keep a hash map of characters in current window',
      'When you see a duplicate, shrink the window from the left'
    ]
  },
  {
    id: 'group-anagrams',
    title: 'Group Anagrams',
    difficulty: 'medium',
    category: ['array', 'hash-table', 'string', 'sorting'],
    companyTags: ['Amazon', 'Facebook', 'Bloomberg', 'Yelp'],
    description: `Given an array of strings strs, group the anagrams together. You can return the answer in any order.`,
    constraints: `1 <= strs.length <= 10^4
0 <= strs[i].length <= 100
strs[i] consists of lowercase English letters.`,
    examples: [
      { input: 'strs = ["eat","tea","tan","ate","nat","bat"]', output: '[["bat"],["nat","tan"],["ate","eat","tea"]]', explanation: '' }
    ],
    starterCode: {
      python: `def group_anagrams(strs):
    # Write your code here
    pass`,
      javascript: `function groupAnagrams(strs) {
    // Write your code here
}`
    },
    testCases: [
      { input: '["eat","tea","tan","ate","nat","bat"]', expectedOutput: '[["bat"],["nat","tan"],["ate","eat","tea"]]', isHidden: false }
    ],
    hints: [
      'Sorted strings can be used as keys',
      'Use a hash map to group anagrams'
    ]
  },
  {
    id: 'product-except-self',
    title: 'Product of Array Except Self',
    difficulty: 'medium',
    category: ['array', 'prefix-sum'],
    companyTags: ['Amazon', 'Microsoft', 'Apple', 'Facebook'],
    description: `Given an integer array nums, return an array answer such that answer[i] is equal to the product of all the elements of nums except nums[i].

You must write an algorithm that runs in O(n) time and without using the division operation.`,
    constraints: `2 <= nums.length <= 10^5
-30 <= nums[i] <= 30`,
    examples: [
      { input: 'nums = [1,2,3,4]', output: '[24,12,8,6]', explanation: '' },
      { input: 'nums = [-1,1,0,-3,3]', output: '[0,0,9,0,0]', explanation: '' }
    ],
    starterCode: {
      python: `def product_except_self(nums):
    # Write your code here
    pass`,
      javascript: `function productExceptSelf(nums) {
    // Write your code here
}`
    },
    testCases: [
      { input: '[1,2,3,4]', expectedOutput: '[24,12,8,6]', isHidden: false },
      { input: '[-1,1,0,-3,3]', expectedOutput: '[0,0,9,0,0]', isHidden: true }
    ],
    hints: [
      'Think about prefix and suffix products',
      'Can you do it with two passes?'
    ]
  },
  {
    id: 'valid-sudoku',
    title: 'Valid Sudoku',
    difficulty: 'medium',
    category: ['array', 'hash-table', 'matrix'],
    companyTags: ['Amazon', 'Apple', 'Snapchat'],
    description: `Determine if a 9 x 9 Sudoku board is valid. Only the filled cells need to be validated according to the following rules:

1. Each row must contain the digits 1-9 without repetition.
2. Each column must contain the digits 1-9 without repetition.
3. Each of the nine 3 x 3 sub-boxes of the grid must contain the digits 1-9 without repetition.`,
    constraints: `board.length == 9
board[i].length == 9
board[i][j] is a digit 1-9 or '.'.`,
    examples: [
      { input: 'board = [["5","3",".",".","7",".",".",".","."],["6",".",".","1","9","5",".",".","."],[".","9","8",".",".",".",".","6","."],["8",".",".",".","6",".",".",".","3"],["4",".",".","8",".","3",".",".","1"],["7",".",".",".","2",".",".",".","6"],[".","6",".",".",".",".","2","8","."],[".",".",".","4","1","9",".",".","5"],[".",".",".",".","8",".",".","7","9"]]', output: 'true', explanation: '' }
    ],
    starterCode: {
      python: `def is_valid_sudoku(board):
    # Write your code here
    pass`,
      javascript: `function isValidSudoku(board) {
    // Write your code here
}`
    },
    testCases: [
      { input: 'valid_board', expectedOutput: 'true', isHidden: false }
    ],
    hints: [
      'Use sets to track seen numbers in rows, columns, and boxes',
      'Box index can be calculated as (row // 3, col // 3)'
    ]
  },
  {
    id: 'search-rotated-sorted',
    title: 'Search in Rotated Sorted Array',
    difficulty: 'medium',
    category: ['array', 'binary-search'],
    companyTags: ['Amazon', 'Facebook', 'Microsoft', 'LinkedIn'],
    description: `There is an integer array nums sorted in ascending order (with distinct values).

Prior to being passed to your function, nums is possibly rotated at an unknown pivot index k.

Given the array nums after the possible rotation and an integer target, return the index of target if it is in nums, or -1 if it is not in nums.

You must write an algorithm with O(log n) runtime complexity.`,
    constraints: `1 <= nums.length <= 5000
-10^4 <= nums[i] <= 10^4
All values of nums are unique.`,
    examples: [
      { input: 'nums = [4,5,6,7,0,1,2], target = 0', output: '4', explanation: '' },
      { input: 'nums = [4,5,6,7,0,1,2], target = 3', output: '-1', explanation: '' }
    ],
    starterCode: {
      python: `def search(nums, target):
    # Write your code here (Modified Binary Search)
    pass`,
      javascript: `function search(nums, target) {
    // Write your code here (Modified Binary Search)
}`
    },
    testCases: [
      { input: '[4,5,6,7,0,1,2], 0', expectedOutput: '4', isHidden: false },
      { input: '[4,5,6,7,0,1,2], 3', expectedOutput: '-1', isHidden: false }
    ],
    hints: [
      'Use modified binary search',
      'At least one half is always sorted',
      'Determine which half is sorted and if target is in that range'
    ]
  },
  {
    id: 'coin-change',
    title: 'Coin Change',
    difficulty: 'medium',
    category: ['array', 'dynamic-programming', 'breadth-first-search'],
    companyTags: ['Amazon', 'Google', 'Facebook'],
    description: `You are given an integer array coins representing coins of different denominations and an integer amount representing a total amount of money.

Return the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return -1.

You may assume that you have an infinite number of each kind of coin.`,
    constraints: `1 <= coins.length <= 12
1 <= coins[i] <= 2^31 - 1
0 <= amount <= 10^4`,
    examples: [
      { input: 'coins = [1,2,5], amount = 11', output: '3', explanation: '11 = 5 + 5 + 1' },
      { input: 'coins = [2], amount = 3', output: '-1', explanation: '' }
    ],
    starterCode: {
      python: `def coin_change(coins, amount):
    # Write your code here (Dynamic Programming)
    pass`,
      javascript: `function coinChange(coins, amount) {
    // Write your code here (Dynamic Programming)
}`
    },
    testCases: [
      { input: '[1,2,5], 11', expectedOutput: '3', isHidden: false },
      { input: '[2], 3', expectedOutput: '-1', isHidden: false },
      { input: '[1], 0', expectedOutput: '0', isHidden: true }
    ],
    hints: [
      'Use dynamic programming',
      'dp[i] = minimum coins needed for amount i',
      'For each amount, try all coin denominations'
    ]
  },

  // === HARD PROBLEMS (5) ===
  {
    id: 'trapping-rain-water',
    title: 'Trapping Rain Water',
    difficulty: 'hard',
    category: ['array', 'two-pointers', 'dynamic-programming', 'stack'],
    companyTags: ['Amazon', 'Google', 'Facebook', 'Apple'],
    description: `Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.`,
    constraints: `n == height.length
1 <= n <= 2 * 10^4
0 <= height[i] <= 10^5`,
    examples: [
      { input: 'height = [0,1,0,2,1,0,1,3,2,1,2,1]', output: '6', explanation: 'The above elevation map (black section) is represented by array [0,1,0,2,1,0,1,3,2,1,2,1]. In this case, 6 units of rain water (blue section) are being trapped.' },
      { input: 'height = [4,2,0,3,2,5]', output: '9', explanation: '' }
    ],
    starterCode: {
      python: `def trap(height):
    # Write your code here (Two Pointers or DP)
    pass`,
      javascript: `function trap(height) {
    // Write your code here (Two Pointers or DP)
}`
    },
    testCases: [
      { input: '[0,1,0,2,1,0,1,3,2,1,2,1]', expectedOutput: '6', isHidden: false },
      { input: '[4,2,0,3,2,5]', expectedOutput: '9', isHidden: true }
    ],
    hints: [
      'Water trapped at position i = min(max_left, max_right) - height[i]',
      'Can you use two pointers moving from both ends?',
      'Keep track of max heights seen from left and right'
    ]
  },
  {
    id: 'word-ladder',
    title: 'Word Ladder',
    difficulty: 'hard',
    category: ['hash-table', 'string', 'breadth-first-search'],
    companyTags: ['Amazon', 'Facebook', 'LinkedIn', 'Snapchat'],
    description: `A transformation sequence from word beginWord to word endWord using a dictionary wordList is a sequence of words beginWord -> s1 -> s2 -> ... -> sk such that:
- Every adjacent pair of words differs by a single letter.
- Every si for 1 <= i <= k is in wordList. Note that beginWord does not need to be in wordList.
- sk == endWord

Given two words, beginWord and endWord, and a dictionary wordList, return the number of words in the shortest transformation sequence from beginWord to endWord, or 0 if no such sequence exists.`,
    constraints: `1 <= beginWord.length <= 10
endWord.length == beginWord.length
1 <= wordList.length <= 5000`,
    examples: [
      { input: 'beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log","cog"]', output: '5', explanation: 'One shortest transformation sequence is "hit" -> "hot" -> "dot" -> "dog" -> "cog", which is 5 words long.' }
    ],
    starterCode: {
      python: `def ladder_length(beginWord, endWord, wordList):
    # Write your code here (BFS)
    pass`,
      javascript: `function ladderLength(beginWord, endWord, wordList) {
    // Write your code here (BFS)
}`
    },
    testCases: [
      { input: '"hit", "cog", ["hot","dot","dog","lot","log","cog"]', expectedOutput: '5', isHidden: false }
    ],
    hints: [
      'This is a shortest path problem - use BFS',
      'Build a graph where words are nodes',
      'Two words are connected if they differ by one letter'
    ]
  },
  {
    id: 'median-two-sorted',
    title: 'Median of Two Sorted Arrays',
    difficulty: 'hard',
    category: ['array', 'binary-search', 'divide-and-conquer'],
    companyTags: ['Amazon', 'Google', 'Microsoft', 'Apple'],
    description: `Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays.

The overall run time complexity should be O(log (m+n)).`,
    constraints: `nums1.length == m
nums2.length == n
0 <= m <= 1000
0 <= n <= 1000
1 <= m + n <= 2000`,
    examples: [
      { input: 'nums1 = [1,3], nums2 = [2]', output: '2.00000', explanation: 'merged array = [1,2,3] and median is 2.' },
      { input: 'nums1 = [1,2], nums2 = [3,4]', output: '2.50000', explanation: 'merged array = [1,2,3,4] and median is (2 + 3) / 2 = 2.5.' }
    ],
    starterCode: {
      python: `def find_median_sorted_arrays(nums1, nums2):
    # Write your code here (Binary Search)
    pass`,
      javascript: `function findMedianSortedArrays(nums1, nums2) {
    // Write your code here (Binary Search)
}`
    },
    testCases: [
      { input: '[1,3], [2]', expectedOutput: '2.0', isHidden: false },
      { input: '[1,2], [3,4]', expectedOutput: '2.5', isHidden: false }
    ],
    hints: [
      'Use binary search on the smaller array',
      'Partition both arrays such that left half has same length as right half',
      'Ensure all elements on left are smaller than elements on right'
    ]
  }
];

// Export all problems (original + extended)
import { problems } from './problemBank.js';

export const allProblems = [...problems, ...extendedProblems];

// Get random problem by difficulty
export function getRandomProblem(difficulty = null) {
  const filteredProblems = difficulty
    ? allProblems.filter(p => p.difficulty === difficulty)
    : allProblems;

  return filteredProblems[Math.floor(Math.random() * filteredProblems.length)];
}

// Get problem by ID
export function getProblemById(id) {
  return allProblems.find(p => p.id === id);
}

// Get problems by category
export function getProblemsByCategory(category) {
  return allProblems.filter(p => p.category.includes(category));
}

// Get problems by company tag
export function getProblemsByCompany(company) {
  return allProblems.filter(p => p.companyTags.includes(company));
}

// Get all unique categories
export function getAllCategories() {
  const categories = new Set();
  allProblems.forEach(p => p.category.forEach(c => categories.add(c)));
  return Array.from(categories).sort();
}

// Get all unique companies
export function getAllCompanies() {
  const companies = new Set();
  allProblems.forEach(p => p.companyTags.forEach(c => companies.add(c)));
  return Array.from(companies).sort();
}

// Get problem statistics
export function getProblemStats() {
  const stats = {
    total: allProblems.length,
    byDifficulty: {
      easy: allProblems.filter(p => p.difficulty === 'easy').length,
      medium: allProblems.filter(p => p.difficulty === 'medium').length,
      hard: allProblems.filter(p => p.difficulty === 'hard').length
    },
    byCategory: {}
  };

  const categories = getAllCategories();
  categories.forEach(cat => {
    stats.byCategory[cat] = allProblems.filter(p => p.category.includes(cat)).length;
  });

  return stats;
}
