  import { generateInvoicePDF } from "../services/invoicePdf";
  import { useEffect, useState } from "react";
  import { useNavigate } from "react-router-dom";

  import {
  FileText,
  Pencil,
  Trash2,
} from "lucide-react";

  import {
    getInvoices,
    deleteInvoice,
  } from "../services/invoiceService";

  export default function Invoice() {
    const navigate = useNavigate();

    const [search, setSearch] = useState("");
    const [invoices, setInvoices] = useState([]);

    useEffect(() => {
      loadInvoices();
    }, []);

    async function loadInvoices() {
      const data = await getInvoices();
      setInvoices(data);
    }

    async function handleDelete(id) {
      const confirmDelete = window.confirm("Delete this invoice?");

      if (!confirmDelete) return;

      try {
        await deleteInvoice(id);
        loadInvoices();
      } catch (err) {
        console.error(err);
        alert("Unable to delete invoice");
      }
    }

 const filteredInvoices = [...invoices]
  .sort((a, b) => {
    const numA = parseInt(
      String(a.invoice_number || "").replace(/\D/g, ""),
      10
    ) || 0;

    const numB = parseInt(
      String(b.invoice_number || "").replace(/\D/g, ""),
      10
    ) || 0;

    return numA - numB;
  })
  .filter((invoice) => {
    const value = search.toLowerCase();

    return (
      invoice.invoice_number
        ?.toLowerCase()
        .includes(value) ||
      invoice.customer_name
        ?.toLowerCase()
        .includes(value)
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 text-gray-900">

    {/* HEADER */}
  <div
    className="
      rounded-2xl
      shadow-sm
      mb-6
      p-6
      text-white
      bg-gradient-to-r
      from-blue-600
      via-purple-600
      to-pink-500
    "
  >
    <div className="flex justify-between items-center">

      <div>
        <h1 className="text-3xl font-bold">
          Invoice
        </h1>

        <p className="text-blue-100 mt-1">
          Manage and view all your invoices
        </p>
      </div>

      <button
        onClick={() => navigate("/invoice/new")}
        className="
          bg-white
          text-green-700
          hover:bg-green-50
          px-5
          py-3
          rounded-xl
          font-bold
          shadow-sm
          transition
        "
      >
        + Create Invoice
      </button>

    </div>
  </div>


      {/* SEARCH */}
      <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-5 mb-6">

        <div className="relative">

          <input
            type="text"
            placeholder="Search Invoice Number or Customer"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="
              w-full
              bg-blue-50
              border
              border-blue-200
              text-gray-900
              placeholder-gray-400
              rounded-xl
              px-4
              py-3
              outline-none
              focus:ring-2
              focus:ring-blue-400
              focus:border-blue-400
            "
          />

        </div>

      </div>


      {/* INVOICE TABLE */}
<div className="bg-white rounded-2xl shadow-sm border border-blue-100 overflow-hidden">

  <div className="overflow-x-auto">

    <table className="w-full border-collapse border border-black text-sm">

      <thead className="bg-gradient-to-r from-blue-600 to-indigo-600">

        <tr>

          <th className="px-2 py-2 text-center text-xs font-semibold text-white border border-black">
            Invoice No
          </th>

          <th className="px-2 py-2 text-center text-xs font-semibold text-white border border-black">
            Date
          </th>

          <th className="px-2 py-2 text-center text-xs font-semibold text-white border border-black">
            Customer
          </th>

          <th className="px-2 py-2 text-center text-xs font-semibold text-white border border-black">
            Amount
          </th>

          <th className="px-2 py-2 text-center text-xs font-semibold text-white border border-black">
            Action
          </th>

        </tr>

      </thead>


      <tbody>

        {filteredInvoices.length === 0 ? (

          <tr>

            <td
              colSpan="5"
              className="p-8 text-center text-gray-500 border border-black"
            >
              <div className="text-lg font-semibold text-gray-600">
                No invoices found
              </div>

              <div className="text-sm mt-1">
                Try another search or create a new invoice.
              </div>
            </td>

          </tr>

        ) : (

          filteredInvoices.map((invoice, index) => (

            <tr
              key={invoice.id}
              className={`
                transition
                hover:bg-blue-50
                ${
                  index % 2 === 0
                    ? "bg-white"
                    : "bg-slate-50"
                }
              `}
            >

              {/* INVOICE NUMBER */}

              <td className="px-2 py-1.5 text-center border border-black">

                <button
                  type="button"
                  onClick={() =>
                    generateInvoicePDF(invoice, false)
                  }
                  className="
                    inline-flex
                    items-center
                    bg-blue-100
                    text-blue-700
                    hover:bg-blue-200
                    px-2
                    py-0.5
                    rounded-md
                    font-semibold
                    text-xs
                    transition
                    cursor-pointer
                  "
                  title="View Invoice"
                >
                  {invoice.invoice_number}
                </button>

              </td>


              {/* DATE */}

              <td className="px-2 py-1.5 text-center text-gray-700 border border-black">

                {new Date(invoice.invoice_date)
                  .toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                  .replace(/ /g, "-")}

              </td>


              {/* CUSTOMER */}

              <td className="px-2 py-1.5 text-center border border-black">

                <span className="font-semibold text-gray-800">
                  {invoice.customer_name}
                </span>

              </td>


              {/* AMOUNT */}

              <td className="px-2 py-1.5 text-center border border-black">

                <span
                  className="
                    inline-flex
                    items-center
                    bg-green-100
                    text-green-700
                    px-2
                    py-0.5
                    rounded-md
                    font-bold
                    text-xs
                  "
                >
                  ₹{Number(invoice.total || 0).toFixed(2)}
                </span>

              </td>


              {/* ACTIONS */}

<td className="px-2 py-1.5 border border-black">

  <div className="flex gap-2 justify-center items-center">

    {/* DOWNLOAD PDF */}

    <button
      type="button"
      onClick={() =>
        generateInvoicePDF(invoice)
      }
      className="
        w-8
        h-8
        flex
        items-center
        justify-center
        bg-green-500
        hover:bg-green-600
        text-white
        rounded-lg
        transition
        shadow-sm
      "
      title="Download PDF"
    >
      <FileText size={16} strokeWidth={2.5} />
    </button>


    {/* EDIT */}

    <button
      type="button"
      onClick={() =>
        navigate(
          `/invoice/new?id=${invoice.id}`
        )
      }
      className="
        w-8
        h-8
        flex
        items-center
        justify-center
        bg-blue-500
        hover:bg-blue-600
        text-white
        rounded-lg
        transition
        shadow-sm
      "
      title="Edit Invoice"
    >
      <Pencil size={16} strokeWidth={2.5} />
    </button>


    {/* DELETE */}

    <button
      type="button"
      onClick={() =>
        handleDelete(invoice.id)
      }
      className="
        w-8
        h-8
        flex
        items-center
        justify-center
        bg-red-500
        hover:bg-red-600
        text-white
        rounded-lg
        transition
        shadow-sm
      "
      title="Delete Invoice"
    >
      <Trash2 size={16} strokeWidth={2.5} />
    </button>

  </div>

</td>

            </tr>

          ))

        )}

      </tbody>

    </table>

  </div>

</div>

    </div>
  );
  }