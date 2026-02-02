import { Toaster } from 'react-hot-toast';
import { NotificationProvider } from '@/components/admin/NotificationProvider';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NotificationProvider>
      <Toaster position="top-right" />
      {children}
    </NotificationProvider>
  );
}
