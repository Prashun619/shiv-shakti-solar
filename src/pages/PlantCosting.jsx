import { useEffect, useMemo, useState } from "react";

import {
  Pencil,
  Check,
  Trash2,
  Plus,
  ArrowLeft,
} from "lucide-react";

import {
  plantTemplates,
  panelOptions,
  inverterOptions,
} from "../utils/plantTemplates";

import { getInventory } from "../services/inventoryService";

// =====================================================
// DEFAULT ADDITIONAL CHARGES
// =====================================================

const DEFAULT_ADDITIONAL_CHARGES = [
  { item: "Aggregate", price: 160 },
  { item: "Sand", price: 450 },
  { item: "Cement", price: 300 },
  { item: "Bhada", price: 300 },
  { item: "Installation Charges", price: 4850 },
  { item: "Vendor Charges", price: 5500 },
  { item: "Meter Name Change Charge", price: 1700 },
  { item: "Meter Change Charge", price: 300 },
  { item: "Meter Connection Charge", price: 300 },
  { item: "JE", price: 3300 },
];

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
  if (!row) {
    return 0;
  }

  /*
    Use ONLY the single GST field.

    CGST + SGST is intentionally NOT used.
  */

  return (
    Number(row?.gst ?? 0) || 0
  );
}

// =====================================================
// UNIT COST
// =====================================================

