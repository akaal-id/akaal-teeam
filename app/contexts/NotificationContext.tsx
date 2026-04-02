'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useUser } from './UserContext';

export type NotificationType = 'task' | 'task_message' | 'leave_request';

export interface NotificationItem {
    id: string;
    type: NotificationType;
    taskId: string | null;
    leaveRequestId: string | null;
    messageId?: string;
    title: string;
    status: string | null;
    createdAt: string;
}

interface NotificationContextType {
    unreadCount: number;
    unreadItems: NotificationItem[];
    markTaskRead: (taskId: string) => Promise<void>;
    markNotificationRead: (notificationId: string) => Promise<void>;
    markAllRead: () => Promise<void>;
    loading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
    const { user, loading: userLoading } = useUser();
    const [unreadItems, setUnreadItems] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetchNotifications = async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/notifications?user_id=${user.id}&limit=20`);
            const data = await res.json();

            if (!res.ok) return;
            const items = Array.isArray(data?.items) ? data.items : [];
            setUnreadItems(
                items.map((n: any) => ({
                    id: String(n.id),
                    type: (n.type as NotificationType) || 'task',
                    taskId: n.task_id ?? null,
                    leaveRequestId: n.leave_request_id ?? null,
                    messageId: n.message_id,
                    title: n.title,
                    status: n.status ?? null,
                    createdAt: n.created_at,
                }))
            );
            setUnreadCount(typeof data?.unreadCount === 'number' ? data.unreadCount : items.length);
        } catch {
            // ignore polling errors
        } finally {
            setLoading(false);
        }
    };

    const markTaskRead = async (taskId: string) => {
        if (!user?.id) return;
        const res = await fetch('/api/notifications/mark-task-read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: user.id, task_id: taskId }),
        });
        if (!res.ok) return;
        await fetchNotifications();
    };

    const markNotificationRead = async (notificationId: string) => {
        if (!user?.id) return;
        const res = await fetch('/api/notifications/mark-read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: user.id, notification_id: notificationId }),
        });
        if (!res.ok) return;
        await fetchNotifications();
    };

    const markAllRead = async () => {
        if (!user?.id) return;
        const res = await fetch('/api/notifications/mark-all-read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: user.id }),
        });
        if (!res.ok) return;
        await fetchNotifications();
    };

    useEffect(() => {
        if (userLoading) return;
        if (!user?.id) return;

        let cancelled = false;
        const run = async () => {
            if (cancelled) return;
            await fetchNotifications();
        };

        run();
        const interval = window.setInterval(run, 10000);

        return () => {
            cancelled = true;
            window.clearInterval(interval);
        };
    }, [user?.id, userLoading]);

    const value: NotificationContextType = useMemo(() => {
        return {
            unreadCount,
            unreadItems,
            markTaskRead,
            markNotificationRead,
            markAllRead,
            loading,
        };
    }, [unreadCount, unreadItems, markTaskRead, markNotificationRead, markAllRead, loading]);

    return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (!context) throw new Error('useNotifications must be used within NotificationsProvider');
    return context;
}

