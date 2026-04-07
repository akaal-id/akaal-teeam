'use client';

import React, { useState, useEffect, useMemo, useRef, Suspense, useCallback } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import { Check, ArrowLeft, Plus, CalendarDays, AlertCircle, Clock, FileCheck, Send, Trash2, Activity, LayoutList, CheckCircle2, MessageSquare, User, Loader2, Search, X } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { useTodo } from '../../contexts/TodoContext';
import { useUser } from '../../contexts/UserContext';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
import 'react-quill-new/dist/quill.snow.css';

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
    assignee?: { id: string; full_name: string; username: string };
    assignor?: { id: string; full_name: string };
}

interface TaskMessage {
    id: string;
    task_id: string;
    sender_id: string;
    message: string;
    created_at: string;
    sender?: { id: string; full_name: string; avatar_url: string | null };
}

function TaskPageContent() {
    const { user } = useUser();
    const { todos, addTodo, removeTodo, toggleTodo } = useTodo();

    const searchParams = useSearchParams();
    const taskIdFromQuery = searchParams.get('taskId');
    const fromAdmin = searchParams.get('from') === 'admin';

    const [activeView, setActiveView] = useState<'board' | 'table'>('board');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const [tasks, setTasks] = useState<Task[]>([]);
    const [allUsers, setAllUsers] = useState<{ id: string; full_name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [taskLoadError, setTaskLoadError] = useState('');

    const [isCreatingTask, setIsCreatingTask] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [editTaskId, setEditTaskId] = useState<string | null>(null);
    const [quillData, setQuillData] = useState('');

    const [taskMessages, setTaskMessages] = useState<TaskMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Form state
    const [formTitle, setFormTitle] = useState('');
    const [formAssigneeId, setFormAssigneeId] = useState('');
    const [formDueDate, setFormDueDate] = useState('');
    const [formPriority, setFormPriority] = useState('Medium');
    const [formCategory, setFormCategory] = useState('Main Task');
    const [submitLinkInput, setSubmitLinkInput] = useState('');

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('');
    const [newTodoText, setNewTodoText] = useState('');

    const loadTasks = useCallback(async () => {
        if (!user?.id && !taskIdFromQuery) {
            setLoading(false);
            setTasks([]);
            setSelectedTask(null);
            setTaskLoadError('');
            return;
        }

        setLoading(true);
        setTaskLoadError('');
        let merged: Task[] = [];

        if (taskIdFromQuery) {
            const res = await fetch(`/api/tasks?id=${encodeURIComponent(taskIdFromQuery)}`);
            const data = await res.json();
            if (!res.ok || data?.error) {
                setTaskLoadError(typeof data?.error === 'string' ? data.error : 'Task tidak ditemukan.');
                setTasks([]);
                setSelectedTask(null);
                setLoading(false);
                return;
            }
            merged = [data as Task];
            setSelectedTask(data as Task);
        }

        if (user?.id) {
            const res = await fetch(`/api/tasks?user_id=${user.id}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                const byId = new Map<string, Task>();
                merged.forEach(t => byId.set(t.id, t));
                data.forEach((t: Task) => byId.set(t.id, t));
                merged = Array.from(byId.values());
                setTasks(merged);
                if (taskIdFromQuery) {
                    const match = merged.find(x => x.id === taskIdFromQuery);
                    if (match) setSelectedTask(match);
                }
            }
        } else {
            setTasks(merged);
        }

        if (user?.id) {
            const res = await fetch('/api/admin/users');
            const data = await res.json();
            if (Array.isArray(data)) setAllUsers(data.map((u: any) => ({ id: u.id, full_name: u.full_name || u.name })));
        }

        setLoading(false);
    }, [user?.id, taskIdFromQuery]);

    useEffect(() => {
        void loadTasks();
    }, [loadTasks]);

    const fetchMessages = async (taskId: string) => {
        const res = await fetch(`/api/tasks/messages?task_id=${taskId}`);
        const data = await res.json();
        if (Array.isArray(data)) setTaskMessages(data);
    };

    useEffect(() => {
        if (selectedTask) {
            fetchMessages(selectedTask.id);
            const interval = setInterval(() => fetchMessages(selectedTask.id), 5000);
            return () => clearInterval(interval);
        } else {
            setTaskMessages([]);
        }
    }, [selectedTask]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [taskMessages]);

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!newMessage.trim() || !selectedTask || !user) return;

        const res = await fetch('/api/tasks/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ task_id: selectedTask.id, sender_id: user.id, message: newMessage })
        });

        if (res.ok) {
            setNewMessage('');
            fetchMessages(selectedTask.id);
        }
    };

    const filteredHistory = useMemo(() => {
        return tasks.filter(t => {
            const name = t.assignee?.full_name || t.assignor?.full_name || '';
            const matchSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchStatus = statusFilter === 'all' || t.status.toLowerCase() === statusFilter.toLowerCase();
            const matchDate = !dateFilter || (t.created_at && t.created_at.startsWith(dateFilter));
            return matchSearch && matchStatus && matchDate;
        });
    }, [tasks, searchQuery, statusFilter, dateFilter]);

    const paginatedData = filteredHistory.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);

    const handleApprove = async (taskId: string) => {
        await fetch('/api/tasks', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: taskId, status: 'Done' }) });
        await fetch('/api/tasks/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ task_id: taskId, sender_id: user?.id, message: '✅ Tugas telah disetujui (Done).' }) });
        void loadTasks();
        if (selectedTask?.id === taskId) setSelectedTask({ ...selectedTask, status: 'Done' });
    };

    const handleRequestRevision = async (taskId: string) => {
        const msg = prompt('Berikan alasan atau instruksi revisi:');
        if (msg === null) return;

        await fetch('/api/tasks', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: taskId, status: 'In Progress' }) });
        await fetch('/api/tasks/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ task_id: taskId, sender_id: user?.id, message: `⚠️ MINTA REVISI: ${msg}` }) });

        void loadTasks();
        if (selectedTask?.id === taskId) setSelectedTask({ ...selectedTask, status: 'In Progress' });
    };

    const handleSubmitWork = async (taskId: string) => {
        if (!submitLinkInput) { alert("Tautan hasil pekerjaan wajib diisi!"); return; }
        await fetch('/api/tasks', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: taskId, status: 'On Preview', submitted_link: submitLinkInput }) });
        await fetch('/api/tasks/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ task_id: taskId, sender_id: user?.id, message: `📤 SUBMIT PEKERJAAN: ${submitLinkInput}` }) });

        setSubmitLinkInput('');
        void loadTasks();
        if (selectedTask?.id === taskId) setSelectedTask({ ...selectedTask, status: 'On Preview', submitted_link: submitLinkInput });
    };

    const handleDeleteTask = async (taskId: string) => {
        if (!confirm('Hapus task ini?')) return;
        await fetch(`/api/tasks?id=${taskId}`, { method: 'DELETE' });
        void loadTasks();
        setSelectedTask(null);
    };

    const handleAddTodo = (e: React.FormEvent) => {
        e.preventDefault();
        if (newTodoText.trim()) { addTodo(newTodoText); setNewTodoText(''); }
    };

    const myTasks = tasks.filter(t => t.assignee_id === user?.id);
    const readOnly = !user;

    const handleSubmitNewTask = async () => {
        if (!formTitle || !formAssigneeId) { alert('Judul dan penerima tugas wajib diisi.'); return; }
        const payload = { title: formTitle, description: quillData, category: formCategory, priority: formPriority, status: 'Pending', assignee_id: formAssigneeId, assignor_id: user?.id, deadline: formDueDate || null };

        if (editTaskId) {
            await fetch('/api/tasks', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editTaskId, ...payload }) });
        } else {
            await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        }
        setIsCreatingTask(false); setEditTaskId(null); setFormTitle(''); setFormAssigneeId(''); setQuillData(''); setFormDueDate('');
        void loadTasks();
    };

    const getStatusClass = (status: string) => {
        if (status === 'Done') return styles.badgeDone;
        return styles.badgeInProg;
    };

    if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem', color: '#94a3b8' }}><Loader2 size={24} /> Memuat data task...</div>;

    if (!user && !taskIdFromQuery) {
        return (
            <div className={styles.taskContainer} style={{ padding: '3rem', textAlign: 'center' }}>
                <h1 className={styles.headerTitle}>Task</h1>
                <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>Login untuk melihat daftar tugas Anda.</p>
                <Link href="/login" className={styles.primaryBtn} style={{ display: 'inline-flex', marginTop: '1.5rem', textDecoration: 'none' }}>
                    Ke halaman login
                </Link>
            </div>
        );
    }

    if (taskLoadError && taskIdFromQuery) {
        return (
            <div className={styles.taskContainer} style={{ padding: '3rem' }}>
                <p style={{ color: '#f87171' }}>{taskLoadError}</p>
                {fromAdmin ? (
                    <Link href="/admin/tasks" className={styles.outlineBtn} style={{ display: 'inline-flex', marginTop: '1rem', textDecoration: 'none' }}>
                        ← Kembali ke Admin Tasks
                    </Link>
                ) : (
                    <Link href="/task" className={styles.outlineBtn} style={{ display: 'inline-flex', marginTop: '1rem', textDecoration: 'none' }}>
                        Ke Task
                    </Link>
                )}
            </div>
        );
    }

    return (
        <div className={styles.taskContainer}>
            <header className={styles.headerAction}>
                <div>
                    <h1 className={styles.headerTitle}>Manajemen Pekerjaan</h1>
                    <p className={styles.subtitle}>
                        {fromAdmin ? (
                            <>
                                Pratinjau dari admin —{' '}
                                <Link href="/admin/tasks" style={{ color: 'var(--teal)' }}>
                                    kembali ke Master Task
                                </Link>
                            </>
                        ) : (
                            'Sinkronisasi tugas dan history diskusi tim.'
                        )}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    {fromAdmin && (
                        <Link href="/admin/tasks" className={styles.outlineBtn} style={{ textDecoration: 'none' }}>
                            <ArrowLeft size={16} /> Admin
                        </Link>
                    )}
                    {!readOnly && (
                        <button className={styles.outlineBtn} onClick={() => { setActiveView('board'); setIsCreatingTask(!isCreatingTask); setSelectedTask(null); }}>
                            {isCreatingTask ? <><ArrowLeft size={16} /> Kembali</> : <><Plus size={16} /> Buat Task Baru</>}
                        </button>
                    )}
                </div>
            </header>

            {!readOnly && (
                <>
                    <div className={styles.metricsContainer}>
                        <div className={styles.metricsGridThree}>
                            <div className={styles.metricCard}><div className={styles.metricHeaderBlock}><h3 className={styles.metricTitleBlk}>Pending</h3><Activity className={styles.iconTeal} /></div><p className={styles.metricValueLg}>{tasks.filter(t => t.status !== 'Done').length}</p></div>
                            <div className={styles.metricCard}><div className={styles.metricHeaderBlock}><h3 className={styles.metricTitleBlk}>Selesai</h3><CheckCircle2 className={styles.iconTeal} /></div><p className={styles.metricValueLg}>{tasks.filter(t => t.status === 'Done').length}</p></div>
                            <div className={styles.metricCard}><div className={styles.metricHeaderBlock}><h3 className={styles.metricTitleBlk}>Total</h3><LayoutList className={styles.iconTeal} /></div><p className={styles.metricValueLg}>{tasks.length}</p></div>
                        </div>
                    </div>

                    <div className={styles.tabContainer}>
                        <button onClick={() => { setActiveView('board'); setSelectedTask(null); }} style={{ background: 'none', border: 'none', color: activeView === 'board' ? 'var(--teal)' : '#64748b', borderBottom: activeView === 'board' ? '2px solid var(--teal)' : 'none', padding: '0.75rem 0', fontWeight: 600, cursor: 'pointer' }}>Kanban Board</button>
                        <button onClick={() => { setActiveView('table'); setSelectedTask(null); }} style={{ background: 'none', border: 'none', color: activeView === 'table' ? 'var(--teal)' : '#64748b', borderBottom: activeView === 'table' ? '2px solid var(--teal)' : 'none', padding: '0.75rem 0', fontWeight: 600, cursor: 'pointer' }}>Tabel History</button>
                    </div>
                </>
            )}

            {readOnly && selectedTask && (
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1rem', padding: '0.75rem 1rem', background: 'rgba(168, 85, 247, 0.08)', borderRadius: '0.5rem', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                    Tampilan pratinjau (tanpa login). Untuk mengirim pesan atau mengubah status, login sebagai karyawan terkait.
                </p>
            )}

            {selectedTask ? (
                <div className={styles.cardFullWidth}>
                    <button
                        className={styles.btnTextBack}
                        onClick={() => {
                            if (readOnly && fromAdmin) {
                                window.location.href = '/admin/tasks';
                                return;
                            }
                            setSelectedTask(null);
                        }}
                        style={{ marginBottom: '1.5rem' }}
                    >
                        <ArrowLeft size={16} /> {readOnly && fromAdmin ? 'Kembali ke Admin' : 'Kembali'}
                    </button>
                    <div className={styles.detailGrid}>
                        <div>
                            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.75rem' }}>{selectedTask.title}</h2>
                            <div className={styles.detailBadges}>
                                <span className={getStatusClass(selectedTask.status)}>{selectedTask.status}</span>
                                {selectedTask.deadline && <span style={{ color: '#94a3b8' }}><Clock size={14} /> Due: {new Date(selectedTask.deadline).toLocaleDateString('id-ID')}</span>}
                            </div>
                            <div className={styles.detailBody}>
                                <label className={styles.label}>Instruksi / Deskripsi</label>
                                <div className={styles.descriptionBox} dangerouslySetInnerHTML={{ __html: selectedTask.description || '<em style="color:#64748b">Tidak ada deskripsi tambahan.</em>' }}></div>
                                <div className={styles.chatSection}>
                                    <div className={styles.chatHeader}><MessageSquare size={18} /> Diskusi & History Revisi</div>
                                    <div className={styles.chatMessagesContainer}>
                                        {taskMessages.length === 0 ? (
                                            <p style={{ textAlign: 'center', color: '#64748b', padding: '2rem', fontSize: '0.85rem' }}>Belum ada diskusi untuk tugas ini.</p>
                                        ) : (
                                            taskMessages.map(msg => (
                                                <div key={msg.id} className={`${styles.messageItem} ${msg.sender_id === user?.id ? styles.messageMine : ''}`}>
                                                    <div className={styles.messageMeta}>
                                                        <strong>{msg.sender?.full_name || 'User'}</strong> • {new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                    <div className={styles.messageText}>{msg.message}</div>
                                                </div>
                                            ))
                                        )}
                                        <div ref={chatEndRef} />
                                    </div>
                                    <form onSubmit={handleSendMessage} className={styles.chatInputWrapper}>
                                        <input
                                            className={styles.chatInput}
                                            placeholder={readOnly ? 'Login untuk mengirim pesan…' : 'Tulis catatan atau update di sini...'}
                                            value={newMessage}
                                            onChange={e => setNewMessage(e.target.value)}
                                            disabled={readOnly}
                                        />
                                        <button type="submit" className={styles.sendBtn} disabled={readOnly}>
                                            <Send size={16} />
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                        <div className={styles.detailSidebar}>
                            <div className={styles.formGroup}><label className={styles.label}>Ditugaskan Kepada</label><div className={styles.sidebarUser}><User size={14} /> {selectedTask.assignee?.full_name || '-'}</div></div>
                            <div className={styles.formGroup}><label className={styles.label}>Pemberi Tugas</label><div className={styles.sidebarUser}><User size={14} /> {selectedTask.assignor?.full_name || '-'}</div></div>
                            <div className={styles.formGroup}><label className={styles.label}>Kategori</label><p>{selectedTask.category}</p></div>
                            <div style={{ marginTop: '2rem' }}>
                                {!readOnly && selectedTask.status === 'On Preview' && selectedTask.assignor_id === user?.id && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        <button className={styles.primaryBtn} onClick={() => handleApprove(selectedTask.id)} style={{ width: '100%', margin: 0 }}><Check size={16} /> Approve & Selesaikan</button>
                                        <button className={styles.outlineBtn} onClick={() => handleRequestRevision(selectedTask.id)} style={{ width: '100%', justifyContent: 'center' }}><AlertCircle size={16} /> Minta Revisi</button>
                                    </div>
                                )}
                                {!readOnly && selectedTask.assignee_id === user?.id && selectedTask.status !== 'Done' && selectedTask.status !== 'On Preview' && (
                                    <div className={styles.submitArea}>
                                        <label className={styles.label} style={{ color: 'var(--teal)' }}>Submit Pekerjaan</label>
                                        <input className={styles.shadcnInput} style={{ marginBottom: '0.75rem' }} value={submitLinkInput} onChange={e => setSubmitLinkInput(e.target.value)} placeholder="Link hasil (GDocs/Figma)" />
                                        <button className={styles.primaryBtn} onClick={() => handleSubmitWork(selectedTask.id)} style={{ width: '100%', margin: 0 }}><Send size={16} /> Submit untuk Review</button>
                                    </div>
                                )}
                            </div>
                            {!readOnly && selectedTask.assignor_id === user?.id && (
                                <button onClick={() => handleDeleteTask(selectedTask.id)} style={{ width: '100%', marginTop: 'auto', background: 'none', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', borderRadius: '0.5rem', padding: '0.5rem', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                                    <Trash2 size={12} /> Hapus Permanen
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ) : readOnly ? (
                <div style={{ padding: '2rem', color: '#64748b' }}>
                    Pratinjau tidak tersedia. Pastikan URL memuat parameter <code>taskId</code> yang benar, atau{' '}
                    <Link href="/login" style={{ color: 'var(--teal)' }}>login</Link> sebagai karyawan.
                </div>
            ) : activeView === 'board' ? (
                isCreatingTask ? (
                    <div className={styles.cardFullWidth}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '2rem' }}>Buat Penugasan Baru</h2>
                        <div className={styles.formContainer}>
                            <div className={styles.formGroup}><label className={styles.label}>Judul Tugas</label><input className={styles.shadcnInput} value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Misal: Laporan Akhir Bulan" /></div>
                            <div className={styles.formGrid}>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Kepada</label>
                                    <select className={styles.shadcnSelect} value={formAssigneeId} onChange={e => setFormAssigneeId(e.target.value)}>
                                        <option value="">Pilih Karyawan...</option>
                                        {allUsers.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                                    </select>
                                </div>
                                <div className={styles.formGroup}><label className={styles.label}>Deadline</label><input type="date" className={styles.shadcnInput} value={formDueDate} onChange={e => setFormDueDate(e.target.value)} /></div>
                            </div>
                            <div className={styles.formGroup}><label className={styles.label}>Detail Tugas</label><div className={styles.quillWrapper}><ReactQuill theme="snow" value={quillData} onChange={setQuillData} /></div></div>
                            <button className={styles.primaryBtn} onClick={handleSubmitNewTask} style={{ marginTop: '2rem' }}>Kirim Tugas</button>
                        </div>
                    </div>
                ) : (
                    <div className={styles.gridWrapper}>
                        <div className={styles.card}>
                            <h2 className={styles.cardTitle}>Tugas Saya</h2>
                            <div className={styles.taskList}>
                                {myTasks.length === 0 ? <p className={styles.emptyText}>Belum ada tugas.</p> : myTasks.map(t => (
                                    <div key={t.id} className={styles.taskItem} onClick={() => setSelectedTask(t)}>
                                        <h3 className={styles.taskTitle}>{t.title}</h3>
                                        <span className={getStatusClass(t.status)}>{t.status}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className={styles.card}>
                            <h2 className={styles.cardTitle}>Daftar To-Do</h2>
                            <form onSubmit={handleAddTodo} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                                <input className={styles.shadcnInput} placeholder="Input to-do..." value={newTodoText} onChange={e => setNewTodoText(e.target.value)} />
                                <button type="submit" className={styles.iconBtn}><Plus size={16} /></button>
                            </form>
                            <div className={styles.todoList}>
                                {todos.map((todo: any) => (
                                    <div key={todo.id} className={styles.todoItem} onClick={() => toggleTodo(todo.id)}>
                                        <div className={`${styles.shadcnCheckbox} ${todo.completed ? styles.shadcnCheckboxChecked : ''}`}>{todo.completed && <Check size={12} />}</div>
                                        <span className={todo.completed ? styles.todoTextStrike : ''}>{todo.text}</span>
                                        <button
                                            type="button"
                                            onClick={e => {
                                                e.stopPropagation();
                                                void removeTodo(todo.id);
                                            }}
                                            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
                                            aria-label="Hapus todo"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )
            ) : (
                <div className={styles.cardFullWidth}>
                    <div className={styles.filterBar}>
                        <div className={styles.searchWrapper}><Search className={styles.searchIcon} /><input className={styles.searchInput} placeholder="Cari..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} /></div>
                    </div>
                    <div className={styles.tableContainer}>
                        <table className={styles.historyTable}>
                            <thead><tr><th>Tanggal</th><th>Judul</th><th>Penerima</th><th>Deadline</th><th>Status</th></tr></thead>
                            <tbody>
                                {paginatedData.map(t => (
                                    <tr key={t.id} onClick={() => setSelectedTask(t)} className={styles.tableRowClickable}>
                                        <td>{new Date(t.created_at).toLocaleDateString('id-ID')}</td>
                                        <td>{t.title}</td>
                                        <td style={{ color: 'var(--teal)' }}>{t.assignee?.full_name || '-'}</td>
                                        <td>{t.deadline ? new Date(t.deadline).toLocaleDateString('id-ID') : '-'}</td>
                                        <td><span className={getStatusClass(t.status)}>{t.status}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function TaskPage() {
    return (
        <Suspense fallback={<div style={{ padding: '2rem', color: '#94a3b8' }}>Memuat…</div>}>
            <TaskPageContent />
        </Suspense>
    );
}
