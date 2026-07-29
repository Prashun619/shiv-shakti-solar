import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  getInventory,
  getInventoryByProduct
} from "../services/inventoryService";

export default function PlantCosting() {
const navigate = useNavigate();
const { size } = useParams();
const [panelOptions, setPanelOptions] = useState([]);
const [inverterOptions, setInverterOptions] = useState([]);
const [inventoryItems, setInventoryItems] = useState([]);
const [selectedPanel, setSelectedPanel] = useState(null);
const [selectedInverter, setSelectedInverter] = useState(null);
const [items,setItems] = useState([]);
const [selectedBatches, setSelectedBatches] = useState({});
  const [showPlantSize, setShowPlantSize] = useState(false);
const [selectedSize, setSelectedSize] = useState("");
const [showSizeButtons, setShowSizeButtons] = useState(false);
const plantTemplates = {

  "3KW": [

    { item:"Panel", qty:6 },
    { item:"Inverter", qty:1 },

    { item:"Rafter", qty:6 },
    { item:"Perlin", qty:6 },

    { item:"Leg 6ft", qty:6 },
    { item:"Leg 8ft", qty:0 },
    { item:"Leg 10ft", qty:0 },

    { item:"Base Plate", qty:6 },
    { item:"Fastener", qty:20 },
    { item:"Nut Bolts", qty:20 },

    { item:"Spring Bolt", qty:20 },
    { item:"Spring", qty:20 },

    { item:"ACDB", qty:1 },
    { item:"DCDB", qty:1 },

    { item:"DC Wire", qty:30 },
    { item:"AC Wire", qty:20 },
    { item:"LA Wire", qty:10 },
    { item:"Armoured Wire", qty:20 },

    { item:"L Clamp", qty:10 },
    { item:"U Clamp", qty:10 },

    { item:"MC4 Connector", qty:4 },

    { item:"PVC Pipe", qty:20 },

    { item:"L Bend", qty:4 },
    { item:"U Bend", qty:4 },
    { item:"T Bend", qty:2 },

    { item:"Catchup 25mm", qty:10 },
    { item:"Catchup 12mm", qty:10 },

    { item:"Earthing Kit", qty:1 },

    { item:"Civil Material", qty:1 },

    { item:"Transportation", qty:1 },

    { item:"Installation Charges", qty:1 },

    { item:"Vendor Charges", qty:1 },
{ item:"Load Extension Charges", qty:1 },
{ item:"Net Metering Charges", qty:1 },
{ item:"JE Charges", qty:1 }

  ],




  "5KW":[

    { item:"Panel", qty:10 },
    { item:"Inverter", qty:1 },

    { item:"Rafter", qty:10 },
    { item:"Perlin", qty:10 },

    { item:"Leg 6ft", qty:10 },
    { item:"Leg 8ft", qty:0 },
    { item:"Leg 10ft", qty:0 },

    { item:"Base Plate", qty:10 },
    { item:"Fastener", qty:30 },
    { item:"Nut Bolts", qty:30 },

    { item:"Spring Bolt", qty:30 },
    { item:"Spring", qty:30 },

    { item:"ACDB", qty:1 },
    { item:"DCDB", qty:1 },

    { item:"DC Wire", qty:40 },
    { item:"AC Wire", qty:25 },
    { item:"LA Wire", qty:15 },
    { item:"Armoured Wire", qty:30 },

    { item:"L Clamp", qty:15 },
    { item:"U Clamp", qty:15 },

    { item:"MC4 Connector", qty:6 },

    { item:"PVC Pipe", qty:30 },

    { item:"L Bend", qty:6 },
    { item:"U Bend", qty:6 },
    { item:"T Bend", qty:3 },

    { item:"Catchup 25mm", qty:15 },
    { item:"Catchup 12mm", qty:15 },

    { item:"Earthing Kit", qty:1 },

    { item:"Civil Material", qty:1 },

    { item:"Transportation", qty:1 },

    { item:"Installation Charges", qty:1 },

    { item:"Vendor Charges", qty:1 },
{ item:"Load Extension Charges", qty:1 },
{ item:"Net Metering Charges", qty:1 },
{ item:"JE Charges", qty:1 }

  ]

};

const manualCostItems = [
  "Civil Material",
  "Transportation",
  "Installation Charges",
  "Vendor Charges",
  "Load Extension Charges",
  "Net Metering Charges",
  "JE Charges"
];

  useEffect(()=>{

    loadProducts();

  },[]);

  useEffect(() => {

  if (!size) return;

  const selected =
    size.toUpperCase().replace("KW", "") + "KW";

  if (plantTemplates[selected]) {
    loadPlantTemplate(selected);
  }

}, [size]);

useEffect(() => {

  if (
    selectedSize &&
    inventoryItems.length > 0
  ) {
    generatePlantItems();
  }

}, [selectedSize, inventoryItems]);

function getInventoryBatches(itemName){

  const key =
    itemName.trim().toLowerCase();

  return inventoryItems.filter(inv =>
    inv.product_name?.trim().toLowerCase() === key
  );

}


function generatePlantItems(){

  if(!selectedSize)
    return;

  const inventoryMap = {};

  console.log("===== INVENTORY ITEMS =====");
  console.log(inventoryItems);

  inventoryItems.forEach(inv => {

    const key =
      inv.product_name?.trim().toLowerCase();

    if (!inventoryMap[key]) {
      inventoryMap[key] = [];
    }

    inventoryMap[key].push(inv);

  });
}
function generatePlantItems() {

  console.log("generatePlantItems called");

  if (!selectedSize)
    return;

  const inventoryMap = {};

console.log("===== INVENTORY ITEMS =====");
console.log(inventoryItems);

inventoryItems.forEach(inv => {

  const key =
    inv.product_name?.trim().toLowerCase();

  if (!inventoryMap[key]) {
    inventoryMap[key] = [];
  }

  inventoryMap[key].push(inv);

});

console.log("===== INVENTORY MAP =====");
console.log(inventoryMap);

 const updated =
  plantTemplates[selectedSize].map((item) => {

    const isManual = manualCostItems.includes(item.item);

    const templateName = item.item.trim().toLowerCase();

console.log(
  "Searching:",
  templateName,
  inventoryMap[templateName]
);

const inventoryList =
  inventoryMap[templateName] || [];

let inventoryItem =
  inventoryList.find(
    inv =>
      inv.id === selectedBatches[item.item]
  )
  ||
  inventoryList[0];

if (!inventoryItem) {

  inventoryItem = Object.values(inventoryMap)
  .flat()
  .find(inv => {

    const inventoryName =
      inv.product_name?.trim().toLowerCase() || "";

    return inventoryName === templateName;

  });

}


    if(item.item==="Panel" && selectedPanel){

  console.log("SELECTED PANEL DATA:", selectedPanel);



  return {
  ...item,
  qty: items.find(i => i.item === item.item)?.qty ?? 0,

    company: selectedPanel.company,

    specification: selectedPanel.specification,

    price:Number(
  selectedPanel.unit_cost ??
  selectedPanel.price ??
  0
),

    cgst: Number(selectedPanel.cgst || 0),

    sgst: Number(selectedPanel.sgst || 0)

  };

}



    if(item.item === "Inverter" && selectedInverter){

  return {
    ...item,
    qty: items.find(i => i.item === item.item)?.qty ?? 0,

    company: selectedInverter.company,
    specification: selectedInverter.specification,

    price: Number(
      selectedInverter.unit_cost ??
      selectedInverter.price ??
      0
    ),

    cgst: Number(selectedInverter.cgst || 0),
    sgst: Number(selectedInverter.sgst || 0)

  };

}

if (inventoryItem) {

  if (!inventoryItem) {

    console.log(
  "MATCH:",
  item.item,
  inventoryItem.product_name,
  inventoryItem.unit_cost
);

  console.log("No Match:", item.item);
}

  console.log({
  item: item.item,
  product: inventoryItem.product_name,
  unit_cost: inventoryItem.unit_cost,
  cgst: inventoryItem.cgst,
  sgst: inventoryItem.sgst
});

  return {
  ...item,
  qty: items.find(i => i.item === item.item)?.qty ?? 0,

    company: inventoryItem.company,

    specification: inventoryItem.specification,

    price: inventoryItem.unit_cost,

    cgst: inventoryItem.cgst,

    sgst: inventoryItem.sgst

  };

}

    return {
  ...item,
  qty: items.find(i => i.item === item.item)?.qty ?? 0,
  price: 0,
  cgst: 0,
  sgst: 0,
  company: "",
  specification: ""
};


  });


  setItems(updated);

}

  async function loadProducts() {
  try {

    const panels = await getInventoryByProduct("Panel");
    const inverters = await getInventoryByProduct("Inverter");
    const allInventory = await getInventory();

    console.log(
  allInventory.map(item => item.product_name)
);

    setPanelOptions(panels || []);
    setInverterOptions(inverters || []);
    setInventoryItems(allInventory || []);

  } catch (error) {
    console.log(error);
  }
}



function findInventoryItem(itemName) {

  return inventoryItems.find(
    item =>
      item.product_name?.trim().toLowerCase() ===
      itemName.trim().toLowerCase()
  );

}

function loadPlantTemplate(size) {

  const template = plantTemplates[size];


  const formattedItems = template.map((item)=>{

    const isManual = manualCostItems.includes(item.item);


    return {

      item: item.item,

     qty: 0,

      price: 0,

      cgst: isManual ? 0 : "",

      sgst: isManual ? 0 : "",

      amount: 0,

      manual: isManual

    };

  });


  setItems(formattedItems);

setSelectedSize(size);

setShowSizeButtons(false);

setTimeout(() => {
  generatePlantItems();
}, 0);

}

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = src;

    img.onload = () => resolve(img);

    img.onerror = () => resolve(null);
  });
}

