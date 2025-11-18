/**
 * AI Feedback Parser
 *
 * Parses and structures AI-generated feedback into a consistent format
 */

/**
 * Parse AI feedback response into structured data
 */
export function parseFeedback(aiResponse) {
  try {
    // Try parsing as JSON first
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return normalizeFeedback(parsed);
    }
  } catch (e) {
    // Not JSON, parse as text
  }

  // Parse as structured text
  return parseTextFeedback(aiResponse);
}

/**
 * Normalize feedback object to standard format
 */
function normalizeFeedback(feedback) {
  return {
    score: normalizeScore(feedback.score),
    strengths: normalizeArray(feedback.strengths || feedback.positives || []),
    improvements: normalizeArray(feedback.improvements || feedback.areas_for_improvement || feedback.weaknesses || []),
    overallFeedback: feedback.overallFeedback || feedback.overall || feedback.summary || '',
    technicalAssessment: feedback.technicalAssessment || extractTechnicalAssessment(feedback),
    categories: categorizeFeedback(feedback)
  };
}

/**
 * Parse text feedback when JSON parsing fails
 */
function parseTextFeedback(text) {
  const sections = {
    score: extractScore(text),
    strengths: extractBulletPoints(text, ['strength', 'positive', 'good', 'well done']),
    improvements: extractBulletPoints(text, ['improve', 'consider', 'could', 'should', 'weakness']),
    overallFeedback: extractOverall(text),
    technicalAssessment: extractTechnicalFromText(text)
  };

  return {
    ...sections,
    categories: categorizeFeedback(sections)
  };
}

/**
 * Extract score from text (0-100)
 */
function extractScore(text) {
  // Look for patterns like "Score: 85" or "85/100" or "8.5/10"
  const patterns = [
    /score[:\s]+(\d+)/i,
    /(\d+)\s*\/\s*100/,
    /(\d+\.?\d*)\s*\/\s*10/,
    /rating[:\s]+(\d+)/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let score = parseFloat(match[1]);
      // Normalize to 0-100
      if (score <= 10) {
        score = score * 10;
      }
      return Math.min(100, Math.max(0, Math.round(score)));
    }
  }

  // Default score based on overall sentiment
  return estimateScoreFromSentiment(text);
}

/**
 * Extract bullet points based on keywords
 */
function extractBulletPoints(text, keywords) {
  const points = [];
  const lines = text.split('\n');

  let inSection = false;
  let sectionKeyword = null;

  for (const line of lines) {
    const lowerLine = line.toLowerCase();

    // Check if this line contains a section keyword
    const hasKeyword = keywords.some(kw => lowerLine.includes(kw));
    if (hasKeyword && (line.includes(':') || line.startsWith('#'))) {
      inSection = true;
      sectionKeyword = keywords.find(kw => lowerLine.includes(kw));
      continue;
    }

    // Extract bullet points
    if (inSection) {
      const trimmed = line.trim();
      if (trimmed.match(/^[-*•]\s+/) || trimmed.match(/^\d+\.\s+/)) {
        const point = trimmed.replace(/^[-*•]\s+/, '').replace(/^\d+\.\s+/, '').trim();
        if (point.length > 0) {
          points.push(point);
        }
      } else if (trimmed.length === 0 || trimmed.startsWith('#')) {
        inSection = false;
      }
    }
  }

  return points.length > 0 ? points : extractGenericPoints(text, keywords);
}

/**
 * Extract points even without bullet formatting
 */
function extractGenericPoints(text, keywords) {
  const sentences = text.split(/[.!?]+/);
  const points = [];

  for (const sentence of sentences) {
    const lowerSentence = sentence.toLowerCase();
    if (keywords.some(kw => lowerSentence.includes(kw))) {
      const cleaned = sentence.trim();
      if (cleaned.length > 20 && cleaned.length < 200) {
        points.push(cleaned);
      }
    }
  }

  return points.slice(0, 5);
}

