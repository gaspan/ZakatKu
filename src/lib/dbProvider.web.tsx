import React, { createContext, useContext, useEffect, useState } from 'react';
import { migrateDbIfNeeded } from './database.web';

const WebDbContext = createContext<any>({});

export const AppDbProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    migrateDbIfNeeded().then(() => setReady(true));
  }, []);

  if (!ready) return null;

  return (
    <WebDbContext.Provider value={{ isWeb: true }}>
      {children}
    </WebDbContext.Provider>
  );
};

export const useAppDb = () => useContext(WebDbContext);
