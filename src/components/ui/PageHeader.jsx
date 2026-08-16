export default function PageHeader({
  title,
  subtitle,
  action,
}) {
  return (
    <div className="flex justify-between items-center mb-8">

      <div>

        <h1 className="text-3xl font-bold text-slate-900">
          {title}
        </h1>

        {subtitle && (
          <p className="text-slate-500 mt-1">
            {subtitle}
          </p>
        )}

      </div>

      {action && (
        <div>
          {action}
        </div>
      )}

    </div>
  );
}