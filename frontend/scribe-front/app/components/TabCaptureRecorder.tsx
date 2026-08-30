"use client";

import { useState, useRef, useEffect } from "react";
import { MonitorSpeaker, Square, CheckCircle, RotateCcw } from "lucide-react";
import { Button } from "@/app/components/ui/button";

interface TabCaptureRecorderProps {
  onBlobReady: (blob: Blob | null) => void;
  forceStop?: boolean;
}

export function TabCaptureRecorder({ onBlobReady, forceStop }: TabCaptureRecorderProps) {
  const [state, setState] = useState<"idle" | "recording" | "done">("idle");
  const [includeMic, setIncludeMic] = useState(false);
  const [error, setError] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const displayStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (forceStop && state === "recording") stopRecording();
  }, [forceStop, state]);

  async function startCapture() {
    setError("");
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      // Stop video tracks immediately — we only need audio
      displayStream.getVideoTracks().forEach((t) => t.stop());
      displayStreamRef.current = displayStream;

      const audioTracks = displayStream.getAudioTracks();
      if (audioTracks.length === 0) {
        displayStream.getTracks().forEach((t) => t.stop());
        setError("Aucune piste audio capturée. Cochez « Partager l'audio du système » dans la boîte de dialogue.");
        return;
      }

      let recordingStream: MediaStream;

      if (includeMic) {
        const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const ctx = new AudioContext();
        audioContextRef.current = ctx;
        const destination = ctx.createMediaStreamDestination();
        ctx.createMediaStreamSource(new MediaStream(audioTracks)).connect(destination);
        ctx.createMediaStreamSource(micStream).connect(destination);
        recordingStream = destination.stream;

        audioTracks[0].onended = () => stopRecording();
      } else {
        recordingStream = new MediaStream(audioTracks);
        audioTracks[0].onended = () => stopRecording();
      }

      chunksRef.current = [];
      const recorder = new MediaRecorder(recordingStream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        onBlobReady(blob);
        audioContextRef.current?.close();
      };

      recorder.start();
      setState("recording");
    } catch (e) {
      if (e instanceof DOMException && e.name === "NotAllowedError") {
        setError("Capture annulée ou refusée.");
      } else {
        setError("Impossible de démarrer la capture audio.");
      }
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    displayStreamRef.current?.getTracks().forEach((t) => t.stop());
    displayStreamRef.current = null;
    setState("done");
  }

  function reset() {
    displayStreamRef.current?.getTracks().forEach((t) => t.stop());
    displayStreamRef.current = null;
    setState("idle");
    onBlobReady(null);
  }

  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <MonitorSpeaker
        size={36}
        className={state === "recording" ? "text-primary animate-pulse" : "text-muted-foreground"}
      />

      {state === "idle" && (
        <div className="flex flex-col items-center gap-4">
          <label className="flex items-center gap-2 text-[13px] text-muted-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeMic}
              onChange={(e) => setIncludeMic(e.target.checked)}
              className="accent-[var(--primary)]"
            />
            Inclure mon microphone
          </label>
          <Button onClick={startCapture} className="rounded-full px-6">
            <MonitorSpeaker size={16} />
            Démarrer la capture
          </Button>
          <p className="text-[11px] text-muted-foreground text-center max-w-xs">
            Sélectionnez un onglet ou l&apos;écran entier. Activez &ldquo;Partager l&apos;audio du système&rdquo; si disponible.
          </p>
        </div>
      )}

      {state === "recording" && (
        <div className="flex flex-col items-center gap-3">
          <p className="text-[13px] font-medium text-foreground">Capture en cours…</p>
          <Button variant="destructive" size="icon" className="rounded-full h-12 w-12" onClick={stopRecording}>
            <Square size={16} />
          </Button>
        </div>
      )}

      {state === "done" && (
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
            <CheckCircle size={22} className="text-green-500" />
          </div>
          <p className="text-[13px] text-foreground">Capture terminée — prête à transcrire</p>
          <Button variant="outline" size="sm" onClick={reset}>
            <RotateCcw size={13} />
            Recommencer
          </Button>
        </div>
      )}

      {error && <p className="text-[11px] text-destructive">{error}</p>}
    </div>
  );
}
