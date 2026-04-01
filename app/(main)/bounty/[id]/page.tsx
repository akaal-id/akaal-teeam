import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ClipboardList, Briefcase, ChevronRight } from 'lucide-react';
import styles from './page.module.css';

export default function BountyDetail({ params }: { params: { id: string } }) {
    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <Link
                    href="/challenge"
                    className={styles.backButton}
                    aria-label="Kembali"
                >
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <span className={styles.headerTitle}>Detail Tugas</span>
            </header>

            <main className={styles.main}>
                {/* Title Section */}
                <div className={styles.titleSection}>
                    <div className={styles.titleBgTopRight} />
                    <div className={styles.titleBgBottomLeft} />
                    <div className={styles.iconWrapper}>
                        <ClipboardList className="w-8 h-8" />
                    </div>
                    <h1 className={styles.titleText}>Kumpulkan 5 Botol PET</h1>
                </div>

                {/* Requirements Section */}
                <div className={styles.contentSection}>
                    <h2 className={styles.sectionTitle}>Requirements</h2>
                    <ul className={`${styles.list} ${styles.listDisc}`}>
                        <li>Kumpulkan 5 Botol PET padat yang proporsional</li>
                        <li>Bersihkan botol dari kotoran</li>
                        <li>Mengunggah bukti kumpulan 5 Botol PET</li>
                    </ul>
                </div>

                {/* Instructions Section */}
                <div className={styles.contentSection}>
                    <h2 className={styles.sectionTitle}>Instructions</h2>
                    <ol className={`${styles.list} ${styles.listDecimal}`}>
                        <li>Kumpulkan 5 botol bekas yang akan didaur ulang.</li>
                        <li>Tuliskan proses pengerjaan Anda untuk divalidasi.</li>
                        <li>Dapatkan persetujuan dari pengawas.</li>
                    </ol>
                </div>

                {/* Call To Action */}
                <Link href={`/bounty/${params.id}/submit`}>
                    <button className={styles.ctaButton}>
                        KERJAKAN TUGAS
                    </button>
                </Link>
            </main>

            {/* Bottom Floating Card */}
            <div className={styles.bottomCard}>
                <div className={styles.bottomCardLeft}>
                    <div className={styles.bottomCardIcon}>
                        <Briefcase className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className={styles.bottomCardTitle}>Tugas Saya</h3>
                        <p className={styles.bottomCardStatus}>Status: Sedang Dikerjakan</p>
                    </div>
                </div>
                <div className={styles.bottomCardChevron}>
                    <ChevronRight className={`w-5 h-5 ${styles.bottomCardChevronIcon}`} />
                </div>
            </div>
        </div>
    );
}
