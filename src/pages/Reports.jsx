import { supabase } from "../services/supabase";
import { getBilling } from "../services/billingService";
import jsPDF from "jspdf";
import { applyPlugin } from "jspdf-autotable";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

applyPlugin(jsPDF);

import { exportProfitPDF } from "../services/reports/profitPDF";
import { exportProfitCSV } from "../services/reports/profitCSV";
import {
  getCustomerReport,
  getProjectReport,
  exportCustomerCSV,
} from "../services/reportService";



import { getInventory } from "../services/inventoryService";
import { getUsedInventory } from "../services/usedInventoryService";
import { getAllPayments } from "../services/paymentsService";
import { getProfitReport } from "../services/reports/profitService";
import { getInvestments } from "../services/investmentService";
import { exportCustomerPDF } from "../services/reports/customerPDF";
import { exportProjectExcel } from "../services/reports/projectCSV";
import { exportProjectPDF } from "../services/reports/projectPDF";
import { exportInventoryCSV } from "../services/reports/inventoryCSV";
import { exportInventoryPDF } from "../services/reports/inventoryPDF";
import { exportPaymentCSV } from "../services/reports/paymentCSV";
import { exportPaymentPDF } from "../services/reports/paymentPDF";
import { useEffect, useMemo, useState } from "react";

import {
  Users,
  FolderKanban,
  IndianRupee,
  Boxes,
  Search,
  Download,
  FileText,
} from "lucide-react";

console.log(getAllPayments);

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState("");
   const [customers, setCustomers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [inventory, setInventory] = useState([]); 
  const [payments, setPayments] = useState([]);
  const [profitData, setProfitData] = useState([]);
  const [profit, setProfit] = useState([]);
  const [financeLedger, setFinanceLedger] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
const [projectSummary, setProjectSummary] = useState({
  totalProjects: 0,
  totalValue: 0,
  totalReceived: 0,
  totalRemaining: 0,
});

useEffect(() => {
  async function checkCurrentUser() {
    const {
      data: {
        user: authUser
      }
    } = await supabase.auth.getUser();

    console.log("CURRENT AUTH USER:", authUser);

    if (!authUser) {
      console.log("No authenticated user.");
      return;
    }

    const {
      data: appUser,
      error
    } = await supabase
      .from("users")
      .select(`
        id,
        full_name,
        username,
        role,
        customers,
        projects,
        inventory,
        used_inventory,
        payments,
        reports,
        quotations,
        settings
      `)
      .eq("id", authUser.id)
      .single();

    console.log("CURRENT APP USER:", appUser);
    console.log("CURRENT APP USER ERROR:", error);
  }

  checkCurrentUser();
}, []);

  /* ===========================
   LOAD REPORTS
=========================== */

useEffect(() => {
  if (selectedReport === "customers") {
    loadCustomers();
  }

  if (selectedReport === "projects") {
    loadProjects();
  }

  if (selectedReport === "inventory") {
    loadInventory();
  }

  if (selectedReport === "payments") {
    loadPayments();
  }

  if (selectedReport === "profit") {
    loadProfit();
  }

  if (selectedReport === "finance") {
  loadFinanceLedger();
}

if (selectedReport === "investment") {
  loadInvestments();
}

}, [selectedReport]);


/* ===========================
   LOAD CUSTOMERS
=========================== */

async function loadCustomers() {
  try {
    setLoading(true);

    const data = await getCustomerReport();

    setCustomers(data);
  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
}


/* ===========================
   LOAD PROJECTS
=========================== */

async function loadProjects() {
  try {
    setLoading(true);

    const data = await getProjectReport();

    setProjects(data);
  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
}


/* ===========================
   LOAD INVENTORY
=========================== */

async function loadInventory() {
  try {
    setLoading(true);

    const data = await getInventory();

    setInventory(data);
  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
}


/* ===========================
   LOAD PAYMENTS
=========================== */

async function loadPayments() {
  try {
    setLoading(true);

    const data = await getAllPayments();

    setPayments(data);
  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
}


/* ===========================
   LOAD FINANCE LEDGER
=========================== */

async function loadFinanceLedger(){

  try{

    setLoading(true);

    const data = await getBilling();

    setFinanceLedger(data || []);

  }
  catch(err){

    console.error(err);

  }
  finally{

    setLoading(false);

  }

}

/* ===========================
   LOAD INVESTMENTS
=========================== */

async function loadInvestments() {
  try {
    setLoading(true);

    const data = await getInvestments();

    setInvestments(data || []);
  } catch (err) {
    console.error("Investment Report Error:", err);
  } finally {
    setLoading(false);
  }
}

/* ===========================
   LOAD PROFIT
=========================== */

async function loadProfit() {
  try {
    setLoading(true);

    const projects = await getProjectReport();
    const usedInventory = await getUsedInventory();

    const result = projects.map((project) => {

      const used = usedInventory.find(
        (item) => item.project_no === project.project_no
      );

      const sellingAmount = Number(project.total_amount || 0);

      const materialCost = Number(
        used?.material_cost || 0
      );

      const otherCost =
        Number(used?.installation_charges || 0) +
        Number(used?.civil_material || 0) +
        Number(used?.vendor_charges || 0) +
        Number(used?.agreement_charges || 0) +
        Number(used?.je_charges || 0) +
        Number(used?.name_change_charges || 0) +
        Number(used?.load_extension_charges || 0) +
        Number(used?.net_metering_charges || 0);

      const totalCost =
        materialCost + otherCost;

      const profitAmount =
        sellingAmount - totalCost;

      const profitPercent =
        sellingAmount > 0
          ? (
              (profitAmount / sellingAmount) *
              100
            ).toFixed(2)
          : "0.00";

      return {
        id: project.id,
        project_no: project.project_no,
        customer_name:
          project.customers?.customer_name || "",
        project_size:
          project.project_size || "",
        selling_amount: sellingAmount,
        material_cost: materialCost,
        other_cost: otherCost,
        total_cost: totalCost,
        profit_amount: profitAmount,
        profit_percent: profitPercent,
      };
    });

    setProfitData(result);
  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
}


/* ===========================
   FILTERED CUSTOMERS
=========================== */

const filteredCustomers = useMemo(() => {
  const text = search.toLowerCase();

  return customers.filter((customer) => {
    return (
      (customer.customer_name || "")
        .toLowerCase()
        .includes(text) ||

      (customer.mobile || "")
        .toLowerCase()
        .includes(text) ||

      (customer.email || "")
        .toLowerCase()
        .includes(text) ||

      (customer.location || "")
        .toLowerCase()
        .includes(text)
    );
  });
}, [customers, search]);


/* ===========================
   FILTERED PROJECTS
=========================== */

const filteredProjects = useMemo(() => {
  const text = search.toLowerCase();

  return projects.filter((project) => {
    return (
      (project.project_no || "")
        .toLowerCase()
        .includes(text) ||

      (project.customers?.customer_name || "")
        .toLowerCase()
        .includes(text) ||

      (project.status || "")
        .toLowerCase()
        .includes(text)
    );
  });
}, [projects, search]);


/* ===========================
   FILTERED INVENTORY
=========================== */

const filteredInventory = useMemo(() => {
  const text = search.toLowerCase();

  return inventory.filter((item) => {
    return (
      (item.product_name || "")
        .toLowerCase()
        .includes(text) ||

      (item.company || "")
        .toLowerCase()
        .includes(text) ||

      (item.category || "")
        .toLowerCase()
        .includes(text)
    );
  });
}, [inventory, search]);


/* ===========================
   FILTERED PAYMENTS
=========================== */

const filteredPayments = useMemo(() => {
  const text = search.toLowerCase();

  return payments.filter((payment) => {
    return (
      (payment.projects?.customers?.customer_name || "")
        .toLowerCase()
        .includes(text) ||

      (payment.projects?.project_no || "")
        .toLowerCase()
        .includes(text) ||

      (payment.payment_mode || "")
        .toLowerCase()
        .includes(text) ||

      (payment.payment_type || "")
        .toLowerCase()
        .includes(text)
    );
  });
}, [payments, search]);

const filteredFinanceLedger = useMemo(() => {

  const text = search.toLowerCase();

  return financeLedger.filter((item) => {

    return (

      (item.company || "")
        .toLowerCase()
        .includes(text)

      ||

      (item.paid_by || "")
        .toLowerCase()
        .includes(text)

      ||

      (item.payment_mode || "")
        .toLowerCase()
        .includes(text)

      ||

      (item.remarks || "")
        .toLowerCase()
        .includes(text)

      ||

      (item.type || "")
        .toLowerCase()
        .includes(text)

    );

  });

}, [financeLedger, search]);



/* ===========================
   FILTERED INVESTMENTS
=========================== */

const filteredInvestments = useMemo(() => {
  const text = search.toLowerCase();

  return investments.filter((item) => {
    const investorName =
      item.partners?.partner_name || "";

    const partyName =
      item.investment_type === "Dealer Payment"
        ? item.dealer_name || ""
        : item.investment_type === "Vendor Payment"
        ? item.vendor_name || ""
        : "";

    return (
      investorName.toLowerCase().includes(text) ||

      (item.investment_type || "")
        .toLowerCase()
        .includes(text) ||

      partyName.toLowerCase().includes(text) ||

      (item.payment_mode || "")
        .toLowerCase()
        .includes(text) ||

      (item.purpose || "")
        .toLowerCase()
        .includes(text)
    );
  });
}, [investments, search]);


// =====================================================
// FINANCE LEDGER REPORT DATA
// =====================================================
//
// Transaction records are displayed newest -> oldest.
// Running balance is therefore calculated oldest -> newest
// and then assigned back to the displayed rows.
// =====================================================

const financeLedgerReport = useMemo(() => {

  // =====================================================
  // COPY FILTERED DATA
  // =====================================================

  const data = [...filteredFinanceLedger];

  // =====================================================
  // RUNNING BALANCE
  // DISPLAY ORDER = NEWEST -> OLDEST
  // CALCULATION = OLDEST -> NEWEST
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

    } else if (item.type === "Expense") {

      runningBalance -= amount;

    }

    balanceByIndex[i] =
      runningBalance;
  }

  // =====================================================
  // RETURN DATA IN EXACT FORMAT REQUIRED BY
  //
  // =====================================================

  return data.map((item, index) => {

    return {
      ...item,

      amount:
        Number(item.amount || 0),

      runningBalance:
        Number(balanceByIndex[index] || 0),

    };

  });

}, [filteredFinanceLedger]);

/* ===========================
   FILTERED PROFIT
=========================== */

const filteredProfit = useMemo(() => {
  const text = search.toLowerCase();

  return profitData.filter((item) => {
    return (
      (item.project_no || "")
        .toLowerCase()
        .includes(text) ||

      (item.customer_name || "")
        .toLowerCase()
        .includes(text)
    );
  });
}, [profitData, search]);

// =====================================================
// INVESTMENT EXCEL EXPORT
// =====================================================

async function exportInvestmentExcel(data) {

  const workbook = new ExcelJS.Workbook();

  const sheet =
    workbook.addWorksheet("Investment Report");

  const thinBorder = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };

  const center = {
    horizontal: "center",
    vertical: "middle",
  };

  // =====================================================
  // STYLES
  // =====================================================

  function styleHeader(cell) {

    cell.font = {
      bold: true,
      size: 10,
      color: {
        argb: "FFFFFF",
      },
    };

    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: "2563EB",
      },
    };

    cell.alignment = center;
    cell.border = thinBorder;
  }

  function styleCell(cell) {

    cell.font = {
      size: 10,
    };

    cell.alignment = center;
    cell.border = thinBorder;
  }

  // =====================================================
  // COMPANY HEADER
  // =====================================================

  sheet.mergeCells("A1:G1");

  const company =
    sheet.getCell("A1");

  company.value =
    "SHIV SHAKTI SOLAR ENERGY";

  company.font = {
    size: 16,
    bold: true,
    color: {
      argb: "FFFFFF",
    },
  };

  company.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "1E3A8A",
    },
  };

  company.alignment = center;

  sheet.getRow(1).height = 24;

  // =====================================================
  // TITLE
  // =====================================================

  sheet.mergeCells("A2:G2");

  const title =
    sheet.getCell("A2");

  title.value =
    "Investment Report";

  title.font = {
    size: 12,
    bold: true,
  };

  title.alignment = center;

  sheet.getRow(2).height = 20;

  // =====================================================
