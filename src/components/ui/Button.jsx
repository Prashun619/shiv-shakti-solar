export default function Button({

  children,

  variant = "primary",

  className = "",

  ...props

}) {

  const styles = {

    primary:
      "bg-indigo-600 hover:bg-indigo-700 text-white",

    secondary:
      "bg-teal-500 hover:bg-teal-600 text-white",

    danger:
      "bg-red-500 hover:bg-red-600 text-white",

    warning:
      "bg-amber-500 hover:bg-amber-600 text-white",

    light:
      "bg-white border border-slate-300 hover:bg-slate-100 text-slate-700",

  };

  return (

    <button

      {...props}

      className={`
        px-5
        py-3
        rounded-xl
        font-semibold
        transition-all
        duration-300
        shadow-sm
        hover:shadow-lg
        ${styles[variant]}
        ${className}
      `}

    >

      {children}

    </button>

  );

}