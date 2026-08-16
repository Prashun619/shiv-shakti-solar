import jsPDF from "jspdf";
import { applyPlugin } from "jspdf-autotable";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

applyPlugin(jsPDF);

function addLogo(doc){

  return new Promise((resolve)=>{

    const img = new Image();

    img.src="/logo.png";


    img.onload=()=>{

      doc.addImage(
        img,
        "PNG",
        14,
        8,
        25,
        25
      );

      resolve();

    };


    img.onerror=()=>{

      resolve();

    };


  });

}



export async function exportBillingExcel(data) {

  const workbook = new ExcelJS.Workbook();

  const sheet = workbook.addWorksheet(
    "Finance Ledger"
  );

  // =====================================================
  // STYLES
  // =====================================================

  const thinBorder = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" }
  };

  const center = {
    horizontal: "center",
    vertical: "middle"
  };

  function styleHeader(cell) {

    cell.font = {
      bold: true,
      color: {
        argb: "FFFFFF"
      }
    };

    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: "DC2626"
      }
    };

    cell.alignment = center;
    cell.border = thinBorder;
  }

  function styleCell(cell) {

    cell.alignment = center;
    cell.border = thinBorder;
  }

  // =====================================================
  // COMPANY HEADER
  // =====================================================

  sheet.mergeCells("A1:H1");

  const company =
    sheet.getCell("A1");

  company.value =
    "SHIV SHAKTI SOLAR ENERGY";

  company.font = {
    size: 18,
    bold: true,
    color: {
      argb: "FFFFFF"
    }
  };

  company.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "1E3A8A"
    }
  };

  company.alignment = center;

  sheet.getRow(1).height = 28;

  // =====================================================
  // TITLE
  // =====================================================

  sheet.mergeCells("A2:H2");

  const title =
    sheet.getCell("A2");

  title.value =
    "Finance Ledger Report";

  title.font = {
    size: 14,
    bold: true
  };

  title.alignment = center;

  // =====================================================
  // SUMMARY CALCULATIONS
  // =====================================================

  const totalEntries =
    data.length;

  const totalIncome =
    data.reduce(
      (sum, item) =>
        item.type === "Income"
          ? sum + Number(item.amount || 0)
          : sum,
      0
    );

  const totalExpense =
    data.reduce(
      (sum, item) =>
        item.type === "Expense"
          ? sum + Number(item.amount || 0)
          : sum,
      0
    );

  const closingBalance =
    totalIncome - totalExpense;

  // =====================================================
  // SUMMARY
  // =====================================================

  sheet.addRow([]);

  sheet.addRow([
    "Total Entries",
    "Total Income",
    "Total Expense",
    "Closing Balance"
  ]);

  sheet.addRow([
    totalEntries,
    totalIncome,
    totalExpense,
    closingBalance
  ]);

  // Style summary header
  sheet.getRow(4).eachCell(
    cell => {
      styleHeader(cell);
    }
  );

  // Style summary values
  sheet.getRow(5).eachCell(
    cell => {
      styleCell(cell);
    }
  );

  // Number formatting
  sheet.getRow(5).getCell(2)
    .numFmt = '₹#,##0.00';

  sheet.getRow(5).getCell(3)
    .numFmt = '₹#,##0.00';

  sheet.getRow(5).getCell(4)
    .numFmt = '₹#,##0.00';

  // =====================================================
  // SPACING
  // =====================================================

  sheet.addRow([]);
  sheet.addRow([]);

  // =====================================================
  // TRANSACTION HEADER
  // =====================================================

  const header =
    sheet.addRow([
      "Date",
      "Type",
      "Company",
      "Paid By",
      "Mode",
      "Payment Type",
      "Running Balance",
      "Remarks"
    ]);

  header.eachCell(
    cell => {
      styleHeader(cell);
    }
  );

  // =====================================================
  // RUNNING BALANCE
  //
  // Data is displayed newest -> oldest.
  //
  // Calculate balance oldest -> newest so that
  // every displayed row gets the correct cumulative
  // running balance.
  // =====================================================

  const balanceByIndex =
    new Array(data.length);

  let runningBalance = 0;

  for (
    let i = data.length - 1;
    i >= 0;
    i--
  ) {

    const item = data[i];

    const amount =
      Number(item.amount || 0);

    if (item.type === "Income") {

      runningBalance += amount;

    } else if (
      item.type === "Expense"
    ) {

      runningBalance -= amount;

    }

    balanceByIndex[i] =
      runningBalance;
  }

  // =====================================================
  // TRANSACTION DATA
  // =====================================================

  data.forEach(
    (item, index) => {

      const amount =
        Number(item.amount || 0);

      // -----------------------------------------------
      // DATE
      // -----------------------------------------------

      const formattedDate =
        item.date
          ? new Date(item.date)
              .toLocaleDateString(
                "en-GB",
                {
                  day: "2-digit",
                  month: "short",
                  year: "numeric"
                }
              )
              .replaceAll(" ", "-")
          : "";

      // -----------------------------------------------
      // TRANSACTION ROW
      // -----------------------------------------------

      const row =
        sheet.addRow([
          formattedDate,

          item.type || "",

          item.company || "",

          item.paid_by || "",

          item.payment_mode || "",

          amount,

          balanceByIndex[index],

          item.remarks || ""
        ]);

      // -----------------------------------------------
      // CENTER + BORDER
      // -----------------------------------------------

      row.eachCell(
        cell => {
          styleCell(cell);
        }
      );

      // -----------------------------------------------
      // PAYMENT TYPE AMOUNT
      // -----------------------------------------------

      const paymentTypeCell =
        row.getCell(6);

      paymentTypeCell.numFmt =
        '₹#,##0.00';

      paymentTypeCell.font = {
        bold: true,
        color: {
          argb:
            item.type === "Income"
              ? "16A34A"
              : "DC2626"
        }
      };

      paymentTypeCell.alignment =
        center;

      // -----------------------------------------------
      // RUNNING BALANCE
      // -----------------------------------------------

      row.getCell(7).numFmt =
        '₹#,##0.00';

      row.getCell(7).alignment =
        center;

    }
  );

  // =====================================================
  // AUTO WIDTH
  // =====================================================

  const columnWidths = [
    15, // Date
    14, // Type
    28, // Company
    24, // Paid By
    16, // Mode
    20, // Payment Type
    22, // Running Balance
    35  // Remarks
  ];

  sheet.columns.forEach(
    (column, index) => {

      column.width =
        columnWidths[index] || 15;

    }
  );

  // =====================================================
  // FREEZE TRANSACTION HEADER
  // =====================================================

  sheet.views = [
    {
      state: "frozen",
      ySplit: 7
    }
  ];

  // =====================================================
  // DOWNLOAD
  // =====================================================

  const buffer =
    await workbook.xlsx.writeBuffer();

  saveAs(
    new Blob([buffer]),
    "Finance Ledger Report.xlsx"
  );

}