// INVESTOR TOTALS
// =====================================================

const investorNames = [
  "Prashun Dixit",
  "Saurabh Nigam",
  "Shubhendu Dixit",
  "Vipin Saxena",
];

const investorTotals = {};

investorNames.forEach((name) => {
  investorTotals[name] = 0;
});

data.forEach((investment) => {

  const investor =
    investment.partners?.partner_name;

  if (
    investor &&
    Object.prototype.hasOwnProperty.call(
      investorTotals,
      investor
    )
  ) {

    investorTotals[investor] +=
      Number(investment.amount || 0);

  }

});

// =====================================================
// OVERALL TOTALS
// =====================================================

const totalEntries =
  data.length;

const totalInvestment =
  data.reduce(
    (sum, item) =>
      sum + Number(item.amount || 0),
    0
  );

// =====================================================
// SUMMARY TABLES SIDE BY SIDE
// =====================================================

// Investor summary
sheet.getCell("A4").value =
  "Investor";

sheet.getCell("B4").value =
  "Total Investment";

styleHeader(sheet.getCell("A4"));
styleHeader(sheet.getCell("B4"));

investorNames.forEach(
  (name, index) => {

    const row =
      5 + index;

    sheet.getCell(`A${row}`).value =
      name;

    sheet.getCell(`B${row}`).value =
      investorTotals[name];

    styleCell(
      sheet.getCell(`A${row}`)
    );

    styleCell(
      sheet.getCell(`B${row}`)
    );

    sheet.getCell(`B${row}`).numFmt =
      '₹#,##0.00';

  }
);

// Overall summary next to investor summary

sheet.getCell("D4").value =
  "Total Entries";

sheet.getCell("E4").value =
  "Total Investment";

styleHeader(sheet.getCell("D4"));
styleHeader(sheet.getCell("E4"));

sheet.getCell("D5").value =
  totalEntries;

sheet.getCell("E5").value =
  totalInvestment;

styleCell(sheet.getCell("D5"));
styleCell(sheet.getCell("E5"));

sheet.getCell("E5").numFmt =
  '₹#,##0.00';

