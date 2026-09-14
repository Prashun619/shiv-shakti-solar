import { supabase } from "./supabase";

// =====================================================
// HELPERS
// =====================================================

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function cleanText(value) {
  return value == null ? "" : String(value).trim();
}

// =====================================================
// GET PRODUCT UNIT
// =====================================================

function getProductUnit(product) {
  const name = cleanText(
    product?.product_name
  ).toLowerCase();

  // Leg 10ft is always Nos
  if (name === "leg 10ft") {
    return "Nos";
  }

  const unit = cleanText(
    product?.unit
  ).toLowerCase();

  if (
    unit === "kg" ||
    unit === "kgs"
  ) {
    return "Kg";
  }

  return "Nos";
}

// =====================================================
// PRODUCT KEY
// =====================================================

function getProductKey(product) {
  const category = cleanText(
    product?.category
  ).toLowerCase();

  // ---------------------------------------------------
  // PANEL / INVERTER
  // ---------------------------------------------------

  if (
    category === "panel" ||
    category === "inverter"
  ) {
    return [
      category,
      cleanText(product?.company),
      cleanText(product?.specification),
    ]
      .join("|")
      .toLowerCase();
  }

  // ---------------------------------------------------
  // NORMAL PRODUCTS / KIT
  // ---------------------------------------------------

  return [
    cleanText(product?.product_name),
    cleanText(product?.company),
    cleanText(product?.specification),
  ]
    .join("|")
    .toLowerCase();
}

// =====================================================
// PRODUCT CONSUMPTION QUANTITY
// =====================================================

function getConsumptionQuantity(product) {
  const unit = getProductUnit(product);

  if (unit === "Kg") {
    return num(product?.total_weight);
  }

  return num(product?.quantity);
}

// =====================================================
// KIT HELPERS
// =====================================================

function isKitProduct(product) {
  return (
    product?.is_kit === true ||
    cleanText(
      product?.category
    ).toLowerCase() === "kit"
  );
}

function isKitReplacementInverter(product) {
  return (
    product?.is_kit_inverter === true &&
    cleanText(
      product?.category
    ).toLowerCase() === "inverter"
  );
}

// =====================================================
// PURCHASED QUANTITY
// =====================================================

function getPurchasedQuantity(row) {
  const purchased = num(
    row?.purchased_quantity
  );

  if (purchased > 0) {
    return purchased;
  }

  return num(row?.quantity);
}

function getInventoryUnitCost(row) {
  if (!row) {
    return 0;
  }

  /*
   * ===================================================
   * IMPORTANT
   * ===================================================
   *
   * Inventory View displays:
   *
   *   item.unit_cost
   *
   * Therefore Material Consumption MUST use the exact
   * same value stored in inventory.unit_cost.
   *
   * DO NOT recalculate:
   *
   * price + GST + transportation
   *
   * here.
   *
   * Example:
   *
   * Inventory Row 1
   * Qty        = 10
   * Unit Cost  = ₹1
   *
   * Inventory Row 2
   * Qty        = 10
   * Unit Cost  = ₹2
   *
   * Customer consumes 12:
   *
   * 10 × ₹1 = ₹10
   *  2 × ₹2 = ₹4
   *
   * Total = ₹14
   */

  return num(row.unit_cost);
}


// =====================================================
// RESOLVE MATERIAL CONSUMPTION UNIT COSTS
//
// IMPORTANT:
// - Inventory.unit_cost is the source of truth.
// - Existing fifo_allocations are respected.
// - Older records without fifo_allocations are
//   reconstructed in FIFO order.
// - Saved product.unit_price is only used as the
//   final fallback when no inventory row exists.
// =====================================================

