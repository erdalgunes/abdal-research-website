# Interactive Documentation System - Architecture Summary

**Quick Reference Guide for Stakeholders**

---

## 🎯 What We're Building

Transform the Sacred Madness Wiki into an **interactive, collaborative documentation platform** where users can:

1. **Select any text** on documentation pages
2. **Ask questions** about the content
3. Get **AI-researched answers** with academic citations
4. **Generate GitHub PRs** with suggested improvements
5. **Track contributions** through gamified profiles

---

## 🏆 Key Architecture Decisions

### Technology Stack

| Component | Choice | Why |
|-----------|--------|-----|
| **State Management** | Zustand | Lightweight, no boilerplate, perfect for text selection |
| **Authentication** | NextAuth.js v5 | Built-in GitHub OAuth, edge runtime support |
| **Database** | Vercel Postgres | Native SQL, auto-scaling, generous free tier |
| **Cache** | Vercel KV (Redis) | 30k commands/day free, edge-compatible |
| **GitHub API** | Octokit | Official SDK, TypeScript support |
| **AI Research** | Tavily + Claude Sonnet 4.5 | Academic focus + best synthesis quality |

### Why NOT Alternatives?
- ❌ **Supabase**: Adds hosting complexity, Vercel stack is sufficient
- ❌ **Context API**: Re-renders too aggressively for text selection
- ❌ **Custom OAuth**: Security risks, NextAuth is battle-tested

---

## 📊 Cost Projections

### Monthly Operating Costs

| User Scale | Tavily | Claude | Vercel | **Total** |
|-----------|--------|--------|--------|----------|
| **1,000 users** | $35 | $250 | $40 | **$325/mo** |
| **10,000 users** | $210 | $2,500 | $200 | **$2,910/mo** |

**Cost Optimization Strategies**:
- 40%+ cache hit rate reduces costs by ~30%
- Use Claude 3.5 Haiku ($1/M tokens) for simple clarifications
- Freemium model: $5/mo Pro tier → $10k/mo revenue at 20% conversion

---

## 🗓️ Implementation Timeline

### 10-Week Roadmap (190 developer hours)

**Phase 1: Text Selection UI** (Week 1-2)
- Text selection + highlighting
- Question prompt dialog
- 40 hours effort

**Phase 2: AI Research Pipeline** (Week 3-4)
- Tavily integration + caching
- Claude synthesis
- Progress indicators
- 60 hours effort

**Phase 3: GitHub OAuth + PRs** (Week 5-6)
- NextAuth.js setup
- Automated PR creation
- Security hardening
- 50 hours effort

**Phase 4: User Tracking** (Week 7-8)
- Contribution dashboard
- Achievement system
- Analytics
- 40 hours effort

**Deployment & Testing** (Week 9-10)
- Beta rollout
- Gradual production release

---

## 🔒 Security Highlights

✅ **OAuth Security**
- GitHub tokens never exposed to frontend
- Session-based authentication
- Required scopes: `read:user`, `user:email`, `public_repo`

✅ **Rate Limiting**
- Ask API: 10 requests/minute per user
- PR Creation: 3 requests/hour per user
- Using Vercel KV for distributed rate limiting

✅ **Input Validation**
- Max selection: 2,000 chars
- Max question: 500 chars
- XSS prevention via sanitization

✅ **Data Privacy**
- Encrypted questions in database
- GDPR compliant (export/delete)
- No token storage (session only)

---

## 📈 Success Metrics

| Metric | Target |
|--------|--------|
| **User Adoption** | 30% try the feature |
| **PR Creation Rate** | 10% of questions → PRs |
| **PR Merge Rate** | 60% merged |
| **API Response Time** | p95 < 2 seconds |
| **Cache Hit Rate** | >40% |
| **Error Rate** | <0.5% |

---

## ⚠️ Key Risks & Mitigation

### High Priority

**1. API Cost Overrun**
- ✅ Strict rate limiting per user
- ✅ Aggressive caching (24h TTL, extendable to 7 days)
- ✅ Cost alerts at $100/day threshold
- ✅ Use cheaper models for drafts

**2. GitHub Rate Limits** (5k/hour)
- ✅ PR queue (max 3/hour per user)
- ✅ Monitor rate limit headers
- ✅ Exponential backoff on errors