/**
 * Extract overall feedback summary
 */
function extractOverall(text) {
  // Look for "Overall" or "Summary" section
  const overallPattern = /(overall|summary|in conclusion)[:\s]+([^#]+)/i;
  const match = text.match(overallPattern);

  if (match) {
    return match[2].trim();
  }

  // Return first paragraph if no specific section found
  const paragraphs = text.split('\n\n').filter(p => p.trim().length > 50);
  return paragraphs[0] || text.substring(0, 500);
}

/**
 * Extract technical assessment details
 */
function extractTechnicalFromText(text) {
  return {
    timeComplexity: extractComplexity(text, 'time'),
    spaceComplexity: extractComplexity(text, 'space'),
    correctness: extractSentiment(text, ['correct', 'works', 'passes']),
    codeQuality: extractSentiment(text, ['quality', 'readable', 'clean'])
  };
}

/**
 * Extract complexity notation (O(...))
 */
function extractComplexity(text, type) {
  const pattern = new RegExp(`${type}[\\s\\w]*complexity[:\\s]+([Oo]\\([^)]+\\))`, 'i');
  const match = text.match(pattern);
  return match ? match[1] : 'Not assessed';
}

/**
 * Extract sentiment for a topic
 */
function extractSentiment(text, keywords) {
  const lowerText = text.toLowerCase();
  const hasPositive = keywords.some(kw => lowerText.includes(kw));

  if (hasPositive) {
    if (lowerText.includes('excellent') || lowerText.includes('great')) {
      return 'Excellent';
    } else if (lowerText.includes('good')) {
      return 'Good';
    } else {
      return 'Satisfactory';
    }
  }

  return 'Needs improvement';
}

/**
 * Estimate score based on sentiment analysis
 */
function estimateScoreFromSentiment(text) {
  const lowerText = text.toLowerCase();

  const positiveWords = ['excellent', 'outstanding', 'great', 'strong', 'well done'];
  const goodWords = ['good', 'solid', 'decent', 'acceptable'];
  const negativeWords = ['poor', 'weak', 'needs work', 'insufficient'];

  const positiveCount = positiveWords.filter(w => lowerText.includes(w)).length;
  const goodCount = goodWords.filter(w => lowerText.includes(w)).length;
  const negativeCount = negativeWords.filter(w => lowerText.includes(w)).length;

  if (positiveCount >= 2) return 90;
  if (positiveCount >= 1) return 80;
  if (goodCount >= 2) return 70;
  if (goodCount >= 1) return 65;
  if (negativeCount >= 2) return 50;
  if (negativeCount >= 1) return 55;

  return 70; // Default
}

/**
 * Categorize feedback into different aspects
 */
function categorizeFeedback(feedback) {
  const categories = {
    problemSolving: 0,
    codeQuality: 0,
    communication: 0,
    testing: 0,
    complexity: 0
  };

  const strengthsText = (feedback.strengths || []).join(' ').toLowerCase();
  const improvementsText = (feedback.improvements || []).join(' ').toLowerCase();
  const allText = strengthsText + ' ' + improvementsText + ' ' + (feedback.overallFeedback || '').toLowerCase();

  // Problem solving
  if (allText.includes('approach') || allText.includes('solution') || allText.includes('algorithm')) {
    categories.problemSolving = calculateCategoryScore(allText, ['approach', 'solution', 'algorithm']);
  }

  // Code quality
  if (allText.includes('clean') || allText.includes('readable') || allText.includes('organized')) {
    categories.codeQuality = calculateCategoryScore(allText, ['clean', 'readable', 'organized', 'comments']);
  }

  // Communication
  if (allText.includes('communication') || allText.includes('explain') || allText.includes('clarif')) {
    categories.communication = calculateCategoryScore(allText, ['communication', 'explain', 'clarif', 'question']);
  }

  // Testing
  if (allText.includes('test') || allText.includes('edge case')) {
    categories.testing = calculateCategoryScore(allText, ['test', 'edge case', 'validation']);
  }

  // Complexity
  if (allText.includes('complexity') || allText.includes('efficient') || allText.includes('optimize')) {
    categories.complexity = calculateCategoryScore(allText, ['complexity', 'efficient', 'optimize', 'O(']);
  }

  return categories;
}

/**
 * Calculate score for a category based on positive/negative mentions
 */
function calculateCategoryScore(text, keywords) {
  const positiveContext = ['good', 'excellent', 'strong', 'great', 'well'];
  const negativeContext = ['weak', 'poor', 'needs', 'improve', 'could'];

  let score = 70; // Base score

  keywords.forEach(keyword => {
    const regex = new RegExp(`\\b(\\w+)\\s+${keyword}`, 'gi');
    const matches = text.match(regex) || [];

    matches.forEach(match => {
      const lowerMatch = match.toLowerCase();
      if (positiveContext.some(pc => lowerMatch.includes(pc))) {
        score += 5;
      } else if (negativeContext.some(nc => lowerMatch.includes(nc))) {
        score -= 5;
      }
    });
  });

  return Math.min(100, Math.max(0, score));
}

/**
 * Normalize score to 0-100 range
 */
function normalizeScore(score) {
  if (typeof score !== 'number') {
    score = parseFloat(score);
  }

  if (isNaN(score)) {
    return 70; // Default
  }

  // If score is 0-10 scale, convert to 0-100
  if (score <= 10) {
    score = score * 10;
  }

  return Math.min(100, Math.max(0, Math.round(score)));
}

/**
 * Normalize array values
 */
function normalizeArray(arr) {
  if (!Array.isArray(arr)) {
    return [];
  }

  return arr
    .filter(item => typeof item === 'string' && item.trim().length > 0)
    .map(item => item.trim())
    .slice(0, 10); // Max 10 items
}

/**
 * Extract technical assessment from feedback object
 */
function extractTechnicalAssessment(feedback) {
  return {
    timeComplexity: feedback.timeComplexity || feedback.time_complexity || 'Not assessed',
    spaceComplexity: feedback.spaceComplexity || feedback.space_complexity || 'Not assessed',
    correctness: feedback.correctness || 'Not assessed',
    codeQuality: feedback.codeQuality || feedback.code_quality || 'Not assessed'
  };
}

/**
 * Generate summary statistics from feedback
 */
export function generateFeedbackStats(feedback) {
  return {
    score: feedback.score,
    strengthCount: (feedback.strengths || []).length,
    improvementCount: (feedback.improvements || []).length,
    overallLength: (feedback.overallFeedback || '').length,
    categories: feedback.categories,
    hasComplexityAnalysis: !!(feedback.technicalAssessment?.timeComplexity && feedback.technicalAssessment.timeComplexity !== 'Not assessed'),
    timestamp: Date.now()
  };
}

/**
 * Format feedback for display
 */
export function formatFeedbackForDisplay(feedback) {
  return `
**Score: ${feedback.score}/100**

**Strengths:**
${(feedback.strengths || []).map((s, i) => `${i + 1}. ${s}`).join('\n')}

**Areas for Improvement:**
${(feedback.improvements || []).map((i, idx) => `${idx + 1}. ${i}`).join('\n')}

**Technical Assessment:**
- Time Complexity: ${feedback.technicalAssessment?.timeComplexity || 'N/A'}
- Space Complexity: ${feedback.technicalAssessment?.spaceComplexity || 'N/A'}
- Correctness: ${feedback.technicalAssessment?.correctness || 'N/A'}
- Code Quality: ${feedback.technicalAssessment?.codeQuality || 'N/A'}

**Overall Feedback:**
${feedback.overallFeedback}
  `.trim();
}

export default {
  parseFeedback,
  generateFeedbackStats,
  formatFeedbackForDisplay
};
