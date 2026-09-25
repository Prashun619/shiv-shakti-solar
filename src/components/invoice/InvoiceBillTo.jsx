export default function InvoiceBillTo({

  customerName,
  setCustomerName,

  customerAddress,
  setCustomerAddress,

  customers,
  customerId,
  setCustomerId,

  invoiceNumber,
  setInvoiceNumber,

  invoiceDate,
  setInvoiceDate,

}) {


  function handleCustomer(e) {

    const id = e.target.value;

    setCustomerId(id);

    const customer =
      customers.find(
        c => String(c.id) === String(id)
      );

    if (!customer) return;

    setCustomerName(
      customer.customer_name || ""
    );

    const address =
      customer.address || "";

    const city =
      customer.city || "";

    const district =
      customer.district || "";

    const state =
      customer.state || "";

    const pincode =
      customer.pincode || "";

    const formattedAddress = [
      address,
      [
        city,
        district
          ? `District : ${district}`
          : ""
      ]
        .filter(Boolean)
        .join(", "),
      [
        state,
        pincode
      ]
        .filter(Boolean)
        .join(", ")
    ]
      .filter(Boolean)
      .join("\n");

    setCustomerAddress(
      formattedAddress
    );

  }


  function formatDate(date) {

    if (!date) return "";

    return new Date(date).toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }
    );

  }


  console.table(
    customers.map((c) => ({
      id: c.id,
      customer_name: c.customer_name,
      created_at: c.created_at,
    }))
  );


  return (

    <div className="
      border-2
      border-green-700
      h-auto
      w-full
      min-w-0
      overflow-hidden
    ">


      <div className="
        grid
        grid-cols-1
        lg:grid-cols-2
        items-stretch
      ">


        {/* ================= BILL TO ================= */}

        <div className="
          border-b-2
          lg:border-b-0
          lg:border-r-2
          border-green-700
          min-w-0
        ">


          <div className="
            bg-green-700
            text-white
            font-bold
            p-2
          ">

            BILL TO

          </div>


          <div className="
            p-3
            sm:p-4
          ">


            <label className="
              font-semibold
            ">

              Customer

            </label>


            <select

              className="
                w-full
                min-w-0
                border
                mt-2
                p-2
                rounded
                bg-white
              "

              value={customerId}

              onChange={handleCustomer}

            >


              <option value="">

                Select Customer

              </option>


              {
                [...customers]
                  .sort((a, b) => {
                    return Number(a.id) - Number(b.id);
                  })
                  .map(customer => (

                    <option
                      key={customer.id}
                      value={customer.id}
                    >

                      {customer.customer_name}

                    </option>

                  ))
              }


            </select>


            <div className="
              mt-4
            ">


              <div className="
                font-semibold
              ">

                Customer Name

              </div>


              <div

                className="
                  border
                  mt-2
                  p-2
                  min-h-[42px]
                  whitespace-pre-wrap
                  break-words
                  overflow-wrap-anywhere
                "

                contentEditable

                suppressContentEditableWarning

                onBlur={(e) =>
                  setCustomerName(
                    e.currentTarget.innerText
                  )
                }

              >

                {customerName}

              </div>


            </div>


            <div className="
              mt-4
            ">


              <div className="
                font-semibold
              ">

                Address

              </div>


              <div

                className="
                  border
                  mt-2
                  p-2
                  min-h-[120px]
                  h-auto
                  whitespace-pre-line
                  break-words
                  leading-6
                  overflow-visible
                  box-border
                  overflow-wrap-anywhere
                "

                contentEditable

                suppressContentEditableWarning

                onBlur={(e) =>
                  setCustomerAddress(
                    e.currentTarget.innerText
                  )
                }

              >

                {customerAddress}

              </div>


            </div>


          </div>


        </div>


        {/* ================= INVOICE DETAILS ================= */}

        <div className="
          min-w-0
        ">


          <div className="
            bg-green-700
            text-white
            font-bold
            p-2
          ">

            Invoice Details

          </div>


          <div className="
            w-full
            overflow-x-auto
          ">


            <table className="
              w-full
              min-w-[320px]
            ">


              <tbody>


                <tr>

                  <td className="
                    border
                    p-3
                    font-semibold
                    whitespace-nowrap
                  ">

                    Invoice Number

                  </td>

                  <td className="
                    border
                    p-3
                    min-w-0
                  ">

                    <input

                      value={invoiceNumber}

                      onChange={(e) =>
                        setInvoiceNumber(
                          e.target.value
                        )
                      }

                      className="
                        w-full
                        min-w-0
                        outline-none
                        bg-transparent
                      "

                    />

                  </td>

                </tr>


                <tr>

                  <td className="
                    border
                    p-3
                    font-semibold
                    whitespace-nowrap
                  ">

                    Invoice Date

                  </td>

                  <td className="
                    border
                    p-3
                    min-w-0
                  ">

                    <input

                      type="date"

                      value={invoiceDate}

                      onChange={(e) =>
                        setInvoiceDate(
                          e.target.value
                        )
                      }

                      className="
                        w-full
                        min-w-0
                        outline-none
                        bg-transparent
                      "

                    />

                  </td>

                </tr>


              </tbody>


            </table>


          </div>


        </div>


      </div>


    </div>

  );

}