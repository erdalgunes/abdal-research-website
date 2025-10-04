# Security & Error Handling Implementation

This document outlines the security headers and error boundaries implemented in the abdal-research-website.

## 🛡️ Security Headers

### Content Security Policy (CSP)
Implemented in [`next.config.ts`](./next.config.ts:39) to prevent XSS attacks and control resource loading:

- **Default Source**: `'self'` - Only allow resources from same origin
- **Scripts**: Allow Next.js, Vercel, and necessary inline scripts
- **Styles**: Allow Tailwind, inline styles, and Google Fonts
- **Images**: Allow self-hosted, data URLs, and HTTPS sources
- **Fonts**: Allow Google Fonts and self-hosted fonts
- **Connect**: Allow API calls to OpenRouter and Tavily external services
- **Frame Ancestors**: `'none'` - Prevent embedding (clickjacking protection)
- **Upgrade Insecure Requests**: Force HTTPS connections

### Additional Security Headers

1. **X-Frame-Options**: `DENY`
   - Prevents clickjacking attacks by blocking iframe embedding

2. **X-Content-Type-Options**: `nosniff`
   - Prevents MIME sniffing attacks

3. **Referrer-Policy**: `origin-when-cross-origin`
   - Controls referrer information sent to external sites

4. **X-DNS-Prefetch-Control**: `on`
   - Enables DNS prefetching for performance

5. **Permissions-Policy**
   - Restricts camera, microphone, geolocation access
   - Disables interest-cohort (FLoC)

6. **Strict-Transport-Security** (Production only)
   - Enforces HTTPS: `max-age=31536000; includeSubDomains; preload`

7. **X-XSS-Protection**: `1; mode=block`
   - Legacy XSS protection

8. **X-Permitted-Cross-Domain-Policies**: `none`
   - Prevents Adobe Flash/PDF plugins

### CORS Configuration

API routes have specific CORS headers in [`next.config.ts`](./next.config.ts:97):
- **Access-Control-Allow-Origin**: Production domain or localhost
- **Access-Control-Allow-Methods**: GET, POST, PUT, DELETE, OPTIONS
- **Access-Control-Allow-Headers**: Content-Type, Authorization, X-Requested-With
- **Access-Control-Max-Age**: 24 hours

## 🚨 Error Boundaries

### Global Error Boundary
[`components/ErrorBoundary.tsx`](./components/ErrorBoundary.tsx) - Reusable error boundary with:
- Graceful error display with user-friendly messages
- Error logging and reporting
- Fallback UI that doesn't break the experience
- Recovery mechanisms (retry functionality)
- Development mode error details
- Production mode error reporting hooks

### Specialized Error Boundaries

#### 1. AI Chat Error Boundary
[`components/error-boundaries/AIChatErrorBoundary.tsx`](./components/error-boundaries/AIChatErrorBoundary.tsx)
- Wraps AI Chat component
- Handles API failures gracefully
- Shows specific error messages for:
  - Network connectivity issues
  - API service unavailability
  - Configuration problems
- Provides retry functionality

#### 2. MDX Error Boundary
[`components/error-boundaries/MDXErrorBoundary.tsx`](./components/error-boundaries/MDXErrorBoundary.tsx)
- Wraps MDX content rendering
- Handles malformed MDX syntax
- Shows helpful error messages with possible causes:
  - Malformed MDX syntax
  - Missing/invalid component imports
  - Corrupted content files
  - Incompatible markdown extensions
- Provides navigation options

#### 3. Wiki Layout Error Boundary
[`components/error-boundaries/WikiLayoutErrorBoundary.tsx`](./components/error-boundaries/WikiLayoutErrorBoundary.tsx)
- Wraps entire wiki layout
- Handles critical layout failures
- Provides multiple recovery options:
  - Refresh page
  - Return to home
  - Browse other wiki content

### Usage Example

```tsx
import { AIChatErrorBoundary, MDXErrorBoundary, WikiLayoutErrorBoundary } from '@/components/error-boundaries'

// In wiki pages
<WikiLayoutErrorBoundary>
  <WikiLayout>
    <MDXErrorBoundary contentTitle={title}>
      <MDXRemote source={content} />
    </MDXErrorBoundary>
  </WikiLayout>
</WikiLayoutErrorBoundary>

<AIChatErrorBoundary>
  <AIChat />
</AIChatErrorBoundary>
```

