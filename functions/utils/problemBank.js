/**
 * Problem Bank
 * Collection of coding problems for the AI Mock Interview platform
 */

const problems = [
  {
    id: 'two-sum',
    title: 'Two Sum',
    difficulty: 'easy',
    category: ['Array', 'Hash Table'],
    companyTags: ['Google', 'Amazon', 'Microsoft', 'Facebook'],
    description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      '-10^9 <= target <= 10^9',
      'Only one valid answer exists',
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
        explanation: null,
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
    pass

# Example usage
if __name__ == "__main__":
    import sys
    import json
    input_data = json.loads(sys.stdin.read())
    result = two_sum(input_data['nums'], input_data['target'])
    print(json.dumps(result))`,
      javascript: `function twoSum(nums, target) {
    // Your code here
}

// Example usage
const input = JSON.parse(require('fs').readFileSync(0, 'utf-8'));
const result = twoSum(input.nums, input.target);
console.log(JSON.stringify(result));`,
      java: `import java.util.*;
import com.google.gson.*;

public class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Your code here
        return new int[]{};
    }

    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        String input = scanner.nextLine();
        Gson gson = new Gson();
        // Parse and solve
    }
}`,
    },
    testCases: [
      {
        input: '{"nums": [2,7,11,15], "target": 9}',
        expectedOutput: '[0,1]',
        isHidden: false,
      },
      {
        input: '{"nums": [3,2,4], "target": 6}',
        expectedOutput: '[1,2]',
        isHidden: false,
      },
      {
        input: '{"nums": [3,3], "target": 6}',
        expectedOutput: '[0,1]',
        isHidden: true,
      },
    ],
    hints: [
      'Try using a hash table to store the numbers you\'ve seen',
      'For each number, check if (target - number) exists in the hash table',
      'The time complexity can be O(n) with a hash table',
    ],
  },

  {
    id: 'reverse-string',
    title: 'Reverse String',
    difficulty: 'easy',
    category: ['String', 'Two Pointers'],
    companyTags: ['Google', 'Amazon', 'Microsoft'],
    description: `Write a function that reverses a string. The input string is given as an array of characters s.

You must do this by modifying the input array in-place with O(1) extra memory.`,
    constraints: [
      '1 <= s.length <= 10^5',
      's[i] is a printable ascii character',
    ],
    examples: [
      {
        input: 's = ["h","e","l","l","o"]',
        output: '["o","l","l","e","h"]',
        explanation: null,
      },
      {
        input: 's = ["H","a","n","n","a","h"]',
        output: '["h","a","n","n","a","H"]',
        explanation: null,
      },
    ],
    starterCode: {
      python: `def reverse_string(s):
    """
    :type s: List[str]
    :rtype: None (modify s in-place)
    """
    # Your code here
    pass

# Example usage
if __name__ == "__main__":
    import sys
    import json
    s = json.loads(sys.stdin.read())
    reverse_string(s)
    print(json.dumps(s))`,
      javascript: `function reverseString(s) {
    // Your code here (modify s in-place)
}

// Example usage
const input = JSON.parse(require('fs').readFileSync(0, 'utf-8'));
reverseString(input);
console.log(JSON.stringify(input));`,
    },
    testCases: [
      {
        input: '["h","e","l","l","o"]',
        expectedOutput: '["o","l","l","e","h"]',
        isHidden: false,
      },
      {
        input: '["H","a","n","n","a","h"]',
        expectedOutput: '["h","a","n","n","a","H"]',
        isHidden: false,
      },
      {
        input: '["a"]',
        expectedOutput: '["a"]',
        isHidden: true,
      },
    ],
    hints: [
      'Use two pointers, one at the start and one at the end',
      'Swap characters and move pointers toward each other',
      'Stop when pointers meet in the middle',
    ],
  },

  {
    id: 'fizz-buzz',
    title: 'Fizz Buzz',
    difficulty: 'easy',
    category: ['Math', 'String'],
    companyTags: ['Amazon', 'Microsoft'],
    description: `Given an integer n, return a string array answer (1-indexed) where:

