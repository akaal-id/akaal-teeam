'use client';
import React from 'react';
import styles from './page.module.css';
import { Target, Lock } from 'lucide-react';

export default function ChallengePage() {
    return (
        <div className={styles.container}>
            <div className={styles.placeholderCard}>
                <div className={styles.iconWrapper}>
                    <Target size={48} />
                    <div className={styles.lockBadge}><Lock size={16} /></div>
                </div>
                <h1 className={styles.title}>Tantangan (Coming Soon)</h1>
                <p className={styles.subtitle}>Fitur tantangan poin, badge pencapaian bulanan, dan sistem gamifikasi pekerjaan sedang kami siapkan untuk Anda. Terus selesaikan Task harian Anda untuk bersiap dengan update ini!</p>
                <button className={styles.primaryBtn} disabled>Akses Belum Tersedia</button>
            </div>
        </div>
    );
}
