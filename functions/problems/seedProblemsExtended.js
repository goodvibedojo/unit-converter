/**
 * Extended problem bank with 15+ problems
 * Covers: Easy (7), Medium (6), Hard (2)
 * Categories: Array, String, Tree, Graph, DP, etc.
 */

const EXTENDED_PROBLEMS = [
  // ===== EASY PROBLEMS =====
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
      { id: 'tc1', input: '[2,7,11,15]\n9', expectedOutput: '[0,1]', isHidden: false, weight: 1 },
      { id: 'tc2', input: '[3,2,4]\n6', expectedOutput: '[1,2]', isHidden: false, weight: 1 },
      { id: 'tc3', input: '[3,3]\n6', expectedOutput: '[0,1]', isHidden: true, weight: 1 },
    ],
    hints: [
      'Think about what data structure allows O(1) lookups.',
      'For each number, check if its complement exists.',
      'Use a hash map to store seen numbers and their indices.',
    ],
    stats: { totalAttempts: 0, successRate: 0, averageTime: 0 },
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
    ],
    starterCode: {
      python: `def reverse_string(s):
    """
    :type s: List[str]
    :rtype: None Do not return anything, modify s in-place instead.
    """
    pass`,
      javascript: `function reverseString(s) {
    // Your code here
}`,
      java: `class Solution {
    public void reverseString(char[] s) {
        // Your code here
    }
}`,
    },
    testCases: [
      { id: 'tc1', input: '["h","e","l","l","o"]', expectedOutput: '["o","l","l","e","h"]', isHidden: false, weight: 1 },
      { id: 'tc2', input: '["H","a","n","n","a","h"]', expectedOutput: '["h","a","n","n","a","H"]', isHidden: false, weight: 1 },
    ],
    hints: ['Use two pointers approach.', 'Swap elements from start and end.'],
    stats: { totalAttempts: 0, successRate: 0, averageTime: 0 },
  },

  {
    id: 'valid-palindrome',
    title: 'Valid Palindrome',
    slug: 'valid-palindrome',
    difficulty: 'easy',
    category: ['string', 'two-pointers'],
    companyTags: ['meta', 'amazon', 'microsoft'],
    description: `A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.

Given a string \`s\`, return \`true\` if it is a palindrome, or \`false\` otherwise.`,
    constraints: [
      '1 <= s.length <= 2 * 10^5',
      's consists only of printable ASCII characters.',
    ],
    examples: [
      {
        input: 's = "A man, a plan, a canal: Panama"',
        output: 'true',
        explanation: 'After cleaning: "amanaplanacanalpanama" is a palindrome.',
      },
      {
        input: 's = "race a car"',
        output: 'false',
        explanation: 'After cleaning: "raceacar" is not a palindrome.',
      },
    ],
    starterCode: {
      python: `def is_palindrome(s):
    """
    :type s: str
    :rtype: bool
    """
    pass`,
      javascript: `function isPalindrome(s) {
    // Your code here
}`,
      java: `class Solution {
    public boolean isPalindrome(String s) {
        // Your code here
        return false;
    }
}`,
    },
    testCases: [
      { id: 'tc1', input: '"A man, a plan, a canal: Panama"', expectedOutput: 'true', isHidden: false, weight: 1 },
      { id: 'tc2', input: '"race a car"', expectedOutput: 'false', isHidden: false, weight: 1 },
      { id: 'tc3', input: '" "', expectedOutput: 'true', isHidden: true, weight: 1 },
    ],
    hints: [
      'Filter out non-alphanumeric characters first.',
      'Use two pointers from both ends.',
      'Compare characters while moving towards center.',
    ],
    stats: { totalAttempts: 0, successRate: 0, averageTime: 0 },
  },

  {
    id: 'best-time-buy-sell-stock',
    title: 'Best Time to Buy and Sell Stock',
    slug: 'best-time-buy-sell-stock',
    difficulty: 'easy',
    category: ['array', 'dynamic-programming'],
    companyTags: ['amazon', 'meta', 'google', 'microsoft'],
    description: `You are given an array \`prices\` where \`prices[i]\` is the price of a given stock on the \`i\`th day.

You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.

Return the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return \`0\`.`,
    constraints: [
      '1 <= prices.length <= 10^5',
      '0 <= prices[i] <= 10^4',
    ],
    examples: [
      {
        input: 'prices = [7,1,5,3,6,4]',
        output: '5',
        explanation: 'Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5.',
      },
      {
        input: 'prices = [7,6,4,3,1]',
        output: '0',
        explanation: 'No profit can be made.',
      },
    ],
    starterCode: {
      python: `def max_profit(prices):
    """
    :type prices: List[int]
    :rtype: int
    """
    pass`,
      javascript: `function maxProfit(prices) {
    // Your code here
}`,
      java: `class Solution {
    public int maxProfit(int[] prices) {
        // Your code here
        return 0;
    }
}`,
    },
    testCases: [
      { id: 'tc1', input: '[7,1,5,3,6,4]', expectedOutput: '5', isHidden: false, weight: 1 },
      { id: 'tc2', input: '[7,6,4,3,1]', expectedOutput: '0', isHidden: false, weight: 1 },
      { id: 'tc3', input: '[2,4,1]', expectedOutput: '2', isHidden: true, weight: 1 },
    ],
    hints: [
      'Track the minimum price seen so far.',
      'Calculate potential profit at each day.',
      'Keep track of maximum profit.',
    ],
    stats: { totalAttempts: 0, successRate: 0, averageTime: 0 },
  },

  {
    id: 'valid-parentheses',
    title: 'Valid Parentheses',
    slug: 'valid-parentheses',
    difficulty: 'easy',
    category: ['string', 'stack'],
    companyTags: ['google', 'amazon', 'meta', 'microsoft'],
    description: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
    constraints: [
      '1 <= s.length <= 10^4',
      's consists of parentheses only \'()[]{}\'.',
    ],
    examples: [
      {
        input: 's = "()"',
        output: 'true',
        explanation: '',
      },
      {
        input: 's = "()[]{}"',
        output: 'true',
        explanation: '',
      },
      {
        input: 's = "(]"',
        output: 'false',
        explanation: '',
      },
    ],
    starterCode: {
      python: `def is_valid(s):
    """
    :type s: str
    :rtype: bool
    """
    pass`,
      javascript: `function isValid(s) {
    // Your code here
}`,
      java: `class Solution {
    public boolean isValid(String s) {
        // Your code here
        return false;
    }
}`,
    },
    testCases: [
      { id: 'tc1', input: '"()"', expectedOutput: 'true', isHidden: false, weight: 1 },
      { id: 'tc2', input: '"()[]{}"', expectedOutput: 'true', isHidden: false, weight: 1 },
      { id: 'tc3', input: '"(]"', expectedOutput: 'false', isHidden: false, weight: 1 },
      { id: 'tc4', input: '"{[]}"', expectedOutput: 'true', isHidden: true, weight: 1 },
    ],
    hints: [
      'Use a stack data structure.',
      'Push opening brackets onto the stack.',
      'For closing brackets, check if they match the top of stack.',
    ],
    stats: { totalAttempts: 0, successRate: 0, averageTime: 0 },
  },

  {
    id: 'merge-two-sorted-lists',
    title: 'Merge Two Sorted Lists',
    slug: 'merge-two-sorted-lists',
    difficulty: 'easy',
    category: ['linked-list', 'recursion'],
    companyTags: ['amazon', 'microsoft', 'apple'],
    description: `You are given the heads of two sorted linked lists \`list1\` and \`list2\`.

Merge the two lists into one sorted list. The list should be made by splicing together the nodes of the first two lists.

Return the head of the merged linked list.`,
    constraints: [
      'The number of nodes in both lists is in the range [0, 50].',
      '-100 <= Node.val <= 100',
      'Both list1 and list2 are sorted in non-decreasing order.',
    ],
    examples: [
      {
        input: 'list1 = [1,2,4], list2 = [1,3,4]',
        output: '[1,1,2,3,4,4]',
        explanation: '',
      },
    ],
    starterCode: {
      python: `def merge_two_lists(list1, list2):
    """
    :type list1: Optional[ListNode]
    :type list2: Optional[ListNode]
    :rtype: Optional[ListNode]
    """
    pass`,
      javascript: `function mergeTwoLists(list1, list2) {
    // Your code here
}`,
      java: `class Solution {
    public ListNode mergeTwoLists(ListNode list1, ListNode list2) {
        // Your code here
        return null;
    }
}`,
    },
    testCases: [
      { id: 'tc1', input: '[1,2,4]\n[1,3,4]', expectedOutput: '[1,1,2,3,4,4]', isHidden: false, weight: 1 },
      { id: 'tc2', input: '[]\n[]', expectedOutput: '[]', isHidden: false, weight: 1 },
      { id: 'tc3', input: '[]\n[0]', expectedOutput: '[0]', isHidden: true, weight: 1 },
    ],
    hints: [
      'Use a dummy node to simplify edge cases.',
      'Compare values from both lists and append smaller one.',
      'Can be solved iteratively or recursively.',
    ],
    stats: { totalAttempts: 0, successRate: 0, averageTime: 0 },
  },

  {
    id: 'maximum-subarray',
    title: 'Maximum Subarray',
    slug: 'maximum-subarray',
    difficulty: 'easy',
    category: ['array', 'dynamic-programming', 'divide-and-conquer'],
    companyTags: ['amazon', 'microsoft', 'apple', 'google'],
    description: `Given an integer array \`nums\`, find the subarray with the largest sum, and return its sum.`,
    constraints: [
      '1 <= nums.length <= 10^5',
      '-10^4 <= nums[i] <= 10^4',
    ],
    examples: [
      {
        input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]',
        output: '6',
        explanation: 'The subarray [4,-1,2,1] has the largest sum 6.',
      },
    ],
    starterCode: {
      python: `def max_sub_array(nums):
    """
    :type nums: List[int]
    :rtype: int
    """
    pass`,
      javascript: `function maxSubArray(nums) {
    // Your code here
}`,
      java: `class Solution {
    public int maxSubArray(int[] nums) {
        // Your code here
        return 0;
    }
}`,
    },
    testCases: [
      { id: 'tc1', input: '[-2,1,-3,4,-1,2,1,-5,4]', expectedOutput: '6', isHidden: false, weight: 1 },
      { id: 'tc2', input: '[1]', expectedOutput: '1', isHidden: false, weight: 1 },
      { id: 'tc3', input: '[5,4,-1,7,8]', expectedOutput: '23', isHidden: true, weight: 1 },
    ],
    hints: [
      'Try Kadane\'s algorithm.',
      'Keep track of current sum and maximum sum.',
      'If current sum becomes negative, reset it to 0.',
    ],
    stats: { totalAttempts: 0, successRate: 0, averageTime: 0 },
  },

  // ===== MEDIUM PROBLEMS =====
  {
    id: 'longest-substring-without-repeating',
    title: 'Longest Substring Without Repeating Characters',
    slug: 'longest-substring-without-repeating',
    difficulty: 'medium',
    category: ['string', 'hash-table', 'sliding-window'],
    companyTags: ['amazon', 'meta', 'apple', 'microsoft'],
    description: `Given a string \`s\`, find the length of the longest substring without repeating characters.`,
    constraints: [
      '0 <= s.length <= 5 * 10^4',
      's consists of English letters, digits, symbols and spaces.',
    ],
    examples: [
      {
        input: 's = "abcabcbb"',
        output: '3',
        explanation: 'The answer is "abc", with the length of 3.',
      },
      {
        input: 's = "bbbbb"',
        output: '1',
        explanation: 'The answer is "b", with the length of 1.',
      },
    ],
    starterCode: {
      python: `def length_of_longest_substring(s):
    """
    :type s: str
    :rtype: int
    """
    pass`,
      javascript: `function lengthOfLongestSubstring(s) {
    // Your code here
}`,
      java: `class Solution {
    public int lengthOfLongestSubstring(String s) {
        // Your code here
        return 0;
    }
}`,
    },
    testCases: [
      { id: 'tc1', input: '"abcabcbb"', expectedOutput: '3', isHidden: false, weight: 1 },
      { id: 'tc2', input: '"bbbbb"', expectedOutput: '1', isHidden: false, weight: 1 },
      { id: 'tc3', input: '"pwwkew"', expectedOutput: '3', isHidden: true, weight: 1 },
    ],
    hints: [
      'Use sliding window technique.',
      'Use a hash set to track characters in current window.',
      'Move the left pointer when duplicate is found.',
    ],
    stats: { totalAttempts: 0, successRate: 0, averageTime: 0 },
  },

  {
    id: 'container-with-most-water',
    title: 'Container With Most Water',
    slug: 'container-with-most-water',
    difficulty: 'medium',
    category: ['array', 'two-pointers', 'greedy'],
    companyTags: ['amazon', 'meta', 'google'],
    description: `You are given an integer array \`height\` of length \`n\`. There are \`n\` vertical lines drawn such that the two endpoints of the \`i\`th line are \`(i, 0)\` and \`(i, height[i])\`.

Find two lines that together with the x-axis form a container, such that the container contains the most water.

Return the maximum amount of water a container can store.`,
    constraints: [
      'n == height.length',
      '2 <= n <= 10^5',
      '0 <= height[i] <= 10^4',
    ],
    examples: [
      {
        input: 'height = [1,8,6,2,5,4,8,3,7]',
        output: '49',
        explanation: 'The vertical lines at indices 1 and 8 form a container with height 7 and width 7, giving area 49.',
      },
    ],
    starterCode: {
      python: `def max_area(height):
    """
    :type height: List[int]
    :rtype: int
    """
    pass`,
      javascript: `function maxArea(height) {
    // Your code here
}`,
      java: `class Solution {
    public int maxArea(int[] height) {
        // Your code here
        return 0;
    }
}`,
    },
    testCases: [
      { id: 'tc1', input: '[1,8,6,2,5,4,8,3,7]', expectedOutput: '49', isHidden: false, weight: 1 },
      { id: 'tc2', input: '[1,1]', expectedOutput: '1', isHidden: false, weight: 1 },
      { id: 'tc3', input: '[4,3,2,1,4]', expectedOutput: '16', isHidden: true, weight: 1 },
    ],
    hints: [
      'Use two pointers at both ends.',
      'Move the pointer with smaller height.',
      'Keep track of maximum area.',
    ],
    stats: { totalAttempts: 0, successRate: 0, averageTime: 0 },
  },

  {
    id: 'three-sum',
    title: '3Sum',
    slug: 'three-sum',
    difficulty: 'medium',
    category: ['array', 'two-pointers', 'sorting'],
    companyTags: ['amazon', 'meta', 'microsoft', 'apple'],
    description: `Given an integer array nums, return all the triplets \`[nums[i], nums[j], nums[k]]\` such that \`i != j\`, \`i != k\`, and \`j != k\`, and \`nums[i] + nums[j] + nums[k] == 0\`.

Notice that the solution set must not contain duplicate triplets.`,
    constraints: [
      '3 <= nums.length <= 3000',
      '-10^5 <= nums[i] <= 10^5',
    ],
    examples: [
      {
        input: 'nums = [-1,0,1,2,-1,-4]',
        output: '[[-1,-1,2],[-1,0,1]]',
        explanation: 'The distinct triplets are [-1,0,1] and [-1,-1,2].',
      },
    ],
    starterCode: {
      python: `def three_sum(nums):
    """
    :type nums: List[int]
    :rtype: List[List[int]]
    """
    pass`,
      javascript: `function threeSum(nums) {
    // Your code here
}`,
      java: `class Solution {
    public List<List<Integer>> threeSum(int[] nums) {
        // Your code here
        return new ArrayList<>();
    }
}`,
    },
    testCases: [
      { id: 'tc1', input: '[-1,0,1,2,-1,-4]', expectedOutput: '[[-1,-1,2],[-1,0,1]]', isHidden: false, weight: 1 },
      { id: 'tc2', input: '[0,1,1]', expectedOutput: '[]', isHidden: false, weight: 1 },
      { id: 'tc3', input: '[0,0,0]', expectedOutput: '[[0,0,0]]', isHidden: true, weight: 1 },
    ],
    hints: [
      'Sort the array first.',
      'For each element, use two pointers to find pairs that sum to its negative.',
      'Skip duplicates to avoid duplicate triplets.',
    ],
    stats: { totalAttempts: 0, successRate: 0, averageTime: 0 },
  },

  {
    id: 'group-anagrams',
    title: 'Group Anagrams',
    slug: 'group-anagrams',
    difficulty: 'medium',
    category: ['array', 'hash-table', 'string', 'sorting'],
    companyTags: ['amazon', 'meta', 'microsoft', 'uber'],
    description: `Given an array of strings \`strs\`, group the anagrams together. You can return the answer in any order.

An Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.`,
    constraints: [
      '1 <= strs.length <= 10^4',
      '0 <= strs[i].length <= 100',
      'strs[i] consists of lowercase English letters.',
    ],
    examples: [
      {
        input: 'strs = ["eat","tea","tan","ate","nat","bat"]',
        output: '[["bat"],["nat","tan"],["ate","eat","tea"]]',
        explanation: '',
      },
    ],
    starterCode: {
      python: `def group_anagrams(strs):
    """
    :type strs: List[str]
    :rtype: List[List[str]]
    """
    pass`,
      javascript: `function groupAnagrams(strs) {
    // Your code here
}`,
      java: `class Solution {
    public List<List<String>> groupAnagrams(String[] strs) {
        // Your code here
        return new ArrayList<>();
    }
}`,
    },
    testCases: [
      { id: 'tc1', input: '["eat","tea","tan","ate","nat","bat"]', expectedOutput: '[["bat"],["nat","tan"],["ate","eat","tea"]]', isHidden: false, weight: 1 },
      { id: 'tc2', input: '[""]', expectedOutput: '[[""]]', isHidden: false, weight: 1 },
      { id: 'tc3', input: '["a"]', expectedOutput: '[["a"]]', isHidden: true, weight: 1 },
    ],
    hints: [
      'Use a hash map to group anagrams.',
      'Sort each string to use as a key.',
      'Or use character frequency as key.',
    ],
    stats: { totalAttempts: 0, successRate: 0, averageTime: 0 },
  },

  {
    id: 'product-of-array-except-self',
    title: 'Product of Array Except Self',
    slug: 'product-of-array-except-self',
    difficulty: 'medium',
    category: ['array', 'prefix-sum'],
    companyTags: ['amazon', 'meta', 'apple', 'microsoft'],
    description: `Given an integer array \`nums\`, return an array \`answer\` such that \`answer[i]\` is equal to the product of all the elements of \`nums\` except \`nums[i]\`.

The product of any prefix or suffix of \`nums\` is guaranteed to fit in a 32-bit integer.

You must write an algorithm that runs in O(n) time and without using the division operation.`,
    constraints: [
      '2 <= nums.length <= 10^5',
      '-30 <= nums[i] <= 30',
      'The product of any prefix or suffix of nums is guaranteed to fit in a 32-bit integer.',
    ],
    examples: [
      {
        input: 'nums = [1,2,3,4]',
        output: '[24,12,8,6]',
        explanation: '',
      },
    ],
    starterCode: {
      python: `def product_except_self(nums):
    """
    :type nums: List[int]
    :rtype: List[int]
    """
    pass`,
      javascript: `function productExceptSelf(nums) {
    // Your code here
}`,
      java: `class Solution {
    public int[] productExceptSelf(int[] nums) {
        // Your code here
        return new int[]{};
    }
}`,
    },
    testCases: [
      { id: 'tc1', input: '[1,2,3,4]', expectedOutput: '[24,12,8,6]', isHidden: false, weight: 1 },
      { id: 'tc2', input: '[-1,1,0,-3,3]', expectedOutput: '[0,0,9,0,0]', isHidden: false, weight: 1 },
    ],
    hints: [
      'Think about prefix and suffix products.',
      'Build result array with left products, then multiply by right products.',
      'Can be done in O(n) time and O(1) extra space (excluding output array).',
    ],
    stats: { totalAttempts: 0, successRate: 0, averageTime: 0 },
  },

  {
    id: 'valid-sudoku',
    title: 'Valid Sudoku',
    slug: 'valid-sudoku',
    difficulty: 'medium',
    category: ['array', 'hash-table', 'matrix'],
    companyTags: ['amazon', 'apple', 'uber'],
    description: `Determine if a \`9 x 9\` Sudoku board is valid. Only the filled cells need to be validated according to the following rules:

1. Each row must contain the digits 1-9 without repetition.
2. Each column must contain the digits 1-9 without repetition.
3. Each of the nine 3 x 3 sub-boxes of the grid must contain the digits 1-9 without repetition.

Note:
- A Sudoku board (partially filled) could be valid but is not necessarily solvable.
- Only the filled cells need to be validated according to the mentioned rules.`,
    constraints: [
      'board.length == 9',
      'board[i].length == 9',
      'board[i][j] is a digit 1-9 or \'.\'.',
    ],
    examples: [
      {
        input: 'board = [["5","3",".",".","7",".",".",".","."],["6",".",".","1","9","5",".",".","."],[".","9","8",".",".",".",".","6","."],["8",".",".",".","6",".",".",".","3"],["4",".",".","8",".","3",".",".","1"],["7",".",".",".","2",".",".",".","6"],[".","6",".",".",".",".","2","8","."],[".",".",".","4","1","9",".",".","5"],[".",".",".",".","8",".",".","7","9"]]',
        output: 'true',
        explanation: '',
      },
    ],
    starterCode: {
      python: `def is_valid_sudoku(board):
    """
    :type board: List[List[str]]
    :rtype: bool
    """
    pass`,
      javascript: `function isValidSudoku(board) {
    // Your code here
}`,
      java: `class Solution {
    public boolean isValidSudoku(char[][] board) {
        // Your code here
        return false;
    }
}`,
    },
    testCases: [
      { id: 'tc1', input: '[["5","3",".",".","7",".",".",".","."],["6",".",".","1","9","5",".",".","."],[".","9","8",".",".",".",".","6","."],["8",".",".",".","6",".",".",".","3"],["4",".",".","8",".","3",".",".","1"],["7",".",".",".","2",".",".",".","6"],[".","6",".",".",".",".","2","8","."],[".",".",".","4","1","9",".",".","5"],[".",".",".",".","8",".",".","7","9"]]', expectedOutput: 'true', isHidden: false, weight: 1 },
    ],
    hints: [
      'Use hash sets to track seen numbers.',
      'Check each row, column, and 3x3 box.',
      'Box index can be calculated as (row/3)*3 + col/3.',
    ],
    stats: { totalAttempts: 0, successRate: 0, averageTime: 0 },
  },

  // ===== HARD PROBLEMS =====
  {
    id: 'median-of-two-sorted-arrays',
    title: 'Median of Two Sorted Arrays',
    slug: 'median-of-two-sorted-arrays',
    difficulty: 'hard',
    category: ['array', 'binary-search', 'divide-and-conquer'],
    companyTags: ['google', 'amazon', 'meta', 'apple'],
    description: `Given two sorted arrays \`nums1\` and \`nums2\` of size \`m\` and \`n\` respectively, return the median of the two sorted arrays.

The overall run time complexity should be O(log (m+n)).`,
    constraints: [
      'nums1.length == m',
      'nums2.length == n',
      '0 <= m <= 1000',
      '0 <= n <= 1000',
      '1 <= m + n <= 2000',
      '-10^6 <= nums1[i], nums2[i] <= 10^6',
    ],
    examples: [
      {
        input: 'nums1 = [1,3], nums2 = [2]',
        output: '2.00000',
        explanation: 'merged array = [1,2,3] and median is 2.',
      },
      {
        input: 'nums1 = [1,2], nums2 = [3,4]',
        output: '2.50000',
        explanation: 'merged array = [1,2,3,4] and median is (2 + 3) / 2 = 2.5.',
      },
    ],
    starterCode: {
      python: `def find_median_sorted_arrays(nums1, nums2):
    """
    :type nums1: List[int]
    :type nums2: List[int]
    :rtype: float
    """
    pass`,
      javascript: `function findMedianSortedArrays(nums1, nums2) {
    // Your code here
}`,
      java: `class Solution {
    public double findMedianSortedArrays(int[] nums1, int[] nums2) {
        // Your code here
        return 0.0;
    }
}`,
    },
    testCases: [
      { id: 'tc1', input: '[1,3]\n[2]', expectedOutput: '2.0', isHidden: false, weight: 1 },
      { id: 'tc2', input: '[1,2]\n[3,4]', expectedOutput: '2.5', isHidden: false, weight: 1 },
      { id: 'tc3', input: '[0,0]\n[0,0]', expectedOutput: '0.0', isHidden: true, weight: 1 },
    ],
    hints: [
      'Use binary search on the smaller array.',
      'Find the correct partition point.',
      'Ensure left half has same or one more element than right half.',
    ],
    stats: { totalAttempts: 0, successRate: 0, averageTime: 0 },
  },

  {
    id: 'trapping-rain-water',
    title: 'Trapping Rain Water',
    slug: 'trapping-rain-water',
    difficulty: 'hard',
    category: ['array', 'two-pointers', 'dynamic-programming', 'stack'],
    companyTags: ['amazon', 'google', 'meta', 'apple'],
    description: `Given \`n\` non-negative integers representing an elevation map where the width of each bar is \`1\`, compute how much water it can trap after raining.`,
    constraints: [
      'n == height.length',
      '1 <= n <= 2 * 10^4',
      '0 <= height[i] <= 10^5',
    ],
    examples: [
      {
        input: 'height = [0,1,0,2,1,0,1,3,2,1,2,1]',
        output: '6',
        explanation: 'The elevation map can trap 6 units of rain water.',
      },
    ],
    starterCode: {
      python: `def trap(height):
    """
    :type height: List[int]
    :rtype: int
    """
    pass`,
      javascript: `function trap(height) {
    // Your code here
}`,
      java: `class Solution {
    public int trap(int[] height) {
        // Your code here
        return 0;
    }
}`,
    },
    testCases: [
      { id: 'tc1', input: '[0,1,0,2,1,0,1,3,2,1,2,1]', expectedOutput: '6', isHidden: false, weight: 1 },
      { id: 'tc2', input: '[4,2,0,3,2,5]', expectedOutput: '9', isHidden: false, weight: 1 },
    ],
    hints: [
      'For each position, water level is min(max_left, max_right).',
      'Can use two pointers from both ends.',
      'Keep track of left_max and right_max.',
    ],
    stats: { totalAttempts: 0, successRate: 0, averageTime: 0 },
  },
];

module.exports = { EXTENDED_PROBLEMS };
