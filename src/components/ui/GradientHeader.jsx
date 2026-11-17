
export default function GradientHeader({
  title,
  subtitle,
  children,
}) {
  return (
    <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 p-6 shadow-lg sm:p-8">
      <div className="absolute -right-8 -top-12 h-40 w-40 rounded-full bg-pink-400/30 blur-2xl" />
      <div className="absolute -bottom-12 left-1/3 h-32 w-32 rounded-full bg-cyan-300/30 blur-2xl" />

      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            {title}
          </h1>

          {subtitle && (
            <p className="mt-2 text-sm text-white/90 sm:text-base">
              {subtitle}
            </p>
          )}

          <div className="mt-4 h-1 w-20 rounded-full bg-gradient-to-r from-yellow-300 to-pink-300" />
        </div>

        {children && <div>{children}</div>}
      </div>
    </div>
  );
}
