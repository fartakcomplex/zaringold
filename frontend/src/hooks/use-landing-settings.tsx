
import {useState, useEffect, useCallback} from 'react';

interface SettingItem {
  group: string;
  key: string;
  value: string;
  type: string;
  label: string;
  description?: string;
}

interface SettingsGroup {
  group: string;
  settings: SettingItem[];
}

interface UseLandingSettingsReturn {
  settings: Record<string, Record<string, string>>;
  rawGroups: SettingsGroup[];
  loading: boolean;
  get: (group: string, key: string, fallback?: string) => string;
  getBool: (group: string, key: string, fallback?: boolean) => boolean;
  getJSON: <T = any>(group: string, key: string, fallback?: T) => T;
  refresh: () => Promise<void>;
}

export function useLandingSettings(): UseLandingSettingsReturn {
  const [rawGroups, setRawGroups] = useState<SettingsGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/site-settings');
      if (res.ok) {
        const data = await res.json();
        setRawGroups(data.groups || []);
      }
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/admin/site-settings');
        if (res.ok && !cancelled) {
          const data = await res.json();
          setRawGroups(data.groups || []);
        }
      } catch { /* ignore */ }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const flatMap = rawGroups.reduce<Record<string, Record<string, string>>>((acc, g) => {
    acc[g.group] = {};
    for (const s of g.settings) {
      acc[g.group][s.key] = s.value;
    }
    return acc;
  }, {});

  const get = useCallback(
    (group: string, key: string, fallback: string = ''): string =>
      flatMap[group]?.[key] ?? fallback,
    [flatMap],
  );

  const getBool = useCallback(
    (group: string, key: string, fallback: boolean = false): boolean => {
      const val = get(group, key, String(fallback));
      return val === 'true';
    },
    [get],
  );

  const getJSON = useCallback(
    <T = any>(group: string, key: string, fallback: T): T => {
      const val = get(group, key);
      if (!val) return fallback;
      try {
        return JSON.parse(val);
      } catch {
        return fallback;
      }
    },
    [get],
  );

  return { settings: flatMap, rawGroups, loading, get, getBool, getJSON, refresh: fetchSettings };
}
