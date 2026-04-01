import React from 'react';
import Link from 'next/link';
import {
    ArrowLeft,
    FileText,
    UploadCloud,
    Camera,
    Bell
} from 'lucide-react';
import styles from './page.module.css';

export default function BountySubmitFlow({ params }: { params: { id: string } }) {
    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <Link
                    href={`/bounty/${params.id}`}
                    className={styles.backButton}
                    aria-label="Kembali"
                >
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <span className={styles.headerTitle}>Pengajuan Tugas: Kumpulkan 5 Botol PET</span>
            </header>

            <main className={styles.main}>
                {/* Task Summary Card */}
                <div className={styles.summaryCard}>
                    <div className={styles.summaryIconWrapper}>
                        <FileText className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className={styles.summaryTitle}>Kumpulkan 5 Botol PET</h2>
                        <p className={styles.summaryDesc}>
                            Brief description untuk mengumpulkan botol dan menurunkan emisi.
                        </p>
                    </div>
                </div>

                {/* Upload Proof Zone */}
                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Unggah Bukti</h3>
                    <div className={styles.uploadZone}>
                        <div className={styles.uploadIcons}>
                            <Camera className={`w-8 h-8 ${styles.uploadIcon}`} />
                            <UploadCloud className={`w-8 h-8 ${styles.uploadIcon}`} />
                        </div>
                        <p className={styles.uploadText}>
                            Seret & Lepas atau <span className={styles.uploadTextPoint}>Klik</span> untuk Unggah Foto/Video Bukti
                        </p>
                        <p className={styles.uploadSubtext}>
                            (Maks. 5 File, Total 20 MB)
                        </p>
                    </div>
                </div>

                {/* Additional Notes */}
                <div className={styles.sectionLast}>
                    <h3 className={styles.sectionTitle}>Keterangan Tambahan</h3>
                    <textarea
                        className={styles.textarea}
                        placeholder="Tuliskan detail proses pengerjaan Anda di sini..."
                    ></textarea>
                </div>

                {/* Actions Layout */}
                <div className={styles.actionsLayout}>
                    <Link href={`/bounty/${params.id}`} style={{ flex: 1, display: 'flex' }}>
                        <button className={styles.btnSecondary} style={{ width: '100%' }}>
                            Kembali
                        </button>
                    </Link>
                    <Link href={`/`} style={{ flex: 1, display: 'flex' }}>
                        <button className={styles.btnPrimary} style={{ width: '100%' }}>
                            Kirim Pengajuan
                        </button>
                    </Link>
                </div>

                {/* Success Notification Mock State */}
                <div className={styles.successNotification}>
                    <div className={styles.successBgTopRight} />
                    <div className={styles.successIconWrapper}>
                        <Bell className={`w-5 h-5 ${styles.bellIcon}`} />
                    </div>
                    <div className={styles.successTextContent}>
                        <h4 className={styles.successTitle}>Berhasil!</h4>
                        <p className={styles.successSubtitle}>Menunggu Verifikasi</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
