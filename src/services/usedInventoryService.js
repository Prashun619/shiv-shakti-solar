import { supabase } from "./supabase";


/* ======================================
   GET USED INVENTORY
====================================== */

export async function getUsedInventory() {

  const { data, error } = await supabase
    .from("used_inventory")
    .select(`
      *,
      customers!customer_id(
        customer_name
      )
    `)
    .order("id", {
      ascending:false
    });


  if(error)
    throw error;


  return data || [];

}



/* ======================================
   GET SINGLE USED INVENTORY
====================================== */

export async function getUsedInventoryById(id) {


  const {data,error} =
    await supabase
      .from("used_inventory")
      .select("*")
      .eq("id",id)
      .single();


  if(error)
    throw error;


  return data;

}





/* ======================================
   CALCULATE TOTAL PLANT COST
====================================== */

function calculateTotalPlantCost(form){


return (

Number(form.material_cost || 0)

+

Number(form.installation_charges || 0)

+

Number(form.civil_material || 0)

+

Number(form.vendor_charges || 0)

+

Number(form.agreement_charges || 0)

+

Number(form.je_charges || 0)

+

Number(form.name_change_charges || 0)

+

Number(form.load_extension_charges || 0)

+

Number(form.net_metering_charges || 0)

);


}





/* ======================================
   FIFO INVENTORY DEDUCTION
====================================== */

async function deductInventory(products) {

  for (const product of products) {

    let requiredQty =
      Number(product.quantity || 0);

    if (requiredQty <= 0)
      continue;


    // =================================================
    // FIND ALL MATCHING INVENTORY ENTRIES
    // =================================================

    const { data: batches, error } =
      await supabase
        .from("inventory")
        .select("*")
        .eq(
          "product_name",
          product.product_name
        )
        .eq(
          "category",
          product.category
        )
        .eq(
          "company",
          product.company || ""
        )
        .eq(
          "specification",
          product.specification || ""
        )
        .order(
          "date",
          {
            ascending: true
          }
        );


    if (error)
      throw error;


    // =================================================
    // SECONDARY SORT BY ID
    // =================================================

    batches.sort((a, b) => {

      const dateA =
        new Date(a.date || 0).getTime();

      const dateB =
        new Date(b.date || 0).getTime();

      if (dateA !== dateB)
        return dateA - dateB;

      return String(a.id)
        .localeCompare(
          String(b.id)
        );

    });


    // =================================================
    // TOTAL AVAILABLE
    // =================================================

    const totalAvailable =
      batches.reduce(
        (sum, batch) =>
          sum +
          Number(batch.quantity || 0),
        0
      );


    if (
      totalAvailable <
      requiredQty
    ) {

      throw new Error(
        `${product.product_name} has only ${totalAvailable} ${product.unit || ""} in stock`
      );

    }


    // =================================================
    // FIFO ALLOCATIONS
    // =================================================

    const allocations = [];


    for (
      const batch of batches
    ) {

      if (requiredQty <= 0)
        break;


      const batchQty =
        Number(
          batch.quantity || 0
        );


      if (batchQty <= 0)
        continue;


      const deductQty =
        Math.min(
          batchQty,
          requiredQty
        );


      const unitCost =
        Number(
          batch.unit_cost || 0
        );


      allocations.push({

        inventory_id:
          batch.id,

        quantity:
          deductQty,

        unit_cost:
          unitCost,

        total:
          deductQty *
          unitCost,

      });


      const newQuantity =
        batchQty -
        deductQty;


      const newUsedQuantity =
        Number(
          batch.used_quantity || 0
        ) +
        deductQty;


      const newTotalAmount =
        newQuantity *
        unitCost;


      const {
        error: updateError
      } =
        await supabase
          .from("inventory")
          .update({

            quantity:
              newQuantity,

            used_quantity:
              newUsedQuantity,

            total_amount:
              newTotalAmount,

          })
          .eq(
            "id",
            batch.id
          );


      if (updateError)
        throw updateError;


      requiredQty -=
        deductQty;

    }


    // =================================================
    // SAVE EXACT FIFO ALLOCATION
    //
    // This allows EDIT / DELETE to restore the
    // exact inventory rows later.
    // =================================================

    product.fifo_allocations =
      allocations;


    // =================================================
    // TOTAL MATERIAL COST
    // =================================================

    product.total =
      allocations.reduce(
        (sum, allocation) =>
          sum +
          Number(
            allocation.total || 0
          ),
        0
      );

  }

}


