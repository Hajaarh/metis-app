"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, Square, Pause, Play, RotateCcw, CheckCircle } from "lucide-react";
import { Button } from "@/app/components/ui/button";

interface AudioRecorderProps {
  onBlobReady: (blob: Blob | null) => void;
}

export function AudioRecorder({ onBlobReady }: AudioRecorderProps) {
  const [state, setState] = useState<"idle" | "recording" | "paused" | "done">("idle");
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (state !== "recording") return;
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, [state]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const timeStr = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  async function startRecording() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        onBlobReady(blob);
        streamRef.current?.getTracks().forEach((t) => t.stop());
      };

      recorder.start();
      setState("recording");
    } catch {
      setError("Impossible d'accéder au microphone. Vérifiez les permissions.");
    }
  }

  function togglePause() {
    if (state === "recording") {
      mediaRecorderRef.current?.pause();
      setState("paused");
    } else {
      mediaRecorderRef.current?.resume();
      setState("recording");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setState("done");
  }

  function resetRecording() {
    setState("idle");
    setElapsed(0);
    onBlobReady(null);
  }

  return (
    <div className="flex flex-col items-center gap-4 py-8">
      {/* Waveform */}
      <div className="flex items-center gap-0.5 h-12">
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className="w-1 rounded-full transition-all"
            style={{
              height: state === "recording" ? `${Math.random() * 32 + 8}px` : "4px",
              background: state === "done" ? "var(--primary)" : state === "recording" ? "var(--primary)" : "var(--muted)",
              opacity: state === "recording" ? 0.6 + Math.random() * 0.4 : state === "done" ? 0.5 : 0.3,
            }}
          />
        ))}
      </div>

      {/* Timer */}
      <p className="text-2xl font-medium text-foreground tabular-nums">{timeStr}</p>

      {/* Controls */}
      <div className="flex items-center gap-3">
        {state === "idle" && (
          <Button onClick={startRecording} className="rounded-full h-12 w-12" size="icon">
            <Mic size={20} />
          </Button>
        )}

        {(state === "recording" || state === "paused") && (
          <>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full h-10 w-10"
              onClick={togglePause}
            >
              {state === "recording" ? <Pause size={16} /> : <Play size={16} />}
            </Button>
            <Button
              variant="destructive"
              size="icon"
              className="rounded-full h-12 w-12"
              onClick={stopRecording}
            >
              <Square size={16} />
            </Button>
          </>
        )}

        {state === "done" && (
          <>
            <Button variant="outline" size="icon" className="rounded-full h-10 w-10" onClick={resetRecording}>
              <RotateCcw size={15} />
            </Button>
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle size={22} className="text-green-500" />
            </div>
          </>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground">
        {state === "idle" && "Cliquez pour commencer l'enregistrement"}
        {state === "recording" && "Enregistrement en cours…"}
        {state === "paused" && "En pause"}
        {state === "done" && "Enregistrement terminé — prêt à transcrire"}
      </p>

      {error && <p className="text-[11px] text-destructive">{error}</p>}
    </div>
  );
}
