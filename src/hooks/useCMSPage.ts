'use client';

import { useState, useEffect, useCallback } from 'react';

interface CMSPageData {
  id: string;
  slug: string;
  title: string;
  content: Record<string, unknown>;
  seoTitle: string | null;
  seoDesc: string | null;
  isPublished: boolean;
  updatedAt: string;
}

interface UseCMSPageOptions {
  /** Custom slug override */
  slug?: string;
  /** Whether to fetch on mount (default: true) */
  enabled?: boolean;
}

interface UseCMSPageReturn {
  data: CMSPageData | null;
  content: Record<string, unknown>;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook to fetch CMS page content by slug.
 * Returns parsed JSON content with fallback to empty object.
 */
export function useCMSPage(slug: string, options?: UseCMSPageOptions): UseCMSPageReturn {
  const [data, setData] = useState<CMSPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/cms/pages/slug/${slug}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.page) {
          setData(json.page);
        } else {
          setError(json.message || 'خطا در دریافت صفحه');
        }
      } else {
        // 404 or other error — just return empty (page will use defaults)
        setError('صفحه در CMS یافت نشد');
      }
    } catch {
      setError('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (options?.enabled === false) return;
    fetchPage();
  }, [fetchPage, options?.enabled]);

  return {
    data,
    content: data?.content || {},
    loading,
    error,
    refetch: fetchPage,
  };
}

export type { CMSPageData };
