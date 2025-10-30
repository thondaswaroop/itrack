import React from "react";
import StatCard, { type StatCardProps } from "./StatCard";

/** 3 per row at md+; 2 per row at sm; 1 per row on mobile */
const KpiGrid: React.FC<{ items: StatCardProps[] }> = ({ items }) => {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-6">
      {items.map((k) => (
        <StatCard key={k.label} {...k} />
      ))}
    </section>
  );
};

export default KpiGrid;
