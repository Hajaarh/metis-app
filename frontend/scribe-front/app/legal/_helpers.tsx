import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppSidebar } from "@/app/components/AppSidebar";

export function Src({ children }: { children: React.ReactNode }) {
  return <span className="font-medium text-foreground/80">{children}</span>;
}

export function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-4 text-[13px] leading-relaxed bg-accent border border-border text-foreground">
      {children}
    </div>
  );
}

export function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[15px] font-semibold text-foreground mt-8 mb-3">{children}</h2>;
}

export function Disclaimer({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11.5px] text-muted-foreground leading-relaxed border-t border-border pt-6 mt-2">
      {children}
    </p>
  );
}

export function PlainLi({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-[13px] text-foreground leading-relaxed">
      <span className="mt-[7px] w-1 h-1 rounded-full shrink-0 bg-muted-foreground/40" />
      <span>{children}</span>
    </li>
  );
}

export function SrcLi({ src, desc }: { src: string; desc: string }) {
  return (
    <li className="flex items-start gap-2 text-[12.5px] text-foreground leading-relaxed">
      <span className="mt-[6px] w-1 h-1 rounded-full shrink-0 bg-muted-foreground/40" />
      <span>
        <span className="font-medium text-foreground/80">{src}</span> : {desc}
      </span>
    </li>
  );
}

export function LegalTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: React.ReactNode[][];
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-[12.5px] border-collapse">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            {headers.map((h) => (
              <th
                key={h}
                className="text-left text-[11px] uppercase tracking-wide font-medium text-muted-foreground py-2.5 px-4"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i < rows.length - 1 ? "border-b border-border/40" : ""}>
              {row.map((cell, j) => (
                <td key={j} className="py-2.5 px-4 text-foreground align-top leading-relaxed">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LegalPage({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <AppSidebar>
      <div className="px-4 sm:px-8 pt-6 pb-4 shrink-0 border-b border-border">
        <Link
          href="/settings"
          className="inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft size={13} />
          Paramètres
        </Link>
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="max-w-[700px] mx-auto px-4 sm:px-8 py-8 space-y-5">{children}</div>
      </div>
    </AppSidebar>
  );
}
