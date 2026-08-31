"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

interface RecordingCtx {
  meetingId: string | null;
  recordingState: "idle" | "recording" | "paused" | "done";
  elapsed: number;
  blob: Blob | null;
  error: string;
  startRecording: (meetingId: string) => Promise<void>;
  stopRecording: () => void;
  togglePause: () => void;
  resetRecording: () => void;
}

const RecordingContext = createContext<RecordingCtx | null>(null);

function getSupportedMimeType(): string {
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus", "audio/ogg"];
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? "";
}

export function RecordingProvider({ children }: { children: ReactNode }) {
  const [meetingId, setMeetingId] = useState<string | null>(null);
  const [recordingState, setRecordingState] = useState<"idle" | "recording" | "paused" | "done">("idle");
  const [elapsed, setElapsed] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [error, setError] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const mimeTypeRef = useRef<string>("");

  useEffect(() => {
    if (recordingState !== "recording") return;
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, [recordingState]);

  const startRecording = useCallback(async (id: string) => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = getSupportedMimeType();
      mimeTypeRef.current = mimeType;

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const type = mimeTypeRef.current || recorder.mimeType || "audio/webm";
        setBlob(new Blob(chunksRef.current, { type }));
        streamRef.current?.getTracks().forEach((t) => t.stop());
        setRecordingState("done");
      };

      recorder.start(1000);
      setMeetingId(id);
      setElapsed(0);
      setBlob(null);
      setRecordingState("recording");
    } catch {
      setError("Impossible d'accéder au microphone. Vérifiez les permissions.");
    }
  }, []);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
  }, []);

  const togglePause = useCallback(() => {
    const mr = mediaRecorderRef.current;
    if (!mr) return;
    if (mr.state === "recording") {
      mr.pause();
      setRecordingState("paused");
    } else if (mr.state === "paused") {
      mr.resume();
      setRecordingState("recording");
    }
  }, []);

  const resetRecording = useCallback(() => {
    setMeetingId(null);
    setRecordingState("idle");
    setElapsed(0);
    setBlob(null);
    setError("");
  }, []);

  return (
    <RecordingContext.Provider value={{ meetingId, recordingState, elapsed, blob, error, startRecording, stopRecording, togglePause, resetRecording }}>
      {children}
    </RecordingContext.Provider>
  );
}

export function useRecording() {
  const ctx = useContext(RecordingContext);
  if (!ctx) throw new Error("useRecording must be used within RecordingProvider");
  return ctx;
}
