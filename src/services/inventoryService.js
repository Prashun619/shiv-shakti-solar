import { supabase } from "./supabase";

// =====================================================
// PRODUCT BASE
// =====================================================

export function calculateProductBase(item) {
  const quantity =
    Number(item.quantity || 0);

  const price =
    Number(item.price || 0);

  if (item.unit === "Kg") {
    const totalWeight =
      Number(
        item.total_weight || 0
      );

    return (
      quantity *
      totalWeight *
      price
    );
  }

  return (
    quantity * price
  );
}

// =====================================================
// PRODUCT GST
// =====================================================

export function calculateProductGST(item) {
  const base =
    calculateProductBase(item);

  const gst =
    Number(item.gst || 0);

  return (
    base *
    gst /
    100
  );
}

// =====================================================
// GET INVENTORY
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
// ADD INVENTORY
// =====================================================

export async function addInventory(
  purchase
) {
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
  // ===================================================

  if (
    purchase_type ===
    "Kit"
  ) {
    if (!kit_name) {
      throw new Error(
        "Kit name is required."
      );
    }

    if (!kit_panel_watt) {
      throw new Error(
        "Panel watt is required."
      );
    }

    if (
      Number(
        kit_panel_qty
      ) <= 0
    ) {
      throw new Error(
        "Panel quantity is required."
      );
    }

    if (!kit_inverter_brand) {
      throw new Error(
        "Inverter is required."
      );
    }

    if (
      Number(
        kit_overall_value
      ) <= 0
    ) {
      throw new Error(
        "Overall kit value is required."
      );
    }

    const kitValue =
      Number(
        kit_overall_value
      );

    const kitGST =
      Number(
        kit_gst || 0
      );

    const transport =
      Number(
        transportation || 0
      );

    const kitGSTAmount =
      kitValue *
      kitGST /
      100;

    const totalAmount =
      kitValue +
      kitGSTAmount +
      transport;

    const batchId =
      `PUR${Date.now()}${Math.floor(
        Math.random() * 1000
      )}`;

    // One single inventory row.
    const payload = {
      date,

      supplier,

      product_name:
        kit_name,

      category:
        "Kit",

      company:
        kit_name
          .replace(
            /\s+Kit$/i,
            ""
          )
          .trim(),

      specification:
        kit_panel_watt,

      quantity:
        Number(
          kit_panel_qty
        ),

      purchased_quantity:
        Number(
          kit_panel_qty
        ),

      used_quantity: 0,

      unit: "Kit",

      price:
        kitValue,

      total_weight: 0,

      // Keep product GST equal to
      // overall kit GST for compatibility.
      gst:
        kitGST,

      cgst: 0,

      sgst: 0,

      transportation:
        transport,

      total_amount:
        totalAmount,

      unit_cost:
        Number(
          kit_panel_qty
        ) > 0
          ? totalAmount /
            Number(
              kit_panel_qty
            )
          : 0,

      remarks:
        `Includes Panel, Inverter, ACDB, DCDB and Earthing Kit`,

      active: true,

      is_default: false,

      batch_id:
        batchId,

      purchase_type:
        "Kit",

      kit_name,

      kit_panel_watt,

      kit_panel_qty:
        Number(
          kit_panel_qty
        ),

      kit_inverter_brand,

      kit_overall_value:
        kitValue,

      kit_gst:
        kitGST,

      kit_component:
        false,

      kit_price_locked:
        false,
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
    !Array.isArray(
      products
    ) ||
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

  const transport =
    Number(
      transportation || 0
    );

  const rows =
    products.map(
      (item, index) => {
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
            item.total_weight ||
              0
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
          baseAmount *
          gst /
          100;

        const rowTransportation =
          index === 0
            ? transport
            : 0;

        const totalAmount =
          baseAmount +
          gstAmount +
          rowTransportation;

        const totalUnits =
          item.unit === "Kg"
            ? quantity *
              totalWeight
            : quantity;

        const unitCost =
          totalUnits > 0
            ? totalAmount /
              totalUnits
            : 0;

        return {
          date,

          supplier,

          product_name:
            item.product_name,

          category:
            item.category,

          company:
            item.company || "",

          specification:
            item.specification ||
            "",

          quantity,

          purchased_quantity:
            quantity,

          used_quantity: 0,

          unit:
            item.unit ||
            "Nos",

          price,

          total_weight:
            totalWeight,

          gst,

          cgst: 0,

          sgst: 0,

          transportation:
            rowTransportation,

          total_amount:
            totalAmount,

          unit_cost:
            unitCost,

          remarks:
            item.remarks ||
            "",

          active: true,

          is_default: false,

          batch_id:
            batchId,

          purchase_type:
            "Product",

          kit_name: null,

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

          kit_component:
            false,

          kit_price_locked:
            false,
        };
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
// UPDATE INVENTORY
// =====================================================

export async function updateInventory(
  id,
  item
) {
  const isKit =
    item.purchase_type ===
    "Kit";

  // ===================================================
  // KIT UPDATE
  // ===================================================

  if (isKit) {
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

    const transport =
      Number(
        item.transportation ||
          0
      );

    const kitGSTAmount =
      kitValue *
      kitGST /
      100;

    const totalAmount =
      kitValue +
      kitGSTAmount +
      transport;

    const panelQty =
      Number(
        item.kit_panel_qty ??
          item.quantity ??
          0
      );

    const payload = {
      ...item,

      product_name:
        item.kit_name ||
        item.product_name,

      category:
        "Kit",

      specification:
        item.kit_panel_watt ||
        item.specification ||
        "",

      quantity:
        panelQty,

      purchased_quantity:
        panelQty,

      used_quantity:
        Number(
          item.used_quantity || 0
        ),

      unit: "Kit",

      price:
        kitValue,

      total_weight: 0,

      gst:
        kitGST,

      cgst: 0,

      sgst: 0,

      transportation:
        transport,

      total_amount:
        totalAmount,

      unit_cost:
        panelQty > 0
          ? totalAmount /
            panelQty
          : 0,

      purchase_type:
        "Kit",

      kit_panel_qty:
        panelQty,

      kit_overall_value:
        kitValue,

      kit_gst:
        kitGST,

      kit_component:
        false,

      kit_price_locked:
        false,
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

  const transportation =
    Number(
      item.transportation || 0
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
    baseAmount *
    gst /
    100;

  const totalAmount =
    baseAmount +
    gstAmount +
    transportation;

  const totalUnits =
    item.unit === "Kg"
      ? quantity *
        totalWeight
      : quantity;

  const unitCost =
    totalUnits > 0
      ? totalAmount /
        totalUnits
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

    purchase_type:
      "Product",

    kit_name: null,

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

    kit_component:
      false,

    kit_price_locked:
      false,
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
// UNIT COST
// =====================================================

export function calculateUnitCost(
  product
) {
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
      ? quantity *
        totalWeight
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
      kit_gst,
      kit_component,
      kit_price_locked
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
// LATEST INVENTORY
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
// INVENTORY BY PRODUCT
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