'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Loader2 } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  /** Pull threshold in px to trigger refresh (default 80) */
  threshold?: number;
  /** Max pull distance in px (default 120) */
  maxPull?: number;
}

export default function PullToRefresh({
  onRefresh,
  children,
  threshold = 80,
  maxPull = 120,
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const isPulling = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Only trigger when scrolled to top
    const container = containerRef.current;
    if (!container || container.scrollTop > 5) return;
    if (isRefreshing) return;

    startY.current = e.touches[0].clientY;
    isPulling.current = true;
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling.current || isRefreshing) return;

    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;

    // Only allow pulling down (positive diff)
    if (diff <= 0) {
      setPullDistance(0);
      return;
    }

    // Apply resistance (rubber-band effect)
    const resistance = 0.4;
    const rawDistance = diff * resistance;
    const distance = Math.min(rawDistance, maxPull);

    setPullDistance(distance);
  }, [isRefreshing, maxPull]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current) return;
    isPulling.current = false;

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(0);

      try {
        await onRefresh();
      } catch {
        // Silently handle refresh errors
      }

      // Small delay to show completion
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, threshold, isRefreshing, onRefresh]);

  const pullProgress = Math.min(pullDistance / threshold, 1);
  const isReadyToRefresh = pullDistance >= threshold;

  return (
    <div
      ref={containerRef}
      className="relative mobile-scroll h-full overflow-y-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className="flex items-center justify-center overflow-hidden transition-[height] duration-200 ease-out"
        style={{ height: isRefreshing ? 48 : pullDistance }}
      >
        <div
          className="flex flex-col items-center gap-1"
          style={{
            opacity: isRefreshing ? 1 : pullProgress,
            transform: isRefreshing
              ? 'rotate(0deg)'
              : `rotate(${pullProgress * 360}deg)`,
            transition: 'transform 0.2s ease, opacity 0.2s ease',
          }}
        >
          <Loader2
            className="size-5 text-[#D4AF37]"
            {...(isRefreshing ? { style: { animation: 'pull-spinner 0.8s linear infinite' } } : {})}
          />
          {!isRefreshing && isReadyToRefresh && (
            <span className="text-[10px] font-medium text-[#D4AF37]/70">
              رها کنید
            </span>
          )}
          {isRefreshing && (
            <span className="text-[10px] font-medium text-[#D4AF37]/70">
              در حال بروزرسانی...
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div>{children}</div>
    </div>
  );
}
