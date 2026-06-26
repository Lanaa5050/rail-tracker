'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AdminContextValue {
  isAdmin: boolean;
  unlock: (pin: string) => boolean;
  lock: () => void;
}

const AdminContext = createContext<AdminContextValue>({
  isAdmin: false,
  unlock: () => false,
  lock: () => {},
});

const SESSION_KEY = 'rail_tracker_admin';

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);

  // Restore from sessionStorage so PIN survives same-tab navigation
  useEffect(() => {
    setIsAdmin(sessionStorage.getItem(SESSION_KEY) === '1');
  }, []);

  const unlock = (pin: string): boolean => {
    const correct = process.env.NEXT_PUBLIC_ADMIN_PIN ?? '0000';
    if (pin === correct) {
      setIsAdmin(true);
      sessionStorage.setItem(SESSION_KEY, '1');
      return true;
    }
    return false;
  };

  const lock = () => {
    setIsAdmin(false);
    sessionStorage.removeItem(SESSION_KEY);
  };

  return (
    <AdminContext.Provider value={{ isAdmin, unlock, lock }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  return useContext(AdminContext);
}
