'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import styles from './login.module.css';
import { supabase } from '../../lib/supabase';

export default function LoginPage() {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Special Admin access (hardcoded for now)
        if (identifier === 'Asia2025!' && password === 'Asia2025!') {
            setLoading(false);
            router.push('/admin');
            return;
        }

        // Validate email format for non-admin accounts manually since we changed type to "text"
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (identifier !== 'Asia2025!' && !emailRegex.test(identifier)) {
            setError('Masukkan format email yang valid atau ID Admin yang benar.');
            setLoading(false);
            return;
        }

        // Try Supabase Auth using email
        const { data, error: authError } = await supabase.auth.signInWithPassword({
            email: identifier,
            password,
        });

        if (authError || !data.user) {
            setError('Akun tidak ditemukan atau password salah. Hubungi Admin jika belum memiliki akun.');
            setLoading(false);
            return;
        }

        // Successfully logged in
        setLoading(false);
        router.push('/dashboard');
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <Link href="/" className={styles.backButton} aria-label="Back to Home">
                    <ArrowLeft className={styles.backIcon} />
                </Link>
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
                <div className={styles.loginCard}>
                    <h1 className={styles.title}>Login to Akaal</h1>
                    <p className={styles.subtitle}>Sistem karyawan reguler & portal Admin.</p>

                    {error && <div className={styles.errorMessage}>{error}</div>}

                    <form className={styles.formContainer} onSubmit={handleLogin}>
                        <div className={styles.formGroup}>
                            <label className={styles.label} htmlFor="loginIdentifier">
                                Email
                            </label>
                            <input
                                type="text"
                                id="loginIdentifier"
                                className={styles.inputField}
                                placeholder="nama@akaal.team atau ID Admin"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label} htmlFor="password">
                                Password
                            </label>
                            <div className={styles.passwordWrapper}>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    className={styles.inputField}
                                    placeholder="Masukkan password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    style={{ paddingRight: '3rem' }}
                                />
                                <button
                                    type="button"
                                    className={styles.eyeBtn}
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className={styles.forgotPasswordWrapper}>
                            <Link href="#" className={styles.textLink}>
                                Forgot password?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            className={styles.btnPrimary}
                            disabled={loading}
                            style={{ textAlign: 'center', width: '100%', cursor: loading ? 'not-allowed' : 'pointer', border: 'none', fontFamily: 'inherit', fontSize: '1rem', fontWeight: 600, opacity: loading ? 0.7 : 1 }}
                        >
                            {loading ? 'Memverifikasi...' : 'Login'}
                        </button>
                    </form>

                    <div className={styles.footerLinks}>
                        <span className={styles.footerText}>Belum punya akun? </span>
                        <Link href="#" className={styles.textLinkStrong}>
                            Hubungi Admin
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
