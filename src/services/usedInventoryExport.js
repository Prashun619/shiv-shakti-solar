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
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);

  doc.text(`Customer : ${item.customers?.customer_name || "-"}`, 14, 50);
  doc.text(`Project No : ${item.project_no || "-"}`, 110, 50);

  doc.text(`Location : ${item.location || "-"}`, 14, 58);
  doc.text(
  `Plant Size : ${item.plant_size || "-"} KW`,
  110,
  58
);

  const columns = [
    { title: "S.No", width: 15 },
    { title: "Product", width: 70 },
    { title: "Category", width: 40 },
    { title: "Qty", width: 25 },
    { title: "Unit", width: 25 },
    { title: "Unit Cost", width: 35 },
    { title: "Total", width: 40 },
  ];



const rows = (item.products || []).map((p, index) => {

  return [
    index + 1,
    p.product_name || "",
    p.category || "",
    p.quantity || 0,
    p.unit || "",
    Math.round(Number(p.unit_price || 0)),
    Math.round(Number(p.total || 0)),
  ];

});

  const endY = drawTable(
    doc,
    columns,
    rows,
    68
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);

  const materialCost =
  Number(item.material_cost || 0).toFixed(2);

const totalPlantCost =
  Number(item.total_plant_cost || 0).toFixed(2);


doc.setFont("helvetica", "bold");
doc.setFontSize(11);


doc.text(
  `Material Cost : Rs. ${materialCost}`,
  14,
  endY + 12
);


doc.text(
  `Total Plant Cost : Rs. ${totalPlantCost}`,
  14,
  endY + 20
);

  addFooter(doc);

  doc.save(
    `${item.customers?.customer_name || "Used_Inventory"}_Used_Inventory.pdf`
  );
}








/* ===========================
   EXCEL DOWNLOAD
=========================== */

export function downloadUsedInventoryExcel(item){



  const rows = [


    [
      "Customer Name",
      item.customers?.customer_name || "-"
    ],


    [
      "Location",
      item.location || "-"
    ],


    [
      "Plant Size",
      item.plant_size || "-"
    ],


    [],


    [
      "Product",
      "Category",
      "Quantity"
    ]



  ];






  item.products?.forEach((p)=>{


    rows.push([

      p.product_name,

      p.category,

      p.quantity,


    ]);


  });








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