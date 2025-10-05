-- Add summary column to conversations table
ALTER TABLE public.conversations
ADD COLUMN summary TEXT;