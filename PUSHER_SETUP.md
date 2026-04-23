# Pusher Integration Setup

## Overview
Pusher is integrated to send real-time notifications to mobile clients when booking status changes.

## Installation

```bash
cd wc-backend
npm install pusher
```

## Environment Variables

Add these to your `.env` file:

```env
PUSHER_APP_ID=your_app_id
PUSHER_KEY=your_key
PUSHER_SECRET=your_secret
PUSHER_CLUSTER=us2
```

## Getting Pusher Credentials

1. Go to [pusher.com](https://pusher.com) and sign up/login
2. Create a new app or use existing one
3. Go to "App Keys" tab
4. Copy the credentials:
   - `app_id` → `PUSHER_APP_ID`
   - `key` → `PUSHER_KEY`
   - `secret` → `PUSHER_SECRET`
   - `cluster` → `PUSHER_CLUSTER`

## How It Works

### Backend (wc-backend)
When a booking status changes, the backend emits a Pusher event:

```typescript
// Channel: client-{userId}
// Event: booking-updated
// Payload: { bookingId, status, driverId?, driverName? }
```

### Mobile App (wc-mobile-client)
The mobile app subscribes to the user's channel and listens for updates:

```typescript
// Subscribe to: client-{userId}
// Listen for: booking-updated
// Action: Show push notification + refresh rides list
```

## Events Triggered

Pusher notifications are sent when:

1. **Status Change** (`PATCH /api/v1/bookings/:id/status`)
   - Any status change (pending → assigned → en_route → on_site → in_progress → done)
   - Cancellation

2. **Driver Assignment** (`PATCH /api/v1/bookings/:id/assign`)
   - When a driver is assigned to a booking
   - Includes driver name in the notification

3. **Client Cancellation** (`PATCH /api/v1/bookings/:id/cancel`)
   - When a client cancels their own booking

## Testing

### 1. Test from Backend
```bash
curl -X PATCH https://wc-backend-ayx0.onrender.com/api/v1/bookings/{booking_id}/status \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{"status": "assigned"}'
```

### 2. Monitor Pusher Dashboard
- Go to Pusher dashboard → Debug Console
- You should see events being triggered in real-time

### 3. Test on Mobile App
- Open the mobile app
- Have an admin change a booking status
- You should receive a push notification

## Channel Structure

```
client-{userId}
  └── booking-updated
      ├── bookingId: string
      ├── status: string
      ├── driverId?: string
      └── driverName?: string
```

## Notification Messages

| Status | Notification Title | Notification Body |
|--------|-------------------|-------------------|
| assigned | Driver Assigned | {Driver Name} has been assigned to your ride |
| en_route | Driver En Route | Your driver is on the way to pick you up |
| on_site | Driver Arrived | Your driver has arrived at the pickup location |
| in_progress | Ride Started | Your ride is now in progress |
| done | Ride Completed | Your ride has been completed. Thank you! |
| cancelled | Ride Cancelled | Your ride has been cancelled |

## Troubleshooting

### No notifications received
1. Check Pusher credentials in `.env`
2. Verify Pusher dashboard shows events
3. Check mobile app has `EXPO_PUBLIC_PUSHER_KEY` set
4. Ensure user is logged in (userId is required)

### Events not showing in Pusher dashboard
1. Verify Pusher credentials are correct
2. Check backend logs for Pusher errors
3. Ensure `notifyBookingUpdate()` is being called

### Mobile app not receiving events
1. Check `EXPO_PUBLIC_PUSHER_KEY` matches backend `PUSHER_KEY`
2. Verify `EXPO_PUBLIC_PUSHER_CLUSTER` matches backend
3. Check mobile app logs for Pusher connection errors
4. Ensure user ID matches between backend and mobile app

## Free Tier Limits

Pusher free tier includes:
- 200,000 messages/day
- 100 concurrent connections
- Unlimited channels

This should be sufficient for development and initial production use.