/* ======================================
   ADD USED INVENTORY
====================================== */

export async function addUsedInventory(form){



await deductInventory(
form.products || []
);

const fifoMaterialCost =
  (form.products || []).reduce(
    (sum, product) =>
      sum +
      Number(product.total || 0),
    0
  );


const payload = {


customer_id:
form.customer_id,


project_no:
form.project_no,


plant_size:
form.plant_size,


location:
form.location,



products:
form.products,



material_cost:
fifoMaterialCost,



installation_charges:
Number(form.installation_charges || 0),



civil_material:
Number(form.civil_material || 0),



vendor_charges:
Number(form.vendor_charges || 0),



agreement_charges:
Number(form.agreement_charges || 0),



je_charges:
Number(form.je_charges || 0),



name_change_charges:
Number(form.name_change_charges || 0),



load_extension_charges:
Number(form.load_extension_charges || 0),



net_metering_charges:
Number(form.net_metering_charges || 0),



total_plant_cost:
fifoMaterialCost +
Number(form.installation_charges || 0) +
Number(form.civil_material || 0) +
Number(form.vendor_charges || 0) +
Number(form.agreement_charges || 0) +
Number(form.je_charges || 0) +
Number(form.name_change_charges || 0) +
Number(form.load_extension_charges || 0) +
Number(form.net_metering_charges || 0),


remarks:
form.remarks || "",



additional_charges:{


installation_charges:
Number(form.installation_charges || 0),


civil_material:
Number(form.civil_material || 0),


vendor_charges:
Number(form.vendor_charges || 0),


agreement_charges:
Number(form.agreement_charges || 0),


je_charges:
Number(form.je_charges || 0),


name_change_charges:
Number(form.name_change_charges || 0),


load_extension_charges:
Number(form.load_extension_charges || 0),


net_metering_charges:
Number(form.net_metering_charges || 0)

}


};




const {data,error} =
await supabase
.from("used_inventory")
.insert(payload)
.select()
.single();



if(error)
throw error;



return data;


}








/* ======================================
   RESTORE INVENTORY
====================================== */

async function restoreInventory(products) {

  for (const product of products) {

    // =================================================
    // NEW METHOD:
    // Restore exact inventory rows using
    // saved FIFO allocations.
    // =================================================

    if (
      Array.isArray(
        product.fifo_allocations
      ) &&
      product.fifo_allocations.length > 0
    ) {

      for (
        const allocation
        of product.fifo_allocations
      ) {

        const inventoryId =
          allocation.inventory_id;

        const restoreQty =
          Number(
            allocation.quantity || 0
          );


        if (
          !inventoryId ||
          restoreQty <= 0
        )
          continue;


        const {
          data: inventory,
          error
        } =
          await supabase
            .from("inventory")
            .select("*")
            .eq(
              "id",
              inventoryId
            )
            .single();


        if (error)
          throw error;


        const currentQuantity =
          Number(
            inventory.quantity || 0
          );


        const currentUsedQuantity =
          Number(
            inventory.used_quantity || 0
          );


        const newQuantity =
          currentQuantity +
          restoreQty;


        const newUsedQuantity =
          Math.max(
            0,
            currentUsedQuantity -
              restoreQty
          );


        const unitCost =
          Number(
            inventory.unit_cost || 0
          );


        const {
          error: updateError
        } =
          await supabase
            .from("inventory")
            .update({

              quantity:
                newQuantity,

              used_quantity:
                newUsedQuantity,

              total_amount:
                newQuantity *
                unitCost,

            })
            .eq(
              "id",
              inventoryId
            );


        if (updateError)
          throw updateError;

      }


      continue;

    }


    // =================================================
    // OLD RECORD FALLBACK
    //
    // Keeps older Material Consumption records
    // working if they don't have fifo_allocations.
    // =================================================

    let qtyToRestore =
      Number(
        product.quantity || 0
      );


    if (qtyToRestore <= 0)
      continue;


    const {
      data: inventories,
      error
    } =
      await supabase
        .from("inventory")
        .select("*")
        .eq(
          "product_name",
          product.product_name
        )
        .eq(
          "company",
          product.company || ""
        )
        .eq(
          "specification",
          product.specification || ""
        )
        .order(
          "date",
          {
            ascending: false
          }
        );


    if (error)
      throw error;


    for (
      const inventory
      of inventories
    ) {

      if (qtyToRestore <= 0)
        break;


      const usedQty =
        Number(
          inventory.used_quantity || 0
        );


      if (usedQty <= 0)
        continue;


      const restoreQty =
        Math.min(
          usedQty,
          qtyToRestore
        );


      const newRemaining =
        Number(
          inventory.quantity || 0
        ) +
        restoreQty;


      const newUsed =
        usedQty -
        restoreQty;


      const {
        error: updateError
      } =
        await supabase
          .from("inventory")
          .update({

            quantity:
              newRemaining,

            used_quantity:
              newUsed,

            total_amount:
              newRemaining *
              Number(
                inventory.unit_cost || 0
              )

          })
          .eq(
            "id",
            inventory.id
          );


      if (updateError)
        throw updateError;


      qtyToRestore -=
        restoreQty;

    }

  }

}


