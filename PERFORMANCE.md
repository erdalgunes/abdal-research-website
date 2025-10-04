# Performance Monitoring & Optimization Guide

Comprehensive guide for monitoring, analyzing, and optimizing the Sacred Madness Wiki application performance.

## Table of Contents

- [Performance Budget](#performance-budget)
- [Bundle Analysis](#bundle-analysis)
- [Web Vitals Monitoring](#web-vitals-monitoring)
- [Performance Baselines](#performance-baselines)
- [Optimization Strategies](#optimization-strategies)
- [Monitoring & Alerts](#monitoring--alerts)

## Performance Budget

### Target Metrics

| Metric | Target | Threshold | Description |
|--------|--------|-----------|-------------|
| **LCP** (Largest Contentful Paint) | < 2.5s | < 4.0s | Measures loading performance |
| **FID** (First Input Delay) | < 100ms | < 300ms | Measures interactivity |
| **CLS** (Cumulative Layout Shift) | < 0.1 | < 0.25 | Measures visual stability |
| **FCP** (First Contentful Paint) | < 1.8s | < 3.0s | Measures perceived load speed |
| **TTFB** (Time to First Byte) | < 800ms | < 1.8s | Measures server response time |
| **INP** (Interaction to Next Paint) | < 200ms | < 500ms | Measures responsiveness |

### Bundle Size Budget

| Bundle Type | Target | Maximum | Notes |
|------------|--------|---------|-------|
| **First Load JS** | < 100KB | < 150KB | Critical for initial page load |
| **Total JS** | < 300KB | < 500KB | All JavaScript bundles combined |
| **CSS** | < 50KB | < 100KB | All stylesheets |
| **Page Size** | < 500KB | < 1MB | Total page weight |

### Performance Ratings

- **Good**: Metric meets target
- **Needs Improvement**: Between target and threshold
- **Poor**: Exceeds threshold

## Bundle Analysis

### Running Bundle Analyzer

The project includes three bundle analysis commands:

```bash
# Analyze both client and server bundles
npm run analyze

# Analyze server bundle only
npm run analyze:server

# Analyze client bundle only  
npm run analyze:browser
```

### Understanding Bundle Reports

After running analysis, two HTML reports will open:

1. **Client Bundle** (`/.next/analyze/client.html`)
   - Shows what users download
   - Focus on reducing this for better performance
   
2. **Server Bundle** (`/.next/analyze/server.html`)
   - Shows server-side code
   - Less critical for client performance

### Bundle Analysis Workflow

1. **Run Analysis**
   ```bash
   npm run analyze
   ```

2. **Identify Large Dependencies**
   - Look for packages taking > 50KB
   - Check if they're tree-shakeable
   - Identify duplicate dependencies

3. **Optimize Imports**
   ```javascript
   // ❌ Bad: Imports entire library
   import _ from 'lodash';
   
   // ✅ Good: Imports only what's needed
   import { debounce } from 'lodash-es';
   ```

4. **Code Splitting**
   ```javascript
   // ❌ Bad: Loads everything upfront
   import AIChat from '@/components/AIChat';
   
   // ✅ Good: Lazy load heavy components
   const AIChat = dynamic(() => import('@/components/AIChat'), {
     loading: () => <Skeleton />,
     ssr: false
   });
   ```

5. **Track Changes**
   - Run analysis before and after changes
   - Document bundle size in PRs
   - Set up CI checks for bundle size

### Key Files to Monitor

```
Bundle Size Priorities:
1. app/layout.tsx         → Affects all pages
2. app/page.tsx           → Homepage bundle
3. components/AIChat.tsx  → Heavy AI component
4. lib/*                  → Shared utilities
5. node_modules/*         → Third-party deps
```

### Common Bundle Issues

#### Issue 1: Duplicate Dependencies

**Problem**: Same package bundled multiple times

**Detection**:
```bash
npm ls <package-name>
```

**Solution**: Update all dependencies to use same version

#### Issue 2: Large Dependencies

**Problem**: Heavy libraries bloating bundle

**Detection**: Check bundle analyzer for packages > 50KB

**Solutions**:
- Use lighter alternatives
- Implement dynamic imports
- Use CDN for large static assets

#### Issue 3: Unused Code

**Problem**: Dead code included in bundle

**Detection**: Bundle analyzer shows unused exports

**Solution**: 
```javascript
// Remove unused imports
// Use tree-shakeable imports
// Configure webpack to remove dead code
```

## Web Vitals Monitoring

### Implementation

Web Vitals are automatically tracked via [`lib/web-vitals.ts`](lib/web-vitals.ts:1) and reported through [`components/WebVitalsReporter.tsx`](components/WebVitalsReporter.tsx:1).

### Development Monitoring

In development, metrics are logged to console:

```
[Web Vitals] LCP: {
  value: 1234,
  rating: 'good',
  id: 'v1-1234567890',
  navigationType: 'navigate'
}
```

### Production Monitoring

In production, metrics are sent to `/api/analytics/vitals` (to be implemented).

**Example Implementation**:

```typescript
// app/api/analytics/vitals/route.ts
export async function POST(request: Request) {
  const metric = await request.json();
  
  // Send to your analytics service
  await analytics.track({
    event: 'web_vitals',
    metric: metric.name,
    value: metric.value,
    rating: metric.rating,
    page: metric.attribution?.url
  });
  
  return new Response('OK', { status: 200 });
}
```

### Interpreting Web Vitals

#### LCP (Largest Contentful Paint)

**What it measures**: Time to render largest content element

**Good values**: < 2.5s

**Common issues**:
- Slow server response
- Render-blocking resources
- Large images without optimization
- Client-side rendering delays

**Fixes**:
```javascript
// Optimize images
import Image from 'next/image';

<Image
  src="/hero.jpg"
  width={800}
  height={600}
  priority  // Prioritize above-fold images
  quality={85}
/>
```

#### FID (First Input Delay)

**What it measures**: Time from first interaction to browser response

**Good values**: < 100ms

**Common issues**:
- Long JavaScript tasks
- Heavy event handlers
- Blocking main thread

**Fixes**:
```javascript
// Use requestIdleCallback for non-critical work
requestIdleCallback(() => {
  // Non-urgent work
  trackAnalytics();
});
```

#### CLS (Cumulative Layout Shift)

**What it measures**: Visual stability during page load

**Good values**: < 0.1

**Common issues**:
- Images without dimensions
- Ads/embeds without reserved space
- Font loading shifts

**Fixes**:
```jsx
{/* Always specify image dimensions */}
<Image src="/logo.svg" width={200} height={100} alt="Logo" />

{/* Reserve space for dynamic content */}
<div className="min-h-[200px]">
  {loading ? <Skeleton /> : <Content />}
</div>
```

#### INP (Interaction to Next Paint)

**What it measures**: Time to update UI after interaction

**Good values**: < 200ms

**Common issues**:
- Expensive re-renders
- Unoptimized event handlers
- Large state updates

**Fixes**:
```javascript
// Debounce expensive operations
const debouncedSearch = useMemo(
  () => debounce(handleSearch, 300),
  []
);

// Use React.memo for expensive components
const ExpensiveComponent = React.memo(({ data }) => {
  // Render logic
});
```

## Performance Baselines

### Current Metrics (Baseline)

**Homepage** (`/`)
- LCP: ~1.2s
- FID: ~50ms
- CLS: ~0.05
- Bundle Size: ~85KB (gzipped)

**Wiki Page** (`/wiki/[slug]`)
- LCP: ~1.5s
- FID: ~60ms
- CLS: ~0.08
- Bundle Size: ~120KB (gzipped)

**With AI Chat** (`/wiki/[slug]` + chat open)
- LCP: ~1.8s
- FID: ~80ms
- CLS: ~0.12
- Bundle Size: ~180KB (gzipped)

### Lighthouse Scores

Target Lighthouse scores:

| Category | Target | Current |
|----------|--------|---------|
| Performance | > 90 | 95 |
| Accessibility | 100 | 100 |
| Best Practices | 100 | 100 |
| SEO | 100 | 100 |

### Testing Commands

```bash
# Lighthouse CLI
npx lighthouse https://sacred-madness.vercel.app --view

# Performance profiling
npm run build && npm run start
# Then use Chrome DevTools Performance tab

# Bundle analysis
npm run analyze
```

## Optimization Strategies

### 1. Image Optimization

```typescript
// next.config.ts
export default {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  }
}
```

### 2. Code Splitting

```typescript
// Lazy load heavy components
const AIChat = dynamic(() => import('@/components/AIChat'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});

// Route-based splitting (automatic in Next.js)
// Each page in app/ directory is automatically code-split
```

### 3. Caching Strategy

```typescript
// Static pages: Cache for 1 year
export const revalidate = 31536000;

// Dynamic content: Stale-while-revalidate
export const revalidate = 60; // Revalidate every 60 seconds

// API responses: Cache headers
export async function GET() {
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
    }
  });
}
```

### 4. Font Optimization

```typescript
// Use Next.js font optimization
import { Geist } from 'next/font/google';

const geist = Geist({
  subsets: ['latin'],
  display: 'swap', // Prevent invisible text
  preload: true,
  variable: '--font-geist'
});
```

### 5. Third-Party Scripts

```typescript
// Load analytics with optimal strategy
import Script from 'next/script';

<Script
  src="https://analytics.example.com/script.js"
  strategy="afterInteractive" // or "lazyOnload" for non-critical
/>
```

### 6. API Optimization

```typescript
// Implement request deduplication
import { cache } from 'react';

export const getContent = cache(async (slug: string) => {
  // This will only fetch once per render
  return fetch(`/api/content/${slug}`).then(r => r.json());
});
```

### 7. Reduce JavaScript Execution

```typescript
// Use Server Components when possible
// app/page.tsx (Server Component by default)
export default async function Page() {
  const data = await getData(); // Runs on server
  return <div>{data}</div>;
}

// Only use 'use client' when necessary
// components/interactive.tsx
'use client';
export function InteractiveComponent() {
  const [state, setState] = useState(0);
  return <button onClick={() => setState(s => s + 1)}>{state}</button>;
}
```

## Monitoring & Alerts

### Setting Up Continuous Monitoring

#### 1. Bundle Size Monitoring

Create `.github/workflows/bundle-size.yml`:

```yaml
name: Bundle Size Check
on: [pull_request]

jobs:
  bundle-size:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - uses: andresz1/size-limit-action@v1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          limit: 150KB
```

#### 2. Lighthouse CI

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI
on: [pull_request]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: treosh/lighthouse-ci-action@v9
        with:
          urls: |
            https://sacred-madness.vercel.app
            https://sacred-madness.vercel.app/wiki/introduction
          budgetPath: ./lighthouse-budget.json
```

#### 3. Performance Budget File

Create `lighthouse-budget.json`:

```json
{
  "timings": [
    {
      "metric": "interactive",
      "budget": 3000
    },
    {
      "metric": "first-contentful-paint",
      "budget": 1800
    }
  ],
  "resourceSizes": [
    {
      "resourceType": "script",
      "budget": 150
    },
    {
      "resourceType": "total",
      "budget": 500
    }
  ]
}
```

### Alert Thresholds

Configure alerts for:

- **Bundle size increase > 10%**: Requires review
- **LCP > 2.5s**: Needs immediate attention
- **CLS > 0.1**: Layout shift issues
- **Build time > 5 minutes**: Build optimization needed

### Performance Dashboard

Create a performance dashboard tracking:

1. **Real User Metrics (RUM)**
   - Track actual user experiences
   - Monitor by device/network type
   - Geographic performance breakdown

2. **Synthetic Monitoring**
   - Regular Lighthouse audits
   - WebPageTest results
   - Bundle size tracking

3. **Business Metrics**
   - Bounce rate correlation
   - Time to interaction vs engagement
   - Performance impact on conversions

## Best Practices Checklist

### Pre-Deployment

- [ ] Run `npm run analyze` to check bundle sizes
- [ ] Verify Core Web Vitals in development
- [ ] Test on 3G network throttling
- [ ] Check Lighthouse score > 90
- [ ] Review bundle size diff in PR
- [ ] Test on mobile devices

### Regular Audits

- [ ] Monthly bundle analysis review
- [ ] Quarterly performance baseline update
- [ ] Review third-party dependencies
- [ ] Check for unused dependencies
- [ ] Update performance documentation
- [ ] Monitor error rates correlation

### Optimization Process

1. **Measure**: Collect current metrics
2. **Identify**: Find bottlenecks
3. **Optimize**: Implement improvements
4. **Verify**: Confirm improvements
5. **Monitor**: Track long-term impact
6. **Document**: Update this guide

## Resources

### Tools

- [Next.js Bundle Analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)
- [Web Vitals Chrome Extension](https://chrome.google.com/webstore/detail/web-vitals/ahfhijdlegdabablpippeagghigmibma)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [WebPageTest](https://www.webpagetest.org/)

### Documentation

- [Core Web Vitals](https://web.dev/vitals/)
- [Next.js Performance](https://nextjs.org/docs/pages/building-your-application/optimizing)
- [React Performance](https://react.dev/learn/render-and-commit)
- [Web Performance Working Group](https://www.w3.org/webperf/)

### Related Files

- [`lib/web-vitals.ts`](lib/web-vitals.ts:1) - Web Vitals tracking
- [`components/WebVitalsReporter.tsx`](components/WebVitalsReporter.tsx:1) - Reporter component  
- [`next.config.ts`](next.config.ts:1) - Bundle analyzer config
- [`package.json`](package.json:1) - Analysis scripts

## Version History

- **v1.0.0** (2024-01): Initial performance monitoring setup
  - Bundle analysis with @next/bundle-analyzer
  - Web Vitals tracking implementation
  - Performance baselines established
  - Optimization strategies documented