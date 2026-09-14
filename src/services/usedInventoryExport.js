import {
  createReportPDF,
  drawTable,
  addFooter,
} from "./reports/pdfTable";

import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

import { supabase } from "./supabase";


// =====================================================
// HELPERS
// =====================================================

function formatAmount(value) {
  return Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}


// =====================================================
// PRODUCT DISPLAY NAME
// =====================================================

function getDisplayProductName(product) {
  const productName =
    String(product.product_name || "").trim();

  const category =
    String(product.category || "").trim();

  const company =
    String(
      product.company ||
      product.brand ||
      product.manufacturer ||
      ""
    ).trim();

  const specification =
    String(
      product.specification ||
      product.capacity ||
      product.panel_capacity ||
      product.inverter_capacity ||
      ""
    ).trim();

  const lowerName =
    productName.toLowerCase();


  // PANEL
  if (
    lowerName === "panel" ||
    category.toLowerCase() === "panel"
  ) {
    return [
      company,
      specification,
      "panel",
    ]
      .filter(Boolean)
      .join(" ");
  }


  // INVERTER
  if (
    lowerName === "inverter" ||
    category.toLowerCase() === "inverter"
  ) {
    return [
      company,
      specification,
      "inverter",
    ]
      .filter(Boolean)
      .join(" ");
  }


  // KIT
  if (
    lowerName === "kit" ||
    category.toLowerCase() === "kit"
  ) {
    return [
      company,
      specification,
      "kit",
    ]
      .filter(Boolean)
      .join(" ");
  }


  return productName || "-";
}


// =====================================================
// PREPARE PRODUCTS
// =====================================================

function getProducts(item) {
  return Object.values(
    (item.products || [])
      .filter(
        (product) =>
          Number(product.quantity || 0) > 0
      )
      .reduce((acc, product) => {
        const unitPrice = Number(
          product.unit_price ??
          product.unit_cost ??
          product.price ??
          0
        );

        const key =
          (product.product_name || "") +
          "_" +
          (product.category || "") +
          "_" +
          (product.company || "") +
          "_" +
          (product.specification || "") +
          "_" +
          unitPrice;

        const serialNumbers =
          Array.isArray(
            product.serial_numbers
          )
            ? product.serial_numbers
            : [];

        const inverterModels =
          Array.isArray(
            product.inverter_models
          )
            ? product.inverter_models
            : [];


        if (!acc[key]) {
          acc[key] = {
            ...product,

            product_name:
              getDisplayProductName(product),

            category:
              product.category || "",

            company:
              product.company || "",

            specification:
              product.specification || "",

            quantity:
              Number(
                product.quantity || 0
              ),

            unit_price:
              unitPrice,

            total:
              Number(
                product.total || 0
              ),

            // Preserve all panel/inverter serials
            serial_numbers: [
              ...serialNumbers,
            ],

            // Preserve all inverter models
            inverter_models: [
              ...inverterModels,
            ],
          };
        } else {
          acc[key].quantity +=
            Number(
              product.quantity || 0
            );

          acc[key].total +=
            Number(
              product.total || 0
            );


          // Merge serial numbers
          acc[key].serial_numbers.push(
            ...serialNumbers
          );


          // Merge inverter models
          acc[key].inverter_models.push(
            ...inverterModels
          );
        }


        return acc;
      }, {})
  ).map((product) => {
    const quantity =
      Number(
        product.quantity || 0
      );

    const unitPrice =
      Number(
        product.unit_price || 0
      );


    return {
      ...product,

      total:
        Number(product.total || 0) > 0
          ? Number(product.total)
          : quantity * unitPrice,

      serial_numbers:
        Array.isArray(
          product.serial_numbers
        )
          ? product.serial_numbers
          : [],

      inverter_models:
        Array.isArray(
          product.inverter_models
        )
          ? product.inverter_models
          : [],
    };
  });
}


// =====================================================
// CLEAN ARRAY
// =====================================================

function cleanArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) =>
      String(item || "").trim()
    )
    .filter(Boolean);
}


// =====================================================
// PANEL CHECK
// =====================================================

