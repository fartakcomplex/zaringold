
import {useState, useEffect, useCallback} from 'react';

export interface SiteSettingItem {
  group: string;
  key: string;
  value: string;
  type: string;
  label: string;
  description?: string;
  sortOrder?: number;
}

export interface SiteSettingsGroup {
  group: string;
  settings: SiteSettingItem[];
}

export function useSiteSettings(groupFilter?: string) {
  const [settings, setSettings] = useState<Record<string, Record<string, string>>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = groupFilter
        ? `/api/admin/site-settings?group=${groupFilter}`
        : '/api/admin/site-settings';
      const res = await fetch(url);
      if (!res.ok) throw new Error('خطا در دریافت تنظیمات');
      const data = await res.json();
      if (data.groups) {
        const map: Record<string, Record<string, string>> = {};
        for (const g of data.groups) {
          map[g.group] = {};
          for (const s of g.settings) {
            map[g.group][s.key] = s.value;
          }
        }
        setSettings(map);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطای ناشناخته');
    } finally {
      setLoading(false);
    }
  }, [groupFilter]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const get = useCallback((group: string, key: string, fallback: string = ''): string => {
    return settings[group]?.[key] ?? fallback;
  }, [settings]);

  const getBool = useCallback((group: string, key: string, fallback: boolean = false): boolean => {
    const val = get(group, key, String(fallback));
    return val === 'true';
  }, [get]);

  const getJSON = useCallback(<T = unknown>(group: string, key: string, fallback: T): T => {
    const val = get(group, key);
    if (!val) return fallback;
    try {
      return JSON.parse(val) as T;
    } catch {
      return fallback;
    }
  }, [get]);

  return { settings, loading, error, refetch: fetchSettings, get, getBool, getJSON };
}
