import { useNavigate } from "react-router-dom";

export default function InvoiceTable({ invoices }) {
  const navigate = useNavigate();

  if (!invoices.length) {
    return (
      <div className="bg-white rounded-2xl shadow p-10 text-center text-gray-500">
        No invoices found.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow overflow-hidden">

      <div className="grid grid-cols-12 bg-gray-100 px-6 py-3 font-semibold text-gray-700">

        <div className="col-span-2">
          Invoice No.
        </div>

        <div className="col-span-2">
          Date
        </div>

        <div className="col-span-3">
          Customer
        </div>

        <div className="col-span-2 text-right">
          Amount
        </div>

        <div className="col-span-3 text-center">
          Actions
        </div>

      </div>

      {invoices.map((invoice) => (

        <div
          key={invoice.id}
          className="grid grid-cols-12 items-center px-6 py-4 border-t hover:bg-gray-50"
        >

          <div className="col-span-2 font-medium">
            {invoice.invoice_number}
          </div>

          <div className="col-span-2">
            {invoice.invoice_date}
          </div>

          <div className="col-span-3">
            {invoice.customer_name}
          </div>

          <div className="col-span-2 text-right font-semibold">
            ₹ {Number(invoice.total).toFixed(2)}
          </div>

          <div className="col-span-3 flex justify-center gap-2">

            <button
              onClick={() =>
                navigate(`/invoice/${invoice.id}`)
              }
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded-lg"
            >
              Edit
            </button>

            <button
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded-lg"
            >
              PDF
            </button>

          </div>

        </div>

      ))}

    </div>
  );
}