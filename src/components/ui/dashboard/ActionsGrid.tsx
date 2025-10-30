import React from "react";
import ActionTile, { type ActionTileProps } from "./ActionTile";

/** exactly 3 per row on sm+; 1 per row on mobile */
const ActionsGrid: React.FC<{ items: ActionTileProps[] }> = ({ items }) => {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-6">
      {items.map((a) => (
        <ActionTile key={a.title} {...a} />
      ))}
    </section>
  );
};

export default ActionsGrid;
