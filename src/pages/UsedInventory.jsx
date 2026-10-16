import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import ExcelJS from "exceljs"; 
import { saveAs } from "file-saver";
import { useEffect, useState } from "react";

import UsedInventoryModal from "../components/UsedInventoryModal";
import ViewUsedInventoryModal from "../components/ViewUsedInventoryModal";

import {
  getUsedInventory,
  deleteUsedInventory,
  syncInventoryUsedQuantities,
} from "../services/usedInventoryService";

import {
  downloadUsedInventoryPDF,
} from "../services/usedInventoryExport";

import { getCustomers } from "../services/customersService";
import { getProjects } from "../services/projectsService";

import {
  Pencil,
  Trash2,
  Download,
  FileText,
  FileSpreadsheet,
  X,
} from "lucide-react";

export default function UsedInventory() {

  // ============================================================
  // STATE
  // ============================================================

  const [items, setItems] = useState([]);

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);

  const [editingItem, setEditingItem] = useState(null);

  const [viewItem, setViewItem] = useState(null);

  const [isPdfGenerating, setIsPdfGenerating] =
  useState(false);
  // Which row's download menu is open
  const [downloadMenu, setDownloadMenu] = useState(null);


  // ============================================================
  // LOAD DATA
  // ============================================================

  useEffect(() => {
    loadUsedInventory();
  }, []);


  async function loadUsedInventory() {

    try {

      const [
        usedData,
        customers,
        projects,
      ] = await Promise.all([
        getUsedInventory(),
        getCustomers(),
        getProjects(),
      ]);


      // ============================================================
      // PROJECT TOTAL VALUE MAP
      // ============================================================

      const projectValueMap = {};

      (projects || []).forEach((project) => {

        if (!project?.project_no) {
          return;
        }

        projectValueMap[
          String(project.project_no)
            .trim()
            .toLowerCase()
        ] = Number(
          project.total_amount || 0
        );

      });


      // ============================================================
      // ADD PROJECT VALUE TO MATERIAL CONSUMPTION DATA
      // ============================================================

      const enrichedData =
        (usedData || []).map((item) => {

          const projectKey =
            String(item.project_no || "")
              .trim()
              .toLowerCase();

          return {

            ...item,

            plant_total_value:
              projectValueMap[projectKey] || 0,

          };

        });


      // ============================================================
      // SORT CUSTOMERS BY ACTUAL CREATION TIME
      // ============================================================

      const sortedCustomers =
        [...(customers || [])].sort(
          (a, b) => {

            const dateA = new Date(
              a.created_at ||
              a.createdAt ||
              a.date ||
              0
            ).getTime();

            const dateB = new Date(
              b.created_at ||
              b.createdAt ||
              b.date ||
              0
            ).getTime();

            return dateA - dateB;

          }
        );


      // ============================================================
      // CUSTOMER CREATION ORDER
      // ============================================================

      const customerOrder = {};

      sortedCustomers.forEach(
        (customer, index) => {

          customerOrder[customer.id] =
            index;

        }
      );


      // ============================================================
// SORT MATERIAL CONSUMPTION BY PROJECT NUMBER
// ============================================================

const sortedData =
  [...enrichedData].sort(
    (a, b) => {

      const projectA =
        String(a.project_no || "").trim();

      const projectB =
        String(b.project_no || "").trim();

      // Keep records without a project number at the end
      if (!projectA && !projectB) {
        return 0;
      }

      if (!projectA) {
        return 1;
      }

      if (!projectB) {
        return -1;
      }

      // Numeric-aware sorting:
      // PRJ-2026-0001
      // PRJ-2026-0002
      // PRJ-2026-0003
      // ...
      // PRJ-2026-0009
      // PRJ-2026-0010
      return projectA.localeCompare(
        projectB,
        undefined,
        {
          numeric: true,
          sensitivity: "base",
        }
      );

    }
  );

      setItems(sortedData);

      return sortedData;

   } catch (error) {

  console.error(
    "LOAD USED INVENTORY ERROR:",
    error
  );

  alert(
    error?.message ||
    error?.details ||
    error?.hint ||
    "Unable to load material consumption records."
  );

  setItems([]);

  return [];

}

  }


  // ============================================================
  // DELETE
  // ============================================================

  async function handleDelete(item) {

    if (!item?.allEntries?.length) {

      alert(
        "Material consumption record not found."
      );

      return;

    }


    const entries = item.allEntries;


    const message =
      entries.length > 1
        ? `This material consumption contains ${entries.length} records.\n\nDelete all records for this customer / plant?`
        : "Delete this material consumption record?";


    if (!window.confirm(message)) {

      return;

    }


    try {

     // --------------------------------------------------------
// DELETE EVERY DATABASE RECORD IN THIS GROUP
// --------------------------------------------------------

for (const entry of entries) {

  await deleteUsedInventory(
    entry.id,
    {
      skipSync: true,
    }
  );

}


// --------------------------------------------------------
// SYNC INVENTORY ONCE AFTER ALL RECORDS ARE DELETED
// --------------------------------------------------------

await syncInventoryUsedQuantities();


// --------------------------------------------------------
// RELOAD TABLE
// --------------------------------------------------------

await loadUsedInventory();


      // --------------------------------------------------------
      // CLOSE MODALS
      // --------------------------------------------------------

      setViewItem(null);

      setEditingItem(null);

      setShowModal(false);

      setDownloadMenu(null);


    } catch (error) {

      console.error(
        "DELETE MATERIAL CONSUMPTION ERROR:",
        error
      );


      alert(
        error?.message ||
        "Unable to delete material consumption."
      );

    }

  }

  // ============================================================
