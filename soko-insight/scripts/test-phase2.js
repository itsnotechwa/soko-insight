#!/usr/bin/env node

/**
 * Phase 2 Testing Script
 * Tests CSV/Excel upload, M-Pesa import, and offline functionality
 * 
 * Prerequisites:
 * - Server running on http://localhost:3000
 * - Test user: test@example.com / testpassword123
 * - Install dependencies: npm install axios form-data
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = process.env.API_URL || 'http://localhost:3000/api';
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'testpassword123';

let authToken = '';
let userId = '';

// Test utilities
async function registerTestUser() {
  try {
    console.log('Creating test user...');
    const response = await axios.post(`${API_BASE_URL}/auth/register`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      businessName: 'Test Business',
      sellerType: 'small_trader',
    }, { timeout: 5000 });

    if (response.data.success) {
      console.log('✓ Test user created successfully');
      return true;
    }
    return false;
  } catch (error) {
    if (error.response?.status === 409) {
      // User already exists, that's fine
      console.log('ℹ Test user already exists');
      return true;
    }
    console.error('✗ Failed to create test user:', error.response?.data?.error || error.message);
    return false;
  }
}

async function login() {
  try {
    // First check if server is accessible
    try {
      await axios.get(`${API_BASE_URL.replace('/api', '')}/health`, { timeout: 2000 });
    } catch (healthError) {
      // Health endpoint might not exist, try auth endpoint instead
      try {
        await axios.get(`${API_BASE_URL}/auth/me`, { 
          headers: { Authorization: 'Bearer test' },
          validateStatus: () => true // Don't throw on any status
        });
      } catch (connectError) {
        if (connectError.code === 'ECONNREFUSED') {
          console.error('✗ Server is not running. Please start the server with: npm run dev:server');
          return false;
        }
      }
    }

    // Try to login
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }, { timeout: 5000 });

      authToken = response.data.data.token;
      userId = response.data.data.user.id;
      console.log('✓ Logged in successfully');
      return true;
    } catch (loginError) {
      // If login fails with 401/404, try to register the user
      if (loginError.response?.status === 401 || loginError.response?.status === 404) {
        console.log('Test user not found, attempting to register...');
        const registered = await registerTestUser();
        if (registered) {
          // Retry login after registration
          const retryResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
            email: TEST_EMAIL,
            password: TEST_PASSWORD,
          }, { timeout: 5000 });

          authToken = retryResponse.data.data.token;
          userId = retryResponse.data.data.user.id;
          console.log('✓ Logged in successfully after registration');
          return true;
        }
      }
      throw loginError; // Re-throw if it's a different error
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('✗ Cannot connect to server. Please ensure the server is running on http://localhost:3000');
      console.error('  Start with: npm run dev:server');
    } else {
      console.error('✗ Login failed:', error.response?.data?.error || error.message);
    }
    return false;
  }
}

function getAuthHeaders() {
  return {
    Authorization: `Bearer ${authToken}`,
  };
}

// Test 1: CSV Upload Header Detection
async function testCSVHeaderDetection() {
  console.log('\n--- Test 1: CSV Header Detection ---');
  
  try {
    const csvContent = `Date,Product Name,Quantity,Unit Price,Total
2024-01-15,Product A,5,100,500
2024-01-16,Product B,3,200,600`;

    const formData = new FormData();
    formData.append('file', Buffer.from(csvContent), {
      filename: 'test-sales.csv',
      contentType: 'text/csv',
    });

    const response = await axios.post(
      `${API_BASE_URL}/sales/upload/detect-headers`,
      formData,
      {
        headers: {
          ...getAuthHeaders(),
          ...formData.getHeaders(),
        },
      }
    );

    if (response.data.success && response.data.data.headers) {
      console.log('✓ Headers detected:', response.data.data.headers);
      return true;
    } else {
      console.error('✗ Header detection failed');
      return false;
    }
  } catch (error) {
    console.error('✗ Header detection error:', error.response?.data?.error || error.message);
    return false;
  }
}

// Test 2: CSV File Upload
async function testCSVUpload() {
  console.log('\n--- Test 2: CSV File Upload ---');

  try {
    const csvContent = `Date,Product Name,Quantity,Unit Price
2024-01-15,Product A,5,100
2024-01-16,Product B,3,200`;

    const formData = new FormData();
    formData.append('file', Buffer.from(csvContent), {
      filename: 'test-sales.csv',
      contentType: 'text/csv',
    });
    formData.append('skipFirstRow', 'true');
    formData.append('dateFormat', 'YYYY-MM-DD');
    formData.append(
      'columnMapping',
      JSON.stringify({
        saleDate: 'Date',
        productName: 'Product Name',
        quantity: 'Quantity',
        unitPrice: 'Unit Price',
      })
    );

    const response = await axios.post(
      `${API_BASE_URL}/sales/upload`,
      formData,
      {
        headers: {
          ...getAuthHeaders(),
          ...formData.getHeaders(),
        },
      }
    );

    if (response.data.success) {
      console.log('✓ CSV upload successful');
      console.log(`  - Total rows: ${response.data.data.total}`);
      console.log(`  - Created: ${response.data.data.created}`);
      console.log(`  - Failed: ${response.data.data.failed}`);
      return true;
    } else {
      console.error('✗ CSV upload failed');
      return false;
    }
  } catch (error) {
    console.error('✗ CSV upload error:', error.response?.data?.error || error.message);
    return false;
  }
}

// Test 3: M-Pesa Statement Import
async function testMpesaImport() {
  console.log('\n--- Test 3: M-Pesa Statement Import ---');

  try {
    const mpesaCSV = `Receipt No.,Completion Time,Details,Transaction Status,Transaction Type,From,To,Amount (KSh)
RFT123,12/31/2023 10:30 AM,Payment for goods,Completed,Payment received,254712345678,254798765432,500
RFT124,12/31/2023 11:00 AM,Payment for services,Completed,Payment received,254712345679,254798765433,300`;

    const formData = new FormData();
    formData.append('file', Buffer.from(mpesaCSV), {
      filename: 'mpesa-statement.csv',
      contentType: 'text/csv',
    });
    formData.append('excludeWithdrawals', 'true');

    const response = await axios.post(
      `${API_BASE_URL}/sales/upload/mpesa`,
      formData,
      {
        headers: {
          ...getAuthHeaders(),
          ...formData.getHeaders(),
        },
      }
    );

    if (response.data.success) {
      console.log('✓ M-Pesa import successful');
      console.log(`  - Total transactions: ${response.data.data.total}`);
      console.log(`  - Created sales: ${response.data.data.created}`);
      return true;
    } else {
      console.error('✗ M-Pesa import failed');
      return false;
    }
  } catch (error) {
    console.error('✗ M-Pesa import error:', error.response?.data?.error || error.message);
    return false;
  }
}

// Test 4: Quick Entry
async function testQuickEntry() {
  console.log('\n--- Test 4: Quick Entry ---');

  try {
    // First, get products to use
    const productsResponse = await axios.get(`${API_BASE_URL}/products`, {
      headers: getAuthHeaders(),
    });

    if (!productsResponse.data.data || productsResponse.data.data.length === 0) {
      console.log('⚠ No products found, skipping quick entry test');
      return true;
    }

    const product = productsResponse.data.data[0];

    const response = await axios.post(
      `${API_BASE_URL}/sales/quick-entry`,
      {
        productId: product.id,
        quantity: 2,
        unitPrice: product.sellingPrice,
        saleDate: new Date().toISOString().split('T')[0],
      },
      {
        headers: getAuthHeaders(),
      }
    );

    if (response.data.success) {
      console.log('✓ Quick entry successful');
      console.log(`  - Sale ID: ${response.data.data.id}`);
      return true;
    } else {
      console.error('✗ Quick entry failed');
      return false;
    }
  } catch (error) {
    console.error('✗ Quick entry error:', error.response?.data?.error || error.message);
    return false;
  }
}

// Test 5: Channel Management
async function testChannelManagement() {
  console.log('\n--- Test 5: Channel Management ---');

  try {
    // Create a channel
    const createResponse = await axios.post(
      `${API_BASE_URL}/channels`,
      {
        channelName: 'Test Channel',
        channelType: 'offline',
        platform: 'test',
        description: 'Test channel for Phase 2 testing',
      },
      {
        headers: getAuthHeaders(),
      }
    );

    if (createResponse.data.success) {
      console.log('✓ Channel created successfully');
      const channelId = createResponse.data.data.id;

      // Get channels
      const getResponse = await axios.get(`${API_BASE_URL}/channels`, {
        headers: getAuthHeaders(),
      });

      if (getResponse.data.success && getResponse.data.data.length > 0) {
        console.log(`✓ Retrieved ${getResponse.data.data.length} channels`);
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('✗ Channel management error:', error.response?.data?.error || error.message);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('='.repeat(50));
  console.log('Phase 2 Testing Script');
  console.log('='.repeat(50));

  // Login first
  const loggedIn = await login();
  if (!loggedIn) {
    console.error('\n✗ Cannot proceed without authentication');
    process.exit(1);
  }

  const results = {
    headerDetection: false,
    csvUpload: false,
    mpesaImport: false,
    quickEntry: false,
    channelManagement: false,
  };

  // Run tests
  results.headerDetection = await testCSVHeaderDetection();
  results.csvUpload = await testCSVUpload();
  results.mpesaImport = await testMpesaImport();
  results.quickEntry = await testQuickEntry();
  results.channelManagement = await testChannelManagement();

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('Test Summary');
  console.log('='.repeat(50));

  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;

  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✓' : '✗'} ${test}`);
  });

  console.log(`\nPassed: ${passed}/${total}`);

  if (passed === total) {
    console.log('\n✓ All Phase 2 tests passed!');
    process.exit(0);
  } else {
    console.log('\n✗ Some tests failed');
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

