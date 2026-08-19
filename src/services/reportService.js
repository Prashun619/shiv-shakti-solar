import { supabase } from "./supabase";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

// =====================================================
// GET PROJECT REPORT
// =====================================================

export async function getProjectReport() {
  const { data, error } = await supabase
    .from("projects")
    .select(`
      id,
      project_no,
      project_date,
      project_size,
      status,
      total_amount,
      received,
      customers (
        customer_name
      )
    `)
    .order("id", { ascending: true });

  if (error) throw error;

  return (data || []).map((project) => ({
    ...project,

    remaining:
      Number(project.total_amount || 0) -
      Number(project.received || 0),
  }));
}

// =====================================================
// GET CUSTOMER REPORT
// =====================================================

export async function getCustomerReport() {

  // ===================================================
  // GET CUSTOMERS
  // ===================================================

  const { data: customers, error: customerError } =
    await supabase
      .from("customers")
      .select(`
        id,
        customer_name,
        mobile,
        payment_type,
        plant_size
      `)
      .order("id", { ascending: true });

  if (customerError) {
    throw customerError;
  }

  if (!customers || customers.length === 0) {
    return [];
  }

  // ===================================================
  // GET ALL PROJECTS
  // IMPORTANT:
  // Match projects using projects.customer_id
  // instead of customers.project_id
  // ===================================================

  const customerIds = customers.map(
    (customer) => customer.id
  );

  const { data: projects, error: projectError } =
    await supabase
      .from("projects")
      .select(`
        id,
        customer_id,
        project_no,
        project_size,
        total_amount,
        received,
        status
      `)
      .in("customer_id", customerIds)
      .order("id", { ascending: true });

  if (projectError) {
    throw projectError;
  }

  // ===================================================
  // CREATE CUSTOMER → PROJECT MAP
  // ===================================================

  const projectMap = new Map();

  (projects || []).forEach((project) => {

    projectMap.set(
      project.customer_id,
      project
    );

  });

  // ===================================================
  // BUILD CUSTOMER REPORT
  // ===================================================

  return customers.map((customer) => {

    const project =
      projectMap.get(customer.id);

    // -----------------------------------------------
    // TOTAL PROJECT VALUE
    // -----------------------------------------------

    const totalAmount =
      Number(
        project?.total_amount || 0
      );

    // -----------------------------------------------
    // RECEIVED
    // -----------------------------------------------

    const received =
      Number(
        project?.received || 0
      );

    // -----------------------------------------------
    // REMAINING
    // -----------------------------------------------

    const remaining =
      totalAmount - received;

    // -----------------------------------------------
    // RETURN COMPLETE REPORT ROW
    // -----------------------------------------------

    return {

      // Customer information
      id: customer.id,

      customer_name:
        customer.customer_name || "",

      mobile:
        customer.mobile || "",

      payment_type:
        customer.payment_type || "",

      plant_size:
        project?.project_size ??
        customer.plant_size ??
        "",

      // Project information
      project_no:
        project?.project_no || "",

      project_size:
        project?.project_size ??
        customer.plant_size ??
        "",

      // Financial information
      total_amount:
        totalAmount,

      total_cost:
        totalAmount,

      received:
        received,

      remaining:
        remaining,

      // Project status
      status:
        project?.status || "",
    };
  });
}

// =====================================================
// PROJECT PDF REPORT
// =====================================================