// PDF DOWNLOAD
// ============================================================

async function handlePDFDownload(item) {
  try {
    await downloadUsedInventoryPDF(item);
  } catch (error) {
    console.error(
      "PDF DOWNLOAD ERROR:",
      error
    );

    alert(
      error?.message ||
      "Unable to download PDF."
    );
  } finally {
    setDownloadMenu(null);
  }
}

// ============================================================
// OPEN ADD
// ============================================================

function handleAdd() {
  setEditingItem(null);
  setShowModal(true);
}


// ============================================================
// OPEN EDIT
// ============================================================

function handleEdit(item) {
  setEditingItem(item);
  setShowModal(true);
  setDownloadMenu(null);
}


// ============================================================
// CLOSE EDIT MODAL
// ============================================================

function handleCloseModal() {
  setShowModal(false);
  setEditingItem(null);
}


  // ============================================================
  // GROUP MATERIAL CONSUMPTION
  // ============================================================

  const groupedItems = Object.values(

    items.reduce(
      (acc, item) => {

        const key =
          `${item.customer_id}_${item.plant_size}_${item.location}`;


        // ------------------------------------------------------
        // FIRST RECORD OF GROUP
        // ------------------------------------------------------

        if (!acc[key]) {

          acc[key] = {

            ...item,

            // Keep every actual database record
            allEntries: [item],

            // Explicit group ID
            group_id: key,

            // Copy products
            products: [
              ...(item.products || [])
            ],

            // Total plant cost
            total_plant_cost:
              Number(
                item.total_plant_cost || 0
              ),

            // Plant total value
            plant_total_value:
              Number(
                item.plant_total_value || 0
              ),

          };

        }

        // ------------------------------------------------------
        // ADDITIONAL RECORD IN SAME GROUP
        // ------------------------------------------------------

        else {

          acc[key].allEntries.push(item);


          acc[key].products.push(
            ...(item.products || [])
          );


          acc[key].total_plant_cost +=
            Number(
              item.total_plant_cost || 0
            );

        }


        return acc;

      },
      {}
    )

  );


  // ============================================================
  // SEARCH
  // ============================================================

  const filteredItems =
    groupedItems.filter((item) => {

      const key =
        search
          .toLowerCase()
          .trim();


      return (

        item.customers
          ?.customer_name
          ?.toLowerCase()
          .includes(key)

        ||

        item.project_no
          ?.toLowerCase()
          .includes(key)

      );

    });


  // ============================================================
  // FORMAT CURRENCY
  // ============================================================

  function formatCurrency(value) {

    return Number(value || 0)
      .toLocaleString("en-IN", {
        maximumFractionDigits: 2,
      });

  }


  // ============================================================
  // GET PLANT TOTAL VALUE
  // ============================================================

  function getPlantTotalValue(item) {

    return Number(
      item?.plant_total_value || 0
    );

  }


  // ============================================================
  // GET PLANT COST
  // ============================================================

  function getPlantCost(item) {

    return Number(
      item?.total_plant_cost || 0
    );

  }


  // ============================================================
  // GET PROFIT
  // ============================================================

  function getProfit(item) {

    const plantCost =
      getPlantCost(item);

    const plantValue =
      getPlantTotalValue(item);


    // Same rule as Profit Report:
    // If plant cost is zero, profit remains zero.

    if (plantCost <= 0) {

      return 0;

    }


    return plantValue - plantCost;

  }


  // ============================================================
  // CSV HELPER
  // ============================================================

  function escapeCSV(value) {

    const text =
      String(value ?? "");

    return `"${text.replace(
      /"/g,
      '""'
    )}"`;

  }


