'use client';

import React, { useState } from 'react';
import { useUser } from '../../contexts/UserContext';
import { supabase } from '../../../lib/supabase';
import { User, Mail, Briefcase, Calendar, FileText, Edit2, Save, X, CheckCircle2, Clock, Shield, Loader2 } from 'lucide-react';
import styles from './page.module.css';

export default function ProfilPage() {
    const { user, refreshUser } = useUser();
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const [form, setForm] = useState({
        full_name: '',
        username: '',
        bio: '',
        dob: '',
    });

    const startEdit = () => {
        setForm({
            full_name: user?.full_name || '',
            username: user?.username || '',
            bio: user?.bio || '',
            dob: user?.dob || '',
        });
        setIsEditing(true);
        setSaveSuccess(false);
    };

    const cancelEdit = () => {
        setIsEditing(false);
    };

    const handleSave = async () => {
        if (!user?.id) return;
        setSaving(true);

        const { error } = await supabase
            .from('profiles')
            .update({
                full_name: form.full_name,
                username: form.username,
                bio: form.bio,
                dob: form.dob || null,
            })
            .eq('id', user.id);

        setSaving(false);

        if (!error) {
            await refreshUser();
            setIsEditing(false);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } else {
            alert('Gagal menyimpan: ' + error.message);
        }
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    if (!user) {
        return (
            <div className={styles.container}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem', color: '#94a3b8' }}>
                    <Loader2 size={24} /> Memuat profil...
                </div>
            </div>
        );
    }

    const displayName = user.full_name || user.username || 'User';
    const avatarUrl = user.avatar_url || null;

    return (
        <div className={styles.container}>
            <header className={styles.pageHeader}>
                <div>
                    <h1 className={styles.headerTitle}>Profil Saya</h1>
                    <p className={styles.subtitle}>Kelola informasi akun dan data pribadi Anda</p>
                </div>
                {!isEditing ? (
                    <button className={styles.editBtn} onClick={startEdit}>
                        <Edit2 size={16} /> Edit Profil
                    </button>
                ) : (
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button className={styles.cancelBtn} onClick={cancelEdit}>
                            <X size={16} /> Batal
                        </button>
                        <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                            {saving ? <Loader2 size={16} /> : <Save size={16} />}
                            {saving ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                )}
            </header>

            {saveSuccess && (
                <div className={styles.successBanner}>
                    <CheckCircle2 size={18} /> Profil berhasil diperbarui!
                </div>
            )}

            <div className={styles.profileGrid}>
                {/* Left: Avatar Card */}
                <div className={styles.avatarCard}>
                    <div className={styles.avatarWrapper}>
                        {avatarUrl ? (
                            <img src={avatarUrl} alt={displayName} className={styles.avatarImg} />
                        ) : (
                            <div className={styles.avatarInitials}>
                                {getInitials(displayName)}
                            </div>
                        )}
                        <div className={styles.statusDot} title="Online"></div>
                    </div>

                    <h2 className={styles.profileName}>{displayName}</h2>
                    <p className={styles.profileRole}>{user.role}</p>
                    <span className={`${styles.statusBadge} ${user.status === 'Active' ? styles.statusActive : styles.statusInactive}`}>
                        {user.status === 'Active' ? '● Aktif' : '● Nonaktif'}
                    </span>

                    <div className={styles.profileStats}>
                        <div className={styles.statItem}>
                            <span className={styles.statLabel}>Member Sejak</span>
                            <span className={styles.statValue}>
                                {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right: Detail Info */}
                <div className={styles.detailCard}>
                    <h3 className={styles.sectionTitle}>Informasi Pribadi</h3>

                    <div className={styles.fieldGrid}>
                        {/* Full Name */}
                        <div className={styles.fieldGroup}>
                            <label className={styles.fieldLabel}><User size={14} /> Nama Lengkap</label>
                            {isEditing ? (
                                <input
                                    className={styles.fieldInput}
                                    value={form.full_name}
                                    onChange={e => setForm({ ...form, full_name: e.target.value })}
                                    placeholder="Nama lengkap Anda"
                                />
                            ) : (
                                <p className={styles.fieldValue}>{user.full_name || '-'}</p>
                            )}
                        </div>

                        {/* Username */}
                        <div className={styles.fieldGroup}>
                            <label className={styles.fieldLabel}><Shield size={14} /> Username Login</label>
                            {isEditing ? (
                                <input
                                    className={styles.fieldInput}
                                    value={form.username}
                                    onChange={e => setForm({ ...form, username: e.target.value })}
                                    placeholder="username_anda"
                                />
                            ) : (
                                <p className={styles.fieldValue}>@{user.username || '-'}</p>
                            )}
                        </div>

                        {/* Email (read-only) */}
                        <div className={styles.fieldGroup}>
                            <label className={styles.fieldLabel}><Mail size={14} /> Email Kantor</label>
                            <p className={styles.fieldValue} style={{ color: '#94a3b8' }}>{user.email}</p>
                            <span className={styles.readOnlyNote}>Email tidak dapat diubah sendiri</span>
                        </div>

                        {/* Role (read-only) */}
                        <div className={styles.fieldGroup}>
                            <label className={styles.fieldLabel}><Briefcase size={14} /> Jabatan / Role</label>
                            <p className={styles.fieldValue}>{user.role || '-'}</p>
                            <span className={styles.readOnlyNote}>Hanya Admin yang dapat mengubah jabatan</span>
                        </div>

                        {/* Date of Birth */}
                        <div className={styles.fieldGroup}>
                            <label className={styles.fieldLabel}><Calendar size={14} /> Tanggal Lahir</label>
                            {isEditing ? (
                                <input
                                    type="date"
                                    className={styles.fieldInput}
                                    value={form.dob}
                                    onChange={e => setForm({ ...form, dob: e.target.value })}
                                />
                            ) : (
                                <p className={styles.fieldValue}>{formatDate(user.dob)}</p>
                            )}
                        </div>
                    </div>

                    {/* Bio */}
                    <div className={styles.fieldGroup} style={{ marginTop: '1.5rem' }}>
                        <label className={styles.fieldLabel}><FileText size={14} /> Biografi</label>
                        {isEditing ? (
                            <textarea
                                className={styles.fieldTextarea}
                                value={form.bio}
                                onChange={e => setForm({ ...form, bio: e.target.value })}
                                placeholder="Ceritakan sedikit tentang diri Anda, peran, dan keahlian..."
                                rows={4}
                            />
                        ) : (
                            <p className={styles.fieldValue} style={{ lineHeight: 1.7, color: user.bio ? 'inherit' : '#64748b', fontStyle: user.bio ? 'normal' : 'italic' }}>
                                {user.bio || 'Belum ada biografi. Klik Edit Profil untuk menambahkan.'}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Account Info Card */}
            <div className={styles.accountCard}>
                <h3 className={styles.sectionTitle}>Informasi Akun</h3>
                <div className={styles.accountGrid}>
                    <div className={styles.accountItem}>
                        <span className={styles.accountLabel}>User ID</span>
                        <span className={styles.accountValue} style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#64748b' }}>{user.id}</span>
                    </div>
                    <div className={styles.accountItem}>
                        <span className={styles.accountLabel}>Status Akun</span>
                        <span className={`${styles.statusBadge} ${user.status === 'Active' ? styles.statusActive : styles.statusInactive}`}>
                            {user.status}
                        </span>
                    </div>
                    <div className={styles.accountItem}>
                        <span className={styles.accountLabel}>Role Sistem</span>
                        <span className={styles.accountValue}>{user.role}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
