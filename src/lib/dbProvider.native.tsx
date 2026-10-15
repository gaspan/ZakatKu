import React from 'react';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { DATABASE_NAME, migrateDbIfNeeded } from './database.native';

export const AppDbProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrateDbIfNeeded}>
      {children}
    </SQLiteProvider>
  );
};

export const useAppDb = () => useSQLiteContext();
