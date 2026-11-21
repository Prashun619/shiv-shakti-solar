
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";

export async function exportCustomerPaymentsExcel(data) {
  const rows = data.map((item) => ({
    "Project No": item.project_no,
    "Customer Name": item.customers?.customer_name || "-",
    "Plant Size": item.project_size,
    "Project Amount": item.total_amount,
    "Received": item.received,
    "Remaining": item.remaining,
  }));

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Customer Payments");

  const headers = Object.keys(rows[0] || {
    "Project No": "",
    "Customer Name": "",
    "Plant Size": "",
    "Project Amount": "",
    "Received": "",
    "Remaining": "",
  });

  worksheet.addRow(headers);
  rows.forEach((row) => {
    worksheet.addRow(headers.map((header) => row[header]));
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "Customer_Payments.xlsx";
  link.click();
  URL.revokeObjectURL(url);
}

export function exportCustomerPaymentsPDF(data) {
  const doc = new jsPDF();

  doc.text("Customer Payments Report", 14, 15);

  autoTable(doc, {
    startY: 25,
    head: [[
      "Project No",
      "Customer",
      "Plant Size",
      "Amount",
      "Received",
      "Remaining",
    ]],
    body: data.map((item) => [
      item.project_no,
      item.customers?.customer_name || "-",
      item.project_size,
      `â‚¹ ${item.total_amount}`,
      `â‚¹ ${item.received}`,
      `â‚¹ ${item.remaining}`,
    ]),
  });

  doc.save("Customer_Payments.pdf");
}