async function downloadUsedInventoryCSV(item) {
  const plantValue = getPlantTotalValue(item);
  const plantCost = getPlantCost(item);
  const profit = getProfit(item);

  function cleanArray(value) {
    if (!Array.isArray(value)) return [];
    return value.map((entry) => String(entry ?? "").trim()).filter(Boolean);
  }

  function getDisplayProductName(product) {
    const productName = String(product?.product_name || "").trim();
    const category = String(product?.category || "").trim();
    const company = String(
      product?.company ||
      product?.brand ||
      product?.manufacturer ||
      ""
    ).trim();

    const specification = String(
      product?.specification ||
      product?.capacity ||
      product?.panel_capacity ||
      product?.inverter_capacity ||
      ""
    ).trim();

    const lowerName = productName.toLowerCase();

    if (
      lowerName === "panel" ||
      category.toLowerCase() === "panel"
    ) {
      return [company, specification, "Panel"]
        .filter(Boolean)
        .join(" ");
    }

    if (
      lowerName === "inverter" ||
      category.toLowerCase() === "inverter"
    ) {
      return [company, specification, "Inverter"]
        .filter(Boolean)
        .join(" ");
    }

    

    return productName || "-";
  }

  function isPanel(product) {
    return (
      String(product?.category || "").trim().toLowerCase() ===
        "panel" ||
      String(product?.product_name || "").trim().toLowerCase() ===
        "panel"
    );
  }

  function isInverter(product) {
    return (
      String(product?.category || "").trim().toLowerCase() ===
        "inverter" ||
      String(product?.product_name || "").trim().toLowerCase() ===
        "inverter"
    );
  }

  function formatInventoryUnit(product) {
    const productName = String(
      product?.product_name || ""
    )
      .trim()
      .toLowerCase();

    if (productName.includes("c channel")) return "Ft";

    const unit = String(
      product?.unit || product?.units || ""
    )
      .trim()
      .toLowerCase();

    if (["ft", "feet", "foot"].includes(unit)) return "Ft";
    if (
      ["mtr", "meter", "metre", "meters", "metres"].includes(unit)
    )
      return "Mtr";
    if (
      ["nos", "no", "pcs", "pc", "piece", "pieces"].includes(unit)
    )
      return "Nos";
    if (["kg", "kgs"].includes(unit)) return "Kg";
    if (["pair", "pairs"].includes(unit)) return "Pair";
    if (["set", "sets"].includes(unit)) return "Set";
    if (["pack", "packs"].includes(unit)) return "Pack";
    if (["roll", "rolls"].includes(unit)) return "Roll";
    if (["box", "boxes"].includes(unit)) return "Box";

    return "Nos";
  }

  // ============================================================
  // MATERIAL CALCULATIONS
  // ============================================================

  const allProducts = Object.values(
    (item?.products || [])
      .filter(
        (product) =>
          Number(product?.quantity || 0) > 0
      )
      .reduce((acc, product) => {
        const unitPrice = Number(
          product?.unit_price ??
            product?.unit_cost ??
            product?.price ??
            0
        );

        const key =
          (product?.product_name || "") +
          "_" +
          (product?.category || "") +
          "_" +
          (product?.company || "") +
          "_" +
          (product?.specification || "") +
          "_" +
          unitPrice;

        const serialNumbers = cleanArray(
          product?.serial_numbers
        );

        const inverterModels = cleanArray(
          product?.inverter_models
        );

        if (!acc[key]) {
          acc[key] = {
            ...product,
            product_name:
              getDisplayProductName(product),
            category: product?.category || "",
            company: product?.company || "",
            specification:
              product?.specification || "",
            quantity: Number(
              product?.quantity || 0
            ),
            unit_price: unitPrice,
            total: Number(
              product?.total || 0
            ),
            serial_numbers: [
              ...serialNumbers,
            ],
            inverter_models: [
              ...inverterModels,
            ],
          };
        } else {
          acc[key].quantity += Number(
            product?.quantity || 0
          );

          acc[key].total += Number(
            product?.total || 0
          );

          acc[key].serial_numbers = [
            ...(acc[key].serial_numbers || []),
            ...serialNumbers,
          ];

          acc[key].inverter_models = [
            ...(acc[key].inverter_models || []),
            ...inverterModels,
          ];
        }

        return acc;
      }, {})
  ).map((product) => {
    const quantity = Number(
      product?.quantity || 0
    );

    const unitPrice = Number(
      product?.unit_price || 0
    );

    return {
      ...product,
      total:
        Number(product?.total || 0) > 0
          ? Number(product.total)
          : quantity * unitPrice,
      serial_numbers: cleanArray(
        product?.serial_numbers
      ),
      inverter_models: cleanArray(
        product?.inverter_models
      ),
    };
  });

  const additionalCharges = [
    {
      name: "Bhada Charges",
      amount: Number(item?.bhada_charges ?? 0),
    },
    {
      name: "Cement Charges",
      amount: Number(item?.cement_charges ?? 0),
    },
    {
      name: "Gitti Charges",
      amount: Number(item?.gitti_charges ?? 0),
    },
    {
      name: "Installation Charges",
      amount: Number(
        item?.installation_charges ?? 0
      ),
    },
    {
      name: "JE Charges",
      amount: Number(item?.je_charges ?? 0),
    },
    {
      name: "Load Extension Charges",
      amount: Number(
        item?.load_extension_charges ?? 0
      ),
    },
    {
      name: "Meter Connection Charges",
      amount: Number(
        item?.meter_connection_charges ?? 0
      ),
    },
    {
      name: "Meter Name Change Charge",
      amount: Number(
        item?.name_change_charges ?? 0
      ),
    },
    {
      name: "Meter Change Charge",
      amount: Number(
        item?.meter_change_charges ?? 0
      ),
    },
    {
      name: "Net Metering Charges",
      amount: Number(
        item?.net_metering_charges ?? 0
      ),
    },
    {
      name: "Sand Charges",
      amount: Number(
        item?.sand_charges ?? 0
      ),
    },
    {
      name: "Vendor Charges",
      amount: Number(
        item?.vendor_charges ?? 0
      ),
    },
  ].filter(
    (charge) => charge.amount > 0
  );

  const productCost = allProducts.reduce(
    (sum, product) =>
      sum + Number(product?.total || 0),
    0
  );

  const extraCost = additionalCharges.reduce(
    (sum, charge) =>
      sum + Number(charge?.amount || 0),
    0
  );

  const grandTotal =
    productCost + extraCost;

  const viewProfit =
    Number(plantValue || 0) -
    grandTotal;

  const profitPercent =
    Number(plantValue || 0) > 0
      ? (viewProfit /
          Number(plantValue || 0)) *
        100
      : 0;

  const panelProducts =
    allProducts.filter((product) =>
      isPanel(product)
    );

  const inverterProducts =
    allProducts.filter((product) =>
      isInverter(product)
    );

  const panelData =
    panelProducts.flatMap((product) => {
      const serials = cleanArray(
        product?.serial_numbers
      );

      const quantity = Number(
        product?.quantity || 0
      );

      const count = Math.max(
        quantity,
        serials.length
      );

      return Array.from(
        { length: count },
        (_, index) => ({
          company:
            product?.company || "-",
          serial:
            serials[index] || "-",
        })
      );
    });

  const inverterData =
    inverterProducts.flatMap((product) => {
      const serials = cleanArray(
        product?.serial_numbers
      );

      let models = cleanArray(
        product?.inverter_models
      );

      if (
        !models.length &&
        product?.specification
      ) {
        models = [
          String(
            product.specification
          ).trim(),
        ];
      }

      const quantity = Number(
        product?.quantity || 0
      );

      const count = Math.max(
        quantity,
        serials.length,
        models.length
      );

      return Array.from(
        { length: count },
        (_, index) => ({
          company:
            product?.company || "-",
          model:
            models[index] || "-",
          serial:
            serials[index] || "-",
        })
      );
    });

  // ============================================================
  // EXCEL WORKBOOK
  // ============================================================

  const workbook =
    new ExcelJS.Workbook();

  const sheet =
    workbook.addWorksheet(
      "Material Consumption"
    );

  // Same colours as Payment Report
  const WHITE = "FFFFFF";
  const DARK_BLUE = "1E3A8A";
  const ORANGE = "D97706";

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

  function styleHeader(cell) {
    cell.font = {
      bold: true,
      color: { argb: WHITE },
    };

    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: ORANGE },
    };

    cell.alignment = center;
    cell.border = thinBorder;
  }

  function styleCell(cell) {
    cell.alignment = center;
    cell.border = thinBorder;
  }

  function styleSectionTitle(cell) {
    cell.font = {
      bold: true,
      color: { argb: WHITE },
    };

    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: DARK_BLUE },
    };

    cell.alignment = center;
    cell.border = thinBorder;
  }

  // ============================================================
  // 1. COMPANY HEADER
  // ============================================================

  sheet.mergeCells("A1:I1");

  const company =
    sheet.getCell("A1");

  company.value =
    "SHIV SHAKTI SOLAR ENERGY";

  company.font = {
    size: 18,
    bold: true,
    color: { argb: WHITE },
  };

  company.alignment = center;

  company.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: DARK_BLUE },
  };

  sheet.getRow(1).height = 28;

  // ============================================================
  // 2. REPORT TITLE
  // ============================================================

  sheet.mergeCells("A2:I2");

  const title =
    sheet.getCell("A2");

  title.value =
    "MATERIAL CONSUMPTION REPORT";

  title.font = {
  size: 14,
  bold: true,
  color: { argb: "000000" },
};