export function exportProjectReport(projects = []) {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  // ===================================================
  // SUMMARY CALCULATIONS
  // ===================================================

  const totalProjectValue = projects.reduce(
    (sum, project) =>
      sum + num(project.total_amount),
    0
  );

  const totalReceived = projects.reduce(
    (sum, project) =>
      sum + num(project.received),
    0
  );

  const totalPendingAmount =
    totalProjectValue - totalReceived;

  // ===================================================
  // COMPANY HEADER
  // ===================================================

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");

  doc.text(
    "SHIV SHAKTI SOLAR ENERGY",
    148,
    12,
    { align: "center" }
  );

  // ===================================================
  // REPORT TITLE
  // ===================================================

  doc.setFontSize(14);

  doc.text(
    "PROJECT REPORT",
    148,
    21,
    { align: "center" }
  );

  // ===================================================
  // SUMMARY
  // ===================================================

  autoTable(doc, {
    startY: 28,

    head: [[
      "TOTAL PROJECT VALUE",
      "TOTAL RECEIVED",
      "TOTAL PENDING AMOUNT",
    ]],

    body: [[
      `₹${formatMoney(totalProjectValue)}`,
      `₹${formatMoney(totalReceived)}`,
      `₹${formatMoney(totalPendingAmount)}`,
    ]],

    theme: "grid",

    styles: {
      fontSize: 10,
      halign: "center",
      valign: "middle",
      cellPadding: 4,
    },

    headStyles: {
      fontStyle: "bold",
      halign: "center",
      valign: "middle",
    },

    bodyStyles: {
      halign: "center",
      valign: "middle",
    },

    columnStyles: {
      0: {
        cellWidth: 80,
      },
      1: {
        cellWidth: 80,
      },
      2: {
        cellWidth: 80,
      },
    },
  });

  // ===================================================
  // PROJECT PAYMENT SUMMARY TITLE
  // ===================================================

  let nextY =
    doc.lastAutoTable.finalY + 10;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");

  doc.text(
    "PROJECT PAYMENT SUMMARY",
    148,
    nextY,
    { align: "center" }
  );

  // ===================================================
  // PROJECT PAYMENT SUMMARY TABLE
  // ===================================================

  const projectRows = projects.map(
    (project) => {
      const totalCost =
        num(project.total_amount);

      const received =
        num(project.received);

      const remaining =
        totalCost - received;

      return [
        project.project_no || "",
        `₹${formatMoney(totalCost)}`,
        `₹${formatMoney(received)}`,
        `₹${formatMoney(remaining)}`,
        project.status || "",
      ];
    }
  );

  autoTable(doc, {
    startY: nextY + 5,

    head: [[
      "Project No",
      "Total Cost",
      "Received",
      "Remaining",
      "Status",
    ]],

    body: projectRows,

    theme: "grid",

    styles: {
      fontSize: 9,
      halign: "center",
      valign: "middle",
      cellPadding: 3,
      overflow: "visible",
    },

    headStyles: {
      fontStyle: "bold",
      halign: "center",
      valign: "middle",
    },

    bodyStyles: {
      halign: "center",
      valign: "middle",
    },

    columnStyles: {
      0: {
        cellWidth: 45,
      },

      1: {
        cellWidth: 50,
      },

      2: {
        cellWidth: 50,
      },

      3: {
        cellWidth: 50,
      },

      4: {
        cellWidth: 50,
      },
    },

    margin: {
      left: 4,
      right: 4,
    },
  });

  // ===================================================
  // SAVE
  // ===================================================

  doc.save(
    "Project Report.pdf"
  );
}

// =====================================================
// NUMBER HELPER
// =====================================================

function num(value) {
  return Number(value || 0);
}

// =====================================================
// PLANT SIZE
// Add KW if it is not already present.
// =====================================================

function formatPlantSize(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "";
  }

  const text = String(value).trim();

  if (/kw$/i.test(text)) {
    return text;
  }

  return `${text} KW`;
}

// =====================================================
// FORMAT PROJECT NUMBER
// =====================================================

function formatProjectNumber(value) {
  if (!value) return "";

  const text = String(value).trim();

  // Already in correct format
  if (/^PRJ-\d{4}-\d{4}$/i.test(text)) {
    return text.toUpperCase();
  }

  // Extract numbers
  const numbers = text.match(/\d+/g);

  if (!numbers || numbers.length === 0) {
    return text;
  }

  const lastNumber = Number(numbers[numbers.length - 1]);

  const year =
    numbers.find((n) => n.length === 4) ||
    new Date().getFullYear();

  return `PRJ-${year}-${String(lastNumber).padStart(4, "0")}`;
}

// =====================================================
// FORMAT MONEY
// Exactly 2 decimal places
// =====================================================

function formatMoney(value) {
  return num(value).toFixed(2);
}

// =====================================================
// CUSTOMER EXCEL REPORT
// =====================================================

