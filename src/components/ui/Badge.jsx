export default function Badge({

  children,

  color = "indigo",

}) {

  const colors = {

    indigo:
      "bg-indigo-100 text-indigo-700",

    emerald:
      "bg-emerald-100 text-emerald-700",

    amber:
      "bg-amber-100 text-amber-700",

    rose:
      "bg-rose-100 text-rose-700",

    cyan:
      "bg-cyan-100 text-cyan-700",

    slate:
      "bg-slate-100 text-slate-700",

  };

  return (

    <span
      className={`
        inline-flex
        items-center
        px-3
        py-1
        rounded-full
        text-xs
        font-semibold
        ${colors[color]}
      `}
    >

      {children}

    </span>

  );

}