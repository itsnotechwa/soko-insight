# Phase 3 Testing Guide

This document provides a comprehensive guide for testing Phase 3 features of the SokoInsight platform.

## Overview

Phase 3 includes:
- Unified dashboard with enhanced widgets
- Advanced analytics with trends visualization
- Product performance analytics
- Channel comparison charts
- Notification system (in-app, email, SMS)
- Actionable recommendations engine

## Manual Testing

### 1. Analytics Overview

**Test Steps:**
1. Navigate to `/analytics` page
2. Verify overview tab displays:
   - Summary cards (Revenue, Orders, Profit, Items Sold)
   - Trend indicators (up/down arrows with percentages)
   - Sales trends chart
   - Sales by channel pie chart
   - Top products bar chart
   - Low stock alerts
3. Change date range using date picker
4. Change granularity (Daily/Weekly/Monthly)
5. Verify data updates correctly

**Expected Results:**
- All widgets load and display data
- Trend indicators show correct percentages
- Charts render properly
- Date range changes update all widgets
- Granularity changes affect trend chart

### 2. Product Performance Analytics

**Test Steps:**
1. Navigate to `/analytics` page
2. Select "Products" tab
3. Verify displays:
   - Top products by revenue chart
   - Slow movers list
4. Change date range
5. Verify data updates

**Expected Results:**
- Top products chart shows products sorted by revenue
- Slow movers list shows products with no sales in period
- Date range changes update data correctly

### 3. Channel Comparison

**Test Steps:**
1. Navigate to `/analytics` page
2. Select "Channels" tab
3. Verify displays:
   - Channel performance bar chart
   - Best performing channel card
   - Underperforming channel card
4. Change date range
5. Verify data updates

**Expected Results:**
- Channel chart shows revenue and orders by channel
- Best/worst channel cards display correctly
- Percentage calculations are accurate

### 4. Category Performance

**Test Steps:**
1. Navigate to `/analytics` page
2. Select "Categories" tab
3. Verify displays:
   - Category performance chart
   - Revenue, profit, orders by category
4. Change date range
5. Verify data updates

**Expected Results:**
- Category chart displays correctly
- All metrics are accurate
- Date range changes update data

### 5. Notification Center

**Test Steps:**
1. Click bell icon in header
2. Verify notification popover opens
3. Check unread count badge
4. Click on a notification
5. Verify notification marked as read
6. Click "Mark all read" button
7. Verify all notifications marked as read
8. Click "View all notifications" link

**Expected Results:**
- Notification popover displays correctly
- Unread count badge shows correct number
- Clicking notification marks it as read
- Mark all read works correctly
- Navigation to full notifications page works

### 6. Recommendations Widget

**Test Steps:**
1. Navigate to `/dashboard` page
2. Scroll to Recommendations widget
3. Verify recommendations display
4. Click "Refresh" button
5. Verify new recommendations generated
6. Click on recommendation action link
7. Verify navigation works

**Expected Results:**
- Recommendations widget displays on dashboard
- Recommendations show with correct icons and priorities
- Refresh button generates new recommendations
- Action links navigate correctly

### 7. Email Notifications (Development Mode)

**Test Steps:**
1. Trigger a low stock alert (create product with low stock)
2. Check server console logs
3. Verify email notification logged (in dev mode)
4. Check notification created in database

**Expected Results:**
- Email service logs notification in development
- Notification record created in database
- Email preferences respected

### 8. SMS Notifications (Development Mode)

**Test Steps:**
1. Configure SMS notifications in user profile
2. Trigger a low stock alert
3. Check server console logs
4. Verify SMS notification logged (in dev mode)

**Expected Results:**
- SMS service logs notification in development
- Phone number formatting works correctly
- SMS preferences respected

## Automated Testing

### Run Phase 3 Tests

```bash
npm run test:phase3
```

This will test:
- Authentication
- Analytics overview endpoint
- Analytics trends endpoint
- Product performance endpoint
- Channel comparison endpoint
- Notifications endpoints
- Recommendations endpoints

### Test Checklist

- [ ] Analytics overview loads correctly
- [ ] Analytics trends with different granularities work
- [ ] Product performance analytics work
- [ ] Channel comparison analytics work
- [ ] Category performance analytics work
- [ ] Notification center displays notifications
- [ ] Notifications can be marked as read
- [ ] Unread count updates correctly
- [ ] Recommendations widget displays on dashboard
- [ ] Recommendations can be generated
- [ ] Email notifications work (dev mode)
- [ ] SMS notifications work (dev mode)
- [ ] Date range filters work
- [ ] Charts render correctly
- [ ] Trend indicators show correct values

## Performance Testing

### Analytics Page Load Time

- Analytics overview should load in < 2 seconds
- Charts should render in < 1 second
- Date range changes should update in < 1 second

### Notification Polling

- Unread count should update every 30 seconds
- Notification center should load in < 500ms

## Edge Cases

Test these edge cases:

1. **No Data Scenarios**
   - Analytics with no sales data
   - No notifications
   - No recommendations

2. **Large Date Ranges**
   - 1 year date range
   - Very small date range (1 day)

3. **Multiple Channels**
   - User with 10+ channels
   - User with 1 channel
   - User with no channels

4. **Notification Limits**
   - 100+ notifications
   - Very long notification messages

## Browser Compatibility

Test in:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (Chrome Mobile, Safari Mobile)

## Known Issues

- Email/SMS services use console logging in development mode
- Large date ranges may be slow (consider pagination)
- Notification polling may need optimization for many users

## Next Steps

After Phase 3 testing:
1. Review and fix any issues found
2. Optimize performance if needed
3. Prepare for Phase 4 (ML Service integration)






