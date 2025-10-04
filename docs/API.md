# Sacred Madness Wiki API Documentation

Comprehensive guide for using the Sacred Madness Wiki API endpoints.

## Table of Contents

- [Getting Started](#getting-started)
- [Authentication & Security](#authentication--security)
- [Rate Limits](#rate-limits)
- [API Endpoints](#api-endpoints)
  - [Content API](#content-api)
  - [Graph API](#graph-api)
  - [Search API](#search-api)
  - [AI Chat API](#ai-chat-api)
  - [Citations API](#citations-api)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)
- [Code Examples](#code-examples)

## Getting Started

### Base URLs

- **Production**: `https://sacred-madness.vercel.app/api`
- **Development**: `http://localhost:3000/api`

### Quick Start

```javascript
// Fetch a wiki page
const response = await fetch('https://sacred-madness.vercel.app/api/content/introduction');
const data = await response.json();
console.log(data.title, data.content);
```

## Authentication & Security

### Origin Validation

Most endpoints use origin-based validation for security:

- **Production**: Only requests from `https://sacred-madness.vercel.app` are allowed
- **Development**: Only requests from `http://localhost:3000` are allowed

### CORS Policy

The API supports the following CORS configuration:

```
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With
Access-Control-Max-Age: 86400 (24 hours)
```

### Required Headers

For POST requests:

```javascript
headers: {
  'Content-Type': 'application/json',
  'Origin': 'https://sacred-madness.vercel.app' // or localhost in dev
}
```

## Rate Limits

Each endpoint has specific rate limits to ensure fair usage:

| Endpoint | Rate Limit | Window |
|----------|-----------|--------|
| `/api/graph` | 60 requests | 1 minute |
| `/api/search` | 30 requests | 1 minute |
| `/api/ai/chat` | 20 requests | 1 minute |
| `/api/content/{slug}` | No limit | - |
| `/api/ai/citations` | No limit | - |

Rate limit information is included in response headers:

```
X-RateLimit-Policy: AI Chat: 20/min, Search: 30/min, Graph: 60/min
```

### Handling Rate Limits

When you exceed the rate limit, you'll receive a `429 Too Many Requests` response:

```json
{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMITED",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Best Practice**: Implement exponential backoff when rate limited.

## API Endpoints

### Content API

Retrieve specific wiki pages by their slug.

#### `GET /api/content/{slug}`

**Parameters:**
- `slug` (path): Page identifier (e.g., "introduction", "abdals-the-kalenderi-and-antinomian-dervishes")

**Response:**

```json
{
  "slug": "introduction",
  "title": "Introduction to Sacred Madness",
  "description": "An overview of holy foolishness and divine intoxication",
  "category": "Overview",
  "keywords": ["mysticism", "holy fool", "divine intoxication"],
  "related": ["preface", "literature"],
  "seeAlso": ["sufi-concepts-of-intoxication-and-sobriety"],
  "content": "# Introduction\n\nFull markdown content...",
  "wordCount": 1250,
  "url": "https://sacred-madness.vercel.app/wiki/introduction"
}
```

**Error Responses:**
- `404`: Page not found
- `500`: Server error

**Example:**

```javascript
async function getPage(slug) {
  try {
    const response = await fetch(`/api/content/${slug}`);
    if (!response.ok) {
      throw new Error(`Page not found: ${slug}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching page:', error);
    return null;
  }
}
```

### Graph API

Retrieve the complete knowledge graph with all pages and their relationships.

#### `GET /api/graph`

**Security**: Requires valid origin header

**Response:**

```json
{
  "nodes": [
    {
      "id": "introduction",
      "title": "Introduction to Sacred Madness",
      "category": "Overview",
      "keywords": ["mysticism", "holy fool"],
      "url": "https://sacred-madness.vercel.app/wiki/introduction"
    }
  ],
  "edges": [
    {
      "from": "introduction",
      "to": "literature"
    }
  ],
  "stats": {
    "totalPages": 45,
    "totalLinks": 127,
    "categories": ["Overview", "Historical", "Theological"]
  }
}
```

**Error Responses:**
- `403`: Invalid origin
- `429`: Rate limit exceeded (60/min)
- `503`: Graph data unavailable

**Example:**

```javascript
async function getKnowledgeGraph() {
  const response = await fetch('/api/graph');
  const graph = await response.json();
  
  // Build visualization
  const nodes = graph.nodes;
  const edges = graph.edges;
  console.log(`Graph has ${graph.stats.totalPages} pages and ${graph.stats.totalLinks} links`);
  
  return graph;
}
```

### Search API

Search across all wiki content including titles, descriptions, keywords, and full text.

#### `GET /api/search?q={query}`

**Parameters:**
- `q` (query): Search term (2-100 characters, required)

**Security**: Requires valid origin header

**Response:**

```json
{
  "query": "mysticism",
  "sanitizedQuery": "mysticism",
  "count": 12,
  "results": [
    {
      "slug": "introduction",
      "title": "Introduction to Sacred Madness",
      "description": "An overview...",
      "category": "Overview",
      "keywords": ["mysticism", "holy fool"],
      "matches": [
        "Mysticism in Orthodox Christianity...",
        "Sufi mysticism and divine intoxication..."
      ],
      "url": "https://sacred-madness.vercel.app/wiki/introduction"
    }
  ],
  "maxResults": 50
}
```

**Error Responses:**
- `400`: Invalid query (too short/long/missing)
- `403`: Invalid origin
- `429`: Rate limit exceeded (30/min)
- `503`: Content unavailable

**Example:**

```javascript
async function searchWiki(query) {
  if (!query || query.length < 2) {
    throw new Error('Query must be at least 2 characters');
  }
  
  const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
  const results = await response.json();
  
  console.log(`Found ${results.count} results for "${query}"`);
  return results.results;
}
```

### AI Chat API

Interact with an AI research assistant specialized in Sacred Madness topics.

#### `POST /api/ai/chat`

**Security**: Requires valid origin header and API key configuration

**Request Body:**

```json
{
  "message": "What is the difference between saloi and yurodivye?",
  "slug": "introduction",  // optional: current page for context
  "context": "additional context"  // optional
}
```

**Response:**

```json
{
  "message": "The saloi and yurodivye are both traditions of holy foolishness, but they have distinct characteristics..."
}
```

**Error Responses:**
- `400`: Invalid message format or length (max 2000 chars)
- `403`: Invalid origin
- `429`: Rate limit exceeded (20/min)
- `503`: AI service unavailable

**Example:**

```javascript
async function askAI(message, currentSlug = null) {
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      slug: currentSlug
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'AI request failed');
  }
  
  const data = await response.json();
  return data.message;
}
```

### Citations API

Search for academic sources and citations related to research queries.

#### `POST /api/ai/citations`

**Request Body:**

```json
{
  "query": "Byzantine holy fools mysticism"
}
```

**Response:**

```json
{
  "query": "Byzantine holy fools mysticism",
  "sources": [
    {
      "title": "Holy Fools in Byzantium and Beyond",
      "url": "https://academic-source.com/article",
      "snippet": "Relevant excerpt from the source...",
      "score": 0.95
    }
  ]
}
```

**Error Responses:**
- `400`: Query required
- `500`: Citation search failed

**Example:**

```javascript
async function findCitations(query) {
  const response = await fetch('/api/ai/citations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query })
  });
  
  const data = await response.json();
  return data.sources;
}
```

## Error Handling

### Error Response Format

All errors follow a consistent format:

```json
{
  "error": "Human-readable error message",
  "code": "MACHINE_READABLE_CODE",
  "timestamp": "2024-01-15T10:30:00Z",
  "details": {
    // Optional additional context
  }
}
```

### Common Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `RATE_LIMITED` | Rate limit exceeded | 429 |
| `INVALID_ORIGIN` | Request from unauthorized origin | 403 |
| `MISSING_QUERY` | Required query parameter missing | 400 |
| `INVALID_QUERY` | Query format invalid | 400 |
| `QUERY_TOO_LONG` | Query exceeds max length | 400 |
| `INVALID_MESSAGE` | Chat message invalid | 400 |
| `SERVICE_UNAVAILABLE` | External service unavailable | 503 |
| `GRAPH_BUILD_FAILED` | Graph generation failed | 503 |
| `AI_SERVICE_ERROR` | AI service error | varies |
| `CONTENT_UNAVAILABLE` | Content directory inaccessible | 503 |

### Error Handling Example

```javascript
async function handleAPIRequest(url, options = {}) {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const error = await response.json();
      
      // Handle specific error codes
      switch (error.code) {
        case 'RATE_LIMITED':
          console.warn('Rate limit exceeded, waiting...');
          await new Promise(resolve => setTimeout(resolve, 60000));
          return handleAPIRequest(url, options); // Retry
          
        case 'INVALID_ORIGIN':
          throw new Error('Unauthorized origin');
          
        default:
          throw new Error(error.error || 'API request failed');
      }
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}
```

## Best Practices

### 1. Input Sanitization

Always validate and sanitize user input:

```javascript
function sanitizeQuery(query) {
  // Trim whitespace
  query = query.trim();
  
  // Check length
  if (query.length < 2 || query.length > 100) {
    throw new Error('Query must be 2-100 characters');
  }
  
  // Remove potentially harmful characters
  query = query.replace(/[<>]/g, '');
  
  return query;
}
```

### 2. Implement Retry Logic

Handle transient failures gracefully:

```javascript
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return await response.json();
      
      if (response.status === 429) {
        // Exponential backoff for rate limits
        await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
        continue;
      }
      
      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}
```

### 3. Cache Responses

Cache static content to reduce API calls:

```javascript
const cache = new Map();

async function getCachedContent(slug) {
  if (cache.has(slug)) {
    return cache.get(slug);
  }
  
  const data = await fetch(`/api/content/${slug}`).then(r => r.json());
  cache.set(slug, data);
  
  return data;
}
```

### 4. Batch Requests

When possible, batch related requests:

```javascript
async function getMultiplePages(slugs) {
  // Instead of individual requests, use graph API and filter
  const graph = await fetch('/api/graph').then(r => r.json());
  return graph.nodes.filter(node => slugs.includes(node.id));
}
```

### 5. Monitor Performance

Track API performance and errors:

```javascript
async function monitoredFetch(url, options = {}) {
  const start = performance.now();
  
  try {
    const response = await fetch(url, options);
    const duration = performance.now() - start;
    
    console.log(`API ${url}: ${duration.toFixed(2)}ms`);
    
    return response;
  } catch (error) {
    console.error(`API ${url} failed:`, error);
    throw error;
  }
}
```

## Code Examples

### Complete Search Implementation

```javascript
class WikiAPI {
  constructor(baseURL = '/api') {
    this.baseURL = baseURL;
    this.cache = new Map();
  }
  
  async search(query) {
    const sanitized = query.trim().slice(0, 100);
    if (sanitized.length < 2) {
      throw new Error('Query too short');
    }
    
    const response = await fetch(
      `${this.baseURL}/search?q=${encodeURIComponent(sanitized)}`
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }
    
    return await response.json();
  }
  
  async getContent(slug) {
    if (this.cache.has(slug)) {
      return this.cache.get(slug);
    }
    
    const response = await fetch(`${this.baseURL}/content/${slug}`);
    const data = await response.json();
    
    this.cache.set(slug, data);
    return data;
  }
  
  async chat(message, slug = null) {
    const response = await fetch(`${this.baseURL}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, slug })
    });
    
    if (!response.ok) {
      throw new Error('Chat request failed');
    }
    
    const data = await response.json();
    return data.message;
  }
}

// Usage
const api = new WikiAPI();
const results = await api.search('mysticism');
const intro = await api.getContent('introduction');
const answer = await api.chat('Explain saloi tradition', 'introduction');
```

### React Hook Example

```typescript
import { useState, useEffect } from 'react';

function useWikiSearch(query: string) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }
    
    const controller = new AbortController();
    
    async function search() {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(query)}`,
          { signal: controller.signal }
        );
        
        const data = await response.json();
        setResults(data.results);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    }
    
    const timeoutId = setTimeout(search, 300); // Debounce
    
    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [query]);
  
  return { results, loading, error };
}
```

## OpenAPI Specification

For a complete API specification including all schemas and examples, see:
- [OpenAPI YAML](/docs/api/openapi.yaml)

## Support

For issues or questions:
- GitHub: [Sacred Madness Wiki Repository](https://github.com/yourusername/sacred-madness-wiki)
- Email: support@sacred-madness.vercel.app

## Version History

- **v1.0.0** (2024-01): Initial API release
  - Content, Graph, Search, AI Chat, Citations endpoints
  - Rate limiting and security features
  - OpenAPI 3.0 specification