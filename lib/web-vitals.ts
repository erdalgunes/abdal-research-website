/**
 * Web Vitals Performance Monitoring
 * 
 * Tracks Core Web Vitals and sends metrics to analytics or logs in development.
 * Learn more: https://web.dev/vitals/
 */

import type { Metric } from 'web-vitals';

// Metric thresholds (in milliseconds or score)
const THRESHOLDS = {
  // Largest Contentful Paint: measures loading performance
  LCP: { good: 2500, needsImprovement: 4000 },
  
  // First Input Delay: measures interactivity
  FID: { good: 100, needsImprovement: 300 },
  
  // Cumulative Layout Shift: measures visual stability (score, not ms)
  CLS: { good: 0.1, needsImprovement: 0.25 },
  
  // First Contentful Paint: measures perceived load speed
  FCP: { good: 1800, needsImprovement: 3000 },
  
  // Time to First Byte: measures connection and server response
  TTFB: { good: 800, needsImprovement: 1800 },
  
  // Interaction to Next Paint: measures responsiveness
  INP: { good: 200, needsImprovement: 500 },
};

type MetricRating = 'good' | 'needs-improvement' | 'poor';

function getMetricRating(name: string, value: number): MetricRating {
  const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS];
  
  if (!threshold) return 'good';
  
  if (value <= threshold.good) return 'good';
  if (value <= threshold.needsImprovement) return 'needs-improvement';
  return 'poor';
}

function sendToAnalytics(metric: Metric) {
  const rating = getMetricRating(metric.name, metric.value);
  
  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vitals] ${metric.name}:`, {
      value: metric.value,
      rating,
      id: metric.id,
      navigationType: metric.navigationType,
    });
    return;
  }

  // In production, send to your analytics endpoint
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating,
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType,
  });

  // Use `navigator.sendBeacon()` if available, falling back to `fetch()`
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/analytics/vitals', body);
  } else {
    fetch('/api/analytics/vitals', {
      body,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
    }).catch((error) => {
      console.error('Failed to send web vitals:', error);
    });
  }
}

export function reportWebVitals(metric: Metric) {
  sendToAnalytics(metric);
}

// Optional: Performance budget checker
export function checkPerformanceBudget() {
  if (typeof window === 'undefined') return;

  // Check if we exceed performance budgets
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  
  if (navigation) {
    const loadTime = navigation.loadEventEnd - navigation.fetchStart;
    const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.fetchStart;
    
    if (loadTime > 3000) {
      console.warn(`⚠️ Page load time exceeded budget: ${loadTime}ms (budget: 3000ms)`);
    }
    
    if (domContentLoaded > 1500) {
      console.warn(`⚠️ DOM Content Loaded exceeded budget: ${domContentLoaded}ms (budget: 1500ms)`);
    }
  }
}