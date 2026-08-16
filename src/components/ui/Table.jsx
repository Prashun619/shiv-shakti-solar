export default function Table({

  columns = [],

  children,

  emptyMessage = "No data available",

  hasData = true,

}) {

  return (

    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

      <div className="overflow-x-auto">

        <table className="w-full">

          <thead className="bg-slate-50 border-b border-slate-200">

            <tr>

              {columns.map((column) => (

                <th
                  key={column}
                  className="
                    px-6
                    py-4
                    text-left
                    text-sm
                    font-semibold
                    text-slate-700
                    whitespace-nowrap
                  "
                >
                  {column}
                </th>

              ))}

            </tr>

          </thead>

          <tbody>

            {hasData ? (

              children

            ) : (

              <tr>

                <td
                  colSpan={columns.length}
                  className="py-12 text-center text-slate-400"
                >
                  {emptyMessage}
                </td>

              </tr>

            )}

          </tbody>

        </table>

      </div>

    </div>

  );

}