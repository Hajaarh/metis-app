"use client";

import { RecordingProvider } from "@/app/lib/recording-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return <RecordingProvider>{children}</RecordingProvider>;
}
