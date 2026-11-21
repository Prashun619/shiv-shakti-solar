
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";

export async function exportFinanceExcel(data) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Finance Ledger");

  worksheet.addRow(["Finance Ledger Report"]);
  worksheet.addRow([]);

  worksheet.addRow([
    null,
    data.totalValue,
    data.totalReceived,
    data.remaining,
    data.openingBalance,
    data.credit,
    data.debit,
    data.closingBalance,
  ]);

  const buffer = await workbook.xlsx.writeBuffer();

  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "Finance_Ledger.xlsx";
  link.click();

  URL.revokeObjectURL(url);
}

export function exportFinancePDF(data) {
  const doc = new jsPDF();

  doc.text("Finance Ledger Report", 14, 15);

  autoTable(doc, {
    startY: 25,
    head: [["Particular", "Amount"]],
    body: [
      ["Total Value", `â‚¹ ${data.totalValue}`],
      ["Total Received", `â‚¹ ${data.totalReceived}`],
      ["Remaining", `â‚¹ ${data.remaining}`],
      ["Opening Balance", `â‚¹ ${data.openingBalance}`],
      ["Credit", `â‚¹ ${data.credit}`],
      ["Debit", `â‚¹ ${data.debit}`],
      ["Closing Balance", `â‚¹ ${data.closingBalance}`],
    ],
  });

  doc.save("Finance_Ledger.pdf");
}