function enrichConsumptionRowsWithInventoryCost(
  rows,
  inventoryRows
) {
  if (
    !Array.isArray(rows) ||
    !Array.isArray(inventoryRows)
  ) {
    return rows || [];
  }

  // ---------------------------------------------------
  // INVENTORY LOOKUP
  // ---------------------------------------------------

  const inventoryById = new Map();

  inventoryRows.forEach((row) => {
    if (row?.id != null) {
      inventoryById.set(
        String(row.id),
        row
      );
    }
  });

  // ---------------------------------------------------
  // INVENTORY IS ALREADY FIFO ORDERED
  // oldest date -> newest date
  // ---------------------------------------------------

  const sortedInventory = [
    ...inventoryRows,
  ].sort((a, b) => {
    const dateA = new Date(
      a?.date || 0
    ).getTime();

    const dateB = new Date(
      b?.date || 0
    ).getTime();

    if (dateA !== dateB) {
      return dateA - dateB;
    }

    return (
      Number(a?.id || 0) -
      Number(b?.id || 0)
    );
  });

  // ---------------------------------------------------
  // MATERIAL CONSUMPTION ORDER
  //
  // Oldest consumption first.
  // ---------------------------------------------------

  const sortedRows = [
    ...rows,
  ].sort((a, b) => {
    const dateA = new Date(
      a?.created_at ||
        a?.date ||
        0
    ).getTime();

    const dateB = new Date(
      b?.created_at ||
        b?.date ||
        0
    ).getTime();

    if (dateA !== dateB) {
      return dateA - dateB;
    }

    return (
      Number(a?.id || 0) -
      Number(b?.id || 0)
    );
  });

  // ---------------------------------------------------
  // HOW MUCH OF EACH INVENTORY BATCH HAS ALREADY
  // BEEN CONSUMED
  // ---------------------------------------------------

  const usedInventoryMap =
    new Map();

  function getUsedQuantity(
    inventoryId
  ) {
    return Number(
      usedInventoryMap.get(
        String(inventoryId)
      ) || 0
    );
  }

  function addUsedQuantity(
    inventoryId,
    quantity
  ) {
    const key = String(
      inventoryId
    );

    usedInventoryMap.set(
      key,
      getUsedQuantity(
        inventoryId
      ) + Number(quantity || 0)
    );
  }

  // ---------------------------------------------------
  // CALCULATE COST FOR ONE INVENTORY ROW
  // ---------------------------------------------------

  function getInventoryCostPerUnit(
    row
  ) {
    if (!row) {
      return 0;
    }

    const productName =
      cleanText(
        row.product_name
      ).toLowerCase();

    // -------------------------------------------------
    // LEG 10FT
    //
    // Existing FIFO logic treats this as Nos while
    // inventory price is based on Kg.
    // -------------------------------------------------

    if (
      productName ===
      "leg 10ft"
    ) {
      const purchasedQuantity =
        getPurchasedQuantity(
          row
        );

      const totalWeight =
        num(
          row.total_weight
        );

      const pricePerKg =
        num(
          row.price ||
            row.unit_cost
        );

      const weightPerPiece =
        purchasedQuantity > 0
          ? totalWeight /
            purchasedQuantity
          : 0;

      return (
        weightPerPiece *
        pricePerKg
      );
    }

    // -------------------------------------------------
    // NORMAL PRODUCTS
    //
    // INVENTORY VIEW UNIT COST
    // -------------------------------------------------

    const unitCost =
      num(
        row.unit_cost
      );

    if (unitCost > 0) {
      return unitCost;
    }

    // Very old inventory fallback
    return num(
      row.price
    );
  }

  // ---------------------------------------------------
  // PROCESS EACH CONSUMPTION RECORD
  // ---------------------------------------------------

  return sortedRows.map(
    (record) => {
      const products =
        Array.isArray(
          record.products
        )
          ? record.products
          : [];

      const enrichedProducts =
        products.map(
          (product) => {
            const existingAllocations =
              Array.isArray(
                product.fifo_allocations
              )
                ? product.fifo_allocations
                : [];

            // =========================================
            // CASE 1:
            // FIFO ALLOCATIONS ALREADY EXIST
            // =========================================

            if (
              existingAllocations.length >
              0
            ) {
              let weightedTotal = 0;
              let weightedQuantity = 0;

              existingAllocations.forEach(
                (allocation) => {
                  const inventoryRow =
                    inventoryById.get(
                      String(
                        allocation.inventory_id
                      )
                    );

                  const quantity =
                    num(
                      allocation.quantity
                    );

                  if (
                    quantity <= 0
                  ) {
                    return;
                  }

                  const unitCost =
                    inventoryRow
                      ? getInventoryCostPerUnit(
                          inventoryRow
                        )
                      : num(
                          allocation.unit_cost ||
                            allocation.unit_price
                        );

                  weightedTotal +=
                    quantity *
                    unitCost;

                  weightedQuantity +=
                    quantity;

                  // Keep FIFO consumption map
                  // synchronized.
                  if (
                    inventoryRow?.id !=
                    null
                  ) {
                    addUsedQuantity(
                      inventoryRow.id,
                      quantity
                    );
                  }
                }
              );

              const resolvedUnitPrice =
                weightedQuantity >
                0
                  ? weightedTotal /
                    weightedQuantity
                  : num(
                      product.unit_price
                    );

              return {
                ...product,
                unit_price:
                  resolvedUnitPrice,
              };
            }

            // =========================================
            // CASE 2:
            // OLD RECORD WITHOUT FIFO ALLOCATIONS
            //
            // Reconstruct FIFO from Inventory.
            // =========================================

            const requiredQuantity =
              getConsumptionQuantity(
                product
              );

            if (
              requiredQuantity <=
              0
            ) {
              return {
                ...product,
                unit_price:
                  num(
                    product.unit_price
                  ),
              };
            }

            const productKey =
              getProductKey(
                product
              );

            let remaining =
              requiredQuantity;

            let weightedTotal =
              0;

            let weightedQuantity =
              0;

            for (
              const inventoryRow of sortedInventory
            ) {
              if (
                remaining <=
                0
              ) {
                break;
              }

              if (
                getProductKey(
                  inventoryRow
                ) !==
                productKey
              ) {
                continue;
              }

              const purchasedQuantity =
                getPurchasedQuantity(
                  inventoryRow
                );

              const alreadyUsed =
                getUsedQuantity(
                  inventoryRow.id
                );

              const available =
                Math.max(
                  purchasedQuantity -
                    alreadyUsed,
                  0
                );

              if (
                available <=
                0
              ) {
                continue;
              }

              const allocate =
                Math.min(
                  available,
                  remaining
                );

              const unitCost =
                getInventoryCostPerUnit(
                  inventoryRow
                );

              weightedTotal +=
                allocate *
                unitCost;

              weightedQuantity +=
                allocate;

              addUsedQuantity(
                inventoryRow.id,
                allocate
              );

              remaining -=
                allocate;
            }

            // =========================================
            // RESOLVED INVENTORY COST
            // =========================================

            if (
              weightedQuantity >
              0
            ) {
              return {
                ...product,
                unit_price:
                  weightedTotal /
                  weightedQuantity,
              };
            }

            // =========================================
            // FINAL FALLBACK
            // =========================================

            return {
              ...product,
              unit_price:
                num(
                  product.unit_price
                ),
            };
          }
        );

      return {
        ...record,
        products:
          enrichedProducts,
      };
    }
  );
}