function getInventoryUnitPrice(row) {
  if (!row) {
    return 0;
  }

  /*
    Plant Costing uses Inventory's calculated unit_cost.

    Raw price is only a fallback for old inventory
    records which don't have unit_cost.
  */

  const unitCost =
    Number(row?.unit_cost);

  if (
    Number.isFinite(unitCost) &&
    unitCost > 0
  ) {
    return unitCost;
  }

  return (
    Number(row?.price ?? 0) || 0
  );
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
  size
) {
  const plantSize =
    getNumericPlantSize(size);

  /*
    FIXED PANEL QUANTITY:

    3 KW   = 5 panels
    3.5 KW = 6 panels
    5 KW   = 9 panels

    IMPORTANT:

    This function does NOT use panel wattage.
    There is NO:

      plant watts / panel watts

    calculation anywhere here.
  */

  if (
    Math.abs(
      plantSize - 3
    ) < 0.000001
  ) {
    return 5;
  }

  if (
    Math.abs(
      plantSize - 3.5
    ) < 0.000001
  ) {
    return 6;
  }

  if (
    Math.abs(
      plantSize - 5
    ) < 0.000001
  ) {
    return 9;
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

  /*
    Do NOT load panel inventory here.

    Panel must remain completely zero
    until the dropdown selection.
  */

  if (
    !isPanel &&
    !isInverter
  ) {
    inventoryRow =
      getLatestInventoryEntry(
        inventory,
        productName
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

    qty: 0,

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
  const [
    selectedSize,
    setSelectedSize,
  ] = useState("");

  const [
    showPlantSizeModal,
    setShowPlantSizeModal,
  ] = useState(false);

  const [
    plantSizeInput,
    setPlantSizeInput,
  ] = useState("");

  const [
    requestedPlantSize,
    setRequestedPlantSize,
  ] = useState(0);

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

    const chargeRows =
      DEFAULT_ADDITIONAL_CHARGES.map(
        (charge) => ({
          item: charge.item,

          qty: 1,

          templateQty: 1,

          options: [],

          selectedOptionId: "",

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
        })
      );

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
  // PLANT SIZE MODAL
  // ===================================================

  function openPlantSizeModal() {
    setPlantSizeInput(
      requestedPlantSize > 0
        ? String(
            requestedPlantSize
          )
        : ""
    );

    setShowPlantSizeModal(
      true
    );
  }

  function closePlantSizeModal() {
    setShowPlantSizeModal(
      false
    );
  }

  // ===================================================
  // SUBMIT PLANT SIZE
  // ===================================================

  function handlePlantSizeSubmit() {
    const size =
      Number(
        plantSizeInput
      );

    if (
      !Number.isFinite(size) ||
      size <= 0
    ) {
      return;
    }

    setRequestedPlantSize(
      size
    );

    setSelectedSize(
      `${size} KW`
    );

    /*
      Close the size-entry window.

      The costing window/table now becomes
      visible underneath.
    */

    setShowPlantSizeModal(
      false
    );
  }

  // ===================================================
  // BACK TO PLANT COSTING PAGE
  // ===================================================

  function handleBackToPlantCosting() {
    /*
      This button is intentionally located
      INSIDE the costing window header.

      Clicking it hides the costing window
      and returns to the main Plant Costing page.
    */

    setSelectedSize("");

    setItems([]);

    setDeletedCharges([]);

    setRequestedPlantSize(0);
  }

  // ===================================================
  // PANEL QUANTITY
  // ONLY SET AFTER PANEL IS SELECTED
  // ===================================================

  function updatePanelQuantity(
    index
  ) {
    const panelQty =
      getPanelQuantityForPlantSize(
        requestedPlantSize
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
        index
      );
    }

    // =================================================
    // INVERTER
    // =================================================

    if (type === "inverter") {
      /*
        Inverter quantity intentionally remains
        whatever it currently is.

        Initial value = 0.

        Selecting inverter DOES NOT automatically
        set its quantity.
      */
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
      {/* =================================================
          MAIN PLANT COSTING HEADER
          NO BACK BUTTON HERE
      ================================================= */}

      <div
        className="
          rounded-2xl
          shadow-sm
          mb-6
          p-6
          text-white
          bg-gradient-to-r
          from-blue-600
          via-purple-600
          to-pink-500
        "
      >
        <div className="flex justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              Plant Costing
            </h1>

            <p className="text-blue-100 mt-1">
              Calculate and manage plant
              installation costs
            </p>
          </div>
        </div>
      </div>

      {/* =================================================
          CALCULATE PLANT COSTING BUTTON
      ================================================= */}

      {!selectedSize && (
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
          CALCULATE PLANT COSTING SIZE MODAL
      ================================================= */}

      {showPlantSizeModal && (
        <div
          className="
            fixed
            inset-0
            z-50
            flex
            items-center
            justify-center
            bg-black/50
            p-4
          "
          onMouseDown={(e) => {
            if (
              e.target ===
              e.currentTarget
            ) {
              closePlantSizeModal();
            }
          }}
        >
          <div
            className="
              w-full
              max-w-sm
              overflow-hidden
              rounded-xl
              border-2
              border-black
              bg-white
              shadow-2xl
              text-black
            "
            onMouseDown={(e) =>
              e.stopPropagation()
            }
          >
            {/* =================================================
                MODAL HEADER
                NO BACK BUTTON HERE
            ================================================= */}

            <div
              className="
                bg-gradient-to-r
                from-blue-600
                via-purple-600
                to-pink-500
                px-5
                py-4
                text-white
              "
            >
              <div>
                <h2 className="text-xl font-bold">
                  Calculate Plant Costing
                </h2>

                <p className="mt-1 text-xs text-blue-100">
                  Enter the required plant size
                </p>
              </div>
            </div>

            {/* =================================================
                MODAL BODY
            ================================================= */}

            <div className="p-5">
              <h3 className="text-lg font-bold text-green-700">
                Enter Plant Size
              </h3>

              <p className="mt-1 text-sm text-slate-600">
                Enter the required plant size in KW.
              </p>

              <div className="mt-4">
                <label className="mb-1 block text-sm font-semibold">
                  Plant Size (KW)
                </label>

                <input
                  autoFocus
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={
                    plantSizeInput
                  }
                  onChange={(e) =>
                    setPlantSizeInput(
                      e.target.value
                    )
                  }
                  onWheel={
                    preventWheelChange
                  }
                  onKeyDown={(e) => {
                    if (
                      e.key ===
                      "Enter"
                    ) {
                      handlePlantSizeSubmit();
                    }

                    if (
                      e.key ===
                      "Escape"
                    ) {
                      closePlantSizeModal();
                    }
                  }}
                  placeholder="Example: 3"
                  className="
                    w-full
                    rounded-lg
                    border-2
                    border-black
                    bg-white
                    px-3
                    py-2
                    text-black
                    outline-none
                    focus:border-green-600
                  "
                />
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={
                    closePlantSizeModal
                  }
                  className="
                    rounded-lg
                    border-2
                    border-slate-400
                    bg-white
                    px-4
                    py-2
                    font-semibold
                    text-slate-700
                    hover:bg-slate-100
                  "
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={
                    handlePlantSizeSubmit
                  }
                  disabled={
                    !Number.isFinite(
                      Number(
                        plantSizeInput
                      )
                    ) ||
                    Number(
                      plantSizeInput
                    ) <= 0
                  }
                  className="
                    rounded-lg
                    border-2
                    border-green-700
                    bg-green-600
                    px-4
                    py-2
                    font-semibold
                    text-white
                    hover:bg-green-700
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================
          COSTING WINDOW
          THIS IS WHERE BACK BUTTON BELONGS
      ================================================= */}

      {selectedSize && (
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

          <div className="flex justify-between items-center mb-3 gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              {/* =================================================
                  BACK BUTTON

                  THIS IS THE ONLY BACK BUTTON.

                  Clicking it returns to the main
                  Plant Costing page.
              ================================================= */}

              <button
                type="button"
                onClick={
                  handleBackToPlantCosting
                }
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
                  transition
                  hover:bg-slate-100
                "
              >
                <ArrowLeft
                  size={17}
                />

                Back
              </button>

              <h2 className="text-2xl font-bold text-green-700">
                {selectedSize} Solar Plant
              </h2>
            </div>

           <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm font-bold text-slate-800">
  <span>
    Total Cost: ₹{" "}
    {formatAmount(grandTotal)}
  </span>

  <span>
    Requested Plant Size:{" "}
    {requestedPlantSize} KW
  </span>

  <span>
    Actual Plant Size:{" "}
    {formatAmount(actualPlantSize)}{" "}
    W
  </span>
</div>
          </div>

          {/* =================================================
              COSTING TABLE
          ================================================= */}

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

                  <th className="border-2 border-black px-2 py-2 text-center min-w-[100px]">
                    GST %
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
                      row.isAdditionalCharge
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
                          {row.isAdditionalCharge ? (
                            <span className="font-semibold">
                              1
                            </span>
                          ) : isPanel ? (
                            /*
                              PANEL:

                              Initially:
                                0

                              After selection:

                                3 KW   = 5
                                3.5 KW = 6
                                5 KW   = 9

                              If dropdown is cleared,
                              it returns to 0.
                            */

                            <input
                              type="number"
                              value={
                                row.selectedOptionId
                                  ? getPanelQuantityForPlantSize(
                                      requestedPlantSize
                                    )
                                  : 0
                              }
                              readOnly
                              className="
                                border
                                border-black
                                rounded
                                px-2
                                py-1
                                w-20
                                text-center
                                bg-slate-100
                                text-black
                                font-bold
                                cursor-not-allowed
                              "
                            />
                          ) : (
                            /*
                              INVERTER AND OTHER PRODUCTS:

                              Initial quantity = 0.

                              User can enter quantity manually.
                            */

                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={
                                row.qty ===
                                0
                                  ? ""
                                  : row.qty
                              }
                              onChange={(e) => {
                                const qty =
                                  e
                                    .target
                                    .value ===
                                  ""
                                    ? 0
                                    : Number(
                                        e
                                          .target
                                          .value
                                      );

                                updateRow(
                                  index,
                                  {
                                    qty,
                                  }
                                );
                              }}
                              onWheel={
                                preventWheelChange
                              }
                              className="
                                border
                                border-black
                                rounded
                                px-2
                                py-1
                                w-20
                                text-center
                                no-spinner
                                bg-white
                                text-black
                              "
                            />
                          )}
                        </td>

                        {/* =================================================
                            PRICE
                        ================================================= */}

                        <td className="border-2 border-black px-2 py-2 text-center">
                          {row.isAdditionalCharge &&
                          !row.editingCharge ? (
                            <span className="font-semibold">
                              ₹{" "}
                              {formatAmount(
                                row.price
                              )}
                            </span>
                          ) : (
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={
                                row.price ===
                                  "" ||
                                row.price ==
                                  null
                                  ? ""
                                  : Number(
                                      row.price
                                    ).toFixed(
                                      2
                                    )
                              }
                              onChange={(e) => {
                                const price =
                                  e
                                    .target
                                    .value ===
                                  ""
                                    ? 0
                                    : Number(
                                        e
                                          .target
                                          .value
                                      );

                                updateRow(
                                  index,
                                  {
                                    price,
                                  }
                                );
                              }}
                              onWheel={
                                preventWheelChange
                              }
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
                            GST
                        ================================================= */}

                        <td className="border-2 border-black px-2 py-2 text-center">
                          {row.isAdditionalCharge ? (
                            <span className="text-gray-400 font-semibold">
                              —
                            </span>
                          ) : (
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={
                                row.gst ===
                                  "" ||
                                row.gst ==
                                  null
                                  ? ""
                                  : Number(
                                      row.gst
                                    ).toFixed(
                                      2
                                    )
                              }
                              onChange={(e) => {
                                const gst =
                                  e
                                    .target
                                    .value ===
                                  ""
                                    ? 0
                                    : Number(
                                        e
                                          .target
                                          .value
                                      );

                                updateRow(
                                  index,
                                  {
                                    gst,
                                  }
                                );
                              }}
                              onWheel={
                                preventWheelChange
                              }
                              className="
                                border
                                border-black
                                rounded
                                px-2
                                py-1
                                w-20
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

                {/* GST TOTAL */}

                <div className="grid grid-cols-2 border-t-2 border-black">
                  <div className="border-r-2 border-black px-3 py-2 font-medium">
                    Total GST
                  </div>

                  <div className="px-3 py-2 text-right font-semibold">
                    ₹{" "}
                    {formatAmount(
                      gstTotal
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