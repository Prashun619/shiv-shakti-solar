import {
  createReportPDF,
  drawTable,
  addFooter,
} from "./pdfTable";

// =====================================================
// HELPERS
// =====================================================

function toNumber(value) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
}

// =====================================================
// PURCHASE BASE
// =====================================================

function getPurchaseBase(item) {
  if (
    item.purchase_type === "Kit" ||
    item.type === "Kit"
  ) {
    return toNumber(
      item.kit_overall_value ||
      item.price ||
      0
    );
  }

  const price =
    toNumber(item.price);

  // KG:
  // Total Weight × Price
  if (item.unit === "Kg") {
    return (
      toNumber(item.total_weight) *
      price
    );
  }

  // Normal:
  // Quantity × Price
  return (
    toNumber(item.quantity) *
    price
  );
}

// =====================================================
// GST
//
// GST is now one combined GST percentage.
// =====================================================

function getGSTAmount(item) {
  const base =
    getPurchaseBase(item);

  const gst =
    toNumber(item.gst);

  return (
    base *
    gst /
    100
  );
}

// =====================================================
// PURCHASE TOTAL
//
// Prefer stored total_amount so the report exactly
// matches the Inventory page.
//
// Fallback is calculated if total_amount is missing.
// =====================================================

function getPurchaseTotal(item) {
  if (
    item.total_amount !== null &&
    item.total_amount !== undefined &&
    item.total_amount !== ""
  ) {
    return toNumber(
      item.total_amount
    );
  }

  return (
    getPurchaseBase(item) +
    getGSTAmount(item) +
    toNumber(item.transportation)
  );
}

// =====================================================
// UNIT PRICE
//
// KG:
// Total / Total Weight
//
// Other:
// Total / Quantity
// =====================================================

function getUnitPrice(item) {
  const total =
    getPurchaseTotal(item);

  if (item.unit === "Kg") {
    const totalWeight =
      toNumber(
        item.total_weight
      );

    return totalWeight > 0
      ? total / totalWeight
      : 0;
  }

  const quantity =
    toNumber(
      item.quantity
    );

  return quantity > 0
    ? total / quantity
    : 0;
}

// =====================================================
// FORMAT INDIAN NUMBER - EXACTLY 2 DECIMALS
// =====================================================

function format2(value) {
  return toNumber(value)
    .toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );
}

// =====================================================
// LOAD LOGO
// =====================================================

async function loadLogo() {
  try {
    const response =
      await fetch("/logo.png");

    if (!response.ok) {
      throw new Error(
        "Logo could not be loaded."
      );
    }

    const blob =
      await response.blob();

    return await new Promise(
      (resolve, reject) => {
        const reader =
          new FileReader();

        reader.onloadend = () =>
          resolve(
            reader.result
          );

        reader.onerror =
          reject;

        reader.readAsDataURL(
          blob
        );
      }
    );
  } catch (error) {
    console.warn(
      "Inventory PDF logo could not be loaded:",
      error
    );

    return null;
  }
}

// =====================================================
// INVENTORY PDF
// =====================================================

export async function exportInventoryPDF(
  inventory = []
) {
  const doc =
    createReportPDF(
      "Inventory Report"
    );

  // ===================================================
  // LOGO
  // ===================================================

  const logo =
    await loadLogo();

  // ===================================================
  // PAGE SIZE
  // ===================================================

  const pageWidth =
    doc.internal.pageSize.getWidth();

  // ===================================================
  // PROFESSIONAL HEADER
  // ===================================================

  // Header background
  doc.setFillColor(
    18,
    59,
    93
  );

  doc.rect(
    0,
    0,
    pageWidth,
    42,
    "F"
  );

  // Logo
  if (logo) {
    try {
      doc.addImage(
        logo,
        "PNG",
        10,
        7,
        28,
        28
      );
    } catch (error) {
      console.warn(
        "Could not add logo to PDF:",
        error
      );
    }
  }

  // Company name
  doc.setTextColor(
    255,
    255,
    255
  );

  doc.setFontSize(
    18
  );

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.text(
    "SHIV SHAKTI SOLAR ENERGY",
    pageWidth / 2,
    17,
    {
      align: "center",
    }
  );

  // Report title
  doc.setFontSize(
    11
  );

  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.text(
    "INVENTORY PURCHASE REPORT",
    pageWidth / 2,
    29,
    {
      align: "center",
    }
  );

  // ===================================================
  // SUMMARY
  // ===================================================

  const totalProducts =
    inventory.length;

  const totalPurchaseValue =
    inventory.reduce(
      (sum, item) =>
        sum +
        getPurchaseTotal(item),
      0
    );

  const summaryColumns = [
    {
      title: "Total Products",
      width: 45,
    },

    {
      title:
        "Total Purchase Value",
      width: 55,
    },
  ];

  const summaryRows = [
    [
      String(
        totalProducts
      ),

      format2(
        totalPurchaseValue
      ),
    ],
  ];

  drawTable(
    doc,
    summaryColumns,
    summaryRows,
    50,
    8
  );

  // ===================================================
  // TABLE COLUMNS
  // ===================================================

  const columns = [
    {
      title: "S.No",
      width: 12,
    },

    {
      title: "Product",
      width: 48,
    },

    {
      title: "Category",
      width: 24,
    },

    {
      title: "Quantity",
      width: 20,
    },

    {
      title: "Unit",
      width: 15,
    },

    {
      title: "Price",
      width: 25,
    },

    {
      title: "GST %",
      width: 18,
    },

    {
      title: "Total GST",
      width: 28,
    },

    {
      title: "Transportation",
      width: 30,
    },

    {
      title: "Total",
      width: 30,
    },

    {
      title: "Unit Price",
      width: 30,
    },
  ];

  // ===================================================
  // TABLE ROWS
  // ===================================================

  const rows =
    inventory.map(
      (item, index) => {
        const productName = [
          item.company,
          item.product_name,
          item.specification,
        ]
          .filter(Boolean)
          .join(" ");

        const gstAmount =
          getGSTAmount(item);

        const total =
          getPurchaseTotal(item);

        const unitPrice =
          getUnitPrice(item);

        return [
          String(
            index + 1
          ),

          productName,

          item.category || "",

          // IMPORTANT:
          // For KG, this is piece quantity,
          // NOT total_weight.
          String(
            toNumber(
              item.quantity
            )
          ),

          item.unit || "",

          format2(
            item.price
          ),

          toNumber(
            item.gst
          ).toFixed(2),

          format2(
            gstAmount
          ),

          format2(
            item.transportation
          ),

          format2(
            total
          ),

          format2(
            unitPrice
          ),
        ];
      }
    );

  // ===================================================
  // DRAW MAIN TABLE
  // ===================================================

  drawTable(
    doc,
    columns,
    rows,
    85,
    7
  );

  // ===================================================
  // FOOTER
  // ===================================================

  addFooter(
    doc
  );

  // ===================================================
  // SAVE
  // ===================================================

  doc.save(
    "Inventory Report.pdf"
  );
}