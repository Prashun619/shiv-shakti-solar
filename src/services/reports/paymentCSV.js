export function exportPaymentCSV(payments) {

  const headers = [
    "Date",
    "Customer",
    "Project No",
    "Payment Type",
    "Payment Mode",
    "Amount",
    "Reference No",
  ];

  const rows = payments.map((payment) => [
    payment.payment_date || "",
    payment.projects?.customers?.customer_name || "",
    payment.projects?.project_no || "",
    payment.payment_type || "",
    payment.payment_mode || "",
    payment.amount || 0,
    payment.reference_no || "",
  ]);

  const csv = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "Payment Report.csv";
  link.click();
}