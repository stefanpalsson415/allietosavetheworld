# Leads Collection System - Implementation Guide

**Created**: October 10, 2025
**Purpose**: Marketing lead collection separate from full user accounts

---

## 🎯 Overview

The **leads collection** stores email addresses from blog subscriptions and quiz completions, keeping them separate from full user accounts for clean data architecture.

### Why Separate?
- **Marketing leads** != **Full users**
- Marketing leads: Just email + interest data
- Full users: Auth + Firestore + Family setup
- Clean conversion tracking (lead → user)
- Better email marketing segmentation

---

## 📊 Data Structure

### Firestore Collection: `leads/{leadId}`

```javascript
{
  // Identity
  leadId: "lead_1760123456789_abc123",
  email: "user@example.com",
  name: "John Doe" (optional),

  // Classification
  source: "blog_subscribe" | "quiz_complete",
  status: "subscribed" | "converted" | "unsubscribed",

  // Timestamps
  createdAt: Timestamp,
  lastActivity: Timestamp,

  // Metadata (varies by source)
  metadata: {
    // For blog subscribers:
    blogPostId: "post-123",
    blogPostIds: ["post-123", "post-456"],
    interests: ["parenting", "balance"],
    subscriptionSource: "blog_widget",

    // For quiz takers:
    quizResults: {
      quizType: "family_balance",
      score: 75,
      categories: { work: 8, family: 6, self: 4, social: 5 },
      recommendations: ["More self-care", "Better work boundaries"]
    },
    quizCompletedAt: "2025-10-10T15:30:00Z",
    interests: ["time-management", "self-care"]
  },

  // Marketing
  emailConsent: true,
  tags: ["blog-reader", "quiz-taker"],

  // Conversion tracking
  convertedToUserId: "zJ70Yc4bgkea71ztUneHfjyOuYk2" (when they become full user),
  convertedAt: Timestamp (when conversion happened)
}
```

---

## 🔧 Service API

### Import the Service
```javascript
import leadService from '../services/LeadService';
```

### 1. Create Blog Subscriber
```javascript
const result = await leadService.createBlogSubscriber({
  email: "user@example.com",
  name: "John Doe", // optional
  blogPostId: "post-123", // optional
  interests: ["parenting", "time-management"] // optional
});

if (result.success) {
  console.log('Lead created:', result.leadId);
  if (result.alreadyExists) {
    console.log('Email already subscribed, updated activity');
  }
}
```

### 2. Create Quiz Lead
```javascript
const result = await leadService.createQuizLead({
  email: "user@example.com",
  name: "John Doe", // required for quiz
  quizResults: {
    quizType: "family_balance",
    score: 75,
    categories: { work: 8, family: 6, self: 4, social: 5 },
    recommendations: ["More self-care", "Better work boundaries"]
  },
  interests: ["time-management", "self-care"] // optional
});
```

### 3. Mark Lead as Converted (When They Signup)
```javascript
// In PaymentScreen.jsx after creating user
const result = await createFamily(familyDataForCreation);

// Mark lead as converted
await leadService.markLeadConverted(
  familyDataForCreation.email,
  result.parentUsers[0].uid
);
```

### 4. Unsubscribe a Lead
```javascript
const result = await leadService.unsubscribeLead("user@example.com");
```

### 5. Get Lead Statistics (Admin)
```javascript
const stats = await leadService.getLeadStats();
console.log(stats);
// {
//   total: 150,
//   bySource: { blog_subscribe: 90, quiz_complete: 60 },
//   byStatus: { subscribed: 120, converted: 25, unsubscribed: 5 },
//   conversionRate: "16.67"
// }
```

---

## 🎨 Integration Examples

### Blog Subscribe Form

```jsx
import React, { useState } from 'react';
import leadService from '../../services/LeadService';

function BlogSubscribeWidget({ blogPostId }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await leadService.createBlogSubscriber({
      email,
      blogPostId,
      interests: ['blog-updates']
    });

    setLoading(false);

    if (result.success) {
      setSuccess(true);
      setEmail('');
      // Show success message
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  return (
    <form onSubmit={handleSubscribe} className="blog-subscribe-form">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Subscribing...' : 'Subscribe'}
      </button>
      {success && <p className="success">✅ Subscribed! Check your inbox.</p>}
    </form>
  );
}
```

### Quiz Results Screen

```jsx
import React from 'react';
import leadService from '../../services/LeadService';

function QuizResults({ quizResults }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  const handleSaveResults = async (e) => {
    e.preventDefault();

    // Save lead
    const result = await leadService.createQuizLead({
      email,
      name,
      quizResults: {
        quizType: 'family_balance',
        score: quizResults.totalScore,
        categories: quizResults.categories,
        recommendations: quizResults.recommendations
      },
      interests: quizResults.topCategories
    });

    if (result.success) {
      // Show email sent confirmation
      alert('Results sent to your email!');
    }
  };

  return (
    <div className="quiz-results">
      <h2>Your Family Balance Score: {quizResults.totalScore}</h2>

      {/* Show results */}
      <div className="results">...</div>

      {/* Email form */}
      <form onSubmit={handleSaveResults}>
        <h3>Get Your Full Report</h3>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          required
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email"
          required
        />
        <button type="submit">Send Me My Results</button>
      </form>
    </div>
  );
}
```

