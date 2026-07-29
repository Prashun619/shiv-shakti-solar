import {
  createReportPDF,
  drawTable,
  addFooter,
} from "./pdfTable";

export function exportCustomerPDF(customers) {

  const doc = createReportPDF("Customer Report");

  const columns = [
    { title: "S.No", width: 15 },
    { title: "Customer Name", width: 65 },
    { title: "Mobile", width: 45 },
    { title: "Location", width: 45 },
    { title: "Plant Size", width: 30 },
    { title: "Payment Type", width: 40 },
  ];

  const rows = customers.map((customer, index) => [
    index + 1,
    customer.customer_name || "",
    customer.mobile || "",
    customer.location || "",
    customer.plant_size || "",
    customer.payment_type || "",
  ]);

  const endY = drawTable(
    doc,
    columns,
    rows
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);

  doc.text(
    `Total Customers : ${customers.length}`,
    10,
    endY + 10
  );

  addFooter(doc);

doc.save("Customer Report.pdf");

}