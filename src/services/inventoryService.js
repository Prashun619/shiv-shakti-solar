import { supabase } from "./supabase";

/* ======================================
   CALCULATE PRODUCT BASE
====================================== */

export function calculateProductBase(item) {
  const quantity =
    Number(item.quantity || 0);

  const price =
    Number(item.price || 0);

  if (item.unit === "Kg") {
    const totalWeight =
      Number(item.total_weight || 0);

    return (
      quantity *
      totalWeight *
      price
    );
  }

  return quantity * price;
}

/* ======================================
   CALCULATE PRODUCT GST
====================================== */

export function calculateProductGST(item) {
  const baseAmount =
    calculateProductBase(item);

  const gst =
    Number(item.gst || 0);

  return (
    baseAmount *
    gst /
    100
  );
}

/* ======================================
   GET ALL INVENTORY
====================================== */

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

/* ======================================
   ADD INVENTORY
   Multiple products = multiple rows
   Same batch_id
   Transportation only on first row
====================================== */

export async function addInventory(purchase) {
  const {
    date,
    supplier,
    transportation,
    products,
  } = purchase;

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

  const transportAmount =
    Number(transportation || 0);

  const payload = products.map(
    (item, index) => {
      const quantity =
        Number(item.quantity || 0);

      const price =
        Number(item.price || 0);

      const totalWeight =
        Number(
          item.total_weight || 0
        );

      const gst =
        Number(item.gst || 0);

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

      // Transportation is added only once.
      const rowTransportation =
        index === 0
          ? transportAmount
          : 0;

      const totalAmount =
        baseAmount +
        gstAmount +
        rowTransportation;

      const totalUnits =
  item.unit === "Kg"
    ? quantity *
      Number(item.total_weight || 0)
    : quantity;

const unitCost =
  totalUnits > 0
    ? totalAmount / totalUnits
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
          item.specification || "",

        quantity,

        purchased_quantity:
          quantity,

        used_quantity: 0,

        unit:
          item.unit || "Nos",

        price,

        total_weight:
          totalWeight,

        gst,

        // Keep legacy fields zero.
        cgst: 0,
        sgst: 0,

        transportation:
          rowTransportation,

        total_amount:
          totalAmount,

        unit_cost:
          unitCost,

        remarks:
          item.remarks || "",

        active: true,

        is_default: false,

        batch_id:
          batchId,
      };
    }
  );

  const {
    data,
    error,
  } = await supabase
    .from("inventory")
    .insert(payload)
    .select();

  if (error) {
    throw error;
  }

  return data || [];
}

/* ======================================
   UPDATE INVENTORY
====================================== */

export async function updateInventory(
  id,
  item
) {
  const quantity =
    Number(item.quantity || 0);

  const price =
    Number(item.price || 0);

  const totalWeight =
    Number(item.total_weight || 0);

  const gst =
    Number(item.gst || 0);

  const transportation =
    Number(item.transportation || 0);

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
      Number(item.total_weight || 0)
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

/* ======================================
   DELETE INVENTORY
====================================== */

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

/* ======================================
   CALCULATE UNIT COST
====================================== */

export function calculateUnitCost(
  product
) {
  const quantity =
    Number(product.quantity || 0);

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

  return quantity > 0
    ? totalAmount / quantity
    : 0;
}

/* ======================================
   GET INVENTORY PRODUCTS
====================================== */

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
      batch_id
    `)
    .order("product_name", {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  return data || [];
}

/* ======================================
   GET LATEST INVENTORY BY PRODUCT
====================================== */

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

/* ======================================
   GET INVENTORY BY PRODUCT
====================================== */

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