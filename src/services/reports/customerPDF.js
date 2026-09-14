import jsPDF from "jspdf";
import "jspdf-autotable";

// =====================================================
// HELPERS
// =====================================================

function num(value) {
  return Number(value || 0);
}

// =====================================================
// FORMAT PROJECT NUMBER
// PRJ-2026-0001
// =====================================================

function formatProjectNumber(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "";
  }

  const text = String(value).trim();

  // Already in correct format
  if (/^PRJ-\d{4}-\d{4}$/i.test(text)) {
    return text.toUpperCase();
  }

  // Extract all numbers
  const numbers = text.match(/\d+/g);

  if (!numbers || numbers.length === 0) {
    return text;
  }

  // If existing value is something like 1
  // create current-year project number
  if (numbers.length === 1) {
    const projectNumber = Number(numbers[0]);

    return `PRJ-${new Date().getFullYear()}-${String(
      projectNumber
    ).padStart(4, "0")}`;
  }

  // If something like 2026-1
  if (numbers.length >= 2) {
    const year = numbers[0];
    const projectNumber =
      numbers[numbers.length - 1];

    if (String(year).length === 4) {
      return `PRJ-${year}-${String(
        Number(projectNumber)
      ).padStart(4, "0")}`;
    }
  }

  return text;
}

// =====================================================
// FORMAT PLANT SIZE
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

  return `${text} kW`;
}

// =====================================================
// FORMAT MONEY
// =====================================================

