# Interactive Jupyter Book-Style Documentation System
## Architecture & Implementation Plan

**Version**: 1.0  
**Date**: 2025-10-04  
**Project**: Sacred Madness Wiki - AI-Assisted Community Documentation

---

## 📋 Executive Summary

This document outlines the architecture for transforming the Sacred Madness Wiki into an interactive, collaborative documentation platform where users can:

1. **Select text** on any documentation page
2. **Ask questions** about the selected content
3. **Receive AI-synthesized answers** with academic citations
4. **Generate GitHub PRs** with suggested improvements
5. **Track contributions** through a gamified profile system

**Design Principles**:
- **Incremental Enhancement**: Build on existing Next.js 15 architecture
- **Cost-Effective**: Optimize API usage and caching
- **Security-First**: OAuth, rate limiting, input validation
- **Scalable**: Designed for growth from 100 to 10,000+ users

---

## 🏗️ System Architecture

### High-Level Architecture Diagram

```mermaid
graph TB
    User[User Browser]
    
    subgraph "Frontend Layer"
        TextSelect[Text Selection Handler]
        QuestionUI[Question Dialog]
        PRPreview[PR Preview Modal]
        Dashboard[User Dashboard]
    end
    
    subgraph "API Layer"
        AskAPI[/api/documentation/ask]
        ResearchAPI[/api/documentation/research]
        PRAPI[/api/documentation/generate-pr]
        ContribAPI[/api/users/contributions]
        AuthAPI[/api/auth/github]
    end
    
    subgraph "External Services"
        Tavily[Tavily Research API]
        Claude[Claude Sonnet 4.5]
        GitHub[GitHub API]
        NextAuth[NextAuth.js]
    end
    
    subgraph "Data Layer"
        VercelKV[Vercel KV Cache]
        VercelDB[Vercel Postgres]
    end
    
    User --> TextSelect
    TextSelect --> QuestionUI
    QuestionUI --> AskAPI
    AskAPI --> ResearchAPI
    ResearchAPI --> Tavily
    AskAPI --> Claude
    Claude --> PRPreview
    PRPreview --> PRAPI
    PRAPI --> GitHub
    User --> Dashboard
    Dashboard --> ContribAPI
    User --> AuthAPI
    AuthAPI --> NextAuth
    NextAuth --> GitHub
    
    ResearchAPI -.cache.-> VercelKV
    ContribAPI --> VercelDB
    PRAPI --> VercelDB
    
    style User fill:#e1f5fe
    style Tavily fill:#fff3e0
    style Claude fill:#f3e5f5
    style GitHub fill:#e8f5e9
```

### Data Flow: Text Selection → PR Creation

```mermaid
sequenceDiagram
    actor User
    participant UI as Text Selection UI
    participant Ask as /api/documentation/ask
    participant Research as Tavily API
    participant AI as Claude Sonnet 4.5
    participant Cache as Vercel KV
    participant PR as /api/documentation/generate-pr
    participant GH as GitHub API
    participant DB as Vercel Postgres
    
    User->>UI: Select text & type question
    UI->>Ask: POST {text, question, slug}
    
    Ask->>Cache: Check research cache
    alt Cache Hit
        Cache-->>Ask: Return cached research
    else Cache Miss
        Ask->>Research: Search query
        Research-->>Ask: Sources & snippets
        Ask->>Cache: Store research (24h TTL)
    end
    
    Ask->>AI: Synthesize with context
    AI-->>Ask: Improved text + citations
    Ask-->>UI: Display suggestion
    
    User->>UI: Approve PR creation
    UI->>PR: POST {suggestion, sources, metadata}
    PR->>GH: Create pull request
    GH-->>PR: PR number & URL
    PR->>DB: Log contribution
    DB-->>PR: Contribution ID
    PR-->>UI: PR created successfully
    UI-->>User: Show PR link
```

---

## 🔧 Technology Stack Decisions

### Frontend Technologies

| Technology | Decision | Justification |
|------------|----------|---------------|
| **State Management** | **Zustand** | - Lightweight (1KB vs 10KB for Redux)<br>- No boilerplate<br>- Perfect for text selection state<br>- Already React 19 compatible |
| **Text Selection** | **Custom Hook + window.getSelection()** | - Native browser API<br>- No external dependencies<br>- Full control over UX<br>- 100% accurate positioning |
| **UI Components** | **Existing shadcn/ui + Radix** | - Already in use<br>- Accessible by default<br>- Consistent design system |
| **Animations** | **Framer Motion** | - Smooth text highlight transitions<br>- Dialog entrance/exit animations<br>- Small bundle size (~40KB) |

### Backend Technologies

| Technology | Decision | Justification |
|------------|----------|---------------|
| **Authentication** | **NextAuth.js v5** | - Already Next.js 15 compatible<br>- Built-in GitHub provider<br>- Session management included<br>- Edge runtime support |
| **Database (User Data)** | **Vercel Postgres** | - Generous free tier (60 hours compute/month)<br>- Automatic connection pooling<br>- Scales with Vercel deployments<br>- Native SQL for complex queries |
| **Cache Layer** | **Vercel KV (Redis)** | - 30,000 commands/day free tier<br>- Perfect for research deduplication<br>- Edge-compatible<br>- Automatic TTL management |
| **GitHub Integration** | **Octokit REST API** | - Official GitHub SDK<br>- TypeScript support<br>- Well-documented<br>- Handles auth tokens securely |

### Why NOT Alternative Options

**❌ Supabase**: 
- Adds complexity with separate hosted service
- KV + Postgres already available on Vercel
- Extra authentication layer not needed

**❌ Context API for State**: 
- Re-renders too aggressively for text selection
- No DevTools integration
- Harder to optimize performance

**❌ Custom OAuth Flow**: 
- Security risks
- Reinventing the wheel
- NextAuth provides battle-tested solution

---

## 🗄️ Database Schema

### Vercel Postgres Tables