// =====================================================
// GET USED INVENTORY
// =====================================================

export async function getUsedInventory() {
  const { data, error } =
    await supabase
      .from("used_inventory")
      .select(`
        *,
        customers!customer_id(
          id,
          customer_name
        )
      `);

  if (error) {
    throw error;
  }

  const rows =
    data || [];

  // ---------------------------------------------------
  // LOAD INVENTORY UNIT COSTS
  // ---------------------------------------------------

  const inventoryRows =
    await getInventoryRows();

  // ---------------------------------------------------
  // IMPORTANT:
  // Replace old saved product.unit_price values with
  // the actual Inventory.unit_cost / FIFO cost.
  // ---------------------------------------------------

  const enrichedRows =
    enrichConsumptionRowsWithInventoryCost(
      rows,
      inventoryRows
    );

  // ---------------------------------------------------
  // KEEP EXISTING CUSTOMER ORDER
  // ---------------------------------------------------

  return enrichedRows.sort(
    (a, b) =>
      Number(
        a.customers?.id || 0
      ) -
      Number(
        b.customers?.id || 0
      )
  );
}


// =====================================================
// GET SINGLE USED INVENTORY
// =====================================================

export async function getUsedInventoryById(
  id
) {
  if (!id) {
    throw new Error(
      "Material consumption ID is required."
    );
  }

  // ---------------------------------------------------
  // GET ALL CONSUMPTION RECORDS
  //
  // We need the complete history so old records
  // without fifo_allocations can be reconstructed.
  // ---------------------------------------------------

  const {
    data: consumptionRows,
    error: consumptionError,
  } = await supabase
    .from("used_inventory")
    .select("*");

  if (consumptionError) {
    throw consumptionError;
  }

  const inventoryRows =
    await getInventoryRows();

  const enrichedRows =
    enrichConsumptionRowsWithInventoryCost(
      consumptionRows || [],
      inventoryRows
    );

  const record =
    enrichedRows.find(
      (row) =>
        String(row.id) ===
        String(id)
    );

  if (!record) {
    throw new Error(
      "Material consumption record not found."
    );
  }

  return record;
}

// =====================================================
// GET ALL INVENTORY
// =====================================================

async function getInventoryRows() {
  const { data, error } =
    await supabase
      .from("inventory")
      .select(`
        id,
        product_name,
        company,
        specification,
        category,
        quantity,
        purchased_quantity,
        used_quantity,
        unit,
        total_weight,
        price,
        unit_cost,
        gst,
        transportation,
        date,
        active,
        purchase_type,
        batch_id
      `)
      .order("date", {
        ascending: true,
      })
      .order("id", {
        ascending: true,
      });

  if (error) {
    throw error;
  }

  return data || [];
}

// =====================================================
// GET ALL CONSUMPTIONS
// =====================================================

async function getConsumptionRows() {
  const { data, error } =
    await supabase
      .from("used_inventory")
      .select(`
        id,
        products
      `);

  if (error) {
    throw error;
  }

  return data || [];
}

// =====================================================
// BUILD FIFO USED MAP
// =====================================================

function buildFIFOUsedMap(
  records,
  excludeId = null
) {
  const usedMap = new Map();

  for (const record of records || []) {
    if (
      excludeId &&
      String(record.id) ===
        String(excludeId)
    ) {
      continue;
    }

    const products =
      Array.isArray(record.products)
        ? record.products
        : [];

    for (const product of products) {
      const allocations =
        Array.isArray(
          product?.fifo_allocations
        )
          ? product.fifo_allocations
          : [];

      for (const allocation of allocations) {
        const inventoryId =
          allocation?.inventory_id;

        const quantity =
          num(
            allocation?.quantity
          );

        if (
          !inventoryId ||
          quantity <= 0
        ) {
          continue;
        }

        const key =
          String(inventoryId);

        usedMap.set(
          key,
          num(
            usedMap.get(key)
          ) + quantity
        );
      }
    }
  }

  return usedMap;
}

// =====================================================
// BUILD CONSUMED PRODUCT MAP
// =====================================================

