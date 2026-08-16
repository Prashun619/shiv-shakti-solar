import { useEffect, useState } from "react";
import { getInventory } from "../services/inventoryService";
import {
  plantTemplates,
  manualCostItems,
} from "../utils/plantTemplates"; 

export default function PlantCosting() {

  const [selectedSize, setSelectedSize] = useState("");
  const [items, setItems] = useState([]);

  const materialTotal = items.reduce(
  (sum, row) =>
    sum +
    (
      Number(row.qty || 0) *
      Number(row.price || 0)
    ),
  0
);


const gstTotal = items.reduce((sum, row) => {

  const amount =
    Number(row.qty || 0) *
    Number(row.price || 0);


  const gstRate =
    Number(row.cgst || 0) +
    Number(row.sgst || 0);


  const gstAmount =
    amount * gstRate / 100;


  return sum + gstAmount;

}, 0);


const grandTotal =
  materialTotal + gstTotal;

const [inventory, setInventory] = useState([]);
const [panelOptions, setPanelOptions] = useState([]);
const [inverterOptions, setInverterOptions] = useState([]);

const [selectedPanel, setSelectedPanel] = useState(null);
const [selectedInverter, setSelectedInverter] = useState(null);
const [showChargesModal, setShowChargesModal] = useState(false);

const [selectedCharges, setSelectedCharges] = useState([]);
  const plantSizes = Object.keys(plantTemplates);

  

  useEffect(() => {
  loadInventory();
}, []);

useEffect(() => {
  if (selectedSize && inventory.length > 0) {
    loadTemplate(selectedSize);
  }
}, [selectedSize, inventory]);

async function loadInventory() {

  try {

    const data = await getInventory();
console.log(data);
    const inventoryData = data || [];

setInventory(inventoryData);

setPanelOptions(
  inventoryData.filter(
    item => item.product_name === "Panel"
  )
);

setInverterOptions(
  inventoryData.filter(
    item => item.product_name === "Inverter"
  )
);

  } catch (error) {

    console.log(error);

  }

}

  function loadTemplate(size) {

setSelectedPanel(null);
setSelectedInverter(null);

    const template = plantTemplates[size];

    if (!template) return;

   const rows = template.map((templateItem) => {


  let inventoryItem = null;


  // Normal items
  if (
    templateItem.item !== "Panel" &&
    templateItem.item !== "Inverter"
  ) {

    inventoryItem = inventory.find(
      (inv) =>
        inv.product_name === templateItem.item
    );

  }


  return {

    item: templateItem.item,

    qty: 0,
templateQty: templateItem.qty,

    price: Number(
      inventoryItem?.unit_cost || 0
    ),

    cgst: Number(
      inventoryItem?.cgst || 0
    ),

    sgst: Number(
      inventoryItem?.sgst || 0
    ),

    amount: 0,  

  };


});

    setItems(rows);
  }

  return (
    <div className="p-3">

      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-green-800 to-green-600 rounded-lg px-4 py-3 shadow border-2 border-black">

       <h1 className="text-2xl font-bold text-white">
          Plant Costing
        </h1>

        <p className="text-green-100 mt-2">
          Select Plant Size
        </p>

      </div>

      {/* Plant Size Buttons */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-4">

        {plantSizes.map((size) => (

          <button
            key={size}
            onClick={() => {

  setSelectedSize(size);

  setSelectedPanel(null);

  setSelectedInverter(null);

  setItems([]);

}}
            className={`rounded-lg py-3 text-base font-semibold border-2 border-black transition-all  
              ${
                selectedSize === size
                  ? "bg-green-700 text-white"
                  : "bg-white border-2 border-green-600 text-green-700 hover:bg-green-50"
              }`}
          >
            {size}
          </button>

        ))}

      </div>

      {/* Selected Plant */}
      {selectedSize && (

        <div className="mt-4 bg-white rounded-lg shadow border-2 border-black p-3">

          <h2 className="text-2xl font-bold text-green-700 mb-2">
            {selectedSize} Solar Plant
          </h2> 

          <div className="flex justify-end mb-2">

  <button
    onClick={() => setShowChargesModal(true)}
    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-sm rounded-lg font-semibold"
  >
    + Add Other Charges
  </button>

</div>

          <div className="overflow-x-auto rounded-lg border-2 border-black">

            <table className="w-full border-collapse text-xs" >

              <thead className="bg-slate-900 text-white">

<tr>

<th className="border-2 border-black px-1 py-1 w-8 text-center font-semibold">
#
</th>

<th className="border-2 border-black px-1 py-1 w-56 text-center font-semibold">
  Item
</th>



<th className="border-2 border-black px-1 py-1 w-10 text-center font-semibold">
  Qty
</th>

<th className="border-2 border-black px-1 py-1 w-32 text-center font-semibold">
  Price
</th>

<th className="border-2 border-black px-1 py-1 w-56 text-center font-semibold">
CGST %
</th>

<th className="border-2 border-black px-1 py-1 w-56 text-center font-semibold">
SGST %
</th>

<th className="border-2 border-black px-1 py-1 w-56  text-center font-semibold">  
Amount
</th>

</tr>

</thead>

              <tbody>
  {items.map((row, index) => (
    <tr
      key={index}
      className={index % 2 === 0 ? "bg-white" : "bg-green-50"}
    >
      {/* Sr No */}
      <td className="border-2 border-black px-1 py-1 text-black text-center">
        {index + 1}
      </td>

      {/* Item */}
      <td className="border-2 border-black px-1 py-1 text-red-700 font-bold text-center">

        {row.item === "Panel" ? (

          <div>
            <div className="font-medium font-bold mb-2">Panel</div>

            <select
  className="border border-black rounded px-1 py-1 text-red-700 font-bold text-sx w-full"
  value={selectedPanel?.id || ""}
              onChange={(e) => {
                const panel = panelOptions.find(
                  (p) => p.id === e.target.value
                );

                setSelectedPanel(panel);

                setItems((prev) =>
                  prev.map((item) =>
                    item.item === "Panel"
                      ? {
                          ...item,
                          price: Number(panel?.unit_cost || 0),
                          cgst: Number(panel?.cgst || 0),
                          sgst: Number(panel?.sgst || 0),
                          amount:
                            Number(panel?.unit_cost || 0) *
                            Number(item.qty),
                        }
                      : item
                  )
                );
              }}
            >
              <option value="">Select Panel</option>

              {panelOptions.map((panel) => (
                <option
                  key={panel.id}
                  value={panel.id}
                >
                  {panel.company} {panel.specification}
                </option>
              ))}
            </select>
          </div>

        ) : row.item === "Inverter" ? (

          <div>
            <div className="font-medium font-bold mb-2">Inverter</div>

            <select
              className="border border-black rounded px-1 py-1 text-red-700 font-bold text-xs w-full"
              value={selectedInverter?.id || ""}
              onChange={(e) => {
                const inverter = inverterOptions.find(
                  (i) => i.id === e.target.value
                );

                console.log("Selected inverter:", inverter);

                setSelectedInverter(inverter);

                setItems((prev) =>
                  
                  prev.map((item) =>
                    
                    item.item === "Inverter"
                  
                    ? {
                          ...item,
                          price: Number(inverter?.unit_cost || 0),
                          cgst: Number(inverter?.cgst || 0),
                          sgst: Number(inverter?.sgst || 0),
                          amount:
                            Number(inverter?.unit_cost || 0) *
                            Number(item.qty),
                  }
          
                  : item
                  )
                );
              }}
            >
              <option value="">Select Inverter</option>

              {inverterOptions.map((inv) => (
                <option
                  key={inv.id}
                  value={inv.id}
                >
                  {inv.company} {inv.specification}
                </option>
              ))}
            </select>
          </div>

        ) : (

          <div>
            <div>{row.item}</div>

            
          </div>

        )}

      </td>

     

     {/* Qty */}
<td className="border-2 border-black px-2 py-1 text-center">

  {manualCostItems.includes(row.item) ? (

    <span className="font-semibold text-gray-700">
      1
    </span>

  ) : (

    <input
  type="number"
  min="0"
  value={row.qty === 0 ? "" : row.qty}
  className="border border-black rounded w-16 px-1 py-1 text-center no-spinner"
  
  onChange={(e) => {

  const value = e.target.value;

  setItems(prev =>
    prev.map((item, i) => {

      if (i !== index) return item;

      const qty = value === "" ? 0 : Number(value);

      return {
        ...item,
        qty,
        amount: qty * Number(item.price || 0),
      };

    })
  );

}}

/>

  )}

</td>

      {/* Price */}
      <td className="border-2 border-black px-1 py-1 text-center">
        {[
          "Civil Material",
          "Transportation",
          "Installation Charges",
          "Vendor Charges",
          "Load Extension Charges",
          "Net Metering Charges",
          "JE Charges",
        ].includes(row.item) ? (
          <input
  type="number"
  
            value={row.price}
            className="border rounded-md w-20 px-1 py-1 text-center"
            onChange={(e) => {
              const price = Number(e.target.value);

              setItems((prev) =>
                prev.map((item, i) =>
                  i === index
                    ? {
                        ...item,
                        price,
                        amount: Number(item.qty) * price,
                      }
                    : item
                )
              );
            }}
          />
        ) : (
          <>₹ {Number(row.price).toLocaleString("en-IN")}</>
        )}
      </td>

      {/* CGST */}
      <td className="border-2 border-black px-1 py-1 text-center">
        {row.cgst || 0}%
      </td>

      {/* SGST */}
      <td className="border-2 border-black px-1 py-1 text-center">
        {row.sgst || 0}%
      </td>

      {/* Amount */}
      <td className="border-2 border-black px-1 py-1 text-center font-semibold text-green-700">
        ₹ {Number(row.amount).toLocaleString("en-IN")}
      </td>

    </tr>
  ))}
</tbody>

            </table>

          </div>

           <div className="mt-4 flex justify-end">

  <div className="w-72 border-2 border-black rounded-xl shadow-lg overflow-hidden"  >

    <div className="bg-slate-900 text-white text-center py-3 font-bold">
      Cost Summary
    </div>

    <div className="bg-white">

      <div className="grid grid-cols-2 border-t-2 border-black">

  <div className="border-r-2 border-black px-3 py-2 font-medium">
    Material Total
  </div>

  <div className="px-3 py-2 text-right font-semibold">
    ₹ {materialTotal.toLocaleString("en-IN")}
  </div>

</div>

      <div className="grid grid-cols-2 border-t-2 border-black">

  <div className="border-r-2 border-black px-3 py-2 font-medium">
    Total GST
  </div>

  <div className="px-3 py-2 text-right font-semibold">
    ₹ {gstTotal.toLocaleString("en-IN")}
  </div>

</div>  

<div className="grid grid-cols-2 border-t-2 border-black bg-green-100">

  <div className="border-r-2 border-black px-3 py-3 text-lg font-bold">
    Grand Total
  </div>

  <div className="px-3 py-3 text-right text-lg font-bold text-green-700">
    ₹ {grandTotal.toLocaleString("en-IN")}
  </div>

</div>

    </div>

  </div>

</div>

        </div>

      )}

{/* Other Charges Modal */}

{showChargesModal && (

<div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">

  <div className="bg-white rounded-xl shadow-2xl border-2 border-black w-[700px] max-h-[80vh] overflow-hidden">

    {/* Header */}
    <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">

      <h2 className="text-xl font-bold">
        Add Other Charges
      </h2>

      <button
        onClick={() => {
          setSelectedCharges([]);
          setShowChargesModal(false);
        }}
        className="text-2xl hover:text-red-400"
      >
        ✕
      </button>

    </div>

    {/* Search + Select All */}
    <div className="p-5 border-b">

      <div className="flex gap-4">

        <input
          type="text"
          placeholder="🔍 Search charges..."
          className="flex-1 border border-gray-400 rounded-lg px-3 py-2"
          onChange={(e)=>{

            const keyword=e.target.value.toLowerCase();

            document.querySelectorAll(".charge-item").forEach(card=>{

              card.style.display=
                card.dataset.name.includes(keyword)
                ? "flex"
                : "none";

            });

          }}
        />

        <button

          className="bg-green-600 text-white px-4 rounded-lg"

          onClick={()=>{
            setSelectedCharges([...manualCostItems]);
          }}

        >
          Select All
        </button>

      </div>

    </div>

    {/* Charges */}

    <div className="grid grid-cols-2 gap-3 p-5 max-h-[380px] overflow-y-auto">

      {manualCostItems.map((charge)=>(

        <label

          key={charge}

          data-name={charge.toLowerCase()}

          className="charge-item border rounded-lg p-3 hover:bg-green-50 cursor-pointer flex items-center gap-3"

        >

          <input

            type="checkbox"

            checked={selectedCharges.includes(charge)}

            onChange={(e)=>{

              if(e.target.checked){

                setSelectedCharges(prev=>[
                  ...prev,
                  charge
                ]);

              }else{

                setSelectedCharges(prev=>
                  prev.filter(item=>item!==charge)
                );

              }

            }}

          />

          <div className="text-2xl">

            💰

          </div>

          <div className="font-medium">

            {charge}

          </div>

        </label>

      ))}

    </div>

    {/* Footer */}

    <div className="border-t p-4 flex justify-end gap-3">

      <button

        className="px-5 py-2 border rounded-lg"

        onClick={()=>{
          setSelectedCharges([]);
          setShowChargesModal(false);
        }}

      >
        Cancel
      </button>

      <button

        className="bg-green-700 hover:bg-green-800 text-white px-6 py-2 rounded-lg"

        onClick={() => {

          const newCharges = selectedCharges
            .filter(
              charge =>
                !items.some(item => item.item === charge)
            )
            .map(charge => ({

              item: charge,
              qty: 1,
              price: 0,
              cgst: 0,
              sgst: 0,
              amount: 0,

            }));

          setItems(prev => [...prev, ...newCharges]);

          setSelectedCharges([]);

          setShowChargesModal(false);

        }}

      >
        Add Selected
      </button>

    </div>

  </div>

</div>

)}

</div>
  );
}