    import { supabase } from "./supabase";

    // =====================================================
    // HELPERS
    // =====================================================

    function cleanText(value) {
      return value == null ? "" : String(value).trim();
    }

    function getProductKey(product) {

  const category =
    cleanText(product?.category)
      .toLowerCase();

  // =====================================================
  // PANEL / INVERTER
  // =====================================================
  //
  // Their identity is:
  //
  // Category + Company + Specification
  //
  // Example:
  //
  // Panel | Waaree | 585WP
  // Inverter | Waaree | 3.4 KW
  //
  // Product name is NOT used for these.
  //

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

  // =====================================================
  // ALL OTHER PRODUCTS
  // =====================================================
  //
  // Keep the existing behavior unchanged.
  //

  return [
    cleanText(product?.product_name),
    cleanText(product?.company),
    cleanText(product?.specification),
  ]
    .join("|")
    .toLowerCase();
}

    // =====================================================
// GET TOTAL CONSUMED QUANTITY BY PRODUCT
// =====================================================

async function getConsumedProductMap() {

  const { data, error } = await supabase
    .from("used_inventory")
    .select(`
      id,
      products
    `);

  if (error) {
    console.error(
      "GET CONSUMED PRODUCT MAP ERROR:",
      error
    );

    throw error;
  }

  const consumedMap = new Map();

  for (const record of data || []) {

    const products =
      Array.isArray(record.products)
        ? record.products
        : [];

    for (const product of products) {

      const key =
        getProductKey(product);

      if (!key) {
        continue;
      }

      // =================================================
      // DETERMINE CONSUMPTION QUANTITY
      // =================================================

      const unit =
        cleanText(product.unit)
          .toLowerCase();

      let quantity = 0;

      // KG PRODUCTS
      if (
        unit === "kg" ||
        unit === "kgs"
      ) {

        quantity =
          Number(
            product.total_weight || 0
          );

      }

      // NOS PRODUCTS
      else {

        quantity =
          Number(
            product.quantity || 0
          );

      }

      if (
        !Number.isFinite(quantity) ||
        quantity <= 0
      ) {
        continue;
      }

      consumedMap.set(
        key,
        Number(
          consumedMap.get(key) || 0
        ) + quantity
      );

    }

  }

  return consumedMap;
}

      export async function getMasterInventory() {

  // =====================================================
  // GET ACTUAL MATERIAL CONSUMPTION
  // =====================================================

  const consumedMap =
    await getConsumedProductMap();

  let allRows = [];
  let page = 0;
      const pageSize = 1000;
      let fetching = true;

      // =====================================================
      // FETCH ALL INVENTORY ROWS
      // =====================================================

      while (fetching) {
        const { data, error } = await supabase
          .from("inventory")
          .select("*")
          .order("date", { ascending: true })
          .order("id", { ascending: true })
          .range(
            page * pageSize,
            (page + 1) * pageSize - 1
          );

        if (error) {
          console.error(
            "GET MASTER INVENTORY ERROR:",
            error
          );

          throw error;
        }

        if (data && data.length > 0) {
          allRows = allRows.concat(data);

          if (data.length < pageSize) {
            fetching = false;
          } else {
            page++;
          }
        } else {
          fetching = false;
        }
      }

      // =====================================================
      // GROUP PRODUCTS
      // =====================================================

      const masterMap = new Map();

      allRows.forEach((row) => {

        const company =
          cleanText(row.company);

        const productName =
          cleanText(
            row.product_name ||
            row.item_name ||
            row.name
          );

        const specification =
          cleanText(row.specification);

        if (!productName) {
          return;
        }

        // SAME KEY AS MATERIAL CONSUMPTION
        const key = getProductKey(row);

        // ===================================================
        // CREATE MASTER PRODUCT
        // ===================================================

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
              row.category ||
              "Uncategorized",

            purchase_type:
              row.purchase_type ||
              "",

            // IMPORTANT:
            // Stock quantity is based on purchase unit.
            unit: "Nos",

            purchased_quantity: 0,

            used_quantity: 0,

            // Weight is kept separately.
            total_weight: 0,

            unit_cost:
              Number(
                row.unit_cost ||
                row.price ||
                0
              ),

            inventory_ids: [],

            display_name: "",

            total_quantity: 0,

            remaining: 0,

            stock_status:
              "In Stock",

            stock_value: 0,

            minimum_stock:
              Number(
                row.minimum_stock || 0
              ),

          });

        }

        const master =
          masterMap.get(key);

        // ===================================================
        // PURCHASED QUANTITY
        // ===================================================

        const purchasedQty =
          Number(
            row.purchased_quantity ??
            row.quantity ??
            0
          );

        master.purchased_quantity +=
          Number.isFinite(purchasedQty)
            ? purchasedQty
            : 0;

        // ===================================================
