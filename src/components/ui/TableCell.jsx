export default function TableCell({

  children,

  center = false,

}) {

  return (

    <td
      className={`
        px-6
        py-4
        whitespace-nowrap
        text-slate-700
        ${center ? "text-center" : ""}
      `}
    >

      {children}

    </td>

  );

}