title.alignment = center;

title.fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: ORANGE },
};

  sheet.getRow(2).height = 24;

  // ============================================================
  // 3. CUSTOMER INFORMATION
  // ============================================================

  sheet.mergeCells("A4:D4");

  const customerSection =
    sheet.getCell("A4");

  customerSection.value =
    "CUSTOMER INFORMATION";

  styleSectionTitle(
    customerSection
  );

  const customerHeader =
    sheet.addRow([
      "Customer Name",
      "Project No",
      "Plant Size",
      "Location",
    ]);

  customerHeader.eachCell(
    (cell) => {
      styleHeader(cell);
    }
  );

  const customerRow =
    sheet.addRow([
      item?.customers
        ?.customer_name ||
        item?.customer_name ||
        "-",

      item?.project_no || "-",

      item?.plant_size
        ? `${item.plant_size} KW`
        : "-",

      item?.location || "-",
    ]);

  customerRow.eachCell(
    (cell) => {
      styleCell(cell);
    }
  );

  sheet.addRow([]);

  // ============================================================
  // 4. FINANCIAL SUMMARY
  // ============================================================

  sheet.mergeCells("A8:D8");

  const financialSection =
    sheet.getCell("A8");

  financialSection.value =
    "FINANCIAL SUMMARY";

  styleSectionTitle(
    financialSection
  );

  const financialHeader =
    sheet.addRow([
      "Plant Total Value",
      "Plant Cost",
      "Profit",
      "Profit %",
    ]);

  financialHeader.eachCell(
    (cell) => {
      styleHeader(cell);
    }
  );

  const financialRow =
    sheet.addRow([
      Number(
        plantValue || 0
      ),

      Number(
        grandTotal || 0
      ),

      Number(
        viewProfit || 0
      ),

      Number(
        profitPercent || 0
      ) / 100,
    ]);

  financialRow.eachCell(
    (cell, columnNumber) => {
      styleCell(cell);

      if (columnNumber <= 3) {
        cell.numFmt = "#,##0.00";
      }

      if (columnNumber === 4) {
        cell.numFmt = '0.00"%"';
      }
    }
  );

  sheet.addRow([]);

  // ============================================================
  // 5. MATERIALS USED
  // ============================================================

  sheet.mergeCells("A11:G11");

  const materialsSection =
    sheet.getCell("A11");

  materialsSection.value =
    "MATERIALS USED";

  styleSectionTitle(
    materialsSection
  );

  const materialsHeader =
    sheet.addRow([
      "S.No",
      "Product",
      "Category",
      "Quantity",
      "Unit",
      "Unit Price",
      "Total",
    ]);

  materialsHeader.eachCell(
    (cell) => {
      styleHeader(cell);
    }
  );

  let serialCounter = 1;

  allProducts.forEach(
    (product) => {
      const row = sheet.addRow([
        serialCounter++,
        product?.product_name || "-",
        product?.category || "-",
        Number(
          product?.quantity || 0
        ),
        formatInventoryUnit(
          product
        ),
        Number(
          product?.unit_price || 0
        ),
        Number(
          product?.total || 0
        ),
      ]);

      row.eachCell(
        (cell) => {
          styleCell(cell);
        }
      );

      row.getCell(6).numFmt =
        "#,##0.00";

      row.getCell(7).numFmt =
        "#,##0.00";
    }
  );

  additionalCharges.forEach(
    (charge) => {
      const row = sheet.addRow([
        serialCounter++,
        charge?.name || "-",
        "Additional Charges",
        1,
        "",
        Number(
          charge?.amount || 0
        ),
        Number(
          charge?.amount || 0
        ),
      ]);

      row.eachCell(
        (cell) => {
          styleCell(cell);
        }
      );

      row.getCell(6).numFmt =
        "#,##0.00";

      row.getCell(7).numFmt =
        "#,##0.00";
    }
  );

  sheet.addRow([]);
  sheet.addRow([]);
  sheet.addRow([]);

  // ============================================================
  // 6. PANEL & INVERTER DETAILS
  // ============================================================

  const panelSectionRow =
    sheet.lastRow.number + 1;

  sheet.mergeCells(
    `A${panelSectionRow}:E${panelSectionRow}`
  );

  const panelSection =
    sheet.getCell(
      `A${panelSectionRow}`
    );

  panelSection.value =
    "PANEL & INVERTER DETAILS";

  styleSectionTitle(
    panelSection
  );

  const panelHeader =
    sheet.addRow([
      "Panel Company",
      "Serial Number",
      "Inverter Company",
      "Model",
      "Serial Number",
    ]);

  panelHeader.eachCell(
    (cell) => {
      styleHeader(cell);
    }
  );

  const maxRows = Math.max(
    panelData.length,
    inverterData.length
  );

  for (
    let i = 0;
    i < maxRows;
    i++
  ) {
    const panel =
      panelData[i] || {};

    const inverter =
      inverterData[i] || {};

    const row =
      sheet.addRow([
        panel.company &&
        panel.company !== "-"
          ? panel.company
          : "",

        panel.serial || "",

        inverter.company &&
        inverter.company !== "-"
          ? inverter.company
          : "",

        inverter.model || "",

        inverter.serial || "",
      ]);

    row.eachCell(
      (cell) => {
        styleCell(cell);
      }
    );
  }

  sheet.addRow([]);
  sheet.addRow([]);

  // ============================================================
  // 7. FINAL COST SUMMARY
  // ============================================================

  const finalSectionRow =
    sheet.lastRow.number + 1;

  sheet.mergeCells(
    `E${finalSectionRow}:F${finalSectionRow}`
  );

  const finalSection =
    sheet.getCell(
      `E${finalSectionRow}`
    );

  finalSection.value =
    "FINAL COST SUMMARY";

  styleSectionTitle(
    finalSection
  );

 const finalRows = [
  [
    "Product Cost",
    Number(productCost || 0),
  ],
  [
    "Additional Charges",
    Number(extraCost || 0),
  ],
  [
    "Total Cost",
    Number(grandTotal || 0),
  ],
];

 finalRows.forEach(
  ([label, amount]) => {
    const row = sheet.addRow([
      "",
      "",
      "",
      "",
      label,
      amount,
    ]);

    // Apply borders ONLY to the actual summary cells
    styleCell(row.getCell(5));
    styleCell(row.getCell(6));

    row.getCell(6).numFmt =
      "#,##0.00";
  }
);

  // ============================================================
  // AUTO WIDTH
  // ============================================================

  sheet.columns.forEach(
    (column) => {
      let max = 15;

      column.eachCell(
        {
          includeEmpty: true,
        },
        (cell) => {
          const length =
            String(
              cell.value ?? ""
            ).length + 4;

          if (length > max) {
            max = length;
          }
        }
      );

      column.width =
        Math.min(max, 40);
    }
  );

  // ============================================================
  // FREEZE
  // ============================================================

  sheet.views = [
  {
    state: "frozen",
    ySplit: 12,
  },
];

  // ============================================================
  // DOWNLOAD EXCEL
  // ============================================================

  const buffer =
    await workbook.xlsx.writeBuffer();

  const customerName =
    item?.customers
      ?.customer_name ||
    item?.customer_name ||
    "Used_Inventory";

  saveAs(
    new Blob([buffer]),
    `${customerName}_Material_Consumption.xlsx`
  );
}


