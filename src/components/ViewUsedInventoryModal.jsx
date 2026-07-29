export default function ViewUsedInventoryModal({
  open,
  onClose,
  item,
}) {

  if (!open || !item)
    return null;


const allProducts = Object.values(

  (item.products || []).reduce((acc, product)=>{

    const key =
 product.product_name +
 "_" +
 product.category +
 "_" +
 product.unit_price;


    if(!acc[key]){

      acc[key] = {

        product_name:
          product.product_name,

        category:
          product.category,

        quantity:
          Number(product.quantity || 0),

        unit_price:
          Number(product.unit_price || 0),

      };

    }
    else{

      acc[key].quantity +=
        Number(product.quantity || 0);

    }


    return acc;


  },{})

).map((product)=>({

  ...product,

  total:
    Number(product.quantity)
    *
    Number(product.unit_price)

}));


  const plantCost = Number(item.total_plant_cost || 0);


  return (

    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-5">

      <div className="bg-white rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.25)] border border-slate-200 w-full max-w-7xl max-h-[92vh] overflow-auto">

        {/* Header */}

        <div className="bg-gradient-to-r from-slate-900 via-indigo-900 to-blue-700 p-5 rounded-t-2xl">

  <h2 className="text-2xl font-bold text-white">
    Used Inventory Details
  </h2>

  <p className="text-blue-100 text-sm mt-1">
    Customer Material Consumption Report
  </p>

</div>


        <div className="p-6">

         {/* Customer Details */}

<div className="border rounded-xl shadow-sm bg-gray-50 p-5 mb-6">

  <div className="grid grid-cols-2 gap-4 text-sm">

    <div>
      <span className="font-semibold">
        Customer Name:
      </span>

      <span className="ml-2">
        {item.customers?.customer_name || item.customer_name || "-"}
      </span>
    </div>


    <div>
      <span className="font-semibold">
        Plant Size:
      </span>

      <span className="ml-2">
        {item.plant_size || "-"} kW
      </span>
    </div>


    <div>
      <span className="font-semibold">
        Location:
      </span>

      <span className="ml-2">
        {item.location || "-"}
      </span>
    </div>


    <div>
      <span className="font-semibold">
        Plant Cost:
      </span>

      <span className="ml-2 text-green-700 font-bold">
        ₹ {Number(plantCost || 0).toFixed(2)}
      </span>
    </div>


  </div>

</div>

          {/* Products */}

          <div className="flex justify-between items-center mb-4">

            <h3 className="text-xl font-bold border-l-4 border-indigo-700 pl-3">

              Products Used

            </h3>

            

          </div>


          <div className="overflow-hidden rounded-lg border border-black shadow-sm">

            <table className="w-full border-collapse text-sm">

              <thead className="bg-gradient-to-r from-indigo-700 to-blue-700 text-white">

                <tr>

                  <th className="border border-black px-3 py-2 text-center text-xs font-bold">
                    Product
                  </th>

                  <th className="border border-black px-3 py-2 text-center text-xs font-bold">
                    Category
                  </th>

                  <th className="border border-black px-3 py-2 text-center text-xs font-bold">
                    Quantity
                  </th>

                  <th className="border border-black px-3 py-2 text-center text-xs font-bold">
                    Unit Price
                  </th>

                  <th className="border border-black px-3 py-2 text-center text-xs font-bold">
                    Total
                  </th>

                </tr>

              </thead>


              <tbody>

                {

                  allProducts.map((product, index) => (

                    <tr
  key={index}
  className="hover:bg-blue-50 transition border border-black"
>

                      <td className="border border-black px-3 py-2 font-semibold text-center text-sm">

                        {product.product_name}

                      </td>

                      <td className="border border-black px-3 py-2 text-center text-sm">

                        {product.category}

                      </td>

                      <td className="border border-black px-3 py-2 text-center text-sm">

                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-semibold text-sm">

                          {product.quantity}

                        </span>

                      </td>

                      <td className="border border-black px-3 py-2 text-center font-semibold text-indigo-700">

                        ₹ {product.unit_price.toLocaleString()}

                      </td>

                      <td className="border border-black px-3 py-2 text-center font-bold text-emerald-700 text-sm">

                        ₹ {product.total.toLocaleString()}

                      </td>

                    </tr>

                  ))

                }

              </tbody>

            </table>

          </div>


          <div className="flex justify-end mt-8">

            <button

              onClick={onClose}

              className="bg-gradient-to-r from-indigo-700 to-blue-700 hover:from-indigo-800 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-300 text-white px-8 py-3 rounded-xl font-semibold"

            >

              Close

            </button>

          </div>

        </div>

      </div>

    </div>

  );

}