function buildConsumedMap(
  records,
  excludeId = null
) {
  const map = new Map();

  for (const record of records || []) {
    if (
      excludeId &&
      String(record.id) ===
        String(excludeId)
    ) {
      continue;
    }

    const products =
      Array.isArray(record.products)
        ? record.products
        : [];

    for (const product of products) {
      const key =
        getProductKey(product);

      const qty =
        getConsumptionQuantity(
          product
        );

      if (!key || qty <= 0) {
        continue;
      }

      map.set(
        key,
        num(map.get(key)) + qty
      );
    }
  }

  return map;
}

// =====================================================
// BUILD FIFO INVENTORY ROWS
// =====================================================

function prepareInventoryRows(
  inventoryRows,
  usedMap
) {
  return inventoryRows.map(
    (row) => {
      const purchased =
        getPurchasedQuantity(row);

      const used =
        num(
          usedMap.get(
            String(row.id)
          )
        );

      const rowUnitCost =
        getInventoryUnitCost(row);

      return {
        ...row,

        purchased_quantity_live:
          purchased,

        used_quantity_live:
          used,

        remaining_quantity:
          Math.max(
            purchased - used,
            0
          ),

        unit:
          getProductUnit(row),

        /*
         * IMPORTANT:
         *
         * This is THIS FIFO ROW'S price.
         *
         * It is NOT the latest purchase price.
         */
        fifo_unit_cost:
          rowUnitCost,

        latest_unit_cost:
          rowUnitCost,
      };
    }
  );
}

// =====================================================
// COST PER UNIT
// =====================================================

function getCostPerUnit(row) {
  return getInventoryUnitCost(row);
}

// =====================================================
// LIVE STOCK
// =====================================================

export async function getLiveInventoryStock(
  excludeConsumptionId = null
) {
  const inventoryRows =
    await getInventoryRows();

  const consumptionRows =
    await getConsumptionRows();

  const actualUsedMap =
    buildFIFOUsedMap(
      consumptionRows,
      excludeConsumptionId
    );

  const rows =
    prepareInventoryRows(
      inventoryRows,
      actualUsedMap
    );

  const grouped = new Map();

  for (const row of rows) {
    const key =
      getProductKey(row);

    if (!key) {
      continue;
    }

    const unit =
      getProductUnit(row);

    const purchasedQuantity =
      getPurchasedQuantity(row);

    const usedQuantity =
      num(
        actualUsedMap.get(
          String(row.id)
        )
      );

    const existing =
      grouped.get(key);

    if (existing) {
      existing.purchased_quantity +=
        purchasedQuantity;

      existing.used_quantity +=
        usedQuantity;

      existing.total_weight +=
        num(row.total_weight);

      /*
       * Keep the latest row cost only for the
       * stock display.
       *
       * FIFO costing itself does NOT use this value.
       */
      existing.unit_cost =
        getInventoryUnitCost(row);

      existing.latest_unit_cost =
        getInventoryUnitCost(row);

      existing.inventory_rows.push(
        row
      );
    } else {
      grouped.set(key, {
        key,

        product_name:
          cleanText(
            row.product_name
          ),

        company:
          cleanText(
            row.company
          ),

        specification:
          cleanText(
            row.specification
          ),

        category:
          cleanText(
            row.category
          ),

        unit,

        purchased_quantity:
          purchasedQuantity,

        used_quantity:
          usedQuantity,

        total_weight:
          num(
            row.total_weight
          ),

        unit_cost:
          getInventoryUnitCost(row),

        latest_unit_cost:
          getInventoryUnitCost(row),

        inventory_rows: [
          row,
        ],
      });
    }
  }

  const result = [];

  for (const item of grouped.values()) {
    const availableQuantity =
      Math.max(
        0,
        item.purchased_quantity -
          item.used_quantity
      );

    result.push({
      ...item,

      consumed_quantity:
        item.used_quantity,

      available_quantity:
        availableQuantity,

      available_stock:
        availableQuantity,

      editing_quantity:
        0,
    });
  }

  return result.sort(
    (a, b) =>
      a.product_name.localeCompare(
        b.product_name,
        undefined,
        {
          sensitivity: "base",
        }
      )
  );
}

// =====================================================
// GET LIVE STOCK FOR ONE PRODUCT
// =====================================================

export async function getLiveStockForProduct(
  product,
  excludeConsumptionId = null
) {
  const stock =
    await getLiveInventoryStock(
      excludeConsumptionId
    );

  const key =
    getProductKey(product);

  return (
    stock.find(
      (item) =>
        item.key === key
    ) || {
      key,

      product_name:
        product?.product_name || "",

      company:
        product?.company || "",

      specification:
        product?.specification || "",

      category:
        product?.category || "",

      unit:
        getProductUnit(product),

      purchased_quantity:
        0,

      consumed_quantity:
        0,

      available_quantity:
        0,

      available_stock:
        0,

      unit_cost:
        0,

      latest_unit_cost:
        0,

      inventory_rows: [],
    }
  );
}

// =====================================================
// VALIDATE PRODUCT
// =====================================================

