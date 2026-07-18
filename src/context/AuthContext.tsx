"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type User = {
  id: string;
  name: string;
  email: string;
  favoriteTeamId?: string | null;
  favoriteTeamName?: string | null;
  avatar?: string;
  isAdmin?: boolean;
};

interface AuthContextType {
  user: User | null;
  isLoaded: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, favoriteTeam?: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize from LocalStorage on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          if (data.authenticated && data.user) {
            setUser({
              id: data.user.id,
              name: data.user.name,
              email: data.user.email,
              favoriteTeamId: data.user.favoriteTeamId,
              favoriteTeamName: data.user.favoriteTeamName,
              isAdmin: data.user.isAdmin,
              avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${data.user.name}`
            });
          }
        }
      } catch (e) {
        // ignore
      } finally {
        setIsLoaded(true);
      }
    };
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    // 1. Tenta il login tramite il Vercel Postgres reale
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (response.ok) {
      const data = await response.json();
      const sessionUser = {
        ...data.user,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${data.user.name}`
      };
      setUser(sessionUser);
      return;
    }
    
    const errData = await response.json();
    throw new Error(errData.error || 'Credenziali non valide.');
  };

  const register = async (name: string, email: string, password: string, favoriteTeam?: string) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, favoriteTeam }),
    });

    if (response.ok) {
      const data = await response.json();
      const sessionUser = {
        ...data.user,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${data.user.name}`
      };
      setUser(sessionUser);
      return;
    }
    
    const errData = await response.json();
    throw new Error(errData.error || 'Errore durante la registrazione.');
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;
    try {
      const response = await fetch('/api/auth/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (response.ok) {
        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);
      } else {
        console.error('Failed to update user on server');
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoaded, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
