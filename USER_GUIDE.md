# AI Mock Interview Platform - User Guide

Welcome to the AI Mock Interview Platform! This guide will help you get the most out of your technical interview practice sessions.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Creating an Account](#creating-an-account)
3. [Understanding Your Dashboard](#understanding-your-dashboard)
4. [Starting an Interview Session](#starting-an-interview-session)
5. [Using the Code Editor](#using-the-code-editor)
6. [Working with the AI Interviewer](#working-with-the-ai-interviewer)
7. [Running Tests](#running-tests)
8. [Viewing Your History](#viewing-your-history)
9. [Managing Your Subscription](#managing-your-subscription)
10. [Tips for Success](#tips-for-success)
11. [Troubleshooting](#troubleshooting)
12. [FAQ](#faq)

---

## Getting Started

### What is AI Mock Interview Platform?

AI Mock Interview Platform is a web-based service that helps you practice technical coding interviews with an AI-powered interviewer. It provides:

- **Real Coding Problems**: 100+ LeetCode-style problems across various difficulty levels
- **AI Interviewer**: GPT-4 powered interviewer that asks questions, provides hints, and gives feedback
- **Code Editor**: VSCode-like editor with syntax highlighting and auto-completion
- **Automated Testing**: Run test cases to validate your solutions
- **Performance Analytics**: Track your progress and identify areas for improvement
- **Session History**: Review past sessions to learn from your mistakes

### System Requirements

- **Browser**: Modern browser (Chrome, Firefox, Safari, Edge)
- **Internet**: Stable internet connection
- **Screen**: Recommended minimum 1366x768 resolution

---

## Creating an Account

### Sign Up Process

1. Visit the homepage
2. Click "Start Free Trial" or "Sign Up"
3. Enter your email and password
4. Verify your email (if required)
5. You're ready to start!

### Free Trial

New users get **3 free interview sessions** to try the platform. No credit card required!

---

## Understanding Your Dashboard

When you log in, you'll see your dashboard with several sections:

### Trial Status Banner

- Shows remaining free sessions (if on trial)
- Displays subscription status
- Quick link to upgrade

### Stats Cards

- **Total Sessions**: Number of interviews you've completed
- **Problems Solved**: Successfully completed problems
- **Average Score**: Your average performance score
- **Success Rate**: Percentage of tests passed

### Recent Activity

- Timeline of your recent interview sessions
- Quick access to resume or review sessions

### Performance Charts

- **Performance Trend**: Your scores over time
- **Category Breakdown**: Performance by problem category (arrays, strings, etc.)
- **Difficulty Distribution**: How you perform on easy/medium/hard problems

---

## Starting an Interview Session

### Step 1: Click "Start New Interview"

From your dashboard, click the "Start New Interview" button.

### Step 2: Select Problem (Coming Soon)

Currently, problems are randomly selected. Future updates will let you choose:
- Difficulty level (Easy, Medium, Hard)
- Category (Arrays, Strings, Trees, etc.)
- Company tags (Google, Facebook, Amazon, etc.)

### Step 3: Interview Session Begins

You'll be taken to the interview interface with:
- **Left Panel**: Problem description
- **Center Panel**: Code editor
- **Right Panel**: AI chat interface
- **Bottom Panel**: Terminal and test cases

---

## Using the Code Editor

### Features

**Syntax Highlighting**
- Code is colored for better readability
- Supports multiple languages

**Auto-Completion**
- Press `Ctrl+Space` for suggestions
- Tab to accept suggestions

**Line Numbers**
- Easy reference for discussing code
- Jump to specific lines

**Keyboard Shortcuts**
- `Ctrl+/`: Toggle comment
- `Ctrl+Z`: Undo
- `Ctrl+Y`: Redo
- `Ctrl+F`: Find
- `Ctrl+H`: Find and replace
- `Ctrl+S`: Auto-save (happens automatically)

### Language Selection

Click the language dropdown in the top bar to switch between:
- Python (default)
- JavaScript
- Java (coming soon)

**Note**: Switching languages will reset your code to the starter template for that language.

---

## Working with the AI Interviewer

### What the AI Can Do

**Answer Questions**
- Ask clarifying questions about the problem
- Request hints when stuck
- Discuss approach and complexity

**Provide Hints**
- Type "Can you give me a hint?" to get help
- Hints are progressive - start small, get more detailed

**Give Feedback**
- Discuss your solution
- Suggest optimizations
- Explain concepts

### Best Practices

**DO:**
- Explain your thought process out loud (type it in chat)
- Ask for clarification if the problem is unclear
- Request hints if stuck for more than 5 minutes
- Discuss time and space complexity

**DON'T:**
- Ask for the complete solution immediately
- Copy-paste code without understanding
- Rush without planning your approach

### Example Interactions

**Good:**
```
You: "I'm thinking of using a hash map to track the elements. Would that work for this problem?"
AI: "Yes, that's a great approach! A hash map would help you achieve O(1) lookup time..."
```

**When Stuck:**
```
You: "I'm having trouble with the edge case where the array is empty. Could you give me a hint?"
AI: "Good question! Consider what the expected output should be when there are no elements..."
```

---

## Running Tests

### Manual Test Run

1. Click the "▶️ Run Code" button to execute your code
2. See output in the Terminal panel
3. Check for errors or unexpected output

### Running Test Cases

1. Click the "Test Cases" tab in the bottom panel
2. Review the visible test cases
3. Click "Run Tests" button
4. See results:
   - ✅ Green: Passed
   - ❌ Red: Failed
   - Test details show expected vs actual output

### Understanding Test Results

**Passed All Tests** ✅
- Your solution is correct!
- Consider optimizing for better time/space complexity

**Some Tests Failed** ⚠️
- Check the failed test case details
- Look for edge cases you might have missed
- Common issues:
  - Off-by-one errors
  - Empty array/string handling
  - Negative number handling
  - Large input handling

**All Tests Failed** ❌
- Review your logic
- Ask the AI for a hint
- Check if you understood the problem correctly

### Hidden Test Cases

Some test cases are hidden to simulate real interviews. Your solution must handle these edge cases:
- Empty inputs
- Single element
- Very large inputs
- Negative numbers
- Special characters
- Duplicate elements

---

## Viewing Your History

### Accessing History

1. Click "History" in the navigation menu
2. See all your past interview sessions

### History Page Features

**Search**
- Search by problem name
- Search by session ID

**Filters**
- All Sessions
- Completed
- In Progress

**Sort**
- Newest First (default)
- Oldest First
- Highest Score

**Stats Summary**
- Total sessions
- Completed count
- In progress count
- Average score

### Viewing Session Details

Click "View Details" on any session to see:

**Overview Tab**
- Session stats (duration, tests passed, score)
- Session information
- Quick summary

**Code Tab**
- Your final code solution
- Copy/export functionality

**Tests Tab**
- All test results
- Passed/failed breakdown
- Error messages for failed tests

**Chat Tab**
- Complete chat history with AI
- Replay the conversation
- Learn from hints given

**Metrics Tab**
- Performance scores breakdown
- Code quality metrics
- Problem-solving approach
- Communication effectiveness

---

## Managing Your Subscription

### Trial Plan (Free)

**Includes:**
- 3 free interview sessions
- Access to all problems
- AI interviewer chat
- Test case validation
- Basic analytics

**Limitations:**
- Limited to 3 total sessions
- No session history after trial

### Monthly Plan ($20/month)

**Includes:**
- Unlimited interview sessions
- Full session history
- Advanced analytics
- Priority AI responses
- All future features

**Cancel Anytime**
- No long-term commitment
- Prorated refund if applicable

### Annual Plan ($200/year)

**Includes:**
- Everything in Monthly Plan
- **Save $40** (2 months free!)
- Annual billing

**Best Value**
- 17% savings
- Lock in price for a year

### How to Upgrade

1. Click "Upgrade" on the trial banner
2. Or navigate to "Subscription" in menu
3. Choose your plan
4. Enter payment details
5. Start practicing immediately!

### Managing Subscription

**View Current Plan:**
- Go to Subscription page
- See plan status, renewal date

**Update Payment Method:**
- Click "Manage Subscription"
- Opens Stripe customer portal
- Update card, billing address

**Cancel Subscription:**
- Click "Manage Subscription"
- Select "Cancel Subscription"
- Access continues until period end
- No further charges

---

## Tips for Success

### Preparation

**Before Starting:**
1. Find a quiet environment
2. Have water nearby
3. Clear 45-60 minutes for focused practice
4. Review problem-solving patterns

### During the Interview

**Read Carefully:**
- Understand the problem completely
- Note constraints and edge cases
- Ask clarifying questions

**Plan First:**
- Don't jump straight to coding
- Discuss approach with AI
- Consider time and space complexity

**Think Out Loud:**
- Explain your reasoning
- Discuss trade-offs
- Communicate clearly

**Test Incrementally:**
- Test after writing key logic
- Fix errors as you go
- Don't wait until the end

**Handle Hints Wisely:**
- Try solving for 5-10 minutes first
- Ask specific questions
- Learn from the hints

### After the Session

**Review:**
- Look at the session details
- Identify mistakes
- Learn alternative approaches

**Practice Regularly:**
- Consistency is key
- Aim for 3-4 sessions per week
- Track your improvement

**Focus on Weak Areas:**
- Check category performance
- Practice problem types you struggle with
- Review concepts you're unsure about

---

## Troubleshooting

### Common Issues

**Problem: Code doesn't run**
- Check for syntax errors (highlighted in red)
- Ensure you have the correct language selected
- Try refreshing the page

**Problem: Tests keep failing**
- Verify you're reading the problem correctly
- Check edge cases (empty, single element, duplicates)
- Ask AI for a hint on the specific test case

**Problem: AI not responding**
- Check your internet connection
- Refresh the page
- If problem persists, contact support

**Problem: Session won't start**
- Verify you have sessions remaining (if on trial)
- Check internet connection
- Try logging out and back in
- Clear browser cache

**Problem: Can't upgrade subscription**
- Ensure pop-ups are allowed
- Try a different browser
- Check if payment method is valid
- Contact support for assistance

### Error Messages

**"Out of trial sessions"**
- You've used all 3 free sessions
- Upgrade to continue practicing

**"Network error"**
- Check internet connection
- Refresh the page
- Try again in a few minutes

**"Payment failed"**
- Verify card details
- Check with your bank
- Try a different payment method

**"Session timed out"**
- Session automatically saved
- Resume from history
- Or start a new session

---

## FAQ

### General

**Q: How many problems are available?**
A: Currently 30+ problems, growing to 100+ soon. Problems cover easy, medium, and hard difficulties across various categories.

**Q: What programming languages are supported?**
A: Currently Python and JavaScript. Java, C++, and Go coming soon!

**Q: Can I use the platform on mobile?**
A: The platform is optimized for desktop. Mobile support coming soon.

**Q: Is my code saved automatically?**
A: Yes! Code is auto-saved every few seconds and when you end the session.

### Interviews

**Q: How long does an interview session last?**
A: Sessions typically last 30-60 minutes, but there's no time limit.

**Q: Can I pause an interview?**
A: You can end the session and your progress will be saved. Resume anytime from history.

**Q: Do I need to solve the problem completely?**
A: Not required! The goal is to practice. Even partial solutions provide valuable learning.

**Q: Can I retry a problem?**
A: Yes! Start a new session and you might get the same problem again. Or view it in history.

### Subscription & Billing

**Q: When does my trial start?**
A: Trial starts when you create your account.

**Q: What happens after trial ends?**
A: You'll need to subscribe to continue. No auto-charge - you choose when to upgrade.

**Q: Can I switch from monthly to annual?**
A: Yes! Contact support or manage in Stripe customer portal.

**Q: Do you offer refunds?**
A: Yes, within 14 days of purchase if unsatisfied. Contact support.

**Q: Can I get an invoice?**
A: Yes! Invoices are sent via email and available in customer portal.

### Privacy & Security

**Q: Is my code private?**
A: Yes! Your code is only visible to you and stored securely.

**Q: Do you use my code for training?**
A: No. Your code is private and not used for any training purposes.

**Q: How is my payment info secured?**
A: We use Stripe for payment processing. We never store your credit card details.

**Q: Can I delete my account?**
A: Yes. Contact support to request account deletion.

---

## Getting Help

### Support Channels

**Email**: support@example.com

**Response Time**: Within 24 hours

**Include in Request:**
- Your email address
- Description of the issue
- Screenshots (if applicable)
- Browser and OS version

### Feedback

We love hearing from users!

**Feature Requests**: feature-requests@example.com

**Bug Reports**: bugs@example.com

**General Feedback**: feedback@example.com

---

## What's Next?

Now that you know how to use the platform, start practicing!

1. **Complete your first interview session**
2. **Review the feedback**
3. **Try again and beat your score**
4. **Track your progress**
5. **Master technical interviews!**

Good luck with your interview preparation! 🚀

---

**Version**: 1.0.0
**Last Updated**: November 18, 2025

For more information, visit our website or contact support.