```sql
-- Users table (GitHub OAuth data)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  github_id INTEGER UNIQUE NOT NULL,
  github_username VARCHAR(255) NOT NULL,
  github_name VARCHAR(255),
  github_avatar_url TEXT,
  email VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP DEFAULT NOW(),
  total_contributions INTEGER DEFAULT 0,
  reputation_points INTEGER DEFAULT 0
);

CREATE INDEX idx_users_github_id ON users(github_id);
CREATE INDEX idx_users_reputation ON users(reputation_points DESC);

-- Questions table (track all asked questions)
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  page_slug VARCHAR(255) NOT NULL,
  selected_text TEXT NOT NULL,
  question TEXT NOT NULL,
  research_cache_key VARCHAR(255), -- Link to cached Tavily results
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_questions_user ON questions(user_id);
CREATE INDEX idx_questions_page ON questions(page_slug);
CREATE INDEX idx_questions_created ON questions(created_at DESC);

-- Contributions table (track PRs and their status)
CREATE TABLE contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE SET NULL,
  pr_number INTEGER NOT NULL,
  pr_url TEXT NOT NULL,
  page_slug VARCHAR(255) NOT NULL,
  suggestion_text TEXT NOT NULL,
  research_sources JSONB, -- Store Tavily sources as JSON
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, merged
  created_at TIMESTAMP DEFAULT NOW(),
  merged_at TIMESTAMP,
  points_awarded INTEGER DEFAULT 10
);

CREATE INDEX idx_contributions_user ON contributions(user_id);
CREATE INDEX idx_contributions_status ON contributions(status);
CREATE INDEX idx_contributions_pr ON contributions(pr_number);

-- Research cache metadata (track what's cached in KV)
CREATE TABLE research_cache_metadata (
  cache_key VARCHAR(255) PRIMARY KEY,
  query_hash VARCHAR(64) NOT NULL, -- MD5 of normalized query
  query_text TEXT NOT NULL,
  hit_count INTEGER DEFAULT 1,
  last_accessed TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cache_query_hash ON research_cache_metadata(query_hash);

-- Achievements/Badges table
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  badge_type VARCHAR(50) NOT NULL, -- first_pr, scholar, maintainer, etc.
  earned_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_achievements_user ON achievements(user_id);
```

### Vercel KV Keys Structure

```typescript
// Research cache (24-hour TTL)
`research:${queryHash}` → {
  sources: TavilySource[],
  timestamp: number,
  expiresAt: number
}

// Rate limiting
`ratelimit:ask:${userId}` → count (60s TTL)
`ratelimit:pr:${userId}` → count (300s TTL)

// Session cache
`session:${userId}:active` → boolean (30min TTL)
```

---

## 🔌 API Endpoint Specifications

### 1. POST /api/documentation/ask

**Purpose**: Process selected text + user question → AI-synthesized suggestion

**Request Body**:
```typescript
interface AskRequest {
  selectedText: string     // Max 2000 chars
  question: string         // Max 500 chars
  pageSlug: string
  selectionContext?: {     // 100 chars before/after selection
    before: string
    after: string
  }
}
```

**Response**:
```typescript
interface AskResponse {
  questionId: string
  suggestion: {
    improvedText: string
    explanation: string
    confidence: number      // 0-1 scale
  }
  sources: {
    title: string
    url: string
    snippet: string
    relevanceScore: number
  }[]
  cacheHit: boolean
}
```

**Rate Limit**: 10 requests/minute per user  
**Authentication**: Required  
**Caching**: Yes (query-based, 24h TTL)

### 2. POST /api/documentation/research

**Purpose**: Execute Tavily research (called internally by `/ask`)

**Internal API** - Not exposed to frontend directly

**Logic**:
```typescript
1. Hash query → check KV cache
2. If cache miss:
   - Call Tavily API with academic focus
   - Filter results (min relevance score: 0.7)
   - Store in KV with 24h TTL
   - Log metadata in Postgres
3. Return sources
```

### 3. POST /api/documentation/generate-pr

**Purpose**: Create GitHub PR with AI-suggested improvements

**Request Body**:
```typescript
interface GeneratePRRequest {
  questionId: string
  suggestion: {
    originalText: string
    improvedText: string
    explanation: string
  }
  sources: TavilySource[]
  pageSlug: string
}
```

**PR Format**:
```markdown
## AI-Assisted Documentation Improvement

**Contributor**: @${username}
**Page**: /wiki/${pageSlug}

### Original Text
> ${originalText}

### Suggested Improvement
${improvedText}

### Rationale
${explanation}

### Research Sources
1. [${source.title}](${source.url})
   ${source.snippet}

---
**Research Method**: Tavily Academic Search → Claude Sonnet 4.5 Synthesis
**Generated**: ${timestamp}
**Question ID**: ${questionId}
```

**Response**:
```typescript
interface PRResponse {
  prNumber: number
  prUrl: string
  contributionId: string
  pointsAwarded: number
}
```

**Rate Limit**: 3 PRs/hour per user  
**Authentication**: Required (GitHub write scope)

### 4. GET /api/users/[id]/contributions

**Purpose**: Fetch user's contribution history

**Query Parameters**:
```typescript
interface ContributionsQuery {
  status?: 'pending' | 'merged' | 'rejected'
  limit?: number        // Default: 20, Max: 100
  offset?: number       // For pagination
}
```

**Response**:
```typescript
interface UserContributions {
  user: {
    id: string
    username: string
    avatar: string
    totalContributions: number
    reputationPoints: number
    achievements: Achievement[]
  }
  contributions: {
    id: string
    prNumber: number
    prUrl: string
    pageTitle: string
    status: string
    createdAt: string
    mergedAt?: string
    pointsAwarded: number
  }[]
  stats: {
    pending: number
    merged: number
    rejected: number
  }
}
```

### 5. POST /api/auth/github (NextAuth.js)

**Purpose**: GitHub OAuth callback

