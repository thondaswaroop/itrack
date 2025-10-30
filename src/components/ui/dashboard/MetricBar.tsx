import React from "react";

export interface MetricBarProps {
  label: string;
  value: number; // 0-100
  helper?: string;
}

const clamp = (n: number) => Math.min(Math.max(n, 0), 100);

const MetricBar: React.FC<MetricBarProps> = ({ label, value, helper }) => {
  const v = clamp(value);
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div className="font-semibold text-[var(--color-text)]">{label}</div>
        {helper ? <div className="text-sm text-[var(--color-textMuted)]">{helper}</div> : null}
      </div>
      <div className="mt-3 h-2 w-full rounded-full bg-[var(--color-surfaceMuted)]">
        <div
          className="h-2 rounded-full bg-[var(--color-primary)] transition-all"
          style={{ width: `${v}%` }}
        />
      </div>
      <div className="mt-2 text-sm text-[var(--color-textMuted)]">{v}%</div>
    </div>
  );
};

export default MetricBar;