function isPanel(product) {
  return (
    String(
      product.product_name || ""
    )
      .trim()
      .toLowerCase() === "panel" ||

    String(
      product.category || ""
    )
      .trim()
      .toLowerCase() === "panel"
  );
}


// =====================================================
// INVERTER CHECK
// =====================================================

function isInverter(product) {
  return (
    String(
      product.product_name || ""
    )
      .trim()
      .toLowerCase() === "inverter" ||

    String(
      product.category || ""
    )
      .trim()
      .toLowerCase() === "inverter"
  );
}


// =====================================================
// GET PANEL DATA
// =====================================================

function getPanelData(products) {
  const panelProducts =
    products.filter(isPanel);


  return panelProducts.flatMap(
    (product) => {

      const serials =
        cleanArray(
          product.serial_numbers
        );


      const quantity =
        Number(
          product.quantity || 0
        );


      const count =
        Math.max(
          quantity,
          serials.length
        );


      return Array.from(
        {
          length: count,
        },
        (_, index) => ({
          company:
            product.company || "-",

          serial:
            serials[index] || "-",
        })
      );
    }
  );
}


// =====================================================
// GET INVERTER DATA
// =====================================================

function getInverterData(products) {
  const inverterProducts =
    products.filter(isInverter);


  return inverterProducts.flatMap(
    (product) => {

      const serials =
        cleanArray(
          product.serial_numbers
        );


      let models =
        cleanArray(
          product.inverter_models
        );


      // Backward compatibility
      // for old records
      if (!models.length) {

        const specification =
          String(
            product.specification || ""
          ).trim();


        if (specification) {
          models = [
            specification,
          ];
        }

      }


      const quantity =
        Number(
          product.quantity || 0
        );


      const count =
        Math.max(
          quantity,
          serials.length,
          models.length
        );


      return Array.from(
        {
          length: count,
        },
        (_, index) => ({
          company:
            product.company || "-",

          model:
            models[index] || "-",

          serial:
            serials[index] || "-",
        })
      );
    }
  );
}


// =====================================================
// ADDITIONAL CHARGES
// =====================================================

function getAdditionalCharges(item) {

  return [

    {
      name: "Bhada Charges",
      amount:
        Number(
          item.bhada_charges || 0
        ),
    },

    {
      name: "Cement Charges",
      amount:
        Number(
          item.cement_charges || 0
        ),
    },

    {
      name: "Gitti Charges",
      amount:
        Number(
          item.gitti_charges || 0
        ),
    },

    {
      name: "Installation Charges",
      amount:
        Number(
          item.installation_charges || 0
        ),
    },

    {
      name: "JE Charges",
      amount:
        Number(
          item.je_charges || 0
        ),
    },

    {
      name: "Load Extension Charges",
      amount:
        Number(
          item.load_extension_charges || 0
        ),
    },

    {
      name: "Meter Connection Charges",
      amount:
        Number(
          item.meter_connection_charges || 0
        ),
    },

    // Added to match ViewUsedInventoryModal
    {
      name: "Meter Name Change Charge",
      amount:
        Number(
          item.name_change_charges || 0
        ),
    },

    // Added to match ViewUsedInventoryModal
    {
      name: "Meter Change Charge",
      amount:
        Number(
          item.meter_change_charges || 0
        ),
    },

    {
      name: "Net Metering Charges",
      amount:
        Number(
          item.net_metering_charges || 0
        ),
    },

    {
      name: "Sand Charges",
      amount:
        Number(
          item.sand_charges || 0
        ),
    },

    {
      name: "Vendor Charges",
      amount:
        Number(
          item.vendor_charges || 0
        ),
    },

  ].filter(
    (charge) =>
      charge.amount > 0
  );
}


// =====================================================
// CENTRAL CALCULATION
// =====================================================

function calculateUsedInventory(
  item,
  plantTotalValue
) {

  const products =
    getProducts(item);


  const additionalCharges =
    getAdditionalCharges(item);


  const productCost =
    products.reduce(
      (sum, product) =>
        sum +
        Number(
          product.total || 0
        ),
      0
    );


  const extraCost =
    additionalCharges.reduce(
      (sum, charge) =>
        sum +
        Number(
          charge.amount || 0
        ),
      0
    );


  const plantCost =
    productCost +
    extraCost;


  const plantTotal =
    Number(
      plantTotalValue || 0
    );


  const profit =
    plantTotal -
    plantCost;


  const profitPercent =
    plantTotal > 0
      ? (
          profit /
          plantTotal
        ) * 100
      : 0;


  return {

    products,

    additionalCharges,

    productCost,

    extraCost,

    plantCost,

    plantTotalValue:
      plantTotal,

    profit,

    profitPercent,

  };

}