/* ======================================
   UPDATE USED INVENTORY
====================================== */

export async function updateUsedInventory(
id,
form
){



const {data:oldRecord,error:oldError} =
await supabase
.from("used_inventory")
.select("*")
.eq("id",id)
.single();



if(oldError)
throw oldError;




await restoreInventory(
oldRecord.products || []
);



await deductInventory(
form.products || []
);

const fifoMaterialCost =
  (form.products || []).reduce(
    (sum, product) =>
      sum +
      Number(product.total || 0),
    0
  );


const payload = {


customer_id:
form.customer_id,


project_no:
form.project_no,


plant_size:
form.plant_size,


location:
form.location,


products:
form.products,



material_cost:
fifoMaterialCost,


installation_charges:
Number(form.installation_charges || 0),


civil_material:
Number(form.civil_material || 0),


vendor_charges:
Number(form.vendor_charges || 0),


agreement_charges:
Number(form.agreement_charges || 0),


je_charges:
Number(form.je_charges || 0),


name_change_charges:
Number(form.name_change_charges || 0),


load_extension_charges:
Number(form.load_extension_charges || 0),


net_metering_charges:
Number(form.net_metering_charges || 0),



total_plant_cost:
fifoMaterialCost +
Number(form.installation_charges || 0) +
Number(form.civil_material || 0) +
Number(form.vendor_charges || 0) +
Number(form.agreement_charges || 0) +
Number(form.je_charges || 0) +
Number(form.name_change_charges || 0) +
Number(form.load_extension_charges || 0) +
Number(form.net_metering_charges || 0),



remarks:
form.remarks || "",



additional_charges:{

installation_charges:
Number(form.installation_charges || 0),


civil_material:
Number(form.civil_material || 0),


vendor_charges:
Number(form.vendor_charges || 0),


agreement_charges:
Number(form.agreement_charges || 0),


je_charges:
Number(form.je_charges || 0),


name_change_charges:
Number(form.name_change_charges || 0),


load_extension_charges:
Number(form.load_extension_charges || 0),


net_metering_charges:
Number(form.net_metering_charges || 0)

}


};





const {data,error} =
await supabase
.from("used_inventory")
.update(payload)
.eq("id",id)
.select()
.single();



if(error)
throw error;



return data;


}







/* ======================================
   DELETE USED INVENTORY
====================================== */

export async function deleteUsedInventory(id){


  // Get used inventory record first
  const {data:record,error:fetchError} =
    await supabase
    .from("used_inventory")
    .select("*")
    .eq("id",id)
    .single();



  if(fetchError)
    throw fetchError;



  // Restore stock back
  await restoreInventory(
    record.products || []
  );



  // Delete used inventory record
  const {error} =
    await supabase
    .from("used_inventory")
    .delete()
    .eq("id",id);



  if(error)
    throw error;



  return true;

}







/* ======================================
   SEARCH USED INVENTORY
====================================== */

export async function searchUsedInventory(keyword){


const data =
await getUsedInventory();



const search =
keyword.toLowerCase();



return data.filter((item)=>{


return (

item.customers?.customer_name
?.toLowerCase()
.includes(search)


||

item.location
?.toLowerCase()
.includes(search)


||

item.project_no
?.toLowerCase()
.includes(search)


);


});


}