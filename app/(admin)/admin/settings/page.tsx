'use client';
import React from 'react';
import styles from '../admin.module.css';
import { Save } from 'lucide-react';

export default function AdminSettingsPage() {
    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Peraturan & Konfigurasi Sistem</h1>
                <button className={styles.primaryBtn}><Save size={16} /> Simpan Perubahan</button>
            </header>

            <div className={styles.sectionCard}>
                <h2 className={styles.sectionTitle}>Konfigurasi Absensi & Jam Kerja</h2>

                <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Waktu Buka Absen Masuk</label>
                        <input type="time" defaultValue="06:30" className={styles.inputField} />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Tenggat Terlambat (Late)</label>
                        <input type="time" defaultValue="08:15" className={styles.inputField} />
                    </div>
                </div>

                <div className={styles.formGrid} style={{ marginTop: '1.5rem' }}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Batas Absen Pulang</label>
                        <input type="time" defaultValue="17:00" className={styles.inputField} />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Set Hari Libur (Tidak Ada Absen)</label>
                        <select className={`${styles.inputField} ${styles.inputFieldSelect}`}>
                            <option value="weekend">Sabtu & Minggu</option>
                            <option value="sunday">Hanya Minggu</option>
                            <option value="none">Tidak Ada (Shift Full)</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className={styles.sectionCard}>
                <h2 className={styles.sectionTitle}>Konfigurasi Gamifikasi Poin</h2>
                <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Reward Poin untuk 1 Task Selesai</label>
                        <input type="number" defaultValue="50" className={styles.inputField} />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Penalti Poin untuk Terlambat Absen</label>
                        <input type="number" defaultValue="-15" className={styles.inputField} />
                    </div>
                </div>
            </div>
        </div>
    );
}