- answer[i] == "FizzBuzz" if i is divisible by 3 and 5.
- answer[i] == "Fizz" if i is divisible by 3.
- answer[i] == "Buzz" if i is divisible by 5.
- answer[i] == i (as a string) if none of the above conditions are true.`,
    constraints: [
      '1 <= n <= 10^4',
    ],
    examples: [
      {
        input: 'n = 3',
        output: '["1","2","Fizz"]',
        explanation: null,
      },
      {
        input: 'n = 5',
        output: '["1","2","Fizz","4","Buzz"]',
        explanation: null,
      },
      {
        input: 'n = 15',
        output: '["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11","Fizz","13","14","FizzBuzz"]',
        explanation: null,
      },
    ],
    starterCode: {
      python: `def fizz_buzz(n):
    """
    :type n: int
    :rtype: List[str]
    """
    # Your code here
    pass

# Example usage
if __name__ == "__main__":
    import sys
    import json
    n = int(sys.stdin.read().strip())
    result = fizz_buzz(n)
    print(json.dumps(result))`,
      javascript: `function fizzBuzz(n) {
    // Your code here
}

// Example usage
const n = parseInt(require('fs').readFileSync(0, 'utf-8').trim());
const result = fizzBuzz(n);
console.log(JSON.stringify(result));`,
    },
    testCases: [
      {
        input: '3',
        expectedOutput: '["1","2","Fizz"]',
        isHidden: false,
      },
      {
        input: '5',
        expectedOutput: '["1","2","Fizz","4","Buzz"]',
        isHidden: false,
      },
      {
        input: '15',
        expectedOutput: '["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11","Fizz","13","14","FizzBuzz"]',
        isHidden: true,
      },
    ],
    hints: [
      'Check divisibility by 15 first (both 3 and 5)',
      'Then check divisibility by 3, then by 5',
      'Otherwise, convert the number to a string',
    ],
  },

  {
    id: 'valid-parentheses',
    title: 'Valid Parentheses',
    difficulty: 'easy',
    category: ['String', 'Stack'],
    companyTags: ['Google', 'Amazon', 'Facebook', 'Microsoft'],
    description: `Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
    constraints: [
      '1 <= s.length <= 10^4',
      's consists of parentheses only \'()[]{}\'',
    ],
    examples: [
      {
        input: 's = "()"',
        output: 'true',
        explanation: null,
      },
      {
        input: 's = "()[]{}"',
        output: 'true',
        explanation: null,
      },
      {
        input: 's = "(]"',
        output: 'false',
        explanation: null,
      },
    ],
    starterCode: {
      python: `def is_valid(s):
    """
    :type s: str
    :rtype: bool
    """
    # Your code here
    pass

# Example usage
if __name__ == "__main__":
    import sys
    s = sys.stdin.read().strip()
    result = is_valid(s)
    print(str(result).lower())`,
      javascript: `function isValid(s) {
    // Your code here
}

// Example usage
const s = require('fs').readFileSync(0, 'utf-8').trim();
const result = isValid(s);
console.log(result);`,
    },
    testCases: [
      {
        input: '()',
        expectedOutput: 'true',
        isHidden: false,
      },
      {
        input: '()[]{}',
        expectedOutput: 'true',
        isHidden: false,
      },
      {
        input: '(]',
        expectedOutput: 'false',
        isHidden: false,
      },
      {
        input: '([)]',
        expectedOutput: 'false',
        isHidden: true,
      },
    ],
    hints: [
      'Use a stack data structure',
      'Push opening brackets onto the stack',
      'When you see a closing bracket, check if it matches the top of the stack',
      'At the end, the stack should be empty',
    ],
  },

  {
    id: 'merge-sorted-arrays',
    title: 'Merge Sorted Array',
    difficulty: 'easy',
    category: ['Array', 'Two Pointers', 'Sorting'],
    companyTags: ['Google', 'Amazon', 'Facebook'],
    description: `You are given two integer arrays nums1 and nums2, sorted in non-decreasing order, and two integers m and n, representing the number of elements in nums1 and nums2 respectively.

Merge nums1 and nums2 into a single array sorted in non-decreasing order.

The final sorted array should not be returned by the function, but instead be stored inside the array nums1. To accommodate this, nums1 has a length of m + n, where the first m elements denote the elements that should be merged, and the last n elements are set to 0 and should be ignored. nums2 has a length of n.`,
    constraints: [
      'nums1.length == m + n',
      'nums2.length == n',
      '0 <= m, n <= 200',
      '1 <= m + n <= 200',
      '-10^9 <= nums1[i], nums2[j] <= 10^9',
    ],
    examples: [
      {
        input: 'nums1 = [1,2,3,0,0,0], m = 3, nums2 = [2,5,6], n = 3',
        output: '[1,2,2,3,5,6]',
        explanation: 'The arrays we are merging are [1,2,3] and [2,5,6].',
      },
    ],
    starterCode: {
      python: `def merge(nums1, m, nums2, n):
    """
    :type nums1: List[int]
    :type m: int
    :type nums2: List[int]
    :type n: int
    :rtype: None (modify nums1 in-place)
    """
    # Your code here
    pass

# Example usage
if __name__ == "__main__":
    import sys
    import json
    data = json.loads(sys.stdin.read())
    merge(data['nums1'], data['m'], data['nums2'], data['n'])
    print(json.dumps(data['nums1']))`,
    },
    testCases: [
      {
        input: '{"nums1": [1,2,3,0,0,0], "m": 3, "nums2": [2,5,6], "n": 3}',
        expectedOutput: '[1,2,2,3,5,6]',
        isHidden: false,
      },
      {
        input: '{"nums1": [1], "m": 1, "nums2": [], "n": 0}',
        expectedOutput: '[1]',
        isHidden: true,
      },
    ],
    hints: [
      'Work backwards from the end of nums1',
      'Compare elements from the end of both arrays',
      'Place the larger element at the end of nums1',
    ],
  },
];

