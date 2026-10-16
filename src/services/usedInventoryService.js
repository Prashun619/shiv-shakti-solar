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

function normalize(value) {
  return cleanText(value).toLowerCase();
}

// =====================================================
// C CHANNEL
// =====================================================

const C_CHANNEL_NAMES = [
  "C Channel 140x50x2 mm 9ft",
  "C Channel 140x50x2 mm 21ft",
];

function isCChannel(product) {
  const productName =
    normalize(product?.product_name);

  return C_CHANNEL_NAMES.some(
    (name) =>
      productName === normalize(name)
  );
}

function getCChannelLength(product) {
  if (!isCChannel(product)) {
    return 0;
  }

  return num(
    product?.length_ft ??
      product?.length ??
      product?.source_length_ft ??
      product?.channel_length_ft
  );
}

function getCChannelTotalWeight(product) {
  if (!isCChannel(product)) {
    return 0;
  }

  return num(
    product?.total_weight ??
      product?.weight ??
      product?.weight_per_piece
  );
}

function getCChannelUsedLength(product) {
  if (!isCChannel(product)) {
    return 0;
  }

  /*
   * C Channel Qty Used is already entered
   * directly in FEET.
   *
   * Therefore quantity is the authoritative
   * consumed length.
   */
  return num(
    product?.quantity
  );
}

/*
 * IMPORTANT
 *
 * For C Channel:
 *
 * quantity = TOTAL FEET USED
 *
 * Example:
 *
 * User enters Qty Used = 20
 *
 * That means:
 *
 * 20 ft consumed.
 *
 * It does NOT mean 20 pieces.
 */
function getCChannelUsedQuantity(product) {
  if (!isCChannel(product)) {
    return 0;
  }

  return num(
    product?.quantity
  );
}

/*
 * C Channel consumed length is already stored
 * in quantity because Qty Used is entered in feet.
 */
function getCChannelConsumedLength(product) {
  if (!isCChannel(product)) {
    return 0;
  }

  return getCChannelUsedQuantity(
    product
  );
}

// =====================================================
// GET PRODUCT UNIT
// =====================================================