// USED QUANTITY
// ===================================================
//
// IMPORTANT:
//
// Do NOT depend on inventory.used_quantity here.
//
// Master Inventory gets the actual consumed quantity
// directly from used_inventory.
//
// Example:
//
// Inventory:
// Armoured Wire = 2
//
// Material Consumption:
// Customer A = 2
//
// Master Inventory:
//
// Purchased = 2
// Used      = 2
// Remaining = 0
//
// ===================================================

const usedQty =
  Number(
    consumedMap.get(key) || 0
  );

master.used_quantity =
  usedQty;

        // ===================================================
        // WEIGHT
        // ===================================================

        const weight =
          Number(
            row.total_weight ||
            row.weight ||
            0
          );

        master.total_weight +=
          Number.isFinite(weight)
            ? weight
            : 0;

        // ===================================================
        // INVENTORY IDS
        // ===================================================

        master.inventory_ids.push(
          row.id
        );

        // ===================================================
        // UNIT COST
        // ===================================================

        const cost =
          Number(
            row.unit_cost ||
            row.price ||
            0
          );

        if (cost > 0) {
          master.unit_cost = cost;
        }

        // ===================================================
        // MINIMUM STOCK
        // ===================================================

        const minStock =
          Number(
            row.minimum_stock || 0
          );

        if (
          minStock >
          master.minimum_stock
        ) {
          master.minimum_stock =
            minStock;
        }

      });

      // =====================================================
      // CALCULATE FINAL MASTER STOCK
      // =====================================================

      masterMap.forEach((master) => {

        // IMPORTANT:
        // ALWAYS use purchased quantity for stock.
        //
        // Example:
        // Leg 10ft
        // quantity = 2 Nos
        // weight = 30 Kg
        //
        // Stock = 2 Nos
        // NOT 30 Kg

        master.total_quantity =
          master.purchased_quantity;

        master.remaining =
          Math.max(
            0,
            master.purchased_quantity -
            master.used_quantity
          );

        // ===================================================
// DISPLAY NAME
// ===================================================
//
// Panel / Inverter:
// Company + Specification
//
// Example:
// Waaree 585WP
// Waaree 580WP
// Waaree 610WP
// Waaree 3.4 KW
//
// All other products:
// Company + Product + Specification
//

if (
  master.category &&
  (
    String(master.category)
      .trim()
      .toLowerCase() === "panel" ||
    String(master.category)
      .trim()
      .toLowerCase() === "inverter"
  )
) {

  const parts = [];

  if (master.company) {
    parts.push(
      master.company
    );
  }

  if (master.specification) {
    parts.push(
      master.specification
    );
  }

  master.display_name =
    parts.length > 0
      ? parts.join(" ")
      : "Unknown Product";

} else {

  const parts = [];

  if (master.company) {
    parts.push(
      master.company
    );
  }

  if (master.product_name) {
    parts.push(
      master.product_name
    );
  }

  if (master.specification) {
    parts.push(
      master.specification
    );
  }

  master.display_name =
    parts.length > 0
      ? parts.join(" | ")
      : "Unknown Product";
}

        // ===================================================
        // STOCK VALUE
        // ===================================================
        //
        // For Kg products like Leg 10ft:
        //
        // Weight = 30 Kg
        // Qty    = 2
        // Price  = ₹109.75/Kg
        //
        // Value = 30 × 109.75 × 2
        //
        // For normal Nos products:
        //
        // Value = remaining × unit cost
        //
        // ===================================================

        const isKg =
          String(master.unit || "")
            .trim()
            .toLowerCase() === "kg";

        if (isKg) {

          master.stock_value =
            master.total_weight *
            Number(
              master.unit_cost || 0
            );

        } else {

          master.stock_value =
            master.remaining *
            Number(
              master.unit_cost || 0
            );

        }

        // ===================================================
        // STOCK STATUS
        // ===================================================

        if (
          master.remaining <= 0
        ) {

          master.stock_status =
            "Out of Stock";

        } else if (
          master.minimum_stock > 0 &&
          master.remaining <=
            master.minimum_stock
        ) {

          master.stock_status =
            "Low Stock";

        } else {

          master.stock_status =
            "In Stock";

        }

      });

      // =====================================================
      // RETURN SORTED MASTER INVENTORY
      // =====================================================

      return Array.from(
        masterMap.values()
      ).sort(
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
        