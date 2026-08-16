import { supabase } from "../supabase";


export async function getProfitReport() {


  const { data, error } = await supabase

    .from("projects")

    .select(`
      id,
      project_no,
      project_size,
      total_amount,
      customers(
        customer_name
      )
    `)

    .order("project_no", {
      ascending:false
    });



  if(error)
    throw error;



  const profitData = await Promise.all(

    data.map(async(project)=>{


      // ==========================
      // Material Cost
      // ==========================

      const { data:materials } = await supabase

        .from("used_inventory")

        .select(`
          material_cost,
          civil_material,
          installation_charges,
          vendor_charges,
          je_charges,
          load_extension_charges,
          net_metering_charges
        `)

        .eq(
          "project_no",
          project.project_no
        )
        .single();



      const materialCost =
        Number(materials?.material_cost || 0);



      const otherCost =

        Number(materials?.civil_material || 0) +

        Number(materials?.installation_charges || 0) +

        Number(materials?.vendor_charges || 0) +

        Number(materials?.je_charges || 0) +

        Number(materials?.load_extension_charges || 0) +

        Number(materials?.net_metering_charges || 0);



      const totalCost =
        materialCost + otherCost;



      const sellingAmount =
        Number(project.total_amount || 0);



      const profit =
        sellingAmount - totalCost;



      const profitPercent =
        sellingAmount > 0
        ?
        (profit / sellingAmount) * 100
        :
        0;



      return {

        id: project.id,

        project_no:
          project.project_no || "",

        customer:
          project.customers?.customer_name || "",

        plant_size:
          project.project_size || "",

        selling_amount:
          sellingAmount,

        material_cost:
          materialCost,

        other_cost:
          otherCost,

        total_cost:
          totalCost,

        profit:
          profit,

        profit_percent:
          profitPercent,

      };


    })

  );



  return profitData;

}