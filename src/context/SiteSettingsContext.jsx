import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "../api/api";

const SiteSettingsContext = createContext(null);

export function SiteSettingsProvider({ children }) {
  // ✅ never null, so destructure crash hobe na
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

 const refresh = useCallback(async () => {
  try {
    setLoading(true);
    const { data } = await api.get(`/api/site-settings?_=${Date.now()}`);
    setSettings(data || {});
  } catch (e) {
    console.error("Failed to load site settings", e);
    setSettings({});
  } finally {
    setLoading(false);
  }
}, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <SiteSettingsContext.Provider value={{ settings, loading, refresh }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export const useSiteSettings = () => {
  const ctx = useContext(SiteSettingsContext);
  // ✅ fallback (in case provider miss hoy)
  return ctx || { settings: {}, loading: false, refresh: async () => {} };
};