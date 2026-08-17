import { supabase } from "./supabase";

// =====================================================
// PRODUCT BASE
// =====================================================

export function calculateProductBase(item) {
  const quantity = Number(item.quantity || 0);
  const price = Number(item.price || 0);

  // For KG:
  // Total Weight is the combined weight of all pieces.
  //
  // Example:
  // Qty = 8
  // Total Weight = 72 Kg
  // Price = 109.75/Kg
  //
  // Base = 72 × 109.75
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
// GET ALL INVENTORY
// =====================================================

export async function getInventory() {
  const { data, error } = await supabase
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
// ADD INVENTORY
// =====================================================

export async function addInventory(purchase) {
  const {
    date,
    supplier,
    transportation = 0,
    purchase_type = "Product",
    products = [],
    kit_name = null,
    kit_panel_watt = null,
    kit_panel_qty = 0,
    kit_inverter_brand = null,
    kit_overall_value = 0,
    kit_gst = 0,
  } = purchase;

  // ===================================================
  // SOLAR KIT
  // ONE INVENTORY ROW ONLY
  // ===================================================

  if (purchase_type === "Kit") {
    if (!kit_name) {
      throw new Error("Kit name is required.");
    }

    if (!kit_panel_watt) {
      throw new Error("Panel watt is required.");
    }

    if (Number(kit_panel_qty || 0) <= 0) {
      throw new Error("Panel quantity is required.");
    }

    if (!kit_inverter_brand) {
      throw new Error("Inverter is required.");
    }

    const kitValue = Number(
      kit_overall_value || 0
    );

    if (kitValue <= 0) {
      throw new Error(
        "Overall kit value is required."
      );
    }

    const kitGST = Number(kit_gst || 0);

    const transport = Number(
      transportation || 0
    );

    const kitGSTAmount =
      (kitValue * kitGST) / 100;

    const totalAmount =
      kitValue +
      kitGSTAmount +
      transport;

    const panelQty = Number(
      kit_panel_qty || 0
    );

    const batchId =
      `PUR${Date.now()}${Math.floor(
        Math.random() * 1000
      )}`;

    const payload = {
      date,
      supplier,

      product_name: kit_name,
      category: "Kit",

      company: kit_name
        .replace(/\s+Kit$/i, "")
        .trim(),

      specification: kit_panel_watt,

      quantity: panelQty,

      purchased_quantity: panelQty,

      used_quantity: 0,

      unit: "Kit",

      price: kitValue,

      total_weight: 0,

      gst: kitGST,

      cgst: 0,
      sgst: 0,

      transportation: transport,

      total_amount: totalAmount,

      unit_cost:
        panelQty > 0
          ? totalAmount / panelQty
          : 0,

      remarks:
        "Includes Panel, Inverter, ACDB, DCDB and Earthing Kit",

      active: true,

      is_default: false,

      batch_id: batchId,

      purchase_type: "Kit",

      kit_name,

      kit_panel_watt,

      kit_panel_qty: panelQty,

      kit_inverter_brand,

      kit_overall_value: kitValue,

      kit_gst: kitGST,
    };

    const {
      data,
      error,
    } = await supabase
      .from("inventory")
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  // ===================================================
  // NORMAL MULTIPLE PRODUCTS
  // ===================================================

  if (
    !Array.isArray(products) ||
    products.length === 0
  ) {
    throw new Error(
      "At least one product is required."
    );
  }

  const batchId =
    `PUR${Date.now()}${Math.floor(
      Math.random() * 1000
    )}`;

  const transport = Number(
    transportation || 0
  );

  // ---------------------------------------------------
  // PREPARE ALL PRODUCTS FIRST
  // ---------------------------------------------------

  const preparedProducts =
    products.map((item) => {
      const quantity = Number(
        item.quantity || 0
      );

      const price = Number(
        item.price || 0
      );

      const totalWeight = Number(
        item.total_weight || 0
      );

      const gst = Number(
        item.gst || 0
      );

      const baseAmount =
        calculateProductBase({
          ...item,
          quantity,
          price,
          total_weight: totalWeight,
        });

      const gstAmount =
        (baseAmount * gst) / 100;

      return {
        item,
        quantity,
        price,
        totalWeight,
        gst,
        baseAmount,
        gstAmount,
      };
    });

  // ---------------------------------------------------
  // TOTAL BASE
  // ---------------------------------------------------

  const totalBaseAmount =
    preparedProducts.reduce(
      (sum, row) =>
        sum + row.baseAmount,
      0
    );

  // ---------------------------------------------------
  // CREATE ROWS
  // ---------------------------------------------------

  const rows = preparedProducts.map(
    (row, index) => {
      let rowTransportation = 0;

      // -------------------------------------------------
      // PROPORTIONAL TRANSPORTATION
      // -------------------------------------------------

      if (
  transport > 0 &&
  preparedProducts.length > 0
) {
  rowTransportation =
    transport /
    preparedProducts.length;
}

      // -------------------------------------------------
      // ROUNDING CORRECTION
      //
      // Last row receives the remaining amount so
      // allocated transportation is EXACTLY equal
      // to entered transportation.
      // -------------------------------------------------

      if (
  index ===
  preparedProducts.length - 1
) {
  const equalShare =
    preparedProducts.length > 0
      ? transport /
        preparedProducts.length
      : 0;

  const previouslyAllocated =
    equalShare *
    (preparedProducts.length - 1);

  rowTransportation =
    transport -
    previouslyAllocated;
}

      const totalAmount =
        row.baseAmount +
        row.gstAmount +
        rowTransportation;

      // -------------------------------------------------
      // UNIT COST
      //
      // KG = total cost / total weight
      // Other = total cost / quantity
      // -------------------------------------------------

      const totalUnits =
        row.item.unit === "Kg"
          ? row.totalWeight
          : row.quantity;

      const unitCost =
        totalUnits > 0
          ? totalAmount / totalUnits
          : 0;

      return {
        date,

        supplier,

        product_name:
          row.item.product_name,

        category:
          row.item.category,

        company:
          row.item.company || "",

        specification:
          row.item.specification || "",

        quantity:
          row.quantity,

        purchased_quantity:
          row.quantity,

        used_quantity: 0,

        unit:
          row.item.unit || "Nos",

        price:
          row.price,

        total_weight:
          row.totalWeight,

        gst:
          row.gst,

        cgst: 0,
        sgst: 0,

        transportation:
          rowTransportation,

        total_amount:
          totalAmount,

        unit_cost:
          unitCost,

        remarks:
          row.item.remarks || "",

        active: true,

        is_default: false,

        batch_id: batchId,

        purchase_type: "Product",

        kit_name: null,

        kit_panel_watt: null,

        kit_panel_qty: 0,

        kit_inverter_brand: null,

        kit_overall_value: 0,

        kit_gst: 0,
      };
    }
  );

  // ---------------------------------------------------
  // INSERT
  // ---------------------------------------------------

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
// Used when multiple products were added in one go.
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
      "At least one product is required."
    );
  }

  const transport =
    Number(
      transportation || 0
    );

  const preparedProducts =
    products.map((item) => {
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

      const baseAmount =
        calculateProductBase({
          ...item,
          quantity,
          price,
          total_weight:
            totalWeight,
        });

      const gstAmount =
        calculateProductGST({
          ...item,
          quantity,
          price,
          total_weight:
            totalWeight,
          gst,
        });

      return {
        ...item,
        quantity,
        price,
        totalWeight,
        gst,
        baseAmount,
        gstAmount,
      };
    });

  // ===================================================
  // EQUAL TRANSPORTATION
  // ===================================================

  const productCount =
    preparedProducts.length;

  const equalTransportation =
    productCount > 0
      ? transport / productCount
      : 0;

  // ===================================================
  // UPDATE EACH ROW
  // ===================================================

  for (
    let index = 0;
    index < preparedProducts.length;
    index++
  ) {
    const row =
      preparedProducts[index];

    let rowTransportation =
      equalTransportation;

    // Rounding correction on final row
    if (
      index ===
      preparedProducts.length - 1
    ) {
      const allocatedBeforeLast =
        equalTransportation *
        (
          productCount - 1
        );

      rowTransportation =
        transport -
        allocatedBeforeLast;
    }

    const totalAmount =
      row.baseAmount +
      row.gstAmount +
      rowTransportation;

    const totalUnits =
      row.unit === "Kg"
        ? row.totalWeight
        : row.quantity;

    const unitCost =
      totalUnits > 0
        ? totalAmount /
          totalUnits
        : 0;

    if (!row.id) {
      throw new Error(
        "Inventory row ID is missing."
      );
    }

    const payload = {
      date,

      supplier,

      product_name:
        row.product_name,

      category:
        row.category,

      company:
        row.company || "",

      specification:
        row.specification || "",

      quantity:
        row.quantity,

      purchased_quantity:
        row.quantity,

      used_quantity:
        Number(
          row.used_quantity || 0
        ),

      unit:
        row.unit || "Nos",

      price:
        row.price,

      total_weight:
        row.totalWeight,

      gst:
        row.gst,

      cgst: 0,
      sgst: 0,

      transportation:
        rowTransportation,

      total_amount:
        totalAmount,

      unit_cost:
        unitCost,

      remarks:
        row.remarks || "",

      active:
        row.active ?? true,

      is_default:
        row.is_default ?? false,

      batch_id:
        batchId,

      purchase_type:
        "Product",

      kit_name: null,
      kit_panel_watt: null,
      kit_panel_qty: 0,
      kit_inverter_brand: null,
      kit_overall_value: 0,
      kit_gst: 0,
    };

    const {
      error,
    } = await supabase
      .from("inventory")
      .update(payload)
      .eq("id", row.id);

    if (error) {
      throw error;
    }
  }

  return true;
}

// =====================================================
// UPDATE INVENTORY
// =====================================================

export async function updateInventory(
  id,
  item
) {
  const isKit =
    item.purchase_type === "Kit";

  // ===================================================
  // KIT UPDATE
  // ===================================================

  if (isKit) {
    const kitValue = Number(
      item.kit_overall_value ||
        item.price ||
        0
    );

    const kitGST = Number(
      item.kit_gst ??
        item.gst ??
        0
    );

    const transportation =
      Number(
        item.transportation || 0
      );

    const kitGSTAmount =
      (kitValue * kitGST) / 100;

    const totalAmount =
      kitValue +
      kitGSTAmount +
      transportation;

    const panelQty = Number(
      item.kit_panel_qty ??
        item.quantity ??
        0
    );

    const payload = {
      ...item,

      product_name:
        item.kit_name ||
        item.product_name,

      category: "Kit",

      specification:
        item.kit_panel_watt ||
        item.specification ||
        "",

      quantity: panelQty,

      purchased_quantity:
        panelQty,

      unit: "Kit",

      price: kitValue,

      total_weight: 0,

      gst: kitGST,

      cgst: 0,
      sgst: 0,

      transportation,

      total_amount: totalAmount,

      unit_cost:
        panelQty > 0
          ? totalAmount / panelQty
          : 0,

      purchase_type: "Kit",

      kit_panel_qty:
        panelQty,

      kit_overall_value:
        kitValue,

      kit_gst:
        kitGST,
    };

    const {
      data,
      error,
    } = await supabase
      .from("inventory")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  // ===================================================
  // NORMAL PRODUCT UPDATE
  // ===================================================

  const quantity = Number(
    item.quantity || 0
  );

  const price = Number(
    item.price || 0
  );

  const totalWeight = Number(
    item.total_weight || 0
  );

  const gst = Number(
    item.gst || 0
  );

  const transportation =
    Number(
      item.transportation || 0
    );

  const baseAmount =
    calculateProductBase({
      ...item,
      quantity,
      price,
      total_weight: totalWeight,
    });

  const gstAmount =
    (baseAmount * gst) / 100;

  const totalAmount =
    baseAmount +
    gstAmount +
    transportation;

  const totalUnits =
    item.unit === "Kg"
      ? totalWeight
      : quantity;

  const unitCost =
    totalUnits > 0
      ? totalAmount / totalUnits
      : 0;

  const payload = {
    ...item,

    quantity,

    purchased_quantity:
      quantity,

    price,

    total_weight:
      totalWeight,

    gst,

    cgst: 0,
    sgst: 0,

    transportation,

    unit_cost:
      unitCost,

    total_amount:
      totalAmount,

    purchase_type: "Product",

    kit_name: null,

    kit_panel_watt: null,

    kit_panel_qty: 0,

    kit_inverter_brand: null,

    kit_overall_value: 0,

    kit_gst: 0,
  };

  const {
    data,
    error,
  } = await supabase
    .from("inventory")
    .update(payload)
    .eq("id", id)
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
    .eq("id", id);

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
  const quantity = Number(
    product.quantity || 0
  );

  const totalWeight = Number(
    product.total_weight || 0
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
      product.transportation || 0
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
    ? totalAmount / totalUnits
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
    .order("product_name", {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  return data || [];
}

// =====================================================
// GET INVENTORY BY BATCH
// =====================================================

export async function getInventoryByBatch(batchId) {
  if (!batchId) {
    return [];
  }

  const {
    data,
    error,
  } = await supabase
    .from("inventory")
    .select("*")
    .eq("batch_id", batchId)
    .order("id", {
      ascending: true,
    });

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
    .eq("active", true)
    .order("date", {
      ascending: false,
    })
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
    .eq("active", true)
    .order("company", {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  return data || [];
}