import { ArrowRight, CircleDashed } from "lucide-react";

export type ModuleRoadmapItem = {
  title: string;
  description: string;
  status: "ready" | "planned";
};

type ModulePageProps = {
  eyebrow: string;
  title: string;
  description: string;
  primaryAction: string;
  notice: string;
  items: ModuleRoadmapItem[];
};

// ModulePage standardizes empty-state presentation only. When a module gains
// real workflows, keep its domain UI inside that module instead of expanding
// this shared component with business-specific conditions.
export function ModulePage({
  eyebrow,
  title,
  description,
  primaryAction,
  notice,
  items,
}: ModulePageProps) {
  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <button className="primary-button" type="button" disabled>
          {primaryAction}
          <ArrowRight size={16} />
        </button>
      </header>

      <div className="notice-card">
        <CircleDashed size={18} aria-hidden="true" />
        <p>{notice}</p>
      </div>

      <div className="roadmap-grid">
        {items.map((item) => (
          <article className="roadmap-card" key={item.title}>
            <div className="roadmap-card-top">
              <span className={item.status === "ready" ? "tag ready" : "tag"}>
                {item.status === "ready" ? "骨架已就绪" : "后续开发"}
              </span>
            </div>
            <h2>{item.title}</h2>
            <p>{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
