'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, LayoutDashboard, Target, FileBarChart, Trophy, LogOut, UserCircle, Clock, ListChecks } from 'lucide-react';
import styles from './NavigationLayout.module.css';
import { AttendanceProvider } from '../contexts/AttendanceContext';
import { TodoProvider } from '../contexts/TodoContext';
import { UserProvider, useUser } from '../contexts/UserContext';
import { NotificationsProvider } from '../contexts/NotificationContext';
import { NotificationsBell } from './NotificationsBell';

function NavbarUserMenu() {
    const { user, signOut } = useUser();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const displayName = user?.full_name || user?.username || 'User';
    const avatarUrl = user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=14b8a6&color=fff&bold=true`;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        if (isDropdownOpen) document.addEventListener('mousedown', handleClickOutside);
        else document.removeEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isDropdownOpen]);

    const handleLogout = async () => {
        await signOut();
        router.push('/login');
    };

    return (
        <div className={styles.profileDropdownContainer} ref={dropdownRef}>
            <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className={styles.profileAvatarBtn} aria-label="User Profile Menu">
                <img src={avatarUrl} alt="User Avatar" className={styles.avatarImg} />
            </button>

            {isDropdownOpen && (
                <div className={styles.dropdownMenu}>
                    <div className={styles.dropdownHeader}>
                        <img src={avatarUrl} alt="User Avatar" className={styles.dropdownAvatar} />
                        <div className={styles.dropdownUserInfo}>
                            <p className={styles.dropdownName}>{displayName}</p>
                            <p className={styles.dropdownId}>{user?.role || 'Employee'}</p>
                        </div>
                    </div>
                    <div className={styles.dropdownLinks}>
                        <Link href="/profil" className={styles.dropdownItem} onClick={() => setIsDropdownOpen(false)}>
                            <UserCircle className={styles.dropdownIcon} />
                            <span>Profil Saya</span>
                        </Link>
                        <div className={styles.dropdownDivider}></div>
                        <button className={styles.dropdownItemLogout} onClick={handleLogout} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                            <LogOut className={styles.dropdownIcon} />
                            <span>Log Out</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function NavigationLayout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const pathname = usePathname();

    const isActive = (path: string) => {
        if (path === '/leaderboard') return pathname === '/leaderboard';
        return pathname?.startsWith(path);
    };

    return (
        <UserProvider>
            <NotificationsProvider>
                <TodoProvider>
                    <AttendanceProvider>
                        <div className={styles.layoutContainer}>
                            {/* Top Navbar */}
                            <header className={styles.topNavbar}>
                                <div className={styles.navLeft}>
                                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={styles.hamburgerButton} aria-label="Toggle Sidebar">
                                        <Menu className={styles.menuIcon} />
                                    </button>
                                    <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', marginLeft: '0.5rem' }}>
                                        <Image src="/icon/akaal-logo.png" alt="Akaal Logo" width={120} height={32} priority style={{ width: 'auto', height: '28px', objectFit: 'contain' }} />
                                    </Link>
                                </div>
                                <div className={styles.navRight}>
                                    <NotificationsBell />
                                    <NavbarUserMenu />
                                </div>
                            </header>

                            {/* Bottom Container */}
                            <div className={styles.bottomContainer}>
                                <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : styles.sidebarClosed}`}>
                                    <nav className={styles.sidebarNav}>
                                        <Link href="/dashboard" className={`${styles.navLink} ${isActive('/dashboard') ? styles.activeNavLink : ''}`} title="Dashboard">
                                            <LayoutDashboard className={styles.sidebarIcon} />
                                            <span className={`${styles.navText} ${!isSidebarOpen ? styles.navTextHidden : ''}`}>Dashboard</span>
                                        </Link>
                                        <Link href="/leaderboard" className={`${styles.navLink} ${isActive('/leaderboard') ? styles.activeNavLink : ''}`} title="Leaderboard">
                                            <Trophy className={styles.sidebarIcon} />
                                            <span className={`${styles.navText} ${!isSidebarOpen ? styles.navTextHidden : ''}`}>Leaderboard</span>
                                        </Link>
                                        <Link href="/challenge" className={`${styles.navLink} ${isActive('/challenge') ? styles.activeNavLink : ''}`} title="Challenge">
                                            <Target className={styles.sidebarIcon} />
                                            <span className={`${styles.navText} ${!isSidebarOpen ? styles.navTextHidden : ''}`}>Challenge</span>
                                        </Link>
                                        <Link href="/kehadiran" className={`${styles.navLink} ${isActive('/kehadiran') ? styles.activeNavLink : ''}`} title="Kehadiran">
                                            <Clock className={styles.sidebarIcon} />
                                            <span className={`${styles.navText} ${!isSidebarOpen ? styles.navTextHidden : ''}`}>Kehadiran</span>
                                        </Link>
                                        <Link href="/task" className={`${styles.navLink} ${isActive('/task') ? styles.activeNavLink : ''}`} title="Task">
                                            <FileBarChart className={styles.sidebarIcon} />
                                            <span className={`${styles.navText} ${!isSidebarOpen ? styles.navTextHidden : ''}`}>Task</span>
                                        </Link>
                                        <Link href="/workflow" className={`${styles.navLink} ${isActive('/workflow') ? styles.activeNavLink : ''}`} title="Workflow">
                                            <ListChecks className={styles.sidebarIcon} />
                                            <span className={`${styles.navText} ${!isSidebarOpen ? styles.navTextHidden : ''}`}>Workflow</span>
                                        </Link>
                                    </nav>
                                </aside>

                                <main className={styles.mainContent}>
                                    {children}
                                </main>
                            </div>

                            {/* Mobile Bottom Navigation */}
                            <nav className={styles.bottomNav}>
                                <Link href="/dashboard" className={`${styles.bottomNavLink} ${isActive('/dashboard') ? styles.activeBottomNavLink : ''}`}>
                                    <LayoutDashboard className={styles.bottomNavIcon} />
                                    <span className={styles.bottomNavText}>Home</span>
                                </Link>
                                <Link href="/leaderboard" className={`${styles.bottomNavLink} ${isActive('/leaderboard') ? styles.activeBottomNavLink : ''}`}>
                                    <Trophy className={styles.bottomNavIcon} />
                                    <span className={styles.bottomNavText}>Leaderboard</span>
                                </Link>
                                <Link href="/challenge" className={`${styles.bottomNavLink} ${isActive('/challenge') ? styles.activeBottomNavLink : ''}`}>
                                    <Target className={styles.bottomNavIcon} />
                                    <span className={styles.bottomNavText}>Challenge</span>
                                </Link>
                                <Link href="/kehadiran" className={`${styles.bottomNavLink} ${isActive('/kehadiran') ? styles.activeBottomNavLink : ''}`}>
                                    <Clock className={styles.bottomNavIcon} />
                                    <span className={styles.bottomNavText}>Kehadiran</span>
                                </Link>
                                <Link href="/task" className={`${styles.bottomNavLink} ${isActive('/task') ? styles.activeBottomNavLink : ''}`}>
                                    <FileBarChart className={styles.bottomNavIcon} />
                                    <span className={styles.bottomNavText}>Task</span>
                                </Link>
                                <Link href="/workflow" className={`${styles.bottomNavLink} ${isActive('/workflow') ? styles.activeBottomNavLink : ''}`}>
                                    <ListChecks className={styles.bottomNavIcon} />
                                    <span className={styles.bottomNavText}>Flow</span>
                                </Link>
                            </nav>
                        </div>
                    </AttendanceProvider>
                </TodoProvider>
            </NotificationsProvider>
        </UserProvider>
    );
}