// Small spacing before transaction table
sheet.addRow([]);
sheet.addRow([]);

  // =====================================================
  // TRANSACTION TABLE HEADER
  // =====================================================

  const header =
    sheet.addRow([
      "Date",
      "Investor",
      "Investment Type",
      "Party / Name",
      "Amount",
      "Payment Mode",
      "Description",
    ]);

  header.eachCell(
    (cell) => {
      styleHeader(cell);
    }
  );

  // =====================================================
  // TRANSACTION DATA
  // =====================================================

  data.forEach(
    (investment) => {

      const investorName =
        investment.partners?.partner_name ||
        "-";

      const partyName =
        investment.investment_type ===
        "Dealer Payment"
          ? investment.dealer_name || "-"
          : investment.investment_type ===
            "Vendor Payment"
          ? investment.vendor_name || "-"
          : "-";

      const formattedDate =
        investment.investment_date
          ? new Date(
              `${investment.investment_date}T00:00:00`
            ).toLocaleDateString(
              "en-IN",
              {
                day: "2-digit",
                month: "short",
                year: "numeric",
              }
            )
          : "-";

      const row =
        sheet.addRow([
          formattedDate,
          investorName,
          investment.investment_type || "-",
          partyName,
          Number(
            investment.amount || 0
          ),
          investment.payment_mode || "-",
          investment.purpose || "-",
        ]);

      row.eachCell(
        (cell) => {
          styleCell(cell);
        }
      );

      row.getCell(5).numFmt =
        '₹#,##0.00';

      row.getCell(5).font = {
        bold: true,
        color: {
          argb: "16A34A",
        },
        size: 10,
      };

      row.getCell(5).alignment =
        center;

    }
  );

  // =====================================================
  // COLUMN WIDTHS
  // =====================================================

  const columnWidths = [
    15, // Date
    23, // Investor
    24, // Investment Type
    25, // Party / Name
    18, // Amount
    16, // Payment Mode
    35, // Description
  ];

  sheet.columns.forEach(
    (column, index) => {
      column.width =
        columnWidths[index] || 15;
    }
  );

  // =====================================================
  // FREEZE
  // =====================================================

  sheet.views = [
    {
      state: "frozen",
      ySplit: 10,
    },
  ];

  // =====================================================
  // DOWNLOAD
  // =====================================================

  const buffer =
    await workbook.xlsx.writeBuffer();

  saveAs(
    new Blob([buffer]),
    "Investment_Report.xlsx"
  );
}

// =====================================================
// INVESTMENT PDF EXPORT
// =====================================================