function getProductUnit(product) {
  const name =
    cleanText(
      product?.product_name
    ).toLowerCase();

  /*
   * C Channel consumption quantity is FEET.
   */
  if (
    C_CHANNEL_NAMES.some(
      (channelName) =>
        name ===
        channelName.toLowerCase()
    )
  ) {
    return "ft";
  }

  // Leg 10ft is always Nos.
  if (name === "leg 10ft") {
    return "Nos";
  }

  const unit =
    cleanText(
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
  const category =
    cleanText(
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
  // C CHANNEL
  //
  // IMPORTANT:
  //
  // Source length is part of the product key.
  //
  // 9ft and 21ft remain separate FIFO pools.
  // ---------------------------------------------------

  if (isCChannel(product)) {
    return [
      cleanText(
        product?.product_name
      ),
      cleanText(
        product?.company
      ),
      cleanText(
        product?.specification
      ),
      getCChannelLength(product),
    ]
      .join("|")
      .toLowerCase();
  }

  // ---------------------------------------------------
  // NORMAL PRODUCTS
  // ---------------------------------------------------

  return [
    cleanText(
      product?.product_name
    ),
    cleanText(
      product?.company
    ),
    cleanText(
      product?.specification
    ),
  ]
    .join("|")
    .toLowerCase();
}

// =====================================================
// PRODUCT CONSUMPTION QUANTITY
// =====================================================

function getConsumptionQuantity(product) {
  const name = cleanText(
    product?.product_name
  ).toLowerCase();

  // =====================================================
  // C CHANNEL
  // =====================================================
  // C Channel consumption is ALWAYS measured in FEET.
  //
  // Example:
  // Stock = 126 ft
  // Qty Used = 10 ft
  // Remaining = 116 ft
  //
  // IMPORTANT:
  // Do NOT multiply quantity by length_ft here.
  // quantity itself is already the number of FEET used.
  // =====================================================

  if (name.includes("c channel")) {
    return num(
      product?.quantity ??
      product?.consumed_length_ft ??
      product?.length_ft
    );
  }

  // =====================================================
  // KG PRODUCTS
  // =====================================================

  const unit = getProductUnit(product);

  if (unit === "Kg") {
    return num(product.total_weight);
  }

  // =====================================================
  // NORMAL PRODUCTS
  // =====================================================

  return num(product.quantity);
}



// =====================================================
// PURCHASED QUANTITY
// =====================================================

function getPurchasedQuantity(row) {
  const name = cleanText(
    row?.product_name
  ).toLowerCase();

  // =====================================================
  // C CHANNEL
  // =====================================================
  // Inventory quantity is pieces, but Material Consumption
  // stock is displayed/consumed in FEET.
  //
  // Example:
  // 14 pieces × 9 ft = 126 ft
  // 6 pieces × 21 ft = 126 ft
  // =====================================================

  if (name.includes("c channel")) {
    const pieces = num(
      row?.purchased_quantity ??
      row?.quantity
    );

    const lengthFt = num(
      row?.length_ft ??
      row?.length
    );

    return pieces * lengthFt;
  }

  // =====================================================
  // NORMAL PRODUCTS
  // =====================================================

  const purchased = num(
    row?.purchased_quantity
  );

  if (purchased > 0) {
    return purchased;
  }

  return num(row?.quantity);
}

// =====================================================
// INVENTORY UNIT COST
// =====================================================

function getInventoryUnitCost(row) {
  if (!row) {
    return 0;
  }

  /*
   * inventory.unit_cost =
   * complete purchase cost of one inventory unit.
   *
   * For C Channel:
   *
   * one inventory unit = one complete channel.
   */

  return num(
    row.unit_cost
  );
}

// =====================================================
// INVENTORY COST PER CONSUMPTION UNIT
// =====================================================

function getInventoryCostPerUnit(row) {
  if (!row) {
    return 0;
  }

  const productName =
    cleanText(
      row.product_name
    ).toLowerCase();

 // ---------------------------------------------------
// C CHANNEL
//
// inventory.unit_cost is ALREADY the landed cost
// per FOOT.
//
// Example:
//
// 9ft  = ₹135.21 / ft
// 21ft = ₹125.55 / ft
//
// DO NOT divide by length_ft again.
// ---------------------------------------------------

if (
  C_CHANNEL_NAMES.some(
    (channelName) =>
      productName ===
      channelName.toLowerCase()
  )
) {
  return num(
    row.unit_cost
  );
}
  // ---------------------------------------------------
  // LEG 10FT
  // ---------------------------------------------------

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

  // ---------------------------------------------------
  // NORMAL PRODUCTS
  // ---------------------------------------------------

  const unitCost =
    num(
      row.unit_cost
    );

  if (unitCost > 0) {
    return unitCost;
  }

  return num(
    row.price
  );
}

// =====================================================
// RESOLVE MATERIAL CONSUMPTION UNIT COSTS
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

  const inventoryById =
    new Map();

  inventoryRows.forEach(
    (row) => {
      if (row?.id != null) {
        inventoryById.set(
          String(row.id),
          row
        );
      }
    }
  );

  // ---------------------------------------------------
  // INVENTORY FIFO ORDER
  // ---------------------------------------------------

  const sortedInventory = [
    ...inventoryRows,
  ].sort((a, b) => {
    const dateA =
      new Date(
        a?.date || 0
      ).getTime();

    const dateB =
      new Date(
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
  // ---------------------------------------------------

  const sortedRows = [
    ...rows,
  ].sort((a, b) => {
    const dateA =
      new Date(
        a?.created_at ||
          a?.date ||
          0
      ).getTime();

    const dateB =
      new Date(
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
  // USED INVENTORY MAP
  // ---------------------------------------------------

  const usedInventoryMap =
    new Map();

  function getUsedQuantity(
    inventoryId
  ) {
    return Number(
      usedInventoryMap.get(
        String(
          inventoryId
        )
      ) || 0
    );
  }

  function addUsedQuantity(
    inventoryId,
    quantity
  ) {
    const key =
      String(
        inventoryId
      );

    usedInventoryMap.set(
      key,
      getUsedQuantity(
        inventoryId
      ) +
        Number(
          quantity || 0
        )
    );
  }

  // ---------------------------------------------------
  // PROCESS CONSUMPTION RECORDS
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
            // EXISTING FIFO ALLOCATIONS
            // =========================================

            if (
              existingAllocations.length >
              0
            ) {
              let weightedTotal =
                0;

              let weightedQuantity =
                0;

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

                unit_cost:
                  resolvedUnitPrice,
              };
            }

            // =========================================
            // OLD RECORD WITHOUT FIFO ALLOCATIONS
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
              const inventoryRow of
                sortedInventory
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

              /*
               * FIFO inventory quantity is:
               *
               * C Channel = FEET
               * Normal products = normal quantity
               */

              let purchasedQuantity;

if (
  isCChannel(
    inventoryRow
  )
) {
  /*
   * getPurchasedQuantity()
   * already returns TOTAL FEET
   *
   * Example:
   * 14 pieces × 9ft = 126ft
   *
   * Do NOT multiply by length again.
   */
  purchasedQuantity =
    getPurchasedQuantity(
      inventoryRow
    );
} else {
  purchasedQuantity =
    getPurchasedQuantity(
      inventoryRow
    );
}

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

              /*
               * For C Channel:
               *
               * unitCost here is cost per foot.
               */

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

            if (
              weightedQuantity >
              0
            ) {
              const resolvedUnitPrice =
                weightedTotal /
                weightedQuantity;

              return {
                ...product,

                unit_price:
                  resolvedUnitPrice,

                unit_cost:
                  resolvedUnitPrice,
              };
            }

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
  const {
    data,
    error,
  } =
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

  const inventoryRows =
    await getInventoryRows();

  const enrichedRows =
    enrichConsumptionRowsWithInventoryCost(
      rows,
      inventoryRows
    );

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

  const {
    data: consumptionRows,
    error: consumptionError,
  } =
    await supabase
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
  const {
    data,
    error,
  } =
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
        length_ft,
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
  const {
    data,
    error,
  } =
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
  const usedMap =
    new Map();

  for (
    const record of
      records || []
  ) {
    if (
      excludeId &&
      String(record.id) ===
        String(excludeId)
    ) {
      continue;
    }

    const products =
      Array.isArray(
        record.products
      )
        ? record.products
        : [];

    for (
      const product of
        products
    ) {
      const allocations =
        Array.isArray(
          product?.fifo_allocations
        )
          ? product.fifo_allocations
          : [];

      for (
        const allocation of
          allocations
      ) {
        const inventoryId =
          allocation?.inventory_id;

        const quantity =
          num(
            allocation?.quantity
          );

          console.log(
  "FIFO ALLOCATION DEBUG:",
  {
    inventoryId,
    quantity,
    allocation,
    product_name:
      product?.product_name,
    product_quantity:
      product?.quantity,
    product_length_ft:
      product?.length_ft,
  }
);

        if (
          !inventoryId ||
          quantity <= 0
        ) {
          continue;
        }

        const key =
          String(
            inventoryId
          );

        usedMap.set(
          key,
          num(
            usedMap.get(
              key
            )
          ) +
            quantity
        );
      }
    }
  }

  return usedMap;
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
        getPurchasedQuantity(
          row
        );

      const used =
        num(
          usedMap.get(
            String(
              row.id
            )
          )
        );

      const rowUnitCost =
        getInventoryUnitCost(
          row
        );

      // -------------------------------------------------
      // C CHANNEL
      //
      // Physical purchase:
      //
      // Qty = pieces
      // Length = ft per piece
      //
      // FIFO stock = FEET
      //
      // Example:
      //
      // Purchase:
      // 14 pieces × 9ft
      //
      // Total stock:
      // 126ft
      //
      // If 20ft is used:
      //
      // Remaining:
      // 106ft
      // -------------------------------------------------

      if (
        isCChannel(row)
      ) {
        const lengthFt =
          getCChannelLength(
            row
          );

        const purchasedFeet =
  purchased;

        /*
         * FIFO used quantity for C Channel
         * is FEET.
         */
        const usedFeet =
          Math.max(
            used,
            0
          );

        const remainingFeet =
          Math.max(
            purchasedFeet -
              usedFeet,
            0
          );

        return {
          ...row,

          /*
           * Original purchase quantity
           * remains PIECES.
           */
          purchased_quantity_live:
            purchased,

          /*
           * Used quantity is FEET.
           */
          used_quantity_live:
            usedFeet,

          /*
           * FIFO quantity is FEET.
           */
          remaining_quantity:
            remainingFeet,

          unit:
            "Ft",

          length_ft:
            lengthFt,

          total_weight:
            getCChannelTotalWeight(
              row
            ),

          fifo_unit_cost:
            rowUnitCost,

          latest_unit_cost:
            rowUnitCost,
        };
      }

      // -------------------------------------------------
      // NORMAL PRODUCTS
      // -------------------------------------------------

      return {
        ...row,

        purchased_quantity_live:
          purchased,

        used_quantity_live:
          used,

        remaining_quantity:
          Math.max(
            purchased -
              used,
            0
          ),

        unit:
          getProductUnit(
            row
          ),

        length_ft:
          null,

        total_weight:
          num(
            row.total_weight
          ),

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
  if (
    isCChannel(row)
  ) {
    return getInventoryCostPerUnit(
      row
    );
  }

  return getInventoryUnitCost(
    row
  );
}

// =====================================================
// LIVE INVENTORY STOCK
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

  const grouped =
    new Map();

  for (
    const row of rows
  ) {
    const key =
      getProductKey(
        row
      );

    if (!key) {
      continue;
    }

    const cChannel =
      isCChannel(row);

    /*
     * IMPORTANT
     *
     * C Channel:
     *
     * Original inventory quantity
     * = pieces
     *
     * Live stock
     * = FEET
     *
     * Example:
     *
     * 14 pieces × 9 ft
     * = 126 ft
     *
     * Therefore we MUST NOT use
     * purchased_quantity_live here
     * as the live stock quantity.
     */

    const purchasedQuantity =
  num(
    row.purchased_quantity_live
  );

    const usedQuantity =
      cChannel
        ? num(
            row.used_quantity_live
          )
        : num(
            row.used_quantity_live
          );

    const remainingQuantity =
  Math.max(
    0,
    purchasedQuantity -
      usedQuantity
  );

    const unit =
      cChannel
        ? "ft"
        : getProductUnit(
            row
          );

    const existing =
      grouped.get(
        key
      );

    if (existing) {
      /*
       * -------------------------------------------------
       * GROUPED C CHANNEL STOCK
       *
       * Add FEET, never pieces.
       * -------------------------------------------------
       */

      existing.purchased_quantity +=
        purchasedQuantity;

      existing.used_quantity +=
        usedQuantity;

      existing.remaining_quantity +=
        remainingQuantity;

      existing.total_weight +=
        num(
          row.total_weight
        );

      existing.inventory_rows.push(
        row
      );
    } else {
      grouped.set(
        key,
        {
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

          /*
           * C Channel = ft
           */
          unit,

          length_ft:
            cChannel
              ? getCChannelLength(
                  row
                )
              : null,

          /*
           * IMPORTANT:
           *
           * For C Channel these are FEET.
           *
           * Example:
           * purchased_quantity = 126
           * used_quantity      = 0
           * remaining          = 126
           */
          purchased_quantity:
            purchasedQuantity,

          used_quantity:
            usedQuantity,

          remaining_quantity:
            remainingQuantity,

          total_weight:
            num(
              row.total_weight
            ),

          unit_cost:
            getInventoryUnitCost(
              row
            ),

          latest_unit_cost:
            getInventoryUnitCost(
              row
            ),

          inventory_rows: [
            row,
          ],
        }
      );
    }
  }

  const result = [];

  for (
    const item of
      grouped.values()
  ) {
    /*
     * -------------------------------------------------
     * AVAILABLE STOCK
     * -------------------------------------------------
     *
     * C Channel:
     *
     * purchased_quantity = feet
     * used_quantity      = feet
     *
     * Example:
     *
     * Purchased = 126 ft
     * Used      = 15 ft
     * Available = 111 ft
     *
     * NEVER use the original piece
     * quantity here.
     */

    const availableQuantity =
      Math.max(
        0,
        num(
          item.remaining_quantity
        )
      );

    result.push({
      ...item,

      /*
       * Keep consumed quantity in the
       * same unit as available quantity.
       *
       * C Channel = feet
       */
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
          sensitivity:
            "base",
          numeric:
            true,
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
    getProductKey(
      product
    );

  return (
    stock.find(
      (item) =>
        item.key === key
    ) || {
      key,

      product_name:
        product?.product_name ||
        "",

      company:
        product?.company ||
        "",

      specification:
        product?.specification ||
        "",

      category:
        product?.category ||
        "",

      unit:
        isCChannel(product)
          ? "ft"
          : getProductUnit(
              product
            ),

      length_ft:
        isCChannel(product)
          ? getCChannelLength(
              product
            )
          : null,

      purchased_quantity:
        0,

      consumed_quantity:
        0,

      available_quantity:
        0,

      available_stock:
        0,

      total_weight:
        isCChannel(product)
          ? getCChannelTotalWeight(
              product
            )
          : 0,

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
    getProductUnit(
      product
    );

  const qty =
    getConsumptionQuantity(
      product
    );

 // ---------------------------------------------------
// C CHANNEL
// ---------------------------------------------------

if (
  isCChannel(product)
) {
  const lengthFt =
    getCChannelLength(
      product
    );

  /*
   * IMPORTANT:
   *
   * Qty Used entered by the user
   * is DIRECTLY in FEET.
   *
   * Example:
   *
   * Stock = 126 ft
   * User enters = 15
   *
   * Consumption = 15 ft
   *
   * NOT 15 pieces.
   */

  const usedFeet =
    num(
      product?.quantity
    );

  if (
    lengthFt <= 0
  ) {
    throw new Error(
      "C Channel inventory length is required."
    );
  }

  if (
    usedFeet <= 0
  ) {
    throw new Error(
      "C Channel Qty Used must be greater than 0 ft."
    );
  }

  return {
    ...product,

    product_name:
      name,

    /*
     * C Channel consumption
     * unit is FEET.
     */
    unit:
      "Ft",

    /*
     * IMPORTANT:
     *
     * quantity = consumed FEET.
     */
    quantity:
      usedFeet,

    /*
     * Source channel length.
     *
     * Example:
     * 9ft channel = 9
     */
    length_ft:
      lengthFt,

    source_length_ft:
      lengthFt,

    /*
     * Keep this for compatibility
     * with existing saved records.
     *
     * It represents the actual
     * consumed length in feet.
     */
    used_length_ft:
      usedFeet,

    total_weight:
      getCChannelTotalWeight(
        product
      ),

    /*
     * No piece-based restriction.
     */
    cutting_pieces:
      0,

    /*
     * Actual consumed length.
     */
    consumed_length_ft:
      usedFeet,
  };
}
  // ---------------------------------------------------
  // NORMAL PRODUCT
  // ---------------------------------------------------

  return {
    ...product,

    product_name:
      name,

    unit,

    quantity:
      unit === "Nos"
        ? Math.max(
            qty,
            0
          )
        : 0,

    total_weight:
      unit === "Kg"
        ? Math.max(
            qty,
            0
          )
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

  for (
    const product of
      products || []
  ) {
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

    if (
      required <= 0
    ) {
      continue;
    }

    const key =
      getProductKey(
        validated
      );

    requestedMap.set(
      key,
      num(
        requestedMap.get(
          key
        )
      ) +
        required
    );
  }

   for (
    const [
      key,
      required,
    ] of requestedMap.entries()
  ) {
    const stockItem =
      stockMap.get(
        key
      );

    const product =
      validatedProducts.find(
        (item) =>
          getProductKey(
            item
          ) === key
      );

    /*
     * IMPORTANT
     *
     * C Channel stock is ALREADY stored
     * and calculated in FEET.
     *
     * Example:
     *
     * 14 pieces × 9 ft = 126 ft
     *
     * available_quantity = 126
     *
     * If user requests 20 ft:
     *
     * required = 20
     * available = 126
     *
     * DO NOT multiply available by
     * channel length again.
     */
    const available =
      num(
        stockItem?.available_quantity
      );

    if (
      required >
      available
    ) {
      const unit =
        isCChannel(product)
          ? "ft"
          : getProductUnit(
              product
            );

      const lengthText =
        isCChannel(product)
          ? ` (${getCChannelLength(product)} ft channel)`
          : "";

      throw new Error(
        `${product.product_name}${lengthText} has only ${available} ${unit} available. You are trying to use ${required} ${unit}.`
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
    getProductKey(
      product
    );

  return rows.filter(
    (row) =>
      getProductKey(
        row
      ) === key &&
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

  const allocations =
    [];

  if (
    remaining <= 0
  ) {
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

  let weightedQuantity =
    0;

  // ===================================================
  // C CHANNEL
  // ===================================================

  if (
    isCChannel(product)
  ) {
    /*
     * =================================================
     * C CHANNEL FIFO IS IN FEET
     * =================================================
     *
     * Qty Used entered by user:
     *
     * 20 ft
     *
     * Therefore:
     *
     * required = 20 ft
     *
     * FIFO deducts feet directly.
     *
     * Example:
     *
     * Oldest purchase:
     * 14 × 9ft = 126ft
     *
     * Already used:
     * 108ft
     *
     * Remaining:
     * 18ft
     *
     * User requests:
     * 20ft
     *
     * FIFO:
     *
     * 18ft from oldest
     * 2ft from next purchase
     *
     * No conversion to pieces.
     */

    let feetRemaining =
      Math.max(
        0,
        num(required)
      );

    if (
      feetRemaining <= 0
    ) {
      return {
        total: 0,

        allocations: [],

        unit_price: 0,

        unit_cost: 0,
      };
    }

    for (
      const row of
        matchingRows
    ) {
      if (
        feetRemaining <=
        0
      ) {
        break;
      }

      const sourceLength =
        getCChannelLength(
          row
        );

      if (
        sourceLength <= 0
      ) {
        continue;
      }

      // -----------------------------------------------
      // AVAILABLE FIFO STOCK
      //
      // This is already FEET.
      // -----------------------------------------------

      const availableFeet =
        Math.max(
          num(
            row.remaining_quantity
          ),
          0
        );

      if (
        availableFeet <= 0
      ) {
        continue;
      }

      // -----------------------------------------------
      // FEET TAKEN FROM THIS PURCHASE
      // -----------------------------------------------

      const feetFromRow =
        Math.min(
          availableFeet,
          feetRemaining
        );

     // -----------------------------------------------
// COST PER FOOT
// -----------------------------------------------
//
// inventory.unit_cost is already ₹ / ft.
// Do NOT divide by sourceLength again.
// -----------------------------------------------

const costPerFoot =
  getInventoryUnitCost(
    row
  );

const allocationTotal =
  feetFromRow *
  costPerFoot;

      // -----------------------------------------------
      // WEIGHT
      // -----------------------------------------------

      const sourceWeight =
        getCChannelTotalWeight(
          row
        );

      const sourcePurchasedQuantity =
  getPurchasedQuantity(row);

const totalSourceFeet =
  sourcePurchasedQuantity;

const weightPerFoot =
  totalSourceFeet > 0
    ? sourceWeight / totalSourceFeet
    : 0;

      const consumedWeight =
        feetFromRow *
        weightPerFoot;

      // -----------------------------------------------
      // FIFO ALLOCATION
      // -----------------------------------------------

      const allocation = {
        inventory_id:
          row.id,

        /*
         * IMPORTANT:
         *
         * C Channel allocation quantity
         * is FEET.
         */
        quantity:
          feetFromRow,

        unit:
          "Ft",

        unit_cost:
          costPerFoot,

        unit_price:
          costPerFoot,

        total:
          allocationTotal,

        /*
         * Original source channel length.
         */
        length_ft:
          sourceLength,

        total_weight:
          sourceWeight,

        /*
         * Actual consumed feet.
         */
        consumed_length_ft:
          feetFromRow,

        consumed_weight:
          consumedWeight,

        /*
         * Informational only.
         *
         * This is NOT used for FIFO.
         */
        
      };

      allocations.push(
        allocation
      );

      total +=
        allocationTotal;

      /*
       * Weighted quantity is FEET.
       */
      weightedQuantity +=
        feetFromRow;

      // -----------------------------------------------
      // DEDUCT FIFO STOCK AS FEET
      // -----------------------------------------------

      row.remaining_quantity =
        Math.max(
          0,
          availableFeet -
            feetFromRow
        );

      feetRemaining -=
        feetFromRow;
    }

    // -----------------------------------------------
    // NOT ENOUGH FEET
    // -----------------------------------------------

    if (
      feetRemaining > 0
    ) {
      throw new Error(
        `${product.product_name} (${getCChannelLength(product)} ft channel) does not have enough stock. ${feetRemaining} ft are still required.`
      );
    }

    const weightedAveragePrice =
      weightedQuantity > 0
        ? total /
          weightedQuantity
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

  // ===================================================
  // NORMAL PRODUCTS
  // ===================================================

  for (
    const row of
      matchingRows
  ) {
    if (
      remaining <= 0
    ) {
      break;
    }

    const available =
      num(
        row.remaining_quantity
      );

    if (
      available <= 0
    ) {
      continue;
    }

    const allocate =
      Math.min(
        available,
        remaining
      );

    const unitCost =
      getCostPerUnit(
        row
      );

    const allocationTotal =
      allocate *
      unitCost;

    const allocation = {
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
    };

    allocations.push(
      allocation
    );

    total +=
      allocationTotal;

    weightedQuantity +=
      allocate;

    row.remaining_quantity -=
      allocate;

    remaining -=
      allocate;
  }

  if (
    remaining > 0
  ) {
    throw new Error(
      `${product.product_name} does not have enough live stock.`
    );
  }

  const weightedAveragePrice =
    weightedQuantity > 0
      ? total /
        weightedQuantity
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
// FIFO ALLOCATION WRAPPER
// =====================================================

function calculateReplacementInverterFIFO(
  rows,
  product,
  quantity
) {
  return allocateFIFO(
    rows,
    product,
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

  const rows =
    prepareInventoryRows(
      inventoryRows,
      usedMap
    );

 const outputProducts =
  products.map(
    (product) => ({
      ...product,

      fifo_allocations:
        [],

      total:
        0,

      unit_price:
        0,

      unit_cost:
        0,
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

    if (
      required <= 0
    ) {
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

    product.unit_price =
      result.unit_price;

    product.unit_cost =
      result.unit_price;

    // -------------------------------------------------
    // C CHANNEL INFORMATION
    // -------------------------------------------------
if (
  isCChannel(product)
) {
  /*
   * =================================================
   * C CHANNEL = FEET
   * =================================================
   *
   * Qty Used is entered directly in feet.
   *
   * Example:
   *
   * User enters:
   * 15
   *
   * This means:
   * 15 ft
   *
   * It does NOT mean:
   * 15 pieces.
   */

  const totalFeetUsed =
    Math.max(
      0,
      num(
        product.quantity
      )
    );

  const sourceLength =
    getCChannelLength(
      product
    );

    console.log(
  "C CHANNEL VALIDATION DEBUG:",
  {
    product,
    sourceLength,
    length_ft: product?.length_ft,
    source_length_ft:
      product?.source_length_ft,
    quantity:
      product?.quantity,
  }
);

  const totalWeight =
    getCChannelTotalWeight(
      product
    );

  /*
   * Actual consumed length is
   * exactly the quantity entered.
   */
  const consumedLength =
    totalFeetUsed;

  product.length_ft =
    sourceLength;

  product.source_length_ft =
    sourceLength;

  product.total_weight =
    totalWeight;

  /*
   * quantity = FEET USED
   */
  product.quantity =
    totalFeetUsed;

  /*
   * consumed_length_ft = FEET USED
   */
  product.consumed_length_ft =
    consumedLength;

  /*
   * Keep used_length_ft compatible
   * with existing records.
   *
   * It is also FEET.
   */
  product.used_length_ft =
    totalFeetUsed;

  /*
   * There is no piece-based
   * consumption anymore.
   */
  product.cutting_pieces =
    0;

  /*
   * This field now represents
   * the consumed length, not a
   * piece cut length.
   */
  product.piece_length_ft =
    totalFeetUsed;

  // -------------------------------------------------
  // CALCULATE ACTUAL CONSUMED WEIGHT
  // -------------------------------------------------

  let calculatedConsumedWeight =
    0;

  if (
    Array.isArray(
      product.fifo_allocations
    )
  ) {
    calculatedConsumedWeight =
      product.fifo_allocations.reduce(
        (
          sum,
          allocation
        ) =>
          sum +
          num(
            allocation.consumed_weight
          ),
        0
      );
  }

  product.consumed_weight =
    calculatedConsumedWeight;

  // -------------------------------------------------
  // COST PER USED FOOT
  // -------------------------------------------------

  product.piece_cost =
    totalFeetUsed > 0
      ? product.total /
        totalFeetUsed
      : 0;
}
  }



  return outputProducts;
}

// =====================================================
// ADDITIONAL CHARGES
// =====================================================

function getAggregateCharges(
  form
) {
  const directAggregate =
    form?.aggregate_charges;

  const oldGitti =
    form?.gitti_charges;

  if (
    directAggregate !==
      undefined &&
    directAggregate !==
      null &&
    String(
      directAggregate
    ).trim() !== ""
  ) {
    return num(
      directAggregate
    );
  }

  return num(
    oldGitti
  );
}

function getBhadaCharges(
  form
) {
  return num(
    form?.bhada_charges
  );
}

function getCementCharges(
  form
) {
  return num(
    form?.cement_charges
  );
}

function getSandCharges(
  form
) {
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

    getAggregateCharges(
      form
    ) +

    getBhadaCharges(
      form
    ) +

    getCementCharges(
      form
    ) +

    getSandCharges(
      form
    ) +

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

function buildAdditionalCharges(
  form
) {
  const aggregateCharges =
    getAggregateCharges(
      form
    );

  const bhadaCharges =
    getBhadaCharges(
      form
    );

  const cementCharges =
    getCementCharges(
      form
    );

  const sandCharges =
    getSandCharges(
      form
    );

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
    getAggregateCharges(
      form
    );

  const bhadaCharges =
    getBhadaCharges(
      form
    );

  const cementCharges =
    getCementCharges(
      form
    );

  const sandCharges =
    getSandCharges(
      form
    );

  const additionalCharges =
    buildAdditionalCharges(
      form
    );

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
      num(
        materialCost
      ),

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
    Array.isArray(
      form?.products
    )
      ? form.products
      : [];

  if (
    rawProducts.length ===
    0
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
        num(
          product.total
        ),
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
      .insert(
        payload
      )
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
    Array.isArray(
      data?.products
    )
      ? data.products
      : [];

  if (
    rawProducts.length ===
    0
  ) {
    throw new Error(
      "At least one material is required."
    );
  }

  // ---------------------------------------------------
  // EXCLUDE CURRENT CONSUMPTION
  // ---------------------------------------------------

  const validatedProducts =
    await validateLiveStock(
      rawProducts,
      id
    );

  // ---------------------------------------------------
  // RECALCULATE FIFO
  // ---------------------------------------------------

  const productsWithFIFO =
    await calculateFIFOCost(
      validatedProducts,
      id
    );

  // ---------------------------------------------------
  // MATERIAL COST
  // ---------------------------------------------------

  const materialCost =
    productsWithFIFO.reduce(
      (sum, product) =>
        sum +
        num(
          product.total
        ),
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
      .update(
        payload
      )
      .eq(
        "id",
        id
      )
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
  id,
  options = {}
) {
  if (!id) {
    throw new Error(
      "Material consumption ID is required."
    );
  }

  const {
    error,
  } = await supabase
    .from("used_inventory")
    .delete()
    .eq(
      "id",
      id
    );

  if (error) {
    throw error;
  }

  // ---------------------------------------------------
  // SYNC INVENTORY ONLY WHEN REQUESTED
  // ---------------------------------------------------

  if (
    !options.skipSync
  ) {
    await syncInventoryUsedQuantities();
  }

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

  // ---------------------------------------------------
  // ONLY UPDATE INVENTORY ROWS WHERE USED QUANTITY
  // HAS ACTUALLY CHANGED.
  // ---------------------------------------------------

  const updates = [];

  for (
    const row of inventoryRows
  ) {
    const usedQuantity =
      num(
        usedMap.get(
          String(row.id)
        )
      );

    const currentUsedQuantity =
      num(
        row.used_quantity
      );

    // Nothing changed — skip this row completely.
    if (
      currentUsedQuantity ===
      usedQuantity
    ) {
      continue;
    }

    updates.push(
      supabase
        .from("inventory")
        .update({
          used_quantity:
            usedQuantity,
        })
        .eq(
          "id",
          row.id
        )
    );
  }

  // ---------------------------------------------------
  // RUN REQUIRED UPDATES IN PARALLEL
  // ---------------------------------------------------

  if (
    updates.length > 0
  ) {
    const results =
      await Promise.all(
        updates
      );

    const failed =
      results.find(
        (result) =>
          result.error
      );

    if (failed?.error) {
      throw failed.error;
    }
  }

  return true;
}

export async function repairInventoryUsedQuantities() {
  console.log(
    "========== INVENTORY USED QUANTITY REPAIR START =========="
  );

  await syncInventoryUsedQuantities();

  console.log(
    "========== INVENTORY USED QUANTITY REPAIR COMPLETE =========="
  );

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
  calculateFIFOCost,
};