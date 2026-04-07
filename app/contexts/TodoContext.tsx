'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

export interface TodoItem {
    id: string;
    text: string;
    completed: boolean;
    completed_at: string | null;
    urgent?: boolean;
    user_id?: string | null;
}

interface TodoContextType {
    todos: TodoItem[];
    loading: boolean;
    addTodo: (text: string, urgent?: boolean) => Promise<void>;
    removeTodo: (id: string) => Promise<void>;
    toggleTodo: (id: string) => Promise<void>;
}

const TodoContext = createContext<TodoContextType | undefined>(undefined);

export function TodoProvider({ children }: { children: React.ReactNode }) {
    const [todos, setTodos] = useState<TodoItem[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTodos = useCallback(async () => {
        setLoading(true);
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            setTodos([]);
            setLoading(false);
            return;
        }

        const { data, error } = await supabase
            .from('todos')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching todos:', error);
            setTodos([]);
        } else {
            setTodos((data || []) as TodoItem[]);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchTodos();

        const { data } = supabase.auth.onAuthStateChange(() => {
            fetchTodos();
        });

        return () => data.subscription.unsubscribe();
    }, [fetchTodos]);

    const addTodo = async (text: string, urgent = false) => {
        const trimmed = text.trim();
        if (!trimmed) return;

        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('todos')
            .insert([
                {
                    text: trimmed,
                    urgent,
                    completed: false,
                    user_id: user.id,
                },
            ])
            .select()
            .single();

        if (error) {
            console.error('Error adding todo:', error);
            return;
        }
        setTodos(prev => [data as TodoItem, ...prev]);
    };

    const removeTodo = async (id: string) => {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase.from('todos').delete().eq('id', id).eq('user_id', user.id);
        if (error) {
            console.error('Error removing todo:', error);
            return;
        }
        setTodos(prev => prev.filter(t => t.id !== id));
    };

    const toggleTodo = async (id: string) => {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const todo = todos.find(t => t.id === id);
        if (!todo) return;

        const isNowCompleted = !todo.completed;
        const { error } = await supabase
            .from('todos')
            .update({
                completed: isNowCompleted,
                completed_at: isNowCompleted ? new Date().toISOString() : null,
            })
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) {
            console.error('Error toggling todo:', error);
            return;
        }

        setTodos(prev =>
            prev.map(t =>
                t.id === id
                    ? {
                          ...t,
                          completed: isNowCompleted,
                          completed_at: isNowCompleted ? new Date().toISOString() : null,
                      }
                    : t
            )
        );
    };

    return <TodoContext.Provider value={{ todos, loading, addTodo, removeTodo, toggleTodo }}>{children}</TodoContext.Provider>;
}

export function useTodo() {
    const context = useContext(TodoContext);
    if (!context) throw new Error('useTodo must be used within TodoProvider');
    return context;
}