function validateProduct(product) {
  const name =
    cleanText(
      product?.product_name
    );

  if (!name) {
    throw new Error(
      "Product name is required."
    );
  }

  const unit =
    getProductUnit(product);

  const qty =
    getConsumptionQuantity(
      product
    );

  return {
    ...product,

    product_name:
      name,

    unit,

    quantity:
      unit === "Nos"
        ? Math.max(qty, 0)
        : 0,

    total_weight:
      unit === "Kg"
        ? Math.max(qty, 0)
        : num(
            product?.total_weight
          ),
  };
}

// =====================================================
// VALIDATE LIVE STOCK
// =====================================================

async function validateLiveStock(
  products,
  excludeConsumptionId = null
) {
  const stock =
    await getLiveInventoryStock(
      excludeConsumptionId
    );

  const stockMap =
    new Map(
      stock.map(
        (item) => [
          item.key,
          item,
        ]
      )
    );

  const validatedProducts =
    [];

  const requestedMap =
    new Map();

  for (const product of products || []) {
    const validated =
      validateProduct(
        product
      );

    validatedProducts.push(
      validated
    );

    const required =
      getConsumptionQuantity(
        validated
      );

    if (required <= 0) {
      continue;
    }

    const key =
      getProductKey(
        validated
      );

    requestedMap.set(
      key,
      num(
        requestedMap.get(key)
      ) + required
    );
  }

  for (
    const [
      key,
      required,
    ] of requestedMap.entries()
  ) {
    const stockItem =
      stockMap.get(key);

    const available =
      num(
        stockItem?.available_quantity
      );

    if (
      required >
      available
    ) {
      const product =
        validatedProducts.find(
          (item) =>
            getProductKey(item) ===
            key
        );

      const unit =
        getProductUnit(product);

      throw new Error(
        `${product.product_name} has only ${available} ${unit} available. You are trying to use ${required} ${unit}.`
      );
    }
  }

  return validatedProducts;
}

// =====================================================
// FIND FIFO INVENTORY ROWS
// =====================================================

function getMatchingFIFORows(
  rows,
  product
) {
  const key =
    getProductKey(product);

  return rows.filter(
    (row) =>
      getProductKey(row) === key &&
      num(
        row.remaining_quantity
      ) > 0
  );
}

// =====================================================
// FIFO ALLOCATION
// =====================================================

function allocateFIFO(
  rows,
  product,
  required
) {
  let remaining =
    num(required);

  let total = 0;

  const allocations = [];

  if (remaining <= 0) {
    return {
      total: 0,
      allocations: [],
      unit_price: 0,
      unit_cost: 0,
    };
  }

  const matchingRows =
    getMatchingFIFORows(
      rows,
      product
    );

  /*
   * ===================================================
   * FIFO PRICING
   * ===================================================
   *
   * FIFO determines:
   *
   * 1. Which inventory row is consumed
   * 2. The price applicable to that quantity
   *
   * Example:
   *
   * Entry 1:
   * Qty = 10
   * Unit Cost = ₹1
   *
   * Entry 2:
   * Qty = 10
   * Unit Cost = ₹2
   *
   * Consumption = 12
   *
   * Entry 1:
   * 10 × ₹1 = ₹10
   *
   * Entry 2:
   * 2 × ₹2 = ₹4
   *
   * TOTAL = ₹14
   */

  let weightedQuantity = 0;

  for (const row of matchingRows) {
    if (remaining <= 0) {
      break;
    }

    const available =
      num(
        row.remaining_quantity
      );

    if (available <= 0) {
      continue;
    }

    const allocate =
      Math.min(
        available,
        remaining
      );

    /*
     * CRITICAL:
     *
     * Get price from THIS FIFO inventory row.
     *
     * DO NOT use the latest inventory price here.
     */
    const unitCost =
      getCostPerUnit(row);

    const allocationTotal =
      allocate * unitCost;

    allocations.push({
      inventory_id:
        row.id,

      quantity:
        allocate,

      unit_cost:
        unitCost,

      unit_price:
        unitCost,

      total:
        allocationTotal,
    });

    total +=
      allocationTotal;

    weightedQuantity +=
      allocate;

    /*
     * Deduct stock from THIS FIFO row.
     */
    row.remaining_quantity -=
      allocate;

    remaining -=
      allocate;
  }

  if (remaining > 0) {
    throw new Error(
      `${product.product_name} does not have enough live stock.`
    );
  }

  /*
   * Material Consumption has one Unit Price field.
   *
   * When multiple FIFO prices are involved,
   * show/store the weighted average.
   *
   * Example:
   *
   * ₹14 / 12 = ₹1.166666...
   */
  const weightedAveragePrice =
    weightedQuantity > 0
      ? total / weightedQuantity
      : 0;

  return {
    total,

    allocations,

    unit_price:
      weightedAveragePrice,

    unit_cost:
      weightedAveragePrice,
  };
}

// =====================================================
// FIND ORIGINAL KIT INVERTER
// =====================================================

