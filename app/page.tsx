import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './landing.module.css';

export default function LandingPage() {
    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <Link href="/">
                    <Image
                        src="/icon/akaal-logo.png"
                        alt="Akaal Logo"
                        width={120}
                        height={32}
                        priority
                        style={{ width: 'auto', height: '28px', objectFit: 'contain' }}
                    />
                </Link>
            </header>
            <main className={styles.main}>
                <div className={styles.heroBlock}>
                    <h1 className={styles.headline}>Welcome to <span className={styles.highlightText}>Akaal tee-am</span></h1>
                    <p className={styles.bodycopy}>Start Winning by Manage Your Team</p>

                    <div className={styles.ctaGroup}>
                        <Link href="/login" className={styles.btnPrimary}>
                            Login
                        </Link>
                        <Link href="#" className={styles.btnSecondary} target="_blank" rel="noopener noreferrer">
                            Contact Us
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
