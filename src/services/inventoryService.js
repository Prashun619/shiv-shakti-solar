  import { supabase } from "./supabase";


  /* ======================================
    GET ALL INVENTORY
  ====================================== */

  export async function getInventory() {

    const { data, error } =
      await supabase
        .from("inventory")
        .select("*")
        .order("date", {
          ascending:false
        });


    if(error)
      throw error;


    return data || [];

  }



  /* ======================================
    ADD INVENTORY
  ====================================== */

  export async function addInventory(item) {


    const quantity =
      Number(item.quantity || 0);


    const price =
      Number(item.price || 0);


    const cgst =
      Number(item.cgst || 0);


    const sgst =
      Number(item.sgst || 0);


    const transportation =
      Number(item.transportation || 0);



    const baseAmount =
      quantity * price;


    const cgstAmount =
      baseAmount * cgst / 100;


    const sgstAmount =
      baseAmount * sgst / 100;



    const totalAmount =
      baseAmount +
      cgstAmount +
      sgstAmount +
      transportation;



    const unitCost =
      quantity > 0
        ? totalAmount / quantity
        : 0;



    const payload = {

      ...item,

      quantity,

      purchased_quantity:
        quantity,

      used_quantity:
        0,

      unit_cost:
        unitCost,

      total_amount:
        totalAmount

    };



    const {data,error} =
      await supabase
        .from("inventory")
        .insert(payload)
        .select()
        .single();



    if(error)
      throw error;


    return data;

  }




  /* ======================================
    UPDATE INVENTORY
  ====================================== */

  export async function updateInventory(
    id,
    item
  ){


    const quantity =
      Number(item.quantity || 0);


    const price =
      Number(item.price || 0);


    const cgst =
      Number(item.cgst || 0);


    const sgst =
      Number(item.sgst || 0);


    const transportation =
      Number(item.transportation || 0);



    const baseAmount =
      quantity * price;


    const totalAmount =
      baseAmount +
      (baseAmount * cgst / 100) +
      (baseAmount * sgst / 100) +
      transportation;



    const unitCost =
      quantity > 0
        ? totalAmount / quantity
        : 0;



    const payload = {

      ...item,

      quantity,

      purchased_quantity:
        quantity,

      unit_cost:
        unitCost,

      total_amount:
        totalAmount

    };



    const {data,error} =
      await supabase
        .from("inventory")
        .update(payload)
        .eq("id",id)
        .select()
        .single();



    if(error)
      throw error;


    return data;

  }




  /* ======================================
    DELETE INVENTORY
  ====================================== */

  export async function deleteInventory(id){


    const {error} =
      await supabase
        .from("inventory")
        .delete()
        .eq("id",id);



    if(error)
      throw error;


  }
  /* ======================================
    CALCULATE UNIT COST
  ====================================== */

  export function calculateUnitCost(product) {


    const quantity =
      Number(product.quantity || 0);


    const price =
      Number(product.price || 0);


    const cgst =
      Number(product.cgst || 0);


    const sgst =
      Number(product.sgst || 0);


    const transportation =
      Number(product.transportation || 0);



    const baseAmount =
      quantity * price;



    const cgstAmount =
      baseAmount * cgst / 100;



    const sgstAmount =
      baseAmount * sgst / 100;



    const totalAmount =
      baseAmount +
      cgstAmount +
      sgstAmount +
      transportation;



    return quantity > 0
      ? totalAmount / quantity
      : 0;

  }
  /* ======================================
    GET INVENTORY PRODUCTS
  ====================================== */

  export async function getInventoryProducts() {


    const { data, error } =

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
    price,
    cgst,
    sgst,
    transportation,
    unit_cost,
    total_amount
  `)
        .order("product_name", {
          ascending:true
        });



    if(error)
      throw error;



    return data || [];

  }

  export async function getLatestInventoryByProduct(productName) {

    const { data, error } = await supabase
      .from("inventory")
      .select("*")
      .eq("product_name", productName)
      .eq("active", true)
      .order("date", { ascending: false })
      .limit(1);

    if (error) throw error;

    return data?.[0] || null;
  }

  /* ======================================
    GET INVENTORY BY PRODUCT
  ====================================== */

  export async function getInventoryByProduct(productName) {

    const { data, error } = await supabase
      .from("inventory")
      .select("*")
      .eq("product_name", productName)
      .eq("active", true)
      .order("company", { ascending: true });

    if (error) throw error;

    return data || [];
  }