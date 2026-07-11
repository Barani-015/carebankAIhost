import { createContext, useContext, useEffect, useState } from "react";

const DataContext = createContext(null);
const STORAGE_KEY = "vega:transactions";

export function DataProvider({ children }) {
  const [transactions, setTransactions] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  }, [transactions]);

  function importTransactions(rows) {
    setTransactions(rows);
  }

  function clearTransactions() {
    setTransactions([]);
  }

  return (
    <DataContext.Provider value={{ transactions, importTransactions, clearTransactions }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