// ============================================================
// RENDER
// ============================================================

return (
  <div
    className="p-4 bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 min-h-screen"
    onClick={() => {
      if (downloadMenu !== null) {
        setDownloadMenu(null);
      }
    }}
  >

    {/* ======================================================
        HEADER
    ====================================================== */}

    <div className="mb-4 rounded-2xl bg-gradient-to-r from-indigo-700 via-blue-600 to-cyan-500 p-4 shadow-xl">

      <div className="flex justify-between items-center">

        <div>

          <h1 className="text-3xl font-bold text-white tracking-wide">
            Material Consumption
          </h1>

          <p className="text-blue-100 mt-2 text-lg">
            Material Consumption Management
          </p>

        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleAdd();
          }}
          className="px-4 py-2 rounded-lg bg-white text-indigo-700 font-semibold shadow hover:shadow-lg transition-all"
        >
          + Add Material Consumption
        </button>

      </div>

    </div>


    {/* ======================================================
        SEARCH
    ====================================================== */}

    <div className="bg-white rounded-xl shadow border border-slate-300 p-1 mb-2">

      <input
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition-all duration-300 focus:border-indigo-500 focus:bg-white"
        placeholder="Search Customer or Project No..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

    </div>


    {/* ======================================================
        TABLE
    ====================================================== */}

    <div className="overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200">

      <div className="overflow-x-auto">

        <table className="w-full border-collapse border-2 border-black">

          <thead className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-900 text-white">

            <tr>

              <th className="border border-black px-3 py-2 text-center text-sm font-bold">
                Project No
              </th>

              <th className="border border-black px-3 py-2 text-center text-sm font-bold">
                Customer
              </th>

              <th className="border border-black px-3 py-2 text-center text-sm font-bold">
                Plant Size
              </th>

              <th className="border border-black px-3 py-2 text-center text-sm font-bold">
                Total Plant Value
              </th>

              <th className="border border-black px-3 py-2 text-center text-sm font-bold">
                Plant Cost
              </th>

              <th className="border border-black px-3 py-2 text-center text-sm font-bold">
                Profit
              </th>

              <th className="border border-black px-3 py-2 text-center text-sm font-bold">
                Action
              </th>

            </tr>

          </thead>


          <tbody>

            {filteredItems.map((item) => {

              const plantValue =
                getPlantTotalValue(item);

              const plantCost =
                getPlantCost(item);

              const profit =
                getProfit(item);


              return (
                <tr
                  key={
                    item.group_id ||
                    item.id
                  }
                  className="hover:bg-slate-100 transition"
                >

                  {/* PROJECT NO */}

                  {/* PROJECT NO / VIEW */}

<td className="border border-black px-3 py-2 text-center">
  <button
    type="button"
    title="View Material Consumption"
    onClick={() => setViewItem(item)}
    className="font-semibold text-indigo-700 hover:text-indigo-900 hover:underline transition cursor-pointer"
  >
    {item.project_no || "-"}
  </button>
</td>


                  {/* CUSTOMER */}

                  <td className="border border-black px-3 py-2 text-center font-medium text-slate-800">
                    {
                      item.customers
                        ?.customer_name ||
                      "-"
                    }
                  </td>


                  {/* PLANT SIZE */}

                  <td className="border border-black px-3 py-2 text-center">
                    {item.plant_size
                      ? `${item.plant_size} KW`
                      : "-"}
                  </td>


                  {/* TOTAL PLANT VALUE */}

                  <td className="border border-black px-3 py-2 text-center font-semibold text-blue-700">
                    ₹{" "}
                    {formatCurrency(
                      plantValue
                    )}
                  </td>


                  {/* PLANT COST */}

                  <td className="border border-black px-3 py-2 text-center font-semibold text-orange-700">
                    ₹{" "}
                    {formatCurrency(
                      plantCost
                    )}
                  </td>


                  {/* PROFIT */}

                  <td
                    className={`border border-black px-3 py-2 text-center font-bold ${
                      profit >= 0
                        ? "text-green-700"
                        : "text-red-700"
                    }`}
                  >
                    ₹{" "}
                    {formatCurrency(
                      profit
                    )}
                  </td>


                  {/* ACTION */}

                  <td className="border border-black px-3 py-2">

                    <div
                      className="flex items-center justify-center gap-2"
                      onClick={(e) =>
                        e.stopPropagation()
                      }
                    >



                      {/* EDIT */}

                      <button
                        type="button"
                        title="Edit"
                        onClick={() =>
                          handleEdit(item)
                        }
                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-sky-600 hover:bg-sky-700 text-white transition shadow-sm"
                      >
                        <Pencil size={17} />
                      </button>


                      {/* DELETE */}

                      <button
                        type="button"
                        title="Delete"
                        onClick={() =>
                          handleDelete(item)
                        }
                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition shadow-sm"
                      >
                        <Trash2 size={17} />
                      </button>


                      {/* DOWNLOAD */}

                      <div className="relative">

                        <button
                          type="button"
                          title="Download"
                          onClick={(e) => {

                            e.stopPropagation();

                            setDownloadMenu(
                              downloadMenu ===
                                item.group_id
                                ? null
                                : item.group_id
                            );

                          }}
                          className="w-9 h-9 flex items-center justify-center rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm"
                        >
                          <Download size={17} />
                        </button>


                        {/* DOWNLOAD MENU */}

                        {downloadMenu ===
                          item.group_id && (

                          <div
                            className="absolute right-0 top-11 z-50 w-40 rounded-xl bg-white border border-slate-200 shadow-xl p-1"
                            onClick={(e) =>
                              e.stopPropagation()
                            }
                          >

                            <button
                              type="button"
                              onClick={() =>
                                handlePDFDownload(
                                  item
                                )
                              }
                              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-red-50 hover:text-red-700 transition"
                            >
                              <FileText size={17} />
                              Download PDF
                            </button>


                            <button
                              type="button"
                              onClick={() =>
                                downloadUsedInventoryCSV(
                                  item
                                )
                              }
                              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-green-50 hover:text-green-700 transition"
                            >
                              <FileSpreadsheet size={17} />
                              Download CSV
                            </button>

                          </div>

                        )}

                      </div>

                    </div>

                  </td>

                </tr>
              );

            })}


            {/* EMPTY STATE */}

            {filteredItems.length === 0 && (

              <tr>

                <td
                  colSpan="7"
                  className="border border-black px-4 py-8 text-center text-gray-500"
                >
                  No material consumption records found.
                </td>

              </tr>

            )}

          </tbody>

        </table>

      </div>

    </div>


    {/* ======================================================
        ADD / EDIT MODAL
    ====================================================== */}

    <UsedInventoryModal
      open={showModal}
      item={editingItem}
      onClose={handleCloseModal}
      onSaved={async () => {
        await loadUsedInventory();
        handleCloseModal();
      }}
    />


    {/* ======================================================
        VIEW MODAL
    ====================================================== */}

    <ViewUsedInventoryModal
  open={!!viewItem}
  item={viewItem}
  onClose={() => {
    setViewItem(null);
  }}
/>

  </div>
);

}