// Problem Bank - Curated coding interview problems
// In production, these would be stored in Firestore

export const problems = [
  {
    id: 'two-sum',
    title: 'Two Sum',
    difficulty: 'easy',
    category: ['arrays', 'hash-table'],
    companyTags: ['Google', 'Amazon', 'Microsoft', 'Facebook'],
    description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
    constraints: `- 2 <= nums.length <= 10^4
- -10^9 <= nums[i] <= 10^9
- -10^9 <= target <= 10^9
- Only one valid answer exists.`,
    examples: [
      {
        input: 'nums = [2,7,11,15], target = 9',
        output: '[0,1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].'
      },
      {
        input: 'nums = [3,2,4], target = 6',
        output: '[1,2]',
        explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2].'
      },
      {
        input: 'nums = [3,3], target = 6',
        output: '[0,1]',
        explanation: 'Because nums[0] + nums[1] == 6, we return [0, 1].'
      }
    ],
    starterCode: {
      python: `def two_sum(nums, target):
    """
    :type nums: List[int]
    :type target: int
    :rtype: List[int]
    """
    # Write your code here
    pass

# Test your solution
if __name__ == "__main__":
    print(two_sum([2, 7, 11, 15], 9))  # Expected: [0, 1]
    print(two_sum([3, 2, 4], 6))  # Expected: [1, 2]
    print(two_sum([3, 3], 6))  # Expected: [0, 1]`,
      javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function twoSum(nums, target) {
    // Write your code here
}

// Test your solution
console.log(twoSum([2, 7, 11, 15], 9));  // Expected: [0, 1]
console.log(twoSum([3, 2, 4], 6));  // Expected: [1, 2]
console.log(twoSum([3, 3], 6));  // Expected: [0, 1]`,
      java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Write your code here
        return new int[]{};
    }

    public static void main(String[] args) {
        Solution sol = new Solution();
        System.out.println(Arrays.toString(sol.twoSum(new int[]{2, 7, 11, 15}, 9)));  // Expected: [0, 1]
    }
}`
    },
    testCases: [
      { input: '[2, 7, 11, 15], 9', expectedOutput: '[0, 1]', isHidden: false },
      { input: '[3, 2, 4], 6', expectedOutput: '[1, 2]', isHidden: false },
      { input: '[3, 3], 6', expectedOutput: '[0, 1]', isHidden: false },
      { input: '[-1, -2, -3, -4, -5], -8', expectedOutput: '[2, 4]', isHidden: true },
      { input: '[1000000000, 2000000000], 3000000000', expectedOutput: '[0, 1]', isHidden: true }
    ],
    hints: [
      'Think about what data structure allows O(1) lookups.',
      'Can you solve this in a single pass through the array?',
      'For each number, what value would you need to find to complete the sum?'
    ]
  },
  {
    id: 'reverse-linked-list',
    title: 'Reverse Linked List',
    difficulty: 'easy',
    category: ['linked-list', 'recursion'],
    companyTags: ['Amazon', 'Microsoft', 'Apple', 'Google'],
    description: `Given the head of a singly linked list, reverse the list, and return the reversed list.`,
    constraints: `- The number of nodes in the list is the range [0, 5000].
