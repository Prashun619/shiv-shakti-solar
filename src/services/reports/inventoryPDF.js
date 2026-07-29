import {
  createReportPDF,
  drawTable,
  addFooter,
} from "./pdfTable";

export function exportInventoryPDF(inventory) {

  const doc = createReportPDF("Inventory Report");

  const columns = [
  { title: "S.No", width: 15 },
  { title: "Product", width: 75 },
  { title: "Category", width: 35 },
  { title: "Available Qty", width: 28 },
  { title: "Unit", width: 20 },
  { title: "Unit Cost", width: 30 },
  { title: "Stock Value", width: 35 },
];

  const rows = inventory.map((item, index) => {

  let productName = item.product_name || "";

  if (item.company) {
    productName = `${item.company} ${productName}`;
  }

  if (item.specification) {
    productName += ` ${item.specification}`;
  }

  return [

    index + 1,

    productName,

    item.category || "",

    item.quantity || 0,

    item.unit || "",

    Math.round(item.unit_cost || 0),

    Math.round(
      Number(item.quantity || 0) *
      Number(item.unit_cost || 0)
    ),

  ];

});

  const endY = drawTable(
    doc,
    columns,
    rows
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);

  doc.text(
    `Total Products : ${inventory.length}`,
    10,
    endY + 10
  );

  addFooter(doc);

  doc.save("Inventory Report.pdf");
}