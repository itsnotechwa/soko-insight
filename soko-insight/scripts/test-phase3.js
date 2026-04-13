/**
 * Phase 3 Testing Script
 * Tests Dashboard, Analytics, Notifications, and Recommendations features
 */

const axios = require('axios');
const BASE_URL = process.env.API_URL || 'http://localhost:3000/api';

let authToken = '';
let userId = '';

// Test helper functions
async function makeRequest(method, endpoint, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status,
    };
  }
}

// Test functions
async function testAuthentication() {
  console.log('\n📝 Testing Authentication...');
  
  // Register a test user
  const registerResult = await makeRequest('POST', '/auth/register', {
    email: `test-phase3-${Date.now()}@example.com`,
    password: 'Test123!@#',
    businessName: 'Phase 3 Test Business',
    sellerType: 'ecommerce',
  });

  if (!registerResult.success) {
    console.error('❌ Registration failed:', registerResult.error);
    return false;
  }

  authToken = registerResult.data.data.token;
  userId = registerResult.data.data.user.id;
  console.log('✅ User registered and authenticated');
  return true;
}

async function testAnalyticsOverview() {
  console.log('\n📊 Testing Analytics Overview...');
  
  const result = await makeRequest('GET', '/analytics/overview', null, authToken);
  
  if (result.success) {
    console.log('✅ Analytics overview retrieved');
    console.log('   - Summary:', result.data.data.summary ? 'Present' : 'Missing');
    console.log('   - Trends:', result.data.data.trends ? 'Present' : 'Missing');
    console.log('   - Daily Sales:', result.data.data.dailySales?.length || 0, 'records');
    return true;
  } else {
    console.error('❌ Analytics overview failed:', result.error);
    return false;
  }
}

async function testAnalyticsTrends() {
  console.log('\n📈 Testing Analytics Trends...');
  
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const result = await makeRequest(
    'GET',
    `/analytics/trends?startDate=${startDate}&endDate=${endDate}&granularity=day`,
    null,
    authToken
  );
  
  if (result.success) {
    console.log('✅ Analytics trends retrieved');
    console.log('   - Trend records:', result.data.data.trends?.length || 0);
    return true;
  } else {
    console.error('❌ Analytics trends failed:', result.error);
    return false;
  }
}

async function testProductPerformance() {
  console.log('\n📦 Testing Product Performance...');
  
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const result = await makeRequest(
    'GET',
    `/analytics/products?startDate=${startDate}&endDate=${endDate}`,
    null,
    authToken
  );
  
  if (result.success) {
    console.log('✅ Product performance retrieved');
    console.log('   - Top Products:', result.data.data.topProducts?.length || 0);
    console.log('   - Slow Movers:', result.data.data.slowMovers?.length || 0);
    return true;
  } else {
    console.error('❌ Product performance failed:', result.error);
    return false;
  }
}

async function testChannelComparison() {
  console.log('\n🛒 Testing Channel Comparison...');
  
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const result = await makeRequest(
    'GET',
    `/analytics/channels?startDate=${startDate}&endDate=${endDate}`,
    null,
    authToken
  );
  
  if (result.success) {
    console.log('✅ Channel comparison retrieved');
    console.log('   - Channels:', result.data.data.channels?.length || 0);
    return true;
  } else {
    console.error('❌ Channel comparison failed:', result.error);
    return false;
  }
}

async function testNotifications() {
  console.log('\n🔔 Testing Notifications...');
  
  // Get notifications
  const getResult = await makeRequest('GET', '/notifications?limit=10', null, authToken);
  
  if (!getResult.success) {
    console.error('❌ Get notifications failed:', getResult.error);
    return false;
  }
  
  console.log('✅ Notifications retrieved');
  console.log('   - Count:', getResult.data.data?.length || 0);
  
  // Get unread count
  const countResult = await makeRequest('GET', '/notifications/unread-count', null, authToken);
  
  if (countResult.success) {
    console.log('✅ Unread count retrieved');
    console.log('   - Unread:', countResult.data.data.count || 0);
  } else {
    console.error('❌ Unread count failed:', countResult.error);
  }
  
  return true;
}

async function testRecommendations() {
  console.log('\n💡 Testing Recommendations...');
  
  // Get recommendations
  const getResult = await makeRequest('GET', '/recommendations', null, authToken);
  
  if (!getResult.success) {
    console.error('❌ Get recommendations failed:', getResult.error);
    return false;
  }
  
  console.log('✅ Recommendations retrieved');
  console.log('   - Count:', getResult.data.data?.length || 0);
  
  // Generate recommendations
  const generateResult = await makeRequest('POST', '/recommendations/generate', null, authToken);
  
  if (generateResult.success) {
    console.log('✅ Recommendations generated');
    console.log('   - Generated:', generateResult.data.data?.length || 0);
  } else {
    console.error('❌ Generate recommendations failed:', generateResult.error);
  }
  
  return true;
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Phase 3 Tests...\n');
  console.log('='.repeat(60));
  
  const results = {
    authentication: false,
    analyticsOverview: false,
    analyticsTrends: false,
    productPerformance: false,
    channelComparison: false,
    notifications: false,
    recommendations: false,
  };
  
  // Run tests in sequence
  results.authentication = await testAuthentication();
  
  if (!results.authentication) {
    console.error('\n❌ Authentication failed. Cannot continue with other tests.');
    return;
  }
  
  results.analyticsOverview = await testAnalyticsOverview();
  results.analyticsTrends = await testAnalyticsTrends();
  results.productPerformance = await testProductPerformance();
  results.channelComparison = await testChannelComparison();
  results.notifications = await testNotifications();
  results.recommendations = await testRecommendations();
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📋 Test Summary');
  console.log('='.repeat(60));
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(r => r).length;
  
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}`);
  });
  
  console.log('\n' + '='.repeat(60));
  console.log(`Results: ${passedTests}/${totalTests} tests passed`);
  console.log('='.repeat(60));
  
  if (passedTests === totalTests) {
    console.log('\n🎉 All Phase 3 tests passed!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.');
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});






