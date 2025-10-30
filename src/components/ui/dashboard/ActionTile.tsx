import React from "react";
import { Icon } from "../../../utils/icons";

type AppIconName = React.ComponentProps<typeof Icon>["name"];

export interface ActionTileProps {
  icon: AppIconName;       // use your union names
  title: string;
  desc: string;
  onClick: () => void;
}

const ActionTile: React.FC<ActionTileProps> = ({ icon, title, desc, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-left transition hover:bg-[var(--color-surfaceMuted)]"
    >
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--color-brand-50)] text-[var(--color-brand-500)]">
          <Icon name={icon} className="h-5 w-5" />
        </div>
        <div>
          <div className="font-semibold text-[var(--color-text)]">{title}</div>
          <div className="text-sm text-[var(--color-textMuted)]">{desc}</div>
        </div>
      </div>
    </button>
  );
};

export default ActionTile;
