import { supabase } from "./supabase";

/* =====================================================
   KIT CONFIGURATIONS
===================================================== */

export const KIT_CONFIGS = {
  "waaree-3kw": {
    id: "waaree-3kw",
    label: "Waaree 3KW Kit",

    panelQty: 6,

    originalInverter: "Waaree",

    components: {
      panel: {
        qty: 6,
        category: "Panel",
      },

      inverter: {
        qty: 1,
        category: "Inverter",
        brand: "Waaree",
      },

      acdb: {
        qty: 1,
        category: "Electrical",
        name: "ACDB",
      },

      dcdb: {
        qty: 1,
        category: "Electrical",
        name: "DCDB",
      },

      earthing: {
        qty: 1,
        category: "Electrical",
        name: "Earthing Kit",
      },
    },
  },

  "waaree-3.5kw": {
    id: "waaree-3.5kw",
    label: "Waaree 3.5KW Kit",

    panelQty: 6,

    originalInverter: "Waaree",

    components: {
      panel: {
        qty: 6,
        category: "Panel",
      },

      inverter: {
        qty: 1,
        category: "Inverter",
        brand: "Waaree",
      },

      acdb: {
        qty: 1,
        category: "Electrical",
        name: "ACDB",
      },

      dcdb: {
        qty: 1,
        category: "Electrical",
        name: "DCDB",
      },

      earthing: {
        qty: 1,
        category: "Electrical",
        name: "Earthing Kit",
      },
    },
  },
};


/* =====================================================
   INVERTER OPTIONS
===================================================== */

export const INVERTER_OPTIONS = [
  {
    id: "waaree",
    label: "Waaree",
    brand: "Waaree",
  },

  {
    id: "luminous",
    label: "Luminous",
    brand: "Luminous",
  },

  {
    id: "polycab",
    label: "Polycab",
    brand: "Polycab",
  },
];


/* =====================================================
   NORMALIZE BRAND
===================================================== */

function clean(value) {
  return value == null
    ? ""
    : String(value).trim();
}


/* =====================================================
   GET INVERTER PRICE
=====================================================

   IMPORTANT:

   This function is only for displaying a price.

   Actual material consumption cost is calculated
   by FIFO in usedInventoryService.js.
===================================================== */

export async function getInverterPrice(
  inverterBrand,
  specification = ""
) {
  if (!inverterBrand) {
    return 0;
  }

  let query = supabase
    .from("inventory")
    .select(
      `
        id,
        unit_cost,
        price,
        date,
        quantity,
        purchased_quantity,
        used_quantity,
        company,
        specification
      `
    )
    .eq("product_name", "Inverter")
    .eq("category", "Inverter")
    .eq("company", inverterBrand)
    .order("date", {
      ascending: true,
    })
    .order("id", {
      ascending: true,
    });

  if (specification) {
    query = query.eq(
      "specification",
      specification
    );
  }

  const {
    data,
    error,
  } = await query;

  if (error) {
    console.warn(
      "Error fetching inverter price:",
      error
    );

    return 0;
  }

  if (!data || data.length === 0) {
    return 0;
  }

  /*
   * Find the first batch which still has stock.
   */

  const availableBatch =
    data.find((row) => {
      const purchased =
        Number(
          row.purchased_quantity ??
          row.quantity ??
          0
        );

      const used =
        Number(
          row.used_quantity ?? 0
        );

      return purchased - used > 0;
    });

  const row =
    availableBatch || data[0];

  return Number(
    row.unit_cost ??
    row.price ??
    0
  );
}

/* =====================================================
   GET KIT PRICE
===================================================== */

