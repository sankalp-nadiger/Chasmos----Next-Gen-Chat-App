# Poll Feature - Quick Reference

## Files Created/Modified

### Backend
- ✅ **NEW**: `backend/models/poll.model.js` - Poll schema with options and votes
- ✅ **NEW**: `backend/controllers/poll.controller.js` - 7 endpoints for poll operations
- ✅ **NEW**: `backend/routes/poll.routes.js` - Poll API routes
- ✅ **MODIFIED**: `backend/models/message.model.js` - Added `poll` field
- ✅ **MODIFIED**: `backend/server.js` - Registered poll routes

### Frontend
- ✅ **NEW**: `frontend/src/components/PollCreationModal.jsx` - Poll creation form UI
- ✅ **NEW**: `frontend/src/components/PollMessage.jsx` - Poll display and voting UI
- ✅ **MODIFIED**: `frontend/src/components/MessageInput.jsx` - Added poll button in attachment menu
- ✅ **MODIFIED**: `frontend/src/components/ChattingPage.jsx` - Added voting handlers and poll rendering

---

## API Endpoints

### Create Poll
```
POST /api/poll/create
Authorization: Bearer {token}

Request:
{
  question: "What's your favorite color?",
  description: "Pick one",
  options: ["Red", "Blue", "Green"],
  chatId: "chat_id",
  allowMultipleVotes: false
}

Response:
{
  message: "Poll created successfully",
  poll: { _id, question, options[], ... }
}
```

### Vote on Poll
```
POST /api/poll/vote
Authorization: Bearer {token}

Request:
{
  pollId: "poll_id",
  optionId: "option_id"
}

Response:
{
  message: "Vote recorded successfully",
  poll: { ... with updated votes ... }
}
```

### Remove Vote
```
POST /api/poll/remove-vote
Authorization: Bearer {token}

Request:
{
  pollId: "poll_id",
  optionId: "option_id"
}

Response:
{
  message: "Vote removed successfully",
  poll: { ... }
}
```

### Get Poll Details
```
GET /api/poll/:pollId
Authorization: Bearer {token}

Response: { _id, question, options[], ... }
```

### Get Chat Polls
```
GET /api/poll/chat/:chatId
Authorization: Bearer {token}

Response: [ { poll1 }, { poll2 }, ... ]
```

### Close Poll
```
PUT /api/poll/:pollId/close
Authorization: Bearer {token}

Response:
{
  message: "Poll closed successfully",
  poll: { ... isClosed: true, ... }
}
```

---

## Component Props

### PollCreationModal
```javascript
<PollCreationModal
  isOpen={boolean}
  onClose={() => {}}
  onCreatePoll={(pollData) => {}}
  effectiveTheme={themeObject}
  isLoading={boolean}
/>
```

### PollMessage
```javascript
<PollMessage
  poll={pollObject}
  isOwnMessage={boolean}
  effectiveTheme={themeObject}
  currentUserId={string}
  onVote={(pollId, optionId) => {}}
  onRemoveVote={(pollId, optionId) => {}}
  onClosePoll={(pollId) => {}}
  isLoading={boolean}
/>
```

### MessageInput
```javascript
<MessageInput
  onSendMessage={(payload) => {}}
  selectedContact={contactObject}
  effectiveTheme={themeObject}
  isGroupChat={boolean}  // NEW
/>
```

---

## State Management

### Message Payload for Poll
```javascript
{
  type: 'poll',
  content: '📊 Poll: What is your favorite color?',
  pollId: 'poll_mongo_id',
  chatId: 'chat_id'
}
```

### Poll Object Structure
```javascript
{
  _id: ObjectId,
  question: string,
  description: string,
  options: [
    {
      _id: ObjectId,
      text: string,
      votes: [
        {
          user: { _id, name, avatar },
          votedAt: Date
        }
      ]
    }
  ],
  chat: ObjectId,
  createdBy: { _id, name, avatar },
  isClosed: boolean,
  closedAt: Date,
  allowMultipleVotes: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Key Functions

### ChattingPage Handlers
```javascript
// Vote on poll
handlePollVote(pollId, optionId)

// Remove your vote
handlePollRemoveVote(pollId, optionId)

// Close poll (creator/admin only)
handlePollClose(pollId)

// Handle poll creation from MessageInput
handleCreatePoll(pollData)
```

### MessageInput Handlers
```javascript
// Create poll and send as message
handleCreatePoll(pollData)
```

---

## Common Issues & Solutions

### Poll button not showing
- Check if `isGroupChat={true}` is passed to MessageInput
- Verify group chat's `isGroup` flag is set correctly

### Votes not updating
- Ensure socket connection is active
- Check token validity in localStorage
- Verify user has chat membership

### Can't close poll
- Only poll creator or group admin can close
- Check `chat.admins` array includes current user

### Poll not displaying
- Ensure message has `type: 'poll'` and `poll` field populated
- Check PollMessage component is imported in ChattingPage
- Verify API returned full poll object

---

## Testing Checklist

- [ ] Create poll in group chat
- [ ] Vote on poll option
- [ ] Change vote to different option
- [ ] Remove vote from option
- [ ] View votes to see user list
- [ ] Close poll as creator
- [ ] Try to close poll as non-creator (should fail)
- [ ] Enable/disable multiple votes toggle
- [ ] Test with light and dark theme
- [ ] Test on mobile and desktop
- [ ] Real-time updates across tabs/windows
- [ ] Poll data persists on page refresh

---

## Socket Integration

Polls emit real-time updates:
```javascript
// When user votes
socket.emit('poll voted', { pollId, poll })

// When poll is closed
socket.emit('poll closed', { pollId, poll })
```

Listen for updates in socket setup.

---

## Performance Notes

- Polls use indexes on `chat`, `createdBy`, and vote user references
- Vote arrays should be relatively small (< 10k users per poll)
- Consider pagination for large chat histories with many polls
- Socket events are emitted after DB operations complete

---

## Customization

### Change max options
Edit `PollCreationModal.jsx`:
```javascript
if (options.length < 6) // Change 6 to your limit
```

### Change color scheme
Modify styles in:
- `PollCreationModal.jsx` - Modal styling
- `PollMessage.jsx` - Poll display colors
- Uses `effectiveTheme` for consistency

### Disable multiple votes globally
Modify `PollCreationModal.jsx`:
```javascript
setAllowMultipleVotes(false) // Remove from state
```

---

## Documentation Links

- Poll Model: `backend/models/poll.model.js`
- Poll Controller: `backend/controllers/poll.controller.js`
- Poll Routes: `backend/routes/poll.routes.js`
- Poll UI Components: `frontend/src/components/Poll*.jsx`
- Full Implementation Guide: `POLL_IMPLEMENTATION.md`