function formatAmount(value) {
  return num(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// =====================================================
// EXPORT CUSTOMER PDF
// =====================================================

export function exportCustomerPDF(
  customers = []
) {
  // ---------------------------------------------------
  // SORT PROJECTS
  // ---------------------------------------------------

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

  // ---------------------------------------------------
  // PDF
  // ---------------------------------------------------

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth =
    doc.internal.pageSize.getWidth();

  // ===================================================
  // HEADER
  // ===================================================

  doc.setFillColor(
    30,
    58,
    138
  );

  doc.rect(
    0,
    0,
    pageWidth,
    28,
    "F"
  );

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(18);

  doc.setTextColor(
    255,
    255,
    255
  );

  doc.text(
    "SHIV SHAKTI SOLAR ENERGY",
    pageWidth / 2,
    11,
    {
      align: "center",
    }
  );

  doc.setFontSize(13);

  doc.text(
    "CUSTOMER REPORT",
    pageWidth / 2,
    20,
    {
      align: "center",
    }
  );

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
        num(
          customer.total_amount ??
            customer.total_cost
        ),
      0
    );

  const totalReceived =
    customers.reduce(
      (sum, customer) =>
        sum +
        num(customer.received),
      0
    );

  const totalPending =
    customers.reduce(
      (sum, customer) => {
        const total =
          num(
            customer.total_amount ??
              customer.total_cost
          );

        const received =
          num(customer.received);

        const remaining =
          customer.remaining !==
            undefined &&
          customer.remaining !== null
            ? num(
                customer.remaining
              )
            : total - received;

        return sum + remaining;
      },
      0
    );

  // ===================================================
  // SUMMARY TABLE
  // ===================================================

  doc.autoTable({
    startY: 34,

    head: [
      [
        "Total Customers",
        "Cash Customers",
        "Finance Customers",
        "Total Project Value",
        "Total Received",
        "Total Pending Amount",
      ],
    ],

    body: [
      [
        String(totalCustomers),
        String(cashCustomers),
        String(financeCustomers),
        `Rs. ${formatAmount(
          totalProjectValue
        )}`,
        `Rs. ${formatAmount(
          totalReceived
        )}`,
        `Rs. ${formatAmount(
          totalPending
        )}`,
      ],
    ],

    theme: "grid",

    headStyles: {
      fillColor: [
        124,
        58,
        237,
      ],
      textColor: 255,
      fontStyle: "bold",
      halign: "center",
      valign: "middle",
      fontSize: 9,
    },

    bodyStyles: {
      textColor: 0,
      fontSize: 9,
      halign: "center",
      valign: "middle",
    },

    styles: {
      cellPadding: 3,
      lineColor: [
        180,
        180,
        180,
      ],
      lineWidth: 0.2,
    },

    margin: {
      left: 10,
      right: 10,
    },
  });

  // ===================================================
  // MAIN TABLE
  // ===================================================

  const summaryEndY =
    doc.lastAutoTable.finalY;

  const rows = customers.map(
    (customer, index) => {
      const totalCost =
        num(
          customer.total_amount ??
            customer.total_cost
        );

      const received =
        num(customer.received);

      const remaining =
        customer.remaining !==
          undefined &&
        customer.remaining !== null
          ? num(
              customer.remaining
            )
          : totalCost - received;

      return [
        // 1. S.No
        index + 1,

        // 2. Project No
        formatProjectNumber(
          customer.project_no
        ),

        // 3. Customer Name
        customer.customer_name ||
          "",

        // 4. Mobile
        customer.mobile ||
          "",

        // 5. Vendor Name
        customer.vendor_name ||
          "",

        // 6. Payment Type
        customer.payment_type ||
          "",

        // 7. Plant Size
        formatPlantSize(
          customer.project_size ??
            customer.plant_size
        ),

        // 8. Total Cost
        formatAmount(
          totalCost
        ),

        // 9. Received
        formatAmount(
          received
        ),

        // 10. Remaining
        formatAmount(
          remaining
        ),

        // 11. Status
        customer.status ||
          "",
      ];
    }
  );

  // ===================================================
  // MAIN TABLE
  // ===================================================

  doc.autoTable({
    startY:
      summaryEndY + 8,

    head: [
      [
        "S.No",
        "Project No",
        "Customer Name",
        "Mobile",
        "Vendor Name",
        "Payment Type",
        "Plant Size",
        "Total Cost",
        "Received",
        "Remaining",
        "Status",
      ],
    ],

    body: rows,

    theme: "grid",

    styles: {
      font: "helvetica",
      fontSize: 8,
      textColor: 0,
      lineColor: [
        180,
        180,
        180,
      ],
      lineWidth: 0.2,
      cellPadding: 2.2,
      halign: "center",
      valign: "middle",
    },

    headStyles: {
      fillColor: [
        30,
        58,
        138,
      ],
      textColor: 255,
      fontStyle: "bold",
      halign: "center",
      valign: "middle",
      fontSize: 8,
    },

    // =================================================
    // COLUMN WIDTHS
    // =================================================

    columnStyles: {
      // S.No
      0: {
        cellWidth: 10,
      },

      // Project No
      1: {
        cellWidth: 24,
      },

      // Customer Name
      2: {
        cellWidth: 35,
      },

      // Mobile
      3: {
        cellWidth: 22,
      },

      // Vendor Name
      4: {
        cellWidth: 28,
      },

      // Payment Type
      5: {
        cellWidth: 24,
      },

      // Plant Size
      6: {
        cellWidth: 18,
      },

      // Total Cost
      7: {
        cellWidth: 25,
      },

      // Received
      8: {
        cellWidth: 25,
      },

      // Remaining
      9: {
        cellWidth: 25,
      },

      // Status
      10: {
        cellWidth: 20,
      },
    },

    // =================================================
    // STATUS COLOR
    // =================================================

    didParseCell: function (data) {
      // Status is now column 10
      // because PDF columns are zero-indexed.

      if (
        data.section === "body" &&
        data.column.index === 10
      ) {
        const status =
          String(
            data.cell.raw || ""
          ).toLowerCase();

        if (
          status === "completed"
        ) {
          data.cell.styles.textColor =
            [22, 163, 74];

          data.cell.styles.fontStyle =
            "bold";
        }

        if (
          status === "pending"
        ) {
          data.cell.styles.textColor =
            [220, 38, 38];

          data.cell.styles.fontStyle =
            "bold";
        }
      }
    },

    margin: {
      left: 10,
      right: 10,
      bottom: 15,
    },

    // =================================================
    // FOOTER
    // =================================================

    didDrawPage: function () {
      const pageHeight =
        doc.internal.pageSize.getHeight();

      doc.setFontSize(8);

      doc.setFont(
        "helvetica",
        "normal"
      );

      doc.setTextColor(
        100,
        100,
        100
      );

      doc.text(
        `Page ${doc.internal.getNumberOfPages()}`,
        pageWidth - 10,
        pageHeight - 7,
        {
          align: "right",
        }
      );
    },
  });

  // ===================================================
  // SAVE
  // ===================================================

  doc.save(
    "Customer Report.pdf"
  );
}