"use client";

import { useState, useEffect } from "react";
import { Mic, Square, Pause, Play } from "lucide-react";
import { Button } from "@/app/components/ui/button";

export function AudioRecorder() {
  const [state, setState] = useState<"idle" | "recording" | "paused">("idle");
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (state !== "recording") return;
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, [state]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const timeStr = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  return (
    <div className="flex flex-col items-center gap-4 py-8">
      {/* Waveform placeholder */}
      <div className="flex items-center gap-0.5 h-12">
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className="w-1 rounded-full transition-all"
            style={{
              height: state === "recording"
                ? `${Math.random() * 32 + 8}px`
                : "4px",
              background: state === "recording" ? "var(--primary)" : "var(--muted)",
              opacity: state === "recording" ? 0.6 + Math.random() * 0.4 : 0.3,
            }}
          />
        ))}
      </div>

      {/* Timer */}
      <p className="text-2xl font-medium text-foreground tabular-nums">
        {timeStr}
      </p>

      {/* Controls */}
      <div className="flex items-center gap-3">
        {state === "idle" ? (
          <Button
            onClick={() => setState("recording")}
            className="rounded-full h-12 w-12"
            size="icon"
          >
            <Mic size={20} />
          </Button>
        ) : (
          <>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full h-10 w-10"
              onClick={() => setState(state === "recording" ? "paused" : "recording")}
            >
              {state === "recording" ? <Pause size={16} /> : <Play size={16} />}
            </Button>
            <Button
              variant="destructive"
              size="icon"
              className="rounded-full h-12 w-12"
              onClick={() => { setState("idle"); setElapsed(0); }}
            >
              <Square size={16} />
            </Button>
          </>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground">
        {state === "idle"
          ? "Cliquez pour commencer l'enregistrement"
          : state === "recording"
          ? "Enregistrement en cours…"
          : "En pause"}
      </p>
    </div>
  );
}
