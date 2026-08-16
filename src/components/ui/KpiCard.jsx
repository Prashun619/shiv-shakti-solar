    export default function KpiCard({
    title,
    value,
    icon,
    subtitle,
    color = "blue",
    trend = "up",
    }) {
    const themes = {
        purple: {
        gradient: "from-violet-600 to-indigo-600",
        iconBg: "bg-white/20",
        },

        blue: {
        gradient: "from-sky-500 to-blue-600",
        iconBg: "bg-white/20",
        },

        green: {
        gradient: "from-emerald-500 to-green-600",
        iconBg: "bg-white/20",
        },

        orange: {
        gradient: "from-amber-400 to-orange-500",
        iconBg: "bg-white/20",
        },

        red: {
        gradient: "from-rose-500 to-red-500",
        iconBg: "bg-white/20",
        },
    };

    const theme = themes[color] || themes.blue;

   return (
  <div
    className={`
      relative
      overflow-hidden
      rounded-2xl
      p-3
      h-[100px]
      w-full
      text-white
      bg-gradient-to-br
      ${theme.gradient}
      shadow-lg
      border
      border-white/10
      hover:shadow-2xl
      hover:-translate-y-1
      transition-all
      duration-300
    `}
  >
    {/* Decorative Background */}

    <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/10"></div>

    <div className="absolute -bottom-10 -left-10 h-24 w-24 rounded-full bg-white/5"></div>

    {/* Header */}

    <div className="flex items-start justify-between">

      <div>

        <p className="text-xs font-medium uppercase tracking-wide text-white/80">
          {title}
        </p>

        <h2 className="mt-1 text-xl font-bold leading-none">
          {value}
        </h2>

      </div>

      <div
        className={`
          h-10
w-10
rounded-xl
          ${theme.iconBg}
          backdrop-blur-md
          flex
          items-center
          justify-center
          shadow-lg
        `}
      >
        {icon}
      </div>

    </div>

    {/* Footer */}

   {subtitle && (
  <div className="absolute bottom-2 left-4 right-4 flex items-center gap-2">

    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20">

      {trend === "down" ? (
        <span className="text-red-200 text-xs font-bold">↓</span>
      ) : (
        <span className="text-emerald-200 text-xs font-bold">↑</span>
      )}

    </div>

    <span className="text-xs text-white/90 truncate">
      {subtitle}
    </span>

  </div>
)}

  </div>
);
    }