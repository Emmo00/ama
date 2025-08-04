# AMA Backend Documentation

This document describes the backend implementation for the AMA (Ask Me Anything) Farcaster MiniApp using MongoDB and Mongoose.

## Database Models

### User
- `fid`: string (unique) - Farcaster user ID
- `username`: string - Farcaster username
- `pfpUrl`: string (optional) - Profile picture URL
- `createdAt`: Date - Account creation timestamp

### Session
- `_id`: ObjectId - Unique session identifier
- `creatorFid`: string - FID of the session creator
- `title`: string - Session title
- `description`: string - Session description
- `status`: "LIVE" | "ENDED" - Current session status
- `createdAt`: Date - Session creation timestamp
- `endsAt`: Date - Session end time (automatically set to createdAt + 1 week)

### Question
- `_id`: ObjectId - Unique question identifier
- `sessionId`: ObjectId - Reference to the session
- `askerFid`: string - FID of the person asking
- `content`: string - Question content
- `answer`: string (optional) - Answer from session creator
- `createdAt`: Date - Question timestamp

### Tip
- `_id`: ObjectId - Unique tip identifier
- `sessionId`: ObjectId - Reference to the session
- `senderFid`: string - FID of the tipper
- `amount`: number - Tip amount in USDC
- `txHash`: string (unique) - Transaction hash on blockchain
- `createdAt`: Date - Tip timestamp

### ArchivedSessionStats
- `sessionId`: ObjectId - Reference to the archived session
- `totalTips`: number - Total tips received
- `totalParticipants`: number - Unique participants count
- `totalQuestions`: number - Total questions asked
- `archivedAt`: Date - Archive timestamp

## API Endpoints

### Users (`/api/users`)
- `GET` - Fetch users by FID, username, or list recent users
- `POST` - Create a new user

### Sessions (`/api/sessions`)
- `GET` - List sessions with optional filtering by status or creator
- `POST` - Create a new session

### Sessions by ID (`/api/sessions/[id]`)
- `GET` - Get session details with questions, tips, and stats
- `PATCH` - Update session status (end a session)

### Questions (`/api/questions`)
- `GET` - List questions with optional filtering by session or asker
- `POST` - Ask a new question

### Questions by ID (`/api/questions/[id]`)
- `PATCH` - Answer a question (only by session creator)

### Tips (`/api/tips`)
- `GET` - List tips with optional filtering by session or sender
- `POST` - Record a new tip

### Best Friends (`/api/best-friends`)
- `GET` - Get users who interact most with a user's sessions

## Environment Variables

Create a `.env.local` file with:

```env
MONGODB_URI=mongodb://localhost:27017/ama-app
NEYNAR_API_KEY=your_neynar_api_key_here
NEXTAUTH_SECRET=your_secret_here
NEXTAUTH_URL=http://localhost:3000
```

## Database Setup

1. Install MongoDB locally or use MongoDB Atlas
2. Install dependencies: `npm install mongoose @types/mongoose`
3. Set up environment variables
4. The app will automatically connect to MongoDB when API routes are called

## Key Features

- **Automatic Session Expiry**: Sessions automatically end after 1 week
- **Session Archiving**: When sessions end, stats are archived for historical tracking
- **Interaction-based Best Friends**: Algorithm determines best friends based on questions asked and tips sent
- **Transaction Validation**: Tips require unique transaction hashes to prevent duplicates
- **User Management**: Simple user creation and lookup system

## Usage Examples

### Create a User
```javascript
POST /api/users
{
  "fid": "123",
  "username": "alice"
}
```

### Create a Session
```javascript
POST /api/sessions
{
  "creatorFid": "123",
  "title": "Ask me about web3",
  "description": "Happy to answer questions about blockchain development"
}
```

### Ask a Question
```javascript
POST /api/questions
{
  "sessionId": "session_id_here",
  "askerFid": "456",
  "content": "What's your favorite blockchain?"
}
```

### Answer a Question
```javascript
PATCH /api/questions/question_id
{
  "answer": "I really like Ethereum for its ecosystem",
  "creatorFid": "123"
}
```

### Record a Tip
```javascript
POST /api/tips
{
  "sessionId": "session_id_here",
  "senderFid": "456",
  "amount": 5.00,
  "txHash": "0x123abc..."
}
```

This backend provides a solid foundation for the AMA app with proper data modeling, API structure, and automated session management.
