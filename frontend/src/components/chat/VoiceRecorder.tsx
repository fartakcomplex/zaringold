
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {Mic, MicOff, Send, Loader2} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {cn} from '@/lib/utils';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  VoiceRecorder Component                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function VoiceRecorder({
  onTranscribed,
}: {
  onTranscribed: (text: string) => void;
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  /* ── Cleanup on unmount ── */
  useEffect(() => {
    return () => {
      stopTimer();
      cleanupStream();
    };
  }, []);

  const cleanupStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  /* ── Start recording ── */
  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setPermissionDenied(false);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stopTimer();
        setIsRecording(false);

        if (chunksRef.current.length === 0) return;

        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });

        // Convert to base64
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          await transcribeAudio(base64Audio);
        };
        reader.readAsDataURL(audioBlob);

        cleanupStream();
      };

      mediaRecorder.start(250); // collect chunks every 250ms
      setIsRecording(true);
      setSeconds(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('[VoiceRecorder] Error accessing microphone:', err);
      const errName = (err as DOMException)?.name;
      if (
        errName === 'NotAllowedError' ||
        errName === 'PermissionDeniedError'
      ) {
        setPermissionDenied(true);
        setError('دسترسی به میکروفون رد شد. لطفاً در تنظیمات مرورگر اجازه دسترسی بدهید.');
      } else if (errName === 'NotFoundError') {
        setError('میکروفونی یافت نشد. لطفاً یک میکروفون وصل کنید.');
      } else {
        setError('خطا در دسترسی به میکروفون');
      }
    }
  }, [stopTimer, cleanupStream]);

  /* ── Stop recording ── */
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  }, [isRecording]);

  /* ── Transcribe audio ── */
  const transcribeAudio = useCallback(
    async (base64Audio: string) => {
      setIsTranscribing(true);
      try {
        const res = await fetch('/api/voice-transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audio: base64Audio }),
        });
        const data = await res.json();

        if (data.success && data.text) {
          onTranscribed(data.text);
        } else {
          setError(data.error || 'خطا در تبدیل صوت به متن');
        }
      } catch {
        setError('خطا در ارتباط با سرور');
      } finally {
        setIsTranscribing(false);
      }
    },
    [onTranscribed]
  );

  /* ── Format timer ── */
  const formatTimer = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    const persianMins = mins.toString().replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
    const persianSecs = secs.toString().padStart(2, '0').replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
    return `${persianMins}:${persianSecs}`;
  };

  /* ── Render ── */

  if (permissionDenied || error) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-9 text-red-400 hover:text-red-500 hover:bg-red-500/10 shrink-0"
        onClick={() => {
          setPermissionDenied(false);
          setError(null);
        }}
        aria-label="خطا در میکروفون"
        title={error || 'خطا در دسترسی به میکروفون'}
      >
        <MicOff className="size-4" />
      </Button>
    );
  }

  if (isTranscribing) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-9 text-gold hover:text-gold hover:bg-gold/10 shrink-0"
        disabled
        aria-label="در حال تبدیل صوت"
      >
        <Loader2 className="size-4 animate-spin" />
      </Button>
    );
  }

  if (isRecording) {
    return (
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Pulsing red dot */}
        <span className="relative flex size-3">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex size-3 rounded-full bg-red-500" />
        </span>
        {/* Timer */}
        <span className="text-xs font-medium text-red-500 tabular-nums min-w-[3ch] text-center">
          {formatTimer(seconds)}
        </span>
        {/* Stop button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-9 text-red-500 hover:text-red-600 hover:bg-red-500/10 shrink-0"
          onClick={stopRecording}
          aria-label="توقف ضبط"
        >
          <MicOff className="size-4" />
        </Button>
      </div>
    );
  }

  // Default state — microphone button
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-9 text-muted-foreground hover:text-foreground shrink-0"
      onClick={startRecording}
      aria-label="ضبط صوتی"
    >
      <Mic className="size-4" />
    </Button>
  );
}
