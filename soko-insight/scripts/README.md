# Phase 2 Testing Scripts

This directory contains testing scripts for Phase 2 features.

## Prerequisites

Before running the tests, ensure:

1. The server is running on `http://localhost:3000`
2. Database is set up and migrated
3. A test user exists with email `test@example.com` and password `testpassword123`
4. Dependencies are installed:
   ```bash
   npm install axios form-data
   ```

## Running Tests

### Integration Tests

Run the Phase 2 integration test script:

```bash
npm run test:phase2
```

Or directly:

```bash
node scripts/test-phase2.js
```

The script will test:

1. **CSV Header Detection** - Tests the endpoint that detects CSV file headers
2. **CSV File Upload** - Tests complete CSV upload with column mapping
3. **M-Pesa Import** - Tests M-Pesa statement CSV import
4. **Quick Entry** - Tests the quick sales entry endpoint
5. **Channel Management** - Tests creating and retrieving sales channels

### Unit Tests

Run unit tests separately:

```bash
# Server unit tests
npm run test:server

# Client unit tests  
npm run test:client
```

## Test Coverage

Phase 2 test coverage includes:

- **File Processor Service** (`server/src/__tests__/services/fileProcessor.test.ts`)
  - CSV processing
  - Excel processing
  - Column mapping
  - Header detection
  - Data validation

- **M-Pesa Parser Service** (`server/src/__tests__/services/mpesaParser.test.ts`)
  - M-Pesa CSV parsing
  - Transaction filtering
  - Date parsing
  - Amount parsing

- **Sales Controller** (`server/src/__tests__/controllers/salesController.test.ts`)
  - File upload endpoints
  - Header detection endpoint
  - M-Pesa import endpoint

- **Offline Storage** (`client/src/utils/__tests__/offlineStorage.test.ts`)
  - IndexedDB operations
  - Request queueing
  - Online/offline detection

## Environment Variables

You can set the API URL:

```bash
API_URL=http://localhost:3000/api npm run test:phase2
```

## Expected Results

All tests should pass for Phase 2 to be considered complete:

```
==================================================
Test Summary
==================================================
✓ headerDetection
✓ csvUpload
✓ mpesaImport
✓ quickEntry
✓ channelManagement

Passed: 5/5

✓ All Phase 2 tests passed!
```