async function exportInvestmentPDF(data) {

  const doc =
    new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

  // =====================================================
  // LOGO
  // =====================================================

  await new Promise(
    (resolve) => {

      const img =
        new Image();

      img.src =
        "/logo.png";

      img.onload = () => {

        doc.addImage(
          img,
          "PNG",
          14,
          7,
          22,
          22
        );

        resolve();

      };

      img.onerror = () => {
        resolve();
      };

    }
  );

  // =====================================================
  // HEADER
  // =====================================================

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(16);

  doc.setTextColor(
    0,
    0,
    0
  );

  doc.text(
    "Shiv Shakti Solar Energy",
    42,
    14
  );

  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.setFontSize(11);

  doc.text(
    "Investment Report",
    42,
    21
  );

  doc.setDrawColor(
    37,
    99,
    235
  );

  doc.setLineWidth(0.8);

  doc.line(
    14,
    28,
    283,
    28
  );

  // =====================================================
  // GENERATED DATE
  // =====================================================

  doc.setFontSize(8);

  doc.setTextColor(
    0,
    0,
    0
  );

  doc.text(
    `Generated On : ${new Date().toLocaleDateString(
      "en-GB"
    )}`,
    14,
    36
  );

  // =====================================================
  // INVESTOR TOTALS
  // =====================================================

  const investorNames = [
    "Prashun Dixit",
    "Saurabh Nigam",
    "Shubhendu Dixit",
    "Vipin Saxena",
  ];

  const investorTotals = {};

  investorNames.forEach(
    (name) => {
      investorTotals[name] = 0;
    }
  );

  data.forEach(
    (investment) => {

      const investor =
        investment.partners?.partner_name;

      if (
        investor &&
        Object.prototype.hasOwnProperty.call(
          investorTotals,
          investor
        )
      ) {

        investorTotals[investor] +=
          Number(
            investment.amount || 0
          );

      }

    }
  );



// =====================================================
// OVERALL TOTALS
// =====================================================

const totalEntries =
  data.length;

const totalInvestment =
  data.reduce(
    (sum, item) =>
      sum + Number(item.amount || 0),
    0
  );

// =====================================================
// INVESTOR SUMMARY
// =====================================================

doc.autoTable({

  startY: 40,

  margin: {
    left: 14,
    right: 0,
  },

  tableWidth: 125,

  head: [[
    "Investor",
    "Total Investment",
  ]],

  body:
    investorNames.map(
      (name) => [
        name,
        `Rs. ${investorTotals[name].toLocaleString(
          "en-IN"
        )}`,
      ]
    ),

  theme: "grid",

  styles: {
    font: "helvetica",
    fontSize: 7.5,
    cellPadding: 2,
    halign: "center",
    valign: "middle",
    lineColor: [0, 0, 0],
    lineWidth: 0.25,
  },

  headStyles: {
    fillColor: [37, 99, 235],
    textColor: [255, 255, 255],
    fontStyle: "bold",
    fontSize: 7.5,
    halign: "center",
    valign: "middle",
  },

  bodyStyles: {
    textColor: [0, 0, 0],
    halign: "center",
    valign: "middle",
  },

  columnStyles: {

    0: {
      cellWidth: 58,
      halign: "center",
    },

    1: {
      cellWidth: 67,
      halign: "center",
    },

  },

});

// =====================================================
// OVERALL SUMMARY — NEXT TO INVESTOR SUMMARY
// =====================================================

doc.autoTable({

  startY: 40,

  margin: {
    left: 146,
    right: 14,
  },

  tableWidth: 137,

  head: [[
    "Total Entries",
    "Total Investment",
  ]],

  body: [[
    String(totalEntries),
    `Rs. ${totalInvestment.toLocaleString(
      "en-IN"
    )}`,
  ]],

  theme: "grid",

  styles: {
    font: "helvetica",
    fontSize: 7.5,
    fontStyle: "bold",
    cellPadding: 2,
    halign: "center",
    valign: "middle",
    lineColor: [0, 0, 0],
    lineWidth: 0.25,
  },

  headStyles: {
    fillColor: [37, 99, 235],
    textColor: [255, 255, 255],
    fontStyle: "bold",
    fontSize: 7.5,
    halign: "center",
    valign: "middle",
  },

  bodyStyles: {
    textColor: [0, 0, 0],
    halign: "center",
    valign: "middle",
  },

  columnStyles: {

    0: {
      cellWidth: 65,
      halign: "center",
    },

    1: {
      cellWidth: 72,
      halign: "center",
    },

  },

});

  // =====================================================
  // TRANSACTION TABLE
  // =====================================================

  const transactionRows =
    data.map(
      (investment) => {

        const investorName =
          investment.partners?.partner_name ||
          "-";

        const partyName =
          investment.investment_type ===
          "Dealer Payment"
            ? investment.dealer_name || "-"
            : investment.investment_type ===
              "Vendor Payment"
            ? investment.vendor_name || "-"
            : "-";

        const formattedDate =
          investment.investment_date
            ? new Date(
                `${investment.investment_date}T00:00:00`
              ).toLocaleDateString(
                "en-IN",
                {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                }
              )
            : "-";

        return [

          formattedDate,

          investorName,

          investment.investment_type ||
            "-",

          partyName,

          `Rs. ${Number(
            investment.amount || 0
          ).toLocaleString(
            "en-IN"
          )}`,

          investment.payment_mode ||
            "-",

          investment.purpose ||
            "-",

        ];

      }
    );

  // =====================================================
  // INVESTMENT TRANSACTION TABLE
  // =====================================================

  doc.autoTable({

    startY:
      doc.lastAutoTable.finalY + 25,

    margin: {
      left: 14,
      right: 14,
      top: 8,
      bottom: 15,
    },

    tableWidth: 269,

    head: [[
      "Date",
      "Investor",
      "Investment Type",
      "Party / Name",
      "Amount",
      "Payment Mode",
      "Description",
    ]],

    body: transactionRows,

    theme: "grid",

    styles: {

      font: "helvetica",

      fontSize: 7.5,

      cellPadding: 2,

      halign: "center",

      valign: "middle",

      lineColor: [0, 0, 0],

      lineWidth: 0.2,

      overflow: "linebreak",

      textColor: [0, 0, 0],

    },

    headStyles: {

      fillColor: [37, 99, 235],

      textColor: [255, 255, 255],

      fontStyle: "bold",

      fontSize: 7.5,

      halign: "center",

      valign: "middle",

      lineColor: [0, 0, 0],

      lineWidth: 0.25,

    },

    bodyStyles: {

      halign: "center",

      valign: "middle",

    },

    alternateRowStyles: {

      fillColor: [248, 248, 248],

    },

    columnStyles: {

      0: {
        cellWidth: 29,
        halign: "center",
      },

      1: {
        cellWidth: 35,
        halign: "center",
      },

      2: {
        cellWidth: 40,
        halign: "center",
      },

      3: {
        cellWidth: 42,
        halign: "center",
      },

      4: {
        cellWidth: 34,
        halign: "center",
      },

      5: {
        cellWidth: 31,
        halign: "center",
      },

      6: {
        cellWidth: 58,
        halign: "center",
      },

    },

    didParseCell:
      function (hookData) {

        if (
          hookData.section === "body" &&
          hookData.column.index === 4
        ) {

          hookData.cell.styles.textColor =
            [22, 163, 74];

          hookData.cell.styles.fontStyle =
            "bold";

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

    doc.setFontSize(7.5);

    doc.setTextColor(
      80,
      80,
      80
    );

    doc.text(
      "Shiv Shakti Solar Energy | Investment Report",
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
  // SAVE
  // =====================================================

  doc.save(
    "Investment_Report.pdf"
  );
}

// =====================================================
// FINANCE LEDGER EXCEL EXPORT
// =====================================================

async function exportFinanceLedgerExcel(data) {

  const workbook = new ExcelJS.Workbook();

  const sheet = workbook.addWorksheet(
    "Finance Ledger"
  );

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

  // COMPANY HEADER

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

  // TITLE

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

  // SUMMARY

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

  sheet.getRow(4).eachCell(
    cell => {
      styleHeader(cell);
    }
  );

  sheet.getRow(5).eachCell(
    cell => {
      styleCell(cell);
    }
  );

  sheet.getRow(5).getCell(2)
    .numFmt = '₹#,##0.00';

  sheet.getRow(5).getCell(3)
    .numFmt = '₹#,##0.00';

  sheet.getRow(5).getCell(4)
    .numFmt = '₹#,##0.00';

  // SPACING

  sheet.addRow([]);
  sheet.addRow([]);

  // RUNNING BALANCE

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

  // TRANSACTION HEADER

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

  // TRANSACTION DATA

  data.forEach(
    (item, index) => {

      const amount =
        Number(item.amount || 0);

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

      row.eachCell(
        cell => {
          styleCell(cell);
        }
      );

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

      row.getCell(7).numFmt =
        '₹#,##0.00';

      row.getCell(7).alignment =
        center;

    }
  );

  // COLUMN WIDTHS

  const columnWidths = [
    15,
    14,
    28,
    24,
    16,
    20,
    22,
    35
  ];

  sheet.columns.forEach(
    (column, index) => {

      column.width =
        columnWidths[index] || 15;

    }
  );

  // FREEZE

  sheet.views = [
    {
      state: "frozen",
      ySplit: 7
    }
  ];

  // DOWNLOAD

  const buffer =
    await workbook.xlsx.writeBuffer();

  saveAs(
    new Blob([buffer]),
    "Finance Ledger Report.xlsx"
  );
}


// =====================================================
// FINANCE LEDGER PDF EXPORT
// =====================================================

async function exportFinanceLedgerPDF(data) {

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4"
  });

  // LOGO

  await new Promise((resolve) => {

    const img = new Image();

    img.src = "/logo.png";

    img.onload = () => {

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

    img.onerror = () => {

      resolve();

    };

  });

  // HEADER

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

  doc.setDrawColor(220, 38, 38);
  doc.setLineWidth(1);

  doc.line(
    14,
    32,
    283,
    32
  );

  // GENERATED DATE

  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);

  doc.text(
    `Generated On : ${new Date().toLocaleDateString(
      "en-GB"
    )}`,
    14,
    42
  );

  // CALCULATIONS

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

  // SUMMARY TABLE

  doc.autoTable({

    startY: 48,

    margin: {
      left: 14,
      right: 14
    },

    tableWidth: 269,

    head: [[
      "Total Income",
      "Total Expense",
      "Closing Balance"
    ]],

    body: [[
      `Rs. ${totalIncome.toLocaleString("en-IN")}`,
      `Rs. ${totalExpense.toLocaleString("en-IN")}`,
      `Rs. ${closingBalance.toLocaleString("en-IN")}`
    ]],

    theme: "grid",

    styles: {
      font: "helvetica",
      fontSize: 10,
      fontStyle: "bold",
      cellPadding: 4,
      halign: "center",
      valign: "middle",
      lineColor: [0, 0, 0],
      lineWidth: 0.3
    },

    headStyles: {
      fillColor: [220, 38, 38],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 10,
      halign: "center",
      valign: "middle"
    },

    bodyStyles: {
      halign: "center",
      valign: "middle",
      textColor: [0, 0, 0]
    },

    columnStyles: {

      0: {
        cellWidth: 89.5,
        halign: "center"
      },

      1: {
        cellWidth: 89.5,
        halign: "center"
      },

      2: {
        cellWidth: 90,
        halign: "center"
      }

    }

  });

  // RUNNING BALANCE

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

  // TRANSACTION ROWS

  const transactionRows =
    data.map(
      (item, index) => {

        const amount =
          Number(item.amount || 0);

        const paymentType =
          `Rs. ${amount.toLocaleString(
            "en-IN"
          )}`;

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
                .replaceAll(
                  " ",
                  "-"
                )
            : "-";

        return [

          formattedDate,

          item.type || "-",

          item.company || "-",

          item.paid_by || "-",

          item.payment_mode || "-",

          paymentType,

          `Rs. ${balanceByIndex[index].toLocaleString(
            "en-IN"
          )}`,

          item.remarks || "-"

        ];

      }
    );

  // TRANSACTION TABLE

  doc.autoTable({

    startY:
      doc.lastAutoTable.finalY + 10,

    margin: {
      left: 14,
      right: 14,
      top: 10,
      bottom: 18
    },

    tableWidth: 269,

    head: [[
      "Date",
      "Type",
      "Company",
      "Paid By",
      "Mode",
      "Amount",
      "Running Balance",
      "Remarks"
    ]],

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

      textColor: [0, 0, 0]

    },

    headStyles: {

      fillColor: [220, 38, 38],

      textColor: [255, 255, 255],

      fontStyle: "bold",

      fontSize: 8,

      halign: "center",

      valign: "middle",

      lineColor: [0, 0, 0],

      lineWidth: 0.3

    },

    bodyStyles: {

      halign: "center",

      valign: "middle",

      textColor: [0, 0, 0]

    },

    alternateRowStyles: {

      fillColor: [248, 248, 248]

    },

    columnStyles: {

      0: {
        cellWidth: 30,
        halign: "center"
      },

      1: {
        cellWidth: 25,
        halign: "center"
      },

      2: {
        cellWidth: 42,
        halign: "center"
      },

      3: {
        cellWidth: 38,
        halign: "center"
      },

      4: {
        cellWidth: 25,
        halign: "center"
      },

      5: {
        cellWidth: 40,
        halign: "center"
      },

      6: {
        cellWidth: 35,
        halign: "center"
      },

      7: {
        cellWidth: 34,
        halign: "center"
      }

    },

    didParseCell:
      function(hookData) {

        if (
          hookData.section === "body" &&
          hookData.column.index === 5
        ) {

          const item =
            data[
              hookData.row.index
            ];

          if (
            item?.type === "Income"
          ) {

            hookData.cell.styles.textColor =
              [22, 163, 74];

            hookData.cell.styles.fontStyle =
              "bold";

          } else if (
            item?.type === "Expense"
          ) {

            hookData.cell.styles.textColor =
              [220, 38, 38];

            hookData.cell.styles.fontStyle =
              "bold";

          }

        }

      }

  });

  // FOOTER

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

  doc.save(
    "Finance_Ledger_Report.pdf"
  );

}


const reports = [
  {
    id: "customers",
    title: "Customers",
    icon: Users,
    color: "blue",
  },
  {
    id: "projects",
    title: "Projects",
    icon: FolderKanban,
    color: "emerald",
  },
  {
    id: "inventory",
    title: "Inventory",
    icon: Boxes,
    color: "purple",
  },
  {
    id: "payments",
    title: "Payments",
    icon: IndianRupee,
    color: "amber",
  },
  {
    id: "profit",
    title: "Profit",
    icon: IndianRupee,
    color: "green",
  },
{
  id: "finance",
  title: "Finance Ledger",
  icon: IndianRupee,
  color: "red",
},

{
  id: "investment",
  title: "Investment",
  icon: IndianRupee,
  color: "blue",
},

];

return (
  <div className="p-5 bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 min-h-screen">

    {/* ================= HEADER ================= */}

    <div className="mb-6 rounded-3xl bg-gradient-to-r from-violet-700 via-indigo-600 to-blue-500 p-6 shadow-2xl">

      <div className="flex items-center justify-between">

        <div>
          <h1 className="text-4xl font-extrabold tracking-wide text-white">
            Reports & Analytics
          </h1>

          <p className="mt-2 text-blue-100">
            View, analyse and export all business reports from one place.
          </p>
        </div>

        <div className="rounded-2xl bg-white/20 px-6 py-4 text-center backdrop-blur">
          <p className="text-4xl font-bold text-white">
            {reports.length}
          </p>

          <p className="text-sm text-blue-100">
            Available Reports
          </p>
        </div>

      </div>

    </div>

    {/* ================= REPORT CARDS ================= */}

    <div className="grid grid-cols-5 gap-4 mb-6">

      {reports.map((report) => {

        const Icon = report.icon;

        return (

          <button
            key={report.id}
            onClick={() => {

              setSelectedReport(report.id);

              if (report.id === "customers") loadCustomers();
              if (report.id === "projects") loadProjects();
              if (report.id === "inventory") loadInventory();
              if (report.id === "payments") loadPayments();
              if (report.id === "profit") loadProfit();
              if (report.id === "finance") loadFinanceLedger();
              if (report.id === "investment") loadInvestments();

            }}
            className={`
              rounded-2xl
              p-3
              text-left
              text-white
              shadow-lg
              transition-all
              duration-300
              hover:-translate-y-1
              hover:shadow-2xl

              ${
                report.color === "blue"
                  ? "bg-gradient-to-br from-sky-600 to-blue-700"
                  : report.color === "emerald"
                  ? "bg-gradient-to-br from-emerald-600 to-green-700"
                  : report.color === "amber"
                  ? "bg-gradient-to-br from-orange-500 to-amber-600"
                  : report.color === "purple"
                  ? "bg-gradient-to-br from-purple-600 to-violet-700"
                  : "bg-gradient-to-br from-green-600 to-emerald-700"
              }

              ${
                selectedReport === report.id
                  ? "ring-4 ring-white scale-105"
                  : ""
              }
            `}
          >

            <Icon size={34} className="mb-2" />

            <h3 className="text-sm font-bold">
              {report.title}
            </h3>

          </button>

        );

      })}

    </div>

    {/* ================= TOOLBAR ================= */}

    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl px-5 py-4 mb-6">

      <div className="flex items-center justify-between">

        <div className="relative w-80">

          <Search
            className="absolute left-3 top-3 text-gray-400"
            size={18}
          />

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search report..."
            className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 pl-10 pr-4 py-2 outline-none focus:border-indigo-500 focus:bg-white"
          />

        </div>

        <div className="flex gap-3">

          <button
            onClick={async () => {

  try {

    if (selectedReport === "customers") {
      await exportCustomerCSV(filteredCustomers);
    }


    if (selectedReport === "projects") {
      await exportProjectExcel(filteredProjects);
    }


    if (selectedReport === "inventory") {

      const usedData = await getUsedInventory();

      console.log(
        "Inventory Export Data:",
        filteredInventory
      );

      console.log(
        "Used Inventory Export Data:",
        usedData
      );


      await exportInventoryCSV(
        filteredInventory,
        usedData
      );

    }


    if (selectedReport === "payments") {
      await exportPaymentCSV(filteredPayments);
    }


    if (selectedReport === "profit") {
      await exportProfitCSV(filteredProfit);
    }

   if (selectedReport === "finance") {

  await exportFinanceLedgerExcel(
    financeLedgerReport
  );

}

if (selectedReport === "investment") {

  await exportInvestmentExcel(
    filteredInvestments
  );

}

  } catch(error) {

    console.error(
      "EXCEL EXPORT ERROR:",
      error
    );

    alert(
      "Excel Export Failed. Check Console."
    );

  }

}}
            disabled={!selectedReport}
            className="flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-white shadow hover:bg-green-700 disabled:opacity-40"
          >

            <Download size={18} />

            Excel

          </button>

 <button
  onClick={async () => {

    try {

      if (selectedReport === "customers") {
        await exportCustomerPDF(filteredCustomers);
      }

      if (selectedReport === "projects") {
        await exportProjectPDF(filteredProjects);
      }

      if (selectedReport === "inventory") {
        await exportInventoryPDF(filteredInventory);
      }

      if (selectedReport === "payments") {
        await exportPaymentPDF(filteredPayments);
      }

      if (selectedReport === "profit") {
        await exportProfitPDF(filteredProfit);
      }

      if (selectedReport === "finance") {

  await exportFinanceLedgerPDF(
    financeLedgerReport
  );

}

if (selectedReport === "investment") {

  await exportInvestmentPDF(
    filteredInvestments
  );

}

    } catch (error) {

      console.error(
        "PDF EXPORT ERROR:",
        error
      );

      alert(
        "PDF Export Failed. Check Console."
      );

    }

  }}
  disabled={!selectedReport}
  className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-white shadow hover:bg-red-700 disabled:opacity-40"
>
  <FileText size={18} />
  PDF
</button>
           

        </div>

      </div>

    </div>

        {/* ================= REPORT VIEWER ================= */}

    <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden min-h-[550px]">

      {!selectedReport ? (

        <div className="flex items-center justify-center h-[500px] text-gray-400 text-xl">
          Select a report to view.
        </div>

      ) : (

        <div className="p-5">

          {/* REPORT HEADER */}

          <div className="flex items-center justify-between mb-5 rounded-2xl bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 px-5 py-3">

            <div>

              <h2 className="text-2xl font-bold text-white">

                {selectedReport === "profit"
                  ? "Profit Report"
                  : reports.find((r) => r.id === selectedReport)?.title}

              </h2>

              <p className="text-slate-300 text-sm">
                Live Report Data
              </p>

            </div>

            <div>

              {selectedReport === "customers" && (

                <div className="rounded-xl bg-blue-600 px-5 py-2 text-white font-semibold">
                  Total Customers : {filteredCustomers.length}
                </div>

              )}

              {selectedReport === "projects" && (

                <div className="rounded-xl bg-emerald-600 px-5 py-2 text-white font-semibold">
                  Total Projects : {filteredProjects.length}
                </div>

              )}

              {selectedReport === "inventory" && (

                <div className="rounded-xl bg-purple-600 px-5 py-2 text-white font-semibold">
                  Total Items : {filteredInventory.length}
                </div>

              )}

              {selectedReport === "payments" && (

                <div className="rounded-xl bg-amber-600 px-5 py-2 text-white font-semibold">
                  Total Payments : {filteredPayments.length}
                </div>

              )}

              {selectedReport === "profit" && (

                <div className="rounded-xl bg-green-600 px-5 py-2 text-white font-semibold">

                  Overall Profit :
                  ₹{" "}
                  {filteredProfit
                    .reduce(
                      (sum, item) => sum + Number(item.profit_amount || 0),
                      0
                    )
                    .toLocaleString()}

                </div>

              )}

            </div>

          </div>

          {selectedReport === "finance" && (

  <div className="rounded-xl bg-red-600 px-5 py-2 text-white font-semibold">

    Closing Balance : ₹{" "}

    {financeLedgerReport
      .length > 0
      ? Number(
          financeLedgerReport[0].runningBalance || 0
        ).toLocaleString("en-IN")
      : "0"}

  </div>

)}

{selectedReport === "investment" && (

  <div className="rounded-xl bg-blue-600 px-5 py-2 text-white font-semibold">

    Total Investment : ₹{" "}

    {filteredInvestments
      .reduce(
        (sum, item) =>
          sum + Number(item.amount || 0),
        0
      )
      .toLocaleString("en-IN")}

  </div>

)}

          {/* ================= CUSTOMER REPORT ================= */}

{selectedReport === "customers" && (

  <div className="space-y-5">

    {/* ================= CUSTOMER SUMMARY ================= */}

    <div className="overflow-x-auto rounded-2xl border border-slate-300 shadow-lg">

      <table className="min-w-full border-collapse text-sm">

        <thead className="bg-violet-600 text-white">

          <tr>

            <th className="border border-black p-3 text-center">
              Total Customers
            </th>

            <th className="border border-black p-3 text-center">
              Cash Customers
            </th>

            <th className="border border-black p-3 text-center">
              Finance Customers
            </th>

            <th className="border border-black p-3 text-center">
              Total Project Value
            </th>

            <th className="border border-black p-3 text-center">
              Total Received
            </th>

            <th className="border border-black p-3 text-center">
              Total Pending Amount
            </th>

          </tr>

        </thead>

        <tbody>

          <tr>

            <td className="border border-black p-3 text-center font-bold">
              {filteredCustomers.length}
            </td>

            <td className="border border-black p-3 text-center font-bold">
              {
                filteredCustomers.filter(
                  (customer) =>
                    String(
                      customer.payment_type || ""
                    ).toLowerCase() === "cash"
                ).length
              }
            </td>

            <td className="border border-black p-3 text-center font-bold">
              {
                filteredCustomers.filter(
                  (customer) =>
                    String(
                      customer.payment_type || ""
                    ).toLowerCase() === "finance"
                ).length
              }
            </td>

            <td className="border border-black p-3 text-center font-bold">
              ₹{" "}
              {filteredCustomers
                .reduce(
                  (sum, customer) =>
                    sum +
                    Number(
                      customer.total_amount ||
                        customer.total_cost ||
                        0
                    ),
                  0
                )
                .toLocaleString("en-IN")}
            </td>

            <td className="border border-black p-3 text-center font-bold text-green-700">
              ₹{" "}
              {filteredCustomers
                .reduce(
                  (sum, customer) =>
                    sum +
                    Number(
                      customer.received || 0
                    ),
                  0
                )
                .toLocaleString("en-IN")}
            </td>

            <td className="border border-black p-3 text-center font-bold text-red-700">
              ₹{" "}
              {filteredCustomers
                .reduce(
                  (sum, customer) =>
                    sum +
                    Number(
                      customer.remaining ??
                        (
                          Number(
                            customer.total_amount ||
                              customer.total_cost ||
                              0
                          ) -
                          Number(
                            customer.received || 0
                          )
                        )
                    ),
                  0
                )
                .toLocaleString("en-IN")}
            </td>

          </tr>

        </tbody>

      </table>

    </div>

    {/* ================= CUSTOMER DATA TABLE ================= */}

    <div className="overflow-x-auto rounded-2xl border border-slate-300 shadow-xl bg-white">

      <table className="min-w-full border-collapse text-sm">

        <thead className="bg-blue-600 text-white">

          <tr>

            <th className="border border-black p-3 text-center">
              S.No
            </th>

            <th className="border border-black p-3 text-center">
              Project No
            </th>

            <th className="border border-black p-3 text-center">
              Customer Name
            </th>

            <th className="border border-black p-3 text-center">
              Mobile
            </th>

            <th className="border border-black p-3 text-center">
              Payment Type
            </th>

            <th className="border border-black p-3 text-center">
              Plant Size (KW)
            </th>

            <th className="border border-black p-3 text-center">
              Total Cost
            </th>

            <th className="border border-black p-3 text-center">
              Received
            </th>

            <th className="border border-black p-3 text-center">
              Remaining
            </th>

            <th className="border border-black p-3 text-center">
              Status
            </th>

          </tr>

        </thead>

        <tbody>

          {filteredCustomers.length === 0 ? (

            <tr>

              <td
                colSpan="10"
                className="border border-black text-center py-6"
              >
                No Customers Found
              </td>

            </tr>

          ) : (

            filteredCustomers.map(
              (customer, index) => {

                const totalCost =
                  Number(
                    customer.total_amount ||
                      customer.total_cost ||
                      0
                  );

                const received =
                  Number(
                    customer.received || 0
                  );

                const remaining =
                  customer.remaining !==
                    undefined &&
                  customer.remaining !==
                    null
                    ? Number(
                        customer.remaining
                      )
                    : totalCost -
                      received;

                const plantSize =
                  customer.plant_size ??
                  customer.project_size ??
                  "";

                return (

                  <tr
                    key={customer.id}
                    className="hover:bg-blue-50"
                  >

                    {/* S.NO */}

                    <td className="border border-black p-3 text-center">
                      {index + 1}
                    </td>

                    {/* PROJECT NO */}

                    <td className="border border-black p-3 text-center">
                      {customer.project_no || "-"}
                    </td>

                    {/* CUSTOMER NAME */}

                    <td className="border border-black p-3 text-center">
                      {customer.customer_name || "-"}
                    </td>

                    {/* MOBILE */}

                    <td className="border border-black p-3 text-center">
                      {customer.mobile || "-"}
                    </td>

                    {/* PAYMENT TYPE */}

                    <td className="border border-black p-3 text-center">
                      {customer.payment_type || "-"}
                    </td>

                    {/* PLANT SIZE */}

                    <td className="border border-black p-3 text-center">
                      {plantSize
                        ? String(plantSize).toLowerCase().includes("kw")
                          ? plantSize
                          : `${plantSize} KW`
                        : "-"}
                    </td>

                    {/* TOTAL COST */}

                    <td className="border border-black p-3 text-center font-semibold">
                      ₹{" "}
                      {totalCost.toLocaleString(
                        "en-IN"
                      )}
                    </td>

                    {/* RECEIVED */}

                    <td className="border border-black p-3 text-center font-semibold text-green-700">
                      ₹{" "}
                      {received.toLocaleString(
                        "en-IN"
                      )}
                    </td>

                    {/* REMAINING */}

                    <td className="border border-black p-3 text-center font-semibold text-red-700">
                      ₹{" "}
                      {remaining.toLocaleString(
                        "en-IN"
                      )}
                    </td>

                    {/* STATUS */}

                    <td className="border border-black p-3 text-center">

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          customer.status ===
                          "Completed"
                            ? "bg-green-100 text-green-700"
                            : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {customer.status ||
                          "-"}
                      </span>

                    </td>

                  </tr>

                );

              }
            )

          )}

        </tbody>

      </table>

    </div>

  </div>

)}  

          {/* ================= PROJECT REPORT ================= */}

{selectedReport === "projects" && (

  <div className="overflow-x-auto rounded-2xl border border-slate-300">

    <table className="min-w-full border-collapse border border-black text-sm">

      <thead className="bg-emerald-600 text-white">

        <tr>

          <th className="border border-black p-3 text-center">S.No</th>
          <th className="border border-black p-3 text-center">Project No</th>
          <th className="border border-black p-3 text-center">Customer</th>
          
          <th className="border border-black p-3 text-center">Plant Size</th>
          <th className="border border-black p-3 text-center">Total Amount</th>
          <th className="border border-black p-3 text-center">Received</th>
          <th className="border border-black p-3 text-center">Remaining</th>
          <th className="border border-black p-3 text-center">Status</th>

        </tr>

      </thead>

      <tbody>

        {filteredProjects.length === 0 ? (

          <tr>

            <td
              colSpan="8"
              className="text-center py-6"
            >
              No Projects Found
            </td>

          </tr>

        ) : (

          filteredProjects.map((project, index) => (

            <tr
              key={project.id}
               className="hover:bg-emerald-50"
            >

              <td className="border border-black p-3 text-center">
                {index + 1}
              </td>

              <td className="border border-black p-3 text-center">
                {project.project_no}
              </td>

              <td className="border border-black p-3 text-center">
                {project.customers?.customer_name || "-"}
              </td>

              

              <td className="border border-black p-3 text-center">
                {project.project_size}
              </td>

              <td className="border border-black p-3 text-center">
                ₹ {Number(project.total_amount || 0).toLocaleString()}
              </td>

              <td className="border border-black p-3 text-green-700 font-semibold text-center">
                ₹ {Number(project.received || 0).toLocaleString()}
              </td>

              <td className="border border-black p-3 text-center text-red-700 font-semibold">
                ₹ {Number(project.remaining || 0).toLocaleString()}
              </td>

              <td className="border border-black p-3 text-center">

                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    project.status === "Completed"
                      ? "bg-green-100 text-green-700"
                      : "bg-orange-100 text-orange-700"
                  }`}
                >
                  {project.status}
                </span>

              </td>

            </tr>

          ))

        )}

      </tbody>

    </table>

  </div>

)}

{/* ================= INVENTORY REPORT ================= */}

{selectedReport === "inventory" && (

  <div className="overflow-x-auto rounded-2xl border border-slate-300 shadow-xl bg-white">

    <table className="min-w-full border-collapse border border-black text-sm">

      <thead className="bg-purple-600 text-white">

        <tr>

          <th className="p-3 border border-black">S.No</th>
<th className="p-3 border border-black">Product</th>
<th className="p-3 border border-black">Category</th>
<th className="p-3 border border-black">Quantity</th>
<th className="p-3 border border-black">Unit</th>
<th className="p-3 border border-black">Price</th>
<th className="p-3 border border-black">GST %</th>
<th className="p-3 border border-black">Total</th>
<th className="p-3 border border-black">Unit Price</th>

        </tr>

      </thead>

      <tbody>

        {filteredInventory.length === 0 ? (

          <tr>

            <td
              colSpan="8"
              className="text-center py-6"
            >
              No Inventory Found
            </td>

          </tr>

        ) : (

          filteredInventory.map((item, index) => (

            <tr
 key={item.id}
 className="hover:bg-purple-50"
>

              <td className="p-3 border border-black text-center">
 {index + 1}
</td>

<td className="p-3 border border-black text-center">
 {item.product_name}
</td>

<td className="p-3 border border-black text-center">
 {item.category}
</td>

<td className="p-3 border border-black text-center">
 {item.quantity}
</td>

<td className="p-3 border border-black text-center">
 {item.unit}
</td>

<td className="p-3 border border-black text-center">
 ₹ {Number(item.price || 0).toLocaleString()}
</td>

<td className="p-3 border border-black text-center">
 {Number(item.cgst || 0) + Number(item.sgst || 0)}%
</td>

<td className="p-3 border border-black text-center">
 ₹ {Number(item.total_amount || 0).toLocaleString()}
</td>

<td className="p-3 border border-black text-center">
 ₹ {Number(item.unit_cost || 0).toLocaleString()}
</td>

            </tr>

          ))

        )}

      </tbody>

    </table>

  </div>

)}

{/* ================= PAYMENTS REPORT ================= */}

{selectedReport === "payments" && (

  <div className="overflow-x-auto rounded-2xl border border-slate-300 shadow-xl bg-white">

    <table className="min-w-full border-collapse text-sm">

      <thead className="bg-amber-600 text-white">

        <tr>

  <th className="p-3 border border-black text-center">
    S.No
  </th>

  <th className="p-3 border border-black text-center">
    Date
  </th>

  <th className="p-3 border border-black text-center">
    Project No
  </th>

  <th className="p-3 border border-black text-center">
    Customer
  </th>

  <th className="p-3 border border-black text-center">
    Payment Type
  </th>

  <th className="p-3 border border-black text-center">
    Payment Mode
  </th>

  <th className="p-3 border border-black text-center">
    Amount
  </th>

  <th className="p-3 border border-black text-center">
    Reference No
  </th>

</tr>

      </thead>

      <tbody>

        {filteredPayments.length === 0 ? (

          <tr>

            <td
              colSpan="8"
              className="text-center py-6"
            >
              No Payments Found
            </td>

          </tr>

        ) : (

          filteredPayments.map((payment, index) => (

            <tr
  key={payment.id}
  className="hover:bg-amber-50"
>

              <td className="p-3 border border-black text-center">
                {index + 1}
              </td>

              <td className="p-3 border border-black text-center">

                {payment.payment_date
                  ? new Date(payment.payment_date).toLocaleDateString(
                      "en-GB",
                      {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      }
                    )
                  : "-"}

              </td>

              <td className="p-3 border border-black text-center">
  {payment.projects?.project_no || "-"}
</td>

<td className="p-3 border border-black text-center">
  {payment.projects?.customers?.customer_name || "-"}
</td>

              <td className="p-3 border border-black text-center">
                {payment.payment_type || "-"}
              </td>

              <td className="p-3 border border-black text-center">
                {payment.payment_mode || "-"}
              </td>

              <td className="p-3 border border-black text-cente font-semibold text-green-700">
                ₹ {Number(payment.amount || 0).toLocaleString()}
              </td>

              <td className="p-3 border border-black text-center">
                {payment.reference_no || "-"}
              </td>

            </tr>

          ))

        )}

      </tbody>

    </table>

  </div>

)}





{/* ================= FINANCE LEDGER REPORT ================= */}

{selectedReport === "finance" && (

  <div className="overflow-x-auto rounded-2xl border border-slate-300 shadow-xl bg-white">

    <table className="min-w-full border-collapse text-sm">

      <thead className="bg-red-600 text-white">

        <tr>

          <th className="p-3 border border-black text-center">
            Date
          </th>

          <th className="p-3 border border-black text-center">
            Type
          </th>

          <th className="p-3 border border-black text-center">
            Company
          </th>

          <th className="p-3 border border-black text-center">
            Paid By
          </th>

          <th className="p-3 border border-black text-center">
            Mode
          </th>

          <th className="p-3 border border-black text-center">
            Payment Type
          </th>

          <th className="p-3 border border-black text-center">
            Running Balance
          </th>

          <th className="p-3 border border-black text-center">
            Remarks
          </th>

        </tr>

      </thead>

      <tbody>

        {financeLedgerReport.length === 0 ? (

          <tr>

            <td
              colSpan="8"
              className="p-6 border border-black text-center text-gray-500"
            >
              No Finance Ledger Entries Found
            </td>

          </tr>

        ) : (

          financeLedgerReport.map(
            (item, index) => (

              <tr
                key={item.id || index}
                className="hover:bg-red-50"
              >

                {/* ================= DATE ================= */}

                <td className="p-3 border border-black text-center">

                  {item.date
                    ? new Date(
                        item.date
                      ).toLocaleDateString(
                        "en-GB",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }
                      ).replaceAll(" ", "-")
                    : "-"
                  }

                </td>


                {/* ================= TYPE ================= */}

                <td className="p-3 border border-black text-center">

                  {item.type || "-"}

                </td>


                {/* ================= COMPANY ================= */}

                <td className="p-3 border border-black text-center">

                  {item.company || "-"}

                </td>


                {/* ================= PAID BY ================= */}

                <td className="p-3 border border-black text-center">

                  {item.paid_by || "-"}

                </td>


                {/* ================= MODE ================= */}

                <td className="p-3 border border-black text-center">

                  {item.payment_mode || "-"}

                </td>


                {/* ================= PAYMENT TYPE ================= */}
                {/*
                   Amount only.
                   Income = GREEN
                   Expense = RED
                */}

                <td
                  className={`p-3 border border-black text-center font-bold ${
                    item.type === "Income"
                      ? "text-green-700"
                      : "text-red-700"
                  }`}
                >

                  ₹{" "}
                  {Number(
  item.amount || 0
).toLocaleString("en-IN")}

                </td>


                {/* ================= RUNNING BALANCE ================= */}

                <td className="p-3 border border-black text-center font-semibold">

                  ₹{" "}
                  {Number(
                    item.runningBalance || 0
                  ).toLocaleString("en-IN")}

                </td>


                {/* ================= REMARKS ================= */}

                <td className="p-3 border border-black text-center">

                  {item.remarks || "-"}

                </td>

              </tr>

            )
          )

        )}

      </tbody>

    </table>

  </div>

)}

{/* ================= INVESTMENT LIVE REPORT ================= */}

{selectedReport === "investment" && (

  <div className="overflow-x-auto rounded-2xl border border-slate-300 shadow-xl bg-white">

    <table className="min-w-full border-collapse text-sm">

      <thead className="bg-blue-600 text-white">

        <tr>

          <th className="p-3 border border-black text-center">
            Date
          </th>

          <th className="p-3 border border-black text-center">
            Investor
          </th>

          <th className="p-3 border border-black text-center">
            Investment Type
          </th>

          <th className="p-3 border border-black text-center">
            Party / Name
          </th>

          <th className="p-3 border border-black text-center">
            Amount
          </th>

          <th className="p-3 border border-black text-center">
            Payment Mode
          </th>

          <th className="p-3 border border-black text-center">
            Description
          </th>

        </tr>

      </thead>

      <tbody>

        {filteredInvestments.length === 0 ? (

          <tr>

            <td
              colSpan="7"
              className="p-6 border border-black text-center text-gray-500"
            >
              No Investment Records Found
            </td>

          </tr>

        ) : (

          filteredInvestments.map((investment, index) => {

            /* ================================
               INVESTOR
            ================================= */

            const investorName =
              investment.partners?.partner_name || "-";


            /* ================================
               PARTY / NAME
            ================================= */

            const partyName =
              investment.investment_type === "Dealer Payment"
                ? investment.dealer_name || "-"
                : investment.investment_type === "Vendor Payment"
                ? investment.vendor_name || "-"
                : "-";


            /* ================================
               DESCRIPTION
            ================================= */

            const description =
              investment.purpose || "-";


            return (

              <tr
                key={investment.id || index}
                className="hover:bg-blue-50"
              >

                {/* ================= DATE ================= */}

                <td className="p-3 border border-black text-center text-black">

                  {investment.investment_date
                    ? new Date(
                        `${investment.investment_date}T00:00:00`
                      ).toLocaleDateString(
                        "en-IN",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }
                      )
                    : "-"
                  }

                </td>


                {/* ================= INVESTOR ================= */}

                <td className="p-3 border border-black text-center text-black font-semibold">

                  {investorName}

                </td>


                {/* ================= INVESTMENT TYPE ================= */}

                <td className="p-3 border border-black text-center text-black">

                  {investment.investment_type || "-"}

                </td>


                {/* ================= PARTY / NAME ================= */}

                <td className="p-3 border border-black text-center text-black">

                  {partyName}

                </td>


                {/* ================= AMOUNT ================= */}

                <td className="p-3 border border-black text-center font-bold text-green-700">

                  ₹{" "}
                  {Number(
                    investment.amount || 0
                  ).toLocaleString("en-IN")}

                </td>


                {/* ================= PAYMENT MODE ================= */}

                <td className="p-3 border border-black text-center text-black">

                  {investment.payment_mode || "-"}

                </td>


                {/* ================= DESCRIPTION ================= */}

                <td className="p-3 border border-black text-center text-black">

                  {description}

                </td>

              </tr>

            );

          })

        )}

      </tbody>

    </table>

  </div>

)}

{/* ================= PROFIT REPORT ================= */}

{selectedReport === "profit" && (

  <div className="overflow-x-auto rounded-2xl border border-slate-300 shadow-xl bg-white">

    <table className="min-w-full border-collapse text-sm">

      <thead className="bg-gradient-to-r from-green-700 to-emerald-600 text-white">

        <tr>

          <th className="border border-black p-3 text-center">S.No</th>
          <th className="border border-black p-3 text-center">Project No</th>
          <th className="border border-black p-3 text-center">Customer</th>
          <th className="border border-black p-3 text-center">Plant Size</th>
          <th className="border border-black p-3 text-center">Selling Amount</th>
          <th className="border border-black p-3 text-center">Material Cost</th>
          <th className="border border-black p-3 text-center">Other Cost</th>
          <th className="border border-black p-3 text-center">Total Cost</th>
          <th className="border border-black p-3 text-center">Profit</th>
          <th className="border border-black p-3 text-center">Profit %</th>

        </tr>

      </thead>

      <tbody>

        {filteredProfit.length === 0 ? (

          <tr>

            <td
  colSpan="10"
  className="border border-black text-center py-6"
>
  No Profit Data Found
</td>

          </tr>

        ) : (

          filteredProfit.map((item, index) => (

            <tr
              key={item.id}
              className="hover:bg-green-50"
            >

              <td className="p-3 border border-black text-center">
                {index + 1}
              </td>

              <td className="p-3 border border-black text-center">
                {item.project_no}
              </td>

              <td className="p-3 border border-black text-center">
                {item.customer_name}
              </td>

              <td className="p-3 border border-black text-center">
                {item.project_size}
              </td>

              <td className="p-3 border border-black text-center">
                ₹ {Number(item.selling_amount || 0).toLocaleString()}
              </td>

              <td className="p-3 border border-black text-center">
                ₹ {Number(item.material_cost || 0).toLocaleString()}
              </td>

              <td className="p-3 border border-black text-center">
                ₹ {Number(item.other_cost || 0).toLocaleString()}
              </td>

              <td className="p-3 border border-black text-center">
                ₹ {Number(item.total_cost || 0).toLocaleString()}
              </td>

              <td className="p-3 border border-black text-center font-bold text-green-700">
                ₹ {Number(item.profit_amount || 0).toLocaleString()}
              </td>

              <td className="p-3 border border-black text-center">
                {item.profit_percent}%
              </td>

            </tr>

          ))

        )}

      </tbody>

    </table>

  </div>

)}

        </div>

      )}

    </div>

  </div>
);



}