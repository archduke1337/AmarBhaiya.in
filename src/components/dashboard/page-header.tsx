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
    <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-1.5">
        <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
          {eyebrow}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="max-w-2xl text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </section>
  );
}
