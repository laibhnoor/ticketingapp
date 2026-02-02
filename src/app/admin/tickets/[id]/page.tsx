'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Ticket, TicketMessage } from '@/types';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import AuthGuard from '@/components/admin/AuthGuard';
import AdminHeader from '@/components/admin/AdminHeader';
import { toast } from 'react-hot-toast';

export default function TicketPage() {
  const params = useParams();
  const ticketId = params.id as string;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [replyText, setReplyText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const fetchTicketAndMessages = async () => {
      try {
        // Fetch ticket
        const { data: ticketData, error: ticketError } = await supabase
          .from('tickets')
          .select('*')
          .eq('id', ticketId)
          .single();

        if (ticketError) throw ticketError;
        setTicket(ticketData);

        // Fetch messages from API
        const messagesRes = await fetch(`/api/tickets/${ticketId}/messages`);
        if (messagesRes.ok) {
          const messagesData = await messagesRes.json();
          setMessages(messagesData);
        }
      } catch (err) {
        console.error('Error fetching ticket:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTicketAndMessages();

    // Subscribe to message updates via Supabase Realtime
    const channel = supabase
      .channel(`messages:${ticketId}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `ticket_id=eq.${ticketId}`
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as TicketMessage]);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [ticketId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !ticket) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyText.trim(), sender: 'admin' }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to send message');
      }

      const newMessage = await res.json();
      setMessages((prev) => [...prev, newMessage]);
      setReplyText('');
      setTicket((prev) => (prev ? { ...prev, status: 'in_progress' } : null));
      toast.success('Reply sent!');
    } catch (err) {
      console.error('Error sending reply:', err);
      toast.error('Failed to send reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolve = async () => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'resolved' }),
      });

      if (!res.ok) throw new Error('Failed to resolve ticket');

      setTicket((prev) => (prev ? { ...prev, status: 'resolved' } : null));
      toast.success('Ticket resolved!');
    } catch (err) {
      console.error('Error resolving ticket:', err);
      toast.error('Failed to resolve ticket');
    }
  };

  const updateStatus = async (status: 'open' | 'in_progress' | 'resolved') => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error('Failed to update status');

      setTicket((prev) => (prev ? { ...prev, status } : null));
      toast.success(`Status updated to ${status.replace('_', ' ')}`);
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error('Failed to update status');
    }
  };

  if (isLoading) {
    return (
      <AuthGuard>
        <main className="min-h-screen bg-gray-50">
          <AdminHeader />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <p className="text-gray-500">Loading ticket...</p>
          </div>
        </main>
      </AuthGuard>
    );
  }

  if (!ticket) {
    return (
      <AuthGuard>
        <main className="min-h-screen bg-gray-50">
          <AdminHeader />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <p className="text-gray-500">Ticket not found</p>
          </div>
        </main>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <main className="min-h-screen bg-gray-50">
        <AdminHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/admin/dashboard" className="text-gray-600 hover:text-gray-900 mb-6 inline-flex items-center gap-1 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>

          <div className="grid md:grid-cols-3 gap-6 mt-4">
            {/* Main Content */}
            <div className="md:col-span-2">
              <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <h1 className="text-xl font-semibold text-gray-900 mb-4">
                  {ticket.issue_summary}
                </h1>

                {/* Messages */}
                <div className="border-t border-gray-200 pt-6 mb-6">
                  <h2 className="text-base font-medium text-gray-900 mb-4">
                    Conversation
                  </h2>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {messages.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">
                        No messages yet. Send a reply to start the conversation.
                      </p>
                    ) : (
                      messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`p-4 rounded-lg ${
                            msg.sender === 'admin'
                              ? 'bg-gray-900 text-white ml-8'
                              : 'bg-gray-100 mr-8'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className={`text-xs font-medium uppercase tracking-wide ${msg.sender === 'admin' ? 'text-gray-400' : 'text-gray-500'}`}>
                              {msg.sender === 'admin' ? 'Admin Reply' : 'Customer'}
                            </span>
                            <span className={`text-xs ${msg.sender === 'admin' ? 'text-gray-400' : 'text-gray-500'}`}>
                              {new Date(msg.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className={msg.sender === 'admin' ? 'text-gray-100' : 'text-gray-700'}>{msg.content}</p>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* Reply Form */}
                {ticket.status !== 'resolved' && (
                  <form onSubmit={handleReply} className="border-t border-gray-200 pt-6">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type your response..."
                      className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-900 placeholder-gray-400"
                      rows={4}
                    />
                    <div className="mt-4 flex gap-3">
                      <button
                        type="submit"
                        disabled={isSubmitting || !replyText.trim()}
                        className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition text-sm font-medium"
                      >
                        {isSubmitting ? 'Sending...' : 'Send Reply'}
                      </button>
                      <button
                        type="button"
                        onClick={handleResolve}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
                      >
                        Mark as Resolved
                      </button>
                    </div>
                  </form>
                )}

                {ticket.status === 'resolved' && (
                  <div className="border-t border-gray-200 pt-6">
                    <div className="bg-green-50 p-4 rounded-lg text-center text-green-700 border border-green-200">
                      ✓ This ticket has been resolved
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 h-fit">
              <h3 className="text-base font-medium text-gray-900 mb-4">
                Ticket Details
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-500">Status</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`inline-block w-2.5 h-2.5 rounded-full ${
                        ticket.status === 'open'
                          ? 'bg-red-500'
                          : ticket.status === 'in_progress'
                          ? 'bg-amber-500'
                          : 'bg-green-500'
                      }`}
                    ></span>
                    <span className="font-medium text-gray-900 capitalize">
                      {ticket.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Ticket ID</div>
                  <div className="font-mono text-sm text-gray-700 mt-1">{ticket.id}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Created</div>
                  <div className="text-sm text-gray-700 mt-1">
                    {new Date(ticket.created_at).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Last Updated</div>
                  <div className="text-sm text-gray-700 mt-1">
                    {new Date(ticket.updated_at).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-500 mb-3">Quick Actions</h4>
                <div className="space-y-2">
                  {ticket.status === 'open' && (
                    <button
                      onClick={() => updateStatus('in_progress')}
                      className="w-full px-3 py-2 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 text-sm font-medium transition"
                    >
                      Mark In Progress
                    </button>
                  )}
                  {ticket.status !== 'resolved' && (
                    <button
                      onClick={handleResolve}
                      className="w-full px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 text-sm font-medium transition"
                    >
                      Mark Resolved
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </AuthGuard>
  );
}
