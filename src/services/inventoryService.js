import { supabase } from "./supabase";


// =====================================================
// HELPERS
// =====================================================

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function normalize(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function isKg(item) {
  return normalize(item?.unit) === "kg";
}

function isKit(item) {
  return (
    item?.type === "Kit" ||
    item?.purchase_type === "Kit" ||
    normalize(item?.category) === "kit" ||
    normalize(item?.unit) === "kit"
  );
}


// =====================================================
// PRODUCT KEY
// =====================================================

function cleanText(value) {
  return String(value ?? "").trim();
}

function getProductKey(product = {}) {
  return [
    cleanText(product.company),
    cleanText(product.product_name),
    cleanText(product.specification),
  ]
    .join("|")
    .toLowerCase();
}


// =====================================================
// GET MASTER INVENTORY
// =====================================================

export async function getMasterInventory() {
  const {
    data,
    error,
  } = await supabase
    .from("inventory")
    .select("*")
    .order("date", {
      ascending: true,
    })
    .order("id", {
      ascending: true,
    });

  if (error) {
    console.error(
      "GET MASTER INVENTORY ERROR:",
      error
    );

    throw error;
  }

  const rows = data || [];

  const masterMap = new Map();

  rows.forEach((row) => {
    if (row.active === false) {
      return;
    }

    const company =
      String(row.company || "").trim();

    const productName =
      String(row.product_name || "").trim();

    const specification =
      String(row.specification || "").trim();

    const category =
      String(row.category || "").trim();

    const unit =
      String(row.unit || "Nos").trim();

    const key = [
      company,
      productName,
      specification,
    ]
      .map(normalize)
      .join("|");

    if (!masterMap.has(key)) {
      masterMap.set(key, {
        id: row.id,

        product_name:
          productName,

        company:
          company,

        specification:
          specification,

        category:
          category,

        purchase_type:
          row.purchase_type || "",

        unit:
          unit,

        purchased_quantity: 0,

        used_quantity: 0,

        total_weight: 0,

        used_weight: 0,

        unit_cost: 0,

        total_cost: 0,

        inventory_ids: [],
      });
    }

    const master =
      masterMap.get(key);


    // =================================================
    // PURCHASE QUANTITY
    // =================================================

    const purchasedQuantity =
      num(
        row.purchased_quantity ??
        row.quantity
      );

    master.purchased_quantity +=
      purchasedQuantity;


    // =================================================
    // PURCHASE COST
    // =================================================

    const rowQuantity =
      purchasedQuantity;

    const rowPrice =
      num(row.price);

    const rowGST =
      num(row.gst);

    const rowTransportation =
      num(row.transportation);

    let rowBaseCost = 0;

    if (isKg(row)) {

      const totalWeight =
        num(row.total_weight);

      rowBaseCost =
        totalWeight *
        rowPrice;

    } else if (isKit(row)) {

      const kitValue =
        num(
          row.kit_overall_value ??
          row.price
        );

      rowBaseCost =
        rowQuantity *
        kitValue;

    } else {

      rowBaseCost =
        rowQuantity *
        rowPrice;
    }


    const rowGSTAmount =
      rowBaseCost *
      rowGST /
      100;


    // =================================================
    // FINAL LANDED PURCHASE COST
    // =================================================

    const rowTotalCost =
      rowBaseCost +
      rowGSTAmount +
      rowTransportation;


    master.total_cost +=
      rowTotalCost;


    // =================================================
    // USED QUANTITY
    // =================================================

    const usedQuantity =
      num(row.used_quantity);

    master.used_quantity +=
      usedQuantity;


    // =================================================
    // WEIGHT
    // =================================================

    if (isKg(row)) {

      master.total_weight +=
        num(row.total_weight);

      master.used_weight +=
        num(row.used_weight);
    }


    // =================================================
    // INVENTORY IDS
    // =================================================

    master.inventory_ids.push(
      row.id
    );
  });


  // =====================================================
  // CALCULATE REMAINING
  // =====================================================

  masterMap.forEach((master) => {

    if (isKg(master)) {

      const remainingWeight =
        Math.max(
          num(master.total_weight) -
          num(master.used_weight),
          0
        );

      master.available_weight =
        remainingWeight;

      master.quantity =
        remainingWeight;

      master.remaining =
        remainingWeight;

    } else {

      const remainingQuantity =
        Math.max(
          num(master.purchased_quantity) -
          num(master.used_quantity),
          0
        );

      master.quantity =
        remainingQuantity;

      master.remaining =
        remainingQuantity;
    }


    // ===================================================
    // MASTER UNIT COST
    // ===================================================

    const purchasedQty =
      num(master.purchased_quantity);

    master.unit_cost =
      purchasedQty > 0
        ? master.total_cost /
          purchasedQty
        : 0;
  });


  return Array.from(
    masterMap.values()
  );
}


// =====================================================
// GET LIVE INVENTORY STOCK
// =====================================================
//
// MASTER INVENTORY IS THE SOURCE OF TRUTH.
//
// When editing Material Consumption, the old
// consumption is excluded so that its quantity
// becomes available again for validation.
//

export async function getLiveInventoryStock(
  excludeConsumptionId = null
) {

  // ===================================================
  // GET MASTER INVENTORY
  // ===================================================

  const masterInventory =
    await getMasterInventory();


  // ===================================================
  // GET ALL USED MATERIAL CONSUMPTION
  // ===================================================

  const {
    data: usedRows,
    error,
  } = await supabase
    .from("used_inventory")
    .select("*");

  if (error) {
    console.error(
      "GET LIVE INVENTORY STOCK ERROR:",
      error
    );

    throw error;
  }

  const consumptionRows =
    usedRows || [];


  // ===================================================
  // BUILD EXCLUDED CONSUMPTION
  // ===================================================

  const excludedProducts =
    new Map();


  if (excludeConsumptionId) {

    const excludedRow =
      consumptionRows.find(
        (row) =>
          String(row.id) ===
          String(excludeConsumptionId)
      );


    if (
      excludedRow &&
      Array.isArray(excludedRow.products)
    ) {

      excludedRow.products.forEach(
        (product) => {

          const key =
            getProductKey(product);

          const quantity =
            num(product.quantity);


          if (!key || quantity <= 0) {
            return;
          }


          excludedProducts.set(
            key,
            (
              excludedProducts.get(key) ||
              0
            ) + quantity
          );
        }
      );
    }
  }


  // ===================================================
  // CALCULATE LIVE STOCK
  // ===================================================

  return masterInventory.map(
    (master) => {

      const key =
        getProductKey(master);

      const masterPurchased =
        num(
          master.purchased_quantity
        );

      const masterUsed =
        num(
          master.used_quantity
        );

      const excludedQuantity =
        num(
          excludedProducts.get(key)
        );


      // =================================================
      // LIVE AVAILABLE QUANTITY
      // =================================================

      const availableQuantity =
        Math.max(
          masterPurchased -
          (
            masterUsed -
            excludedQuantity
          ),
          0
        );


      // =================================================
      // KG
      // =================================================

      if (isKg(master)) {

        const totalWeight =
          num(master.total_weight);

        const usedWeight =
          num(master.used_weight);


        return {
          ...master,

          live_quantity:
            availableQuantity,

          live_remaining:
            availableQuantity,

          live_weight:
            Math.max(
              totalWeight -
              usedWeight,
              0
            ),
        };
      }


      // =================================================
      // NORMAL / PANEL / INVERTER / KIT
      // =================================================

      return {
        ...master,

        live_quantity:
          availableQuantity,

        live_remaining:
          availableQuantity,
      };
    }
  );
}


// =====================================================
// VALIDATE LIVE STOCK
// =====================================================

export async function validateLiveStock(
  products = [],
  excludeConsumptionId = null
) {

  const liveStock =
    await getLiveInventoryStock(
      excludeConsumptionId
    );


  const stockMap =
    new Map();


  liveStock.forEach(
    (item) => {

      stockMap.set(
        getProductKey(item),
        item
      );
    }
  );


  for (
    const product of products
  ) {

    const requiredQuantity =
      num(product.quantity);


    if (
      requiredQuantity <= 0
    ) {
      continue;
    }


    const key =
      getProductKey(product);


    const stock =
      stockMap.get(key);


    const available =
      num(
        stock?.live_quantity
      );


    if (
      requiredQuantity >
      available
    ) {

      throw new Error(
        `${product.product_name || "Product"} has only ${available} ${product.unit || "Nos"} available. You are trying to use ${requiredQuantity} ${product.unit || "Nos"}.`
      );
    }
  }


  return true;
}


// =====================================================
// GET INVENTORY BATCHES FOR FIFO CONSUMPTION
// =====================================================

export async function getInventoryBatchesForConsumption(
  productName,
  company = "",
  specification = ""
) {

  if (!productName) {
    return [];
  }


  const {
    data,
    error,
  } = await supabase
    .from("inventory")
    .select("*")
    .eq(
      "active",
      true
    )
    .order(
      "date",
      {
        ascending: true,
      }
    )
    .order(
      "id",
      {
        ascending: true,
      }
    );


  if (error) {

    console.error(
      "GET INVENTORY BATCHES FOR CONSUMPTION ERROR:",
      error
    );

    throw error;
  }


  const wantedProduct =
    normalize(productName);

  const wantedCompany =
    normalize(company);

  const wantedSpecification =
    normalize(specification);


  return (data || []).filter((row) => {

    if (
      normalize(row.product_name) !==
      wantedProduct
    ) {
      return false;
    }


    if (
      wantedCompany &&
      normalize(row.company) !==
      wantedCompany
    ) {
      return false;
    }


    if (
      wantedSpecification &&
      normalize(row.specification) !==
      wantedSpecification
    ) {
      return false;
    }


    return true;
  });
}


// =====================================================
// CALCULATE PRODUCT BASE
// =====================================================

export function calculateProductBase(item = {}) {

  const quantity =
    num(item.quantity);

  const price =
    num(item.price);


  let baseAmount = 0;


  if (isKg(item)) {

    const totalWeight =
      item.weight_per_piece !== undefined &&
      item.weight_per_piece !== null

        ? quantity *
          num(item.weight_per_piece)

        : num(item.total_weight);


    baseAmount =
      totalWeight *
      price;

  } else {

    baseAmount =
      quantity *
      price;
  }


  return baseAmount;
}


// =====================================================
// CALCULATE PRODUCT GST
// =====================================================

export function calculateProductGST(item = {}) {

  const baseAmount =
    calculateProductBase(item);

  const gst =
    num(item.gst);


  return (
    baseAmount *
    gst /
    100
  );
}


// =====================================================
// CALCULATE KIT BASE
// =====================================================

export function calculateKitBase(item = {}) {

  const kitQty =
    num(item.quantity);

  const kitValue =
    num(
      item.kit_overall_value ??
      item.price
    );


  return (
    kitQty *
    kitValue
  );
}


// =====================================================
// CALCULATE KIT GST
// =====================================================

export function calculateKitGST(item = {}) {

  const base =
    calculateKitBase(item);

  const gst =
    num(
      item.kit_gst ??
      item.gst
    );


  return (
    base *
    gst /
    100
  );
}


// =====================================================
// ITEM BASE
// =====================================================

function calculateItemBase(item = {}) {

  if (isKit(item)) {
    return calculateKitBase(item);
  }

  return calculateProductBase(item);
}


// =====================================================
// ITEM GST
// =====================================================

function calculateItemGST(item = {}) {

  if (isKit(item)) {
    return calculateKitGST(item);
  }

  return calculateProductGST(item);
}


// =====================================================
// GET ALL INVENTORY
// =====================================================

export async function getInventory() {

  const {
    data,
    error,
  } = await supabase
    .from("inventory")
    .select("*")
    .order(
      "date",
      {
        ascending: false,
      }
    )
    .order(
      "id",
      {
        ascending: false,
      }
    );


  if (error) {
    throw error;
  }


  const rows =
    data || [];


  return rows.map((item) => {

    const quantity =
      num(
        item.purchased_quantity ??
        item.quantity
      );

    const price =
      num(item.price);

    const gst =
      num(item.gst);

    const transportation =
      num(item.transportation);


    // =================================================
    // BASE AMOUNT
    // =================================================

    const baseAmount =
      calculateItemBase({
        ...item,
        quantity,
        price,
      });


    // =================================================
    // GST
    // =================================================

    const gstAmount =
      calculateItemGST({
        ...item,
        quantity,
        price,
      });


    // =================================================
    // FINAL LANDED COST
    // =================================================
    //
    // Base Price
    // + GST
    // + Allocated Transportation
    //

    const totalCost =
      baseAmount +
      gstAmount +
      transportation;


    // =================================================
// FINAL UNIT COST
// =================================================
//
// IMPORTANT:
// Use the exact unit_cost stored in the inventory
// table.
//
// Material Consumption FIFO also uses this same
// value, so Inventory View and Material Consumption
// will always show/use the same Unit Cost.
//

const storedUnitCost =
  num(item.unit_cost);

return {
  ...item,

  unit_cost:
    storedUnitCost,

  total_amount:
    totalCost,
};

   
  });
}


// =====================================================
// GENERATE BATCH ID
// =====================================================

function createBatchId() {

  return (
    `PUR${Date.now()}` +
    `${Math.floor(
      Math.random() * 1000
    )}`
  );
}


// =====================================================
// TRANSPORTATION ALLOCATION
// =====================================================
//
// Transportation is divided according to the
// purchase value of each product.
//
// Example:
//
// Product A = ₹1,00,000
// Product B = ₹50,000
// Transportation = ₹15,000
//
// A gets ₹10,000
// B gets ₹5,000
//
// Last row receives the remaining amount to avoid
// rounding differences.
//

function calculateTransportationAllocation(
  totalTransportation,
  itemValue,
  totalPurchaseValue,
  isLastItem,
  allocatedTransportation
) {

  const transport =
    Number(totalTransportation || 0);

  const value =
    Number(itemValue || 0);

  const totalValue =
    Number(totalPurchaseValue || 0);


  if (
    transport <= 0 ||
    value <= 0 ||
    totalValue <= 0
  ) {
    return 0;
  }


  // ===================================================
  // LAST ITEM
  // ===================================================

  if (isLastItem) {

    return Math.max(
      0,
      transport -
      Number(
        allocatedTransportation || 0
      )
    );
  }


  // ===================================================
  // PROPORTIONAL ALLOCATION
  // ===================================================

  return (
    value /
    totalValue
  ) *
  transport;
}


// =====================================================
// GET PURCHASE VALUE
// =====================================================
//
// This value is ONLY used to divide transportation.
//
// Normal Product:
// quantity × price
//
// KG:
// total weight × price
//
// Kit:
// kit quantity × kit value
//

function getPurchaseValue(item) {

  // ===================================================
  // KIT
  // ===================================================

  if (isKit(item)) {

    const kitQuantity =
      num(item.quantity);

    const kitValue =
      num(
        item.kit_overall_value ??
        item.price
      );


    return (
      kitQuantity *
      kitValue
    );
  }


  // ===================================================
  // NORMAL PRODUCT
  // ===================================================

  return calculateProductBase(item);
}


// =====================================================
// PREPARE PURCHASE ITEM
// =====================================================

function preparePurchaseItem(
  item,
  transportation,
  itemValue,
  totalPurchaseValue,
  isLastItem,
  allocatedTransportation,
  batchId,
  date,
  supplier,
  existingRow = null
) {

  const type =
    item.type ||
    item.purchase_type ||
    item.category ||
    "Product";


  // ===================================================
  // ALLOCATED TRANSPORTATION
  // ===================================================

  const rowTransportation =
    calculateTransportationAllocation(
      transportation,
      itemValue,
      totalPurchaseValue,
      isLastItem,
      allocatedTransportation
    );


  // ===================================================
  // KIT
  // ===================================================

  if (isKit(item)) {

    const kitQty =
      num(item.quantity);

    const kitGST =
      num(
        item.kit_gst ??
        item.gst
      );


    const kitName =
      item.kit_name ||
      item.product_name ||
      "";


    const componentCost =
      (item.kit_components || []).reduce(
        (sum, component) => {

          const componentQuantity =
            num(component.quantity);

          const componentPrice =
            num(
              component.unit_price ??
              component.price
            );


          return (
            sum +
            componentQuantity *
            componentPrice
          );
        },
        0
      );


    // =================================================
    // KIT BASE
    // =================================================

    const baseAmount =
      componentCost *
      kitQty;


    // =================================================
    // KIT GST
    // =================================================

    const gstAmount =
      baseAmount *
      kitGST /
      100;


    // =================================================
    // KIT FINAL LANDED COST
    // =================================================

    const totalAmount =
      baseAmount +
      gstAmount +
      rowTransportation;


    // =================================================
    // KIT FINAL UNIT COST
    // =================================================
    //
    // Component Price
    // + GST
    // + Allocated Transportation
    //

    const unitCost =
      kitQty > 0
        ? totalAmount /
          kitQty
        : 0;


    return {

      ...(existingRow?.id
        ? {
            id:
              existingRow.id,
          }
        : {}),

      date,

      supplier,

      product_name:
        kitName,

      category:
        "Kit",

      company:
        item.company ||
        kitName
          .replace(
            /\s+Kit$/i,
            ""
          )
          .trim(),

      specification:
        item.kit_panel_watt ||
        item.specification ||
        "",

      quantity:
        kitQty,

      purchased_quantity:
        kitQty,

      used_quantity:
        existingRow
          ? num(
              existingRow.used_quantity
            )
          : 0,

      unit:
        "Kit",

      // Original component purchase value
      price:
        componentCost,

      total_weight:
        0,

      gst:
        kitGST,

      cgst:
        0,

      sgst:
        0,

      // Allocated transportation
      transportation:
        rowTransportation,

      // Final total including GST + transport
      total_amount:
        totalAmount,

      // Final landed unit cost
      unit_cost:
        unitCost,

      remarks:
        item.remarks ||
        "Includes Panel, Inverter, ACDB, DCDB and Earthing Kit",

      active:
        existingRow?.active ??
        true,

      is_default:
        existingRow?.is_default ??
        false,

      batch_id:
        batchId,

      purchase_type:
        "Kit",

      kit_name:
        kitName,

      kit_panel_watt:
        item.kit_panel_watt ||
        null,

      kit_panel_qty:
        num(
          item.kit_panel_qty
        ),

      kit_inverter_brand:
        item.kit_inverter_brand ||
        null,

      kit_overall_value:
        componentCost,

      kit_gst:
        kitGST,

      kit_components:
        Array.isArray(
          item.kit_components
        )
          ? item.kit_components
          : [],
    };
  }


  // ===================================================
  // NORMAL PRODUCT
  // ===================================================

  const quantity =
    num(item.quantity);

  const price =
    num(item.price);


  const weightPerPiece =
    num(
      item.weight_per_piece ??
      item.total_weight
    );


  const totalWeight =
    isKg(item)
      ? quantity *
        weightPerPiece
      : 0;


  const gst =
    num(item.gst);


  // =================================================
  // BASE AMOUNT
  // =================================================

  const baseAmount =
    calculateProductBase({
      ...item,

      quantity,

      price,

      total_weight:
        totalWeight,

      weight_per_piece:
        undefined,
    });


  // =================================================
  // GST AMOUNT
  // =================================================

  const gstAmount =
    baseAmount *
    gst /
    100;


  // =================================================
  // FINAL LANDED TOTAL
  // =================================================

  const totalAmount =
    baseAmount +
    gstAmount +
    rowTransportation;


  // =================================================
  // FINAL UNIT COST
  // =================================================
  //
  // Purchase Price
  // + GST
  // + Allocated Transportation per unit
  //

  const unitCost =
    quantity > 0
      ? totalAmount /
        quantity
      : 0;


  return {

    ...(existingRow?.id
      ? {
          id:
            existingRow.id,
        }
      : {}),

    date,

    supplier,

    product_name:
      item.product_name,

    category:
      item.category || "",

    company:
      item.company || "",

    specification:
      item.specification || "",

    quantity,

    purchased_quantity:
      quantity,

    used_quantity:
      existingRow
        ? num(
            existingRow.used_quantity
          )
        : 0,

    unit:
      item.unit || "Nos",

    // Original purchase price
    price,

    total_weight:
      totalWeight,

    gst,

    cgst:
      0,

    sgst:
      0,

    // Allocated transportation
    transportation:
      rowTransportation,

    // Final total
    total_amount:
      totalAmount,

    // Final landed unit cost
    unit_cost:
      unitCost,

    remarks:
      item.remarks || "",

    active:
      existingRow?.active ??
      true,

    is_default:
      existingRow?.is_default ??
      false,

    batch_id:
      batchId,

    purchase_type:
      "Product",

    kit_name:
      null,

    kit_panel_watt:
      null,

    kit_panel_qty:
      0,

    kit_inverter_brand:
      null,

    kit_overall_value:
      0,

    kit_gst:
      0,

    kit_components:
      null,
  };
}


// =====================================================
// GET PURCHASE QUANTITY
// =====================================================

function getPurchaseQuantity(item) {

  return num(
    item.quantity
  );
}


// =====================================================
// ADD INVENTORY
// =====================================================

export async function addInventory(
  purchase
) {

  const {
    date,
    supplier,
    transportation = 0,
    products = [],
  } = purchase;


  if (
    !Array.isArray(products) ||
    products.length === 0
  ) {

    throw new Error(
      "At least one product or kit is required."
    );
  }


  const batchId =
    createBatchId();


  // ===================================================
  // TOTAL PURCHASE VALUE
  // ===================================================

  const totalPurchaseValue =
    products.reduce(
      (sum, item) =>
        sum +
        getPurchaseValue(item),
      0
    );


  let allocatedTransportation = 0;


  // ===================================================
  // PREPARE ROWS
  // ===================================================

  const rows =
    products.map(
      (item, index) => {

        const isLastItem =
          index ===
          products.length - 1;


        const itemValue =
          getPurchaseValue(item);


        const row =
          preparePurchaseItem(
            item,
            transportation,
            itemValue,
            totalPurchaseValue,
            isLastItem,
            allocatedTransportation,
            batchId,
            date,
            supplier
          );


        if (!isLastItem) {

          allocatedTransportation +=
            num(
              row.transportation
            );
        }


        return row;
      }
    );


  // ===================================================
  // INSERT
  // ===================================================

  const {
    data,
    error,
  } = await supabase
    .from("inventory")
    .insert(rows)
    .select();


  if (error) {
    throw error;
  }


  return data || [];
}


// =====================================================
// UPDATE COMPLETE INVENTORY BATCH
// =====================================================

export async function updateInventoryBatch(
  batchId,
  {
    date,
    supplier,
    transportation = 0,
    products = [],
  }
) {

  if (!batchId) {

    throw new Error(
      "Batch ID is required."
    );
  }


  if (
    !Array.isArray(products) ||
    products.length === 0
  ) {

    throw new Error(
      "At least one product or kit is required."
    );
  }


  const existingRows =
    await getInventoryByBatch(
      batchId
    );


  const existingMap =
    new Map(
      existingRows.map(
        (row) => [
          row.id,
          row,
        ]
      )
    );


  const usedExistingIds =
    new Set();


  // ===================================================
  // TOTAL PURCHASE VALUE
  // ===================================================

  const totalPurchaseValue =
    products.reduce(
      (sum, item) =>
        sum +
        getPurchaseValue(item),
      0
    );


  let allocatedTransportation = 0;


  // ===================================================
  // PREPARE UPDATED ROWS
  // ===================================================

  const preparedRows =
    products.map(
      (item, index) => {

        const existingRow =
          item.id
            ? existingMap.get(
                item.id
              )
            : null;


        if (existingRow?.id) {

          usedExistingIds.add(
            existingRow.id
          );
        }


        const isLastItem =
          index ===
          products.length - 1;


        const itemValue =
          getPurchaseValue(item);


        const row =
          preparePurchaseItem(
            item,
            transportation,
            itemValue,
            totalPurchaseValue,
            isLastItem,
            allocatedTransportation,
            batchId,
            date,
            supplier,
            existingRow
          );


        if (!isLastItem) {

          allocatedTransportation +=
            num(
              row.transportation
            );
        }


        return row;
      }
    );


  // ===================================================
  // UPDATE / INSERT
  // ===================================================

  for (
    const row of preparedRows
  ) {

    if (row.id) {

      const {
        id,
        ...payload
      } = row;


      const {
        error,
      } = await supabase
        .from("inventory")
        .update(payload)
        .eq(
          "id",
          id
        );


      if (error) {
        throw error;
      }

    } else {

      const {
        data,
        error,
      } = await supabase
        .from("inventory")
        .insert(row)
        .select()
        .single();


      if (error) {
        throw error;
      }


      row.id =
        data?.id;
    }
  }


  // ===================================================
  // DELETE REMOVED ROWS
  // ===================================================

  const rowsToDelete =
    existingRows.filter(
      (row) =>
        !usedExistingIds.has(
          row.id
        ) &&
        !preparedRows.some(
          (newRow) =>
            newRow.id ===
            row.id
        )
    );


  for (
    const row of rowsToDelete
  ) {

    const {
      error,
    } = await supabase
      .from("inventory")
      .delete()
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
// UPDATE SINGLE INVENTORY ROW
// =====================================================

export async function updateInventory(
  id,
  item
) {

  if (!id) {

    throw new Error(
      "Inventory ID is required."
    );
  }


  const existingRows =
    item.batch_id
      ? await getInventoryByBatch(
          item.batch_id
        )
      : [];


  const existingRow =
    existingRows.find(
      (row) =>
        row.id === id
    );


  const batchId =
    item.batch_id ||
    existingRow?.batch_id ||
    createBatchId();


  const itemValue =
    getPurchaseValue(item);


  const row =
    preparePurchaseItem(
      item,
      item.transportation || 0,
      itemValue,
      itemValue,
      true,
      0,
      batchId,
      item.date,
      item.supplier,
      existingRow
    );


  const {
    id: rowId,
    ...payload
  } = row;


  const {
    data,
    error,
  } = await supabase
    .from("inventory")
    .update(payload)
    .eq(
      "id",
      rowId || id
    )
    .select()
    .single();


  if (error) {
    throw error;
  }


  return data;
}


// =====================================================
// DELETE INVENTORY
// =====================================================

export async function deleteInventory(
  id
) {

  const {
    error,
  } = await supabase
    .from("inventory")
    .delete()
    .eq(
      "id",
      id
    );


  if (error) {
    throw error;
  }
}


// =====================================================
// CALCULATE UNIT COST
// =====================================================
//
// FINAL UNIT COST:
//
// Purchase Price
// + GST
// + Allocated Transportation per unit
//
// This function returns the final landed unit cost.
//

export function calculateUnitCost(
  product = {}
) {

  // ===================================================
  // KIT
  // ===================================================

  if (isKit(product)) {

    const quantity =
      num(product.quantity);

    const kitValue =
      num(
        product.kit_overall_value ??
        product.price
      );

    const gst =
      num(
        product.kit_gst ??
        product.gst
      );

    const transportation =
      num(product.transportation);


    const baseAmount =
      quantity *
      kitValue;


    const gstAmount =
      baseAmount *
      gst /
      100;


    const totalCost =
      baseAmount +
      gstAmount +
      transportation;


    return quantity > 0
      ? totalCost /
        quantity
      : 0;
  }


  // ===================================================
  // NORMAL PRODUCT
  // ===================================================

  const quantity =
    num(product.quantity);

  const price =
    num(product.price);

  const gst =
    num(product.gst);

  const transportation =
    num(product.transportation);


  let baseAmount = 0;


  if (isKg(product)) {

    const totalWeight =
      num(product.total_weight);


    baseAmount =
      totalWeight *
      price;

  } else {

    baseAmount =
      quantity *
      price;
  }


  const gstAmount =
    baseAmount *
    gst /
    100;


  const totalCost =
    baseAmount +
    gstAmount +
    transportation;


  return quantity > 0
    ? totalCost /
      quantity
    : 0;
}


// =====================================================
// GET INVENTORY BY BATCH
// =====================================================

export async function getInventoryByBatch(
  batchId
) {

  if (!batchId) {
    return [];
  }


  const {
    data,
    error,
  } = await supabase
    .from("inventory")
    .select("*")
    .eq(
      "batch_id",
      batchId
    )
    .order(
      "id",
      {
        ascending: true,
      }
    );


  if (error) {

    console.error(
      "GET INVENTORY BY BATCH ERROR:",
      error
    );

    throw error;
  }


  return data || [];
}


// =====================================================
// GET LATEST INVENTORY BY PRODUCT
// =====================================================

export async function getLatestInventoryByProduct(
  productName
) {

  const {
    data,
    error,
  } = await supabase
    .from("inventory")
    .select("*")
    .eq(
      "product_name",
      productName
    )
    .eq(
      "active",
      true
    )
    .order(
      "date",
      {
        ascending: false,
      }
    )
    .order(
      "id",
      {
        ascending: false,
      }
    )
    .limit(1);


  if (error) {
    throw error;
  }


  return data?.[0] || null;
}


// =====================================================
// GET INVENTORY BY PRODUCT
// =====================================================

export async function getInventoryByProduct(
  productName
) {

  const {
    data,
    error,
  } = await supabase
    .from("inventory")
    .select("*")
    .eq(
      "product_name",
      productName
    )
    .eq(
      "active",
      true
    )
    .order(
      "company",
      {
        ascending: true,
      }
    )
    .order(
      "date",
      {
        ascending: true,
      }
    )
    .order(
      "id",
      {
        ascending: true,
      }
    );


  if (error) {
    throw error;
  }


  return data || [];
}


// =====================================================
// GET FIFO INVENTORY PRICE BREAKDOWN
// =====================================================

export async function getFIFOInventoryCost(
  productName,
  company = "",
  specification = "",
  category = "",
  requiredQuantity = 0
) {

  const quantityRequired =
    num(requiredQuantity);


  if (
    !productName ||
    quantityRequired <= 0
  ) {

    return {
      totalCost: 0,
      averagePrice: 0,
      breakdown: [],
      insufficientStock: false,
      remainingRequired: 0,
    };
  }


  // ===================================================
  // GET ALL ACTIVE PURCHASE ROWS
  // ===================================================

  const {
    data,
    error,
  } = await supabase
    .from("inventory")
    .select("*")
    .eq(
      "active",
      true
    )
    .order(
      "date",
      {
        ascending: true,
      }
    )
    .order(
      "id",
      {
        ascending: true,
      }
    );


  if (error) {
    throw error;
  }


  // ===================================================
  // FILTER EXACT PRODUCT
  // ===================================================

  const wantedProduct =
    normalize(productName);

  const wantedCompany =
    normalize(company);

  const wantedSpecification =
    normalize(specification);

  const wantedCategory =
    normalize(category);


  const rows =
    (data || []).filter(
      (row) => {

        if (
          normalize(row.product_name) !==
          wantedProduct
        ) {
          return false;
        }


        if (
          wantedCompany &&
          normalize(row.company) !==
          wantedCompany
        ) {
          return false;
        }


        if (
          wantedSpecification &&
          normalize(row.specification) !==
          wantedSpecification
        ) {
          return false;
        }


        if (
          wantedCategory &&
          normalize(row.category) !==
          wantedCategory
        ) {
          return false;
        }


        return true;
      }
    );


  // ===================================================
  // FIFO
  // ===================================================

  let remainingRequired =
    quantityRequired;

  let totalCost =
    0;

  const breakdown = [];


  for (
    const row of rows
  ) {

    if (
      remainingRequired <= 0
    ) {
      break;
    }


    const purchased =
      num(
        row.purchased_quantity ??
        row.quantity
      );


    const used =
      num(row.used_quantity);


    const available =
      Math.max(
        purchased -
        used,
        0
      );


    if (
      available <= 0
    ) {
      continue;
    }


    const take =
      Math.min(
        available,
        remainingRequired
      );


    // =================================================
    // ACTUAL PURCHASE PRICE
    // =================================================

    const purchasePrice =
      num(row.price);


    // =================================================
    // FINAL STORED UNIT COST
    // =================================================

    let unitCost =
      num(row.unit_cost);


    // =================================================
    // FALLBACK CALCULATION
    // =================================================

    if (unitCost <= 0) {

      if (isKit(row)) {

        const kitValue =
          num(
            row.kit_overall_value ??
            row.price
          );


        const kitGST =
          num(
            row.kit_gst ??
            row.gst
          );


        const gstAmount =
          kitValue *
          kitGST /
          100;


        unitCost =
          kitValue +
          gstAmount +
          num(
            row.transportation
          );

      }

      // =================================================
      // KG
      // =================================================

      else if (isKg(row)) {

        const totalWeight =
          num(row.total_weight);

        const totalPurchaseBase =
          totalWeight *
          purchasePrice;

        const gst =
          num(row.gst);

        const gstAmount =
          totalPurchaseBase *
          gst /
          100;

        const totalPurchaseCost =
          totalPurchaseBase +
          gstAmount +
          num(
            row.transportation
          );


        unitCost =
          purchased > 0
            ? totalPurchaseCost /
              purchased
            : 0;

      }

      // =================================================
      // NORMAL PRODUCT / INVERTER / PANEL
      // =================================================

      else {

        const baseAmount =
          purchasePrice;

        const gst =
          num(row.gst);

        const gstAmount =
          baseAmount *
          gst /
          100;


        unitCost =
          baseAmount +
          gstAmount +
          num(
            row.transportation
          );
      }
    }


    // =================================================
    // COST FOR THIS FIFO PORTION
    // =================================================

    const cost =
      take *
      unitCost;


    totalCost +=
      cost;


    breakdown.push({

      inventory_id:
        row.id,

      batch_id:
        row.batch_id,

      quantity:
        take,

      available_quantity:
        available,

      purchase_price:
        purchasePrice,

      price:
        unitCost,

      unit_cost:
        unitCost,

      cost,

      date:
        row.date,

      supplier:
        row.supplier,

      product_name:
        row.product_name,

      company:
        row.company,

      specification:
        row.specification,

      category:
        row.category,
    });


    remainingRequired -=
      take;
  }


  return {

    totalCost,

    averagePrice:
      quantityRequired > 0
        ? totalCost /
          quantityRequired
        : 0,

    breakdown,

    insufficientStock:
      remainingRequired > 0,

    remainingRequired,
  };
}


// =====================================================
// GET INVENTORY PRODUCTS
// =====================================================
//
// Master Inventory remains the source for
// stock/availability.
//
// Material Consumption pricing uses
// getFIFOInventoryCost().
//

// =====================================================
// GET INVENTORY PRODUCTS
// =====================================================
//
// IMPORTANT:
// Material Consumption FIFO must use the RAW inventory
// rows, not Master Inventory.
//
// Each inventory row is a separate FIFO batch.
// Therefore:
//   Opening Stock  -> keeps opening unit_cost
//   Purchase 1     -> keeps Purchase 1 unit_cost
//   Purchase 2     -> keeps Purchase 2 unit_cost
//
// Master Inventory is still used separately for
// current stock / availability.
// =====================================================

export async function getInventoryProducts() {
  const {
    data,
    error,
  } = await supabase
    .from("inventory")
    .select("*")
    .order("date", {
      ascending: true,
    })
    .order("id", {
      ascending: true,
    });

  if (error) {
    console.error(
      "GET INVENTORY PRODUCTS ERROR:",
      error
    );

    throw error;
  }

  return data || [];
}