**Flow**:
1. User clicks "Sign in with GitHub"
2. Redirects to GitHub OAuth
3. GitHub redirects back with code
4. NextAuth exchanges for access token
5. Fetch user profile from GitHub
6. Create/update user in Vercel Postgres
7. Create session

**Scopes Required**:
- `read:user` - User profile
- `user:email` - Email address
- `public_repo` - Create PRs

---

## 🎨 UI/UX Component Design

### Component Hierarchy

```
<WikiPage>
  <TextSelectionProvider>           // Zustand store
    <WikiLayout>
      <MDXContent />
      <TextSelectionOverlay />       // Highlights selected text
      <QuestionPromptDialog />       // Ask question modal
    </WikiLayout>
    
    <ResearchProgressIndicator />    // Loading states
    <PRPreviewModal />               // Review before creating PR
  </TextSelectionProvider>
  
  <UserContributionWidget />         // Floating profile widget
</WikiPage>
```

### 1. TextSelectionProvider (Zustand Store)

```typescript
interface TextSelectionStore {
  selectedText: string
  selectionRange: Range | null
  selectionRect: DOMRect | null
  pageSlug: string
  
  // Actions
  setSelection: (text: string, range: Range) => void
  clearSelection: () => void
  
  // Question state
  question: string
  setQuestion: (q: string) => void
  
  // Research state
  isResearching: boolean
  researchProgress: number
  suggestion: SuggestionData | null
}
```

### 2. TextSelectionOverlay Component

**Visual Design**:
```tsx
<div className="absolute pointer-events-none">
  {/* Highlight selected text with animated border */}
  <div 
    className="bg-blue-100/50 dark:bg-blue-900/30 
               border-2 border-blue-400 rounded
               animate-pulse-border"
    style={{
      position: 'absolute',
      top: selectionRect.top,
      left: selectionRect.left,
      width: selectionRect.width,
      height: selectionRect.height
    }}
  />
  
  {/* Floating action button */}
  <Button
    className="pointer-events-auto"
    style={{
      position: 'absolute',
      top: selectionRect.bottom + 8,
      left: selectionRect.left
    }}
  >
    <Sparkles /> Ask about this
  </Button>
</div>
```

**Interaction Flow**:
1. User selects text (mouseup event)
2. Calculate selection bounds with `range.getBoundingClientRect()`
3. Show highlight + "Ask about this" button
4. Click opens QuestionPromptDialog

### 3. QuestionPromptDialog Component

```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle>Ask about selected text</DialogTitle>
      <DialogDescription>
        AI will research and suggest improvements
      </DialogDescription>
    </DialogHeader>
    
    {/* Show selected text */}
    <Card className="bg-muted p-4">
      <p className="text-sm italic">"{selectedText}"</p>
    </Card>
    
    {/* Question input */}
    <Textarea
      placeholder="What would you like to know or improve?"
      value={question}
      onChange={(e) => setQuestion(e.target.value)}
      maxLength={500}
    />
    
    {/* Quick suggestion chips */}
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={() => 
        setQuestion("Can you expand this explanation?")
      }>
        Expand
      </Button>
      <Button variant="outline" size="sm" onClick={() => 
        setQuestion("Add academic citations")
      }>
        Add Citations
      </Button>
      <Button variant="outline" size="sm" onClick={() => 
        setQuestion("Clarify this concept")
      }>
        Clarify
      </Button>
    </div>
    
    <DialogFooter>
      <Button variant="outline" onClick={handleCancel}>
        Cancel
      </Button>
      <Button onClick={handleSubmit} disabled={!question.trim()}>
        <Search /> Research & Suggest
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### 4. ResearchProgressIndicator Component

```tsx
<Card className="fixed bottom-20 right-6 w-80 shadow-xl">
  <CardContent className="p-4">
    <div className="flex items-center gap-3">
      <Loader2 className="animate-spin" />
      <div className="flex-1">
        <p className="font-medium">Researching...</p>
        <p className="text-sm text-muted-foreground">
          {stage === 'tavily' && 'Finding academic sources'}
          {stage === 'claude' && 'Synthesizing improvements'}
          {stage === 'formatting' && 'Preparing suggestion'}
        </p>
      </div>
    </div>
    
    <Progress value={progress} className="mt-3" />
    
    {sources.length > 0 && (
      <p className="text-xs text-muted-foreground mt-2">
        Found {sources.length} relevant sources
      </p>
    )}
  </CardContent>
