# Phase 2 Testing Guide

This document provides a comprehensive guide for testing Phase 2 features of the SokoInsight platform.

## Overview

Phase 2 includes:
- CSV/Excel file upload with column mapping
- Quick entry form for small traders
- Sales channel management
- M-Pesa statement import
- PWA with offline support
- Data validation and duplicate detection

## Manual Testing

### 1. CSV/Excel Upload

**Test Steps:**
1. Navigate to `/upload` page
2. Select "CSV/Excel Upload" tab
3. Upload a CSV file with sales data
4. Map columns (Date, Product, Quantity, Price)
5. Configure options (default channel, date format)
6. Submit and verify results

**Test Files:**
Create a test CSV file (`test-sales.csv`):
```csv
Date,Product Name,Quantity,Unit Price,Total
2024-01-15,Product A,5,100,500
2024-01-16,Product B,3,200,600
2024-01-17,Product C,2,150,300
```

**Expected Results:**
- Headers detected correctly
- Data imported successfully
- Sales records created
- Success rate displayed

### 2. M-Pesa Statement Import

**Test Steps:**
1. Navigate to `/upload` page
2. Select "M-Pesa Statement" tab
3. Upload M-Pesa CSV statement
4. Select channel (optional)
5. Set minimum amount filter (optional)
6. Submit and verify results

**Test File:**
Create M-Pesa CSV (`mpesa-statement.csv`):
```csv
Receipt No.,Completion Time,Details,Transaction Status,Transaction Type,From,To,Amount (KSh)
RFT123,12/31/2023 10:30 AM,Payment for goods,Completed,Payment received,254712345678,254798765432,500
RFT124,12/31/2023 11:00 AM,Payment for services,Completed,Payment received,254712345679,254798765433,300
```

**Expected Results:**
- Transactions parsed correctly
- Only payments received processed (withdrawals excluded)
- Sales records created
- Receipt numbers stored in notes

### 3. Quick Entry Form

**Test Steps:**
1. Navigate to `/sales` page
2. Click "Quick Entry" button
3. Fill in form:
   - Select product
   - Enter quantity
   - Enter price (auto-filled from product)
   - Select date
   - Select channel (optional)
4. Submit

**Expected Results:**
- Sale recorded immediately
- Product stock updated
- Success message displayed
- Sale appears in sales list

### 4. Channel Management

**Test Steps:**
1. Navigate to `/channels` page
2. Click "Add Channel"
3. Fill in form:
   - Channel name
   - Channel type (online/offline/mpesa)
   - Platform (optional)
   - Description (optional)
4. Submit
5. Verify channel appears in list
6. Edit channel
7. Delete channel

**Expected Results:**
- Channel created successfully
- Channel appears in list
- Edit functionality works
- Delete functionality works
- Channels available in dropdowns

### 5. Offline Functionality (PWA)

**Test Steps:**
1. Open application in browser
2. Open DevTools > Application > Service Workers
3. Verify service worker is registered
4. Check Application > Manifest
5. Verify manifest.json is loaded
6. Test offline mode:
   - Open DevTools > Network
   - Set to "Offline"
   - Try to add a sale via Quick Entry
   - Verify offline indicator appears
   - Verify request is queued
   - Set network back to "Online"
   - Verify sync happens automatically

**Expected Results:**
- Service worker registered
- Manifest loads correctly
- Offline indicator shows when offline
- Requests queued when offline
- Automatic sync when back online
- Data persists in IndexedDB

## Automated Testing

### Unit Tests

Run unit tests:

```bash
# Server tests
cd server
npm test

# Client tests
cd client
npm test
```

### Integration Tests

Run Phase 2 integration tests:

```bash
npm run test:phase2
```

## Test Checklist

- [ ] CSV upload with column mapping works
- [ ] Excel upload works
- [ ] Header auto-detection works
- [ ] Data validation shows errors for invalid rows
- [ ] M-Pesa CSV import works
- [ ] M-Pesa withdrawal filtering works
- [ ] Quick entry form saves sales
- [ ] Quick entry updates product stock
- [ ] Channel CRUD operations work
- [ ] Channels appear in dropdowns
- [ ] Service worker registers
- [ ] Offline mode works
- [ ] Requests queue when offline
- [ ] Sync works when back online
- [ ] Offline indicator displays correctly

## Performance Testing

### File Upload Performance

Test with various file sizes:
- Small file (< 100 rows): Should process in < 2 seconds
- Medium file (100-1000 rows): Should process in < 10 seconds
- Large file (1000+ rows): Should process with progress feedback

### Offline Performance

- IndexedDB operations should be < 100ms
- Request queueing should be instant
- Sync should process queued requests efficiently

## Edge Cases

Test these edge cases:

1. **Invalid CSV formats**
   - Missing headers
   - Wrong date formats
   - Non-numeric prices
   - Empty rows

2. **Large files**
   - Files > 10MB (should be rejected)
   - Files with 10,000+ rows

3. **Network issues**
   - Slow network
   - Intermittent connectivity
   - Complete offline mode

4. **Concurrent operations**
   - Multiple uploads simultaneously
   - Quick entry while offline
   - Sync conflicts

## Browser Compatibility

Test in:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (Chrome Mobile, Safari Mobile)

## Known Issues

- Service worker may require HTTPS in production
- Large file uploads may timeout (consider chunking)
- IndexedDB has size limits per origin (typically 50% of disk space)

