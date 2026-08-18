import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

// =====================================================
// HELPERS
// =====================================================

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

// =====================================================
// GET DISPLAY QUANTITY
//
// IMPORTANT:
// - Normal product -> quantity
// - KG product -> quantity (NOT total_weight)
// - Kit -> kit quantity / quantity
//           NOT kit_panel_qty
// =====================================================

function getDisplayQuantity(item) {
  if (
    item.type === "Kit" ||
    item.purchase_type === "Kit"
  ) {
    return num(
      item.quantity ??
        item.kit_qty ??
        0
    );
  }

  return num(item.quantity);
}

// =====================================================
// PRODUCT BASE
// =====================================================

function calculateProductBase(item) {
  const quantity = num(item.quantity);
  const price = num(item.price);

  // KG product:
  // Purchase value is based on TOTAL WEIGHT.
  if (
    String(item.unit || "").toLowerCase() ===
    "kg"
  ) {
    return (
      num(item.total_weight) *
      price
    );
  }

  return quantity * price;
}

// =====================================================
// KIT BASE
// =====================================================

function calculateKitBase(item) {
  return num(
    item.kit_overall_value ??
      item.price
  );
}

// =====================================================
// GST
// =====================================================

function calculateGST(item) {
  const isKit =
    item.type === "Kit" ||
    item.purchase_type === "Kit";

  const baseAmount = isKit
    ? calculateKitBase(item)
    : calculateProductBase(item);

  const gst = num(
    item.gst ??
      item.kit_gst
  );

  return (
    baseAmount *
    gst /
    100
  );
}

// =====================================================
// PURCHASE TOTAL
// =====================================================

function calculatePurchaseTotal(item) {
  // IMPORTANT:
  // If total_amount already exists in inventory,
  // use it directly.
  //
  // This keeps the report exactly consistent
  // with the Inventory page and saved purchase data.

  if (
    item.total_amount !==
      null &&
    item.total_amount !==
      undefined &&
    item.total_amount !== ""
  ) {
    return num(
      item.total_amount
    );
  }

  const isKit =
    item.type === "Kit" ||
    item.purchase_type === "Kit";

  const baseAmount = isKit
    ? calculateKitBase(item)
    : calculateProductBase(item);

  const gstAmount =
    calculateGST(item);

  const transportation =
    num(item.transportation);

  return (
    baseAmount +
    gstAmount +
    transportation
  );
}

// =====================================================
// PRODUCT DISPLAY NAME
// =====================================================

function getProductName(item) {
  return [
    item.company,
    item.product_name,
    item.specification,
  ]
    .filter(Boolean)
    .join(" ");
}

// =====================================================
// EXCEL EXPORT
// =====================================================

export async function exportInventoryCSV(
  inventory = [],
  usedInventory = []
) {
  const workbook =
    new ExcelJS.Workbook();

  const sheet =
    workbook.addWorksheet(
      "Inventory Report"
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

  const headerFill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "1E3A8A",
    },
  };

  const subHeaderFill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "7C3AED",
    },
  };

  function styleHeader(cell) {
    cell.font = {
      bold: true,
      color: {
        argb: "FFFFFF",
      },
    };

    cell.fill =
      headerFill;

    cell.alignment =
      center;

    cell.border =
      thinBorder;
  }

  function styleSubHeader(cell) {
    cell.font = {
      bold: true,
      color: {
        argb: "FFFFFF",
      },
    };

    cell.fill =
      subHeaderFill;

    cell.alignment =
      center;

    cell.border =
      thinBorder;
  }

  function styleCell(cell) {
    cell.alignment =
      center;

    cell.border =
      thinBorder;
  }

 // ===================================================
// PROFESSIONAL REPORT HEADER
// ===================================================

// ---------------------------------------------------
// HEADER STRUCTURE
//

// B1:K1  = Company Name
// B2:K2  = Report Title
// ---------------------------------------------------


sheet.mergeCells("A1:K1");
sheet.mergeCells("A2:K2");



// ---------------------------------------------------
// COMPANY NAME
// ---------------------------------------------------

const company =
  sheet.getCell("B1");

company.value =
  "SHIV SHAKTI SOLAR ENERGY";

company.font = {
  size: 18,
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

company.alignment = {
  horizontal: "center",
  vertical: "middle",
};

company.border = thinBorder;

// ---------------------------------------------------
// INVENTORY REPORT TITLE
// ---------------------------------------------------

const title =
  sheet.getCell("B2");

title.value =
  "INVENTORY REPORT";

title.font = {
  size: 14,
  bold: true,
  color: {
    argb: "#1E3A8A",
  },
};

title.fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: {
    // Purple
    argb: "FFFFFF",
  },
};

