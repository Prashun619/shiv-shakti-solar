import { theme } from "../../styles/theme";

export default function Card({
  children,
  className = "",
  hover = true,
}) {
  return (
    <div
      className={`
        bg-white
        rounded-2xl
        border
        border-slate-200
        shadow-sm
        transition-all
        duration-300
        ${
          hover
            ? "hover:-translate-y-1 hover:shadow-xl"
            : ""
        }
        ${className}
      `}
      style={{
        borderRadius: theme.radius.md,
      }}
    >
      {children}
    </div>
  );
}