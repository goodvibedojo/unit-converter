# Deployment Guide - AI Mock Interview Platform

This guide covers the complete deployment process for the AI Mock Interview Platform, including frontend hosting, backend functions, and database configuration.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Firebase Setup](#firebase-setup)
4. [Stripe Configuration](#stripe-configuration)
5. [Database Setup](#database-setup)
6. [Frontend Deployment](#frontend-deployment)
7. [Backend Functions Deployment](#backend-functions-deployment)
8. [Post-Deployment Verification](#post-deployment-verification)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:

- Node.js 18+ installed
- npm or yarn package manager
- Firebase CLI installed (`npm install -g firebase-tools`)
- A Firebase project created
- A Stripe account (for payments)
- An OpenAI API key (for AI interviewer)

---

## Environment Setup

### 1. Clone and Install Dependencies

```bash
# Clone repository
git clone <your-repo-url>
cd unit-converter

# Install frontend dependencies
npm install

# Install functions dependencies
cd functions
npm install
cd ..
```

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` and fill in your credentials:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Stripe Configuration
VITE_STRIPE_PUBLIC_KEY=pk_live_xxxx
VITE_STRIPE_PRICE_MONTHLY=price_xxxx
VITE_STRIPE_PRICE_ANNUAL=price_xxxx

# OpenAI Configuration
VITE_OPENAI_API_KEY=sk-xxxx

# Application Configuration
VITE_APP_URL=https://your-domain.com
```

### 3. Configure Firebase Functions Environment

```bash
cd functions

# Set Stripe secret key
firebase functions:config:set stripe.secret_key="sk_live_xxxx"

# Set Stripe webhook secret
firebase functions:config:set stripe.webhook_secret="whsec_xxxx"

# Set OpenAI API key
firebase functions:config:set openai.api_key="sk-xxxx"

cd ..
```

---

## Firebase Setup

### 1. Login to Firebase

```bash
firebase login
```

### 2. Initialize Firebase Project

```bash
# If not already initialized
firebase init

# Select:
# - Hosting
# - Functions
# - Firestore
```

### 3. Update `.firebaserc`

```json
{
  "projects": {
    "default": "your-project-id"
  }
}
```

### 4. Deploy Firestore Rules and Indexes

```bash
# Deploy security rules
firebase deploy --only firestore:rules

# Deploy indexes
firebase deploy --only firestore:indexes
```

---

## Stripe Configuration

### 1. Create Products in Stripe Dashboard

Navigate to Stripe Dashboard > Products and create:

**Monthly Subscription**
- Name: "AI Mock Interview - Monthly"
- Price: $20/month
- Recurring: Monthly
- Copy the Price ID to `VITE_STRIPE_PRICE_MONTHLY`

**Annual Subscription**
- Name: "AI Mock Interview - Annual"
- Price: $200/year
- Recurring: Yearly
- Copy the Price ID to `VITE_STRIPE_PRICE_ANNUAL`

### 2. Configure Webhook

1. Go to Stripe Dashboard > Developers > Webhooks
2. Click "Add endpoint"
3. Enter URL: `https://your-region-your-project.cloudfunctions.net/handleStripeWebhook`
4. Select events to listen for:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `checkout.session.completed`
5. Copy the "Signing secret" (starts with `whsec_`)
6. Set it in Firebase Functions config:
   ```bash
   firebase functions:config:set stripe.webhook_secret="whsec_xxxx"
   ```

---

## Database Setup

### 1. Seed Problem Bank

Use the Admin Panel to seed the problem bank:

1. Deploy the application first (see below)
2. Navigate to `/admin` in your browser
3. Click "Seed All Problems" to import the 30+ problems

Or use the CLI:

```bash
# From project root
node -e "
const { seedAllProblems } = require('./src/utils/seedDatabase');
seedAllProblems().then(result => {
  console.log('Seeded', result.success, 'problems');
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
"
```

### 2. Verify Firestore Collections

Expected collections:
- `users` - User profiles and stats
- `sessions` - Interview sessions
- `problems` - Coding problems
- `subscriptions` - Payment subscriptions (managed by Stripe webhook)

---

## Frontend Deployment

### 1. Build Frontend

```bash
# Build production bundle
npm run build

# This creates a 'dist' folder
```

### 2. Test Locally (Optional)

```bash
# Preview production build
npm run preview
```

### 3. Deploy to Firebase Hosting

```bash
firebase deploy --only hosting
```

Your site will be available at:
- `https://your-project-id.web.app`
- `https://your-project-id.firebaseapp.com`

### 4. Configure Custom Domain (Optional)

1. Go to Firebase Console > Hosting
2. Click "Add custom domain"
3. Follow the verification steps
4. Update DNS records as instructed
5. Update `VITE_APP_URL` in `.env`

---

## Backend Functions Deployment

### 1. Deploy All Functions

```bash
firebase deploy --only functions
```

This deploys:
- `createCheckoutSession` - Stripe checkout
- `createPortalSession` - Customer portal
- `handleStripeWebhook` - Payment webhooks
- `onUserCreate` - User initialization
- `updateUserStats` - Analytics aggregation
- `onSessionComplete` - Session metrics calculation
- `getRandomProblem` - Problem retrieval
- `getProblemsByFilter` - Problem filtering

### 2. Deploy Individual Function (if needed)

```bash
firebase deploy --only functions:handleStripeWebhook
```

### 3. View Function Logs

```bash
firebase functions:log
```

---

## Post-Deployment Verification

### 1. Frontend Checks

- [ ] Landing page loads correctly
- [ ] Login/Signup works
- [ ] Dashboard displays correctly
- [ ] Pricing page shows correct prices
- [ ] Analytics tracking works (check Firebase Console > Analytics)

### 2. Authentication Flow

- [ ] Sign up creates user account
- [ ] User profile is created in Firestore
- [ ] Trial status is initialized (3 sessions)
- [ ] User can log in and out

### 3. Interview Flow

- [ ] User can start interview session
- [ ] Problem displays correctly
- [ ] Code editor works
- [ ] Test cases can be run
- [ ] AI chat responds (check OpenAI usage)
- [ ] Session can be ended
- [ ] Session saved to Firestore

### 4. Payment Flow

- [ ] Pricing page displays
- [ ] Checkout redirects to Stripe
- [ ] Payment processes successfully
- [ ] Webhook updates subscription status
- [ ] User sees "Active" subscription
- [ ] Interview limit removed

### 5. History Page

- [ ] Sessions display in history
- [ ] Filters and search work
- [ ] Session details modal opens
- [ ] All tabs display correctly

### 6. Admin Panel

- [ ] Problem stats display
- [ ] Seed function works
- [ ] Data validation works

---

## Troubleshooting

### Frontend Issues

**Error: Firebase config not found**
- Check `.env` file exists and contains all variables
- Ensure variables start with `VITE_`
- Restart dev server after changing `.env`

**Error: Page not found after deployment**
- Check `firebase.json` rewrites configuration
- Ensure `dist` folder was built before deployment

### Functions Issues

**Error: Function not deployed**
```bash
# Check deployment status
firebase functions:list

# Redeploy specific function
firebase deploy --only functions:functionName
```

**Error: Stripe webhook failing**
- Verify webhook secret is correct
- Check function logs: `firebase functions:log`
- Test webhook in Stripe Dashboard > Webhooks > Test

**Error: OpenAI API not responding**
- Verify API key is set in functions config
- Check OpenAI account has credits
- Review function logs for detailed error

### Database Issues

**Error: Permission denied**
- Check Firestore rules are deployed
- Verify user is authenticated
- Review rules in Firebase Console

**Error: Index required**
- Firebase will show link to create index
- Click link and wait for index to build
- Or deploy `firestore.indexes.json`

### Performance Issues

**Slow function cold starts**
- Upgrade to Firebase Blaze plan
- Increase function memory in `firebase.json`
- Use min instances for critical functions

**High costs**
- Monitor Firebase usage dashboard
- Optimize Firestore reads/writes
- Cache frequently accessed data
- Use client-side caching

---

## Monitoring and Maintenance

### 1. Firebase Console

Monitor:
- **Authentication**: Active users, sign-ups
- **Firestore**: Document counts, reads/writes
- **Functions**: Invocations, errors, execution time
- **Hosting**: Bandwidth, requests
- **Analytics**: User behavior, events

### 2. Stripe Dashboard

Monitor:
- Active subscriptions
- Revenue
- Failed payments
- Churn rate

### 3. Error Tracking

Consider adding:
- Sentry for error tracking
- LogRocket for session replay
- Google Analytics for detailed user analytics

### 4. Backups

```bash
# Export Firestore data
firebase firestore:export gs://your-bucket/backups/$(date +%Y%m%d)

# Restore from backup
firebase firestore:import gs://your-bucket/backups/20231118
```

---

## Security Checklist

- [ ] All API keys are in environment variables, not code
- [ ] Firestore security rules are production-ready
- [ ] Stripe webhook signature verification is enabled
- [ ] CORS is properly configured
- [ ] Rate limiting is implemented for sensitive endpoints
- [ ] User input is validated and sanitized
- [ ] HTTPS is enforced
- [ ] Content Security Policy headers are set

---

## Scaling Considerations

As your app grows:

1. **Database**: Implement composite indexes for complex queries
2. **Functions**: Use Cloud Run for long-running operations
3. **Caching**: Add Redis for session/problem caching
4. **CDN**: Use Cloud CDN for static assets
5. **Monitoring**: Set up alerts for errors, high usage
6. **Load Testing**: Test with tools like k6 or Artillery

---

## Support

For issues or questions:
- Check Firebase documentation: https://firebase.google.com/docs
- Stripe documentation: https://stripe.com/docs
- OpenAI documentation: https://platform.openai.com/docs
- Create issue in project repository

---

## Changelog

Track deployment changes:

### Version 1.0.0 - 2025-11-18
- Initial production deployment
- 30+ coding problems
- Stripe payment integration
- Firebase Analytics
- Session history
- Admin panel

---

**Happy Deploying! 🚀**