</Card>
```

### 5. PRPreviewModal Component

```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>Review Suggested Improvement</DialogTitle>
    </DialogHeader>
    
    {/* Side-by-side diff */}
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Original</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap">
            {originalText}
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Suggested</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap">
            {suggestion.improvedText}
          </p>
        </CardContent>
      </Card>
    </div>
    
    {/* AI explanation */}
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Rationale</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm">{suggestion.explanation}</p>
      </CardContent>
    </Card>
    
    {/* Research sources */}
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Research Sources ({sources.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sources.map((source, i) => (
            <div key={i} className="border-l-2 border-blue-400 pl-3">
              <a 
                href={source.url} 
                target="_blank"
                className="font-medium text-sm hover:underline"
              >
                {source.title}
              </a>
              <p className="text-xs text-muted-foreground mt-1">
                {source.snippet}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
    
    <DialogFooter>
      <Button variant="outline" onClick={handleReject}>
        Discard
      </Button>
      <Button onClick={handleCreatePR}>
        <GitPullRequest /> Create Pull Request
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### 6. UserContributionDashboard Component

```tsx
<Card className="w-full max-w-4xl mx-auto">
  <CardHeader>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={user.avatar} />
          <AvatarFallback>{user.username[0]}</AvatarFallback>
        </Avatar>
        <div>
          <CardTitle>{user.name}</CardTitle>
          <CardDescription>@{user.username}</CardDescription>
        </div>
      </div>
      
      <div className="text-right">
        <p className="text-2xl font-bold">{user.reputationPoints}</p>
        <p className="text-sm text-muted-foreground">reputation</p>
      </div>
    </div>
  </CardHeader>
  
  <CardContent>
    {/* Stats */}
    <div className="grid grid-cols-3 gap-4 mb-6">
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-3xl font-bold">{stats.merged}</p>
          <p className="text-sm text-muted-foreground">Merged</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-3xl font-bold">{stats.pending}</p>
          <p className="text-sm text-muted-foreground">Pending</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-3xl font-bold">{achievements.length}</p>
          <p className="text-sm text-muted-foreground">Badges</p>
        </CardContent>
      </Card>
    </div>
    
    {/* Achievements */}
    <div className="mb-6">
      <h3 className="font-semibold mb-3">Achievements</h3>
      <div className="flex gap-2">
        {achievements.map(badge => (
          <TooltipProvider key={badge.id}>
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="outline" className="text-lg">
                  {getBadgeIcon(badge.type)}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>{getBadgeDescription(badge.type)}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    </div>
    
    {/* Recent contributions */}
    <div>
      <h3 className="font-semibold mb-3">Recent Contributions</h3>
      <div className="space-y-2">
        {contributions.map(contrib => (
          <Card key={contrib.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-sm">
                    {contrib.pageTitle}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(contrib.createdAt)} ago
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={getStatusVariant(contrib.status)}>
                    {contrib.status}
                  </Badge>
                  <Button variant="ghost" size="sm" asChild>
                    <a href={contrib.prUrl} target="_blank">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </CardContent>
</Card>
```

---

## 📅 Implementation Roadmap

### Phase 1: Text Selection UI (Week 1-2) - 40 hours

**Goal**: Users can select text and trigger question prompt

**Tasks**:
- [ ] Install Zustand for state management
- [ ] Create `useTextSelection` hook
  - Handle `mouseup` events
  - Calculate selection bounds
  - Validate selection (min 10 chars, max 2000 chars)
- [ ] Build `TextSelectionOverlay` component
  - Highlight selected text
  - Position "Ask about this" button
  - Handle click to open dialog
- [ ] Build `QuestionPromptDialog` component
  - Text display
  - Question input with validation
  - Quick suggestion chips
- [ ] Add to all wiki pages in `WikiLayout`
- [ ] Write unit tests (Jest + Testing Library)
- [ ] E2E tests (Playwright)

**Deliverables**:
- Working text selection UI
- Question prompt dialog
- 90%+ test coverage

**Effort**: 2 developers × 20 hours = 40 hours

---

### Phase 2: Tavily + Claude Integration (Week 3-4) - 60 hours

**Goal**: Research pipeline from question → AI suggestion

**Tasks**:
- [ ] Set up Tavily API integration
  - Create `/api/documentation/research` endpoint
  - Implement query optimization
  - Add result filtering (relevance score > 0.7)
- [ ] Implement Vercel KV caching
  - Query hashing (MD5)
  - 24-hour TTL
  - Cache hit/miss logging
- [ ] Create `/api/documentation/ask` endpoint
  - Request validation
  - Rate limiting (10/min per user)
  - Call research → Claude synthesis flow
- [ ] Build `ResearchProgressIndicator` component
  - Multi-stage progress (Tavily → Claude → Format)
  - Real-time updates via streaming
- [ ] Error handling
  - API failures
  - Timeout handling
  - Fallback responses
- [ ] Integration tests
- [ ] Load testing (100 concurrent requests)

**Deliverables**:
- Working research pipeline
- Cached responses
- Progress indicators

**Effort**: 2 developers × 30 hours = 60 hours

---

### Phase 3: GitHub OAuth + PR Automation (Week 5-6) - 50 hours

**Goal**: Authenticated users can create PRs

**Tasks**:
- [ ] Set up NextAuth.js v5
  - GitHub OAuth provider
  - Required scopes: `read:user`, `user:email`, `public_repo`
  - Session management
- [ ] Create Vercel Postgres tables
  - Run migration scripts
  - Seed test data
- [ ] Build `/api/auth/github` callback
  - User profile fetch
  - Create/update user record
  - Session creation
- [ ] Implement `/api/documentation/generate-pr`
  - Octokit integration
  - PR template formatting
  - Branch creation
  - File modification
- [ ] Build `PRPreviewModal` component
  - Side-by-side diff
  - Source citations
  - Edit before submit
- [ ] Add authentication guards
  - Protect PR creation endpoint
  - Redirect unauthenticated users
- [ ] Security testing
  - Token management
  - CSRF protection
  - Input sanitization

**Deliverables**:
- GitHub OAuth flow
- Automated PR creation
- Secure token handling

**Effort**: 2 developers × 25 hours = 50 hours

---

### Phase 4: User Tracking + Gamification (Week 7-8) - 40 hours

**Goal**: Track contributions and award achievements

**Tasks**:
- [ ] Build `/api/users/[id]/contributions` endpoint
  - Fetch user stats
  - Pagination
  - Filtering by status
- [ ] Create contribution logging
  - Track all PRs
  - Update on merge/rejection
  - Award reputation points
- [ ] Implement achievement system
  - Badge definitions (First PR, Scholar, Maintainer, etc.)
  - Automatic awarding on milestones
  - Display in profile
- [ ] Build `UserContributionDashboard` component
  - Stats visualization
  - Achievement badges
  - Contribution timeline
- [ ] Add leaderboard (optional)
  - Top contributors
  - Monthly rankings
- [ ] Analytics tracking
  - User engagement metrics
  - Most improved pages
  - Popular research topics

**Deliverables**:
- User contribution dashboard
- Achievement system
- Leaderboard

**Effort**: 2 developers × 20 hours = 40 hours

---

### Total Timeline: 8 weeks, 190 developer hours

**Team Composition**:
- 2 Full-stack developers
- 1 Part-time designer (UI/UX polish)
- 1 QA engineer (testing & quality assurance)

**Buffer**: Add 20% for unexpected issues → **10 weeks total**

---

## 🔒 Security & Rate Limiting

### Authentication & Authorization

**NextAuth.js Configuration**:
```typescript
// app/api/auth/[...nextauth]/route.ts
export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'read:user user:email public_repo'
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token
        token.githubId = profile?.id
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken
      session.user.githubId = token.githubId
      return session
    }
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60 // 30 days
  }
}
```

### Rate Limiting Strategy

| Endpoint | Rate Limit | Window | Identification |
|----------|-----------|--------|----------------|
| `/api/documentation/ask` | 10 requests | 1 minute | User ID |
| `/api/documentation/generate-pr` | 3 requests | 1 hour | User ID |
| `/api/users/[id]/contributions` | 30 requests | 1 minute | User ID |
| `/api/auth/github` | 5 requests | 5 minutes | IP Address |

**Implementation** (using Vercel KV):
```typescript
async function checkRateLimit(
  userId: string, 
  action: string, 
  limit: number, 
  windowMs: number
): Promise<boolean> {
  const key = `ratelimit:${action}:${userId}`
  const current = await kv.incr(key)
  
  if (current === 1) {
    await kv.expire(key, Math.floor(windowMs / 1000))
  }
  
  return current <= limit
}
```

### Input Validation & Sanitization

**All user inputs must be validated**:

```typescript
// Text selection validation
const MAX_SELECTION_LENGTH = 2000
const MIN_SELECTION_LENGTH = 10

function validateSelection(text: string): void {
  if (text.length < MIN_SELECTION_LENGTH) {
    throw new Error('Selection too short')
  }
  if (text.length > MAX_SELECTION_LENGTH) {
    throw new Error('Selection too long')
  }
  // Remove malicious content
  const sanitized = text
    .replace(/<script.*?>.*?<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .trim()
  return sanitized
}

// Question validation
const MAX_QUESTION_LENGTH = 500

function validateQuestion(question: string): void {
  if (!question.trim()) {
    throw new Error('Question cannot be empty')
  }
  if (question.length > MAX_QUESTION_LENGTH) {
    throw new Error('Question too long')
  }
}
```

### GitHub Token Security

**Never expose tokens to frontend**:

```typescript
// ❌ WRONG - Token exposed
const createPR = async (suggestion: string) => {
  const token = process.env.GITHUB_TOKEN // Exposed!
  // ...
}

// ✅ CORRECT - Server-side only
export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.accessToken) {
    return new Response('Unauthorized', { status: 401 })
  }
  
  const octokit = new Octokit({ 
    auth: session.accessToken // User's token, not global
  })
  // ...
}
```

### CORS Configuration

**Restrict API access**:
```typescript
// next.config.ts
headers: [
  {
    source: '/api/documentation/:path*',
    headers: [
      {
        key: 'Access-Control-Allow-Origin',
        value: process.env.NODE_ENV === 'production'
          ? 'https://sacred-madness.vercel.app'
          : 'http://localhost:3000'
      }
    ]
  }
]
```

---

## 💰 Cost Analysis

### API Usage Projections

**Assumptions**:
- 1,000 monthly active users
- Average 10 questions per user/month
- 30% cache hit rate

#### Tavily API Costs

| Tier | Requests/Month | Cost/Request | Monthly Cost |
|------|---------------|--------------|--------------|
| **Free** | 1,000 | $0 | $0 |
| **Starter** | 10,000 | $0.005 | $50 |
| **Pro** | 100,000 | $0.003 | $300 |

**Calculation**:
- Total questions: 1,000 users × 10 = 10,000
- Cache hit (30%): 3,000 cached = $0
- API calls needed: 7,000 × $0.005 = **$35/month**

**With 10,000 users**: 70,000 API calls × $0.003 = **$210/month**

#### Claude Sonnet 4.5 Costs (via OpenRouter)

| Model | Input Price | Output Price |
|-------|------------|--------------|
| Claude Sonnet 4.5 | $3/M tokens | $15/M tokens |

**Per Request Calculation**:
- Input: 2,000 chars selection + 500 chars question + 1,000 chars context = 3,500 chars ≈ 875 tokens
- Output: 1,500 tokens (improved text + explanation)
- Cost: (875 × $3/1M) + (1,500 × $15/1M) = **$0.025 per request**

**Monthly Cost**:
- 10,000 requests × $0.025 = **$250/month**
- With 10,000 users: **$2,500/month**

#### Vercel Infrastructure Costs

| Service | Free Tier | Overage Cost |
|---------|-----------|--------------|
| **Vercel KV** | 30k commands/day | $0.20/100k commands |
| **Vercel Postgres** | 60 compute hours | $0.10/compute hour |
| **Vercel Hosting** | 100GB bandwidth | $20/100GB |

**Estimated Monthly**:
- KV: Within free tier (cache + rate limiting)
- Postgres: ~100 hours/month = $40
- Bandwidth: Within free tier

#### GitHub API (Free)

- 5,000 requests/hour (authenticated)
- PRs are free

### Total Monthly Costs

| User Scale | Tavily | Claude | Vercel | **Total** |
|-----------|--------|--------|--------|----------|
| **1,000 users** | $35 | $250 | $40 | **$325** |
| **5,000 users** | $105 | $1,250 | $100 | **$1,455** |
| **10,000 users** | $210 | $2,500 | $200 | **$2,910** |

### Cost Optimization Strategies

1. **Aggressive Caching**
   - Increase cache TTL to 7 days
   - Cache similar queries (fuzzy matching)
   - Pre-compute common research topics

2. **Smart API Usage**
   - Only call Tavily for academic questions
   - Use Claude 3.5 Haiku ($1/M tokens) for simple clarifications
   - Batch multiple questions

3. **Freemium Model**
   - Free: 5 questions/month
   - Pro: Unlimited ($5/month)
   - Revenue: 20% conversion × 10,000 users × $5 = **$10,000/month**

4. **Alternative Models**
   - Use open-source models (Llama 3.1) for initial draft
   - Only use Claude for final polish
   - Cost reduction: ~60%

---

## 🧪 Testing Strategy

### Unit Tests (Vitest)

**Coverage Target: 90%+**

```typescript
// __tests__/hooks/useTextSelection.test.ts
describe('useTextSelection', () => {
  it('captures text selection on mouseup', () => {
    const { result } = renderHook(() => useTextSelection())
    
    // Simulate text selection
    const range = document.createRange()
    range.selectNodeContents(document.body)
    window.getSelection()?.addRange(range)
    
    fireEvent.mouseUp(document)
    
    expect(result.current.selectedText).toBeTruthy()
    expect(result.current.selectionRect).toBeDefined()
  })
  
  it('clears selection when user clicks outside', () => {
    // Test logic
  })
  
  it('validates selection length', () => {
    // Test min/max length validation
  })
})

// __tests__/api/ask.test.ts
describe('POST /api/documentation/ask', () => {
  it('returns cached results when available', async () => {
    await kv.set('research:abc123', mockResearchData)
    
    const response = await POST(mockRequest)
    const data = await response.json()
    
    expect(data.cacheHit).toBe(true)
    expect(data.sources).toEqual(mockResearchData.sources)
  })
  
  it('enforces rate limiting', async () => {
    // Make 11 requests rapidly
    const requests = Array(11).fill(null).map(() => POST(mockRequest))
    const responses = await Promise.all(requests)
    
    expect(responses[10].status).toBe(429)
  })
  
  it('sanitizes malicious input', async () => {
    const maliciousRequest = {
      selectedText: '<script>alert("xss")</script>',
      question: 'javascript:alert(1)'
    }
    
    const response = await POST(createRequest(maliciousRequest))
    // Assert sanitization
  })
})
```

### Integration Tests

**Test full pipeline**:

```typescript
// __tests__/integration/research-to-pr.test.ts
describe('Text Selection → PR Creation Flow', () => {
  it('completes end-to-end workflow', async () => {
    // 1. Mock authentication
    const session = await createTestSession()
    
    // 2. Select text and ask question
    const askResponse = await fetch('/api/documentation/ask', {
      method: 'POST',
      body: JSON.stringify({
        selectedText: 'Byzantine saloi were holy fools',
        question: 'Can you expand on this?',
        pageSlug: 'holy-fools'
      }),
      headers: { Cookie: session.cookie }
    })
    
    const { questionId, suggestion } = await askResponse.json()
    
    // 3. Create PR
    const prResponse = await fetch('/api/documentation/generate-pr', {
      method: 'POST',
      body: JSON.stringify({
        questionId,
        suggestion,
        pageSlug: 'holy-fools'
      }),
      headers: { Cookie: session.cookie }
    })
    
    const { prUrl } = await prResponse.json()
    
    // 4. Verify PR was created on GitHub
    const octokit = new Octokit({ auth: GITHUB_TEST_TOKEN })
    const pr = await octokit.pulls.get({
      owner: 'test-org',
      repo: 'abdal-research-website',
      pull_number: extractPRNumber(prUrl)
    })
    
    expect(pr.data.title).toContain('AI-Assisted Documentation')
    expect(pr.data.body).toContain('Byzantine saloi')
  })
})
```

### E2E Tests (Playwright)

```typescript
// e2e/text-selection-flow.spec.ts
test('user can select text and create PR', async ({ page, context }) => {
  // 1. Sign in with GitHub
  await page.goto('/wiki/holy-fools')
  await page.click('text=Sign in')
  await authenticateGitHub(page, context)
  
  // 2. Select text
  await page.locator('article').evaluate((el) => {
    const range = document.createRange()
    range.setStart(el.firstChild, 0)
    range.setEnd(el.firstChild, 50)
    window.getSelection()?.addRange(range)
  })
  
  // 3. Click "Ask about this" button
  await page.click('button:has-text("Ask about this")')
  
  // 4. Enter question
  await page.fill('textarea[placeholder*="What would you like"]', 
    'Can you add academic citations?')
  await page.click('button:has-text("Research & Suggest")')
  
  // 5. Wait for research to complete
  await page.waitForSelector('text=Suggested Improvement', { 
    timeout: 30000 
  })
  
  // 6. Review and create PR
  await page.click('button:has-text("Create Pull Request")')
  
  // 7. Verify success
  await expect(page.locator('text=Pull request created')).toBeVisible()
  const prLink = await page.locator('a[href*="github.com"]').getAttribute('href')
  expect(prLink).toContain('/pull/')
})
```

### Performance Tests

**Load Testing with k6**:

```javascript
// load-test/ask-endpoint.js
import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp to 100 users
    { duration: '5m', target: 100 }, // Stay at 100
    { duration: '2m', target: 0 }    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% under 2s
    http_req_failed: ['rate<0.01']     // <1% errors
  }
}

export default function () {
  const payload = JSON.stringify({
    selectedText: 'Test selected text for load testing',
    question: 'Can you improve this?',
    pageSlug: 'test-page'
  })
  
  const res = http.post('http://localhost:3000/api/documentation/ask', payload, {
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${__ENV.TEST_TOKEN}`
    }
  })
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response has suggestion': (r) => JSON.parse(r.body).suggestion !== undefined
  })
  
  sleep(1)
}
```

### Test Coverage Requirements

| Layer | Tool | Target Coverage |
|-------|------|----------------|
| **Unit Tests** | Vitest | 90%+ |
| **Integration** | Vitest | 80%+ |
| **E2E** | Playwright | Critical paths |
| **Performance** | k6 | All endpoints |

---

## ⚠️ Risk Assessment & Mitigation

### High-Priority Risks

#### 1. API Cost Overrun

**Risk**: Claude/Tavily costs exceed budget  
**Probability**: High  
**Impact**: High

**Mitigation**:
- Implement strict rate limiting
- Set up cost alerts (Vercel dashboard)
- Cache aggressively (7-day TTL)
- Use cheaper models for drafts
- Require user confirmation before expensive operations

**Monitoring**:
```typescript
// Log API costs to analytics
await analytics.track('api_usage', {
  endpoint: 'ask',
  provider: 'claude',
  estimated_cost: 0.025,
  cached: false
})
```

#### 2. GitHub API Rate Limits

**Risk**: Hit 5,000 requests/hour limit  
**Probability**: Medium  
**Impact**: High

**Mitigation**:
- Queue PR creation (max 3/hour per user)
- Batch operations when possible
- Use GraphQL API (more efficient)
- Monitor rate limit headers
- Implement exponential backoff

**Code**:
```typescript
const remainingRequests = response.headers.get('X-RateLimit-Remaining')
if (Number(remainingRequests) < 100) {
  await notifyAdmins('GitHub rate limit low')
}
```

#### 3. Spam/Abuse

**Risk**: Users create low-quality PRs  
**Probability**: Medium  
**Impact**: Medium

**Mitigation**:
- Reputation system (new users limited)
- Manual review queue for first 3 PRs
- AI quality scoring
- Community moderation tools
- Report/flag functionality

**Quality Check**:
```typescript
function assessSuggestionQuality(suggestion: string): number {
  let score = 0
  
  // Check length (not too short/long)
  if (suggestion.length > 50 && suggestion.length < 1000) score += 0.3
  
  // Check for sources
  if (suggestion.includes('http')) score += 0.2
  
  // Check readability (Flesch score)
  const readability = calculateReadability(suggestion)
  if (readability > 60) score += 0.3
  
  // Claude confidence
  score += claudeConfidence * 0.2
  
  return score // 0-1
}