export async function exportCustomerCSV(
  customers = []
) {
  const workbook =
    new ExcelJS.Workbook();

  const sheet =
    workbook.addWorksheet(
      "Customer Report"
    );

  // ===================================================
  // SORT BY PROJECT NUMBER
  // ===================================================

  customers = [...customers].sort(
    (a, b) => {
      const aNo = Number(
        String(a.project_no || "")
          .replace(/\D/g, "")
      );

      const bNo = Number(
        String(b.project_no || "")
          .replace(/\D/g, "")
      );

      return aNo - bNo;
    }
  );

  // ===================================================
  // STYLES
  // ===================================================

  const thinBorder = {
    top: {
      style: "thin",
    },
    left: {
      style: "thin",
    },
    bottom: {
      style: "thin",
    },
    right: {
      style: "thin",
    },
  };

  const center = {
    horizontal: "center",
    vertical: "middle",
  };

  function styleHeader(cell) {
    cell.font = {
      bold: true,
      color: {
        argb: "FFFFFF",
      },
    };

    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: "1E3A8A",
      },
    };

    cell.alignment = center;
    cell.border = thinBorder;
  }

  function styleSummaryHeader(cell) {
    cell.font = {
      bold: true,
      color: {
        argb: "FFFFFF",
      },
    };

    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: "7C3AED",
      },
    };

    cell.alignment = center;
    cell.border = thinBorder;
  }

  function styleCell(cell) {
    cell.alignment = center;
    cell.border = thinBorder;
  }

  // ===================================================
  // COMPANY HEADER
  // ===================================================

  sheet.mergeCells("A1:J1");

  const company =
    sheet.getCell("A1");

  company.value =
    "SHIV SHAKTI SOLAR ENERGY";

  company.font = {
    size: 18,
    bold: true,
    color: {
      argb: "FFFFFF",
    },
  };

  company.alignment = center;

  company.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "1E3A8A",
    },
  };

  sheet.getRow(1).height = 32;

  // ===================================================
  // REPORT TITLE
  // ===================================================

  sheet.mergeCells("A2:J2");

  const title =
    sheet.getCell("A2");

  title.value =
    "CUSTOMER REPORT";

  title.font = {
    size: 14,
    bold: true,
    color: {
      argb: "000000",
    },
  };

  title.alignment = center;

  sheet.getRow(2).height = 24;

  // ===================================================
  // SUMMARY CALCULATIONS
  // ===================================================

  const totalCustomers =
    customers.length;

  const cashCustomers =
    customers.filter(
      (customer) =>
        String(
          customer.payment_type || ""
        ).toLowerCase() === "cash"
    ).length;

  const financeCustomers =
    customers.filter(
      (customer) =>
        String(
          customer.payment_type || ""
        ).toLowerCase() === "finance"
    ).length;

  const totalProjectValue =
    customers.reduce(
      (sum, customer) =>
        sum +
        Number(
          customer.total_amount ??
            customer.total_cost ??
            0
        ),
      0
    );

  const totalReceived =
    customers.reduce(
      (sum, customer) =>
        sum +
        Number(
          customer.received || 0
        ),
      0
    );

  const totalPending =
    customers.reduce(
      (sum, customer) => {
        const total =
          Number(
            customer.total_amount ??
              customer.total_cost ??
              0
          );

        const received =
          Number(
            customer.received || 0
          );

        const remaining =
          customer.remaining !==
            undefined &&
          customer.remaining !== null
            ? Number(
                customer.remaining
              )
            : total - received;

        return sum + remaining;
      },
      0
    );

  // ===================================================
  // SUMMARY
  // ===================================================

  // Empty row below title
  sheet.addRow([]);

  // ---------------------------------------------------
  // SUMMARY HEADERS
  // ---------------------------------------------------

  const summaryHeader =
    sheet.addRow([
      "TOTAL CUSTOMERS",
      "CASH CUSTOMERS",
      "FINANCE CUSTOMERS",
      "TOTAL PROJECT VALUE",
      "TOTAL RECEIVED",
      "TOTAL PENDING AMOUNT",
    ]);

  summaryHeader.eachCell(
    (cell) => {
      styleSummaryHeader(cell);
    }
  );

  summaryHeader.height = 26;

  // ---------------------------------------------------
  // SUMMARY VALUES
  // ---------------------------------------------------

  const summaryValues =
    sheet.addRow([
      totalCustomers,
      cashCustomers,
      financeCustomers,
      totalProjectValue,
      totalReceived,
      totalPending,
    ]);

  summaryValues.eachCell(
    (cell) => {
      styleCell(cell);
    }
  );

  summaryValues.height = 24;

  // Integer values
  summaryValues.getCell(1)
    .numFmt = "#,##0";

  summaryValues.getCell(2)
    .numFmt = "#,##0";

  summaryValues.getCell(3)
    .numFmt = "#,##0";

  // Money values
  summaryValues.getCell(4)
    .numFmt = "#,##0.00";

  summaryValues.getCell(5)
    .numFmt = "#,##0.00";

  summaryValues.getCell(6)
    .numFmt = "#,##0.00";

  // ===================================================
  // SPACE AFTER SUMMARY
  // ===================================================

  sheet.addRow([]);
  sheet.addRow([]);

  // ===================================================
  // MAIN TABLE HEADER
  // ===================================================

  const headerRow =
    sheet.addRow([
      "S.No",
      "Project No",
      "Customer Name",
      "Mobile",
      "Payment Type",
      "Plant Size",
      "Total Cost",
      "Received",
      "Remaining",
      "Status",
    ]);

  headerRow.eachCell(
    (cell) => {
      styleHeader(cell);
    }
  );

  headerRow.height = 26;

  // ===================================================
  // MAIN TABLE DATA
  // ===================================================

  customers.forEach(
    (customer, index) => {
      const totalCost =
        Number(
          customer.total_amount ??
            customer.total_cost ??
            0
        );

      const received =
        Number(
          customer.received || 0
        );

      const remaining =
        customer.remaining !==
          undefined &&
        customer.remaining !== null
          ? Number(
              customer.remaining
            )
          : totalCost - received;

      const row =
        sheet.addRow([
          index + 1,

          // PRJ-2026-0001
          formatProjectNumber(
            customer.project_no
          ),

          customer.customer_name ||
            "",

          customer.mobile ||
            "",

          customer.payment_type ||
            "",

          formatPlantSize(
            customer.project_size ??
              customer.plant_size
          ),

          totalCost,

          received,

          remaining,

          customer.status ||
            "",
        ]);

      row.eachCell(
        (cell) => {
          styleCell(cell);
        }
      );

      // S.No
      row.getCell(1)
        .numFmt = "0";

      // Money
      row.getCell(7)
        .numFmt = "#,##0.00";

      row.getCell(8)
        .numFmt = "#,##0.00";

      row.getCell(9)
        .numFmt = "#,##0.00";

      // =================================================
      // STATUS COLOR
      // =================================================

      const status =
        String(
          customer.status || ""
        ).toLowerCase();

      if (
        status === "completed"
      ) {
        row.getCell(10).font = {
          bold: true,
          color: {
            argb: "16A34A",
          },
        };
      }

      if (
        status === "pending"
      ) {
        row.getCell(10).font = {
          bold: true,
          color: {
            argb: "DC2626",
          },
        };
      }
    }
  );

  // ===================================================
  // COLUMN WIDTHS
  // ===================================================

  const widths = [
    8,   // S.No
    20,  // Project No
    28,  // Customer Name
    16,  // Mobile
    18,  // Payment Type
    15,  // Plant Size
    18,  // Total Cost
    18,  // Received
    18,  // Remaining
    16,  // Status
  ];

  sheet.columns.forEach(
    (column, index) => {
      column.width =
        widths[index] || 15;
    }
  );

  // ===================================================
  // FREEZE MAIN TABLE HEADER
  // ===================================================

  sheet.views = [
    {
      state: "frozen",
      ySplit: headerRow.number,
    },
  ];

  // ===================================================
  // DOWNLOAD
  // ===================================================

  const buffer =
    await workbook.xlsx.writeBuffer();

  saveAs(
    new Blob([buffer], {
      type:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    "Customer Report.xlsx"
  );
}