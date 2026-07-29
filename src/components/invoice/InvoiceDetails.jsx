export default function InvoiceDetails({

  invoiceNumber,
  invoiceDate,

  customerName,
  customerAddress

}) {

function formatInvoiceDate(date) {

  if (!date) return "";

  const d = new Date(date);

  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });

}
  return (

    <div className="border border-green-600 mt-4">


      {/* TITLE ROW */}

      <div className="grid grid-cols-2 border-b border-green-600">


        <div className="p-3 font-bold border-r border-green-600">

          BILL TO

        </div>


        <div className="p-3 font-bold">

          Invoice Details

        </div>


      </div>




      {/* DETAILS ROW */}

      <div className="grid grid-cols-2">


        {/* CUSTOMER */}

        <div className="p-4 border-r border-green-600">


          <p className="font-semibold">

            {customerName || ""}

          </p>


          <p className="mt-2">

            {customerAddress || ""}

          </p>


        </div>




        {/* INVOICE */}

        <div className="p-4">


          <p>

            Invoice No:
            <span className="ml-2 font-semibold">
              {invoiceNumber}
            </span>

          </p>



          <p className="mt-3">

            Invoice Date:
            <span className="ml-2 font-semibold">
  {formatInvoiceDate(invoiceDate)}
</span>

          </p>


        </div>


      </div>


    </div>

  );

}