**3. Spam/Low-Quality PRs**
- ✅ AI quality scoring (0-1 scale)
- ✅ Manual review for new users (first 3 PRs)
- ✅ Reputation system

---

## 🗄️ Database Schema Overview

```sql
-- Core Tables
users              -- GitHub OAuth data, reputation points
questions          -- All asked questions with context
contributions      -- PR tracking and status
research_cache_metadata  -- Track KV cache efficiency
achievements       -- Gamification badges

-- Vercel KV Keys
research:{hash}    -- Cached Tavily results (24h TTL)
ratelimit:{action}:{user} -- Rate limiting counters
```

---

## 🔌 API Endpoints

### 1. POST /api/documentation/ask
**Purpose**: Process question → AI suggestion  
**Rate Limit**: 10/min per user  
**Returns**: Suggestion + sources + cache status

### 2. POST /api/documentation/generate-pr
**Purpose**: Create GitHub PR  
**Rate Limit**: 3/hour per user  
**Returns**: PR URL + contribution ID + points

### 3. GET /api/users/[id]/contributions
**Purpose**: User profile data  
**Returns**: Stats + history + achievements

### 4. POST /api/auth/github (NextAuth)
**Purpose**: GitHub OAuth flow  
**Scopes**: `read:user`, `user:email`, `public_repo`

---

## 🧪 Testing Strategy

| Test Type | Tool | Coverage |
|-----------|------|----------|
| **Unit Tests** | Vitest | 90%+ |
| **Integration** | Vitest | 80%+ |
| **E2E** | Playwright | Critical paths |
| **Load Testing** | k6 | All endpoints |
| **Security** | OWASP ZAP | Vulnerability scan |

---

## 🚀 Deployment Strategy

### Gradual Rollout Plan

**Week 9: Beta**
- 50 beta testers
- Feature flag controlled
- Heavy monitoring

**Week 10: Production**
- Day 1-2: 10% of users
- Day 3-4: 25% of users
- Day 5-6: 50% of users
- Day 7: 100% of users

**Rollback Plan**:
- Instant: Disable feature flag
- 5min: Deploy previous version
- 15min: Root cause analysis

---

## 📚 Documentation Deliverables

✅ **User Docs**
- Getting started guide
- Best practices
- FAQ

✅ **Developer Docs**
- API reference
- Setup guide
- Architecture diagrams
- Contribution guidelines

---

## ✅ Pre-Implementation Checklist

**Environment Setup**
- [ ] Create Vercel project
- [ ] Configure environment variables (see INTERACTIVE_DOCUMENTATION_ARCHITECTURE.md, Appendix B)
- [ ] Set up Vercel Postgres
- [ ] Set up Vercel KV
- [ ] Create GitHub OAuth App

**Team**
- [ ] Assign 2 full-stack developers
- [ ] Assign QA engineer
- [ ] Schedule kickoff meeting
- [ ] Set up communication channels

**Monitoring**
- [ ] Configure error tracking (Sentry/LogRocket)
- [ ] Set up analytics dashboard
- [ ] Create cost alert thresholds
- [ ] Define on-call rotation

---

## 🎯 Next Actions

### This Week
1. **Stakeholder Review** → Approve architecture
2. **Budget Allocation** → Confirm $325-$2,910/month
3. **Team Assembly** → Assign developers

### Next Week (Start Phase 1)
1. Install Zustand: `npm install zustand`
2. Create `useTextSelection` hook
3. Build `TextSelectionOverlay` component
4. Set up unit tests

---

## 📖 Full Documentation

For complete technical details, see:
- **[INTERACTIVE_DOCUMENTATION_ARCHITECTURE.md](./INTERACTIVE_DOCUMENTATION_ARCHITECTURE.md)** (1,678 lines)
  - Complete system architecture
  - Detailed API specifications
  - Database schemas
  - Component designs
  - Testing strategies
  - Risk mitigation
  - Cost analysis

---

**Architecture Status**: ✅ Complete & Ready for Review  
**Estimated Delivery**: 10 weeks from kickoff  
**Total Investment**: 190 developer hours + $325-$2,910/month operational costs  

**Questions?** Review the full architecture document or schedule a walkthrough with the team.

---

*Designed by: Kilo Code (Architect Mode)*  
*Date: 2025-10-04*