// Require manual review if score < 0.7
if (qualityScore < 0.7) {
  await flagForReview(contributionId)
}
```

#### 4. Data Privacy

**Risk**: Exposing user research queries  
**Probability**: Low  
**Impact**: High

**Mitigation**:
- Encrypt questions in database
- Anonymize for analytics
- GDPR compliance (user data export/delete)
- Clear privacy policy
- No storing of GitHub tokens (use session only)

**Encryption**:
```typescript
import { encrypt, decrypt } from '@/lib/crypto'

// Store encrypted
await db.questions.create({
  question: encrypt(userQuestion),
  selected_text: encrypt(selectedText)
})

// Retrieve decrypted
const question = decrypt(dbQuestion.question)
```

### Medium-Priority Risks

#### 5. Performance Degradation

**Risk**: Slow response times at scale  
**Mitigation**: 
- CDN for static assets
- Database query optimization (indexes)
- Implement request queuing
- Horizontal scaling (Vercel auto-scales)

#### 6. Merge Conflicts

**Risk**: PRs conflict with main branch  
**Mitigation**:
- Auto-rebase before creating PR
- Notify user of conflicts
- Provide conflict resolution UI

### Low-Priority Risks

#### 7. Browser Compatibility

**Risk**: Text selection fails on older browsers  
**Mitigation**: 
- Polyfills for Range API
- Fallback UI for unsupported browsers
- Progressive enhancement

---

## 📊 Success Metrics & KPIs

### Product Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **User Adoption** | 30% of active users try feature | Track unique users who select text |
| **PR Creation Rate** | 10% of questions → PRs | `(PRs created / questions asked) × 100` |
| **PR Merge Rate** | 60% of PRs merged | `(merged PRs / total PRs) × 100` |
| **User Retention** | 40% return within 7 days | Track returning users |

### Technical Metrics

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| **API Response Time** | p95 < 2s | p95 > 3s |
| **Cache Hit Rate** | >40% | <30% |
| **Error Rate** | <0.5% | >1% |
| **API Cost per Question** | <$0.10 | >$0.15 |

### Quality Metrics

| Metric | Target | Tracking |
|--------|--------|----------|
| **Suggestion Quality Score** | >0.75 | AI + human review |
| **User Satisfaction** | >4/5 stars | Post-PR survey |
| **Time to PR** | <3 minutes | From selection to PR created |

**Tracking Implementation**:
```typescript
// app/analytics/track.ts
export async function trackEvent(event: AnalyticsEvent) {
  await fetch('/api/analytics', {
    method: 'POST',
    body: JSON.stringify({
      event: event.name,
      properties: {
        user_id: event.userId,
        timestamp: Date.now(),
        ...event.data
      }
    })
  })
}

