type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <section className="retro-surface flex flex-col gap-5 bg-[color:var(--surface-card)] px-4 py-5 sm:px-5 sm:py-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex min-w-0 flex-col gap-3">
        <p className="font-heading text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {eyebrow}
        </p>
        <h1 className="text-3xl leading-[0.94] tracking-[-0.05em] md:text-5xl">
          {title}
        </h1>
        {description && (
          <p className="max-w-2xl text-sm font-medium leading-7 text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3 lg:justify-end">{actions}</div>}
    </section>
  );
}