function getOriginalKitInverter(
  product
) {
  return cleanText(
    product?.original_kit_inverter ||
      product?.kit_inverter_brand ||
      ""
  );
}

// =====================================================
// SAVED ORIGINAL INVERTER COST
// =====================================================

function getSavedOriginalInverterCost(
  product
) {
  const values = [
    product?.original_kit_inverter_cost,
    product?.kit_inverter_cost,
    product?.inverter_cost,
  ];

  for (const value of values) {
    const cost = num(value);

    if (cost > 0) {
      return cost;
    }
  }

  return 0;
}

// =====================================================
// ORIGINAL KIT INVERTER COST
// =====================================================

function calculateOriginalInverterCost(
  rows,
  kitProduct,
  quantity
) {
  const originalBrand =
    getOriginalKitInverter(
      kitProduct
    );

  if (!originalBrand) {
    return {
      cost:
        getSavedOriginalInverterCost(
          kitProduct
        ) * num(quantity),

      allocations: [],
    };
  }

  /*
   * Find the latest matching original inverter
   * purchase price.
   *
   * The original inverter is part of the kit and is
   * not separately consumed from inventory here.
   */

  let latestOriginalInverterPrice =
    0;

  for (const row of rows) {
    const category =
      cleanText(
        row?.category
      ).toLowerCase();

    const company =
      cleanText(
        row?.company
      ).toLowerCase();

    if (
      category !== "inverter" ||
      company !==
        originalBrand.toLowerCase()
    ) {
      continue;
    }

    const rowPrice =
      getInventoryUnitCost(row);

    if (rowPrice > 0) {
      latestOriginalInverterPrice =
        rowPrice;
    }
  }

  if (
    latestOriginalInverterPrice > 0
  ) {
    return {
      cost:
        latestOriginalInverterPrice *
        num(quantity),

      allocations: [],
    };
  }

  return {
    cost:
      getSavedOriginalInverterCost(
        kitProduct
      ) * num(quantity),

    allocations: [],
  };
}

// =====================================================
// REPLACEMENT INVERTER FIFO
// =====================================================

function calculateReplacementInverterFIFO(
  rows,
  replacementProduct,
  quantity
) {
  return allocateFIFO(
    rows,
    replacementProduct,
    quantity
  );
}

// =====================================================
// FIFO COST CALCULATION
// =====================================================

async function calculateFIFOCost(
  products,
  excludeConsumptionId = null
) {
  const inventoryRows =
    await getInventoryRows();

  const consumptionRows =
    await getConsumptionRows();

  const usedMap =
    buildFIFOUsedMap(
      consumptionRows,
      excludeConsumptionId
    );

  /*
   * IMPORTANT:
   *
   * Inventory rows remain in oldest -> newest order.
   *
   * This order is what makes FIFO work.
   */
  const rows =
    prepareInventoryRows(
      inventoryRows,
      usedMap
    );

  const outputProducts =
    products.map(
      (product) => ({
        ...product,

        fifo_allocations: [],

        total: 0,

        unit_price: 0,

        unit_cost: 0,

        original_kit_inverter_cost:
          getSavedOriginalInverterCost(
            product
          ),
      })
    );

  // ===================================================
  // FIRST PASS
  // FIFO FOR EVERY REAL INVENTORY PRODUCT
  // ===================================================

  for (
    let index = 0;
    index <
    outputProducts.length;
    index++
  ) {
    const product =
      outputProducts[index];

    const required =
      getConsumptionQuantity(
        product
      );

    if (required <= 0) {
      continue;
    }

    const result =
      calculateReplacementInverterFIFO(
        rows,
        product,
        required
      );

    product.fifo_allocations =
      result.allocations;

    product.total =
      result.total;

    /*
     * If consumption uses multiple FIFO batches,
     * this is their weighted average.
     */
    product.unit_price =
      result.unit_price;

    product.unit_cost =
      result.unit_price;
  }

  // ===================================================
  // KIT PRICE ADJUSTMENT
  // ===================================================

  for (
    let index = 0;
    index <
    outputProducts.length;
    index++
  ) {
    const kit =
      outputProducts[index];

    if (
      !isKitProduct(kit)
    ) {
      continue;
    }

    const quantity =
      num(kit.quantity);

    if (quantity <= 0) {
      continue;
    }

    /*
     * No inverter swap.
     */
    if (
      kit.has_inverter_swap !== true
    ) {
      continue;
    }

    // -------------------------------------------------
    // ORIGINAL INVERTER
    // -------------------------------------------------

    const originalResult =
      calculateOriginalInverterCost(
        rows,
        kit,
        quantity
      );

    const originalCost =
      num(
        originalResult.cost
      );

    // -------------------------------------------------
    // REPLACEMENT INVERTER
    // -------------------------------------------------

    const replacementIndex =
      outputProducts.findIndex(
        (
          product,
          productIndex
        ) =>
          productIndex !== index &&
          isKitReplacementInverter(
            product
          ) &&
          Number(
            product.kit_parent_index
          ) === index
      );

    let replacementCost = 0;

    if (
      replacementIndex >= 0
    ) {
      const replacement =
        outputProducts[
          replacementIndex
        ];

      /*
       * Replacement inverter already went through
       * FIFO costing above.
       */
      replacementCost =
        num(
          replacement.total
        );

      replacement.replacement_inverter_cost =
        replacement.quantity > 0
          ? replacement.total /
            replacement.quantity
          : 0;

      replacement.unit_price =
        replacement.replacement_inverter_cost;

      replacement.unit_cost =
        replacement.replacement_inverter_cost;
    }

    // -------------------------------------------------
    // ADJUST KIT
    // -------------------------------------------------

    const originalKitCost =
      num(kit.total);

    const adjustedKitCost =
      Math.max(
        0,
        originalKitCost -
          originalCost
      );

    kit.kit_original_inverter_deduction =
      originalCost;

    kit.kit_adjusted_total =
      adjustedKitCost;

    kit.original_kit_inverter_cost =
      quantity > 0
        ? originalCost /
          quantity
        : originalCost;

    kit.total =
      adjustedKitCost;

    kit.kit_original_inverter_cost_total =
      originalCost;

    kit.kit_replacement_inverter_cost_total =
      replacementCost;

    kit.kit_final_cost =
      adjustedKitCost +
      replacementCost;
  }

  return outputProducts;
}

