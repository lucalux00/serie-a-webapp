"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';

type UserData = {
  username: string;
  favoriteTeamId: string | null;
  favoriteTeamName: string | null;
};

interface AuthContextType {
  user: UserData | null;
  login: (username: string, teamId: string, teamName: string) => void;
  logout: () => void;
  isLoaded: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('serieA_user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setIsLoaded(true);
  }, []);

  const login = (username: string, teamId: string, teamName: string) => {
    const userData = { username, favoriteTeamId: teamId, favoriteTeamName: teamName };
    setUser(userData);
    localStorage.setItem('serieA_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('serieA_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoaded }}>
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
