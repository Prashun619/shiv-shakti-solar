import {
  createReportPDF,
  drawTable,
  addFooter,
} from "./pdfTable";

export function exportUsedInventoryPDF(data) {

  const doc = createReportPDF("Used Inventory Report");

  const columns = [
    { title: "S.No", width: 12 },
    { title: "Customer", width: 45 },
    { title: "Project", width: 28 },
    { title: "Plant", width: 20 },
    { title: "Location", width: 35 },
    { title: "Plant Cost", width: 30 },
  ];

  const rows = data.map((item, index) => [
    index + 1,
    item.customers?.customer_name || "",
    item.project_no || "",
    item.plant_size || "",
    item.location || "",
    Number(item.total_plant_cost || 0).toFixed(2),
  ]);

  const endY = drawTable(
    doc,
    columns,
    rows
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);

  doc.text(
    `Total Records : ${data.length}`,
    10,
    endY + 12
  );

  const totalCost = data.reduce(
    (sum, item) => sum + Number(item.total_plant_cost || 0),
    0
  );

  doc.text(
    `Total Plant Cost : ${totalCost.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`,
    10,
    endY + 20
  );

  addFooter(doc);

  doc.save("Used Inventory Report.pdf");
}