// Usage
await trackEvent({
  name: 'question_asked',
  userId: session.user.id,
  data: {
    page_slug: pageSlug,
    question_length: question.length,
    cache_hit: cacheHit
  }
})
```

---

## 🚀 Deployment Plan

### Pre-Deployment Checklist

#### Environment Setup
- [ ] Create Vercel project
- [ ] Configure environment variables:
  ```bash
  GITHUB_CLIENT_ID=...
  GITHUB_CLIENT_SECRET=...
  OPENROUTER_API_KEY=...
  TAVILY_API_KEY=...
  DATABASE_URL=...
  KV_URL=...
  NEXTAUTH_SECRET=...
  NEXTAUTH_URL=https://sacred-madness.vercel.app
  ```
- [ ] Set up Vercel Postgres database
- [ ] Set up Vercel KV store
- [ ] Run database migrations

#### GitHub Setup
- [ ] Create OAuth App in GitHub
- [ ] Set callback URL: `https://sacred-madness.vercel.app/api/auth/callback/github`
- [ ] Generate webhook secret (for PR status updates)
- [ ] Set up GitHub App (alternative to OAuth for better permissions)

#### Security
- [ ] Enable security headers (already in `next.config.ts`)
- [ ] Set up HTTPS (Vercel auto-provisions)
- [ ] Configure CORS
- [ ] Set up rate limiting
- [ ] Enable DDoS protection (Vercel Pro)

