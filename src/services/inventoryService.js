import { supabase } from "./supabase";

// =====================================================
// PRODUCT BASE
// =====================================================

export function calculateProductBase(item) {
  const quantity = Number(item.quantity || 0);
  const price = Number(item.price || 0);

  if (item.unit === "Kg") {
    const totalWeight = Number(
      item.total_weight || 0
    );

    return totalWeight * price;
  }

  return quantity * price;
}

// =====================================================
// PRODUCT GST
// =====================================================

export function calculateProductGST(item) {
  const baseAmount =
    calculateProductBase(item);

  const gst = Number(item.gst || 0);

  return (baseAmount * gst) / 100;
}

// =====================================================
// KIT BASE
// =====================================================

export function calculateKitBase(item) {
  return Number(
    item.kit_overall_value ||
      item.price ||
      0
  );
}

// =====================================================
// KIT GST
// =====================================================

export function calculateKitGST(item) {
  const base =
    calculateKitBase(item);

  const gst = Number(
    item.kit_gst ??
      item.gst ??
      0
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

function calculateItemBase(item) {
  if (item.type === "Kit") {
    return calculateKitBase(item);
  }

  return calculateProductBase(item);
}

// =====================================================
// ITEM GST
// =====================================================

function calculateItemGST(item) {
  if (item.type === "Kit") {
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
    .order("date", {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  return data || [];
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
// CALCULATE TRANSPORTATION ALLOCATION
//
// Transportation is divided according to QUANTITY.
//
// IMPORTANT:
// For KG products, transportation uses Quantity,
// NOT Total Weight.
//
// Example:
// Rafter Qty = 8
// Panel Qty = 10
// Inverter Qty = 2
// Transportation = ₹100
//
// Total Quantity = 20
//
// Rafter      = 8/20 × 100 = ₹40
// Panel       = 10/20 × 100 = ₹50
// Inverter    = 2/20 × 100 = ₹10
//
// Total Transportation = ₹100
// =====================================================

function calculateTransportationAllocation(
  totalTransportation,
  itemQuantity,
  totalQuantity,
  isLastItem,
  allocatedTransportation
) {
  const transport =
    Number(totalTransportation || 0);

  const quantity =
    Number(itemQuantity || 0);

  const totalQty =
    Number(totalQuantity || 0);

  if (
    transport <= 0 ||
    quantity <= 0 ||
    totalQty <= 0
  ) {
    return 0;
  }

  // Transportation is divided according to quantity.
  //
  // Example:
  // Product A = 10 Qty
  // Product B = 10 Qty
  // Transportation = 100
  //
  // A = 10 / 20 × 100 = 50
  // B = 10 / 20 × 100 = 50
  //
  // For KG products, quantity is used,
  // NOT total_weight.

  if (isLastItem) {
    return (
      transport -
      Number(allocatedTransportation || 0)
    );
  }

  return (
    (quantity / totalQty) *
    transport
  );
}

// =====================================================
// PREPARE PURCHASE ITEM
// =====================================================

// =====================================================
// PREPARE PURCHASE ITEM
// =====================================================

function preparePurchaseItem(
  item,
  transportation,
  itemQuantity,
  totalQuantity,
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
    "Product";

  // ===================================================
  // TRANSPORTATION
  // ===================================================

  const rowTransportation =
    calculateTransportationAllocation(
      transportation,
      itemQuantity,
      totalQuantity,
      isLastItem,
      allocatedTransportation
    );

  // ===================================================
  // KIT
  // ===================================================

  if (type === "Kit") {
    const kitValue =
      Number(
        item.kit_overall_value ||
          item.price ||
          0
      );

    const kitGST =
      Number(
        item.kit_gst ??
          item.gst ??
          0
      );

    const kitGSTAmount =
      (kitValue * kitGST) /
      100;

    const totalAmount =
      kitValue +
      kitGSTAmount +
      rowTransportation;

    const panelQty =
      Number(
        item.kit_panel_qty ??
          item.quantity ??
          0
      );

    const kitName =
      item.kit_name ||
      item.product_name ||
      "";

    return {
      ...(existingRow?.id
        ? { id: existingRow.id }
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
        panelQty,

      purchased_quantity:
        existingRow
          ? Number(
              existingRow.purchased_quantity ??
                existingRow.quantity ??
                panelQty
            )
          : panelQty,

      used_quantity:
        existingRow
          ? Number(
              existingRow.used_quantity ||
                0
            )
          : 0,

      unit:
        "Kit",

      price:
        kitValue,

      total_weight:
        0,

      gst:
        kitGST,

      cgst:
        0,

      sgst:
        0,

      transportation:
        rowTransportation,

      total_amount:
        totalAmount,

      unit_cost:
        panelQty > 0
          ? totalAmount /
            panelQty
          : 0,

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
        panelQty,

      kit_inverter_brand:
        item.kit_inverter_brand ||
        null,

      kit_overall_value:
        kitValue,

      kit_gst:
        kitGST,
    };
  }

  // ===================================================
  // NORMAL PRODUCT
  // ===================================================

  const quantity =
    Number(
      item.quantity || 0
    );

  const price =
    Number(
      item.price || 0
    );

  const totalWeight =
    Number(
      item.total_weight || 0
    );

  const gst =
    Number(
      item.gst || 0
    );

  // ===================================================
  // BASE
  // ===================================================

  const baseAmount =
    calculateProductBase({
      ...item,
      quantity,
      price,
      total_weight:
        totalWeight,
    });

  // ===================================================
  // GST
  // ===================================================

  const gstAmount =
    (baseAmount * gst) /
    100;

  // ===================================================
  // TOTAL
  // ===================================================

  const totalAmount =
    baseAmount +
    gstAmount +
    rowTransportation;

  // ===================================================
  // UNIT COST
  //
  // IMPORTANT:
  // KG product:
  // cost is divided by TOTAL WEIGHT.
  //
  // Quantity remains the number of pieces.
  // ===================================================

  const totalUnits =
    item.unit === "Kg"
      ? totalWeight
      : quantity;

  const unitCost =
    totalUnits > 0
      ? totalAmount /
        totalUnits
      : 0;

  return {
    ...(existingRow?.id
      ? { id: existingRow.id }
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

    // IMPORTANT:
    // For KG:
    // quantity = number of pieces
    // total_weight = combined KG
    quantity,

    purchased_quantity:
      existingRow
        ? Number(
            existingRow.purchased_quantity ??
              existingRow.quantity ??
              quantity
          )
        : quantity,

    used_quantity:
      existingRow
        ? Number(
            existingRow.used_quantity ||
              0
          )
        : 0,

    unit:
      item.unit || "Nos",

    price,

    total_weight:
      totalWeight,

    gst,

    cgst:
      0,

    sgst:
      0,

    transportation:
      rowTransportation,

    total_amount:
      totalAmount,

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
  };
}

// =====================================================
// ADD INVENTORY
//
// Product + Kit can now exist in the SAME purchase.
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
// TOTAL QUANTITY
//
// Transportation is allocated according to Quantity.
// For KG products, Quantity is used,
// NOT Total Weight.
// ===================================================

const totalQuantity =
  products.reduce(
    (sum, item) =>
      sum +
      Number(
        item.quantity ||
          item.kit_panel_qty ||
          0
      ),
    0
  );

// ===================================================
// PREPARE ROWS
// ===================================================

let allocatedTransportation = 0;

const rows =
  products.map(
    (
      item,
      index
    ) => {
      const isLastItem =
        index ===
        products.length - 1;

      const itemQuantity =
  Number(
    item.quantity ??
      item.kit_panel_qty ??
      0
  );

const row =
  preparePurchaseItem(
    item,
    transportation,
    itemQuantity,
    totalQuantity,
    isLastItem,
    allocatedTransportation,
    batchId,
    date,
    supplier
  );

      if (!isLastItem) {
        allocatedTransportation +=
          row.transportation;
      }

      return row;
    }
  );

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
//
// Supports:
//
// Product
// Product
// Kit
// Product
// Kit
//
// in one batch.
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

  // ===================================================
  // GET CURRENT DATABASE BATCH
  // ===================================================

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
// TOTAL QUANTITY
//
// Transportation is allocated according to Quantity.
// For KG products, Quantity is used,
// NOT Total Weight.
// ===================================================

const totalQuantity =
  products.reduce(
    (sum, item) =>
      sum +
      Number(
        item.quantity ||
          item.kit_panel_qty ||
          0
      ),
    0
  );

// ===================================================
// PREPARE NEW BATCH
// ===================================================

let allocatedTransportation = 0;

const preparedRows =
  products.map(
    (
      item,
      index
    ) => {
      const existingRow =
        item.id
          ? existingMap.get(
              item.id
            )
          : null;

      if (
        existingRow?.id
      ) {
        usedExistingIds.add(
          existingRow.id
        );
      }

      const isLastItem =
        index ===
        products.length - 1;

      const itemQuantity =
  Number(
    item.quantity ??
      item.kit_panel_qty ??
      0
  );

const row =
  preparePurchaseItem(
    item,
    transportation,
    itemQuantity,
    totalQuantity,
    isLastItem,
    allocatedTransportation,
    batchId,
    date,
    supplier,
    existingRow
  );

      if (!isLastItem) {
        allocatedTransportation +=
          row.transportation;
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

      // Keep returned ID available if needed.
      row.id =
        data?.id;
    }
  }

  // ===================================================
  // DELETE ROWS REMOVED FROM EDIT FORM
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

  const type =
    item.type ||
    item.purchase_type ||
    "Product";

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

  const itemQuantity =
  Number(
    item.quantity ||
      item.kit_panel_qty ||
      0
  );

const row =
  preparePurchaseItem(
    item,
    item.transportation || 0,
    0,
    itemQuantity,
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

export function calculateUnitCost(
  product
) {
  if (
    product.type === "Kit" ||
    product.purchase_type === "Kit"
  ) {
    const value =
      calculateKitBase(
        product
      );

    const gst =
      calculateKitGST(
        product
      );

    const transport =
      Number(
        product.transportation ||
          0
      );

    const total =
      value +
      gst +
      transport;

    const quantity =
      Number(
        product.kit_panel_qty ??
          product.quantity ??
          0
      );

    return quantity > 0
      ? total / quantity
      : 0;
  }

  const quantity =
    Number(
      product.quantity || 0
    );

  const totalWeight =
    Number(
      product.total_weight ||
        0
    );

  const baseAmount =
    calculateProductBase(
      product
    );

  const gstAmount =
    calculateProductGST(
      product
    );

  const transportation =
    Number(
      product.transportation ||
        0
    );

  const totalAmount =
    baseAmount +
    gstAmount +
    transportation;

  const totalUnits =
    product.unit === "Kg"
      ? totalWeight
      : quantity;

  return totalUnits > 0
    ? totalAmount /
        totalUnits
    : 0;
}

// =====================================================
// GET INVENTORY PRODUCTS
// =====================================================

export async function getInventoryProducts() {
  const {
    data,
    error,
  } = await supabase
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
      price,
      total_weight,
      gst,
      cgst,
      sgst,
      transportation,
      unit_cost,
      total_amount,
      batch_id,
      purchase_type,
      kit_name,
      kit_panel_watt,
      kit_panel_qty,
      kit_inverter_brand,
      kit_overall_value,
      kit_gst
    `)
    .order(
      "product_name",
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
    );

  if (error) {
    throw error;
  }

  return data || [];
}