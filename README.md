# AI Voice Customer Support Agent

A voice-based AI customer support system that uses semantic FAQ vector search, real-time escalation, and an admin dashboard to provide accurate, human-assisted customer support.

## ?? Features

- **Voice Input/Output**: Speech-to-text and text-to-speech using ElevenLabs API
- **Semantic FAQ Search**: Vector embeddings for intelligent question matching
- **Auto Escalation**: Creates support tickets for questions the AI can't confidently answer
- **Admin Dashboard**: Manage conversations, tickets, and respond to users
- **Real-time Updates**: Supabase realtime features for live notifications
- **TypeScript**: Full type safety across the application

## ?? Tech Stack

- **Frontend**: Next.js 15+ with App Router, React, TypeScript
- **Styling**: Tailwind CSS, Shadcn/UI
- **Database**: Supabase (PostgreSQL + Vector support)
- **Voice**: ElevenLabs API (TTS + STT)
- **State Management**: Zustand
- **Notifications**: React Hot Toast

## ?? Getting Started

### 1. Install Dependencies

Dependencies are already installed. If you need to reinstall:


pm install

### 2. Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Get your credentials from **Settings > API**
3. Enable the ector extension in your database

### 3. Configure Environment Variables

Edit .env.local with your credentials:

`
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key

NEXT_PUBLIC_ELEVENLABS_API_KEY=your_elevenlabs_key
ELEVENLABS_VOICE_ID=your_voice_id

NEXT_PUBLIC_FAQ_SIMILARITY_THRESHOLD=0.75
`

### 4. Run Development Server


pm run dev

Open [http://localhost:3000](http://localhost:3000)

## ?? Project Structure

- **src/app/api/** - Next.js API routes (voice, tickets, FAQ)
- **src/app/admin/** - Admin dashboard pages
- **src/components/** - React components (voice recorder, admin UI)
- **src/lib/** - Utility functions (Supabase, vector search, ElevenLabs)
- **src/types/** - TypeScript type definitions

## ??? Database Schema

Tables to create in Supabase:
- users - Website visitors
- conversations - Chat sessions
- messages - Individual messages
- 	ickets - Support escalations
- aq - FAQ entries with vector embeddings

## ?? User Flow

1. User clicks "Talk to Support"
2. Browser captures voice input
3. Text sent to /api/voice endpoint
4. System searches FAQ using vector similarity
5. If confident match ? AI speaks answer
6. If no match ? Creates ticket for admin
7. Admin reviews & responds via dashboard

## ?? API Endpoints

- POST /api/voice - Process voice input
- GET /api/tickets - List tickets
- POST /api/tickets - Create ticket
- GET /api/faq/search - Search FAQ

## ?? Security Notes

- Keep API keys in .env.local (never commit)
- Service key is server-only
- Admin routes require authentication in production
- Rate limit API endpoints

## ?? License

MIT
