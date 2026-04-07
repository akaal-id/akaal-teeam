'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '../admin.module.css';
import { Trash2, Edit2, Search, Plus, X, User, Loader2, ExternalLink, Check, AlertCircle, Eye } from 'lucide-react';

interface Task {
    id: string;
    title: string;
    description?: string;
    category: string;
    priority: string;
    status: string;
    deadline: string | null;
    submitted_link?: string;
    review_notes?: string;
    created_at: string;
    assignee_id: string | null;
    assignor_id: string | null;
    assignee?: { id: string; full_name: string };
    assignor?: { id: string; full_name: string };
}

interface UserOption {
    id: string;
    full_name: string;
}

export default function AdminTasksPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [users, setUsers] = useState<UserOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const categories = ['Main Task', 'Design', 'QA', 'Finance', 'Marketing', 'Development'];
    const priorities = ['Low', 'Medium', 'High', 'Urgent'];

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentTask, setCurrentTask] = useState<any>(null);
    const [reviewMode, setReviewMode] = useState(false);

    const fetchTasks = async () => {
        setLoading(true);
        const res = await fetch('/api/tasks');
        const data = await res.json();
        if (Array.isArray(data)) setTasks(data);
        setLoading(false);
    };

    const fetchUsers = async () => {
        const res = await fetch('/api/admin/users');
        const data = await res.json();
        if (Array.isArray(data)) setUsers(data.map((u: any) => ({ id: u.id, full_name: u.full_name || u.name })));
    };

    useEffect(() => {
        fetchTasks();
        fetchUsers();
    }, []);

    const openModal = (task: Task | null = null) => {
        if (task) {
            setCurrentTask({ ...task, assignee_id: task.assignee_id || '', review_notes: task.review_notes || '', submitted_link: task.submitted_link || '' });
            setReviewMode(task.status === 'On Preview');
        } else {
            setCurrentTask({ title: '', assignee_id: users[0]?.id || '', assignor_id: null, category: 'Main Task', priority: 'Medium', status: 'Pending', deadline: '', description: '', review_notes: '', submitted_link: '' });
            setReviewMode(false);
        }
        setIsModalOpen(true);
    };

    const closeModal = () => { setIsModalOpen(false); setCurrentTask(null); };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        if (currentTask.id) {
            await fetch('/api/tasks', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: currentTask.id, title: currentTask.title, description: currentTask.description, category: currentTask.category, priority: currentTask.priority, status: currentTask.status, assignee_id: currentTask.assignee_id, deadline: currentTask.deadline || null, review_notes: currentTask.review_notes }) });
        } else {
            await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: currentTask.title, description: currentTask.description, category: currentTask.category, priority: currentTask.priority, status: 'Pending', assignee_id: currentTask.assignee_id, deadline: currentTask.deadline || null }) });
        }
        await fetchTasks();
        setSaving(false);
        closeModal();
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Hapus task ini secara permanen?')) return;
        await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' });
        fetchTasks();
    };

    const handleApprove = async (taskId: string) => {
        await fetch('/api/tasks', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: taskId, status: 'Done', review_notes: currentTask?.review_notes || '' }) });
        fetchTasks(); closeModal();
    };

    const handleRevise = async (taskId: string) => {
        await fetch('/api/tasks', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: taskId, status: 'In Progress', review_notes: currentTask?.review_notes || '' }) });
        fetchTasks(); closeModal();
    };

    const filtered = tasks.filter(t => {
        const matchSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || (t.assignee?.full_name || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchStatus = statusFilter === 'all' || t.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const getStatusClass = (status: string) => {
        if (status === 'Done') return styles.statusDone;
        if (status === 'On Preview') return styles.statusActive;
        if (status === 'In Progress') return styles.statusActive;
        return styles.statusPending;
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Master Data Pekerjaan (All Tasks)</h1>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <select className={styles.searchInput} style={{ maxWidth: '160px' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                        <option value="all">Semua Status</option>
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="On Preview">On Preview ⚡</option>
                        <option value="Done">Done</option>
                    </select>
                    <div className={styles.searchContainer} style={{ maxWidth: '280px' }}>
                        <Search size={16} className={styles.searchIcon} />
                        <input type="text" className={styles.searchInput} placeholder="Cari judul atau assignee..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                    </div>
                    <button className={styles.primaryBtn} onClick={() => openModal()}><Plus size={16} /> Buat Task Baru</button>
                </div>
            </header>

            <div className={styles.sectionCard} style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '3rem', color: '#94a3b8' }}>
                        <Loader2 size={20} /> Memuat semua task dari database...
                    </div>
                ) : (
                    <div className={styles.tableContainer}>
                        <table className={styles.adminTable}>
                            <thead>
                                <tr>
                                    <th>Judul Pekerjaan</th>
                                    <th>Penerima</th>
                                    <th>Pemberi Tugas</th>
                                    <th>Kategori</th>
                                    <th>Deadline</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'right' }}>Kontrol Admin</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Belum ada task. Buat task pertama!</td></tr>
                                ) : (
                                    filtered.map(t => (
                                        <tr key={t.id}>
                                            <td style={{ fontWeight: 600 }}>{t.title}</td>
                                            <td style={{ color: 'var(--teal)' }}><User size={14} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} />{t.assignee?.full_name || '-'}</td>
                                            <td style={{ color: '#94a3b8' }}>{t.assignor?.full_name || 'Admin'}</td>
                                            <td>{t.category}</td>
                                            <td style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{t.deadline ? new Date(t.deadline).toLocaleDateString('id-ID') : '-'}</td>
                                            <td>
                                                <span className={`${styles.statusBadge} ${getStatusClass(t.status)}`}>
                                                    {t.status}{t.status === 'On Preview' && ' ⚡'}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                                                <Link
                                                    href={`/task?taskId=${encodeURIComponent(t.id)}&from=admin`}
                                                    className={`${styles.actionBtn}`}
                                                    style={{ color: 'var(--teal)', marginRight: '0.25rem', display: 'inline-flex', textDecoration: 'none' }}
                                                    title="Buka halaman task (seperti karyawan)"
                                                >
                                                    <Eye size={16} />
                                                </Link>
                                                <button className={`${styles.actionBtn} ${styles.actionBtnEdit}`} onClick={() => openModal(t)} title="Edit / Review"><Edit2 size={16} /></button>
                                                <button className={`${styles.actionBtn} ${styles.actionBtnDelete}`} onClick={() => handleDelete(t.id)} title="Hapus"><Trash2 size={16} /></button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && currentTask && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>{currentTask.id ? (reviewMode ? '⚡ Review Submisi Karyawan' : `Edit Task`) : 'Buat Task Baru'}</h2>
                            <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={24} /></button>
                        </div>

                        {/* Review Panel for On Preview tasks */}
                        {reviewMode && currentTask.submitted_link && (
                            <div style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px solid var(--teal)', borderRadius: '0.75rem', backgroundColor: 'rgba(20, 184, 166, 0.05)' }}>
                                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--teal)', marginBottom: '0.75rem' }}>Submisi Karyawan</h3>
                                <a href={currentTask.submitted_link} target="_blank" rel="noopener" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--purple)', fontWeight: 600, fontSize: '0.9rem' }}><ExternalLink size={14} /> Buka Tautan Hasil Kerja</a>
                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                    <button type="button" onClick={() => handleApprove(currentTask.id)} style={{ flex: 1, backgroundColor: 'var(--teal)', color: 'white', border: 'none', padding: '0.6rem', borderRadius: '0.4rem', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}><Check size={16} /> Setujui (Done)</button>
                                    <button type="button" onClick={() => handleRevise(currentTask.id)} style={{ flex: 1, backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid #ef4444', padding: '0.6rem', borderRadius: '0.4rem', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}><AlertCircle size={16} /> Minta Revisi</button>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSave}>
                            <div className={styles.formGroup} style={{ marginBottom: '1.5rem' }}>
                                <label className={styles.label}>Judul Pekerjaan</label>
                                <input type="text" className={styles.inputField} value={currentTask.title} onChange={e => setCurrentTask({ ...currentTask, title: e.target.value })} required placeholder="E.g. Revisi Dokumen Q1" />
                            </div>
                            <div className={styles.formGrid}>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Assign to (Penerima)</label>
                                    <select className={styles.inputField} value={currentTask.assignee_id} onChange={e => setCurrentTask({ ...currentTask, assignee_id: e.target.value })}>
                                        <option value="">Pilih karyawan...</option>
                                        {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Kategori</label>
                                    <select className={styles.inputField} value={currentTask.category} onChange={e => setCurrentTask({ ...currentTask, category: e.target.value })}>
                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Priority</label>
                                    <select className={styles.inputField} value={currentTask.priority} onChange={e => setCurrentTask({ ...currentTask, priority: e.target.value })}>
                                        {priorities.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Deadline</label>
                                    <input type="date" className={styles.inputField} value={currentTask.deadline || ''} onChange={e => setCurrentTask({ ...currentTask, deadline: e.target.value })} />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Override Status</label>
                                    <select className={styles.inputField} value={currentTask.status} onChange={e => setCurrentTask({ ...currentTask, status: e.target.value })}>
                                        {['Pending', 'In Progress', 'On Preview', 'Done'].map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className={styles.formGroup} style={{ marginTop: '1.5rem' }}>
                                <label className={styles.label}>Deskripsi / Instruksi</label>
                                <textarea className={styles.textArea} value={currentTask.description || ''} onChange={e => setCurrentTask({ ...currentTask, description: e.target.value })} placeholder="Berikan instruksi detail untuk tugas ini..." />
                            </div>
                            <div className={styles.formGroup} style={{ marginTop: '1rem' }}>
                                <label className={styles.label}>Catatan Review (Terlihat oleh Karyawan)</label>
                                <textarea className={styles.textArea} style={{ minHeight: '80px' }} value={currentTask.review_notes || ''} onChange={e => setCurrentTask({ ...currentTask, review_notes: e.target.value })} placeholder="Tulis catatan jika minta revisi atau feedback..." />
                            </div>
                            <div className={styles.modalActions}>
                                <button type="button" className={styles.secondaryBtn} onClick={closeModal}>Batal</button>
                                <button type="submit" className={styles.primaryBtn} style={{ borderRadius: '9999px', padding: '0.75rem 2rem' }} disabled={saving}>
                                    {saving ? 'Menyimpan...' : (currentTask.id ? 'Update Task' : 'Buat Task')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