### Deployment Stages

#### Stage 1: Beta (Week 9)

**Limited Release**:
- Deploy to production
- Enable for 50 beta testers
- Feature flag: `ENABLE_TEXT_SELECTION=true`
- Monitor closely for 1 week

**Monitoring**:
```typescript
// Feature flag check
const isFeatureEnabled = () => {
  return process.env.ENABLE_TEXT_SELECTION === 'true' &&
         betaUsers.includes(session.user.id)
}
```

#### Stage 2: Gradual Rollout (Week 10)

**Incremental Access**:
- Day 1-2: 10% of users
- Day 3-4: 25% of users
- Day 5-6: 50% of users
- Day 7: 100% of users

**Implementation**:
```typescript
// Gradual rollout using user ID hash
const hasAccess = (userId: string) => {
  const hash = crypto.createHash('md5').update(userId).digest('hex')
  const percentage = parseInt(hash.substring(0, 8), 16) % 100
  return percentage < ROLLOUT_PERCENTAGE
}
```

#### Stage 3: Full Production (Week 11)

**Go Live**:
- Remove feature flags
- Announce on social media
- Write blog post
- Update documentation

### Monitoring & Alerting

**Set up alerts** (Vercel, Sentry, or PagerDuty):

```typescript
// Alerting thresholds
const ALERTS = {
  error_rate: 0.01,        // >1% error rate
  response_time: 3000,     // >3s p95 response time
  api_cost_per_hour: 10,   // >$10/hour API costs
  db_connections: 50       // >50 active DB connections
}

// Example alert
if (metrics.errorRate > ALERTS.error_rate) {
  await sendAlert({
    channel: 'slack',
    severity: 'high',
    message: `Error rate ${metrics.errorRate} exceeds threshold`
  })
}
```

