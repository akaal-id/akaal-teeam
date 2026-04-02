import React from 'react';
import AdminLayout from '../components/AdminLayout';
import { UserProvider } from '../contexts/UserContext';
import { NotificationsProvider } from '../contexts/NotificationContext';

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
    return (
        <UserProvider>
            <NotificationsProvider>
                <AdminLayout>{children}</AdminLayout>
            </NotificationsProvider>
        </UserProvider>
    );
}
