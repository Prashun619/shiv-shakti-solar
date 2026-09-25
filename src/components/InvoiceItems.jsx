import { useEffect } from "react";


export default function InvoiceItems({
  items,
  setItems
}) {


  const totalRows = 12;


  useEffect(() => {

    if (items.length === 0) {

      setItems(
        Array(totalRows).fill(null).map(() => ({

          item_name: "",
          hsn: "",
          qty: ""

        }))
      );

    }

  }, []);


  function updateItem(index, field, value) {

    const updated = [...items];


    updated[index] = {

      ...updated[index],

      [field]: value

    };


    setItems(updated);

  }


  function getSerial(index) {

    let count = 0;


    for (let i = 0; i <= index; i++) {

      if (items[i]?.item_name?.trim()) {

        count++;

      }

    }


    return items[index]?.item_name?.trim()
      ? count
      : "";

  }


  return (

    <div className="
      mt-6
      w-full
      min-w-0
    ">


      {/* Mobile table scrolling is kept inside
          the invoice items section. */}

      <div className="
        w-full
        overflow-x-auto
        overflow-y-hidden
        overscroll-x-contain
      ">


        <table className="
          w-full
          min-w-[700px]
          border-collapse
          border
          border-green-600
        ">


          <thead>


            <tr className="
              text-center
              font-semibold
            ">


              <th className="
                border
                border-green-600
                w-[8%]
                p-2
                whitespace-nowrap
              ">

                S.No.

              </th>


              <th className="
                border
                border-green-600
                w-[38%]
                p-2
                whitespace-nowrap
              ">

                Item Name

              </th>


              <th className="
                border
                border-green-600
                w-[15%]
                p-2
                whitespace-nowrap
              ">

                HSN/SAC

              </th>


              <th className="
                border
                border-green-600
                w-[10%]
                p-2
                whitespace-nowrap
              ">

                Qty

              </th>


              <th className="
                border
                border-green-600
                w-[14%]
                p-2
                whitespace-nowrap
              ">

                Price

              </th>


              <th className="
                border
                border-green-600
                w-[15%]
                p-2
                whitespace-nowrap
              ">

                Amount

              </th>


            </tr>


          </thead>


          <tbody>


            {

              Array.from({
                length: totalRows
              }).map((_, index) => {


                const item =
                  items[index] || {};


                return (

                  <tr
                    key={index}
                    className="h-12"
                  >


                    <td className="
                      border
                      border-green-600
                      text-center
                    ">

                      {getSerial(index)}

                    </td>


                    <td className="
                      border
                      border-green-600
                    ">


                      <input

                        value={
                          item.item_name || ""
                        }

                        onChange={(e) =>
                          updateItem(
                            index,
                            "item_name",
                            e.target.value
                          )
                        }

                        className="
                          w-full
                          h-full
                          min-w-0
                          px-2
                          outline-none
                          bg-transparent
                        "

                      />

                    </td>


                    <td className="
                      border
                      border-green-600
                    ">


                      <input

                        value={
                          item.hsn || ""
                        }

                        onChange={(e) =>
                          updateItem(
                            index,
                            "hsn",
                            e.target.value
                          )
                        }

                        className="
                          w-full
                          h-full
                          min-w-0
                          px-2
                          outline-none
                          bg-transparent
                        "

                      />

                    </td>


                    <td className="
                      border
                      border-green-600
                    ">


                      <input

                        value={
                          item.qty || ""
                        }

                        onChange={(e) =>
                          updateItem(
                            index,
                            "qty",
                            e.target.value
                          )
                        }

                        className="
                          w-full
                          h-full
                          min-w-0
                          text-center
                          outline-none
                          bg-transparent
                        "

                      />

                    </td>


                    <td className="
                      border
                      border-green-600
                    ">

                    </td>


                    <td className="
                      border
                      border-green-600
                    ">

                    </td>


                  </tr>

                );


              })

            }


          </tbody>


        </table>


      </div>


    </div>

  );

}