'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Ticket } from '@/types';
import Link from 'next/link';
import AuthGuard from '@/components/admin/AuthGuard';
import AdminHeader from '@/components/admin/AdminHeader';

export default function Dashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const { data, error } = await supabase
          .from('tickets')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setTickets(data || []);
      } catch (err) {
        console.error('Error fetching tickets:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTickets();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('tickets')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tickets' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTickets((prev) => [payload.new as Ticket, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setTickets((prev) =>
              prev.map((t) => (t.id === payload.new.id ? (payload.new as Ticket) : t))
            );
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  return (
    <AuthGuard>
      <main className="min-h-screen bg-gray-50">
        <AdminHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-gray-900">
              Support Dashboard
            </h1>
            <p className="text-gray-500 mt-1">Manage support tickets and conversations</p>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <div className="text-gray-500 text-sm">Open Tickets</div>
              <div className="text-3xl font-semibold text-red-600 mt-1">
                {tickets.filter((t) => t.status === 'open').length}
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <div className="text-gray-500 text-sm">In Progress</div>
              <div className="text-3xl font-semibold text-amber-600 mt-1">
                {tickets.filter((t) => t.status === 'in_progress').length}
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <div className="text-gray-500 text-sm">Resolved</div>
              <div className="text-3xl font-semibold text-green-600 mt-1">
                {tickets.filter((t) => t.status === 'resolved').length}
              </div>
            </div>
          </div>

          {/* Tickets Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ticket ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Issue Summary
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        Loading tickets...
                      </td>
                    </tr>
                  ) : tickets.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        No tickets yet
                      </td>
                    </tr>
                  ) : (
                    tickets.map((ticket) => (
                      <tr key={ticket.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                          {ticket.id.slice(0, 8)}...
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {ticket.issue_summary}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                              ticket.status === 'open'
                                ? 'bg-red-50 text-red-700'
                                : ticket.status === 'in_progress'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-green-50 text-green-700'
                            }`}
                          >
                            {ticket.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(ticket.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href={`/admin/tickets/${ticket.id}`}
                            className="text-gray-900 hover:text-gray-600 text-sm font-medium"
                          >
                            View →
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </AuthGuard>
  );
}