// =====================================================
// GET PLANT TOTAL VALUE
// =====================================================

async function getPlantTotalValue(item) {

  if (!item?.project_no) {
    return 0;
  }


  const {
    data,
    error,
  } = await supabase

    .from("projects")

    .select("total_amount")

    .eq(
      "project_no",
      item.project_no
    )

    .maybeSingle();


  if (error) {

    console.error(
      "Error fetching plant total value:",
      error
    );

    return 0;

  }


  return Number(
    data?.total_amount || 0
  );

}


// =====================================================
// PDF DOWNLOAD
// =====================================================

export async function downloadUsedInventoryPDF(item) {

  const plantTotalValue =
    await getPlantTotalValue(item);


  const calculation =
    calculateUsedInventory(
      item,
      plantTotalValue
    );


  const {
    products,
    additionalCharges,
    productCost,
    extraCost,
    plantCost,
    profit,
    profitPercent,
  } = calculation;


  const doc =
    createReportPDF(
      "Material Consumption Report"
    );


  // ===================================================
  // CUSTOMER / PROJECT / FINANCIAL TABLE
  // ===================================================

  const detailsX = 15;
  const detailsY = 45;
  const detailsWidth = 180;
  const detailsHeight = 27;

  const topRowHeight = 12;


  const col1 = 15;
  const col2 = 60;
  const col3 = 105;
  const col4 = 145;


  // ===================================================
  // OUTER TABLE
  // ===================================================

  doc.setFillColor(
    255,
    255,
    255
  );

  doc.setDrawColor(
    0,
    0,
    0
  );

  doc.setLineWidth(
    0.4
  );


  doc.rect(
    detailsX,
    detailsY,
    detailsWidth,
    detailsHeight,
    "FD"
  );


  // ===================================================
  // VERTICAL BORDERS
  // ===================================================

  doc.line(
    col2,
    detailsY,
    col2,
    detailsY + detailsHeight
  );

  doc.line(
    col3,
    detailsY,
    col3,
    detailsY + detailsHeight
  );

  doc.line(
    col4,
    detailsY,
    col4,
    detailsY + detailsHeight
  );


  // ===================================================
  // HORIZONTAL BORDER
  // ===================================================

  const middleY =
    detailsY +
    topRowHeight;


  doc.line(
    detailsX,
    middleY,
    detailsX + detailsWidth,
    middleY
  );


  // ===================================================
  // TOP ROW
  // ===================================================

  const topColumns = [

    {
      x: col1,
      width: 45,
      title: "CUSTOMER",
      value:
        item.customers?.customer_name ||
        item.customer_name ||
        "-",
    },

    {
      x: col2,
      width: 45,
      title: "PROJECT NO",
      value:
        item.project_no ||
        "-",
    },

    {
      x: col3,
      width: 40,
      title: "LOCATION",
      value:
        item.location ||
        "-",
    },

    {
      x: col4,
      width: 50,
      title: "PLANT SIZE",
      value:
        `${item.plant_size || "-"} KW`,
    },

  ];


  topColumns.forEach(
    (column) => {

      doc.setFont(
        "helvetica",
        "bold"
      );

      doc.setFontSize(
        6.5
      );

      doc.setTextColor(
        0,
        0,
        0
      );


      doc.text(
        column.title,
        column.x +
          column.width / 2,
        detailsY + 4.5,
        {
          align: "center",
        }
      );


      doc.setFont(
        "helvetica",
        "bold"
      );

      doc.setFontSize(
        7.8
      );

      doc.setTextColor(
        0,
        0,
        0
      );


      doc.text(
        String(
          column.value
        ),
        column.x +
          column.width / 2,
        detailsY + 9,
        {
          align: "center",
        }
      );

    }
  );


  // ===================================================
  // FINANCIAL ROW
  // ===================================================

  const financialColumns = [

    {
      x: col1,
      width: 45,

      title:
        "PLANT TOTAL VALUE",

      value:
        `Rs. ${formatAmount(
          plantTotalValue
        )}`,

      color:
        [30, 64, 175],
    },


    {
      x: col2,
      width: 45,

      title:
        "PLANT COST",

      value:
        `Rs. ${formatAmount(
          plantCost
        )}`,

      color:
        [234, 88, 12],
    },


    {
      x: col3,
      width: 40,

      title:
        "PROFIT",

      value:
        `Rs. ${formatAmount(
          profit
        )}`,

      color:
        profit >= 0
          ? [22, 163, 74]
          : [220, 38, 38],
    },


    {
      x: col4,
      width: 50,

      title:
        "PROFIT %",

      value:
        `${profitPercent.toFixed(
          2
        )}%`,

      color:
        profit >= 0
          ? [5, 150, 105]
          : [220, 38, 38],
    },

  ];


  financialColumns.forEach(
    (column) => {

      doc.setFont(
        "helvetica",
        "bold"
      );

      doc.setFontSize(
        6.5
      );

      doc.setTextColor(
        0,
        0,
        0
      );


      doc.text(
        column.title,
        column.x +
          column.width / 2,
        middleY + 5,
        {
          align: "center",
        }
      );


      doc.setFont(
        "helvetica",
        "bold"
      );

      doc.setFontSize(
        8.2
      );

      doc.setTextColor(
        ...column.color
      );


      doc.text(
        column.value,
        column.x +
          column.width / 2,
        middleY + 10.5,
        {
          align: "center",
        }
      );

    }
  );


  // ===================================================
  // PRODUCT TABLE
  // ===================================================

  const columns = [

    {
      title: "S.No",
      width: 14,
    },

    {
      title: "Product",
      width: 58,
    },

    {
      title: "Category",
      width: 38,
    },

    {
      title: "Qty",
      width: 18,
    },

    {
      title: "Unit Cost",
      width: 35,
    },

    {
      title: "Total",
      width: 38,
    },

  ];


  const rows = [];


  products.forEach(
    (product, index) => {

      rows.push([

        index + 1,

        product.product_name,

        product.category,

        String(
          product.quantity
        ),

        formatAmount(
          product.unit_price
        ),

        formatAmount(
          product.total
        ),

      ]);

    }
  );


  additionalCharges.forEach(
    (charge) => {

      rows.push([

        rows.length + 1,

        charge.name,

        "Additional Charges",

        "1",

        formatAmount(
          charge.amount
        ),

        formatAmount(
          charge.amount
        ),

      ]);

    }
  );


  // ===================================================
  // TABLE
  // ===================================================

  const tableStartY =
    78;


  const endY =
    drawTable(
      doc,
      columns,
      rows,
      tableStartY
    );


  // ===================================================
  // COST SUMMARY
  // ===================================================

  let summaryY =
    endY + 5;


  const summaryWidth =
    65;

  const summaryX =
    130;

  const summaryRowHeight =
    7;


  if (
    summaryY >
    250
  ) {

    doc.addPage();

    summaryY = 25;

  }


  const summaryRows = [

    [
      "Product Cost",
      formatAmount(
        productCost
      ),
    ],

    [
      "Additional Charges",
      formatAmount(
        extraCost
      ),
    ],

    [
      "Plant Cost",
      formatAmount(
        plantCost
      ),
    ],

  ];


  summaryRows.forEach(
    (row, index) => {

      const y =
        summaryY +
        index *
          summaryRowHeight;


      if (
        index === 2
      ) {

        doc.setFillColor(
          30,
          58,
          138
        );

        doc.setTextColor(
          255,
          255,
          255
        );

      } else {

        doc.setFillColor(
          255,
          255,
          255
        );

        doc.setTextColor(
          0,
          0,
          0
        );

      }


      doc.setDrawColor(
        0,
        0,
        0
      );


      doc.rect(
        summaryX,
        y,
        summaryWidth,
        summaryRowHeight,
        "FD"
      );


      doc.setFont(
        "helvetica",
        "bold"
      );

      doc.setFontSize(
        8
      );


      doc.text(
        row[0],
        summaryX + 3,
        y + 4.8
      );


      doc.text(
        row[1],
        summaryX +
          summaryWidth -
          3,
        y + 4.8,
        {
          align: "right",
        }
      );

    }
  );


  // ===================================================
  // FOOTER
  // ===================================================

  addFooter(doc);


  // ===================================================
  // SAVE PDF
  // ===================================================

  doc.save(
    `${
      item.customers?.customer_name ||
      item.customer_name ||
      "Used_Inventory"
    }_Used_Inventory.pdf`
  );

}


