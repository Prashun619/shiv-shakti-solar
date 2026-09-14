import { useEffect, useState } from "react";

import { getCustomers } from "../services/customersService";
import { getProjects } from "../services/projectsService";

import {
  getUsedInventory,
  addUsedInventory,
  updateUsedInventory,
} from "../services/usedInventoryService";

import {
  getMasterInventory,
  getInventory,
} from "../services/inventoryService";

// ============================================================
// INITIAL FORM
// ============================================================

const INITIAL_FORM = {
  customer_id: "",
  project_no: "",
  plant_size: "",
  location: "",
  total_plant_cost: 0,

  aggregate_charges: 0,
  bhada: 0,
  cement_charges: 0,
  installation_charges: 0,
  je_charges: 0,
  load_extention: 0,
  meter_connection_charge: 0,
  meter_name_change_charge: 0,
  meter_change_charge: 0,
  net_meetering: 0,
  sand_charges: 0,
  vendor_charges: 0,
};

// ============================================================
// CALCULATE UNIT COST FROM INVENTORY RECORD
// ============================================================
//
// IMPORTANT:
//
// Inventory `unit_cost` is the FINAL purchase unit cost.
//
// It already includes:
//   1. Product purchase price
//   2. GST
//   3. Allocated transportation
//
// Therefore transportation MUST NOT be added again when
// `unit_cost` exists.
//
// Legacy fallback is kept only for old inventory records
// where `unit_cost` does not exist.
// ============================================================

function calculateInventoryUnitCost(item) {
  if (!item) return 0;

  // ============================================================
  // PRIMARY SOURCE
  // ============================================================
  // `unit_cost` is the final calculated unit purchase cost.
  // It already includes allocated transportation.
  // ============================================================

  const unitCost = Number(item.unit_cost);

  if (Number.isFinite(unitCost)) {
    return unitCost;
  }

  // ============================================================
  // LEGACY FALLBACK
  // ============================================================
  // Used only when an old Inventory record does not contain
  // a valid unit_cost.
  //
  // price + GST + transportation
  // ============================================================

  const price = Number(item.price ?? 0);
  const cgst = Number(item.cgst ?? 0);
  const sgst = Number(item.sgst ?? 0);
  const transportation = Number(item.transportation ?? 0);

  const gstAmount =
    (price * (cgst + sgst)) / 100;

  return (
    price +
    gstAmount +
    transportation
  );
}

// ============================================================
// GET LATEST INVENTORY RECORD
// ============================================================
//
// Priority:
//   1. Latest date
//   2. Latest created_at when dates are identical
//
// This makes sure Material Consumption always uses the latest
// purchase cost for the matching product.
// ============================================================

function getLatestInventoryRecord(records) {
  if (!Array.isArray(records) || records.length === 0) {
    return null;
  }

  return [...records].sort((a, b) => {
    // ==========================================================
    // 1. SAME ORDER AS INVENTORY VIEW
    // ==========================================================
    // Inventory View uses:
    //
    //   date DESC
    //   id DESC
    //
    // Therefore Material Consumption must use exactly
    // the same ordering.
    // ==========================================================

    const dateA = new Date(
      a?.date || 0
    ).getTime();

    const dateB = new Date(
      b?.date || 0
    ).getTime();

    if (dateB !== dateA) {
      return dateB - dateA;
    }

    // ==========================================================
    // 2. SAME DATE -> LATEST INVENTORY ROW BY ID
    // ==========================================================

    const idA = Number(a?.id || 0);
    const idB = Number(b?.id || 0);

    return idB - idA;
  })[0];
}

// ============================================================
// NORMALIZE PRODUCT NAME
// ============================================================