// =====================================================
// ADDITIONAL CHARGES
// =====================================================

function getAggregateCharges(form) {
  const directAggregate =
    form?.aggregate_charges;

  const oldGitti =
    form?.gitti_charges;

  if (
    directAggregate !==
      undefined &&
    directAggregate !== null &&
    String(
      directAggregate
    ).trim() !== ""
  ) {
    return num(
      directAggregate
    );
  }

  return num(oldGitti);
}

function getBhadaCharges(form) {
  return num(
    form?.bhada_charges
  );
}

function getCementCharges(form) {
  return num(
    form?.cement_charges
  );
}

function getSandCharges(form) {
  return num(
    form?.sand_charges
  );
}

// =====================================================
// CALCULATE TOTAL PLANT COST
// =====================================================

function calculateTotalPlantCost(
  form,
  materialCost
) {
  return (
    num(materialCost) +

    getAggregateCharges(form) +

    getBhadaCharges(form) +

    getCementCharges(form) +

    getSandCharges(form) +

    num(
      form?.installation_charges
    ) +

    num(
      form?.je_charges
    ) +

    num(
      form?.load_extension_charges
    ) +

    num(
      form?.meter_connection_charges
    ) +

    num(
      form?.meter_change_charges
    ) +

    num(
      form?.name_change_charges
    ) +

    num(
      form?.net_metering_charges
    ) +

    num(
      form?.vendor_charges
    )
  );
}

// =====================================================
// BUILD ADDITIONAL CHARGES
// =====================================================

function buildAdditionalCharges(form) {
  const aggregateCharges =
    getAggregateCharges(form);

  const bhadaCharges =
    getBhadaCharges(form);

  const cementCharges =
    getCementCharges(form);

  const sandCharges =
    getSandCharges(form);

  return {
    aggregate_charges:
      aggregateCharges,

    bhada_charges:
      bhadaCharges,

    cement_charges:
      cementCharges,

    sand_charges:
      sandCharges,

    installation_charges:
      num(
        form?.installation_charges
      ),

    vendor_charges:
      num(
        form?.vendor_charges
      ),

    je_charges:
      num(
        form?.je_charges
      ),

    load_extension_charges:
      num(
        form?.load_extension_charges
      ),

    meter_connection_charges:
      num(
        form?.meter_connection_charges
      ),

    meter_change_charges:
      num(
        form?.meter_change_charges
      ),

    name_change_charges:
      num(
        form?.name_change_charges
      ),

    net_metering_charges:
      num(
        form?.net_metering_charges
      ),

    gitti_charges:
      aggregateCharges,
  };
}

// =====================================================
// BUILD PAYLOAD
// =====================================================

function buildPayload(
  form,
  products,
  materialCost
) {
  const aggregateCharges =
    getAggregateCharges(form);

  const bhadaCharges =
    getBhadaCharges(form);

  const cementCharges =
    getCementCharges(form);

  const sandCharges =
    getSandCharges(form);

  const additionalCharges =
    buildAdditionalCharges(form);

  return {
    customer_id:
      form.customer_id,

    project_no:
      form.project_no ||
      null,

    plant_size:
      form.plant_size ||
      null,

    location:
      form.location ||
      null,

    products,

    material_cost:
      num(materialCost),

    bhada_charges:
      bhadaCharges,

    cement_charges:
      cementCharges,

    gitti_charges:
      aggregateCharges,

    installation_charges:
      num(
        form.installation_charges
      ),

    je_charges:
      num(
        form.je_charges
      ),

    load_extension_charges:
      num(
        form.load_extension_charges
      ),

    meter_connection_charges:
      num(
        form.meter_connection_charges
      ),

    name_change_charges:
      num(
        form.name_change_charges
      ),

    net_metering_charges:
      num(
        form.net_metering_charges
      ),

    sand_charges:
      sandCharges,

    vendor_charges:
      num(
        form.vendor_charges
      ),

    total_plant_cost:
      calculateTotalPlantCost(
        form,
        materialCost
      ),

    remarks:
      form.remarks ||
      "",

    additional_charges:
      additionalCharges,
  };
}