### Rollback Plan

**If critical issues arise**:

1. **Immediate**: Disable feature flag
2. **5 minutes**: Deploy previous version
3. **15 minutes**: Investigate root cause
4. **1 hour**: Communicate with users

**Rollback Script**:
```bash
#!/bin/bash
# rollback.sh

echo "Rolling back to previous deployment..."
vercel rollback --yes

echo "Disabling feature flag..."
vercel env rm ENABLE_TEXT_SELECTION production

echo "Rollback complete"
```

---

## 📚 Documentation Requirements

### User Documentation

1. **Getting Started Guide**
   - How to select text
   - Asking good questions
   - Understanding AI suggestions
   - Creating your first PR

2. **Best Practices**
   - Writing effective questions
   - Selecting appropriate text
   - Reviewing AI suggestions
   - Contributing guidelines

3. **FAQ**
   - How does the AI research work?
   - Why was my PR rejected?
   - How are contributions tracked?
   - Data privacy & security

### Developer Documentation

1. **Architecture Overview**
   - System diagram
   - Component hierarchy
   - Data flow
   - API contracts

2. **Setup Guide**
   - Local development
   - Environment variables
   - Database setup
   - Testing

3. **API Reference**
   - Endpoint specifications
   - Request/response schemas
   - Authentication
   - Rate limits

4. **Contribution Guide**
   - Code style
   - Testing requirements
   - PR process
   - Review checklist

---

## 🎯 Next Steps

### Immediate Actions (This Week)

1. **Review & Approve Architecture**
   - Stakeholder review of this document
   - Finalize technology choices
   - Approve budget allocation

2. **Team Assembly**
   - Assign developers to project
   - Set up communication channels
   - Schedule kickoff meeting

3. **Environment Setup**
   - Create Vercel project
   - Provision databases
   - Configure GitHub OAuth

### Week 1 Actions

1. **Start Phase 1 Development**
   - Set up Zustand store
   - Build text selection hook
   - Create UI components

2. **Set Up Monitoring**
   - Configure analytics
   - Set up error tracking
   - Create dashboards

3. **Write Initial Tests**
   - Unit test setup
   - Integration test framework
   - E2E test configuration

---

## 📝 Appendix

### A. Database Migration Scripts

```sql
-- migrations/001_create_users.sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  github_id INTEGER UNIQUE NOT NULL,
  github_username VARCHAR(255) NOT NULL,
  github_name VARCHAR(255),
  github_avatar_url TEXT,
  email VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP DEFAULT NOW(),
  total_contributions INTEGER DEFAULT 0,
  reputation_points INTEGER DEFAULT 0
);

-- migrations/002_create_questions.sql
-- ... (see Database Schema section)
```

### B. Environment Variables

```bash
# .env.local
# GitHub OAuth
GITHUB_CLIENT_ID=Iv1.abcd1234
GITHUB_CLIENT_SECRET=secret123
GITHUB_WEBHOOK_SECRET=webhook_secret

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generated_secret_32_chars

# AI Services
OPENROUTER_API_KEY=sk-or-v1-...
TAVILY_API_KEY=tvly-...

# Database
DATABASE_URL=postgresql://user:pass@host/db
KV_URL=redis://default:pass@host:port
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...

# Feature Flags
ENABLE_TEXT_SELECTION=true
ROLLOUT_PERCENTAGE=100
```

### C. Useful Resources

- [NextAuth.js v5 Docs](https://authjs.dev/)
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
- [Vercel KV](https://vercel.com/docs/storage/vercel-kv)
- [Octokit REST API](https://octokit.github.io/rest.js/)
- [Tavily API](https://docs.tavily.com/)
- [Claude API (OpenRouter)](https://openrouter.ai/docs)
- [Zustand State Management](https://zustand-demo.pmnd.rs/)

---

**Document Version**: 1.0  
**Last Updated**: 2025-10-04  
**Author**: Kilo Code (Architecture Mode)  
**Status**: Ready for Review

---

## ✅ Architecture Review Checklist

Before proceeding to implementation, ensure:

- [ ] All stakeholders have reviewed this document
- [ ] Technology choices are approved
- [ ] Budget is allocated ($325-$2,910/month based on scale)
- [ ] Team is assembled and ready
- [ ] Security considerations are addressed
- [ ] Testing strategy is comprehensive
- [ ] Deployment plan is clear
- [ ] Success metrics are defined
- [ ] Risks are identified and mitigated

**Ready to implement?** Switch to Code mode and begin Phase 1! 🚀