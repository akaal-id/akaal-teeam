'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export interface UserProfile {
    id: string;
    full_name: string;
    username: string;
    email: string;
    role: string;
    status: string;
    bio: string;
    dob: string | null;
    avatar_url: string | null;
}

interface UserContextType {
    user: UserProfile | null;
    loading: boolean;
    refreshUser: () => Promise<void>;
    signOut: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async () => {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) { setUser(null); setLoading(false); return; }

        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .single();

        if (profile) {
            setUser(profile as UserProfile);
        } else {
            // User exists in Auth but no profile yet, create a minimal one
            setUser({ id: authUser.id, full_name: authUser.email?.split('@')[0] || 'User', username: authUser.email?.split('@')[0] || 'user', email: authUser.email || '', role: 'Employee', status: 'Active', bio: '', dob: null, avatar_url: null });
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchProfile();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
            fetchProfile();
        });

        return () => subscription.unsubscribe();
    }, []);

    const refreshUser = async () => {
        await fetchProfile();
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
    };

    return (
        <UserContext.Provider value={{ user, loading, refreshUser, signOut }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (!context) throw new Error('useUser must be used within UserProvider');
    return context;
}
