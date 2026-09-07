import { useState, useEffect, useRef, useCallback } from 'react';

export interface HeartbeatOptions {
  totalDurationSeconds?: number;
  idleTimeoutSeconds?: number; // default 60s
  skipThresholdSeconds?: number; // default 15s
  onEngagementVerified?: () => void;
  onSkippingAttempted?: (jumpSeconds: number) => void;
}

export interface HeartbeatState {
  isActive: boolean; // Currently actively accumulating engagement
  isIdle: boolean; // Inactive due to user idle > 60s
  isHidden: boolean; // Window/tab blurred or document hidden
  isSkippingDetected: boolean; // Fast-forward limit breached
  activeSeconds: number; // Total validated engagement seconds
  lastActiveTimestamp: number;
  engagementVerified: boolean; // True once minimum engagement criterion is satisfied (e.g. >= 70% or 30s)
  statusLabel: string; // Human readable status string
  verifiedPercentage: number;
}

export function useHeartbeatTracking(options: HeartbeatOptions = {}) {
  const {
    totalDurationSeconds = 300, // default 5 minutes lecture simulation
    idleTimeoutSeconds = 60,
    skipThresholdSeconds = 15,
    onEngagementVerified,
    onSkippingAttempted,
  } = options;

  const [activeSeconds, setActiveSeconds] = useState(0);
  const [isIdle, setIsIdle] = useState(false);
  const [isHidden, setIsHidden] = useState(
    typeof document !== 'undefined' ? document.hidden : false
  );
  const [isSkippingDetected, setIsSkippingDetected] = useState(false);
  const [engagementVerified, setEngagementVerified] = useState(false);

  // Playhead tracking for anti-skipping
  const lastRecordedPlayheadRef = useRef<number>(0);
  const lastActivityTimeRef = useRef<number>(Date.now());
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // User activity reset
  const resetIdleTimer = useCallback(() => {
    lastActivityTimeRef.current = Date.now();
    if (isIdle) {
      setIsIdle(false);
    }
  }, [isIdle]);

  // Handle visibility changes (tab switch, minimize)
  useEffect(() => {
    const handleVisibilityChange = () => {
      const hidden = document.hidden;
      setIsHidden(hidden);
      if (hidden) {
        // Automatically pause active engagement accumulation
      } else {
        lastActivityTimeRef.current = Date.now();
      }
    };

    const handleWindowBlur = () => {
      setIsHidden(true);
    };

    const handleWindowFocus = () => {
      setIsHidden(false);
      lastActivityTimeRef.current = Date.now();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, []);

  // Listen to user engagement events on window
  useEffect(() => {
    const userActionEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    
    const handleUserAction = () => {
      resetIdleTimer();
    };

    userActionEvents.forEach((ev) => {
      window.addEventListener(ev, handleUserAction, { passive: true });
    });

    // Check idle state interval every second
    const idleCheckInterval = setInterval(() => {
      const elapsedSinceActivity = (Date.now() - lastActivityTimeRef.current) / 1000;
      if (elapsedSinceActivity >= idleTimeoutSeconds && !isIdle) {
        setIsIdle(true);
      }
    }, 1000);

    return () => {
      userActionEvents.forEach((ev) => {
        window.removeEventListener(ev, handleUserAction);
      });
      clearInterval(idleCheckInterval);
    };
  }, [idleTimeoutSeconds, isIdle, resetIdleTimer]);

  // Main Heartbeat Accumulator: Ticks every second if window is focused, not idle, and not skipping
  const isActive = !isHidden && !isIdle && !isSkippingDetected;

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setActiveSeconds((prev) => {
        const next = prev + 1;
        // Verify engagement if >= 60% of total duration or at least 45 seconds of study
        const threshold = Math.min(45, Math.floor(totalDurationSeconds * 0.4));
        if (next >= threshold && !engagementVerified) {
          setEngagementVerified(true);
          onEngagementVerified?.();
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, totalDurationSeconds, engagementVerified, onEngagementVerified]);

  // Anti-skipping playhead validator
  const reportPlaybackPosition = useCallback(
    (currentPositionSeconds: number) => {
      const previousPos = lastRecordedPlayheadRef.current;
      const jumpDelta = currentPositionSeconds - previousPos;

      // If user fast-forwards forward more than the threshold in a single jump
      if (jumpDelta > skipThresholdSeconds && previousPos > 0) {
        setIsSkippingDetected(true);
        onSkippingAttempted?.(jumpDelta);
        // Clear warning after 5 seconds
        setTimeout(() => {
          setIsSkippingDetected(false);
        }, 5000);
      } else {
        lastRecordedPlayheadRef.current = currentPositionSeconds;
      }
    },
    [skipThresholdSeconds, onSkippingAttempted]
  );

  const resetHeartbeat = useCallback(() => {
    setActiveSeconds(0);
    setIsIdle(false);
    setIsSkippingDetected(false);
    lastActivityTimeRef.current = Date.now();
    lastRecordedPlayheadRef.current = 0;
  }, []);

  // Compute status label
  let statusLabel = 'Active & Verifying';
  if (isHidden) {
    statusLabel = 'Paused: Window Hidden';
  } else if (isIdle) {
    statusLabel = 'Paused: Trainee Inactive (>60s)';
  } else if (isSkippingDetected) {
    statusLabel = 'Warning: Fast-Forward Skipped';
  } else if (engagementVerified) {
    statusLabel = 'Engagement Verified';
  }

  const verifiedPercentage = Math.min(
    100,
    Math.round((activeSeconds / Math.max(1, totalDurationSeconds)) * 100)
  );

  return {
    isActive,
    isIdle,
    isHidden,
    isSkippingDetected,
    activeSeconds,
    engagementVerified,
    statusLabel,
    verifiedPercentage,
    reportPlaybackPosition,
    resetHeartbeat,
  };
}
