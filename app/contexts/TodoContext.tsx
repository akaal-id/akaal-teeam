'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export interface TodoItem {
    id: string;
    text: string;
    completed: boolean;
    completed_at: string | null;
    urgent?: boolean;
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

    // 1. Fetch Todos from Supabase
    const fetchTodos = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('todos')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching todos:', error);
        } else if (data) {
            // Mapping column names from DB (snake_case) to JS (camelCase if needed)
            setTodos(data as TodoItem[]);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchTodos();
    }, []);

    // 2. Add Todo
    const addTodo = async (text: string, urgent: boolean = false) => {
        const { data: { user } } = await supabase.auth.getUser();
        // For development, we skip rigid user_id requirement if not logged in
        const { data, error } = await supabase
            .from('todos')
            .insert([{
                text,
                urgent,
                completed: false,
                user_id: user?.id || null
            }])
            .select();

        if (error) console.error('Error adding todo:', error);
        else if (data) setTodos([data[0], ...todos]);
    };

    // 3. Remove Todo
    const removeTodo = async (id: string) => {
        const { error } = await supabase
            .from('todos')
            .delete()
            .eq('id', id);

        if (error) console.error('Error removing todo:', error);
        else setTodos(todos.filter(t => t.id !== id));
    };

    // 4. Toggle Todo
    const toggleTodo = async (id: string) => {
        const todo = todos.find(t => t.id === id);
        if (!todo) return;

        const isNowCompleted = !todo.completed;
        const { error } = await supabase
            .from('todos')
            .update({
                completed: isNowCompleted,
                completed_at: isNowCompleted ? new Date().toISOString() : null
            })
            .eq('id', id);

        if (error) {
            console.error('Error toggling todo:', error);
        } else {
            setTodos(todos.map(t => t.id === id ? {
                ...t,
                completed: isNowCompleted,
                completed_at: isNowCompleted ? new Date().toISOString() : null
            } : t));
        }
    };

    return (
        <TodoContext.Provider value={{ todos, loading, addTodo, removeTodo, toggleTodo }}>
            {children}
        </TodoContext.Provider>
    );
}

export function useTodo() {
    const context = useContext(TodoContext);
    if (!context) throw new Error('useTodo must be used within TodoProvider');
    return context;
}