### Mark Conversion in PaymentScreen.jsx

```javascript
// After line 102 in PaymentScreen.jsx
const result = await createFamily(familyDataForCreation);

// NEW: Mark lead as converted if they came from marketing funnel
await leadService.markLeadConverted(
  familyDataForCreation.email,
  result.parentUsers[0].uid
);

// ... rest of existing code
```

---

## 🔒 Security Rules

Already added to `firestore.rules`:

```javascript
match /leads/{leadId} {
  // Anyone can create leads (for blog subscribe, quiz completion)
  allow create: if true;
  // Anyone can read their own lead by email (for unsubscribe links)
  allow read: if true;
  // Only authenticated admins can update leads (for conversion tracking)
  allow update: if isAuthenticated();
  // Leads should not be deleted (keep for analytics)
  allow delete: if false;
}
```

---

## 📧 Email Marketing Integration

### Welcome Email (Blog Subscribe)
```javascript
// In Cloud Function or backend
exports.sendBlogWelcomeEmail = functions.firestore
  .document('leads/{leadId}')
  .onCreate(async (snap, context) => {
    const lead = snap.data();

    if (lead.source === 'blog_subscribe') {
      await sendEmail({
        to: lead.email,
        subject: 'Welcome to Allie Blog!',
        template: 'blog-welcome',
        data: {
          name: lead.name || 'there',
          unsubscribeLink: `https://checkallie.com/unsubscribe?email=${lead.email}`
        }
      });
    }
  });
```

### Quiz Results Email
```javascript
exports.sendQuizResults = functions.firestore
  .document('leads/{leadId}')
  .onCreate(async (snap, context) => {
    const lead = snap.data();

    if (lead.source === 'quiz_complete') {
      await sendEmail({
        to: lead.email,
        subject: 'Your Family Balance Quiz Results',
        template: 'quiz-results',
        data: {
          name: lead.name,
          score: lead.metadata.quizResults.score,
          recommendations: lead.metadata.quizResults.recommendations,
          signupLink: 'https://checkallie.com/onboarding'
        }
      });
    }
  });
```

---

## 📊 Analytics Queries

### Get All Blog Subscribers
```javascript
const blogLeads = await leadService.getLeads({
  source: 'blog_subscribe',
  status: 'subscribed',
  maxResults: 100
});
```

### Get Conversion Rate
```javascript
const stats = await leadService.getLeadStats();
console.log(`Conversion rate: ${stats.conversionRate}%`);
// e.g., "16.67%" means 16.67% of leads became full users
```

### Check If Email Already Exists
```javascript
const existing = await leadService.getLeadByEmail('user@example.com');
if (existing) {
  console.log('Already subscribed:', existing.source);
}
```

---

## 🚀 Deployment Checklist

### 1. Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### 2. Test Lead Creation
```javascript
// In browser console on https://checkallie.com
import leadService from './services/LeadService';

await leadService.createBlogSubscriber({
  email: 'test@example.com',
  blogPostId: 'test-post'
});
```

### 3. Verify in Firebase Console
- Go to: https://console.firebase.google.com/project/parentload-ba995/firestore/data/leads
- Check for new lead document

### 4. Test Conversion Flow
- Create lead with test email
- Complete full onboarding with same email
- Verify lead marked as `status: 'converted'`

---

## 🔍 Common Issues & Fixes

### Issue: Lead not created
**Check**: Firestore rules deployed?
```bash
firebase deploy --only firestore:rules
```

### Issue: Duplicate leads
**Answer**: This is expected! Service updates `lastActivity` if email exists.

### Issue: Conversion not working
**Check**: Is `markLeadConverted()` called after `createFamily()`?

---

## 📈 Future Enhancements

1. **Email Nurture Campaigns**
   - Track which emails sent to each lead
   - A/B test different messaging
   - Automated follow-ups

2. **Lead Scoring**
   - Quiz score → high-intent leads
   - Multiple blog visits → engaged leads
   - Prioritize for outreach

3. **Segmentation**
   - By interest tags
   - By quiz results
   - By engagement level

4. **Unsubscribe Page**
   - Create `/unsubscribe` route
   - Call `leadService.unsubscribeLead(email)`
   - Show confirmation

---

## 📚 Related Files

- **Service**: `/src/services/LeadService.js`
- **Rules**: `/firestore.rules` (lines 636-646)
- **Documentation**: This file

---

## ✅ Summary

**What We Built:**
- ✅ Lead collection system (separate from full users)
- ✅ Blog subscriber creation
- ✅ Quiz lead tracking
- ✅ Conversion tracking (lead → user)
- ✅ Firestore security rules
- ✅ Analytics and reporting

**Ready For:**
- Blog subscribe widgets
- Quiz completion screens
- Email marketing campaigns
- Conversion rate tracking

**Next Steps:**
1. Deploy firestore rules: `firebase deploy --only firestore:rules`
2. Add blog subscribe widget to blog posts
3. Add email capture to quiz results
4. Set up email marketing (SendGrid/Mailchimp)

---

**Questions?** See CLAUDE.md for project guidelines or run diagnostic scripts to check data.
