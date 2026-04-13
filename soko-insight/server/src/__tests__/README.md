# Testing Guide

This directory contains all tests for the SokoInsight backend API.

## Test Structure

```
__tests__/
├── setup.ts                 # Test database setup and teardown
├── helpers/
│   ├── testHelpers.ts       # Test utility functions
│   └── dbOverride.ts         # Database override utilities
├── models/
│   └── User.test.ts          # User model tests
├── controllers/
│   └── authController.test.ts # Auth controller tests
├── middleware/
│   └── auth.test.ts          # Auth middleware tests
├── database/
│   └── connection.test.ts    # Database connection tests
└── utils/
    └── validation.test.ts   # Validation utility tests
```

## Prerequisites

1. **PostgreSQL Database**: Ensure PostgreSQL is running and accessible
2. **Test Database**: The test suite will automatically create a test database named `soko_insight_test`
3. **Environment Variables**: Set up your `.env` file with database credentials

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with coverage
```bash
npm run test:coverage
```

### Run a specific test file
```bash
npm test -- User.test.ts
```

## Test Database Setup

The test suite automatically:
1. Creates a test database (`soko_insight_test`) if it doesn't exist
2. Runs migrations to set up the schema
3. Cleans the database before each test
4. Tears down connections after all tests

## Environment Variables for Testing

You can override test database settings with environment variables:

```bash
TEST_DB_NAME=soko_insight_test
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
```

## Writing New Tests

### Example Test Structure

```typescript
import { createTestUser, getAuthHeader } from '../helpers/testHelpers';
import { getTestPool } from '../setup';

// Mock database for tests
jest.mock('../../config/database', () => {
  const originalModule = jest.requireActual('../../config/database');
  return {
    ...originalModule,
    query: jest.fn(async (text: string, params?: any[]) => {
      const pool = getTestPool();
      const result = await pool.query(text, params);
      return { rows: result.rows, rowCount: result.rowCount || 0 };
    }),
  };
});

describe('Your Feature', () => {
  it('should do something', async () => {
    // Your test code
  });
});
```

## Test Coverage Goals

- **Models**: 90%+ coverage
- **Controllers**: 85%+ coverage
- **Middleware**: 90%+ coverage
- **Utils**: 85%+ coverage

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check database credentials in `.env`
- Verify the test database can be created

### Migration Errors
- Ensure migration file exists at `database/migrations/001_initial_schema.sql`
- Check that PostgreSQL user has CREATE DATABASE permissions

### Test Failures
- Check that database is cleaned between tests
- Verify test data doesn't conflict
- Ensure all mocks are properly set up


