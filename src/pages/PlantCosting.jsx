import { useEffect, useMemo, useState } from "react";

import {
  Pencil,
  Check,
  Trash2,
  Plus,
  ArrowLeft,
  Home,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  plantTemplates,
  panelOptions,
  inverterOptions,
  manualCostItems,
} from "../utils/plantTemplates";

import { getInventory } from "../services/inventoryService";

// =====================================================
// DEFAULT ADDITIONAL CHARGES
// =====================================================

const DEFAULT_ADDITIONAL_CHARGES = manualCostItems.map(
  (item) => ({
    item,
    price: 0,
  })
);

// =====================================================
// HELPERS
// =====================================================

function normalizeText(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function normalizeCompact(value) {
  return normalizeText(value).replace(
    /[^a-z0-9]/g,
    ""
  );
}

// =====================================================
// REMOVE DUPLICATE PRODUCT NAMES
// =====================================================

function cleanProductName(value) {
  const text = String(value ?? "").trim();

  if (!text) {
    return "";
  }

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const uniqueLines = [];

  lines.forEach((line) => {
    const exists = uniqueLines.some(
      (existing) =>
        normalizeCompact(existing) ===
        normalizeCompact(line)
    );

    if (!exists) {
      uniqueLines.push(line);
    }
  });

  return uniqueLines.join("\n");
}

// =====================================================
// INVENTORY DATE
// =====================================================

function getInventoryDateValue(row) {
  const dateValue =
    row?.date ??
    row?.created_at ??
    null;

  if (!dateValue) {
    return 0;
  }

  const time = new Date(dateValue).getTime();

  return Number.isFinite(time)
    ? time
    : 0;
}

// =====================================================
// SORT LATEST INVENTORY FIRST
// =====================================================

function sortLatestInventory(rows) {
  return [...rows].sort((a, b) => {
    const dateA =
      getInventoryDateValue(a);

    const dateB =
      getInventoryDateValue(b);

    if (dateB !== dateA) {
      return dateB - dateA;
    }

    const idA = Number(a?.id);
    const idB = Number(b?.id);

    if (
      Number.isFinite(idA) &&
      Number.isFinite(idB)
    ) {
      return idB - idA;
    }

    return 0;
  });
}

// =====================================================
// LATEST INVENTORY ENTRY FOR NORMAL PRODUCTS
// =====================================================

function getLatestInventoryEntry(
  inventory,
  productName
) {
  if (!Array.isArray(inventory)) {
    return null;
  }

  const target =
    normalizeCompact(
      cleanProductName(productName)
    );

  if (!target) {
    return null;
  }

  const matches = inventory.filter(
    (row) => {
      if (row?.active === false) {
        return false;
      }

      const inventoryName =
        normalizeCompact(
          cleanProductName(
            row?.product_name
          )
        );

      return (
        inventoryName === target
      );
    }
  );

  if (!matches.length) {
    return null;
  }

  return sortLatestInventory(
    matches
  )[0];
}

// =====================================================
// GST
// =====================================================

function getInventoryGST(row) {
  // GST is already included in Master Inventory unit_cost.
  // Do not add GST again in Plant Costing.
  return 0;
}
// =====================================================
// UNIT COST
// =====================================================


function getInventoryUnitPrice(row) {
  if (!row) {
    return 0;
  }

  const unitCost = Number(row.unit_cost);

  if (!Number.isFinite(unitCost)) {
    return 0;
  }

  return Number(unitCost.toFixed(2));
}

// =====================================================
// OPTION POSSIBLE NAMES
// =====================================================

function getOptionProductNames(option) {
  if (!option) {
    return [];
  }

  const values = [
    option.product_name,
    option.item,
    option.label,
    option.name,
  ];

  const result = [];

  values.forEach((value) => {
    if (!value) {
      return;
    }

    const cleaned =
      cleanProductName(value);

    if (!cleaned) {
      return;
    }

    const exists = result.some(
      (existing) =>
        normalizeCompact(existing) ===
        normalizeCompact(cleaned)
    );

    if (!exists) {
      result.push(cleaned);
    }
  });

  return result;
}

// =====================================================
// FIND LATEST INVENTORY FOR PANEL / INVERTER
// =====================================================

function findInventoryForOption(
  inventory,
  option,
  type,
  selectedSize
) {
  if (!Array.isArray(inventory)) {
    return null;
  }

  if (!option) {
    return null;
  }

  const possibleNames =
    getOptionProductNames(option);

  // ===================================================
  // STEP 1
  // EXACT PRODUCT NAME MATCH
  // ===================================================

  for (const possibleName of possibleNames) {
    const exactMatches =
      inventory.filter((row) => {
        if (row?.active === false) {
          return false;
        }

        const rowName =
          normalizeCompact(
            cleanProductName(
              row?.product_name
            )
          );

        return (
          rowName ===
          normalizeCompact(
            possibleName
          )
        );
      });

    if (exactMatches.length) {
      /*
        For inverter, if multiple rows have
        the same company/product name, first
        prefer the selected plant size.
      */

      if (type === "inverter") {
        const sizeText =
          normalizeCompact(
            selectedSize
          );

        const sizeMatches =
          exactMatches.filter(
            (row) => {
              const combined =
                normalizeCompact(
                  [
                    row?.product_name,
                    row?.company,
                    row?.specification,
                  ]
                    .filter(Boolean)
                    .join(" ")
                );

              return (
                sizeText &&
                combined.includes(
                  sizeText
                )
              );
            }
          );

        if (sizeMatches.length) {
          return sortLatestInventory(
            sizeMatches
          )[0];
        }
      }

      return sortLatestInventory(
        exactMatches
      )[0];
    }
  }

  // ===================================================
  // PREPARE OPTION TEXT
  // ===================================================

  const optionLabel =
    normalizeText(
      option?.label ??
        option?.name ??
        ""
    );

  // ===================================================
  // PANEL MATCH
  // ===================================================

  if (type === "panel") {
    /*
      Example:

      Waaree 605Wp

      Inventory:

      product_name = Panel
      company = Waaree
      specification = 605wp
    */

    const wattMatch =
      optionLabel.match(
        /(\d+(?:\.\d+)?)\s*wp/i
      );

    const watt =
      wattMatch?.[1]
        ? normalizeCompact(
            wattMatch[1]
          )
        : "";

    const companyWords =
      optionLabel
        .split(/\s+/)
        .filter(Boolean);

    const company =
      companyWords.length
        ? normalizeCompact(
            companyWords[0]
          )
        : "";

    const panelMatches =
      inventory.filter((row) => {
        if (row?.active === false) {
          return false;
        }

        const rowCompany =
          normalizeCompact(
            row?.company
          );

        const rowProduct =
          normalizeCompact(
            row?.product_name
          );

        const combined =
          normalizeCompact(
            [
              row?.product_name,
              row?.company,
              row?.specification,
            ]
              .filter(Boolean)
              .join(" ")
          );

        /*
          Company must match when available.
        */

        if (
          company &&
          rowCompany &&
          rowCompany !== company
        ) {
          return false;
        }

        /*
          Wattage must match when present.
        */

        if (
          watt &&
          !combined.includes(watt)
        ) {
          return false;
        }

        /*
          We specifically want panel records.
        */

        if (
          rowProduct !== "panel" &&
          !combined.includes("panel")
        ) {
          return false;
        }

        return true;
      });

    if (panelMatches.length) {
      return sortLatestInventory(
        panelMatches
      )[0];
    }
  }

  // ===================================================
  // INVERTER MATCH
  // ===================================================

  if (type === "inverter") {
    /*
      Use company from option.company first.

      If unavailable, use the option label/name.
    */

    const companyText =
      option?.company ??
      option?.label ??
      option?.name ??
      "";

    const company =
      normalizeCompact(
        companyText
      );

    const sizeCompact =
      normalizeCompact(
        selectedSize
      );

    const inverterMatches =
      inventory.filter((row) => {
        if (row?.active === false) {
          return false;
        }

        const rowCompany =
          normalizeCompact(
            row?.company
          );

        const combined =
          normalizeCompact(
            [
              row?.product_name,
              row?.company,
              row?.specification,
            ]
              .filter(Boolean)
              .join(" ")
          );

        /*
          Company must match.
        */

        if (
          company &&
          rowCompany &&
          !rowCompany.includes(
            company
          ) &&
          !company.includes(
            rowCompany
          )
        ) {
          return false;
        }

        /*
          Prefer selected plant size.
        */

        if (
          sizeCompact &&
          !combined.includes(
            sizeCompact
          )
        ) {
          return false;
        }

        /*
          Make sure this is an inverter.
        */

        if (
          !combined.includes(
            "inverter"
          )
        ) {
          return false;
        }

        return true;
      });

    if (inverterMatches.length) {
      return sortLatestInventory(
        inverterMatches
      )[0];
    }

    /*
      If size-specific match was not found,
      use latest company inverter.
    */

    const companyFallback =
      inventory.filter((row) => {
        if (row?.active === false) {
          return false;
        }

        const rowCompany =
          normalizeCompact(
            row?.company
          );

        const combined =
          normalizeCompact(
            [
              row?.product_name,
              row?.company,
              row?.specification,
            ]
              .filter(Boolean)
              .join(" ")
          );

        return (
          rowCompany === company &&
          combined.includes("inverter")
        );
      });

    if (companyFallback.length) {
      return sortLatestInventory(
        companyFallback
      )[0];
    }
  }

  return null;
}

// =====================================================
// LATEST PANEL INVENTORY
// =====================================================

function getLatestPanelInventory(
  inventory
) {
  if (!Array.isArray(inventory)) {
    return null;
  }

  const panelRows =
    inventory.filter((row) => {
      if (row?.active === false) {
        return false;
      }

      const combined =
        normalizeCompact(
          [
            row?.product_name,
            row?.company,
            row?.specification,
          ]
            .filter(Boolean)
            .join(" ")
        );

      return (
        normalizeCompact(
          row?.product_name
        ) === "panel" ||
        combined.includes("panel")
      );
    });

  if (!panelRows.length) {
    return null;
  }

  return sortLatestInventory(
    panelRows
  )[0];
}

// =====================================================
// FIXED PANEL QUANTITY BY PLANT SIZE
// =====================================================

function getPanelQuantityForPlantSize(
  size,
  panelWatts = 0
) {
  const plantSize =
    getNumericPlantSize(size);

  // Existing fixed quantities
  if (Math.abs(plantSize - 3) < 0.000001) {
    return 5;
  }

  if (Math.abs(plantSize - 3.5) < 0.000001) {
    return 6;
  }

  if (Math.abs(plantSize - 5) < 0.000001) {
    return 9;
  }

  // Automatic panel quantity above 5 KW
  if (plantSize > 5 && panelWatts > 0) {
    return Math.ceil(
      (plantSize * 1000) / panelWatts
    );
  }

  return 0;
}

// =====================================================
// CREATE NORMAL PRODUCT ROW
// =====================================================

function createProductRow(
  templateItem,
  inventory,
  selectedSize
) {
  const productName =
    cleanProductName(
      templateItem?.item
    );

  const isPanel =
    normalizeCompact(
      productName
    ) === "panel";

  const isInverter =
    normalizeCompact(
      productName
    ) === "inverter";

  /*
    ===================================================
    IMPORTANT INITIAL VALUES
    ===================================================

    PANEL:

      Initially:
        Qty   = 0
        Price = 0
        GST   = 0

      These become populated ONLY after
      the user selects a panel.

    INVERTER:

      Initially:
        Qty   = 0
        Price = 0
        GST   = 0

      Price/GST become populated ONLY after
      the user selects an inverter.

    OTHER PRODUCTS:

      Initially:
        Qty   = 0
        Price = latest inventory price
        GST   = latest inventory GST
  */

  let inventoryRow = null;

if (
  !isPanel &&
  !isInverter
) {
  const normalizedProduct =
    normalizeCompact(productName);

  const inventoryLookupName =
  normalizedProduct === "earthing"
    ? "Earthing Kit"
    : normalizedProduct === "acdbbox"
    ? "ACDB"
    : normalizedProduct === "dcdbbox"
    ? "DCDB"
    : normalizedProduct === "armouredcable"
    ? "Armoured Wire"
    : productName;

  inventoryRow =
    getLatestInventoryEntry(
      inventory,
      inventoryLookupName
    );
}

  return {
    item: productName,

    /*
      Panel and inverter both start with
      quantity 0.

      Panel gets its fixed quantity only
      after selection.
    */

  qty:
  isInverter ||
  ["earthing", "acdbbox", "dcdbbox"].includes(
    normalizeCompact(productName)
  )
    ? 1
    : Number(templateItem?.qty || 0),

templateQty: Number(
  templateItem?.qty || 0
),

    options: isPanel
      ? panelOptions
      : isInverter
      ? inverterOptions
      : [],

    /*
      Nothing selected initially.
    */

    selectedOptionId: "",

    /*
      Panel:
        0 until selected

      Inverter:
        0 until selected

      Other products:
        inventory price
    */

    price:
      isPanel || isInverter
        ? 0
        : getInventoryUnitPrice(
            inventoryRow
          ),

    /*
      Panel:
        0 until selected

      Inverter:
        0 until selected

      Other products:
        inventory GST
    */

    gst:
      isPanel || isInverter
        ? 0
        : getInventoryGST(
            inventoryRow
          ),

    amount: 0,

    /*
      Panel and inverter do not have
      an inventory ID before selection.
    */

    inventoryId:
      isPanel || isInverter
        ? null
        : inventoryRow?.id ?? null,

    inventoryProductName:
      isPanel || isInverter
        ? ""
        : inventoryRow?.product_name ||
          productName,

    isAdditionalCharge: false,

    editingCharge: false,
  };
}

// =====================================================
// PLANT SIZE HELPERS
// =====================================================

function getNumericPlantSize(size) {
  const match =
    String(size ?? "").match(
      /\d+(?:\.\d+)?/
    );

  if (!match) {
    return 0;
  }

  const value = Number(
    match[0]
  );

  return Number.isFinite(value)
    ? value
    : 0;
}

function getTemplateKeyForPlantSize(
  size
) {
  const requested =
    getNumericPlantSize(size);

  const keys =
    Object.keys(
      plantTemplates
    );

  if (
    !keys.length ||
    requested <= 0
  ) {
    return keys[0] || "";
  }

  const exactKey =
    keys.find(
      (key) =>
        Math.abs(
          getNumericPlantSize(
            key
          ) - requested
        ) < 0.000001
    );

  if (exactKey) {
    return exactKey;
  }

  /*
    Custom sizes use nearest existing template.

    Panel quantity remains separately controlled
    by getPanelQuantityForPlantSize().
  */

  return keys.reduce(
    (closest, key) => {
      if (!closest) {
        return key;
      }

      const currentDistance =
        Math.abs(
          getNumericPlantSize(
            key
          ) - requested
        );

      const closestDistance =
        Math.abs(
          getNumericPlantSize(
            closest
          ) - requested
        );

      return currentDistance <
        closestDistance
        ? key
        : closest;
    },
    ""
  );
}

// =====================================================
// PANEL WATTAGE
// =====================================================

function getPanelWattage(option) {
  if (!option) {
    return 0;
  }

  const text = [
    option?.label,
    option?.name,
    option?.specification,
  ]
    .filter(Boolean)
    .join(" ");

  const match =
    text.match(
      /(\d+(?:\.\d+)?)\s*wp/i
    );

  if (!match) {
    return 0;
  }

  const wattage =
    Number(match[1]);

  return Number.isFinite(
    wattage
  )
    ? wattage
    : 0;
}

// =====================================================
// COMPONENT
// =====================================================

export default function PlantCosting() {
  const navigate = useNavigate();
  const [
    selectedSize,
    setSelectedSize,
  ] = useState("");



  const [
  showCostingPage,
  setShowCostingPage,
] = useState(false);

  const [
    plantSizeInput,
    setPlantSizeInput,
  ] = useState("");

  const [
    requestedPlantSize,
    setRequestedPlantSize,
  ] = useState(0);

  // STRUCTURE ARRANGEMENT
// Each value represents structures in one row.
const [structureRows, setStructureRows] = useState([0]);
const [rowCountInput, setRowCountInput] = useState("1");

  const [
    items,
    setItems,
  ] = useState([]);

  const [
    inventory,
    setInventory,
  ] = useState([]);

  const [
    deletedCharges,
    setDeletedCharges,
  ] = useState([]);

  // ===================================================
  // LOAD INVENTORY
  // ===================================================

  useEffect(() => {
    async function loadInventory() {
      try {
        const result =
          await getInventory();

        const rows =
          Array.isArray(result)
            ? result
            : Array.isArray(
                result?.data
              )
            ? result.data
            : [];

        setInventory(rows);

        console.log(
          "PLANT COSTING - INVENTORY",
          rows
        );
      } catch (error) {
        console.error(
          "Failed to load inventory:",
          error
        );

        setInventory([]);
      }
    }

    loadInventory();
  }, []);

  // ===================================================
  // LOAD TEMPLATE
  // ===================================================

  function loadTemplate(size) {
    const templateKey =
      getTemplateKeyForPlantSize(
        size
      );

    const template =
      plantTemplates[
        templateKey
      ];

    if (!template) {
      setItems([]);
      setDeletedCharges([]);
      return;
    }

    const productRows =
      template.map(
        (templateItem) =>
          createProductRow(
            templateItem,
            inventory,
            size
          )
      );

   const plantSizeKw = getNumericPlantSize(size);

const isSupportedPlantSize =
  [3, 3.5, 5].includes(plantSizeKw);

// Civil charges included in Installation
const installationCivilCharges =
  plantSizeKw === 3 || plantSizeKw === 3.5
    ? 350
    : plantSizeKw === 5
    ? 500
    : 0;

const installationAmount =
  plantSizeKw * 1000 * 1.5 +
  installationCivilCharges;

// Separate Civil Material amount
const civilMaterialAmount =
  plantSizeKw === 3 || plantSizeKw === 3.5
    ? 700
    : plantSizeKw === 5
    ? 1350
    : 0;

// Vendor Charges = plant size in watts × ₹1
const vendorChargesAmount =
  isSupportedPlantSize
    ? plantSizeKw * 1000
    : 0;

// MPEB Charges
const mpebChargesAmount =
  isSupportedPlantSize ? 3300 : 0;

const chargeRows =
  DEFAULT_ADDITIONAL_CHARGES.map((charge) => {
    const chargeName = normalizeText(charge.item);

    let price = Number(charge.price || 0);

    if (chargeName === normalizeText("Installation")) {
      price = installationAmount;
    }

    if (chargeName === normalizeText("Civil Material")) {
      price = civilMaterialAmount;
    }

    if (chargeName === normalizeText("Vendor Charges")) {
      price = vendorChargesAmount;
    }

    if (chargeName === normalizeText("MPEB Charges")) {
      price = mpebChargesAmount;
    }

    return {
      item: charge.item,
      qty: 1,
      templateQty: 1,
      options: [],
      selectedOptionId: "",
      price,
      gst: 0,
      amount: price,
      inventoryId: null,
      inventoryProductName: "",
      isAdditionalCharge: true,
      editingCharge: false,
    };
  });
    

    setItems([
      ...productRows,
      ...chargeRows,
    ]);

    setDeletedCharges([]);
  }

  // ===================================================
  // RELOAD WHEN SIZE OR INVENTORY CHANGES
  // ===================================================

  useEffect(() => {
    if (!selectedSize) {
      return;
    }

    loadTemplate(
      selectedSize
    );
  }, [
    selectedSize,
    inventory,
  ]);

  // ===================================================
// OPEN COSTING PAGE
// ===================================================

function openPlantSizeModal() {
  setPlantSizeInput(
    requestedPlantSize > 0
      ? String(requestedPlantSize)
      : ""
  );

  setShowCostingPage(true);
}

// ===================================================
// APPLY PLANT SIZE
// ===================================================

function handlePlantSizeSubmit() {
  const size = Number(plantSizeInput);

  if (!Number.isFinite(size) || size <= 0) {
    return;
  }

  // Reset manual arrangement when changing to another plant size above 5 KW.
  if (size > 5 && size !== requestedPlantSize) {
    setStructureRows([0]);
setRowCountInput("1");
  }

  setRequestedPlantSize(size);
  setSelectedSize(`${size} KW`);
}

  // ===================================================
  // BACK TO PLANT COSTING PAGE
  // ===================================================

  function handleBackToPlantCosting() {
  setShowCostingPage(false);
}

  // ===================================================
  // PANEL QUANTITY
  // ONLY SET AFTER PANEL IS SELECTED
  // ===================================================

  function updatePanelQuantity(
  index,
  option
) {
  const panelWatts =
    getPanelWattage(option);

  const panelQty =
    getPanelQuantityForPlantSize(
      requestedPlantSize,
      panelWatts
    );

  updateRow(index, {
    qty: panelQty,
  });
}

  // ===================================================
  // PLANT SIZE / PANEL SUMMARY
  // ===================================================

  const actualPlantSize =
    useMemo(() => {
      const panelRow =
        items.find(
          (row) =>
            !row.isAdditionalCharge &&
            normalizeCompact(
              row.item
            ) === "panel"
        );

      if (!panelRow) {
        return 0;
      }

      /*
        No selected panel means actual plant size = 0.
      */

      if (
        !panelRow.selectedOptionId
      ) {
        return 0;
      }

      const selectedPanel =
        panelOptions.find(
          (option) =>
            String(option.id) ===
            String(
              panelRow.selectedOptionId
            )
        );

      if (!selectedPanel) {
        return 0;
      }

      const panelWatts =
        getPanelWattage(
          selectedPanel
        );

      /*
        Actual plant size:

        selected panel wattage ×
        fixed quantity for plant size
      */

      return (
        Number(
          panelRow.qty || 0
        ) * panelWatts
      );
    }, [items]);

    // ===================================================
// REQUIRED STRUCTURE AREA
// ===================================================

const requiredArea = useMemo(() => {

  if (
    requestedPlantSize === 3 ||
    requestedPlantSize === 3.5
  ) {
    return 180;
  }

  if (requestedPlantSize === 5) {
    return 315;
  }

if (requestedPlantSize > 5) {

  const requiredStructures =
    Math.ceil(requestedPlantSize / 2.5);

  return requiredStructures * 315;
}

  return null;

}, [
  requestedPlantSize,
  structureRows,
]);

  // ===================================================
  // UPDATE ROW
  // ===================================================

  function updateRow(
    index,
    changes
  ) {
    setItems((prev) =>
      prev.map(
        (item, i) =>
          i === index
            ? {
                ...item,
                ...changes,
              }
            : item
      )
    );
  }

  // ===================================================
  // PANEL / INVERTER SELECTION
  // ===================================================

  function applyInventoryPriceToOption(
    index,
    option,
    type
  ) {
    /*
      =================================================
      DROPDOWN RESET
      =================================================

      Panel:
        Qty   = 0
        Price = 0
        GST   = 0

      Inverter:
        Qty   = 0
        Price = 0
        GST   = 0

      This means BOTH panel and inverter
      start/reset to zero until selected.
    */

    if (!option) {
      updateRow(index, {
        selectedOptionId: "",

        qty: 0,

        price: 0,

        gst: 0,

        inventoryId: null,

        inventoryProductName: "",
      });

      return;
    }

    const inventoryRow =
      findInventoryForOption(
        inventory,
        option,
        type,
        selectedSize
      );

    console.log(
      "Plant Costing selection:",
      {
        type,
        option,
        selectedSize,
        inventoryRow,
      }
    );

    updateRow(index, {
      selectedOptionId:
        option.id || "",

      /*
        Inventory unit_cost.
      */

      price:
        getInventoryUnitPrice(
          inventoryRow
        ),

      /*
        Inventory GST.
      */

      gst:
        getInventoryGST(
          inventoryRow
        ),

      inventoryId:
        inventoryRow?.id ?? null,

      inventoryProductName:
        inventoryRow?.product_name ||
        "",
    });

    // =================================================
    // PANEL
    // =================================================

    if (type === "panel") {
      /*
        ONLY NOW does the panel get
        its fixed quantity.

        3 KW   = 5
        3.5 KW = 6
        5 KW   = 9
      */

      updatePanelQuantity(
  index,
  option
);
    }

    // =================================================
    // INVERTER
    // =================================================

    if (type === "inverter") {
  updateRow(index, {
    qty: 1,
  });
}
  }

  // ===================================================
  // EDIT ADDITIONAL CHARGE
  // ===================================================

  function toggleChargeEdit(
    index
  ) {
    setItems((prev) =>
      prev.map(
        (item, i) =>
          i === index
            ? {
                ...item,
                editingCharge:
                  !item.editingCharge,
              }
            : item
      )
    );
  }

  // ===================================================
  // DELETE ADDITIONAL CHARGE
  // ===================================================

  function deleteAdditionalCharge(
    index
  ) {
    setItems((prev) => {
      const row = prev[index];

      if (
        !row?.isAdditionalCharge
      ) {
        return prev;
      }

      setDeletedCharges(
        (current) => {
          const alreadyExists =
            current.some(
              (charge) =>
                normalizeText(
                  charge.item
                ) ===
                normalizeText(
                  row.item
                )
            );

          if (alreadyExists) {
            return current;
          }

          return [
            ...current,
            {
              item: row.item,
              price: Number(
                row.price || 0
              ),
            },
          ];
        }
      );

      return prev.filter(
        (_, i) =>
          i !== index
      );
    });
  }

  // ===================================================
  // RESTORE ADDITIONAL CHARGE
  // ===================================================

  function addAdditionalCharge(
    charge
  ) {
    const exists =
      items.some(
        (row) =>
          row.isAdditionalCharge &&
          normalizeText(
            row.item
          ) ===
            normalizeText(
              charge.item
            )
      );

    if (exists) {
      return;
    }

    setItems((prev) => [
      ...prev,
      {
        item: charge.item,

        qty: 1,

        templateQty: 1,

        options: [],

        selectedOptionId: "",

        /*
          Restore last edited amount.
        */

        price: Number(
          charge.price || 0
        ),

        gst: 0,

        amount: Number(
          charge.price || 0
        ),

        inventoryId: null,

        inventoryProductName: "",

        isAdditionalCharge: true,

        editingCharge: false,
      },
    ]);

    setDeletedCharges(
      (prev) =>
        prev.filter(
          (item) =>
            normalizeText(
              item.item
            ) !==
            normalizeText(
              charge.item
            )
        )
    );
  }

  // ===================================================
  // PREVENT MOUSE WHEEL NUMBER CHANGE
  // ===================================================

  function preventWheelChange(
    event
  ) {
    event.currentTarget.blur();
  }

  // ===================================================
  // EXACTLY 2 DECIMAL PLACES
  // ===================================================

  function formatAmount(value) {
    const number =
      Number(value);

    if (
      !Number.isFinite(number)
    ) {
      return "0.00";
    }

    return number.toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );
  }

  
function formatPriceInput(value) {
  if (value === "" || value == null) {
    return "";
  }

  return Number(value).toFixed(2);
}


  // ===================================================
  // MATERIAL TOTAL
  // ===================================================

  const materialTotal =
    useMemo(() => {
      return items
        .filter(
          (row) =>
            !row.isAdditionalCharge
        )
        .reduce(
          (sum, row) => {
            const qty =
              Number(
                row.qty || 0
              );

            const price =
              Number(
                row.price || 0
              );

            return (
              sum +
              qty * price
            );
          },
          0
        );
    }, [items]);

  // ===================================================
  // GST TOTAL
  // ===================================================

  const gstTotal =
    useMemo(() => {
      return items
        .filter(
          (row) =>
            !row.isAdditionalCharge
        )
        .reduce(
          (sum, row) => {
            const qty =
              Number(
                row.qty || 0
              );

            const price =
              Number(
                row.price || 0
              );

            const gst =
              Number(
                row.gst || 0
              );

            const base =
              qty * price;

            return (
              sum +
              (base * gst) /
                100
            );
          },
          0
        );
    }, [items]);

  // ===================================================
  // ADDITIONAL CHARGES TOTAL
  // ===================================================

  const additionalChargesTotal =
    useMemo(() => {
      return items
        .filter(
          (row) =>
            row.isAdditionalCharge
        )
        .reduce(
          (sum, row) =>
            sum +
            Number(
              row.price || 0
            ),
          0
        );
    }, [items]);

  // ===================================================
  // GRAND TOTAL
  // ===================================================

  const grandTotal =
    materialTotal +
    gstTotal +
    additionalChargesTotal;

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div
      className="
        min-h-screen
        w-full
        bg-white
        text-black
        p-3
      "
      style={{
        backgroundColor:
          "#ffffff",
        color: "#000000",
        minHeight: "100vh",
        width: "100%",
        colorScheme: "light",
      }}
    >
    
{/* MAIN PLANT COSTING HEADER */}
<div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 p-6 text-white shadow-lg sm:p-8">
  <div className="absolute -right-8 -top-12 h-40 w-40 rounded-full bg-pink-400/30 blur-2xl" />
  <div className="absolute -bottom-12 left-1/3 h-32 w-32 rounded-full bg-cyan-300/30 blur-2xl" />

  <div className="relative z-10 flex items-center justify-between gap-4">
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
        Plant Costing
      </h1>

      <p className="mt-2 text-sm text-white/90 sm:text-base">
        Calculate and manage plant installation costs
      </p>

      <div className="mt-4 h-1 w-20 rounded-full bg-gradient-to-r from-yellow-300 to-pink-300" />
    </div>

    <button
      type="button"
      onClick={() => navigate("/customer-service")}
      title="Back to Customer Service"
      aria-label="Back to Customer Service"
      className="relative z-20 flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-white/40 bg-white/20 text-white shadow-sm transition hover:bg-white/30"
    >
      <Home size={24} strokeWidth={2.5} />
    </button>
  </div>
</div>

      {/* =================================================
          CALCULATE PLANT COSTING BUTTON
      ================================================= */}

      {!showCostingPage && (
        <div className="mt-4">
          <button
            type="button"
            onClick={
              openPlantSizeModal
            }
            className="
              !rounded-lg
              !px-5
              !py-3
              !text-base
              !font-semibold
              !border-2
              !border-green-600
              !shadow-none
              focus:!outline-none
              bg-green-600
              text-white
              hover:bg-green-700
            "
          >
            Calculate Plant Costing
          </button>

          {requestedPlantSize > 0 && (
            <span className="ml-3 text-sm font-semibold text-slate-700">
              Requested Plant Size:{" "}
              {requestedPlantSize} KW
            </span>
          )}
        </div>
      )}

     

      {/* =================================================
          COSTING WINDOW
          THIS IS WHERE BACK BUTTON BELONGS
      ================================================= */}

      {showCostingPage && (
        <div
          className="
            mt-4
            rounded-lg
            shadow
            border-2
            border-black
            p-3
            bg-white
            text-black
          "
          style={{
            backgroundColor:
              "#ffffff",
            color: "#000000",
          }}
        >
          {/* =================================================
              COSTING WINDOW HEADER
          ================================================= */}

          {/* =================================================
    COSTING WINDOW HEADER
================================================= */}

<div className="mb-4 flex flex-wrap items-center justify-between gap-4">

  <div className="flex flex-wrap items-center gap-3">

    <button
      type="button"
      onClick={handleBackToPlantCosting}
      title="Back to Plant Costing"
      className="
        inline-flex
        items-center
        gap-2
        rounded-lg
        border-2
        border-slate-700
        bg-white
        px-3
        py-2
        text-sm
        font-semibold
        text-slate-800
        shadow-sm
        hover:bg-slate-100
      "
    >
      <ArrowLeft size={17} />
      Back
    </button>

    <h2 className="text-2xl font-bold text-green-700">
      {selectedSize || "Plant Costing"}
      {selectedSize ? " Solar Plant" : ""}
    </h2>

  </div>

  <div className="flex flex-wrap items-end gap-3">

    <div>
      <label className="mb-1 block text-sm font-semibold text-slate-700">
        Plant Size (KW)
      </label>

      <input
  type="number"
  min="0.1"
  step="0.1"
  value={plantSizeInput}
  onChange={(e) =>
    setPlantSizeInput(e.target.value)
  }
  onKeyDown={(e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handlePlantSizeSubmit();
    }
  }}
  placeholder="Enter plant size"
        className="
          w-40
          rounded-lg
          border-2
          border-slate-400
          px-3
          py-2
          text-sm
          text-black
          outline-none
          focus:border-green-600
        "
      />
    </div>

    <button
      type="button"
      onClick={handlePlantSizeSubmit}
      className="
        rounded-lg
        bg-green-600
        px-5
        py-2
        font-semibold
        text-white
        hover:bg-green-700
      "
    >
      Apply
    </button>

  </div>

</div>

{selectedSize && (
  <div className="mb-3 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-bold text-slate-800">

    <span>
      Total Cost: ₹ {formatAmount(grandTotal)}
    </span>

    <span>
      Requested Plant Size: {requestedPlantSize} KW
    </span>

    <span>
      Actual Plant Size: {formatAmount(actualPlantSize)} W
    </span>

    {requiredArea !== null && (
      <span className="text-blue-700">
        Required Area: {requiredArea.toLocaleString("en-IN")} sq ft
      </span>
    )}

    {requestedPlantSize > 5 && (

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-blue-300 bg-blue-50 p-2">

        {/* NUMBER OF ROWS */}

        <div className="flex items-center gap-2">

          <label className="font-semibold">
            No. of Rows:
          </label>

          <input
  type="number"
  min="1"
  step="1"
  value={rowCountInput}
  onChange={(e) => {
    const value = e.target.value;

    setRowCountInput(value);

    if (
      value !== "" &&
      Number.isInteger(Number(value)) &&
      Number(value) >= 1
    ) {
      const rowCount = Number(value);

      setStructureRows((current) =>
        Array.from(
          { length: rowCount },
          (_, index) => current[index] ?? 0
        )
      );
    }
  }}
  onBlur={() => {
    if (
      rowCountInput === "" ||
      Number(rowCountInput) < 1
    ) {
      setRowCountInput(String(structureRows.length || 1));
      setStructureRows((current) =>
        current.length > 0 ? current : [0]
      );
    }
  }}
  className="w-20 rounded-md border border-slate-400 bg-white px-2 py-1 text-center"
/>

        </div>

        {/* STRUCTURES IN EACH ROW */}

        {structureRows.map((count, index) => (

          <div
            key={index}
            className="flex items-center gap-2"
          >

            <label className="font-semibold">
              Row {index + 1}:
            </label>

            <input
              type="number"
              min="0"
              step="1"
              value={count}
              onChange={(e) => {

                const value = Math.max(
                  0,
                  Number(e.target.value) || 0
                );

                setStructureRows((current) =>
                  current.map((item, i) =>
                    i === index ? value : item
                  )
                );

              }}
              className="w-16 rounded-md border border-slate-400 bg-white px-2 py-1 text-center"
            />

          </div>

        ))}

        <span className="font-bold text-blue-800">
  Structures Remaining:{" "}
  {Math.max(
    0,
    Math.ceil(requestedPlantSize / 2.5) -
      structureRows.reduce(
        (total, count) =>
          total + (Number(count) || 0),
        0
      )
  )}
</span>

      </div>

    )}

  </div>
)}

         {/* =================================================
    COSTING TABLE
================================================= */}

{selectedSize && (
  <div className="overflow-x-auto rounded-lg border-2 border-black">
            <table
              className="
                w-full
                border-collapse
                text-xs
                bg-white
                text-black
              "
              style={{
                backgroundColor:
                  "#ffffff",
                color: "#000000",
              }}
            >
              <thead className="bg-slate-900 text-white">
                <tr>
                  <th className="border-2 border-black px-2 py-2 text-center">
                    #
                  </th>

                  <th className="border-2 border-black px-2 py-2 text-center min-w-[240px]">
                    Item
                  </th>

                  <th className="border-2 border-black px-2 py-2 text-center">
                    Qty
                  </th>

                  <th className="border-2 border-black px-2 py-2 text-center min-w-[120px]">
                    Price
                  </th>

                 <th className="border-2 border-black px-2 py-2 text-center min-w-[150px]">
                    Amount
                  </th>

                  <th className="border-2 border-black px-2 py-2 text-center min-w-[120px]">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {items.map(
                  (row, index) => {
                    const qty =
                      Number(
                        row.qty || 0
                      );

                    const price =
                      Number(
                        row.price || 0
                      );

                    /*
                      Additional charges:
                        price

                      Normal products:
                        qty × price
                    */

                    const base =
  row.isAdditionalCharge ||
  normalizeCompact(row.item) === "wire"
    ? price
    : qty * price;

                    const gst =
                      Number(
                        row.gst || 0
                      );

                    /*
                      Additional charges have
                      no GST.
                    */

                    const gstAmount =
                      row.isAdditionalCharge
                        ? 0
                        : (base * gst) /
                          100;

                    const total =
                      base +
                      gstAmount;

                    const isPanel =
                      normalizeCompact(
                        row.item
                      ) === "panel";

                    const isInverter =
                      normalizeCompact(
                        row.item
                      ) === "inverter";

                    return (
                      <tr
                        key={`${row.item}-${index}`}
                        className={
                          index % 2 === 0
                            ? "bg-white text-black"
                            : "bg-green-50 text-black"
                        }
                        style={{
                          color:
                            "#000000",
                        }}
                      >
                        {/* =================================================
                            #
                        ================================================= */}

                        <td className="border-2 border-black px-2 py-2 text-center">
                          {index + 1}
                        </td>

                        {/* =================================================
                            ITEM
                        ================================================= */}

                        <td className="border-2 border-black px-2 py-2">
                          <div className="font-semibold text-slate-800 whitespace-pre-line">
                            {row.item}
                          </div>

                          {/* =================================================
                              PANEL DROPDOWN
                          ================================================= */}

                          {isPanel && (
                            <div className="mt-2">
                              <div className="font-semibold mb-2">
                                Panel
                              </div>

                              <select
                                value={
                                  row.selectedOptionId ||
                                  ""
                                }
                                onChange={(e) => {
                                  const selected =
                                    panelOptions.find(
                                      (
                                        option
                                      ) =>
                                        String(
                                          option.id
                                        ) ===
                                        String(
                                          e
                                            .target
                                            .value
                                        )
                                    );

                                  applyInventoryPriceToOption(
                                    index,
                                    selected ||
                                      null,
                                    "panel"
                                  );
                                }}
                                className="
                                  border
                                  border-black
                                  rounded
                                  px-2
                                  py-1
                                  w-full
                                  bg-white
                                  text-black
                                "
                              >
                                <option value="">
                                  Select Panel
                                </option>

                                {panelOptions.map(
                                  (
                                    option
                                  ) => (
                                    <option
                                      key={
                                        option.id
                                      }
                                      value={
                                        option.id
                                      }
                                    >
                                      {
                                        option.label
                                      }
                                    </option>
                                  )
                                )}
                              </select>
                            </div>
                          )}

                          {/* =================================================
                              INVERTER DROPDOWN
                          ================================================= */}

                          {isInverter && (
                            <div className="mt-2">
                              <div className="font-semibold mb-2">
                                Inverter
                              </div>

                              <select
                                value={
                                  row.selectedOptionId ||
                                  ""
                                }
                                onChange={(e) => {
                                  const selected =
                                    inverterOptions.find(
                                      (
                                        option
                                      ) =>
                                        String(
                                          option.id
                                        ) ===
                                        String(
                                          e
                                            .target
                                            .value
                                        )
                                    );

                                  applyInventoryPriceToOption(
                                    index,
                                    selected ||
                                      null,
                                    "inverter"
                                  );
                                }}
                                className="
                                  border
                                  border-black
                                  rounded
                                  px-2
                                  py-1
                                  w-full
                                  bg-white
                                  text-black
                                "
                              >
                                <option value="">
                                  Select Inverter
                                </option>

                                {inverterOptions.map(
                                  (
                                    option
                                  ) => (
                                    <option
                                      key={
                                        option.id
                                      }
                                      value={
                                        option.id
                                      }
                                    >
                                      {
                                        option.label
                                      }
                                    </option>
                                  )
                                )}
                              </select>
                            </div>
                          )}
                        </td>

                        {/* =================================================
    QTY
================================================= */}

<td className="border-2 border-black px-2 py-2 text-center">
  {row.isAdditionalCharge ||
  ["earthing", "acdbbox", "dcdbbox"].includes(
    normalizeCompact(row.item)
  ) ? (
    <span className="font-semibold">1</span>
  ) : normalizeCompact(row.item) === "wire" ? (
    <span></span>
  ) : (
    <input
      type="number"
      min="0"
      step={isPanel ? "1" : "any"}
      value={row.qty ?? ""}
      onChange={(e) => {
        const qty =
          e.target.value === ""
            ? 0
            : Math.max(0, Number(e.target.value));

        updateRow(index, { qty });
      }}
      onWheel={preventWheelChange}
      className="
        border border-black rounded px-2 py-1
        w-20 text-center no-spinner bg-white text-black
      "
    />
  )}
</td>

{/* =================================================
    PRICE
================================================= */}

<td className="border-2 border-black px-2 py-2 text-center">
  {row.isAdditionalCharge && !row.editingCharge ? (
    <span className="font-semibold">
      ₹ {Number(row.price || 0).toFixed(2)}
    </span>
  ) : (
    <input
      type="text"
      inputMode="decimal"
      value={
  row.price === "" || row.price == null
    ? ""
    : String(row.price)
}
      onChange={(e) => {
        const value = e.target.value;

        if (/^\d*\.?\d{0,2}$/.test(value) || value === "") {
          updateRow(index, { price: value });
        }
      }}
      onFocus={(e) => {
        e.target.select();
      }}
      onBlur={(e) => {
        const value = e.target.value.trim();
        const formattedPrice =
          value === "" ? "0.00" : Number(value).toFixed(2);

        updateRow(index, { price: formattedPrice });
      }}
      onWheel={preventWheelChange}
      className="
        border
        border-black
        rounded
        px-2
        py-1
        w-28
        text-center
        no-spinner
        bg-white
        text-black
      "
    />
  )}
</td>

                        {/* =================================================
                            AMOUNT
                        ================================================= */}

                        <td className="border-2 border-black px-2 py-2 text-center font-semibold text-green-700">
                          ₹{" "}
                          {formatAmount(
                            total
                          )}
                        </td>

                        {/* =================================================
                            ACTION
                        ================================================= */}

                        <td className="border-2 border-black px-2 py-2 text-center">
                          {row.isAdditionalCharge && (
                            <div className="flex items-center justify-center gap-2">

                              {/* EDIT / SAVE */}

                              <button
                                type="button"
                                onClick={() =>
                                  toggleChargeEdit(
                                    index
                                  )
                                }
                                title={
                                  row.editingCharge
                                    ? "Save Amount"
                                    : "Edit Amount"
                                }
                                className="
                                  inline-flex
                                  items-center
                                  justify-center
                                  w-8
                                  h-8
                                  rounded-lg
                                  bg-blue-100
                                  text-blue-700
                                  hover:bg-blue-200
                                  transition
                                "
                              >
                                {row.editingCharge ? (
                                  <Check
                                    size={
                                      17
                                    }
                                  />
                                ) : (
                                  <Pencil
                                    size={
                                      17
                                    }
                                  />
                                )}
                              </button>

                              {/* DELETE */}

                              <button
                                type="button"
                                onClick={() =>
                                  deleteAdditionalCharge(
                                    index
                                  )
                                }
                                title="Delete Charge"
                                className="
                                  inline-flex
                                  items-center
                                  justify-center
                                  w-8
                                  h-8
                                  rounded-lg
                                  bg-red-100
                                  text-red-700
                                  hover:bg-red-200
                                  transition
                                "
                              >
                                <Trash2
                                  size={
                                    17
                                  }
                                />
                              </button>

                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
          )}

          {/* =================================================
              REMOVED ADDITIONAL CHARGES
          ================================================= */}

          {deletedCharges.length >
            0 && (
            <div className="mt-4 rounded-lg border-2 border-green-300 bg-green-50 p-3">
              <div className="mb-2 font-semibold text-green-800">
                Removed Additional Charges
              </div>

              <div className="flex flex-wrap gap-2">
                {deletedCharges.map(
                  (charge) => (
                    <button
                      key={
                        charge.item
                      }
                      type="button"
                      onClick={() =>
                        addAdditionalCharge(
                          charge
                        )
                      }
                      title={`Add ${charge.item}`}
                      className="
                        inline-flex
                        items-center
                        gap-2
                        rounded-lg
                        bg-green-600
                        px-3
                        py-2
                        text-sm
                        font-semibold
                        text-white
                        hover:bg-green-700
                        transition
                      "
                    >
                      <Plus
                        size={17}
                      />

                      {charge.item}
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {/* =================================================
              COST SUMMARY
          ================================================= */}

          <div className="mt-4 flex justify-end">
            <div className="w-96 border-2 border-black rounded-xl shadow-lg overflow-hidden">

              <div className="bg-slate-900 text-white text-center py-3 font-bold">
                Cost Summary
              </div>

              <div className="bg-white text-black">

                {/* MATERIAL TOTAL */}

                <div className="grid grid-cols-2 border-t-2 border-black">
                  <div className="border-r-2 border-black px-3 py-2 font-medium">
                    Material Total
                  </div>

                  <div className="px-3 py-2 text-right font-semibold">
                    ₹{" "}
                    {formatAmount(
                      materialTotal
                    )}
                  </div>
                </div>

              

                {/* ADDITIONAL CHARGES */}

                <div className="grid grid-cols-2 border-t-2 border-black">
                  <div className="border-r-2 border-black px-3 py-2 font-medium">
                    Additional Charges
                  </div>

                  <div className="px-3 py-2 text-right font-semibold">
                    ₹{" "}
                    {formatAmount(
                      additionalChargesTotal
                    )}
                  </div>
                </div>

                {/* GRAND TOTAL */}

                <div className="grid grid-cols-2 border-t-2 border-black bg-green-100">
                  <div className="border-r-2 border-black px-3 py-3 text-lg font-bold">
                    Grand Total
                  </div>

                  <div className="px-3 py-3 text-right text-lg font-bold text-green-700">
                    ₹{" "}
                    {formatAmount(
                      grandTotal
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================
          NUMBER INPUT CSS
      ================================================= */}

      <style>{`
        input.no-spinner::-webkit-outer-spin-button,
        input.no-spinner::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        input.no-spinner {
          -moz-appearance: textfield;
          appearance: textfield;
        }

        select,
        input {
          color-scheme: light;
        }
      `}</style>
    </div>
  );
}