title.alignment = {
  horizontal: "center",
  vertical: "middle",
};

title.border = thinBorder;

// ---------------------------------------------------
// ROW HEIGHT
// ---------------------------------------------------

sheet.getRow(1).height = 34;
sheet.getRow(2).height = 28;


  // ===================================================
  // SUMMARY
  // ===================================================

  const totalProducts =
    inventory.length;

  // IMPORTANT:
  // Total Purchase Value MUST match Inventory page.
  //
  // Use saved total_amount.
  //
  // This includes:
  // Base Amount
  // + GST
  // + Allocated Transportation

  const totalPurchaseValue =
    inventory.reduce(
      (sum, item) =>
        sum +
        calculatePurchaseTotal(
          item
        ),
      0
    );

  // ===================================================
  // SPACE BEFORE SUMMARY
  // ===================================================

  sheet.addRow([]);
  sheet.addRow([]);

  // ===================================================
  // SUMMARY HEADER
  // ===================================================

  const summaryHeader =
    sheet.addRow([
      "TOTAL PRODUCTS",
      "TOTAL PURCHASE VALUE",
    ]);

  summaryHeader.eachCell(
    (cell) => {
      styleSubHeader(cell);
    }
  );

  summaryHeader.height =
    24;

  // ===================================================
  // SUMMARY VALUES
  // ===================================================

  const summaryValues =
    sheet.addRow([
      totalProducts,
      totalPurchaseValue,
    ]);

  summaryValues.eachCell(
    (cell) => {
      styleCell(cell);
    }
  );

  summaryValues.height =
    24;

  // Product count
  summaryValues
    .getCell(1)
    .numFmt =
    "#,##0";

  // Purchase value
  summaryValues
    .getCell(2)
    .numFmt =
    "#,##0.00";

  // ===================================================
  // SUMMARY COLUMN WIDTH
  // ===================================================

  sheet.getColumn(1).width =
    22;

  sheet.getColumn(2).width =
    25;

  // ===================================================
  // SPACE AFTER SUMMARY
  // ===================================================

  sheet.addRow([]);
  sheet.addRow([]);
  sheet.addRow([]);

  // ===================================================
  // MAIN TABLE HEADER
  // ===================================================

  const headerRow =
    sheet.addRow([
      "S.No",
      "Product",
      "Category",
      "Quantity",
      "Unit",
      "Price",
      "GST %",
      "Total GST",
      "Transportation",
      "Total",
      "Unit Price",
    ]);

  headerRow.eachCell(
    (cell) => {
      styleHeader(cell);
    }
  );

  sheet.getRow(
    headerRow.number
  ).height = 28;

  // ===================================================
  // INVENTORY DATA
  // ===================================================

  inventory.forEach(
    (item, index) => {
      const quantity =
        getDisplayQuantity(
          item
        );

      const price =
        num(item.price);

      const gst =
        num(
          item.gst ??
            item.kit_gst
        );

      const totalGST =
        calculateGST(
          item
        );

      // IMPORTANT:
      // Transportation is the value already
      // allocated and stored in inventory.
      const transportation =
        num(
          item.transportation
        );

      // IMPORTANT:
      // Use stored total_amount.
      const total =
        calculatePurchaseTotal(
          item
        );

      const unitPrice =
        num(
          item.unit_cost
        );

      const row =
        sheet.addRow([
          index + 1,

          getProductName(
            item
          ),

          item.category ||
            "",

          quantity,

          item.unit ||
            "",

          price,

          gst,

          totalGST,

          transportation,

          total,

          unitPrice,
        ]);

      row.eachCell(
        (cell) => {
          styleCell(cell);
        }
      );

      // =================================================
      // NUMBER FORMATTING
      // =================================================

      // S.No
      row.getCell(1).numFmt =
        "0";

      // Quantity
      // Whole number ONLY.
      // Prevents 3. / 3.00
      row.getCell(4).numFmt =
        "#,##0";

      // Price
      row.getCell(6).numFmt =
        "#,##0.00";

      // GST %
      row.getCell(7).numFmt =
        "#,##0.00";

      // Total GST
      row.getCell(8).numFmt =
        "#,##0.00";

      // Transportation
      row.getCell(9).numFmt =
        "#,##0.00";

      // Total
      row.getCell(10).numFmt =
        "#,##0.00";

      // Unit Price
      row.getCell(11).numFmt =
        "#,##0.00";
    }
  );

  // ===================================================
  // COLUMN WIDTHS
  // ===================================================

  const widths = [
    8,  // S.No
    34, // Product
    18, // Category
    12, // Quantity
    10, // Unit
    15, // Price
    12, // GST %
    16, // Total GST
    18, // Transportation
    16, // Total
    16, // Unit Price
  ];

  sheet.columns.forEach(
    (column, index) => {
      column.width =
        widths[index] ||
        15;
    }
  );

  // ===================================================
  // FREEZE HEADER
  // ===================================================

  sheet.views = [
    {
      state: "frozen",
      ySplit:
        headerRow.number,
    },
  ];

  // ===================================================
  // CUSTOMER-WISE MATERIAL CONSUMPTION
  // ===================================================

  if (
    Array.isArray(
      usedInventory
    ) &&
    usedInventory.length > 0
  ) {
    const customerData =
      {};

    usedInventory.forEach(
      (item) => {
        const customerName =
          item.customers
            ?.customer_name ||
          item.customer_name;

        if (!customerName) {
          return;
        }

        if (
          !customerData[
            customerName
          ]
        ) {
          customerData[
            customerName
          ] = [];
        }

        if (
          Array.isArray(
            item.products
          )
        ) {
          item.products.forEach(
            (product) => {
              customerData[
                customerName
              ].push({
                product: [
                  product.company,
                  product.product_name,
                  product.specification,
                ]
                  .filter(Boolean)
                  .join(" "),

                category:
                  product.category ||
                  "",

                quantity:
                  num(
                    product.quantity
                  ),

                unit:
                  product.unit ||
                  "",
              });
            }
          );
        }
      }
    );

    Object.entries(
      customerData
    ).forEach(
      ([
        customerName,
        products,
      ]) => {
        let sheetName =
          customerName
            .substring(0, 31)
            .replace(
              /[\\\/\?\*\[\]]/g,
              ""
            );

        if (!sheetName) {
          sheetName =
            "Customer";
        }

        let finalSheetName =
          sheetName;

        let counter = 1;

        while (
          workbook.getWorksheet(
            finalSheetName
          )
        ) {
          finalSheetName =
            `${sheetName.substring(
              0,
              25
            )}_${counter}`;

          counter++;
        }

        const customerSheet =
          workbook.addWorksheet(
            finalSheetName
          );

        // ---------------------------------------------
        // Customer Header
        // ---------------------------------------------

        customerSheet.mergeCells(
          "A1:E1"
        );

        const customerTitle =
          customerSheet.getCell(
            "A1"
          );

        customerTitle.value =
          customerName;

        customerTitle.font = {
          size: 18,
          bold: true,
          color: {
            argb: "FFFFFF",
          },
        };

        customerTitle.fill =
          headerFill;

        customerTitle.alignment =
          center;

        customerSheet.getRow(
          1
        ).height = 30;

        // ---------------------------------------------
        // Customer Table
        // ---------------------------------------------

        const customerHeader =
          customerSheet.addRow([
            "S.No",
            "Product",
            "Category",
            "Quantity",
            "Unit",
          ]);

        customerHeader.eachCell(
          (cell) => {
            styleHeader(cell);
          }
        );

        products.forEach(
          (
            product,
            index
          ) => {
            const row =
              customerSheet.addRow([
                index + 1,
                product.product,
                product.category,
                product.quantity,
                product.unit,
              ]);

            row.eachCell(
              (cell) => {
                styleCell(cell);
              }
            );

            row.getCell(
              1
            ).numFmt = "0";

            row.getCell(
              4
            ).numFmt =
              "#,##0";
          }
        );

        // ---------------------------------------------
        // Customer Column Widths
        // ---------------------------------------------

        customerSheet.columns =
          [
            {
              width: 8,
            },
            {
              width: 35,
            },
            {
              width: 18,
            },
            {
              width: 12,
            },
            {
              width: 10,
            },
          ];

        customerSheet.views = [
          {
            state: "frozen",
            ySplit: 2,
          },
        ];
      }
    );
  }

  // ===================================================
  // DOWNLOAD
  // ===================================================

  const buffer =
    await workbook.xlsx.writeBuffer();

  saveAs(
    new Blob(
      [buffer],
      {
        type:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }
    ),
    "Inventory Report.xlsx"
  );
}