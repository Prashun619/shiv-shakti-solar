import {
  createReportPDF,
  drawTable,
  addFooter,
} from "./pdfTable";

export function exportPaymentPDF(payments) {

  const doc = createReportPDF("Payment Report");

  const columns = [
    { title: "S.No", width: 15 },
    { title: "Date", width: 30 },
    { title: "Customer", width: 45 },
    { title: "Project", width: 30 },
    { title: "Type", width: 25 },
    { title: "Mode", width: 25 },
    { title: "Amount", width: 30 },
    { title: "Reference", width: 35 },
  ];

  const rows = payments.map((payment, index) => [

    index + 1,

    payment.payment_date
      ? new Date(payment.payment_date).toLocaleDateString(
          "en-GB",
          {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }
        )
      : "",

    payment.projects?.customers?.customer_name || "",

    payment.projects?.project_no || "",

    payment.payment_type || "",

    payment.payment_mode || "",

    Number(payment.amount || 0).toFixed(2),

    payment.reference_no || "",

  ]);

  const endY = drawTable(
    doc,
    columns,
    rows
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);

  const totalAmount = payments.reduce(
    (sum, payment) =>
      sum + Number(payment.amount || 0),
    0
  );

  doc.text(
    `Total Payments : ${payments.length}`,
    10,
    endY + 10
  );

  doc.text(
    `Total Amount : ${totalAmount.toFixed(2)}`,
    10,
    endY + 18
  );

  addFooter(doc);

  doc.save("Payment Report.pdf");
}