export async function exportBillingPDF(data) {

  // =====================================================
  // CREATE LANDSCAPE A4 PDF
  // =====================================================

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  await addLogo(doc);

  // =====================================================
  // HEADER
  // =====================================================

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);

  doc.text(
    "Shiv Shakti Solar Energy",
    45,
    15
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);

  doc.text(
    "Finance Ledger Report",
    45,
    23
  );

  // Header line
  doc.setDrawColor(220, 38, 38);
  doc.setLineWidth(1);

  doc.line(
    14,
    32,
    283,
    32
  );

  // =====================================================
  // GENERATED DATE
  // =====================================================

  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);

  doc.text(
    `Generated On : ${new Date().toLocaleDateString(
      "en-GB"
    )}`,
    14,
    42
  );

  // =====================================================
  // CALCULATIONS
  // =====================================================

  const totalIncome = data.reduce(
    (sum, item) =>
      item.type === "Income"
        ? sum + Number(item.amount || 0)
        : sum,
    0
  );

  const totalExpense = data.reduce(
    (sum, item) =>
      item.type === "Expense"
        ? sum + Number(item.amount || 0)
        : sum,
    0
  );

  const closingBalance =
    totalIncome - totalExpense;

  // =====================================================
  // SUMMARY TABLE
  // =====================================================

  doc.autoTable({

    startY: 48,

    margin: {
      left: 14,
      right: 14,
    },

    tableWidth: 269,

    head: [
      [
        "Total Income",
        "Total Expense",
        "Closing Balance",
      ],
    ],

    body: [
      [
        `Rs. ${totalIncome.toLocaleString("en-IN")}`,
        `Rs. ${totalExpense.toLocaleString("en-IN")}`,
        `Rs. ${closingBalance.toLocaleString("en-IN")}`,
      ],
    ],

    theme: "grid",

    styles: {
      font: "helvetica",
      fontSize: 10,
      fontStyle: "bold",
      cellPadding: 4,
      halign: "center",
      valign: "middle",
      lineColor: [0, 0, 0],
      lineWidth: 0.3,
    },

    headStyles: {
      fillColor: [220, 38, 38],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 10,
      halign: "center",
      valign: "middle",
    },

    bodyStyles: {
      halign: "center",
      valign: "middle",
      textColor: [0, 0, 0],
    },

    columnStyles: {
      0: {
        cellWidth: 89.5,
        halign: "center",
      },

      1: {
        cellWidth: 89.5,
        halign: "center",
      },

      2: {
        cellWidth: 90,
        halign: "center",
      },
    },

  });

  // =====================================================
  // TRANSACTION RECORDS
  //
  // EXACT STRUCTURE:
  //
  // Date | Type | Company | Paid By | Mode |
  // Payment Type | Running Balance | Remarks
  // =====================================================

 // =====================================================
// RUNNING BALANCE
// =====================================================
//
// Transaction records are displayed newest first.
// Calculate the balance from the oldest transaction
// toward the newest transaction, then assign the
// calculated balance back to the corresponding row.
// =====================================================

