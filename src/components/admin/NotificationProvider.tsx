'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'react-hot-toast';
import { Ticket, TicketMessage } from '@/types';

interface Notification {
  id: string;
  type: 'new_ticket' | 'ticket_update' | 'new_message';
  title: string;
  message: string;
  ticketId?: string;
  timestamp: Date;
  read: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  soundEnabled: boolean;
  toggleSound: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}

interface NotificationProviderProps {
  children: ReactNode;
}

// Play notification sound
const playNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.value = 0.1;
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.15);
  } catch (e) {
    console.log('Could not play notification sound:', e);
  }
};

// Request browser notification permission
const requestNotificationPermission = async () => {
  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission();
  }
};

// Show browser notification
const showBrowserNotification = (title: string, body: string, url?: string) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    const notification = new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
    });
    
    if (url) {
      notification.onclick = () => {
        window.focus();
        window.location.href = url;
        notification.close();
      };
    }
  }
};

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      read: false,
    };
    setNotifications((prev) => [newNotification, ...prev].slice(0, 50)); // Keep last 50
  }, []);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const toggleSound = () => {
    setSoundEnabled((prev) => !prev);
  };

  useEffect(() => {
    // Request notification permission on mount
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    // Subscribe to new tickets
    const ticketChannel = supabase
      .channel('admin-ticket-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tickets' },
        (payload) => {
          const ticket = payload.new as Ticket;
          addNotification({
            type: 'new_ticket',
            title: 'New Support Ticket',
            message: ticket.issue_summary.substring(0, 100),
            ticketId: ticket.id,
          });
          
          if (soundEnabled) playNotificationSound();
          showBrowserNotification(
            'New Support Ticket',
            ticket.issue_summary.substring(0, 100),
            `/admin/tickets/${ticket.id}`
          );
          
          toast.custom(
            (t) => (
              <div
                className={`${
                  t.visible ? 'animate-enter' : 'animate-leave'
                } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
              >
                <div className="flex-1 w-0 p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-gray-900">New Support Ticket</p>
                      <p className="mt-1 text-sm text-gray-500 line-clamp-2">{ticket.issue_summary}</p>
                    </div>
                  </div>
                </div>
                <div className="flex border-l border-gray-200">
                  <a
                    href={`/admin/tickets/${ticket.id}`}
                    className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-900 hover:bg-gray-50 focus:outline-none"
                  >
                    View
                  </a>
                </div>
              </div>
            ),
            { duration: 5000 }
          );
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tickets' },
        (payload) => {
          const ticket = payload.new as Ticket;
          const oldTicket = payload.old as Partial<Ticket>;
          
          // Only notify on status changes
          if (oldTicket.status !== ticket.status) {
            addNotification({
              type: 'ticket_update',
              title: 'Ticket Updated',
              message: `Ticket status changed to ${ticket.status.replace('_', ' ')}`,
              ticketId: ticket.id,
            });
          }
        }
      )
      .subscribe();

    // Subscribe to new messages
    const messageChannel = supabase
      .channel('admin-message-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const message = payload.new as TicketMessage;
          
          // Only notify for user messages (not admin's own messages)
          if (message.sender === 'user') {
            addNotification({
              type: 'new_message',
              title: 'New Customer Message',
              message: message.content.substring(0, 100),
              ticketId: message.ticket_id,
            });
            
            if (soundEnabled) playNotificationSound();
            showBrowserNotification(
              'New Customer Message',
              message.content.substring(0, 100),
              `/admin/tickets/${message.ticket_id}`
            );
            
            toast.custom(
              (t) => (
                <div
                  className={`${
                    t.visible ? 'animate-enter' : 'animate-leave'
                  } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
                >
                  <div className="flex-1 w-0 p-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-gray-900">New Customer Message</p>
                        <p className="mt-1 text-sm text-gray-500 line-clamp-2">{message.content}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex border-l border-gray-200">
                    <a
                      href={`/admin/tickets/${message.ticket_id}`}
                      className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-900 hover:bg-gray-50 focus:outline-none"
                    >
                      View
                    </a>
                  </div>
                </div>
              ),
              { duration: 5000 }
            );
          }
        }
      )
      .subscribe();

    return () => {
      ticketChannel.unsubscribe();
      messageChannel.unsubscribe();
    };
  }, [soundEnabled, addNotification]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        soundEnabled,
        toggleSound,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
