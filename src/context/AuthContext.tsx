"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type User = {
  id: string;
  name: string;
  email: string;
  favoriteTeamId?: string | null;
  favoriteTeamName?: string | null;
  avatar?: string;
};

interface AuthContextType {
  user: User | null;
  isLoaded: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  // Legacy method per supportare l'onboarding iniziale se usato
  legacyLogin: (username: string, teamId: string, teamName: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize from LocalStorage on mount
  useEffect(() => {
    const checkAuth = () => {
      const storedUser = localStorage.getItem('serieA_user');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          setUser({
            id: parsed.id || 'legacy-id',
            name: parsed.name || parsed.username || 'Utente',
            email: parsed.email || '',
            favoriteTeamId: parsed.favoriteTeamId,
            favoriteTeamName: parsed.favoriteTeamName,
            avatar: parsed.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${parsed.name || parsed.username}`
          });
        } catch (e) {
          // ignore
        }
      }
      setIsLoaded(true);
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
      localStorage.setItem('serieA_user', JSON.stringify(sessionUser));
      return;
    }
    
    // Se il DB restituisce un errore specifico 401 (Credenziali errate) lo mostriamo
    if (response.status === 401) {
      const errData = await response.json();
      throw new Error(errData.error || 'Credenziali non valide.');
    }

    // 2. Fallback: se l'API non è configurata (no POSTGRES_URL) andiamo in fallback locale
    console.warn("API DB non disponibile, uso il LocalStorage di fallback.");
    const usersDb = JSON.parse(localStorage.getItem('serieA_db') || '[]');
    const foundUser = usersDb.find((u: any) => u.email === email && u.password === password);

    if (!foundUser) {
      throw new Error('Credenziali non valide o utente inesistente.');
    }

    const sessionUser = {
      id: foundUser.id,
      name: foundUser.name,
      email: foundUser.email,
      favoriteTeamId: foundUser.favoriteTeamId,
      favoriteTeamName: foundUser.favoriteTeamName,
      avatar: foundUser.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${foundUser.name}`
    };

    setUser(sessionUser);
    localStorage.setItem('serieA_user', JSON.stringify(sessionUser));
  };

  const register = async (name: string, email: string, password: string) => {
    // 1. Tenta la registrazione sul Vercel Postgres reale
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });

    if (response.ok) {
      const data = await response.json();
      const sessionUser = {
        ...data.user,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${data.user.name}`
      };
      setUser(sessionUser);
      localStorage.setItem('serieA_user', JSON.stringify(sessionUser));
      return;
    }

    if (response.status === 409) {
      throw new Error('Esiste già un account con questa email.');
    }

    // 2. Fallback: se l'API non è configurata andiamo in fallback locale
    console.warn("API DB non disponibile, uso il LocalStorage di fallback.");
    const usersDb = JSON.parse(localStorage.getItem('serieA_db') || '[]');
    
    if (usersDb.some((u: any) => u.email === email)) {
      throw new Error('Esiste già un account con questa email.');
    }

    const newUser = {
      id: Math.random().toString(36).substring(2, 9),
      name,
      email,
      password,
      favoriteTeamId: null,
      favoriteTeamName: null
    };

    usersDb.push(newUser);
    localStorage.setItem('serieA_db', JSON.stringify(usersDb));

    const sessionUser = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${newUser.name}`
    };

    setUser(sessionUser);
    localStorage.setItem('serieA_user', JSON.stringify(sessionUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('serieA_user');
  };

  const updateUser = (updates: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('serieA_user', JSON.stringify(updatedUser));
    
    // Update the DB record as well
    const usersDb = JSON.parse(localStorage.getItem('serieA_db') || '[]');
    const dbIndex = usersDb.findIndex((u: any) => u.id === user.id);
    if (dbIndex > -1) {
      usersDb[dbIndex] = { ...usersDb[dbIndex], ...updates };
      localStorage.setItem('serieA_db', JSON.stringify(usersDb));
    }
  };

  const legacyLogin = (username: string, teamId: string, teamName: string) => {
    const userData = { id: 'legacy', name: username, email: '', favoriteTeamId: teamId, favoriteTeamName: teamName };
    setUser(userData);
    localStorage.setItem('serieA_user', JSON.stringify(userData));
  };

  return (
    <AuthContext.Provider value={{ user, isLoaded, login, register, logout, updateUser, legacyLogin }}>
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
