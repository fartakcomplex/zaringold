
import {useEffect, useState} from 'react';
import {getDirection, subscribe as subscribeLocale, getSnapshot} from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';

export default function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>(getSnapshot());

  useEffect(() => {
    const apply = () => {
      const loc = getSnapshot();
      const dir = getDirection(loc);
      setLocale(loc);
      // Update html attributes
      document.documentElement.lang = loc;
      document.documentElement.dir = dir;
      // Update body font based on locale
      if (loc === 'en') {
        document.body.style.fontFamily = "var(--font-inter), system-ui, -apple-system, sans-serif";
      } else {
        document.body.style.fontFamily = "var(--font-vazir), 'IRANSans', 'Iran Sans', 'Vazir', system-ui, sans-serif";
      }
      // Update body direction for proper CSS inheritance
      document.body.style.direction = dir;
    };
    apply();
    return subscribeLocale(apply);
  }, []);

  return <>{children}</>;
}