// =====================================================
// EXCEL DOWNLOAD
// =====================================================

export async function downloadUsedInventoryExcel(item) {

  const plantTotalValue =
    await getPlantTotalValue(item);


  const calculation =
    calculateUsedInventory(
      item,
      plantTotalValue
    );


  const {
    products,
    additionalCharges,
    productCost,
    extraCost,
    plantCost,
    profit,
    profitPercent,
  } = calculation;


  // ===================================================
  // WORKBOOK
  // ===================================================

  const workbook =
    new ExcelJS.Workbook();


  const sheet =
    workbook.addWorksheet(
      "Material Consumption"
    );


  // ===================================================
  // COLOUR PALETTE
  // ===================================================

  const WHITE = "FFFFFF";
  const BLACK = "000000";

  const DARK_BLUE = "1E3A8A";
  const BLUE = "2563EB";
  const LIGHT_BLUE = "DBEAFE";

  const TEAL = "0F766E";
  const LIGHT_TEAL = "CCFBF1";

  const PURPLE = "7C3AED";
  const LIGHT_PURPLE = "EDE9FE";

  const ORANGE = "EA580C";
  const LIGHT_ORANGE = "FFEDD5";

  const GREEN = "16A34A";
  const LIGHT_GREEN = "DCFCE7";

  const RED = "DC2626";
  const LIGHT_RED = "FEE2E2";

  const LIGHT_GREY = "F9FAFB";


  // ===================================================
  // BLACK BORDER
  // ===================================================

  const blackBorder = {

    top: {
      style: "thin",
      color: {
        argb: BLACK,
      },
    },

    left: {
      style: "thin",
      color: {
        argb: BLACK,
      },
    },

    bottom: {
      style: "thin",
      color: {
        argb: BLACK,
      },
    },

    right: {
      style: "thin",
      color: {
        argb: BLACK,
      },
    },

  };


  // ===================================================
  // CENTER ALIGNMENT
  // ===================================================

  const center = {

    horizontal: "center",

    vertical: "middle",

    wrapText: true,

  };


  // ===================================================
  // CELL HELPERS
  // ===================================================

  function applyFill(
    cell,
    color
  ) {

    cell.fill = {

      type: "pattern",

      pattern: "solid",

      fgColor: {
        argb: color,
      },

    };

  }


  function styleCell(
    cell,
    background = WHITE
  ) {

    cell.font = {

      bold: true,

      color: {
        argb: BLACK,
      },

    };


    applyFill(
      cell,
      background
    );


    cell.alignment =
      center;


    cell.border =
      blackBorder;

  }


  function styleHeader(
    cell,
    background,
    textColor = WHITE
  ) {

    cell.font = {

      bold: true,

      color: {
        argb: textColor,
      },

    };


    applyFill(
      cell,
      background
    );


    cell.alignment =
      center;


    cell.border =
      blackBorder;

  }


  // ===================================================
  // COMPANY HEADER
  // ===================================================

  sheet.mergeCells(
    "A1:F1"
  );


  const company =
    sheet.getCell(
      "A1"
    );


  company.value =
    "SHIV SHAKTI SOLAR ENERGY";


  company.font = {

    size: 18,

    bold: true,

    color: {
      argb: WHITE,
    },

  };


  applyFill(
    company,
    DARK_BLUE
  );


  company.alignment =
    center;


  company.border =
    blackBorder;


  sheet.getRow(
    1
  ).height = 32;


  // ===================================================
  // REPORT TITLE
  // ===================================================

  sheet.mergeCells(
    "A2:F2"
  );


  const title =
    sheet.getCell(
      "A2"
    );


  title.value =
    "Material Consumption Report";


  title.font = {

    size: 14,

    bold: true,

    color: {
      argb: WHITE,
    },

  };


  applyFill(
    title,
    TEAL
  );


  title.alignment =
    center;


  title.border =
    blackBorder;


  sheet.getRow(
    2
  ).height = 26;


  // ===================================================
  // SPACE
  // ===================================================

  sheet.addRow([]);


  // ===================================================
  // CUSTOMER DETAILS HEADER
  // ===================================================

  const customerHeader =
    sheet.addRow([

      "CUSTOMER",

      "PROJECT NO",

      "LOCATION",

      "PLANT SIZE",

      "PLANT TOTAL VALUE",

      "PLANT COST",

    ]);


  customerHeader.eachCell(
    (cell) => {

      styleHeader(
        cell,
        BLUE
      );

    }
  );


  // ===================================================
  // CUSTOMER DETAILS DATA
  // ===================================================

  const customerData =
    sheet.addRow([

      item.customers?.customer_name ||
        item.customer_name ||
        "-",

      item.project_no ||
        "-",

      item.location ||
        "-",

      `${item.plant_size || "-"} KW`,

      plantTotalValue,

      plantCost,

    ]);


  customerData.eachCell(
    (cell, col) => {

      styleCell(
        cell,
        LIGHT_BLUE
      );


      if (
        col === 5 ||
        col === 6
      ) {

        cell.numFmt =
          "#,##0.00";

      }

    }
  );


  customerData.getCell(
    5
  ).font = {

    bold: true,

    color: {
      argb: BLUE,
    },

  };


  customerData.getCell(
    6
  ).font = {

    bold: true,

    color: {
      argb: ORANGE,
    },

  };


  // ===================================================
  // SPACE
  // ===================================================

  sheet.addRow([]);


  // ===================================================
  // PROFIT SUMMARY HEADER
  // ===================================================

  const profitHeader =
    sheet.addRow([

      "PLANT TOTAL VALUE",

      "PLANT COST",

      "PROFIT",

      "PROFIT %",

    ]);


  profitHeader.eachCell(
    (cell) => {

      styleHeader(
        cell,
        PURPLE
      );

    }
  );


  // ===================================================
  // PROFIT SUMMARY DATA
  // ===================================================

  const profitData =
    sheet.addRow([

      plantTotalValue,

      plantCost,

      profit,

      profitPercent / 100,

    ]);


  profitData.eachCell(
    (cell, col) => {

      styleCell(
        cell,
        LIGHT_PURPLE
      );


      if (
        col <= 3
      ) {

        cell.numFmt =
          "#,##0.00";

      }


      if (
        col === 4
      ) {

        cell.numFmt =
          "0.00%";

      }

    }
  );


  // ===================================================
  // PROFIT VALUE COLOURS
  // ===================================================

  profitData.getCell(
    1
  ).font = {

    bold: true,

    color: {
      argb: BLUE,
    },

  };


  profitData.getCell(
    2
  ).font = {

    bold: true,

    color: {
      argb: ORANGE,
    },

  };


  profitData.getCell(
    3
  ).font = {

    bold: true,

    color: {
      argb:
        profit >= 0
          ? GREEN
          : RED,
    },

  };


  profitData.getCell(
    4
  ).font = {

    bold: true,

    color: {
      argb:
        profit >= 0
          ? GREEN
          : RED,
    },

  };


  // ===================================================
  // PROFIT BACKGROUND
  // ===================================================

  const profitBackground =
    profit >= 0
      ? LIGHT_GREEN
      : LIGHT_RED;


  profitData.eachCell(
    (cell) => {

      applyFill(
        cell,
        profitBackground
      );

      cell.border =
        blackBorder;

      cell.alignment =
        center;

    }
  );


  // ===================================================
  // SPACE
  // ===================================================

  sheet.addRow([]);


  // ===================================================
  // PRODUCT TABLE HEADER
  // ===================================================

  const tableHeader =
    sheet.addRow([

      "S.NO",

      "PRODUCT",

      "CATEGORY",

      "QUANTITY",

      "UNIT COST",

      "TOTAL",

    ]);


  tableHeader.eachCell(
    (cell) => {

      styleHeader(
        cell,
        TEAL
      );

    }
  );


  // ===================================================
  // PRODUCT ROWS
  // ===================================================

  products.forEach(
    (product, index) => {

      const background =
        index % 2 === 0
          ? WHITE
          : LIGHT_TEAL;


      const row =
        sheet.addRow([

          index + 1,

          product.product_name,

          product.category,

          Number(
            product.quantity || 0
          ),

          Number(
            product.unit_price || 0
          ),

          Number(
            product.total || 0
          ),

        ]);


      row.eachCell(
        (cell, col) => {

          styleCell(
            cell,
            background
          );


          if (
            col === 5 ||
            col === 6
          ) {

            cell.numFmt =
              "#,##0.00";

          }

        }
      );


      // Unit Cost
      row.getCell(
        5
      ).font = {

        bold: true,

        color: {
          argb: BLUE,
        },

      };


      // Total
      row.getCell(
        6
      ).font = {

        bold: true,

        color: {
          argb: GREEN,
        },

      };

    }
  );


  // ===================================================
  // ADDITIONAL CHARGES
  // ===================================================

  additionalCharges.forEach(
    (charge, chargeIndex) => {

      const row =
        sheet.addRow([

          products.length +
            chargeIndex +
            1,

          charge.name,

          "Additional Charges",

          1,

          Number(
            charge.amount || 0
          ),

          Number(
            charge.amount || 0
          ),

        ]);


      row.eachCell(
        (cell, col) => {

          styleCell(
            cell,
            LIGHT_ORANGE
          );


          if (
            col === 5 ||
            col === 6
          ) {

            cell.numFmt =
              "#,##0.00";

          }

        }
      );


      row.getCell(
        2
      ).font = {

        bold: true,

        color: {
          argb: ORANGE,
        },

      };


      row.getCell(
        3
      ).font = {

        bold: true,

        color: {
          argb: ORANGE,
        },

      };


      row.getCell(
        5
      ).font = {

        bold: true,

        color: {
          argb: ORANGE,
        },

      };


      row.getCell(
        6
      ).font = {

        bold: true,

        color: {
          argb: ORANGE,
        },

      };

    }
  );


  // ===================================================
  // PANEL / INVERTER DETAILS
  // ===================================================

  const panelData =
    getPanelData(products);


  const inverterData =
    getInverterData(products);


  const rowCount =
    Math.max(
      panelData.length,
      inverterData.length
    );


  if (
    rowCount > 0
  ) {

    // -------------------------------------------------
    // SPACE
    // -------------------------------------------------

    sheet.addRow([]);


    // -------------------------------------------------
    // SECTION HEADER
    // -------------------------------------------------

    const detailsHeader =
      sheet.addRow([

        "PANEL / INVERTER DETAILS",

        "",

        "",

        "",

        "",

        "",

      ]);


    detailsHeader.eachCell(
      (cell) => {

        styleHeader(
          cell,
          DARK_BLUE
        );

      }
    );


    sheet.mergeCells(
      `A${detailsHeader.number}:E${detailsHeader.number}`
    );


    detailsHeader.getCell(
      1
    ).alignment = {

      horizontal: "center",

      vertical: "middle",

    };


    // -------------------------------------------------
    // DETAILS TABLE HEADER
    // -------------------------------------------------

    const serialHeader =
      sheet.addRow([

        "Panel Company",

        "Panel Serial Number",

        "Inverter Company",

        "Model",

        "Inverter Serial Number",

      ]);


    serialHeader.eachCell(
      (cell) => {

        styleHeader(
          cell,
          BLUE
        );

      }
    );


    // -------------------------------------------------
    // DETAILS DATA
    // -------------------------------------------------

    for (
      let index = 0;
      index < rowCount;
      index++
    ) {

      const panel =
        panelData[index];


      const inverter =
        inverterData[index];


      const row =
        sheet.addRow([

          // Company only on first row
          index === 0
            ? panel?.company || "-"
            : "",

          // Every panel serial
          panel?.serial || "-",

          // Inverter company only on first row
          index === 0
            ? inverter?.company || "-"
            : "",

          // Model only on first row
          index === 0
            ? inverter?.model || "-"
            : "",

          // Every inverter serial
          inverter?.serial || "-",

        ]);


      row.eachCell(
        (cell) => {

          styleCell(
            cell,
            index % 2 === 0
              ? WHITE
              : LIGHT_GREY
          );


          cell.alignment = {

            horizontal:
              "center",

            vertical:
              "middle",

            wrapText:
              true,

          };

        }
      );


      // Panel Company
      row.getCell(
        1
      ).font = {

        bold: true,

        color: {
          argb: BLACK,
        },

      };


      // Inverter Company
      row.getCell(
        3
      ).font = {

        bold: true,

        color: {
          argb: BLACK,
        },

      };


      // Model
      row.getCell(
        4
      ).font = {

        bold: true,

        color: {
          argb: BLACK,
        },

      };

    }

  }


  // ===================================================
  // SPACE BEFORE COST SUMMARY
  // ===================================================

  sheet.addRow([]);


  // ===================================================
  // COST SUMMARY HEADER
  // ===================================================

  const costHeader =
    sheet.addRow([

      "COST SUMMARY",

      "",

      "",

      "",

      "",

      "",

    ]);


  costHeader.eachCell(
    (cell) => {

      styleHeader(
        cell,
        DARK_BLUE
      );

    }
  );


  // ===================================================
  // COST SUMMARY ROWS
  // ===================================================

  const productCostRow =
    sheet.addRow([

      "Product Cost",

      "",

      "",

      "",

      "",

      productCost,

    ]);


  const extraCostRow =
    sheet.addRow([

      "Additional Charges",

      "",

      "",

      "",

      "",

      extraCost,

    ]);


  const plantCostRow =
    sheet.addRow([

      "Plant Cost",

      "",

      "",

      "",

      "",

      plantCost,

    ]);


  // ===================================================
  // PRODUCT COST
  // ===================================================

  productCostRow.eachCell(
    (cell) => {

      styleCell(
        cell,
        LIGHT_BLUE
      );

    }
  );


  productCostRow.getCell(
    6
  ).numFmt =
    "#,##0.00";


  productCostRow.getCell(
    6
  ).font = {

    bold: true,

    color: {
      argb: BLUE,
    },

  };


  // ===================================================
  // ADDITIONAL COST
  // ===================================================

  extraCostRow.eachCell(
    (cell) => {

      styleCell(
        cell,
        LIGHT_ORANGE
      );

    }
  );


  extraCostRow.getCell(
    6
  ).numFmt =
    "#,##0.00";


  extraCostRow.getCell(
    6
  ).font = {

    bold: true,

    color: {
      argb: ORANGE,
    },

  };


  // ===================================================
  // PLANT COST TOTAL
  // ===================================================

  plantCostRow.eachCell(
    (cell) => {

      styleCell(
        cell,
        DARK_BLUE
      );


      cell.font = {

        bold: true,

        color: {
          argb: WHITE,
        },

      };

    }
  );


  plantCostRow.getCell(
    6
  ).numFmt =
    "#,##0.00";


  plantCostRow.getCell(
    6
  ).font = {

    bold: true,

    color: {
      argb: WHITE,
    },

  };


  // ===================================================
  // COLUMN WIDTHS
  // ===================================================

  sheet.columns = [

    {
      width: 24,
    },

    {
      width: 30,
    },

    {
      width: 24,
    },

    {
      width: 22,
    },

    {
      width: 30,
    },

    {
      width: 20,
    },

  ];


  // ===================================================
  // ROW HEIGHTS
  // ===================================================

  sheet.eachRow(
    (row) => {

      row.height =
        23;

    }
  );


  sheet.getRow(
    1
  ).height =
    32;


  sheet.getRow(
    2
  ).height =
    26;


  // ===================================================
  // FREEZE HEADER AREA
  // ===================================================

  sheet.views = [

    {

      state:
        "frozen",

      ySplit:
        10,

    },

  ];


  // ===================================================
  // DOWNLOAD
  // ===================================================

  const buffer =
    await workbook.xlsx.writeBuffer();


  saveAs(

    new Blob([
      buffer,
    ]),

    `${
      item.customers?.customer_name ||
      item.customer_name ||
      "Used_Inventory"
    }_Used_Inventory.xlsx`

  );

}
