import React, { createContext, useContext, useState, useCallback } from 'react';

interface LocationRefreshContextType {
  triggerLocationRefresh: () => void;
  locationRefreshKey: number;
}

const LocationRefreshContext = createContext<LocationRefreshContextType | undefined>(undefined);

export function LocationRefreshProvider({ children }: { children: React.ReactNode }) {
  const [locationRefreshKey, setLocationRefreshKey] = useState(0);

  const triggerLocationRefresh = useCallback(() => {
    setLocationRefreshKey(prev => prev + 1);
  }, []);

  return (
    <LocationRefreshContext.Provider value={{ triggerLocationRefresh, locationRefreshKey }}>
      {children}
    </LocationRefreshContext.Provider>
  );
}

export function useLocationRefresh() {
  const context = useContext(LocationRefreshContext);
  if (context === undefined) {
    throw new Error('useLocationRefresh must be used within a LocationRefreshProvider');
  }
  return context;
}

