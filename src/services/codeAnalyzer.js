/**
 * Code Static Analysis Tool
 *
 * Analyzes code to detect patterns, potential issues, and provide insights
 * that help the AI interviewer understand the candidate's progress.
 */

/**
 * Comprehensive code analysis
 */
export class CodeAnalyzer {
  constructor(code, language = 'python') {
    this.code = code || '';
    this.language = language;
    this.lines = this.code.split('\n');
  }

  /**
   * Perform full analysis
   */
  analyze() {
    return {
      basic: this.getBasicMetrics(),
      structure: this.analyzeStructure(),
      complexity: this.estimateComplexity(),
      quality: this.assessQuality(),
      patterns: this.detectPatterns(),
      issues: this.detectIssues(),
      progress: this.estimateProgress()
    };
  }

  /**
   * Basic metrics
   */
  getBasicMetrics() {
    const nonEmptyLines = this.lines.filter(line => line.trim().length > 0);
    const commentLines = this.lines.filter(line => {
      const trimmed = line.trim();
      return trimmed.startsWith('#') || trimmed.startsWith('//') || trimmed.startsWith('/*');
    });

    return {
      totalLines: this.lines.length,
      nonEmptyLines: nonEmptyLines.length,
      commentLines: commentLines.length,
      codeLines: nonEmptyLines.length - commentLines.length,
      averageLineLength: nonEmptyLines.reduce((sum, line) => sum + line.length, 0) / (nonEmptyLines.length || 1),
      hasCode: this.code.trim().length > 0
    };
  }