async function downloadPDF() {

  const doc = new jsPDF();
  
  const logo = await loadImage("/logo.png");
  const signature = await loadImage("/signature.png");

const pageWidth = doc.internal.pageSize.getWidth();

if (logo) {
  doc.addImage(
    logo,
    "PNG",
    14,
    10,
    22,
    22
  );
}

// Green Header Background
doc.setFillColor(22, 163, 74);
doc.rect(10, 10, pageWidth - 20, 30, "F");

// Logo
if (logo) {
  doc.addImage(logo, "PNG", 14, 13, 20, 20);
}

// Company Name
doc.setTextColor(255, 255, 255);
doc.setFont("helvetica", "bold");
doc.setFontSize(20);

doc.text(
  "SHIV SHAKTI SOLAR ENERGY",
  pageWidth / 2,
  20,
  { align: "center" }
);

// Address
doc.setFont("helvetica", "normal");
doc.setFontSize(10);

doc.text(
  "Nowgong, Dist. Chhatarpur (M.P.)",
  pageWidth / 2,
  27,
  { align: "center" }
);

// Report Name
doc.setFont("helvetica", "bold");
doc.setFontSize(14);

doc.text(
  "PLANT COSTING REPORT",
  pageWidth / 2,
  35,
  { align: "center" }
);

doc.setTextColor(0, 0, 0);
doc.setFontSize(11);

doc.text(`Plant Size : ${selectedSize}`,14,50);

doc.text(
`Date : ${new Date().toLocaleDateString("en-GB")}`,
pageWidth-14,
54,
  { align: "right" }
);

  const tableData = items.map((item) => [

    item.item,

    item.qty,

    item.price,

    item.cgst,

    item.sgst,

    item.qty * item.price

  ]);

  
  autoTable.default(doc, {

 startY:58,

  head: [[
  "S.No.",
  "Item",
  "Qty",
  "Price",
  "CGST %",
  "SGST %",
  "Amount"
]],

body: [

  ...items.map((item, index) => [

    index + 1,

    item.item,

    `${item.qty} Nos`,

    `${Number(item.price || 0).toLocaleString("en-IN")}`,

    item.manual ? "-" : `${item.cgst}%`,

    item.manual ? "-" : `${item.sgst}%`,

    `${(
      Number(item.qty || 0) * Number(item.price || 0)
    ).toLocaleString("en-IN")}`

  ]),

  [
    "",
    "",
    "",
    "",
    "",
    "Total",
    `${materialTotal.toLocaleString("en-IN")}`
  ]

],
  theme: "grid",

  styles: {
  fontSize: 9,
  cellPadding: 2.5,
  lineColor: [180, 180, 180],
  lineWidth: 0.2,
  valign: "middle",
  halign: "center",
  textColor: [40, 40, 40]
},

  headStyles: {
  fillColor: [22, 163, 74],
  textColor: [255, 255, 255],
  fontStyle: "bold",
  fontSize: 10,
  halign: "center",
  valign: "middle"
},

  alternateRowStyles: {
  fillColor: [245, 252, 245]
},

  bodyStyles: {

    textColor: [0, 0, 0]

  },

  columnStyles: {

  0: {
    cellWidth: 18,
    halign: "center"
  },

  1: {
    cellWidth: 45,
    halign: "center"
  },

  2: {
    cellWidth: 18,
    halign: "center"
  },

  3: {
    cellWidth: 28,
    halign: "center"
  },

  4: {
    cellWidth: 20,
    halign: "center"
  },

  5: {
    cellWidth: 20,
    halign: "center"
  },

  6: {
    cellWidth: 30,
    halign: "center"
  }

},

didParseCell: function (data) {

  // Amount column
  if (
    data.section === "body" &&
    data.column.index === 6
  ) {
    data.cell.styles.fontStyle = "bold";
    data.cell.styles.textColor = [22, 120, 60];
  }

  // Total row
  if (
    data.section === "body" &&
    data.row.index === items.length
  ) {

    data.cell.styles.fillColor = [22, 163, 74];
    data.cell.styles.textColor = [255, 255, 255];
    data.cell.styles.fontStyle = "bold";

  }

},
  
});



  const finalY = doc.lastAutoTable.finalY + 12;

const signY = Math.min(finalY + 45, 250);

const boxX = 118;
const boxY = finalY;
const boxWidth = 82;
const rowHeight = 10;

// Outer Border
doc.setDrawColor(22, 163, 74);
doc.setLineWidth(0.8);
doc.roundedRect(
  boxX,
  boxY,
  boxWidth,
  34,
  2,
  2
);

// Header
doc.setFillColor(22, 163, 74);
doc.roundedRect(
  boxX,
  boxY,
  boxWidth,
  8,
  2,
  2,
  "F"
);

doc.setFont("helvetica", "bold");
doc.setFontSize(12);
doc.setTextColor(255,255,255);

doc.text(
  "COST SUMMARY",
  boxX + boxWidth/2,
  boxY + 5.5,
  {
    align:"center"
  }
);

// Body
doc.setTextColor(0,0,0);
doc.setFontSize(10);
doc.setFont("helvetica","normal");

// Material
doc.text(
  "Material Cost",
  boxX + 4,
  boxY + 14
);

doc.text(
  `${materialTotal.toLocaleString("en-IN")}`,
  boxX + boxWidth - 4,
  boxY + 14,
  {
    align:"right"
  }
);

// GST
doc.text(
  "GST",
  boxX + 4,
  boxY + 21
);

doc.text(
  `${gstTotal.toLocaleString("en-IN")}`,
  boxX + boxWidth - 4,
  boxY + 21,
  {
    align:"right"
  }
);

// Divider
doc.setDrawColor(180);
doc.line(
  boxX + 2,
  boxY + 24,
  boxX + boxWidth - 2,
  boxY + 24
);

// Grand Total
doc.setFont("helvetica","bold");
doc.setFontSize(11);

doc.text(
  "Grand Total",
  boxX + 4,
  boxY + 31
);

doc.setTextColor(22,163,74);

doc.text(
  `${grandTotal.toLocaleString("en-IN")}`,
  boxX + boxWidth - 4,
  boxY + 31,
  {
    align:"right"
  }
);


// Divider line
doc.setDrawColor(180);
doc.line(10, signY - 5, pageWidth - 10, signY - 5);



// Prepared By
doc.setFont("helvetica", "bold");
doc.setFontSize(11);
doc.setTextColor(0);

doc.text(
  "Prepared By",
  18,
  signY
);

doc.setFont("helvetica", "normal");
doc.setFontSize(10);

doc.text(
  "Shiv Shakti Solar Energy",
  18,
  signY + 7
);

// Authorized Signatory
doc.setFont("helvetica", "bold");

doc.text(
  "Authorized Signatory",
  pageWidth - 18,
signY + 25,
  {
    align: "right"
  }
);

if (signature) {
  doc.addImage(
    signature,
    "PNG",
   pageWidth - 48,
signY + 5,
30,
15
  );
}

const pages = doc.internal.getNumberOfPages();

const generatedOn = new Date().toLocaleString("en-IN");

for (let i = 1; i <= pages; i++) {

  doc.setPage(i);

  // Green line
  doc.setDrawColor(22, 163, 74);
  doc.setLineWidth(0.5);

  doc.line(
    10,
    285,
    pageWidth - 10,
    285
  );

  // Company
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(22, 163, 74);

  doc.text(
    "Shiv Shakti Solar Energy",
    12,
    290
  );

  // Generated Time
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80);

  doc.text(
    `Generated: ${generatedOn}`,
    pageWidth / 2,
    290,
    {
      align: "center"
    }
  );

  // Page Number
  doc.text(
    `Page ${i} of ${pages}`,
    pageWidth - 12,
    290,
    {
      align: "right"
    }
  );

}
doc.save(`${selectedSize}-Plant-Costing.pdf`);

}
  
