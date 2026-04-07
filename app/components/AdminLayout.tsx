'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, LayoutDashboard, Users, Settings, LogOut, Briefcase, FileText, Clock } from 'lucide-react';
import styles from './AdminLayout.module.css';
import { NotificationsBell } from './NotificationsBell';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const handleLogout = () => {
        router.push('/');
    };

    return (
        <div className={styles.layoutContainer}>
            <header className={styles.topNavbar}>
                <div className={styles.navLeft}>
                    <button onClick={toggleSidebar} className={styles.hamburgerButton} aria-label="Toggle Sidebar">
                        <Menu className={styles.menuIcon} />
                    </button>
                    <Link href="/admin" style={{ display: 'flex', alignItems: 'center', marginLeft: '0.5rem' }}>
                        <Image src="/icon/akaal-logo.png" alt="Akaal Logo" width={120} height={32} priority style={{ width: 'auto', height: '28px', objectFit: 'contain' }} />
                        <span style={{ marginLeft: '1rem', color: 'var(--purple)', fontWeight: 700, fontSize: '0.8rem', backgroundColor: 'rgba(168, 85, 247, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(168, 85, 247, 0.2)' }}>ADMIN MODE</span>
                    </Link>
                </div>
                <div className={styles.navRight}>
                    <NotificationsBell />
                    <button onClick={handleLogout} className={styles.dropdownItemLogout} style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '0.5rem', padding: '0.5rem 1rem' }}>
                        <LogOut className={styles.dropdownIcon} />
                        <span>Keluar System</span>
                    </button>
                </div>
            </header>

            <div className={styles.bottomContainer}>
                <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : styles.sidebarClosed}`}>
                    <nav className={styles.sidebarNav}>
                        <Link href="/admin" className={`${styles.navLink} ${pathname === '/admin' ? styles.activeNavLink : ''}`} title="Dashboard">
                            <LayoutDashboard className={styles.sidebarIcon} />
                            <span className={`${styles.navText} ${!isSidebarOpen ? styles.navTextHidden : ''}`}>Dashboard</span>
                        </Link>
                        <Link href="/admin/users" className={`${styles.navLink} ${pathname?.startsWith('/admin/users') ? styles.activeNavLink : ''}`} title="Kelola User">
                            <Users className={styles.sidebarIcon} />
                            <span className={`${styles.navText} ${!isSidebarOpen ? styles.navTextHidden : ''}`}>Kelola User</span>
                        </Link>
                        <Link href="/admin/kehadiran" className={`${styles.navLink} ${pathname?.startsWith('/admin/kehadiran') ? styles.activeNavLink : ''}`} title="Kehadiran">
                            <Clock className={styles.sidebarIcon} />
                            <span className={`${styles.navText} ${!isSidebarOpen ? styles.navTextHidden : ''}`}>Kehadiran</span>
                        </Link>
                        <Link href="/admin/tasks" className={`${styles.navLink} ${pathname?.startsWith('/admin/tasks') ? styles.activeNavLink : ''}`} title="Master Task">
                            <Briefcase className={styles.sidebarIcon} />
                            <span className={`${styles.navText} ${!isSidebarOpen ? styles.navTextHidden : ''}`}>Master Task</span>
                        </Link>
                        <Link href="/admin/izin" className={`${styles.navLink} ${pathname?.startsWith('/admin/izin') ? styles.activeNavLink : ''}`} title="Izin & Sakit">
                            <FileText className={styles.sidebarIcon} />
                            <span className={`${styles.navText} ${!isSidebarOpen ? styles.navTextHidden : ''}`}>Izin & Sakit</span>
                        </Link>
                        <Link href="/admin/settings" className={`${styles.navLink} ${pathname?.startsWith('/admin/settings') ? styles.activeNavLink : ''}`} title="Setting">
                            <Settings className={styles.sidebarIcon} />
                            <span className={`${styles.navText} ${!isSidebarOpen ? styles.navTextHidden : ''}`}>Setting</span>
                        </Link>
                    </nav>
                </aside>

                <main className={styles.mainContent}>
                    {children}
                </main>
            </div>

            <nav className={styles.bottomNav}>
                <Link href="/admin" className={`${styles.bottomNavLink} ${pathname === '/admin' ? styles.activeBottomNavLink : ''}`}><LayoutDashboard className={styles.bottomNavIcon} /><span className={styles.bottomNavText}>Home</span></Link>
                <Link href="/admin/users" className={`${styles.bottomNavLink} ${pathname?.startsWith('/admin/users') ? styles.activeBottomNavLink : ''}`}><Users className={styles.bottomNavIcon} /><span className={styles.bottomNavText}>Users</span></Link>
                <Link href="/admin/kehadiran" className={`${styles.bottomNavLink} ${pathname?.startsWith('/admin/kehadiran') ? styles.activeBottomNavLink : ''}`}><Clock className={styles.bottomNavIcon} /><span className={styles.bottomNavText}>Absen</span></Link>
                <Link href="/admin/tasks" className={`${styles.bottomNavLink} ${pathname?.startsWith('/admin/tasks') ? styles.activeBottomNavLink : ''}`}><Briefcase className={styles.bottomNavIcon} /><span className={styles.bottomNavText}>Tasks</span></Link>
                <Link href="/admin/izin" className={`${styles.bottomNavLink} ${pathname?.startsWith('/admin/izin') ? styles.activeBottomNavLink : ''}`}><FileText className={styles.bottomNavIcon} /><span className={styles.bottomNavText}>Izin</span></Link>
                <Link href="/admin/settings" className={`${styles.bottomNavLink} ${pathname?.startsWith('/admin/settings') ? styles.activeBottomNavLink : ''}`}><Settings className={styles.bottomNavIcon} /><span className={styles.bottomNavText}>Set</span></Link>
            </nav>
        </div>
    );
}
