"use client";

import { Mic, Square, Pause, Play, RotateCcw, CheckCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/app/components/ui/button";
import { useRecording } from "@/app/lib/recording-context";

interface AudioRecorderProps {
  meetingId: string;
}

export function AudioRecorder({ meetingId }: AudioRecorderProps) {
  const { meetingId: activeMeetingId, recordingState, elapsed, error, startRecording, stopRecording, togglePause, resetRecording } = useRecording();

  const isThisMeeting = activeMeetingId === meetingId;
  const otherActive = activeMeetingId !== null && !isThisMeeting && (recordingState === "recording" || recordingState === "paused");
  const state = isThisMeeting ? recordingState : "idle";

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const timeStr = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  if (otherActive) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <p className="text-[13px] text-muted-foreground">
          Un enregistrement est en cours pour une autre réunion.
        </p>
        <Link href={`/reunions/${activeMeetingId}`} className="text-[12.5px] text-primary hover:underline">
          Revenir à l&apos;enregistrement en cours →
        </Link>
      </div>
    );
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
      <p className="text-2xl font-medium text-foreground tabular-nums">
        {isThisMeeting ? timeStr : "00:00"}
      </p>

      {/* Controls */}
      <div className="flex items-center gap-3">
        {state === "idle" && (
          <Button onClick={() => startRecording(meetingId)} className="rounded-full h-12 w-12" size="icon">
            <Mic size={20} />
          </Button>
        )}

        {(state === "recording" || state === "paused") && (
          <>
            <Button variant="outline" size="icon" className="rounded-full h-10 w-10" onClick={togglePause}>
              {state === "recording" ? <Pause size={16} /> : <Play size={16} />}
            </Button>
            <Button variant="destructive" size="icon" className="rounded-full h-12 w-12" onClick={stopRecording}>
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

      {isThisMeeting && error && <p className="text-[11px] text-destructive">{error}</p>}
    </div>
  );
}