const materialTotal = items.reduce((sum, item) => {

  const amount =
    Number(item.qty || 0) * Number(item.price || 0);

  return sum + amount;

}, 0);

const gstTotal = items.reduce((sum, item) => {
  const amount =
    Number(item.qty || 0) * Number(item.price || 0);


  return (
    sum +
    amount * (Number(item.cgst || 0) / 100) +
    amount * (Number(item.sgst || 0) / 100)
  );
}, 0);

const grandTotal = materialTotal + gstTotal;

  return (

    <div className="p-6">


      {/* HEADER */}

      <div className="bg-gradient-to-r from-green-700 to-green-500 rounded-2xl p-6 shadow-lg">


        <h1 className="text-3xl font-bold text-white">

          Plant Costing

        </h1>


        <p className="text-green-100 mt-2">

          Calculate solar plant cost

        </p>


      </div>

{!size && (
  <div

  className="bg-white rounded-xl shadow-lg mt-6 p-6"
>

    <button
      onClick={() => setShowSizeButtons(true)}
      className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold"
    >
      Calculate
    </button>

    {showSizeButtons && (
      <div className="flex gap-4 mt-5">

        <button
          onClick={() => navigate("/plant-costing/3kw")}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg"
        >
          3KW
        </button>

        <button
          onClick={() => navigate("/plant-costing/5kw")}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg"
        >
          5KW
        </button>

      </div>
    )}

  </div>
)}

      {/* SELECTION BOX */}


      <div className="bg-white rounded-xl shadow-lg mt-6 p-6">



{
items.length > 0 && (

<div className="mt-2">


<div className="flex justify-between items-center mb-6">

  <button
    onClick={() => navigate(-1)}
    className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg"
  >
    ← Back
  </button>

  <h2 className="text-2xl font-bold text-green-700">
    ⚡ {selectedSize} Solar Plant Costing
  </h2>

</div>

<button
  onClick={downloadPDF}
  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold"
>
  📄 Download PDF
</button>

<div className="overflow-x-auto rounded-xl border border-gray-300 shadow">

<table className="w-full text-sm border-collapse">


<thead className="bg-gradient-to-r from-green-700 to-green-500 text-white">

<tr>

<th className="border border-gray-300 px-2 py-2 w-12 text-center">
#
</th>

<th className="w-40 border border-gray-300 px-2 py-2 text-center">
Item
</th>

<th className="border border-gray-300 px-2 py-2 w-20 text-center">
Qty
</th>

<th className="border border-gray-300 px-2 py-2 w-28 text-center">
Price
</th>

<th className="border border-gray-300 px-2 py-2 w-20 text-center">
CGST
</th>

<th className="border border-gray-300 px-2 py-2 w-20 text-center">
SGST
</th>

<th className="border border-gray-300 px-2 py-2 w-32 text-center">
Amount
</th>

</tr>

</thead>



<tbody>

{
items.map((item,index)=>(

console.log("ITEM NAME:", item.item),

<tr
  key={index}
  className={`${
    index % 2 === 0 ? "bg-white" : "bg-green-50"
  } hover:bg-green-100 transition-colors`}
>


<td className="border border-gray-300 px-2 py-2 text-center align-middle" >

{index+1}

</td>


<td className="border border-gray-300 px-2 py-2 text-center align-middle">

<div className="font-medium text-sm mb-2">
  {item.item}
</div>

{item.item === "Panel" ? (

  <select
    className="border rounded-md p-1 w-full text-sm"
    value={selectedPanel?.id || ""}
    onChange={(e) => {

const panel = panelOptions.find(
  p => p.id === e.target.value
);

setSelectedPanel(panel);


// Update only Panel price
setItems(prev =>
  prev.map(item =>
    item.item === "Panel"
      ? {
          ...item,
          price: Number(panel?.unit_cost || 0),
          cgst: Number(panel?.cgst || 0),
          sgst: Number(panel?.sgst || 0),
          company: panel?.company || "",
          specification: panel?.specification || ""
        }
      : item
  )
);

}}
  >
    <option value="">Select Panel</option>

    {panelOptions.map(panel => (
      <option key={panel.id} value={panel.id}>
        {panel.company} {panel.specification}
      </option>
    ))}

  </select>

) : item.item === "Inverter" ? (

  <select
    className="border rounded-md p-1 w-full text-sm"
    value={selectedInverter?.id || ""}
    onChange={(e) => {

const inverter = inverterOptions.find(
  i => i.id === e.target.value
);

setSelectedInverter(inverter);


// Update only Inverter price after selection
setItems(prev =>
  prev.map(item =>
    item.item === "Inverter"
      ? {
          ...item,
          price: Number(inverter?.unit_cost || 0),
          cgst: Number(inverter?.cgst || 0),
          sgst: Number(inverter?.sgst || 0),
          company: inverter?.company || "",
          specification: inverter?.specification || ""
        }
      : item
  )
);

}}
  >
    <option value="">Select Inverter</option>

    {inverterOptions.map(inv => (
      <option key={inv.id} value={inv.id}>
        {inv.company} {inv.specification}
      </option>
    ))}

  </select>

) : (

<>

{
(item.company || item.specification) && (
  <div className="text-xs text-gray-500 mt-1 leading-4">
    {item.company}
    <br />
    {item.specification}
  </div>
)
}


{
getInventoryBatches(item.item).length > 1 && (

<select
className="border rounded-md p-1 w-full text-xs mt-2"

value={
selectedBatches[item.item] || ""
}

onChange={(e)=>{

const batch =
getInventoryBatches(item.item)
.find(
b=>b.id === e.target.value
);


setSelectedBatches(prev=>({

...prev,

[item.item]: batch.id

}));


setItems(prev=>

prev.map(row=>

row.item === item.item

?

{

...row,

price:Number(batch.unit_cost || 0),

cgst:Number(batch.cgst || 0),

sgst:Number(batch.sgst || 0),

company:batch.company || "",

specification:batch.specification || ""

}

:

row

)

);

}}

>

<option value="">
Select Purchase
</option>


{
getInventoryBatches(item.item).map(batch=>(

<option
key={batch.id}
value={batch.id}
>

₹ {Number(batch.unit_cost).toLocaleString("en-IN")}

</option>

))

}

</select>

)

}

</>

)}

</td>




<td className="border border-gray-300 px-2 py-1 text-center align-middle">

<input

type="number"

value={item.qty ?? ""}

onChange={(e)=>{

const updated=[...items];

updated[index].qty =
e.target.value === ""
? ""
: Number(e.target.value);

setItems(updated);

}}

className="border rounded-md px-2 py-1 w-16 text-center mx-auto"

/>

</td>



<td className="border border-gray-300 px-2 py-2 text-center align-middle">

{
manualCostItems.includes(item.item)

?

<input

type="number"

value={item.price ?? ""}

onChange={(e)=>{

const updated=[...items];

updated[index].price =
Number(e.target.value);

setItems(updated);

}}

className="border rounded-md px-2 py-1 w-24 text-center mx-auto"

/>

:

<span>
₹ {Number(item.price || 0).toLocaleString()}
</span>

}

</td>





<td className="border border-gray-300 px-2 py-1 text-center">

{
item.manual
?
0
:
item.cgst || 0
}

</td>


<td className="border border-gray-300 px-2 py-1 text-center">

{
item.manual
?
0
:
item.sgst || 0
}

</td>
<td className="border border-gray-300 px-2 py-1 text-center font-bold text-green-700 bg-green-50">

₹ {(
Number(item.qty || 0) *
Number(item.price || 0)
).toLocaleString()}

</td>


</tr>


))

}


</tbody>

</table>

</div>

<div className="mt-8 flex justify-end">

  <div className="w-96 rounded-xl border border-green-300 shadow-lg overflow-hidden">

    <div className="bg-green-600 text-white font-bold text-center py-3">
      Cost Summary
    </div>

    <div className="p-5 bg-white">

      <div className="flex justify-between py-2">
        <span>Material Cost</span>
        <span className="font-semibold">
          ₹ {materialTotal.toLocaleString()}
        </span>
      </div>

      <div className="flex justify-between py-2">
        <span>Total GST</span>
        <span className="font-semibold">
          ₹ {gstTotal.toLocaleString()}
        </span>
      </div>

      <hr className="my-3" />

      <div className="flex justify-between text-xl font-bold text-green-700">
        <span>Grand Total</span>
        <span>
          ₹ {grandTotal.toLocaleString()}
        </span>
      </div>

    </div>

  </div>

</div>

</div>

)
}

      
      </div>



    </div>

  );

}