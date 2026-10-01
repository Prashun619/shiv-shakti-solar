import { supabase } from "./supabase";

// =====================================================
// HELPERS
// =====================================================

function cleanText(value) {
  return value == null ? "" : String(value).trim();
}

function getProductKey(product) {
  const category =
    cleanText(product?.category).toLowerCase();

  const productName =
    cleanText(
      product?.product_name ||
      product?.item_name ||
      product?.name
    );

  // =====================================================
  // C CHANNEL
  // =====================================================
  //
  // C Channel identity is:
  //
  // Product + Company + Specification + Length
  //
  // This keeps:
  //
  // C Channel 140x50x2 mm - 9 ft
  // C Channel 140x50x2 mm - 21 ft
  //
  // as completely separate stock entries.
  //

  if (
    productName
      .toLowerCase()
      .includes("c channel")
  ) {
    const length =
      cleanText(
        product?.length_ft ??
        product?.length
      );

    return [
      productName,
      cleanText(product?.company),
      cleanText(product?.specification),
      length
    ]
      .join("|")
      .toLowerCase();
  }

  // =====================================================
  // PANEL / INVERTER
  // =====================================================

  if (
    category === "panel" ||
    category === "inverter"
  ) {
    return [
      category,
      cleanText(product?.company),
      cleanText(product?.specification)
    ]
      .join("|")
      .toLowerCase();
  }

  // =====================================================
  // ALL OTHER PRODUCTS
  // =====================================================

  return [
    productName,
    cleanText(product?.company),
    cleanText(product?.specification)
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

      const productName =
        cleanText(product.product_name)
          .toLowerCase();

      // =================================================
      // C CHANNEL
      // =================================================
      //
      // C Channel quantity is ALWAYS counted in PIECES.
      //
      // IMPORTANT:
      // Do NOT use total_weight here.
      //
      // Example:
      // 2 pieces of 9ft C Channel
      // consumption = 2 pieces
      //
      // Master stock later converts:
      // 2 pieces × 9ft = 18ft
      //

      if (
        productName.includes("c channel")
      ) {
        quantity =
          Number(
            product.quantity || 0
          );
      }

      // =================================================
      // KG PRODUCTS
      // =================================================

      else if (
        unit === "kg" ||
        unit === "kgs"
      ) {
        quantity =
          Number(
            product.total_weight || 0
          );
      }

      // =================================================
      // NORMAL NOS PRODUCTS
      // =================================================

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

// =====================================================
// GET MASTER INVENTORY
// =====================================================

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
      .order("date", {
        ascending: true
      })
      .order("id", {
        ascending: true
      })
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

    if (
      data &&
      data.length > 0
    ) {
      allRows =
        allRows.concat(data);

      if (
        data.length < pageSize
      ) {
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

  const masterMap =
    new Map();

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
    const key =
      getProductKey(row);

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

        length_ft:
          row.length_ft ??
          row.length ??
          null,

        category:
          row.category ||
          "Uncategorized",

        purchase_type:
          row.purchase_type ||
          "",

          unit:
  row.unit ||
  "Nos",
  
        // Stock quantity is based on purchase unit.
        //
        // For C Channel:
        // purchased_quantity = pieces
        // remaining = feet
        //
        

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
          )
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
      Number.isFinite(
        purchasedQty
      )
        ? purchasedQty
        : 0;

    // ===================================================
    // USED QUANTITY
    // ===================================================
    //
    // Master Inventory gets the actual consumed
    // quantity directly from used_inventory.
    //
    // For C Channel this is PIECES.
    //
    // Example:
    //
    // Purchased = 14 pieces
    // Used      = 2 pieces
    // Remaining = 12 pieces
    //
    // Then final C Channel stock:
    //
    // 12 × 9ft = 108 ft
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
//
// C CHANNEL:
// unit_cost is ₹/ft.
//
// Normal products:
// unit_cost is ₹/unit.
// ===================================================

const rowIsCChannel =
  String(row.product_name || "")
    .trim()
    .toLowerCase()
    .includes("c channel");

if (rowIsCChannel) {
  const quantity =
    Number(
      row.purchased_quantity ??
      row.quantity ??
      0
    );

  const lengthFt =
    Number(
      row.length_ft ??
      row.length ??
      0
    );

  const totalFeet =
    quantity * lengthFt;

  const totalWeight =
    Number(
      row.total_weight || 0
    );

  const pricePerKg =
    Number(
      row.price || 0
    );

  const gst =
    Number(
      row.gst || 0
    );

  const transportation =
    Number(
      row.transportation || 0
    );

  const materialCost =
    totalWeight *
    pricePerKg;

  const gstAmount =
    materialCost *
    gst /
    100;

  const totalCost =
    materialCost +
    gstAmount +
    transportation;

  master.unit_cost =
    totalFeet > 0
      ? totalCost / totalFeet
      : Number(
          row.unit_cost || 0
        );
} else {
  const cost =
    Number(
      row.unit_cost ||
      row.price ||
      0
    );

  if (cost > 0) {
    master.unit_cost =
      cost;
  }
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
    // ===================================================
    // PURCHASED QUANTITY
    // ===================================================

    master.total_quantity =
      master.purchased_quantity;

    // ===================================================
    // REMAINING PIECES
    // ===================================================

    const baseRemaining =
      Math.max(
        0,
        Number(
          master.purchased_quantity || 0
        ) -
        Number(
          master.used_quantity || 0
        )
      );

    // ===================================================
    // C CHANNEL STOCK
    // ===================================================
    //
    // C Channel inventory quantity is stored as PIECES.
    //
    // Master Inventory / Consumption stock is FEET.
    //
    // Example:
    //
    // 14 pieces × 9ft  = 126ft
    // 5 pieces × 21ft  = 105ft
    //
    // Weight is NEVER used here.
    //

    const isCChannel =
      master.product_name
        ?.toLowerCase()
        .includes("c channel");

    if (
      isCChannel &&
      master.length_ft != null &&
      master.length_ft !== ""
    ) {
      master.remaining =
        baseRemaining *
        Number(
          master.length_ft
        );
    } else {
      // =================================================
      // NORMAL PRODUCTS
      // =================================================

      master.remaining =
        baseRemaining;
    }

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
        String(
          master.category
        )
          .trim()
          .toLowerCase() ===
          "panel" ||
        String(
          master.category
        )
          .trim()
          .toLowerCase() ===
          "inverter"
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

      // =================================================
      // C CHANNEL LENGTH
      // =================================================

      if (
        master.product_name
          ?.toLowerCase()
          .includes("c channel") &&
        master.length_ft != null &&
        master.length_ft !== ""
      ) {
        parts.push(
          `${master.length_ft} ft`
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
    // For C Channel, remaining is already FEET.
    //
    // For normal Nos products, remaining is Nos.
    //
    // Weight is kept separately and is not used for
    // C Channel stock quantity.
    //

    const isKg =
      String(
        master.unit || ""
      )
        .trim()
        .toLowerCase() ===
      "kg";

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
          sensitivity: "base"
        }
      )
  );
}