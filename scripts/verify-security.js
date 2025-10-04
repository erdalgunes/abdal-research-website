#!/usr/bin/env node

/**
 * Security Headers Verification Script
 * 
 * Tests that all required security headers are properly set
 * Run with: node scripts/verify-security.js
 */

const http = require('http');

const REQUIRED_HEADERS = {
  'x-frame-options': 'DENY',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'origin-when-cross-origin',
  'x-dns-prefetch-control': 'on',
  'permissions-policy': /camera=\(\).*microphone=\(\).*geolocation=\(\)/,
  'content-security-policy': /default-src 'self'/,
  'x-xss-protection': '1; mode=block',
  'x-permitted-cross-domain-policies': 'none',
  'x-powered-by': 'Sacred Madness Wiki'
};

const API_HEADERS = {
  'access-control-allow-origin': /http:\/\/localhost:3000|https:\/\/sacred-madness\.vercel\.app/,
  'access-control-allow-methods': /GET.*POST/,
  'x-ratelimit-policy': /AI Chat: 20\/min/
};

function checkHeaders(url, expectedHeaders, testName) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      const results = {
        passed: [],
        failed: [],
        missing: []
      };

      Object.entries(expectedHeaders).forEach(([headerName, expectedValue]) => {
        const actualValue = res.headers[headerName.toLowerCase()];
        
        if (!actualValue) {
          results.missing.push(headerName);
        } else if (expectedValue instanceof RegExp) {
          if (expectedValue.test(actualValue)) {
            results.passed.push(`${headerName}: ${actualValue}`);
          } else {
            results.failed.push(`${headerName}: Expected pattern ${expectedValue}, got "${actualValue}"`);
          }
        } else if (actualValue === expectedValue) {
          results.passed.push(`${headerName}: ${actualValue}`);
        } else {
          results.failed.push(`${headerName}: Expected "${expectedValue}", got "${actualValue}"`);
        }
      });

      resolve({ testName, results });
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('🔒 Security Headers Verification\n');
  console.log('================================\n');

  try {
    // Test main page headers
    const mainPageTest = await checkHeaders(
      'http://localhost:3000',
      REQUIRED_HEADERS,
      'Main Page Security Headers'
    );

    // Test API headers
    const apiTest = await checkHeaders(
      'http://localhost:3000/api/graph',
      { ...REQUIRED_HEADERS, ...API_HEADERS },
      'API Route Security Headers'
    );

    // Display results
    [mainPageTest, apiTest].forEach(({ testName, results }) => {
      console.log(`📋 ${testName}`);
      console.log('─'.repeat(50));
      
      if (results.passed.length > 0) {
        console.log('\n✅ Passed:');
        results.passed.forEach(msg => console.log(`   ${msg}`));
      }
      
      if (results.failed.length > 0) {
        console.log('\n❌ Failed:');
        results.failed.forEach(msg => console.log(`   ${msg}`));
      }
      
      if (results.missing.length > 0) {
        console.log('\n⚠️  Missing:');
        results.missing.forEach(header => console.log(`   ${header}`));
      }
      
      console.log('\n');
    });

    // Summary
    const totalTests = Object.keys(REQUIRED_HEADERS).length + Object.keys(API_HEADERS).length;
    const totalPassed = mainPageTest.results.passed.length + apiTest.results.passed.length;
    const totalFailed = mainPageTest.results.failed.length + apiTest.results.failed.length;
    const totalMissing = mainPageTest.results.missing.length + apiTest.results.missing.length;

    console.log('📊 Summary');
    console.log('─'.repeat(50));
    console.log(`Total Tests: ${totalTests * 2}`);
    console.log(`✅ Passed: ${totalPassed}`);
    console.log(`❌ Failed: ${totalFailed}`);
    console.log(`⚠️  Missing: ${totalMissing}`);
    
    if (totalFailed === 0 && totalMissing === 0) {
      console.log('\n🎉 All security headers are properly configured!');
      process.exit(0);
    } else {
      console.log('\n⚠️  Some security headers need attention.');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error running tests:', error.message);
    console.log('\n💡 Make sure the development server is running on http://localhost:3000');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  console.log('Starting verification...\n');
  runTests();
}

module.exports = { checkHeaders, runTests };