function normalizeName(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

// ============================================================
// GET UNIT PRICE FROM INVENTORY VIEW
// ============================================================
//
// Material Consumption must use the SAME unit_cost that is
// shown in Inventory View.
//
// Priority:
// 1. Exact inventory row from fifo_allocations.inventory_id
// 2. Matching product/company/specification inventory row
// 3. Saved old unit_price only as final fallback
//
// This is especially important for EXISTING consumption records
// whose old saved unit_price may be incorrect.
//

function getInventoryUnitPriceForSavedProduct(
  savedProduct,
  inventoryData
) {
  if (
    !savedProduct ||
    !Array.isArray(inventoryData)
  ) {
    return Number(
      savedProduct?.unit_price || 0
    );
  }

  // ==========================================================
  // 1. EXACT INVENTORY ROW FROM FIFO ALLOCATION
  // ==========================================================

  const allocations =
    Array.isArray(
      savedProduct.fifo_allocations
    )
      ? savedProduct.fifo_allocations
      : [];

  for (const allocation of allocations) {
    const inventoryId =
      allocation?.inventory_id;

    if (!inventoryId) {
      continue;
    }

    const inventoryRow =
      inventoryData.find(
        (row) =>
          String(row?.id) ===
          String(inventoryId)
      );

    if (inventoryRow) {
      const unitCost =
        Number(
          inventoryRow.unit_cost
        );

      if (
        Number.isFinite(unitCost) &&
        unitCost > 0
      ) {
        return unitCost;
      }
    }
  }

  // ==========================================================
  // 2. MATCH PRODUCT + COMPANY + SPECIFICATION
  // ==========================================================

  const productName =
    normalizeName(
      savedProduct.product_name
    );

  const company =
    normalizeName(
      savedProduct.company
    );

  const specification =
    normalizeName(
      savedProduct.specification
    );

  const matchingRows =
    inventoryData
      .filter((row) => {
        if (row?.active === false) {
          return false;
        }

        const sameProduct =
          normalizeName(
            row?.product_name
          ) === productName;

        const sameCompany =
          normalizeName(
            row?.company
          ) === company;

        const sameSpecification =
          normalizeName(
            row?.specification
          ) === specification;

        return (
          sameProduct &&
          sameCompany &&
          sameSpecification
        );
      })
      .sort((a, b) => {
        // Inventory View order:
        // date DESC, id DESC
        const dateA =
          new Date(
            a?.date || 0
          ).getTime();

        const dateB =
          new Date(
            b?.date || 0
          ).getTime();

        if (dateB !== dateA) {
          return dateB - dateA;
        }

        const idA =
          Number(a?.id || 0);

        const idB =
          Number(b?.id || 0);

        return idB - idA;
      });

  // ==========================================================
  // 3. USE INVENTORY UNIT COST
  // ==========================================================

  if (matchingRows.length > 0) {
    const unitCost =
      Number(
        matchingRows[0]?.unit_cost
      );

    if (
      Number.isFinite(unitCost) &&
      unitCost > 0
    ) {
      return unitCost;
    }
  }

  // ==========================================================
  // 4. FINAL FALLBACK
  // ==========================================================

  return Number(
    savedProduct.unit_price || 0
  );
}

// ============================================================
// MASTER INVENTORY LIVE STOCK
// ============================================================

function getMasterLiveStock(masterItem) {
  if (!masterItem) return 0;

  // Master Inventory is the SINGLE SOURCE OF TRUTH.

  const possibleValues = [
    masterItem.remaining,
    masterItem.remaining_quantity,
    masterItem.available_quantity,
    masterItem.stock,
    masterItem.quantity,
  ];

  for (const value of possibleValues) {
    const n = Number(value);

    if (
      Number.isFinite(n) &&
      n >= 0
    ) {
      return n;
    }
  }

  return 0;
}

// ============================================================
// COMPONENT
// ============================================================

export default function UsedInventoryModal({
  open,
  item,
  onClose,
  onSaved,
}) {
  // ==========================================================
  // CUSTOMER / PROJECT
  // ==========================================================

  const [customers, setCustomers] =
    useState([]);

  const [projects, setProjects] =
    useState([]);

  // ==========================================================
  // MATERIALS
  // ==========================================================

  const [materials, setMaterials] =
    useState([]);

  const [materialLoading, setMaterialLoading] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  // ==========================================================
  // FORM
  // ==========================================================

  const [form, setForm] = useState({
    ...INITIAL_FORM,
  });

  // ==========================================================
  // PANEL / INVERTER SERIAL NUMBERS
  // ==========================================================

  const [serialNumbers, setSerialNumbers] =
    useState({
      panel: [],
      inverter: [],
    });

  // ==========================================================
  // MANUAL INVERTER MODELS
  // ==========================================================

  const [inverterModels, setInverterModels] =
    useState([]);

  // ==========================================================
  // SERIAL NUMBER HELPERS
  // ==========================================================

  function resizeSerialNumbers(
    type,
    qty
  ) {
    const count = Math.max(
      0,
      Number(qty || 0)
    );

    setSerialNumbers((prev) => {
      const existing = Array.isArray(
        prev[type]
      )
        ? prev[type]
        : [];

      return {
        ...prev,

        [type]: Array.from(
          { length: count },
          (_, index) =>
            existing[index] || ""
        ),
      };
    });
  }

  function handleSerialNumberChange(
    type,
    index,
    value
  ) {
    setSerialNumbers((prev) => {
      const updated = Array.isArray(
        prev[type]
      )
        ? [...prev[type]]
        : [];

      updated[index] = value;

      return {
        ...prev,
        [type]: updated,
      };
    });
  }

  // ==========================================================
  // MANUAL INVERTER MODEL CHANGE
  // ==========================================================

  function handleInverterModelChange(
    index,
    value
  ) {
    setInverterModels((prev) => {
      const updated = Array.isArray(
        prev
      )
        ? [...prev]
        : [];

      updated[index] = value;

      return updated;
    });
  }

  // ==========================================================
  // GET SELECTED VARIANT MATERIAL
  // ==========================================================

  function getSelectedVariantMaterial(
    type
  ) {
    const normalizedType =
      normalizeName(type);

    return materials.find(
      (material) =>
        material.is_variant &&
        normalizeName(
          material.category
        ) === normalizedType
    );
  }

  // ==========================================================
  // KEEP SERIAL / MODEL ARRAYS EQUAL TO QTY
  // ==========================================================

  useEffect(() => {
    const panelMaterial =
      materials.find(
        (material) =>
          material.is_variant &&
          normalizeName(
            material.category
          ) === "panel"
      );

    const inverterMaterial =
      materials.find(
        (material) =>
          material.is_variant &&
          normalizeName(
            material.category
          ) === "inverter"
      );

    const panelQty = Number(
      panelMaterial?.qty || 0
    );

    const inverterQty = Number(
      inverterMaterial?.qty || 0
    );

    // ========================================================
    // PANEL / INVERTER SERIAL NUMBERS
    // ========================================================

    setSerialNumbers((prev) => {
      const panelExisting =
        Array.isArray(prev.panel)
          ? prev.panel
          : [];

      const inverterExisting =
        Array.isArray(prev.inverter)
          ? prev.inverter
          : [];

      const panelUpdated =
        Array.from(
          { length: panelQty },
          (_, index) =>
            panelExisting[index] || ""
        );

      const inverterUpdated =
        Array.from(
          { length: inverterQty },
          (_, index) =>
            inverterExisting[index] || ""
        );

      const panelChanged =
        panelUpdated.length !==
          panelExisting.length ||
        panelUpdated.some(
          (value, index) =>
            value !==
            panelExisting[index]
        );

      const inverterChanged =
        inverterUpdated.length !==
          inverterExisting.length ||
        inverterUpdated.some(
          (value, index) =>
            value !==
            inverterExisting[index]
        );

      if (
        !panelChanged &&
        !inverterChanged
      ) {
        return prev;
      }

      return {
        panel: panelUpdated,
        inverter: inverterUpdated,
      };
    });

    // ========================================================
    // INVERTER MODELS
    // ========================================================

    setInverterModels((prev) => {
      const existing =
        Array.isArray(prev)
          ? prev
          : [];

      const updated = Array.from(
        { length: inverterQty },
        (_, index) =>
          existing[index] || ""
      );

      const changed =
        updated.length !==
          existing.length ||
        updated.some(
          (value, index) =>
            value !==
            existing[index]
        );

      return changed
        ? updated
        : prev;
    });
  }, [materials]);

  // ==========================================================
  // LOAD DATA
  // ==========================================================

  useEffect(() => {
    if (!open) return;

    async function loadData() {
      setLoading(true);
      setMaterialLoading(true);

      try {
        const [
          customerData,
          projectData,
          usedInventoryData,
          inventoryData,
          masterInventoryData,
        ] = await Promise.all([
          getCustomers(),
          getProjects(),
          getUsedInventory(),
          getInventory(),
          getMasterInventory(),
        ]);

        // ======================================================
        // PROJECTS
        // ======================================================

        setProjects(projectData || []);

        // ======================================================
        // CUSTOMERS ALREADY HAVING MATERIAL CONSUMPTION
        // ======================================================

        const consumedCustomerIds =
          new Set(
            (usedInventoryData || []).map(
              (record) =>
                String(
                  record.customer_id
                )
            )
          );

        // ======================================================
        // AVAILABLE CUSTOMERS
        // ======================================================

        const availableCustomers =
          (customerData || []).filter(
            (customer) => {
              if (
                item &&
                String(customer.id) ===
                  String(item.customer_id)
              ) {
                return true;
              }

              return !consumedCustomerIds.has(
                String(customer.id)
              );
            }
          );

        // ======================================================
        // FIRST CREATED CUSTOMER FIRST
        // ======================================================

        availableCustomers.sort(
          (a, b) => {
            const dateA = new Date(
              a.created_at || 0
            ).getTime();

            const dateB = new Date(
              b.created_at || 0
            ).getTime();

            return dateA - dateB;
          }
        );

        setCustomers(
          availableCustomers
        );

        // ======================================================
        // RESTORE EDITING RECORD
        // ======================================================

        if (item) {
          console.log(
            "FULL EDIT ITEM:",
            item
          );

          console.log(
            "CHARGE FIELDS:",
            {
              name_change_charges:
                item.name_change_charges,

              meter_name_change_charge:
                item.meter_name_change_charge,

              meter_change_charges:
                item.meter_change_charges,

              meter_change_charge:
                item.meter_change_charge,

              additional_charges:
                item.additional_charges,
            }
          );

          console.log(
            "ADDITIONAL CHARGES FULL JSON:",
            JSON.stringify(
              item.additional_charges,
              null,
              2
            )
          );

          console.log(
            "EDIT ITEM ADDITIONAL CHARGES:",
            {
              gitti_charges:
                item.gitti_charges,

              aggregate_charges:
                item.aggregate_charges,

              bhada_charges:
                item.bhada_charges,

              cement_charges:
                item.cement_charges,

              sand_charges:
                item.sand_charges,

              installation_charges:
                item.installation_charges,

              je_charges:
                item.je_charges,

              load_extension_charges:
                item.load_extension_charges,

              meter_connection_charges:
                item.meter_connection_charges,

              name_change_charges:
                item.name_change_charges,

              net_metering_charges:
                item.net_metering_charges,

              vendor_charges:
                item.vendor_charges,

              additional_charges:
                item.additional_charges,
            }
          );

          setForm((prev) => ({
            ...prev,

            customer_id:
              item.customer_id || "",

            project_no:
              item.project_no || "",

            plant_size:
              item.plant_size || "",

            location:
              item.location || "",

            total_plant_cost:
              Number(
                item.total_plant_cost || 0
              ),

            // Gitti / Aggregate
            aggregate_charges:
              Number(
                item.aggregate_charges ??
                  item.gitti_charges ??
                  item
                    .additional_charges
                    ?.aggregate_charges ??
                  item
                    .additional_charges
                    ?.gitti_charges ??
                  0
              ),

            // Bhada
            bhada:
              Number(
                item.bhada_charges ??
                  item.bhada ??
                  item
                    .additional_charges
                    ?.bhada_charges ??
                  0
              ),

            // Cement
            cement_charges:
              Number(
                item.cement_charges ??
                  item.cement ??
                  item
                    .additional_charges
                    ?.cement_charges ??
                  0
              ),

            // Installation
            installation_charges:
              Number(
                item.installation_charges ??
                  item
                    .additional_charges
                    ?.installation_charges ??
                  0
              ),

            // JE
            je_charges:
              Number(
                item.je_charges ??
                  item
                    .additional_charges
                    ?.je_charges ??
                  0
              ),

            // Load Extension
            load_extention:
              Number(
                item.load_extension_charges ??
                  item.load_extention ??
                  item
                    .additional_charges
                    ?.load_extension_charges ??
                  0
              ),

            // Meter Connection
            meter_connection_charge:
              Number(
                item.meter_connection_charges ??
                  item.meter_connection_charge ??
                  item
                    .additional_charges
                    ?.meter_connection_charges ??
                  0
              ),

            // Meter Name Change
            meter_name_change_charge:
              Number(
                item.name_change_charges ??
                  item.meter_name_change_charge ??
                  item
                    .additional_charges
                    ?.name_change_charges ??
                  item
                    .additional_charges
                    ?.meter_name_change_charge ??
                  0
              ),

            // Meter Change
            meter_change_charge:
              Number(
                item.meter_change_charges ??
                  item.meter_change_charge ??
                  item
                    .additional_charges
                    ?.meter_change_charges ??
                  item
                    .additional_charges
                    ?.meter_change_charge ??
                  0
              ),

            // Net Metering
            net_meetering:
              Number(
                item.net_metering_charges ??
                  item.net_meetering ??
                  item
                    .additional_charges
                    ?.net_metering_charges ??
                  item
                    .additional_charges
                    ?.net_meetering ??
                  0
              ),

            // Sand
            sand_charges:
              Number(
                item.sand_charges ??
                  item.sand ??
                  item
                    .additional_charges
                    ?.sand_charges ??
                  0
              ),

            // Vendor
            vendor_charges:
              Number(
                item.vendor_charges ??
                  item
                    .additional_charges
                    ?.vendor_charges ??
                  0
              ),
          }));

          // ====================================================
          // RESTORE SAVED PANEL / INVERTER SERIAL NUMBERS
          // ====================================================

          const savedProducts =
            Array.isArray(item.products)
              ? item.products
              : [];

          const savedPanel =
            savedProducts.find(
              (product) =>
                normalizeName(
                  product.category
                ) === "panel" ||
                normalizeName(
                  product.product_name
                ) === "panel"
            );

          const savedInverter =
            savedProducts.find(
              (product) =>
                normalizeName(
                  product.category
                ) === "inverter" ||
                normalizeName(
                  product.product_name
                ) === "inverter"
            );

          // ====================================================
          // RESTORE PANEL / INVERTER SERIAL NUMBERS
          // ====================================================

          setSerialNumbers({
            panel: Array.isArray(
              savedPanel?.serial_numbers
            )
              ? savedPanel.serial_numbers
              : [],

            inverter: Array.isArray(
              savedInverter?.serial_numbers
            )
              ? savedInverter.serial_numbers
              : [],
          });

          // ====================================================
          // RESTORE MANUAL INVERTER MODELS
          // ====================================================

          setInverterModels(
            Array.isArray(
              savedInverter?.inverter_models
            )
              ? savedInverter.inverter_models
              : []
          );
        } else {
          setForm({
            ...INITIAL_FORM,
          });

          // ====================================================
          // NEW CONSUMPTION
          // ====================================================

          setSerialNumbers({
            panel: [],
            inverter: [],
          });

          setInverterModels([]);
        }

        // ======================================================
        // INVENTORY DATA
        // ======================================================

        const inventory =
          inventoryData || [];

        const masterInventory =
          masterInventoryData || [];

        console.log(
          "PANEL RECORDS JSON:",
          JSON.stringify(
            masterInventory.filter(
              (item) =>
                normalizeName(
                  item.category
                ) === "panel"
            ),
            null,
            2
          )
        );

        console.log(
          "INVERTER RECORDS JSON:",
          JSON.stringify(
            masterInventory.filter(
              (item) =>
                normalizeName(
                  item.category
                ) === "inverter"
            ),
            null,
            2
          )
        );

        // ======================================================
        // BUILD NORMAL MATERIAL LIST
        // ======================================================

        const normalMaterials = [];

        console.log(
          "STEP 1 - normalMaterials CREATED"
        );

        // ======================================================
        // PANEL VARIANTS
        // ======================================================

        const panelVariants =
          masterInventory
            .filter((item) => {
              return (
                normalizeName(
                  item.category
                ) === "panel"
              );
            })
            .map((masterItem) => {
              const company =
                String(
                  masterItem.company ||
                    ""
                ).trim();

              const specification =
                String(
                  masterItem.specification ||
                    ""
                ).trim();

              const displayName =
                `${company} ${specification}`.trim();

              const stock =
                getMasterLiveStock(
                  masterItem
                );

              const matchingInventory =
                inventory.filter(
                  (inventoryItem) => {
                    return (
                      normalizeName(
                        inventoryItem.product_name
                      ) === "panel" &&
                      normalizeName(
                        inventoryItem.company
                      ) ===
                        normalizeName(
                          company
                        ) &&
                      normalizeName(
                        inventoryItem.specification
                      ) ===
                        normalizeName(
                          specification
                        )
                    );
                  }
                );

              // =================================================
// FIFO OLDEST PURCHASE RECORD
// =================================================

const inventoryItem =
  matchingInventory.length > 0
    ? [...matchingInventory].sort(
        (a, b) => {
          const dateA =
            new Date(
              a.date || 0
            ).getTime();

          const dateB =
            new Date(
              b.date || 0
            ).getTime();

          if (dateA !== dateB) {
            return dateA - dateB;
          }

          return String(
            a.id || ""
          ).localeCompare(
            String(b.id || "")
          );
        }
      )[0]
    : null;

const unitPrice =
  calculateInventoryUnitCost(
    inventoryItem
  );

              console.log(
                "FIFO PANEL INVENTORY COST:",
                {
                  company,
                  specification,
                  inventoryItem,
                  unitCost:
                    inventoryItem?.unit_cost,
                  calculatedUnitPrice:
                    unitPrice,
                }
              );

              return {
                master_id:
                  masterItem.id,

                product_name:
                  displayName,

                company,

                specification,

                stock:
                  Number(stock),

                unit_price:
                  Number(unitPrice),
              };
            })
            .sort(
              (a, b) =>
                a.product_name.localeCompare(
                  b.product_name,
                  undefined,
                  {
                    sensitivity:
                      "base",
                  }
                )
            );

        // ======================================================
        // INVERTER VARIANTS
        // ======================================================

        const inverterVariants =
          masterInventory
            .filter((item) => {
              return (
                normalizeName(
                  item.category
                ) === "inverter"
              );
            })
            .map((masterItem) => {
              const company =
                String(
                  masterItem.company ||
                    ""
                ).trim();

              const specification =
                String(
                  masterItem.specification ||
                    ""
                ).trim();

              const formattedSpecification =
                specification
                  .replace(
                    /\s*kw\s*/gi,
                    "KW"
                  )
                  .replace(
                    /\s+/g,
                    " "
                  );

              const displayName =
                `${company} ${formattedSpecification}`.trim();

              const stock =
                getMasterLiveStock(
                  masterItem
                );

              const matchingInventory =
                inventory.filter(
                  (inventoryItem) => {
                    return (
                      normalizeName(
                        inventoryItem.product_name
                      ) ===
                        "inverter" &&
                      normalizeName(
                        inventoryItem.company
                      ) ===
                        normalizeName(
                          company
                        ) &&
                      normalizeName(
                        inventoryItem.specification
                      ) ===
                        normalizeName(
                          specification
                        )
                    );
                  }
                );

              // =================================================
// FIFO OLDEST PURCHASE RECORD
// =================================================

const inventoryItem =
  matchingInventory.length > 0
    ? [...matchingInventory].sort(
        (a, b) => {
          const dateA =
            new Date(
              a.date || 0
            ).getTime();

          const dateB =
            new Date(
              b.date || 0
            ).getTime();

          if (dateA !== dateB) {
            return dateA - dateB;
          }

          return String(
            a.id || ""
          ).localeCompare(
            String(b.id || "")
          );
        }
      )[0]
    : null;

const unitPrice =
  calculateInventoryUnitCost(
    inventoryItem
  );

              console.log(
                "FIFO INVERTER INVENTORY COST:",
                {
                  company,
                  specification,
                  inventoryItem,
                  unitCost:
                    inventoryItem?.unit_cost,
                  calculatedUnitPrice:
                    unitPrice,
                }
              );

              return {
                master_id:
                  masterItem.id,

                product_name:
                  displayName,

                company,

                specification,

                stock:
                  Number(stock),

                unit_price:
                  Number(unitPrice),
              };
            })
            .sort(
              (a, b) =>
                a.product_name.localeCompare(
                  b.product_name,
                  undefined,
                  {
                    sensitivity:
                      "base",
                  }
                )
            );

        console.log(
          "STEP 2 - VARIANTS BUILT",
          {
            panelVariants,
            inverterVariants,
          }
        );

        // ======================================================
        // ADD PANEL
        // ======================================================

        if (panelVariants.length > 0) {
          normalMaterials.push({
            id: "panel",

            product_name: "Panel",

            category: "Panel",

            is_variant: true,

            variants:
              panelVariants,

            selected_variant:
              "",

            stock: 0,

            unit_price: 0,

            qty: 0,
          });
        }

        // ======================================================
        // ADD INVERTER
        // ======================================================

        if (
          inverterVariants.length > 0
        ) {
          normalMaterials.push({
            id: "inverter",

            product_name:
              "Inverter",

            category:
              "Inverter",

            is_variant: true,

            variants:
              inverterVariants,

            selected_variant:
              "",

            stock: 0,

            unit_price: 0,

            qty: 0,
          });
        }

        // ======================================================
        // NORMAL PRODUCTS
        // ======================================================

        masterInventory
          .filter((masterItem) => {
            const category =
              normalizeName(
                masterItem.category
              );

            const productName =
              normalizeName(
                masterItem.product_name
              );

            const isPanel =
              category === "panel" ||
              productName === "panel" ||
              productName.includes(
                "panel"
              );

            const isInverter =
              category === "inverter" ||
              productName === "inverter" ||
              productName.includes(
                "inverter"
              );

            return (
              !isPanel &&
              !isInverter
            );
          })
          .forEach((masterItem) => {
            const productName =
              String(
                masterItem.product_name ||
                  ""
              ).trim();

            if (!productName) {
              return;
            }

            const category =
              String(
                masterItem.category ||
                  ""
              ).trim();

            const stock =
              getMasterLiveStock(
                masterItem
              );

            const matchingInventory =
              inventory.filter(
                (inventoryItem) => {
                  const sameProduct =
                    normalizeName(
                      inventoryItem.product_name
                    ) ===
                    normalizeName(
                      productName
                    );

                  const sameCompany =
                    !masterItem.company ||
                    normalizeName(
                      inventoryItem.company
                    ) ===
                      normalizeName(
                        masterItem.company
                      );

                  const sameSpecification =
                    !masterItem.specification ||
                    normalizeName(
                      inventoryItem.specification
                    ) ===
                      normalizeName(
                        masterItem.specification
                      );

                  return (
                    sameProduct &&
                    sameCompany &&
                    sameSpecification
                  );
                }
              );

            // =================================================
// FIFO OLDEST PURCHASE RECORD
// =================================================

const inventoryItem =
  matchingInventory.length > 0
    ? [...matchingInventory].sort(
        (a, b) => {
          const dateA =
            new Date(
              a.date || 0
            ).getTime();

          const dateB =
            new Date(
              b.date || 0
            ).getTime();

          if (dateA !== dateB) {
            return dateA - dateB;
          }

          return String(
            a.id || ""
          ).localeCompare(
            String(b.id || "")
          );
        }
      )[0]
    : null;

const unitPrice =
  calculateInventoryUnitCost(
    inventoryItem
  );

            console.log(
              "FIFO NORMAL PRODUCT INVENTORY COST:",
              {
                productName,
                company:
                  masterItem.company,
                specification:
                  masterItem.specification,
                inventoryItem,
                unitCost:
                  inventoryItem?.unit_cost,
                calculatedUnitPrice:
                  unitPrice,
              }
            );

            normalMaterials.push({
              id:
                masterItem.id ||
                `${productName}-${masterItem.company || ""}-${masterItem.specification || ""}`,

              product_name:
                productName,

              category:
                category,

              company:
                String(
                  masterItem.company ||
                    ""
                ).trim(),

              specification:
                String(
                  masterItem.specification ||
                    ""
                ).trim(),

              is_variant: false,

              variants: [],

              selected_variant:
                "",

              selected_master_id:
                "",

              stock:
                Number(stock),

              unit_price:
                Number(unitPrice),

              qty: 0,
            });
          });

        // ======================================================
        // RESTORE SAVED MATERIALS
        // ======================================================

        let restoredMaterials = [
          ...normalMaterials,
        ];

        if (
          item &&
          Array.isArray(item.products)
        ) {
          const savedProducts =
            item.products || [];

          savedProducts.forEach(
            (savedProduct) => {
              const savedName =
                normalizeName(
                  savedProduct.product_name
                );

              const savedCategory =
                normalizeName(
                  savedProduct.category
                );

              const savedCompany =
                normalizeName(
                  savedProduct.company
                );

              const savedSpecification =
                normalizeName(
                  savedProduct.specification
                );

              const savedQty =
                Number(
                  savedProduct.quantity ??
                    savedProduct.qty ??
                    0
                );

              const savedUnitPrice =
  getInventoryUnitPriceForSavedProduct(
    savedProduct,
    inventoryData
  );

              // ------------------------------------------------
              // PANEL / INVERTER
              // ------------------------------------------------

              if (
                savedCategory ===
                  "panel" ||
                savedCategory ===
                  "inverter"
              ) {
                const variantRow =
                  restoredMaterials.find(
                    (material) =>
                      material.is_variant &&
                      normalizeName(
                        material.category
                      ) ===
                        savedCategory
                  );

                if (variantRow) {
                  const variant =
                    variantRow.variants.find(
                      (v) =>
                        normalizeName(
                          v.company
                        ) ===
                          savedCompany &&
                        normalizeName(
                          v.specification
                        ) ===
                          savedSpecification
                    );

                  if (variant) {
                    variantRow.selected_variant =
                      variant.product_name;

                    variantRow.selected_master_id =
                      variant.master_id;

                    variantRow.company =
                      variant.company;

                    variantRow.specification =
                      variant.specification;

                    variantRow.stock =
                      Number(
                        variant.stock ||
                          0
                      ) +
                      savedQty;

                    variantRow.unit_price =
                      savedUnitPrice ||
                      Number(
                        variant.unit_price ||
                          0
                      );

                    variantRow.qty =
                      savedQty;
                  } else {
                    // Saved variant no longer exists
                    // in Master Inventory.

                    variantRow.selected_variant =
                      `${savedProduct.company || ""} ${
                        savedProduct.specification ||
                        ""
                      }`.trim();

                    variantRow.selected_master_id =
                      savedProduct.master_id ||
                      "";

                    variantRow.company =
                      savedProduct.company ||
                      "";

                    variantRow.specification =
                      savedProduct.specification ||
                      "";

                    variantRow.stock =
                      savedQty;

                    variantRow.unit_price =
                      savedUnitPrice;

                    variantRow.qty =
                      savedQty;
                  }

                  return;
                }
              }

              // ------------------------------------------------
              // NORMAL PRODUCT
              // ------------------------------------------------

              const existingIndex =
                restoredMaterials.findIndex(
                  (material) => {
                    const sameName =
                      normalizeName(
                        material.product_name
                      ) ===
                      savedName;

                    const sameCompany =
                      normalizeName(
                        material.company ||
                          ""
                      ) ===
                      savedCompany;

                    const sameSpecification =
                      normalizeName(
                        material.specification ||
                          ""
                      ) ===
                      savedSpecification;

                    return (
                      sameName &&
                      sameCompany &&
                      sameSpecification
                    );
                  }
                );

              // ------------------------------------------------
              // EXISTING MASTER INVENTORY PRODUCT
              // ------------------------------------------------

              if (
                existingIndex !== -1
              ) {
                const material =
                  restoredMaterials[
                    existingIndex
                  ];

                restoredMaterials[
                  existingIndex
                ] = {
                  ...material,

                  stock:
                    Number(
                      material.stock ||
                        0
                    ) +
                    savedQty,

                  qty:
                    savedQty,

                  unit_price:
                    savedUnitPrice ||
                    Number(
                      material.unit_price ||
                        0
                    ),

                  company:
                    savedProduct.company ??
                    material.company ??
                    "",

                  specification:
                    savedProduct.specification ??
                    material.specification ??
                    "",
                };

                return;
              }

              // ------------------------------------------------
              // OLD PRODUCT NO LONGER IN MASTER INVENTORY
              // ------------------------------------------------

              restoredMaterials.push({
                id:
                  savedProduct.master_id ||
                  `saved-${savedName}-${Date.now()}-${Math.random()}`,

                product_name:
                  savedProduct.product_name ||
                  "",

                category:
                  savedProduct.category ||
                  "",

                company:
                  savedProduct.company ||
                  "",

                specification:
                  savedProduct.specification ||
                  "",

                is_variant:
                  false,

                variants: [],

                selected_variant:
                  "",

                selected_master_id:
                  savedProduct.master_id ||
                  "",

                stock:
                  savedQty,

                unit_price:
                  savedUnitPrice,

                qty:
                  savedQty,
              });
            }
          );
        }

        // ======================================================
        // ALPHABETICAL ORDER
        // ======================================================

        restoredMaterials.sort(
          (a, b) =>
            String(
              a.product_name || ""
            ).localeCompare(
              String(
                b.product_name || ""
              ),
              undefined,
              {
                sensitivity:
                  "base",
              }
            )
        );

        console.log(
          "STEP 3 - RESTORED MATERIALS",
          JSON.stringify(
            restoredMaterials,
            null,
            2
          )
        );

        setMaterials(
          restoredMaterials
        );
      } catch (error) {
        console.error(
          "Failed to load material consumption data:",
          error
        );

        alert(
          error?.message ||
            "Failed to load customer, project and inventory data."
        );
      } finally {
        setLoading(false);
        setMaterialLoading(false);
      }
    }

    loadData();
  }, [open, item]);

  // ==========================================================
  // CUSTOMER CHANGE
  // ==========================================================

  function handleCustomerChange(e) {
    const customerId =
      e.target.value;

    if (!customerId) {
      setForm({
        ...INITIAL_FORM,
      });

      return;
    }

    const customer =
      customers.find(
        (c) =>
          String(c.id) ===
          String(customerId)
      );

    const customerProject =
      projects.find(
        (project) =>
          String(
            project.customer_id
          ) ===
          String(customerId)
      );

    setForm((prev) => ({
      ...prev,

      customer_id:
        customerId,

      project_no:
        customerProject?.project_no ||
        "",

      plant_size:
        customer?.plant_size ||
        customerProject?.project_size ||
        "",

      location:
        customer?.location ||
        "",
    }));
  }

  // ==========================================================
  // SELECT PANEL / INVERTER VARIANT
  // ==========================================================

  function handleVariantChange(
    materialId,
    masterId
  ) {
    const currentMaterial =
      materials.find(
        (material) =>
          material.id ===
          materialId
      );

    // --------------------------------------------------------
    // RESET PANEL SERIALS
    // --------------------------------------------------------

    if (
      currentMaterial?.is_variant &&
      normalizeName(
        currentMaterial.category
      ) === "panel"
    ) {
      setSerialNumbers((prev) => ({
        ...prev,
        panel: [],
      }));
    }

    // --------------------------------------------------------
    // RESET INVERTER SERIALS + MODELS
    // --------------------------------------------------------

    if (
      currentMaterial?.is_variant &&
      normalizeName(
        currentMaterial.category
      ) === "inverter"
    ) {
      setSerialNumbers((prev) => ({
        ...prev,
        inverter: [],
      }));

      setInverterModels([]);
    }

    setMaterials((prev) =>
      prev.map((material) => {
        if (
          material.id !==
          materialId
        ) {
          return material;
        }

        const selectedVariant =
          (
            material.variants ||
            []
          ).find(
            (variant) =>
              String(
                variant.master_id
              ) ===
              String(masterId)
          );

        if (!selectedVariant) {
          return {
            ...material,

            selected_variant:
              "",

            selected_master_id:
              "",

            company: "",

            specification: "",

            stock: 0,

            unit_price: 0,

            qty: 0,
          };
        }

        return {
          ...material,

          selected_variant:
            selectedVariant.product_name,

          selected_master_id:
            selectedVariant.master_id,

          company:
            selectedVariant.company ||
            "",

          specification:
            selectedVariant.specification ||
            "",

          stock:
            Number(
              selectedVariant.stock ||
                0
            ),

          unit_price:
            Number(
              selectedVariant.unit_price ||
                0
            ),

          qty: 0,
        };
      })
    );
  }

  // ==========================================================
  // MATERIAL QTY CHANGE
  // ==========================================================

  function handleMaterialQtyChange(
    materialId,
    value
  ) {
    // --------------------------------------------------------
    // EMPTY VALUE
    // --------------------------------------------------------

    if (value === "") {
      const selectedMaterial =
        materials.find(
          (material) =>
            material.id ===
            materialId
        );

      // Reset Panel serials

      if (
        selectedMaterial?.is_variant &&
        normalizeName(
          selectedMaterial.category
        ) === "panel"
      ) {
        setSerialNumbers((prev) => ({
          ...prev,
          panel: [],
        }));
      }

      // Reset Inverter serials + models

      if (
        selectedMaterial?.is_variant &&
        normalizeName(
          selectedMaterial.category
        ) === "inverter"
      ) {
        setSerialNumbers((prev) => ({
          ...prev,
          inverter: [],
        }));

        setInverterModels([]);
      }

      setMaterials((prev) =>
        prev.map((material) =>
          material.id ===
          materialId
            ? {
                ...material,
                qty: 0,
              }
            : material
        )
      );

      return;
    }

    const qty =
      Number(value);

    if (
      Number.isNaN(qty) ||
      qty < 0
    ) {
      return;
    }

    setMaterials((prev) =>
      prev.map((material) => {
        if (
          material.id !==
          materialId
        ) {
          return material;
        }

        // ------------------------------------------------------
        // PANEL / INVERTER MUST HAVE VARIANT
        // ------------------------------------------------------

        if (
          material.is_variant &&
          !material.selected_variant
        ) {
          alert(
            `Please select ${material.product_name} variant first.`
          );

          return material;
        }

        const availableStock =
          Number(
            material.stock || 0
          );

        if (
          qty >
          availableStock
        ) {
          alert(
            `Only ${availableStock} ${
              material.selected_variant ||
              material.product_name
            } available in Master Inventory.`
          );

          return {
            ...material,

            qty:
              availableStock,
          };
        }

        return {
          ...material,
          qty,
        };
      })
    );
  }

  // ==========================================================
  // DELETE MATERIAL
  // ==========================================================

  function handleDeleteMaterial(
    materialId
  ) {
    const material =
      materials.find(
        (item) =>
          item.id === materialId
      );

    // --------------------------------------------------------
    // DELETE PANEL
    // --------------------------------------------------------

    if (
      material?.is_variant &&
      normalizeName(
        material.category
      ) === "panel"
    ) {
      setSerialNumbers((prev) => ({
        ...prev,
        panel: [],
      }));
    }

    // --------------------------------------------------------
    // DELETE INVERTER
    // --------------------------------------------------------

    if (
      material?.is_variant &&
      normalizeName(
        material.category
      ) === "inverter"
    ) {
      setSerialNumbers((prev) => ({
        ...prev,
        inverter: [],
      }));

      setInverterModels([]);
    }

    setMaterials((prev) =>
      prev.filter(
        (item) =>
          item.id !==
          materialId
      )
    );
  }

  // ==========================================================
  // SAVE MATERIAL CONSUMPTION
  // ==========================================================

  async function handleSave() {
    // --------------------------------------------------------
    // VALIDATE CUSTOMER
    // --------------------------------------------------------

    if (!form.customer_id) {
      alert(
        "Please select a customer."
      );

      return;
    }

    // --------------------------------------------------------
    // VALIDATE PROJECT
    // --------------------------------------------------------

    if (!form.project_no) {
      alert(
        "Project number is missing."
      );

      return;
    }

    // ========================================================
    // VALIDATE PANEL SERIAL NUMBERS
    // ========================================================

    const panelMaterial =
      materials.find(
        (material) =>
          material.is_variant &&
          normalizeName(
            material.category
          ) === "panel"
      );

    const panelQty = Number(
      panelMaterial?.qty || 0
    );

    if (panelQty > 0) {
      const panelSerials =
        Array.isArray(
          serialNumbers.panel
        )
          ? serialNumbers.panel.slice(
              0,
              panelQty
            )
          : [];

      const missingPanelSerial =
        panelSerials.some(
          (serial) =>
            !String(
              serial || ""
            ).trim()
        );

      if (
        missingPanelSerial ||
        panelSerials.length !==
          panelQty
      ) {
        alert(
          `Please enter all ${panelQty} Panel Serial Numbers.`
        );

        return;
      }
    }

    // ========================================================
    // VALIDATE INVERTER SERIAL NUMBERS
    // ========================================================

    const inverterMaterial =
      materials.find(
        (material) =>
          material.is_variant &&
          normalizeName(
            material.category
          ) === "inverter"
      );

    const inverterQty =
      Number(
        inverterMaterial?.qty ||
          0
      );

    if (inverterQty > 0) {
      const inverterSerials =
        Array.isArray(
          serialNumbers.inverter
        )
          ? serialNumbers.inverter.slice(
              0,
              inverterQty
            )
          : [];

      const missingInverterSerial =
        inverterSerials.some(
          (serial) =>
            !String(
              serial || ""
            ).trim()
        );

      if (
        missingInverterSerial ||
        inverterSerials.length !==
          inverterQty
      ) {
        alert(
          `Please enter all ${inverterQty} Inverter Serial Numbers.`
        );

        return;
      }
    }

    // ========================================================
    // VALIDATE MANUAL INVERTER MODELS
    // ========================================================

    if (inverterQty > 0) {
      const inverterModelValues =
        Array.isArray(
          inverterModels
        )
          ? inverterModels.slice(
              0,
              inverterQty
            )
          : [];

      const missingInverterModel =
        inverterModelValues.some(
          (model) =>
            !String(
              model || ""
            ).trim()
        );

      if (
        missingInverterModel ||
        inverterModelValues.length !==
          inverterQty
      ) {
        alert(
          `Please enter all ${inverterQty} Inverter Models.`
        );

        return;
      }
    }

    // ========================================================
    // BUILD PRODUCTS TO SAVE
    // ========================================================

    const productsToSave = [];

    materials
      .filter(
        (material) =>
          Number(
            material.qty || 0
          ) > 0
      )
      .forEach((material) => {
        const qty =
          Number(
            material.qty || 0
          );

        const unitPrice =
          Number(
            material.unit_price ||
              0
          );

        // ==================================================
        // SELECTED VARIANT
        // ==================================================

        const selectedVariant =
          material.is_variant
            ? (
                material.variants ||
                []
              ).find(
                (variant) =>
                  String(
                    variant.master_id
                  ) ===
                  String(
                    material.selected_master_id
                  )
              )
            : null;

        // ==================================================
        // PRODUCT NAME
        // ==================================================

        const productName =
          material.is_variant
            ? material.product_name ===
              "Panel"
              ? "Panel"
              : "Inverter"
            : material.product_name;

        // ==================================================
        // COMPANY
        // ==================================================

        const company =
          material.is_variant
            ? selectedVariant
                ?.company ||
              material.company ||
              ""
            : material.company ||
              "";

        // ==================================================
        // SPECIFICATION
        //
        // IMPORTANT:
        // Keep this for inventory identification.
        // It is NOT the manually entered inverter model.
        // ==================================================

        const specification =
          material.is_variant
            ? selectedVariant
                ?.specification ||
              material.specification ||
              ""
            : material.specification ||
              "";

        // ==================================================
        // MASTER ID
        // ==================================================

        const masterId =
          material.is_variant
            ? selectedVariant
                ?.master_id ||
              material.selected_master_id ||
              null
            : material.id ||
              null;

        // ==================================================
        // SERIAL NUMBERS
        // ==================================================

        let productSerialNumbers =
          [];

        // PANEL SERIAL NUMBERS

        if (
          material.is_variant &&
          normalizeName(
            material.category
          ) === "panel"
        ) {
          productSerialNumbers =
            Array.isArray(
              serialNumbers.panel
            )
              ? serialNumbers.panel
                  .slice(0, qty)
                  .map((serial) =>
                    String(
                      serial || ""
                    ).trim()
                  )
              : [];
        }

        // INVERTER SERIAL NUMBERS

        if (
          material.is_variant &&
          normalizeName(
            material.category
          ) === "inverter"
        ) {
          productSerialNumbers =
            Array.isArray(
              serialNumbers.inverter
            )
              ? serialNumbers.inverter
                  .slice(0, qty)
                  .map((serial) =>
                    String(
                      serial || ""
                    ).trim()
                  )
              : [];
        }

        // ==================================================
        // MANUAL INVERTER MODELS
        // ==================================================

        let productInverterModels =
          [];

        if (
          material.is_variant &&
          normalizeName(
            material.category
          ) === "inverter"
        ) {
          productInverterModels =
            Array.isArray(
              inverterModels
            )
              ? inverterModels
                  .slice(0, qty)
                  .map((model) =>
                    String(
                      model || ""
                    ).trim()
                  )
              : [];
        }

        // ==================================================
        // SAVE MATERIAL
        // ==================================================

        productsToSave.push({
          product_name:
            productName,

          category:
            material.category ||
            "",

          company:
            company,

          specification:
            specification,

          master_id:
            masterId,

          quantity:
            qty,

          unit_price:
            unitPrice,

          total:
            qty * unitPrice,

          // Panel / Inverter serial numbers
          serial_numbers:
            productSerialNumbers,

          // Manual inverter models
          inverter_models:
            productInverterModels,
        });
      });

    // --------------------------------------------------------
    // VALIDATE PRODUCTS
    // --------------------------------------------------------

    if (
      productsToSave.length === 0
    ) {
      alert(
        "Please enter quantity for at least one material."
      );

      return;
    }

    // --------------------------------------------------------
    // TOTAL MATERIAL COST
    // --------------------------------------------------------

    const materialCost =
      productsToSave.reduce(
        (sum, product) =>
          sum +
          Number(
            product.total || 0
          ),
        0
      );

    // --------------------------------------------------------
    // ADDITIONAL CHARGES TOTAL
    // --------------------------------------------------------

    const additionalChargesTotal =
      Number(
        form.aggregate_charges ||
          0
      ) +
      Number(
        form.bhada || 0
      ) +
      Number(
        form.cement_charges ||
          0
      ) +
      Number(
        form.installation_charges ||
          0
      ) +
      Number(
        form.je_charges || 0
      ) +
      Number(
        form.load_extention ||
          0
      ) +
      Number(
        form.meter_connection_charge ||
          0
      ) +
      Number(
        form.meter_name_change_charge ||
          0
      ) +
      Number(
        form.meter_change_charge ||
          0
      ) +
      Number(
        form.net_meetering ||
          0
      ) +
      Number(
        form.sand_charges || 0
      ) +
      Number(
        form.vendor_charges ||
          0
      );

    // --------------------------------------------------------
    // TOTAL PLANT COST
    // --------------------------------------------------------

    const totalPlantCost =
      materialCost +
      additionalChargesTotal;

    // --------------------------------------------------------
    // PAYLOAD
    // --------------------------------------------------------

    const payload = {
      customer_id:
        form.customer_id,

      project_no:
        form.project_no,

      plant_size:
        form.plant_size,

      location:
        form.location,

      products:
        productsToSave,

      material_cost:
        materialCost,

      gitti_charges:
        Number(
          form.aggregate_charges ||
            0
        ),

      aggregate_charges:
        Number(
          form.aggregate_charges ||
            0
        ),

      bhada_charges:
        Number(
          form.bhada || 0
        ),

      cement_charges:
        Number(
          form.cement_charges ||
            0
        ),

      sand_charges:
        Number(
          form.sand_charges || 0
        ),

      installation_charges:
        Number(
          form.installation_charges ||
            0
        ),

      vendor_charges:
        Number(
          form.vendor_charges ||
            0
        ),

      load_extension_charges:
        Number(
          form.load_extention ||
            0
        ),

      net_metering_charges:
        Number(
          form.net_meetering ||
            0
        ),

      je_charges:
        Number(
          form.je_charges || 0
        ),

      name_change_charges:
        Number(
          form.meter_name_change_charge ||
            0
        ),

      meter_change_charges:
        Number(
          form.meter_change_charge ||
            0
        ),

      meter_connection_charges:
        Number(
          form.meter_connection_charge ||
            0
        ),

      total_plant_cost:
        totalPlantCost,
    };

    // ======================================================
    // DEBUG BEFORE SAVE
    // ======================================================

    console.log(
      "MATERIAL CONSUMPTION SAVE PAYLOAD:",
      payload
    );

    // ======================================================
    // SAVE
    // ======================================================

    try {
      setLoading(true);

      if (item?.id) {
        await updateUsedInventory(
          item.id,
          payload
        );
      } else {
        await addUsedInventory(
          payload
        );
      }

      onClose();

      if (onSaved) {
        Promise.resolve(
          onSaved()
        ).catch((error) => {
          console.error(
            "Failed to refresh Material Consumption:",
            error
          );
        });
      }
    } catch (error) {
      console.error(
        "Failed to save Material Consumption:",
        error
      );

      alert(
        error?.message ||
          "Failed to save Material Consumption."
      );
    } finally {
      setLoading(false);
    }
  }

  // ==========================================================
  // LIVE MATERIAL COST
  // ==========================================================

  const liveMaterialCost =
    materials.reduce(
      (sum, material) => {
        const qty =
          Number(
            material.qty || 0
          );

        const unitPrice =
          Number(
            material.unit_price ||
              0
          );

        return (
          sum +
          qty * unitPrice
        );
      },
      0
    );

  // ==========================================================
  // LIVE ADDITIONAL CHARGES
  // ==========================================================

  const liveAdditionalCharges =
    Number(
      form.aggregate_charges ||
        0
    ) +
    Number(
      form.bhada || 0
    ) +
    Number(
      form.cement_charges ||
        0
    ) +
    Number(
      form.installation_charges ||
        0
    ) +
    Number(
      form.je_charges || 0
    ) +
    Number(
      form.load_extention ||
        0
    ) +
    Number(
      form.meter_connection_charge ||
        0
    ) +
    Number(
      form.meter_name_change_charge ||
        0
    ) +
    Number(
      form.meter_change_charge ||
        0
    ) +
    Number(
      form.net_meetering || 0
    ) +
    Number(
      form.sand_charges || 0
    ) +
    Number(
      form.vendor_charges || 0
    );

  // ==========================================================
  // LIVE TOTAL PLANT COST
  // ==========================================================

  const liveTotalPlantCost =
    liveMaterialCost +
    liveAdditionalCharges;

  // ==========================================================
  // SERIAL NUMBER TABLE DATA
  // ==========================================================

  const panelMaterial =
    getSelectedVariantMaterial(
      "Panel"
    );

  const inverterMaterial =
    getSelectedVariantMaterial(
      "Inverter"
    );

  const panelQty =
    Number(
      panelMaterial?.qty || 0
    );

  const inverterQty =
    Number(
      inverterMaterial?.qty || 0
    );

  const serialRowCount =
    Math.max(
      panelQty,
      inverterQty
    );

  // ==========================================================
  // CLOSE
  // ==========================================================

  if (!open) {
    return null;
  }

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="fixed inset-0 z-50 bg-black/60">
      <div
        className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 w-full h-full overflow-y-auto"
        onWheel={(e) => {
          if (
            e.target.type ===
            "number"
          ) {
            e.target.blur();
          }
        }}
      >
        <div className="p-8 max-w-[1600px] mx-auto">

          {/* ==================================================
              HEADER
          ================================================== */}

          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                {item
                  ? "Edit Material Consumption"
                  : "Add Material Consumption"}
              </h2>

              <p className="text-indigo-500 font-medium mt-1">
                Material Consumption • Inventory Usage
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg"
            >
              Close
            </button>
          </div>

          {/* ==================================================
              CUSTOMER DETAILS
          ================================================== */}

          <div className="border border-blue-200 rounded-2xl p-6 mb-8 bg-white/90 shadow-lg shadow-blue-100">
            <h3 className="text-xl font-bold mb-5 text-blue-700 flex items-center gap-2">
              <span className="w-2 h-7 bg-blue-600 rounded-full"></span>
              Customer Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">

              {/* CUSTOMER */}

              <div>
                <label className="block font-semibold mb-1">
                  Customer
                </label>

                <select
                  name="customer_id"
                  value={
                    form.customer_id
                  }
                  onChange={
                    handleCustomerChange
                  }
                  disabled={Boolean(
                    item
                  )}
                  className={`border p-2.5 rounded-lg w-full ${
                    item
                      ? "bg-gray-200 cursor-not-allowed"
                      : "bg-white"
                  }`}
                >
                  <option value="">
                    Select Customer
                  </option>

                  {customers.map(
                    (customer) => (
                      <option
                        key={
                          customer.id
                        }
                        value={
                          customer.id
                        }
                      >
                        {
                          customer.customer_name
                        }
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* PROJECT NUMBER */}

              <div>
                <label className="block font-semibold mb-1">
                  Project Number
                </label>

                <input
                  type="text"
                  value={
                    form.project_no ||
                    ""
                  }
                  readOnly
                  className="border p-2.5 rounded-lg w-full bg-gray-100"
                />
              </div>

              {/* PLANT SIZE */}

              <div>
                <label className="block font-semibold mb-1">
                  Plant Size
                </label>

                <input
                  type="text"
                  value={
                    form.plant_size
                      ? `${form.plant_size} KW`
                      : ""
                  }
                  readOnly
                  className="border p-2.5 rounded-lg w-full bg-gray-100"
                />
              </div>

              {/* LOCATION */}

              <div>
                <label className="block font-semibold mb-1">
                  Location
                </label>

                <input
                  type="text"
                  value={
                    form.location ||
                    ""
                  }
                  readOnly
                  className="border p-2.5 rounded-lg w-full bg-gray-100"
                />
              </div>

              {/* TOTAL PLANT COST */}

              <div>
                <label className="block font-semibold mb-1">
                  Total Plant Cost
                </label>

                <input
                  type="text"
                  value={`₹ ${liveTotalPlantCost.toFixed(
                    2
                  )}`}
                  readOnly
                  className="border-2 border-green-300 p-2.5 rounded-lg w-full bg-gradient-to-r from-green-50 to-emerald-100 text-green-700 font-extrabold"
                />
              </div>
            </div>
          </div>

          {/* ==================================================
              MATERIAL LIST
          ================================================== */}

          <div className="border border-indigo-200 rounded-2xl p-6 mb-8 bg-white/90 shadow-lg shadow-indigo-100">

            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold text-indigo-700 flex items-center gap-2">
                <span className="w-2 h-7 bg-indigo-600 rounded-full"></span>
                Material List
              </h3>
            </div>

            {materialLoading ? (
              <div className="text-center py-10 text-gray-500">
                Loading materials...
              </div>
            ) : materials.length ===
              0 ? (
              <div className="text-center py-10 text-gray-500">
                No materials available in stock.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">

                  <thead>
                    <tr className="bg-indigo-50 border-b border-indigo-200">

                      <th className="text-left p-3 font-bold whitespace-nowrap">
                        Product Name
                      </th>

                      <th className="text-left p-3 font-bold whitespace-nowrap">
                        Category
                      </th>

                      <th className="text-right p-3 font-bold whitespace-nowrap">
                        Stock
                      </th>

                      <th className="text-right p-3 font-bold whitespace-nowrap">
                        Qty
                      </th>

                      <th className="text-right p-3 font-bold whitespace-nowrap">
                        Unit Price
                      </th>

                      <th className="text-right p-3 font-bold whitespace-nowrap">
                        Total
                      </th>

                      <th className="text-center p-3 font-bold whitespace-nowrap">
                        Action
                      </th>

                    </tr>
                  </thead>

                  <tbody>
                    {materials.map(
                      (material) => {
                        const qty =
                          Number(
                            material.qty ||
                              0
                          );

                        const unitPrice =
                          Number(
                            material.unit_price ||
                              0
                          );

                        const total =
                          qty *
                          unitPrice;

                        return (
                          <tr
                            key={
                              material.id
                            }
                            className="border-b hover:bg-indigo-50/50"
                          >

                            {/* PRODUCT */}

                            <td className="p-3 font-semibold">

                              {
                                material.product_name
                              }

                              {material.is_variant && (
                                <select
                                  value={
                                    material.selected_master_id ||
                                    ""
                                  }
                                  onChange={(
                                    e
                                  ) =>
                                    handleVariantChange(
                                      material.id,
                                      e.target
                                        .value
                                    )
                                  }
                                  className="mt-2 border border-indigo-300 rounded-lg p-2 w-full bg-white font-normal"
                                >

                                  <option value="">
                                    Select
                                  </option>

                                  {material.variants.map(
                                    (
                                      variant
                                    ) => (
                                      <option
                                        key={
                                          variant.master_id
                                        }
                                        value={
                                          variant.master_id
                                        }
                                      >
                                        {
                                          variant.product_name
                                        }
                                      </option>
                                    )
                                  )}

                                </select>
                              )}

                            </td>

                            {/* CATEGORY */}

                            <td className="p-3">
                              {material.category ||
                                "-"}
                            </td>

                            {/* STOCK */}

                            <td className="p-3 text-right font-semibold">
                              {Math.max(
                                0,
                                Number(
                                  material.stock ||
                                    0
                                ) -
                                  Number(
                                    material.qty ||
                                      0
                                  )
                              )}
                            </td>

                            {/* QTY */}

                            <td className="p-3 text-right">

                              <input
                                type="number"
                                min="0"
                                max={
                                  material.stock
                                }
                                step="1"
                                disabled={
                                  material.is_variant &&
                                  !material.selected_variant
                                }
                                value={
                                  material.qty ||
                                  ""
                                }
                                onChange={(
                                  e
                                ) =>
                                  handleMaterialQtyChange(
                                    material.id,
                                    e.target
                                      .value
                                  )
                                }
                                className="border border-gray-300 rounded-lg p-2 w-24 text-right focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                              />

                            </td>

                            {/* UNIT PRICE */}

                            <td className="p-3 text-right font-semibold whitespace-nowrap">
                              ₹{" "}
                              {unitPrice.toFixed(
                                2
                              )}
                            </td>

                            {/* TOTAL */}

                            <td className="p-3 text-right font-bold text-green-700 whitespace-nowrap">
                              ₹{" "}
                              {total.toFixed(
                                2
                              )}
                            </td>

                            {/* DELETE */}

                            <td className="p-3 text-center">

                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteMaterial(
                                    material.id
                                  )
                                }
                                className="px-4 py-2 rounded-lg font-semibold bg-red-600 hover:bg-red-700 text-white"
                              >
                                Delete
                              </button>

                            </td>

                          </tr>
                        );
                      }
                    )}
                  </tbody>

                </table>
              </div>
            )}
          </div>

          {/* ==================================================
              ADDITIONAL CHARGES
          ================================================== */}

          <div className="border border-green-200 rounded-2xl p-6 mb-8 bg-white/90 shadow-lg shadow-green-100">

            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold text-green-700 flex items-center gap-2">
                <span className="w-2 h-7 bg-green-600 rounded-full"></span>
                Additional Charges
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">

              {/* AGGREGATE */}

              <div>
                <label className="block font-semibold mb-1">
                  Aggregate
                </label>

                <input
                  type="number"
                  min="0"
                  value={
                    form.aggregate_charges ||
                    ""
                  }
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,

                      aggregate_charges:
                        Number(
                          e.target.value
                        ) || 0,
                    }))
                  }
                  placeholder="₹ 0"
                  className="border border-gray-300 rounded-lg p-2.5 w-full bg-white"
                />
              </div>

              {/* BHADA */}

              <div>
                <label className="block font-semibold mb-1">
                  Bhada
                </label>

                <input
                  type="number"
                  min="0"
                  value={
                    form.bhada || ""
                  }
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,

                      bhada:
                        Number(
                          e.target.value
                        ) || 0,
                    }))
                  }
                  placeholder="₹ 0"
                  className="border border-gray-300 rounded-lg p-2.5 w-full bg-white"
                />
              </div>

              {/* CEMENT */}

              <div>
                <label className="block font-semibold mb-1">
                  Cement
                </label>

                <input
                  type="number"
                  min="0"
                  value={
                    form.cement_charges ||
                    ""
                  }
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,

                      cement_charges:
                        Number(
                          e.target.value
                        ) || 0,
                    }))
                  }
                  placeholder="₹ 0"
                  className="border border-gray-300 rounded-lg p-2.5 w-full bg-white"
                />
              </div>

              {/* INSTALLATION */}

              <div>
                <label className="block font-semibold mb-1">
                  Installation Charges
                </label>

                <input
                  type="number"
                  min="0"
                  value={
                    form.installation_charges ||
                    ""
                  }
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,

                      installation_charges:
                        Number(
                          e.target.value
                        ) || 0,
                    }))
                  }
                  placeholder="₹ 0"
                  className="border border-gray-300 rounded-lg p-2.5 w-full bg-white"
                />
              </div>

              {/* JE */}

              <div>
                <label className="block font-semibold mb-1">
                  JE
                </label>

                <input
                  type="number"
                  min="0"
                  value={
                    form.je_charges ||
                    ""
                  }
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,

                      je_charges:
                        Number(
                          e.target.value
                        ) || 0,
                    }))
                  }
                  placeholder="₹ 0"
                  className="border border-gray-300 rounded-lg p-2.5 w-full bg-white"
                />
              </div>

              {/* LOAD EXTENTION */}

              <div>
                <label className="block font-semibold mb-1">
                  Load Extention
                </label>

                <input
                  type="number"
                  min="0"
                  value={
                    form.load_extention ||
                    ""
                  }
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,

                      load_extention:
                        Number(
                          e.target.value
                        ) || 0,
                    }))
                  }
                  placeholder="₹ 0"
                  className="border border-gray-300 rounded-lg p-2.5 w-full bg-white"
                />
              </div>

              {/* METER CONNECTION */}

              <div>
                <label className="block font-semibold mb-1">
                  Meter Connection Charge
                </label>

                <input
                  type="number"
                  min="0"
                  value={
                    form.meter_connection_charge ||
                    ""
                  }
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,

                      meter_connection_charge:
                        Number(
                          e.target.value
                        ) || 0,
                    }))
                  }
                  placeholder="₹ 0"
                  className="border border-gray-300 rounded-lg p-2.5 w-full bg-white"
                />
              </div>

              {/* METER NAME CHANGE */}

              <div>
                <label className="block font-semibold mb-1">
                  Meter Name Change Charge
                </label>

                <input
                  type="number"
                  min="0"
                  value={
                    form.meter_name_change_charge ||
                    ""
                  }
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,

                      meter_name_change_charge:
                        Number(
                          e.target.value
                        ) || 0,
                    }))
                  }
                  placeholder="₹ 0"
                  className="border border-gray-300 rounded-lg p-2.5 w-full bg-white"
                />
              </div>

              {/* METER CHANGE */}

              <div>
                <label className="block font-semibold mb-1">
                  Meter Change Charge
                </label>

                <input
                  type="number"
                  min="0"
                  value={
                    form.meter_change_charge ||
                    ""
                  }
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,

                      meter_change_charge:
                        Number(
                          e.target.value
                        ) || 0,
                    }))
                  }
                  placeholder="₹ 0"
                  className="border border-gray-300 rounded-lg p-2.5 w-full bg-white"
                />
              </div>

              {/* NET METERING */}

              <div>
                <label className="block font-semibold mb-1">
                  Net Meetering
                </label>

                <input
                  type="number"
                  min="0"
                  value={
                    form.net_meetering ||
                    ""
                  }
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,

                      net_meetering:
                        Number(
                          e.target.value
                        ) || 0,
                    }))
                  }
                  placeholder="₹ 0"
                  className="border border-gray-300 rounded-lg p-2.5 w-full bg-white"
                />
              </div>

              {/* SAND */}

              <div>
                <label className="block font-semibold mb-1">
                  Sand
                </label>

                <input
                  type="number"
                  min="0"
                  value={
                    form.sand_charges ||
                    ""
                  }
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,

                      sand_charges:
                        Number(
                          e.target.value
                        ) || 0,
                    }))
                  }
                  placeholder="₹ 0"
                  className="border border-gray-300 rounded-lg p-2.5 w-full bg-white"
                />
              </div>

              {/* VENDOR */}

              <div>
                <label className="block font-semibold mb-1">
                  Vendor Charges
                </label>

                <input
                  type="number"
                  min="0"
                  value={
                    form.vendor_charges ||
                    ""
                  }
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,

                      vendor_charges:
                        Number(
                          e.target.value
                        ) || 0,
                    }))
                  }
                  placeholder="₹ 0"
                  className="border border-gray-300 rounded-lg p-2.5 w-full bg-white"
                />
              </div>

            </div>

            {/* ==================================================
                PANEL / INVERTER SERIAL NUMBERS
            ================================================== */}

            {serialRowCount > 0 && (
              <div className="mt-8">

                <div className="bg-purple-100 border border-purple-200 rounded-t-xl px-5 py-3">
                  <h3 className="text-lg font-bold text-purple-900">
                    Panel / Inverter Serial Numbers
                  </h3>
                </div>

                <div className="border border-gray-200 border-t-0 rounded-b-xl overflow-hidden">

                  <div className="overflow-x-auto">

                    <table className="w-full text-sm">

                      <thead className="bg-gray-100">

                        <tr>

                          <th className="border-b border-gray-200 px-4 py-3 text-left whitespace-nowrap">
                            Panel Company
                          </th>

                          <th className="border-b border-gray-200 px-4 py-3 text-left whitespace-nowrap">
                            Panel Serial Number
                          </th>

                          <th className="border-b border-gray-200 px-4 py-3 text-left whitespace-nowrap">
                            Inverter Company
                          </th>

                          <th className="border-b border-gray-200 px-4 py-3 text-left whitespace-nowrap">
                            Model
                          </th>

                          <th className="border-b border-gray-200 px-4 py-3 text-left whitespace-nowrap">
                            Inverter Serial Number
                          </th>

                        </tr>

                      </thead>

                      <tbody>

                        {Array.from({
                          length:
                            serialRowCount,
                        }).map(
                          (_, index) => {

                            const showPanel =
                              index <
                              panelQty;

                            const showInverter =
                              index <
                              inverterQty;

                            return (
                              <tr
                                key={
                                  index
                                }
                                className="border-b border-gray-100 last:border-b-0 hover:bg-purple-50/40"
                              >

                                {/* ==================================================
                                    PANEL COMPANY
                                ================================================== */}

                                <td className="px-4 py-3 font-semibold text-gray-700">
                                  {showPanel
                                    ? panelMaterial?.company ||
                                      ""
                                    : ""}
                                </td>

                                {/* ==================================================
                                    PANEL SERIAL NUMBER
                                ================================================== */}

                                <td className="px-4 py-3">

                                  {showPanel ? (
                                    <input
                                      type="text"
                                      value={
                                        serialNumbers
                                          .panel[
                                          index
                                        ] ||
                                        ""
                                      }
                                      onChange={(
                                        e
                                      ) =>
                                        handleSerialNumberChange(
                                          "panel",
                                          index,
                                          e
                                            .target
                                            .value
                                        )
                                      }
                                      placeholder={`Panel Serial ${
                                        index +
                                        1
                                      }`}
                                      className="border border-gray-300 rounded-lg p-2.5 w-full min-w-[220px] bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
                                    />
                                  ) : (
                                    ""
                                  )}

                                </td>

                                {/* ==================================================
                                    INVERTER COMPANY
                                ================================================== */}

                                <td className="px-4 py-3 font-semibold text-gray-700">
                                  {showInverter
                                    ? inverterMaterial?.company ||
                                      ""
                                    : ""}
                                </td>

                                {/* ==================================================
                                    MANUAL INVERTER MODEL
                                ================================================== */}

                                <td className="px-4 py-3">

                                  {showInverter ? (
                                    <input
                                      type="text"
                                      value={
                                        inverterModels[
                                          index
                                        ] ||
                                        ""
                                      }
                                      onChange={(
                                        e
                                      ) =>
                                        handleInverterModelChange(
                                          index,
                                          e
                                            .target
                                            .value
                                        )
                                      }
                                      placeholder={`Inverter Model ${
                                        index +
                                        1
                                      }`}
                                      className="border border-gray-300 rounded-lg p-2.5 w-full min-w-[220px] bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
                                    />
                                  ) : (
                                    ""
                                  )}

                                </td>

                                {/* ==================================================
                                    INVERTER SERIAL NUMBER
                                ================================================== */}

                                <td className="px-4 py-3">

                                  {showInverter ? (
                                    <input
                                      type="text"
                                      value={
                                        serialNumbers
                                          .inverter[
                                          index
                                        ] ||
                                        ""
                                      }
                                      onChange={(
                                        e
                                      ) =>
                                        handleSerialNumberChange(
                                          "inverter",
                                          index,
                                          e
                                            .target
                                            .value
                                        )
                                      }
                                      placeholder={`Inverter Serial ${
                                        index +
                                        1
                                      }`}
                                      className="border border-gray-300 rounded-lg p-2.5 w-full min-w-[220px] bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
                                    />
                                  ) : (
                                    ""
                                  )}

                                </td>

                              </tr>
                            );
                          }
                        )}

                      </tbody>

                    </table>

                  </div>

                </div>
              </div>
            )}

            {/* ==================================================
                TOTAL SUMMARY
            ================================================== */}

            <div className="mt-8 flex justify-end">

              <div className="w-full md:w-[420px] border-2 border-indigo-200 rounded-xl bg-white shadow-lg overflow-hidden">

                <div className="bg-indigo-50 px-4 py-3 border-b border-indigo-200">
                  <h3 className="text-lg font-extrabold text-indigo-700">
                    Total Summary
                  </h3>
                </div>

                <table className="w-full">

                  <tbody>

                    {/* MATERIAL COST */}

                    <tr className="border-b border-gray-200">

                      <td className="px-4 py-2.5 text-sm font-semibold text-gray-600">
                        Material Cost
                      </td>

                      <td className="px-4 py-2.5 text-right text-sm font-bold text-blue-700">
                        ₹{" "}
                        {liveMaterialCost.toFixed(
                          2
                        )}
                      </td>

                    </tr>

                    {/* ADDITIONAL CHARGES */}

                    <tr className="border-b border-gray-200">

                      <td className="px-4 py-2.5 text-sm font-semibold text-gray-600">
                        Additional Charges
                      </td>

                      <td className="px-4 py-2.5 text-right text-sm font-bold text-orange-600">
                        ₹{" "}
                        {liveAdditionalCharges.toFixed(
                          2
                        )}
                      </td>

                    </tr>

                    {/* TOTAL PLANT COST */}

                    <tr className="bg-green-50">

                      <td className="px-4 py-3 text-sm font-extrabold text-green-800">
                        Total Plant Cost
                      </td>

                      <td className="px-4 py-3 text-right text-lg font-extrabold text-green-700">
                        ₹{" "}
                        {liveTotalPlantCost.toFixed(
                          2
                        )}
                      </td>

                    </tr>

                  </tbody>

                </table>

              </div>
            </div>

            {/* ==================================================
                SAVE BUTTON
            ================================================== */}

            <div className="flex justify-end gap-4 mt-8 pb-8">

              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-6 py-3 rounded-xl bg-gray-500 hover:bg-gray-600 text-white font-bold shadow-lg disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={loading}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? "Saving..."
                  : item
                  ? "Update Material Consumption"
                  : "Save Material Consumption"}
              </button>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
}