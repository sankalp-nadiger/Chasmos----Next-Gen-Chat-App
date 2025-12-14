# Scheduled Messages Feature - Implementation Guide

## Overview
This feature allows users to schedule messages to be sent at a specific date and time. A cron job runs every minute to check for scheduled messages that are due and sends them automatically.

## Backend Changes

### 1. Message Model (`backend/models/message.model.js`)
Added three new fields to support scheduled messages:
- `isScheduled`: Boolean indicating if message is scheduled
- `scheduledFor`: Date/time when message should be sent
- `scheduledSent`: Boolean indicating if scheduled message was sent
- Added index for better query performance

### 2. Message Controller (`backend/controllers/message.controller.js`)
#### Updated Functions:
- **sendMessage**: Now accepts `isScheduled` and `scheduledFor` parameters
  - Validates scheduled time is in the future
  - Only updates chat's lastMessage if not scheduled

#### New Functions:
- **getScheduledMessages**: Get all pending scheduled messages for a chat
- **cancelScheduledMessage**: Delete a scheduled message before it's sent
- **updateScheduledMessage**: Update scheduled time or content

### 3. Cron Job Service (`backend/services/scheduledMessageCron.js`)
New service that:
- Runs every minute using node-cron
- Queries for messages where `scheduledFor <= now` and `scheduledSent = false`
- Marks messages as sent and updates chat's lastMessage
- Logs all operations for debugging

### 4. Routes (`backend/routes/message.routes.js`)
Added new endpoints:
- `GET /api/message/scheduled/:chatId` - Get scheduled messages
- `DELETE /api/message/scheduled/:messageId/cancel` - Cancel scheduled message
- `PUT /api/message/scheduled/:messageId/update` - Update scheduled message

### 5. Server Setup (`backend/server.js`)
- Imported and initialized the cron job service
- Cron job starts automatically when server starts

### 6. Dependencies (`backend/package.json`)
Added `node-cron` package for cron job functionality

## Frontend Changes

### Message Input Component (`frontend/src/components/MessageInput.jsx`)
#### New Features:
- Added Clock icon button to open schedule modal
- Schedule modal with date and time pickers
- Validation to ensure scheduled time is in the future
- Preview of scheduled message details

#### New State Variables:
- `showScheduleModal`: Controls modal visibility
- `scheduledDate`: Selected date
- `scheduledTime`: Selected time

#### Updated Functions:
- **handleSendClick**: Now accepts `isScheduled` parameter
  - Includes scheduled data in API payload when scheduling
- **handleScheduleClick**: Opens schedule modal
- **handleScheduleSend**: Validates and sends scheduled message

## Installation Steps

### Backend:
1. Install node-cron package:
   ```bash
   cd backend
   npm install node-cron@^3.0.3
   ```

2. Restart the backend server:
   ```bash
   npm start
   ```

3. Verify cron job initialization in console:
   ```
   ⏰ [CRON] Initializing scheduled message cron job (runs every minute)
   ✅ [CRON] Scheduled message cron job initialized
   ```

### Frontend:
No additional packages needed. The frontend changes are already in place.

## Usage

### Scheduling a Message:
1. Type a message in the input field
2. Click the Clock icon button
3. Select date and time
4. Click "Schedule" button
5. Message will appear as scheduled (can be viewed/cancelled before send time)

### Managing Scheduled Messages:
- View: Call `GET /api/message/scheduled/:chatId`
- Cancel: Call `DELETE /api/message/scheduled/:messageId/cancel`
- Update: Call `PUT /api/message/scheduled/:messageId/update`

## API Endpoints

### Schedule a Message
```http
POST /api/message
Content-Type: application/json
Authorization: Bearer {token}

{
  "content": "Message text",
  "chatId": "chat_id",
  "isScheduled": true,
  "scheduledFor": "2025-12-15T10:30:00.000Z"
}
```

### Get Scheduled Messages
```http
GET /api/message/scheduled/:chatId
Authorization: Bearer {token}
```

### Cancel Scheduled Message
```http
DELETE /api/message/scheduled/:messageId/cancel
Authorization: Bearer {token}
```

### Update Scheduled Message
```http
PUT /api/message/scheduled/:messageId/update
Content-Type: application/json
Authorization: Bearer {token}

{
  "scheduledFor": "2025-12-15T11:00:00.000Z",
  "content": "Updated message text"
}
```

## Cron Job Details

- **Frequency**: Runs every minute (`* * * * *`)
- **Query**: Finds messages where:
  - `isScheduled = true`
  - `scheduledSent = false`
  - `scheduledFor <= current time`
- **Actions**:
  1. Marks message as `isScheduled = false` and `scheduledSent = true`
  2. Updates chat's lastMessage
  3. Logs success/failure for each message

## Testing

1. **Schedule a message** for 2 minutes in the future
2. **Verify** it appears in scheduled messages list
3. **Wait** for the scheduled time
4. **Check** that message appears in chat
5. **Verify** cron job logs show successful sending

## Socket.io Integration (Optional Enhancement)

To emit real-time events when scheduled messages are sent, you can enhance the cron job:

```javascript
// In scheduledMessageCron.js, add socket.io instance
export const initScheduledMessageCron = (io) => {
  cron.schedule('* * * * *', async () => {
    const sentMessages = await sendScheduledMessages();
    
    // Emit to chat rooms
    sentMessages.forEach(msg => {
      io.to(msg.chat._id.toString()).emit('message recieved', msg);
    });
  });
};
```

## Troubleshooting

### Messages not sending on time:
- Check server logs for cron job execution
- Verify server timezone matches expected timezone
- Check database connection

### Schedule modal not appearing:
- Verify Clock icon is visible in MessageInput
- Check browser console for errors
- Ensure effectiveTheme prop is passed correctly

### Validation errors:
- Ensure scheduled time is in ISO format
- Verify time is in the future
- Check that both date and time are selected

## Future Enhancements

1. **Recurring messages**: Add support for daily/weekly schedules
2. **Time zones**: Allow users to select timezone
3. **Edit scheduled messages**: Full editing interface
4. **Schedule preview**: Show all scheduled messages in a dedicated view
5. **Bulk scheduling**: Schedule multiple messages at once
6. **Templates**: Save message templates for scheduling
