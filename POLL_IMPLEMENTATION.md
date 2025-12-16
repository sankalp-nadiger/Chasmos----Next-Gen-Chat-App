# Poll Functionality Implementation Guide

## Overview
A complete poll feature has been implemented for group chats, allowing users to create polls with multiple options, vote, view voting results, and see who voted for each option.

## Features Implemented

### 1. **Poll Creation**
- Polls are only available in group chats
- Users can create polls via the attachment modal in MessageInput
- Poll creation form includes:
  - **Question**: Required field for the poll question
  - **Description**: Optional caption/context for the poll
  - **Options**: Minimum 2, maximum 6 options
  - **Multiple Votes**: Optional checkbox to allow users to vote for multiple options

### 2. **Poll Display (WhatsApp-style UI)**
- Clean, minimalist design similar to WhatsApp
- Shows poll question and description
- Each option displays:
  - Option letter (A, B, C, etc.)
  - Option text
  - Vote count and percentage
  - Visual progress bar showing vote percentage
  - Checkmark indicator if current user voted for this option
- Shows total votes at the bottom
- Creator can close the poll with a lock icon

### 3. **Voting System**
- Users can vote on any poll in real-time
- Supports both single-vote and multi-vote polls
- Each user can vote once per option (unless multi-vote is enabled)
- Changing vote removes the old vote and adds the new one
- "View Votes" button expands to show:
  - User avatars and names who voted
  - Option to remove your own vote (if poll is open)

### 4. **Poll Management**
- **View Votes**: Expandable list showing all users who voted for each option
- **Remove Vote**: Users can remove their vote from any option (if poll is open)
- **Close Poll**: Poll creator can close the poll to prevent further voting
- **Closed Polls**: Display "This poll has ended" indicator

---

## Backend Implementation

### 1. **Models**

#### Poll Model (`backend/models/poll.model.js`)
```javascript
{
  question: String (required),
  description: String,
  options: [{
    text: String,
    votes: [{
      user: ObjectId,
      votedAt: Date
    }]
  }],
  chat: ObjectId (ref: Chat, required),
  createdBy: ObjectId (ref: User, required),
  isClosed: Boolean,
  closedAt: Date,
  allowMultipleVotes: Boolean,
  timestamps: true
}
```

#### Updated Message Model
- Added `poll: ObjectId` field to reference polls in messages

### 2. **Controllers** (`backend/controllers/poll.controller.js`)

#### Endpoints:
- `POST /api/poll/create` - Create a new poll
  - Validates group chat, min 2 options
  - Returns created poll with populated data

- `POST /api/poll/vote` - Vote on a poll option
  - Handles single/multiple vote logic
  - Returns updated poll with all votes populated

- `POST /api/poll/remove-vote` - Remove a vote
  - Removes user's vote from specific option
  - Returns updated poll

- `GET /api/poll/:pollId` - Get poll details
  - Returns full poll with all votes and user info

- `GET /api/poll/chat/:chatId` - Get all polls in a chat
  - Returns paginated list of polls for a chat

- `PUT /api/poll/:pollId/close` - Close a poll
  - Only creator or group admin can close
  - Prevents further voting

### 3. **Routes** (`backend/routes/poll.routes.js`)
- All routes are protected with authentication middleware
- Proper error handling and validation

---

## Frontend Implementation

### 1. **Components**

#### PollCreationModal (`frontend/src/components/PollCreationModal.jsx`)
- Modal form for creating polls
- Validates question and options
- Add/remove options dynamically (2-6 options)
- Multiple votes toggle
- Error messages for validation
- Loading state during creation

#### PollMessage (`frontend/src/components/PollMessage.jsx`)
- Displays poll with WhatsApp-style UI
- Shows options with progress bars and vote percentages
- Expandable "View Votes" to see voter names
- Vote button for each option
- Remove vote functionality
- Close poll button (for creators)
- Handles both own and other users' messages

#### Updated MessageInput (`frontend/src/components/MessageInput.jsx`)
- Added poll creation button to attachment modal
- Only shows for group chats
- Passes `isGroupChat` prop
- Handles poll creation and message sending
- Imports and renders `PollCreationModal`

### 2. **Integration with ChattingPage**

#### Imports
- Added `PollMessage` component import

#### Props
- `isGroupChat` prop passed to `MessageInput`
- Current user ID available for vote management

#### Message Handling
- Case 4 added to `handleSendMessageFromInput` for poll messages
- Fetches full poll details after message creation
- Handles poll message appending to message list

#### Voting Handlers
- `handlePollVote(pollId, optionId)` - Send vote to server
- `handlePollRemoveVote(pollId, optionId)` - Remove vote
- `handlePollClose(pollId)` - Close poll
- All handlers emit socket events for real-time updates

#### Message Display
- Updated message rendering logic to display `PollMessage` component
- Passes all necessary props for voting and management

---

## Socket Events

### Emitted Events
- `poll voted` - When a user votes on a poll
- `poll closed` - When a poll is closed

### Data Synchronization
- Real-time poll updates across all connected clients
- Vote counts and user lists update automatically

---

## Usage Flow

### Creating a Poll
1. User opens message input in a group chat
2. Clicks attachment (paperclip) icon
3. Clicks "Poll" option (cyan icon with BarChart3)
4. Fills in poll question, optional description
5. Adds 2-6 options
6. Optionally enables multiple votes
7. Clicks "Create Poll"

### Voting
1. Poll message appears in chat
2. User clicks on desired option
3. Option shows checkmark and highlights
4. Vote count updates in real-time
5. User can change vote or remove it via "View votes"

### Closing a Poll
1. Poll creator clicks "Close" button
2. Poll becomes read-only
3. Shows "This poll has ended" message
4. No more voting allowed

---

## Security Considerations

1. **Group Chat Only**: Polls can only be created in group chats
2. **Authorization**: User must be member of chat to vote
3. **Vote Integrity**: One user = one vote per option (unless multi-vote enabled)
4. **Close Permissions**: Only poll creator or group admin can close
5. **Token Validation**: All API calls require authentication token

---

## Styling

- **Theme Support**: Works with light and dark themes
- **Responsive**: Adapts to mobile and desktop views
- **Animations**: Smooth transitions for modal, voting, and result display
- **Colors**: Uses theme-aware colors with proper contrast
- **WhatsApp-style**: Clean, minimal, user-friendly interface

---

## Browser Support

- All modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive
- Touch-friendly buttons and interactions

---

## Error Handling

- Validation for poll creation (question, min 2 options)
- Server-side authorization checks
- Graceful error messages to users
- Console logging for debugging
- Fallback behaviors when network fails

---

## Future Enhancements

1. Poll expiration time
2. Poll results visibility settings
3. Edit polls before sending
4. Poll templates
5. Archive completed polls
6. Analytics/statistics
7. Rich media in options
8. Reactions on polls
