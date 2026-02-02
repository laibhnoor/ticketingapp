-- Migration to add ticket_id support to existing messages table
-- Run this in your Supabase SQL Editor

-- Add ticket_id column to messages table if it doesn't exist
ALTER TABLE messages ADD COLUMN IF NOT EXISTS ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE;

-- Create index for faster queries by ticket_id
CREATE INDEX IF NOT EXISTS idx_messages_ticket_id ON messages(ticket_id);

-- Add admin_notes column to tickets table if it doesn't exist
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Ensure the messages table has sender column that accepts 'user' and 'admin'
-- If you need to modify the sender column constraint:
-- ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_sender_check;
-- ALTER TABLE messages ADD CONSTRAINT messages_sender_check CHECK (sender IN ('user', 'admin', 'ai'));

-- Enable realtime for messages table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;
END $$;

-- Ensure tickets table is also in realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'tickets'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE tickets;
  END IF;
END $$;
