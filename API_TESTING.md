# API Testing Guide

Test these endpoints once your Supabase is configured.

## 📍 Voice Processing

**POST /api/voice**

```json
{
  "text": "I can't log into my account",
  "user_id": "user-123",
  "conversation_id": "conv-456"
}
```

**Response - FAQ Match:**
```json
{
  "success": true,
  "message": "To reset your password, click 'Forgot Password' on the login page...",
  "faq_matched": true,
  "confidence": 0.87,
  "audio_url": "https://api.elevenlabs.io/..."
}
```

**Response - Escalated to Ticket:**
```json
{
  "success": true,
  "message": "Thank you for your question. A human agent will review your issue...",
  "ticket_created": true,
  "ticket_id": "ticket-789"
}
```

## 📍 Ticket Management

**GET /api/tickets**

Returns all tickets with real-time updates

**POST /api/tickets**

```json
{
  "user_id": "user-123",
  "issue_summary": "Cannot reset password"
}
```

## 📍 FAQ Search

**GET /api/faq/search?q=login%20problem**

Returns FAQ entries ranked by semantic similarity

**POST /api/faq**

```json
{
  "question": "How do I reset my password?",
  "answer": "Click 'Forgot Password' on the login page and follow the email instructions..."
}
```

## 🧪 Testing Steps

### 1. Test Voice Endpoint
```bash
curl -X POST http://localhost:3000/api/voice \
  -H "Content-Type: application/json" \
  -d '{"text":"How do I reset my password?"}'
```

### 2. Create Test FAQ
```bash
curl -X POST http://localhost:3000/api/faq \
  -H "Content-Type: application/json" \
  -d '{
    "question": "How do I reset my password?",
    "answer": "Visit the login page and click Forgot Password"
  }'
```

### 3. Search FAQ
```bash
curl http://localhost:3000/api/faq/search?q=password%20reset
```

### 4. Create Test Ticket
```bash
curl -X POST http://localhost:3000/api/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test-user",
    "issue_summary": "Complex billing issue"
  }'
```

## 🔗 Using REST Client Extension

Create `.vscode/test.http`:

```
### Voice API Test
POST http://localhost:3000/api/voice
Content-Type: application/json

{
  "text": "I forgot my password"
}

### Create FAQ
POST http://localhost:3000/api/faq
Content-Type: application/json

{
  "question": "How do I reset my password?",
  "answer": "Click the Forgot Password link on the login page"
}

### Search FAQ
GET http://localhost:3000/api/faq/search?q=password

### Get All Tickets
GET http://localhost:3000/api/tickets

### Create Ticket
POST http://localhost:3000/api/tickets
Content-Type: application/json

{
  "user_id": "user-123",
  "issue_summary": "My subscription won't cancel"
}
```

Then use VS Code's REST Client to test!

## 🐛 Debug Tips

1. Check terminal output for errors
2. Open DevTools (F12) to see network requests
3. Check Supabase SQL Editor to verify data inserted
4. Test endpoints independently first
5. Use `console.log()` in API routes for debugging

## 📊 Expected Behavior

- **FAQ Match**: AI responds within 1-2 seconds
- **Escalation**: Ticket created, admin notified via realtime
- **Real-time**: Admin dashboard updates instantly
- **Voice**: Takes 2-5 seconds to process (STT + API + TTS)

Happy testing! 🚀
