'use client';
import React from 'react';
import styles from './admin.module.css';
import { Users, FileBarChart, Clock, Activity, FileText } from 'lucide-react';

export default function AdminPages() {
    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Admin Dashboard</h1>
            </header>

            <div className={styles.metricsGrid}>
                <div className={styles.metricCard}>
                    <div className={styles.metricLabel}>
                        <span style={{ color: '#94a3b8' }}>Total Karyawan Aktif</span>
                        <div className={styles.iconWrapperTeal}><Users size={20} /></div>
                    </div>
                    <p className={styles.metricValue}>14</p>
                </div>
                <div className={styles.metricCard}>
                    <div className={styles.metricLabel}>
                        <span style={{ color: '#94a3b8' }}>Tugas Pending System</span>
                        <div className={styles.iconWrapperOrange}><FileBarChart size={20} /></div>
                    </div>
                    <p className={styles.metricValueOrange}>38</p>
                </div>
                <div className={styles.metricCard}>
                    <div className={styles.metricLabel}>
                        <span style={{ color: '#94a3b8' }}>Kehadiran Hari Ini</span>
                        <div className={styles.iconWrapperPurple}><Clock size={20} /></div>
                    </div>
                    <p className={styles.metricValueTeal}>12<span style={{ fontSize: '1.25rem', color: '#64748b' }}>/14</span></p>
                </div>
            </div>

            <div className={styles.sectionCard}>
                <h2 className={styles.sectionTitle}><Activity size={20} color="var(--teal)" /> Log Sistem Terbaru</h2>
                <div className={styles.logList}>
                    <div className={styles.logItem}>
                        <div className={styles.logText}>
                            <div className={styles.logIcon}><FileText size={16} color="var(--teal)" /></div>
                            <div><span style={{ fontWeight: 600 }}>Andi Saputra</span> menambahkan task baru "Review Q3"</div>
                        </div>
                        <span className={styles.logTime}>2 menit lalu</span>
                    </div>
                    <div className={styles.logItem}>
                        <div className={styles.logText}>
                            <div className={styles.logIcon}><Clock size={16} color="#f59e0b" /></div>
                            <div><span style={{ fontWeight: 600 }}>Diana Maharani</span> Absen Masuk</div>
                        </div>
                        <span className={styles.logTime}>1 jam lalu</span>
                    </div>
                    <div className={styles.logItem}>
                        <div className={styles.logText}>
                            <div className={styles.logIcon}><Users size={16} color="var(--purple)" /></div>
                            <div>Admin <span style={{ fontWeight: 600 }}>Akaal User</span> memperbarui departemen Budi.</div>
                        </div>
                        <span className={styles.logTime}>2 jam lalu</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