- -5000 <= Node.val <= 5000`,
    examples: [
      {
        input: 'head = [1,2,3,4,5]',
        output: '[5,4,3,2,1]',
        explanation: ''
      },
      {
        input: 'head = [1,2]',
        output: '[2,1]',
        explanation: ''
      },
      {
        input: 'head = []',
        output: '[]',
        explanation: ''
      }
    ],
    starterCode: {
      python: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def reverse_list(head):
    """
    :type head: ListNode
    :rtype: ListNode
    """
    # Write your code here
    pass

# Helper function to print list
def print_list(head):
    result = []
    while head:
        result.append(head.val)
        head = head.next
    print(result)

# Test your solution
if __name__ == "__main__":
    # Create list: 1 -> 2 -> 3 -> 4 -> 5
    head = ListNode(1, ListNode(2, ListNode(3, ListNode(4, ListNode(5)))))
    reversed_head = reverse_list(head)
    print_list(reversed_head)  # Expected: [5, 4, 3, 2, 1]`,
      javascript: `class ListNode {
    constructor(val, next = null) {
        this.val = val;
        this.next = next;
    }
}

function reverseList(head) {
    // Write your code here
}

// Helper function to print list
function printList(head) {
    const result = [];
    while (head) {
        result.push(head.val);
        head = head.next;
    }
    console.log(result);
}

// Test your solution
const head = new ListNode(1, new ListNode(2, new ListNode(3, new ListNode(4, new ListNode(5)))));
const reversed = reverseList(head);
printList(reversed);  // Expected: [5, 4, 3, 2, 1]`
    },
    testCases: [
      { input: '[1,2,3,4,5]', expectedOutput: '[5,4,3,2,1]', isHidden: false },
      { input: '[1,2]', expectedOutput: '[2,1]', isHidden: false },
      { input: '[]', expectedOutput: '[]', isHidden: false }
    ],
    hints: [
      'Can you reverse the list in-place (i.e., O(1) extra space)?',
      'Think about keeping track of previous, current, and next nodes.',
      'Can you also solve this recursively?'
    ]
  },
  {
    id: 'valid-parentheses',
    title: 'Valid Parentheses',
    difficulty: 'easy',
    category: ['stack', 'string'],
    companyTags: ['Amazon', 'Google', 'Facebook', 'Microsoft'],
    description: `Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
    constraints: `- 1 <= s.length <= 10^4
- s consists of parentheses only '()[]{}'.`,
    examples: [
      {
        input: 's = "()"',
        output: 'true',
        explanation: ''
      },
      {
        input: 's = "()[]{}"',
        output: 'true',
        explanation: ''
      },
      {
        input: 's = "(]"',
        output: 'false',
        explanation: ''
      }
    ],
    starterCode: {
      python: `def is_valid(s):
    """
    :type s: str
    :rtype: bool
    """
    # Write your code here
    pass

# Test your solution
if __name__ == "__main__":
    print(is_valid("()"))        # Expected: True
    print(is_valid("()[]{}"))    # Expected: True
    print(is_valid("(]"))        # Expected: False
    print(is_valid("([)]"))      # Expected: False
    print(is_valid("{[]}"))      # Expected: True`,
      javascript: `function isValid(s) {
    // Write your code here
}

// Test your solution
console.log(isValid("()"));        // Expected: true
console.log(isValid("()[]{}"));    // Expected: true
console.log(isValid("(]"));        // Expected: false
console.log(isValid("([)]"));      // Expected: false
console.log(isValid("{[]}"));      // Expected: true`
    },
    testCases: [
      { input: '"()"', expectedOutput: 'true', isHidden: false },
      { input: '"()[]{}"', expectedOutput: 'true', isHidden: false },
      { input: '"(]"', expectedOutput: 'false', isHidden: false },
      { input: '"([)]"', expectedOutput: 'false', isHidden: true },
      { input: '"{[]}"', expectedOutput: 'true', isHidden: true }
    ],
    hints: [
      'Think about which data structure is best for matching pairs.',
      'A stack is perfect for this - last opened should be first closed.',
      'What should you do when you encounter an opening bracket vs a closing bracket?'
    ]
  },
  {
    id: 'merge-intervals',
    title: 'Merge Intervals',
    difficulty: 'medium',
    category: ['array', 'sorting'],
    companyTags: ['Google', 'Amazon', 'Facebook', 'Microsoft'],
    description: `Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.`,
    constraints: `- 1 <= intervals.length <= 10^4
- intervals[i].length == 2
- 0 <= starti <= endi <= 10^4`,
    examples: [
      {
        input: 'intervals = [[1,3],[2,6],[8,10],[15,18]]',
        output: '[[1,6],[8,10],[15,18]]',
        explanation: 'Since intervals [1,3] and [2,6] overlap, merge them into [1,6].'
      },
      {
        input: 'intervals = [[1,4],[4,5]]',
        output: '[[1,5]]',
        explanation: 'Intervals [1,4] and [4,5] are considered overlapping.'
      }
    ],
    starterCode: {
      python: `def merge_intervals(intervals):
    """
    :type intervals: List[List[int]]
    :rtype: List[List[int]]
    """
    # Write your code here
    pass

# Test your solution
if __name__ == "__main__":
    print(merge_intervals([[1,3],[2,6],[8,10],[15,18]]))  # Expected: [[1,6],[8,10],[15,18]]
    print(merge_intervals([[1,4],[4,5]]))  # Expected: [[1,5]]`,
      javascript: `function merge(intervals) {
    // Write your code here
}

// Test your solution
console.log(merge([[1,3],[2,6],[8,10],[15,18]]));  // Expected: [[1,6],[8,10],[15,18]]
console.log(merge([[1,4],[4,5]]));  // Expected: [[1,5]]`
    },
    testCases: [
      { input: '[[1,3],[2,6],[8,10],[15,18]]', expectedOutput: '[[1,6],[8,10],[15,18]]', isHidden: false },
      { input: '[[1,4],[4,5]]', expectedOutput: '[[1,5]]', isHidden: false },
      { input: '[[1,4],[0,4]]', expectedOutput: '[[0,4]]', isHidden: true }
    ],
    hints: [
      'What if you sort the intervals first?',
      'After sorting, can you solve this in a single pass?',
      'Keep track of the current interval being built and check if the next interval overlaps.'
    ]
  },
  {
    id: 'binary-tree-level-order',
    title: 'Binary Tree Level Order Traversal',
    difficulty: 'medium',
    category: ['tree', 'breadth-first-search'],
    companyTags: ['Amazon', 'Microsoft', 'Facebook', 'Apple'],
    description: `Given the root of a binary tree, return the level order traversal of its nodes' values. (i.e., from left to right, level by level).`,
    constraints: `- The number of nodes in the tree is in the range [0, 2000].
- -1000 <= Node.val <= 1000`,
    examples: [
      {
        input: 'root = [3,9,20,null,null,15,7]',
        output: '[[3],[9,20],[15,7]]',
        explanation: ''
      },
      {
        input: 'root = [1]',
        output: '[[1]]',
        explanation: ''
      },
      {
        input: 'root = []',
        output: '[]',
        explanation: ''
      }
    ],
    starterCode: {
      python: `class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def level_order(root):
    """
    :type root: TreeNode
    :rtype: List[List[int]]
    """
    # Write your code here
    pass

# Test your solution
if __name__ == "__main__":
    # Create tree: 3 -> (9, 20) -> (None, None, 15, 7)
    root = TreeNode(3, TreeNode(9), TreeNode(20, TreeNode(15), TreeNode(7)))
    print(level_order(root))  # Expected: [[3], [9, 20], [15, 7]]`,
      javascript: `class TreeNode {
    constructor(val, left = null, right = null) {
        this.val = val;
        this.left = left;
        this.right = right;
    }
}

function levelOrder(root) {
    // Write your code here
}

// Test your solution
const root = new TreeNode(3, new TreeNode(9), new TreeNode(20, new TreeNode(15), new TreeNode(7)));
console.log(levelOrder(root));  // Expected: [[3], [9, 20], [15, 7]]`
    },
    testCases: [
      { input: '[3,9,20,null,null,15,7]', expectedOutput: '[[3],[9,20],[15,7]]', isHidden: false },
      { input: '[1]', expectedOutput: '[[1]]', isHidden: false },
      { input: '[]', expectedOutput: '[]', isHidden: false }
    ],
    hints: [
      'BFS (Breadth-First Search) is perfect for level-order traversal.',
      'Use a queue to keep track of nodes at each level.',
      'Process all nodes at the current level before moving to the next level.'
    ]
  }
];

// Get random problem by difficulty
export function getRandomProblem(difficulty = null) {
  const filteredProblems = difficulty
    ? problems.filter(p => p.difficulty === difficulty)
    : problems;

  return filteredProblems[Math.floor(Math.random() * filteredProblems.length)];
}

// Get problem by ID
export function getProblemById(id) {
  return problems.find(p => p.id === id);
}

// Get problems by category
export function getProblemsByCategory(category) {
  return problems.filter(p => p.category.includes(category));
}

// Get problems by company tag
export function getProblemsByCompany(company) {
  return problems.filter(p => p.companyTags.includes(company));
}

// Get all unique categories
export function getAllCategories() {
  const categories = new Set();
  problems.forEach(p => p.category.forEach(c => categories.add(c)));
  return Array.from(categories).sort();
}

// Get all unique companies
export function getAllCompanies() {
  const companies = new Set();
  problems.forEach(p => p.companyTags.forEach(c => companies.add(c)));
  return Array.from(companies).sort();
}