## 🔒 API Error Handling

### API Error Handler
[`lib/api-error-handler.ts`](./lib/api-error-handler.ts) provides:

1. **Custom Error Class**: `APIError` with status codes and error codes
2. **Error Handler**: Centralized error handling with logging
3. **Request Validation**: Field validation helper
4. **Rate Limiting**: Basic rate limiting implementation
5. **Security Helpers**: 
   - Input sanitization
   - Origin validation

### Rate Limits
- AI Chat API: 20 requests/minute
- Search API: 30 requests/minute
- Graph API: 60 requests/minute

### API Route Implementation

All API routes now use improved error handling:

#### AI Chat Route
[`app/api/ai/chat/route.ts`](./app/api/ai/chat/route.ts)
- Origin validation
- Rate limiting
- Input sanitization (max 2000 chars)
- API key validation
- Detailed error responses

#### Search Route
[`app/api/search/route.ts`](./app/api/search/route.ts)
- Query validation (2-100 chars)
- Rate limiting
- Result limiting (max 50 results)
- Individual file error handling

#### Graph Route
[`app/api/graph/route.ts`](./app/api/graph/route.ts)
- Read-only rate limiting
- Graph availability validation
- Comprehensive error handling

## 🧪 Testing Security

### Verify Security Headers

1. **Browser DevTools**:
   ```bash
   # Open DevTools > Network tab
   # Select any request
   # Check Response Headers section
   ```

2. **Command Line**:
   ```bash
   curl -I http://localhost:3000
   ```

3. **Online Tools**:
   - [Security Headers](https://securityheaders.com/)
   - [Mozilla Observatory](https://observatory.mozilla.org/)

### Expected Headers in Response

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: origin-when-cross-origin
X-DNS-Prefetch-Control: on
Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live; ...
X-XSS-Protection: 1; mode=block
X-Permitted-Cross-Domain-Policies: none
X-Powered-By: Sacred Madness Wiki
```

### Testing Error Boundaries

1. **Force Component Error**:
   ```tsx
   // Temporarily throw error in component
   throw new Error('Test error boundary')
   ```

2. **Test API Errors**:
   ```bash
   # Missing API key
   curl http://localhost:3000/api/ai/chat -X POST -H "Content-Type: application/json" -d '{"message":"test"}'
   
   # Rate limit
   # Make 25 requests rapidly to /api/ai/chat
   
   # Invalid input
   curl "http://localhost:3000/api/search?q="
   ```

## 🔐 Security Best Practices

1. **Environment Variables**: Never commit API keys
   ```env
   OPENROUTER_API_KEY=your_key_here
   TAVILY_API_KEY=your_key_here
   ```

2. **CSP Updates**: When adding new external services, update CSP in [`next.config.ts`](./next.config.ts)

3. **Error Logging**: In production, integrate with error monitoring:
   - Sentry
   - LogRocket
   - Datadog

4. **Regular Updates**: Keep dependencies updated for security patches

## 📊 Monitoring

### Production Error Monitoring

Add error reporting in production:

```tsx
// In ErrorBoundary.tsx
if (process.env.NODE_ENV === 'production') {
  // Sentry.captureException(error)
  // or other error reporting service
}
```

### API Error Logging

API errors are logged with context:
```tsx
console.error('API Error:', {
  context: 'AI Chat API',
  error: error.message,
  stack: error.stack,
  timestamp: new Date().toISOString()
})
```

## 🚀 Deployment Checklist

- [ ] Environment variables configured
- [ ] CSP allows all required external resources
- [ ] HSTS enabled (production only)
- [ ] Error reporting service integrated
- [ ] Rate limiting appropriate for traffic
- [ ] CORS origins restricted to production domain
- [ ] All error boundaries tested
- [ ] Security headers verified

## 📚 References

- [Next.js Security Headers](https://nextjs.org/docs/advanced-features/security-headers)
- [OWASP Security Headers](https://owasp.org/www-project-secure-headers/)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)