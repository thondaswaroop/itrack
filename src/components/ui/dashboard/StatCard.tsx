import React from "react";
import { Icon } from "../../../utils/icons";

type AppIconName = React.ComponentProps<typeof Icon>["name"];

export interface StatCardProps {
  icon: AppIconName;              // one of your allowed icon names
  label: string;
  value: string | number;
  trend?: { dir: "up" | "down"; value: string }; // optional delta badge
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, trend }) => {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:p-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-surfaceMuted)] text-[var(--color-primary)]">
        <Icon name={icon} className="h-6 w-6" />
      </div>
      <div className="mt-3 flex items-end justify-between">
        <div>
          <span className="text-sm text-[var(--color-textMuted)]">{label}</span>
          <h4 className="mt-2 text-title-sm font-bold text-[var(--color-text)]">{value}</h4>
        </div>
        {trend ? (
          <div
            className={`hidden items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold sm:flex ${
              trend.dir === "up"
                ? "bg-[var(--color-success)]/10 text-[var(--color-success)]"
                : "bg-[var(--color-danger)]/10 text-[var(--color-danger)]"
            }`}
            title="vs yesterday"
          >
            {/* rotate caretDown to indicate direction */}
            <Icon
              name="caretDown"
              className={`h-4 w-4 ${trend.dir === "up" ? "rotate-180" : "rotate-0"}`}
            />
            {trend.value}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default StatCard;
