import { supabase } from "./supabase";


/* ======================================
   GET MASTER INVENTORY
====================================== */

export async function getMasterInventory() {


  // Get purchased stock

  const {
    data: inventory,
    error: inventoryError
  } = await supabase
    .from("inventory")
    .select(`
      product_name,
      category,
      quantity,
purchased_quantity,
unit,
unit_cost
    `);


  if(inventoryError)
    throw inventoryError;




  // Get used stock

  const {
    data: usedInventory,
    error: usedError
  } = await supabase
    .from("used_inventory")
    .select(`
      products
    `);



  if(usedError)
    throw usedError;




  const stockMap = {};



  // ===============================
  // PURCHASE STOCK
  // ===============================


  inventory.forEach((item)=>{


    const key =
      item.product_name +
      "_" +
      item.category;



    if(!stockMap[key]){


      stockMap[key] = {

        product_name:item.product_name,

        category:item.category,

        unit:item.unit || "",

        total_quantity:0,

        used_quantity:0,

        unit_cost:Number(item.unit_cost || 0)

      };

    }



    stockMap[key].total_quantity +=
  Number(
    item.purchased_quantity ||
    item.quantity ||
    0
  );


  });





  // ===============================
  // USED STOCK
  // ===============================


  usedInventory.forEach((entry)=>{


    const products =
      entry.products || [];



    products.forEach((product)=>{


      const key =
        product.product_name +
        "_" +
        product.category;



      if(!stockMap[key]){


        stockMap[key] = {


          product_name:
            product.product_name,


          category:
            product.category,


          unit:"",


          total_quantity:0,


          used_quantity:0,


          unit_cost:
            Number(product.unit_price || 0)

        };


      }



      stockMap[key].used_quantity +=
        Number(product.quantity || 0);



    });


  });



console.log("MASTER INVENTORY DATA", stockMap);
  return Object.values(stockMap).map((item)=>({


    ...item,


    remaining:
      item.total_quantity -
      item.used_quantity,


    stock_value:
      (
        item.total_quantity -
        item.used_quantity
      )
      *
      item.unit_cost


  }));


}