// =====================================================
// ADD USED INVENTORY
// =====================================================

export async function addUsedInventory(
  form
) {
  const rawProducts =
    Array.isArray(form?.products)
      ? form.products
      : [];

  if (
    rawProducts.length === 0
  ) {
    throw new Error(
      "At least one material is required."
    );
  }

  // ---------------------------------------------------
  // VALIDATE LIVE STOCK
  // ---------------------------------------------------

  const validatedProducts =
    await validateLiveStock(
      rawProducts
    );

  // ---------------------------------------------------
  // CALCULATE FIFO
  // ---------------------------------------------------

  const productsWithFIFO =
    await calculateFIFOCost(
      validatedProducts
    );

  // ---------------------------------------------------
  // MATERIAL COST
  // ---------------------------------------------------

  const materialCost =
    productsWithFIFO.reduce(
      (sum, product) =>
        sum +
        num(product.total),
      0
    );

  const payload =
    buildPayload(
      form,
      productsWithFIFO,
      materialCost
    );

  console.log(
    "ADD MATERIAL CONSUMPTION:",
    {
      payload,
      materialCost,
      products:
        productsWithFIFO,
    }
  );

  const {
    data,
    error,
  } =
    await supabase
      .from("used_inventory")
      .insert(payload)
      .select()
      .single();

  if (error) {
    throw error;
  }

  await syncInventoryUsedQuantities();

  return data;
}

// =====================================================
// UPDATE USED INVENTORY
// =====================================================

export async function updateUsedInventory(
  id,
  data
) {
  if (!id) {
    throw new Error(
      "Material consumption ID is required."
    );
  }

  const rawProducts =
    Array.isArray(data?.products)
      ? data.products
      : [];

  if (
    rawProducts.length === 0
  ) {
    throw new Error(
      "At least one material is required."
    );
  }

  /*
   * IMPORTANT:
   *
   * When editing an existing Material Consumption,
   * exclude the current consumption from FIFO usage.
   *
   * Otherwise its old stock allocation would still
   * count as consumed and the available quantity would
   * become incorrect.
   */

  const validatedProducts =
    await validateLiveStock(
      rawProducts,
      id
    );

  /*
   * Recalculate FIFO again.
   *
   * This means editing an old Material Consumption will
   * also rebuild its FIFO allocations and prices.
   */

  const productsWithFIFO =
    await calculateFIFOCost(
      validatedProducts,
      id
    );

  /*
   * NEVER trust the old material_cost supplied by the
   * modal during edit.
   *
   * Calculate it again from FIFO.
   */

  const materialCost =
    productsWithFIFO.reduce(
      (sum, product) =>
        sum +
        num(product.total),
      0
    );

  const payload =
    buildPayload(
      data,
      productsWithFIFO,
      materialCost
    );

  const {
    data: updated,
    error,
  } =
    await supabase
      .from("used_inventory")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

  if (error) {
    throw error;
  }

  await syncInventoryUsedQuantities();

  return updated;
}

// =====================================================
// DELETE USED INVENTORY
// =====================================================

export async function deleteUsedInventory(
  id
) {
  if (!id) {
    throw new Error(
      "Material consumption ID is required."
    );
  }

  const { error } =
    await supabase
      .from("used_inventory")
      .delete()
      .eq("id", id);

  if (error) {
    throw error;
  }

  await syncInventoryUsedQuantities();

  return true;
}

// =====================================================
// SYNC INVENTORY USED QUANTITIES
// =====================================================

async function syncInventoryUsedQuantities() {
  const inventoryRows =
    await getInventoryRows();

  const consumptionRows =
    await getConsumptionRows();

  const usedMap =
    buildFIFOUsedMap(
      consumptionRows
    );

  for (const row of inventoryRows) {
    const usedQuantity =
      num(
        usedMap.get(
          String(row.id)
        )
      );

    const { error } =
      await supabase
        .from("inventory")
        .update({
          used_quantity:
            usedQuantity,
        })
        .eq(
          "id",
          row.id
        );

    if (error) {
      throw error;
    }
  }

  return true;
}

// =====================================================
// SEARCH USED INVENTORY
// =====================================================

export async function searchUsedInventory(
  keyword
) {
  const data =
    await getUsedInventory();

  const search =
    cleanText(
      keyword
    ).toLowerCase();

  if (!search) {
    return data;
  }

  return data.filter(
    (item) =>
      item.customers
        ?.customer_name
        ?.toLowerCase()
        .includes(search) ||

      item.location
        ?.toLowerCase()
        .includes(search) ||

      item.project_no
        ?.toLowerCase()
        .includes(search)
  );
}

// =====================================================
// EXPORTS
// =====================================================

export {
  syncInventoryUsedQuantities,
  getProductKey,
  getProductUnit,
};  