/**
 * Get all problems
 * @returns {Array} Array of problem objects
 */
function getAllProblems() {
  return problems;
}

/**
 * Get problem by ID
 * @param {string} id - Problem ID
 * @returns {Object|null} Problem object or null
 */
function getProblemById(id) {
  return problems.find(p => p.id === id) || null;
}

/**
 * Get problems by difficulty
 * @param {string} difficulty - 'easy' | 'medium' | 'hard'
 * @returns {Array} Array of problem objects
 */
function getProblemsByDifficulty(difficulty) {
  return problems.filter(p => p.difficulty === difficulty);
}

/**
 * Get problems by category
 * @param {string} category - Category name
 * @returns {Array} Array of problem objects
 */
function getProblemsByCategory(category) {
  return problems.filter(p => p.category.includes(category));
}

/**
 * Get random problem
 * @param {Object} options - Filter options
 * @param {string} options.difficulty - Filter by difficulty
 * @param {string} options.category - Filter by category
 * @returns {Object} Random problem
 */
function getRandomProblem(options = {}) {
  let filtered = problems;

  if (options.difficulty) {
    filtered = filtered.filter(p => p.difficulty === options.difficulty);
  }

  if (options.category) {
    filtered = filtered.filter(p => p.category.includes(options.category));
  }

  if (filtered.length === 0) {
    return problems[0]; // Fallback to first problem
  }

  const randomIndex = Math.floor(Math.random() * filtered.length);
  return filtered[randomIndex];
}

/**
 * Get problem statistics
 * @returns {Object} Statistics about problem bank
 */
function getProblemStats() {
  const stats = {
    total: problems.length,
    byDifficulty: {
      easy: problems.filter(p => p.difficulty === 'easy').length,
      medium: problems.filter(p => p.difficulty === 'medium').length,
      hard: problems.filter(p => p.difficulty === 'hard').length,
    },
    categories: [...new Set(problems.flatMap(p => p.category))],
    companies: [...new Set(problems.flatMap(p => p.companyTags))],
  };

  return stats;
}

module.exports = {
  getAllProblems,
  getProblemById,
  getProblemsByDifficulty,
  getProblemsByCategory,
  getRandomProblem,
  getProblemStats,
};
