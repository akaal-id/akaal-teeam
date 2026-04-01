'use client';
import React from 'react';
import styles from './page.module.css';
import { Users, Lock } from 'lucide-react';

export default function LeaderboardPage() {
    return (
        <div className={styles.container}>
            <div className={styles.placeholderCard}>
                <div className={styles.iconWrapper}>
                    <Users size={48} />
                    <div className={styles.lockBadge}><Lock size={16} /></div>
                </div>
                <h1 className={styles.title}>Leaderboard (Coming Soon)</h1>
                <p className={styles.subtitle}>Fitur kompetisi poin dan klasemen kinerja karyawan sedang dalam tahap pengembangan. Nantikan pembaruan selanjutnya di Akaal Teeam, di mana setiap kontribusi Anda akan mendapatkan rekognisi secara transparan!</p>
                <button className={styles.primaryBtn} disabled>Akses Belum Tersedia</button>
            </div>
        </div>
    );
}
