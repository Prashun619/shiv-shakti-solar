import { supabase } from "./supabase";


/* ======================================
   GET MASTER INVENTORY
====================================== */

export async function getMasterInventory() {

  // ===============================
  // PURCHASED INVENTORY
  // ===============================

  const { data: inventory, error: inventoryError } =
    await supabase
      .from("inventory")
      .select("*");

  if (inventoryError) throw inventoryError;

  // ===============================
  // USED INVENTORY
  // ===============================

  const { data: usedInventory, error: usedError } =
    await supabase
      .from("used_inventory")
      .select("products");

  if (usedError) throw usedError;

  const stockMap = {};

  // Map Inventory ID -> Product Key
  const inventoryKeyMap = {};

  // ===============================
  // PURCHASED STOCK
  // ===============================

  inventory.forEach((item) => {

    const key = [
      item.company || "",
      item.specification || "",
      item.product_name,
      item.category,
    ].join("_");

    inventoryKeyMap[item.id] = key;

    if (!stockMap[key]) {

      stockMap[key] = {

        display_name: item.company
          ? `${item.company} ${item.specification || ""} ${item.product_name}`
          : item.product_name,

        company: item.company || "",

        specification: item.specification || "",

        product_name: item.product_name,

        category: item.category,

        unit: item.unit || "",

        total_quantity: 0,

        used_quantity: 0,

        stock_value: 0,

      };

    }

    const purchased =
      Number(
        item.purchased_quantity ??
        item.quantity ??
        0
      );

    stockMap[key].total_quantity += purchased;

    stockMap[key].stock_value +=
      purchased *
      Number(item.unit_cost || 0);

  });

  // ===============================
  // USED STOCK
  // ===============================

  usedInventory.forEach((record) => {

    (record.products || []).forEach((product) => {

      const key =
        inventoryKeyMap[product.product_id];

      if (key && stockMap[key]) {

        stockMap[key].used_quantity +=
          Number(product.quantity || 0);

      }

    });

  });

  // ===============================
  // FINAL
  // ===============================

  return Object.values(stockMap).map((item) => ({

    ...item,

    remaining:
      item.total_quantity -
      item.used_quantity,

  }));

}