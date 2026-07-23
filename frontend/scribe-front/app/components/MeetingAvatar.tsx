"use client";

export function MeetingAvatar({ name, size = 22 }: { name: string; size?: number }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2);
  const hue = (name.charCodeAt(0) * 37) % 360;

  return (
    <span
      className="inline-flex items-center justify-center rounded-full text-white font-medium shrink-0"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: `hsl(${hue}, 28%, 58%)`,
      }}
    >
      {initials}
    </span>
  );
}
