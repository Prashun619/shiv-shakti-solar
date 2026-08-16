import {
  createReportPDF,
  drawTable,
  addFooter,
} from "./reports/pdfTable";

import * as XLSX from "xlsx";


/* ===========================
   PDF DOWNLOAD
=========================== */

export function downloadUsedInventoryPDF(item) {

  const doc = createReportPDF("Used Inventory Report");


  // Customer Details

// Customer Details

doc.setFont("helvetica", "bold");
doc.setFontSize(12);

doc.text(
  `Customer : ${item.customers?.customer_name || "-"}`,
  14,
  52
);

doc.text(
  `Project No : ${item.project_no || "-"}`,
  14,
  60
);

doc.text(
  `Location : ${item.location || "-"}`,
  14,
  68
);

doc.text(
  `Plant Size : ${item.plant_size || "-"} KW`,
  14,
  76
);


  const columns = [

    { title: "S.No", width: 15 },

    { title: "Product", width: 55 },

    { title: "Category", width: 40 },

    { title: "Qty", width: 20 },

    { title: "Unit Cost", width: 35 },

    { title: "Total", width: 35 },

  ];



  let productCost = 0;


  const rows = [];


  // Products

  (item.products || []).forEach((p,index)=>{


    const qty =
      Number(p.quantity || 0);


    const unitCost =
      Number(
        p.unit_cost ||
        p.unit_price ||
        p.price ||
        0
      );


    const total =
      qty * unitCost;


    productCost += total;


    rows.push([

      index + 1,

      p.product_name || "",

      p.category || "",

      qty,

      unitCost.toFixed(2),

      total.toFixed(2)

    ]);


  });



  // Additional Charges

  const charges = [

    ["Civil Material", item.civil_material],

    ["Installation Charges", item.installation_charges],

    ["Vendor Charges", item.vendor_charges],

    ["JE Charges", item.je_charges],

    ["Load Extension Charges", item.load_extension_charges],

    ["Net Metering Charges", item.net_metering_charges],

  ];



  let additionalCharges = 0;


  charges.forEach(([name,value])=>{


    const amount =
      Number(value || 0);


    if(amount > 0){


      additionalCharges += amount;


      rows.push([

  rows.length + 1,

  name,

  "Additional Charges",

  1,

  amount.toFixed(2),

  amount.toFixed(2)

]);

    }


  });

console.log(rows);

  const endY = drawTable(
  doc,
  columns,
  rows,
  88
);



  const grandTotal =
    productCost + additionalCharges;

const summaryX = 170;
const summaryY = endY + 12;

const labelWidth = 45;
const amountWidth = 35;
const rowHeight = 9;


const summaryRows = [
  [
    "Product Cost",
    productCost.toFixed(2)
  ],
  [
    "Additional Charges",
    additionalCharges.toFixed(2)
  ],
  [
    "Total",
    grandTotal.toFixed(2)
  ],
];


summaryRows.forEach((row, index) => {

  const y = summaryY + index * rowHeight;


  // Total row background
  if(index === 2){

    doc.setFillColor(14,116,144);

    doc.rect(
      summaryX,
      y,
      labelWidth + amountWidth,
      rowHeight,
      "F"
    );

    doc.setTextColor(255,255,255);

  }
  else {

    doc.setTextColor(0,0,0);

  }


  // Borders

  doc.setDrawColor(0,0,0);
  doc.setLineWidth(0.2);


  doc.rect(
    summaryX,
    y,
    labelWidth,
    rowHeight
  );


  doc.rect(
    summaryX + labelWidth,
    y,
    amountWidth,
    rowHeight
  );


  // Text style

  doc.setFont(
    "helvetica",
    index === 2 ? "bold" : "normal"
  );

  doc.setFontSize(10);



  // Label

  doc.text(
    row[0],
    summaryX + 3,
    y + 6
  );


  // Amount

  doc.text(
    row[1],
    summaryX + labelWidth + amountWidth - 3,
    y + 6,
    {
      align:"right"
    }
  );

});

  addFooter(doc);



  doc.save(

    `${item.customers?.customer_name || "Used_Inventory"}_Used_Inventory.pdf`

  );

}







/* ===========================
   EXCEL DOWNLOAD
=========================== */

export function downloadUsedInventoryExcel(item) {

  const productCost =
  item.products?.reduce(
    (sum, p) =>
      sum +
      Number(p.quantity || 0) *
      Number(
        p.unit_cost ||
        p.unit_price ||
        p.price ||
        0
      ),
    0
  ) || 0;


  let additionalCharges =
    Number(item.civil_material || 0) +
    Number(item.installation_charges || 0) +
    Number(item.vendor_charges || 0) +
    Number(item.je_charges || 0) +
    Number(item.load_extension_charges || 0) +
    Number(item.net_metering_charges || 0);


  const total =
    productCost + additionalCharges;



  const rows = [

  [
    "Customer Name",
    "Location",
    "Plant Size"
  ],

  [
    item.customers?.customer_name || "-",
    item.location || "-",
    item.plant_size || "-"
  ],

  [],

  [
    "Product",
    "Category",
    "Quantity",
    "Unit Cost",
    "Total"
  ]

];


  // Products

  item.products?.forEach((p)=>{

   const unitCost =
      Number(
        p.unit_cost ||
        p.unit_price ||
        p.price ||
        0
      );


    const qty =
      Number(p.quantity || 0);


    rows.push([

  rows.length + 1,

  name,

  "Additional Charges",

  1,

  amount.toFixed(2),

  amount.toFixed(2)

]);

  });



  // Additional Charges

  const charges = [

    ["Civil Material", item.civil_material],

    ["Installation Charges", item.installation_charges],

    ["Vendor Charges", item.vendor_charges],

    ["JE Charges", item.je_charges],

    ["Load Extension Charges", item.load_extension_charges],

    ["Net Metering Charges", item.net_metering_charges],

  ];



 charges.forEach(([name,value])=>{

  const amount = Number(value || 0);

  if(amount > 0){

    additionalCharges += amount;

    rows.push([

      rows.length + 1,   // S.No

      name,

      "Additional Charges",

      1,

      amount.toFixed(2),

      amount.toFixed(2)

    ]);

  }

});



  rows.push([]);


  rows.push([

    "Product Cost",

    "",

    "",

    "",

    productCost.toFixed(2)

  ]);


  rows.push([

    "Additional Charges",

    "",

    "",

    "",

    additionalCharges.toFixed(2)

  ]);


  rows.push([

    "total.toFixed(2)",

    "",

    "",

    "",

    total

  ]);




  const worksheet =
    XLSX.utils.aoa_to_sheet(rows);



  const workbook =
    XLSX.utils.book_new();



  XLSX.utils.book_append_sheet(

    workbook,

    worksheet,

    "Used Inventory"

  );



  XLSX.writeFile(

    workbook,

    `${item.customers?.customer_name}_Used_Inventory.xlsx`

  );

}