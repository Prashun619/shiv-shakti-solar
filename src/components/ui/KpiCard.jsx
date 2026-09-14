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
        rounded-xl
        px-4
        py-3
        h-[90px]
        w-full
        text-white
        bg-gradient-to-br
        ${theme.gradient}
        shadow-md
        border
        border-white/10
        hover:shadow-lg
        hover:-translate-y-0.5
        transition-all
        duration-200
      `}
    >

      {/* Decorative Background */}

      <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-white/10"></div>

      <div className="absolute -bottom-8 -left-8 h-20 w-20 rounded-full bg-white/5"></div>


      {/* Content */}

      <div className="relative flex items-center justify-between h-full">

        <div className="min-w-0">

          <p className="
            text-[11px]
            font-semibold
            uppercase
            tracking-wide
            text-white/80
            truncate
          ">
            {title}
          </p>

          <h2 className="
            mt-1
            text-lg
            font-bold
            leading-tight
            truncate
          ">
            {value}
          </h2>

          {subtitle && (
            <p className="
              mt-1
              text-[10px]
              text-white/80
              truncate
            ">
              {subtitle}
            </p>
          )}

        </div>


        {/* Icon */}

        {icon && (
          <div
            className={`
              flex
              h-8
              w-8
              shrink-0
              ml-3
              items-center
              justify-center
              rounded-lg
              ${theme.iconBg}
              backdrop-blur-md
            `}
          >
            {icon}
          </div>
        )}

      </div>

    </div>
  );
}