  /**
   * Analyze code structure
   */
  analyzeStructure() {
    const patterns = {
      python: {
        function: /def\s+\w+\s*\(/g,
        class: /class\s+\w+/g,
        loop: /for\s+\w+\s+in\s+|while\s+/g,
        conditional: /if\s+|elif\s+|else:/g,
        import: /import\s+|from\s+\w+\s+import/g,
        listComp: /\[.*for.*in.*\]/g,
        dictComp: /\{.*for.*in.*\}/g,
        lambda: /lambda\s+/g,
        tryExcept: /try:|except/g,
        return: /return\s+/g
      },
      javascript: {
        function: /function\s+\w+\s*\(|=>\s*\{|const\s+\w+\s*=\s*\(/g,
        class: /class\s+\w+/g,
        loop: /for\s*\(|while\s*\(|\.forEach|\.map|\.filter/g,
        conditional: /if\s*\(|else\s+if|else\s*\{/g,
        import: /import\s+.*from|require\s*\(/g,
        arrow: /=>/g,
        asyncAwait: /async\s+|await\s+/g,
        promise: /\.then\(|\.catch\(|new\s+Promise/g,
        return: /return\s+/g
      },
      java: {
        function: /(public|private|protected)\s+\w+\s+\w+\s*\(/g,
        class: /class\s+\w+/g,
        loop: /for\s*\(|while\s*\(/g,
        conditional: /if\s*\(|else\s+if|else\s*\{/g,
        import: /import\s+/g,
        return: /return\s+/g
      }
    };

    const langPatterns = patterns[this.language] || patterns.python;
    const structure = {};

    for (const [key, pattern] of Object.entries(langPatterns)) {
      const matches = this.code.match(pattern);
      structure[key + 'Count'] = matches ? matches.length : 0;
    }

    return structure;
  }

  /**
   * Estimate time/space complexity
   */
  estimateComplexity() {
    const nestedLoops = this.detectNestedLoops();
    const hasRecursion = this.detectRecursion();
    const dataStructures = this.detectDataStructures();

    let timeComplexity = 'O(1)';
    let spaceComplexity = 'O(1)';

    // Estimate time complexity
    if (hasRecursion) {
      timeComplexity = 'O(2^n) or recursive';
    } else if (nestedLoops >= 3) {
      timeComplexity = 'O(n³) or higher';
    } else if (nestedLoops === 2) {
      timeComplexity = 'O(n²)';
    } else if (nestedLoops === 1) {
      timeComplexity = 'O(n)';
    } else if (this.code.includes('.sort(') || this.code.includes('sorted(')) {
      timeComplexity = 'O(n log n)';
    }

    // Estimate space complexity
    if (dataStructures.hasDict || dataStructures.hasSet || dataStructures.hasArray) {
      spaceComplexity = 'O(n)';
    }
    if (hasRecursion) {
      spaceComplexity = 'O(n) - recursion stack';
    }

    return {
      timeComplexity,
      spaceComplexity,
      nestedLoopDepth: nestedLoops,
      hasRecursion,
      dataStructures
    };
  }

  /**
   * Assess code quality
   */
  assessQuality() {
    const metrics = this.getBasicMetrics();
    const structure = this.analyzeStructure();

    const hasComments = metrics.commentLines > 0;
    const hasFunctions = structure.functionCount > 0;
    const hasProperNaming = this.checkNamingConventions();
    const hasErrorHandling = structure.tryExceptCount > 0 || this.code.includes('catch');
    const hasInputValidation = this.code.includes('if not') || this.code.includes('if !');

    let score = 0;
    const maxScore = 100;

    // Scoring factors
    if (hasFunctions) score += 20;
    if (hasComments) score += 15;
    if (hasProperNaming) score += 15;
    if (hasErrorHandling) score += 10;
    if (hasInputValidation) score += 10;
    if (metrics.codeLines > 10) score += 10;
    if (structure.returnCount > 0) score += 10;
    if (metrics.averageLineLength < 100) score += 10; // Not too long lines

    return {
      score: Math.min(score, maxScore),
      hasFunctions,
      hasComments,
      hasProperNaming,
      hasErrorHandling,
      hasInputValidation,
      readability: this.assessReadability()
    };
  }

  /**
   * Detect coding patterns
   */
  detectPatterns() {
    return {
      usesTwoPointers: this.detectTwoPointers(),
      usesSlidingWindow: this.detectSlidingWindow(),
      usesDynamicProgramming: this.detectDynamicProgramming(),
      usesBinarySearch: this.detectBinarySearch(),
      usesRecursion: this.detectRecursion(),
      usesDivideAndConquer: this.detectDivideAndConquer(),
      usesGreedy: this.detectGreedy(),
      usesBacktracking: this.detectBacktracking(),
      usesHashMap: this.detectDataStructures().hasDict,
      usesStack: this.code.includes('.append(') && this.code.includes('.pop('),
      usesQueue: this.code.includes('deque') || this.code.includes('Queue'),
      usesBFS: this.code.includes('queue') || this.code.includes('deque'),
      usesDFS: this.detectRecursion() || this.code.includes('stack')
    };
  }

  /**
   * Detect potential issues
   */
  detectIssues() {
    const issues = [];

    // Common issues
    if (this.code.includes('while True') && !this.code.includes('break')) {
      issues.push({
        type: 'infinite_loop',
        severity: 'high',
        message: 'Potential infinite loop detected - missing break statement'
      });
    }

    if (!this.code.includes('return') && this.getBasicMetrics().codeLines > 5) {
      issues.push({
        type: 'missing_return',
        severity: 'medium',
        message: 'No return statement found - function may not return a value'
      });
    }

    if (this.detectNestedLoops() >= 3) {
      issues.push({
        type: 'high_complexity',
        severity: 'medium',
        message: 'High time complexity (O(n³) or higher) - consider optimization'
      });
    }

    const undefinedVars = this.detectUndefinedVariables();
    if (undefinedVars.length > 0) {
      issues.push({
        type: 'undefined_variable',
        severity: 'high',
        message: `Potentially undefined variables: ${undefinedVars.join(', ')}`
      });
    }

    if (this.code.length > 0 && !this.code.includes('def ') && !this.code.includes('function ')) {
      issues.push({
        type: 'no_function',
        severity: 'low',
        message: 'Code not wrapped in a function - consider using functions'
      });
    }

    return issues;
  }

  /**
   * Estimate completion progress (0-100%)
   */
  estimateProgress() {
    const metrics = this.getBasicMetrics();
    const structure = this.analyzeStructure();

    if (!metrics.hasCode) return 0;

    let progress = 0;

    // Has started coding
    if (metrics.codeLines > 0) progress += 10;

    // Has function definition
    if (structure.functionCount > 0) progress += 20;

    // Has logic (loops or conditionals)
    if (structure.loopCount > 0 || structure.conditionalCount > 0) progress += 20;

    // Has return statement
    if (structure.returnCount > 0) progress += 20;

    // Has reasonable amount of code
    if (metrics.codeLines >= 10) progress += 15;
    if (metrics.codeLines >= 20) progress += 10;

    // Has comments or documentation
    if (metrics.commentLines > 0) progress += 5;

    return Math.min(progress, 100);
  }

  // Helper methods

  detectNestedLoops() {
    let maxDepth = 0;
    let currentDepth = 0;

    for (const line of this.lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('for ') || trimmed.startsWith('while ')) {
        currentDepth++;
        maxDepth = Math.max(maxDepth, currentDepth);
      }
      // Rough heuristic: dedent indicates loop end
      if (currentDepth > 0 && line.length > 0 && line[0] !== ' ' && line[0] !== '\t') {
        currentDepth = 0;
      }
    }

    return maxDepth;
  }

  detectRecursion() {
    // Look for function calling itself
    const funcNames = [];
    const funcPattern = /def\s+(\w+)\s*\(|function\s+(\w+)\s*\(/g;
    let match;

    while ((match = funcPattern.exec(this.code)) !== null) {
      funcNames.push(match[1] || match[2]);
    }

    for (const funcName of funcNames) {
      const funcBody = this.extractFunctionBody(funcName);
      if (funcBody && funcBody.includes(funcName + '(')) {
        return true;
      }
    }

    return false;
  }

  extractFunctionBody(funcName) {
    const lines = this.code.split('\n');
    let inFunction = false;
    let body = '';
    const funcPattern = new RegExp(`(def|function)\\s+${funcName}\\s*\\(`);

    for (const line of lines) {
      if (funcPattern.test(line)) {
        inFunction = true;
        continue;
      }
      if (inFunction) {
        if (line.trim().startsWith('def ') || line.trim().startsWith('function ')) {
          break; // Next function
        }
        body += line + '\n';
      }
    }

    return body;
  }

  detectDataStructures() {
    return {
      hasArray: this.code.includes('[') && this.code.includes(']'),
      hasDict: this.code.includes('{') || this.code.includes('Map(') || this.code.includes('HashMap'),
      hasSet: this.code.includes('set(') || this.code.includes('Set(') || this.code.includes('HashSet'),
      hasLinkedList: this.code.includes('ListNode') || this.code.includes('LinkedList'),
      hasTree: this.code.includes('TreeNode') || this.code.includes('Tree'),
      hasGraph: this.code.includes('graph') || this.code.includes('Graph'),
      hasHeap: this.code.includes('heapq') || this.code.includes('PriorityQueue')
    };
  }

  detectTwoPointers() {
    const twoPointerKeywords = ['left', 'right', 'start', 'end', 'i', 'j'];
    let count = 0;
    for (const keyword of twoPointerKeywords) {
      if (this.code.includes(keyword)) count++;
    }
    return count >= 2;
  }

  detectSlidingWindow() {
    return (this.code.includes('window') || this.code.includes('start') && this.code.includes('end')) &&
           this.code.includes('while');
  }

  detectDynamicProgramming() {
    return this.code.includes('dp') || this.code.includes('memo') || this.code.includes('cache');
  }

  detectBinarySearch() {
    return (this.code.includes('mid') || this.code.includes('middle')) &&
           (this.code.includes('left') && this.code.includes('right')) &&
           this.code.includes('while');
  }

  detectDivideAndConquer() {
    return this.detectRecursion() &&
           (this.code.includes('mid') || this.code.includes('merge'));
  }

  detectGreedy() {
    return (this.code.includes('max(') || this.code.includes('min(')) &&
           (this.code.includes('for ') || this.code.includes('while '));
  }

  detectBacktracking() {
    return this.detectRecursion() &&
           (this.code.includes('backtrack') || this.code.includes('dfs')) &&
           (this.code.includes('append') && this.code.includes('pop'));
  }

  checkNamingConventions() {
    // Check if variable names are descriptive (not single letters except i, j, k in loops)
    const varPattern = /(\w+)\s*=/g;
    let match;
    let goodNames = 0;
    let totalNames = 0;

    while ((match = varPattern.exec(this.code)) !== null) {
      const varName = match[1];
      totalNames++;
      if (varName.length > 1 || ['i', 'j', 'k', 'n', 'm'].includes(varName)) {
        goodNames++;
      }
    }

    return totalNames === 0 ? true : (goodNames / totalNames) > 0.7;
  }

  assessReadability() {
    const metrics = this.getBasicMetrics();
    const hasComments = metrics.commentLines > 0;
    const goodLineLength = metrics.averageLineLength < 100;
    const hasWhitespace = this.lines.filter(line => line.trim() === '').length > 0;

    let score = 0;
    if (hasComments) score += 33;
    if (goodLineLength) score += 33;
    if (hasWhitespace) score += 34;

    return {
      score,
      hasComments,
      goodLineLength,
      hasWhitespace
    };
  }

  detectUndefinedVariables() {
    // Simple heuristic: look for variables used before assignment
    // This is not foolproof but catches obvious cases
    const defined = new Set();
    const used = new Set();
    const undefined = [];

    for (const line of this.lines) {
      const trimmed = line.trim();

      // Variables being assigned
      const assignPattern = /(\w+)\s*=/;
      const assignMatch = trimmed.match(assignPattern);
      if (assignMatch) {
        defined.add(assignMatch[1]);
      }

      // Variables being used (rough heuristic)
      const words = trimmed.match(/\b\w+\b/g) || [];
      for (const word of words) {
        if (!defined.has(word) &&
            !['if', 'for', 'while', 'def', 'class', 'return', 'in', 'and', 'or', 'not'].includes(word)) {
          used.add(word);
        }
      }
    }

    for (const variable of used) {
      if (!defined.has(variable) && variable.length > 1) {
        undefined.push(variable);
      }
    }

    return undefined.slice(0, 5); // Return max 5
  }
}

/**
 * Quick analysis function
 */
export function analyzeCode(code, language = 'python') {
  const analyzer = new CodeAnalyzer(code, language);
  return analyzer.analyze();
}

/**
 * Check if candidate is stuck (based on code progress)
 */
export function isCandidateStuck(code, timeSinceLastChange) {
  const analyzer = new CodeAnalyzer(code);
  const progress = analyzer.estimateProgress();
  const threeMinutes = 3 * 60 * 1000;

  // Stuck if:
  // 1. No progress for 3+ minutes
  // 2. OR very low progress (< 20%) after 5+ minutes
  return (timeSinceLastChange > threeMinutes && progress < 50) ||
         (timeSinceLastChange > 5 * 60 * 1000 && progress < 20);
}

export default {
  CodeAnalyzer,
  analyzeCode,
  isCandidateStuck
};
