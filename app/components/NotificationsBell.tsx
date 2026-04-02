'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import styles from './NavigationLayout.module.css';
import { useUser } from '../contexts/UserContext';
import { useNotifications } from '../contexts/NotificationContext';

export function NotificationsBell() {
    const { unreadCount, unreadItems, markNotificationRead, markAllRead } = useNotifications();
    const { user } = useUser();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        else document.removeEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    return (
        <div className={styles.notificationContainer} ref={dropdownRef}>
            <button
                className={`${styles.iconButton} ${isOpen ? styles.activeIconButton : ''}`}
                aria-label="Notifications"
                onClick={() => setIsOpen(v => !v)}
                type="button"
            >
                <Bell className={styles.topIcon} />
                {unreadCount > 0 && <span className={styles.notificationBadge}>{unreadCount}</span>}
            </button>

            {isOpen && (
                <div className={styles.notificationDropdown}>
                    <div className={styles.notificationDropdownHeader}>
                        <span className={styles.notificationDropdownTitle}>Notifikasi</span>
                        {unreadCount > 0 && (
                            <button className={styles.notificationMarkAllBtn} onClick={() => void markAllRead()} type="button">
                                Tandai semua terbaca
                            </button>
                        )}
                    </div>

                    {unreadItems.length === 0 ? (
                        <div className={styles.notificationEmpty}>Belum ada notifikasi</div>
                    ) : (
                        <div className={styles.notificationList}>
                            {unreadItems.map(item => (
                                <button
                                    key={item.id}
                                    className={styles.notificationItem}
                                    onClick={() => {
                                        void markNotificationRead(item.id);
                                        setIsOpen(false);
                                        if (item.type === 'leave_request' && item.leaveRequestId) {
                                            const isAdmin = (user?.role || '').toLowerCase().includes('admin');
                                            router.push(
                                                isAdmin
                                                    ? `/admin/izin?leaveId=${item.leaveRequestId}`
                                                    : `/kehadiran?leaveId=${item.leaveRequestId}`
                                            );
                                            return;
                                        }
                                        if (item.taskId) {
                                            router.push(`/task?taskId=${item.taskId}`);
                                        }
                                    }}
                                    type="button"
                                >
                                    <div className={styles.notificationItemTitle}>{item.title}</div>
                                    <div className={styles.notificationItemMeta}>
                                        {item.status} •{' '}
                                        {item.createdAt ? new Date(item.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
