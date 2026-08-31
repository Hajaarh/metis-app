"use client";

import { useState, useRef } from "react";
import { Upload, FileAudio, X } from "lucide-react";
import { Button } from "@/app/components/ui/button";

interface AudioImportProps {
  onFileChange: (file: File | null) => void;
}

export function AudioImport({ onFileChange }: AudioImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File) {
    setFile(f);
    onFileChange(f);
  }

  function clearFile() {
    setFile(null);
    onFileChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="py-4">
      {!file ? (
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            dragOver ? "border-primary bg-accent" : "border-border"
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files[0];
            if (f) handleFile(f);
          }}
        >
          <Upload size={24} className="mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-foreground font-medium mb-1">
            Glissez un fichier audio ici
          </p>
          <p className="text-[12px] text-muted-foreground mb-4">
            Formats acceptés : MP3, WAV, M4A, OGG — Max 500 Mo
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
          >
            Parcourir les fichiers
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary">
          <FileAudio size={20} className="text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
            <p className="text-[11px] text-muted-foreground">
              {(file.size / 1024 / 1024).toFixed(1)} Mo
            </p>
          </div>
          <Button variant="ghost" size="icon" className="shrink-0" onClick={clearFile}>
            <X size={14} />
          </Button>
        </div>
      )}
    </div>
  );
}