const balanceByIndex = new Array(data.length);

let runningBalance = 0;

// Calculate from oldest -> newest
for (let i = data.length - 1; i >= 0; i--) {

  const item = data[i];

  const amount =
    Number(item.amount || 0);

  if (item.type === "Income") {

    runningBalance += amount;

  } else if (item.type === "Expense") {

    runningBalance -= amount;

  }

  balanceByIndex[i] = runningBalance;

}

// =====================================================
// CREATE PDF TRANSACTION ROWS
// =====================================================

const transactionRows = data.map(
  (item, index) => {

    const amount =
      Number(item.amount || 0);

    const paymentType =
      `Rs. ${amount.toLocaleString("en-IN")}`;

    const formattedDate = item.date
      ? new Date(item.date)
          .toLocaleDateString(
            "en-GB",
            {
              day: "2-digit",
              month: "short",
              year: "numeric",
            }
          )
          .replaceAll(" ", "-")
      : "-";

    return [

      // Date
      formattedDate,

      // Type
      item.type || "-",

      // Company
      item.company || "-",

      // Paid By
      item.paid_by || "-",

      // Mode
      item.payment_mode || "-",

      // Payment Type / Amount
      paymentType,

      // Running Balance
      `Rs. ${balanceByIndex[index].toLocaleString(
        "en-IN"
      )}`,

      // Remarks
      item.remarks || "-",

    ];

  }
);

  // =====================================================
  // TRANSACTION TABLE
  // =====================================================

  doc.autoTable({

    startY:
      doc.lastAutoTable.finalY + 10,

    margin: {
      left: 14,
      right: 14,
      top: 10,
      bottom: 18,
    },

    tableWidth: 269,

    head: [
      [
        "Date",
        "Type",
        "Company",
        "Paid By",
        "Mode",
        "Amount",
        "Running Balance",
        "Remarks",
      ],
    ],

    body: transactionRows,

    theme: "grid",

    styles: {

      font: "helvetica",

      fontSize: 8,

      fontStyle: "normal",

      cellPadding: 2.5,

      halign: "center",

      valign: "middle",

      lineColor: [0, 0, 0],

      lineWidth: 0.25,

      overflow: "linebreak",

      cellWidth: "wrap",

      textColor: [0, 0, 0],

    },

    headStyles: {

      fillColor: [220, 38, 38],

      textColor: [255, 255, 255],

      fontStyle: "bold",

      fontSize: 8,

      halign: "center",

      valign: "middle",

      lineColor: [0, 0, 0],

      lineWidth: 0.3,

    },

    bodyStyles: {

      halign: "center",

      valign: "middle",

      textColor: [0, 0, 0],

    },

    alternateRowStyles: {

      fillColor: [248, 248, 248],

    },

    // ===================================================
    // COLUMN WIDTHS
    // ===================================================

    columnStyles: {

      // Date
      0: {
        cellWidth: 30,
        halign: "center",
      },

      // Type
      1: {
        cellWidth: 25,
        halign: "center",
      },

      // Company
      2: {
        cellWidth: 42,
        halign: "center",
      },

      // Paid By
      3: {
        cellWidth: 38,
        halign: "center",
      },

      // Mode
      4: {
        cellWidth: 25,
        halign: "center",
      },

      // Payment Type
      5: {
        cellWidth: 40,
        halign: "center",
      },

      // Running Balance
      6: {
        cellWidth: 35,
        halign: "center",
      },

      // Remarks
      7: {
        cellWidth: 34,
        halign: "center",
      },

    },

    // ===================================================
    // PAYMENT TYPE COLOR
    // ===================================================

    didParseCell: function (hookData) {

      if (
        hookData.section === "body" &&
        hookData.column.index === 5
      ) {

        const item =
          data[hookData.row.index];

        // -----------------------------------------------
        // CREDIT = GREEN
        // -----------------------------------------------

        if (item?.type === "Income") {

          hookData.cell.styles.textColor =
            [22, 163, 74];

          hookData.cell.styles.fontStyle =
            "bold";

        }

        // -----------------------------------------------
        // DEBIT = RED
        // -----------------------------------------------

        else if (
          item?.type === "Expense"
        ) {

          hookData.cell.styles.textColor =
            [220, 38, 38];

          hookData.cell.styles.fontStyle =
            "bold";

        }

      }

    },

  });

  // =====================================================
  // FOOTER
  // =====================================================

  const pageCount =
    doc.getNumberOfPages();

  for (
    let i = 1;
    i <= pageCount;
    i++
  ) {

    doc.setPage(i);

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(8);

    doc.setTextColor(
      80,
      80,
      80
    );

    doc.text(
      "Shiv Shakti Solar Energy | Finance Ledger",
      14,
      202
    );

    doc.text(
      `Page ${i} of ${pageCount}`,
      255,
      202
    );

  }

  // =====================================================
  // SAVE PDF
  // =====================================================

  doc.save(
    "Finance_Ledger_Report.pdf"
  );

}