export async function getKitPrice(kitId) {
  if (!kitId) {
    console.log("GET KIT PRICE: No kitId");
    return 0;
  }

  const kitConfig = KIT_CONFIGS[kitId];

  if (!kitConfig) {
    console.log(
      "GET KIT PRICE: No config for",
      kitId
    );
    return 0;
  }

  const kitName = clean(
    kitConfig.label
  );

  console.log(
    "GET KIT PRICE:",
    {
      kitId,
      kitName,
    }
  );

  /*
   * Do NOT filter category here.
   *
   * The inventory table may contain the kit under
   * a different category depending on how Add Purchase
   * saved it.
   */

  const { data, error } = await supabase
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
      price,
      unit_cost,
      date,
      purchase_type,
      active
    `)
    .eq(
      "product_name",
      kitName
    )
    .order("date", {
      ascending: true,
    })
    .order("id", {
      ascending: true,
    });

  if (error) {
    console.error(
      "GET KIT PRICE ERROR:",
      error
    );

    return 0;
  }

  console.log(
    "KIT INVENTORY ROWS:",
    data
  );

  if (!data || data.length === 0) {
    console.warn(
      `No inventory row found for kit: ${kitName}`
    );

    return 0;
  }

  /*
   * Find first batch with live stock.
   */

  const availableBatch = data.find(
    (row) => {
      const purchased =
        Number(
          row.purchased_quantity ??
          row.quantity ??
          0
        );

      const used =
        Number(
          row.used_quantity ??
          0
        );

      return (
        purchased - used > 0
      );
    }
  );

  const row =
    availableBatch ||
    data[0];

  const price =
    Number(
      row.unit_cost ??
      row.price ??
      0
    );

  console.log(
    "KIT PRICE FOUND:",
    {
      kitName,
      row,
      price,
    }
  );

  return price;
}

/* =====================================================
   CALCULATE KIT COST ADJUSTMENT
===================================================== */

export async function calculateKitCostAdjustment(
  kitId,
  selectedInverter,
  originalInverter,
  specification = ""
) {
  if (
    !kitId ||
    !selectedInverter ||
    !originalInverter
  ) {
    return {
      selectedPrice: 0,
      originalPrice: 0,
      adjustment: 0,
      newTotalCost: 0,
    };
  }

  const kitConfig =
    KIT_CONFIGS[kitId];

  if (!kitConfig) {
    return {
      selectedPrice: 0,
      originalPrice: 0,
      adjustment: 0,
      newTotalCost: 0,
    };
  }

  const selectedPrice =
    await getInverterPrice(
      selectedInverter,
      specification
    );

  const originalPrice =
    await getInverterPrice(
      originalInverter,
      specification
    );

  const adjustment =
    selectedPrice -
    originalPrice;

  return {
    selectedPrice,
    originalPrice,
    adjustment,
    newTotalCost: adjustment,
  };
}


/* =====================================================
   RETURN ORIGINAL KIT INVERTER
=====================================================

   When:

       Waaree Kit
       +
       Waaree -> Luminous

   the Waaree inverter which was embedded in the kit
   becomes available inventory.

   IMPORTANT:

   We create a NORMAL inventory row.

   It is NOT a kit row.

===================================================== */

export async function returnOriginalInverterToInventory(
  kitData,
  currentUserId = null
) {
  if (!kitData) {
    return null;
  }

  const kitName =
    clean(kitData.kit_name);

  const originalBrand =
    clean(
      kitData.original_kit_inverter
    );

  const replacementBrand =
    clean(
      kitData.kit_inverter_brand
    );

  if (
    !kitName ||
    !originalBrand ||
    !replacementBrand
  ) {
    return null;
  }

  /*
   * Nothing changed.
   */

  if (
    originalBrand.toLowerCase() ===
    replacementBrand.toLowerCase()
  ) {
    return null;
  }

  /*
   * Prevent accidental duplicate return.
   *
   * If the same swap has already been returned,
   * do not create another inventory row.
   */

  if (
    kitData.skip_return === true
  ) {
    return null;
  }

  const specification =
    clean(
      kitData.kit_panel_watt
    );

  const originalPrice =
    await getInverterPrice(
      originalBrand,
      specification
    );

  const inverterData = {
    date:
      new Date()
        .toISOString()
        .split("T")[0],

    supplier:
      `Kit Swap - ${kitName}`,

    product_name:
      "Inverter",

    category:
      "Inverter",

    company:
      originalBrand,

    specification,

    quantity: 1,

    purchased_quantity: 1,

    used_quantity: 0,

    unit: "Nos",

    price:
      originalPrice,

    unit_cost:
      originalPrice,

    cgst: 0,

    sgst: 0,

    purchase_type:
      "Product",

    active: true,

    is_default: false,

    remarks:
      `Returned from ${kitName}. Original inverter ${originalBrand} swapped to ${replacementBrand}.`,
  };

  const {
    data,
    error,
  } =
    await supabase
      .from("inventory")
      .insert(inverterData)
      .select()
      .single();

  if (error) {
    console.error(
      "Error returning inverter to inventory:",
      error
    );

    throw error;
  }

  return data;
}


/* =====================================================
   PROCESS KIT WITH INVERTER SWAP
===================================================== */

export async function processKitWithInverterSwap(
  kitData,
  products
) {
  if (!kitData) {
    return {
      inverterReturned: false,

      costAdjustment: {
        selectedPrice: 0,
        originalPrice: 0,
        adjustment: 0,
        newTotalCost: 0,
      },
    };
  }

  const original =
    clean(
      kitData.original_kit_inverter
    );

  const selected =
    clean(
      kitData.kit_inverter_brand
    );

  let inverterReturned =
    false;

  /*
   * Return original embedded inverter.
   */

  if (
    original &&
    selected &&
    original.toLowerCase() !==
      selected.toLowerCase()
  ) {
    await returnOriginalInverterToInventory(
      kitData
    );

    inverterReturned = true;
  }

  /*
   * Calculate display adjustment.
   */

  const costAdjustment =
    await calculateKitCostAdjustment(
      kitData.kit_id,
      selected,
      original,
      kitData.kit_panel_watt || ""
    );

  return {
    inverterReturned,

    costAdjustment,
  };
}


/* =====================================================
   GET KIT DETAILS WITH COSTS
===================================================== */

export async function getKitDetailsWithCosts(
  kitId
) {
  const kitConfig =
    KIT_CONFIGS[kitId];

  if (!kitConfig) {
    return null;
  }

  /*
   * Actual Kit purchase price
   */
  const kitPrice =
    await getKitPrice(
      kitId
    );

  /*
   * Original inverter price
   */
  const originalInverterPrice =
    await getInverterPrice(
      kitConfig.originalInverter
    );

  return {
    ...kitConfig,

    kitPrice,

    originalInverterPrice,

    totalCost:
      kitPrice,
  };
}