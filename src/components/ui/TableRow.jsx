export default function TableRow({

  children,

}) {

  return (

    <tr
      className="
        border-b
        border-slate-100
        hover:bg-slate-50
        transition
      "
    >

      {children}

    </tr>

  );

}