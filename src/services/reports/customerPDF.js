import {
  createReportPDF,
  drawTable,
  addFooter,
} from "./pdfTable";

export function exportCustomerPDF(customers) {

  const doc = createReportPDF("Customer Report");

  const columns = [
  { title: "S.No", width: 12 },
  { title: "Customer", width: 40 },
  { title: "Mobile", width: 30 },
  { title: "Email", width: 45 },
  { title: "Address", width: 50 },
  { title: "Location", width: 30 },
  { title: "Plant Size", width: 20 },
  { title: "Payment Type", width: 30 },
];

 const rows = customers.map((customer, index) => [

  index + 1,

  customer.customer_name || "",

  customer.mobile || "",

  customer.email || "",

  customer.address || "",

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