import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { checkAdminAuth } from '@/lib/auth/checkAuth';

// GET all messages for a ticket
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ticketId } = await params;
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST a new message (admin reply)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin authentication
    const session = await checkAdminAuth();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: ticketId } = await params;
    const { content, sender = 'admin' } = await req.json();

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Insert the message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        ticket_id: ticketId,
        sender,
        content: content.trim(),
      })
      .select()
      .single();

    if (messageError) {
      throw messageError;
    }

    // Update ticket status to in_progress if it was open
    const { error: ticketError } = await supabase
      .from('tickets')
      .update({ 
        status: 'in_progress', 
        updated_at: new Date().toISOString() 
      })
      .eq('id', ticketId)
      .eq('status', 'open');

    if (ticketError) {
      console.error('Error updating ticket status:', ticketError);
    }

    // Get ticket details for notification
    const { data: ticket } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', ticketId)
      .single();

    // TODO: Send email notification to user
    // For now, we'll log it and could integrate with an email service later
    if (ticket?.user_id && ticket.user_id !== 'anonymous') {
      console.log(`[Notification] Reply sent to ticket ${ticketId} for user ${ticket.user_id}`);
      // Future: await sendEmailNotification(ticket.user_id, ticketId, content);
    }

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
