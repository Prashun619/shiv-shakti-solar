import { supabase } from "../supabase";

export async function getProfitReport() {
  // =====================================================
  // 1. GET ALL PROJECTS
  // =====================================================

  const { data: projects, error: projectError } = await supabase
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
      ascending: true,
    });

  if (projectError) {
    throw projectError;
  }

  if (!projects || projects.length === 0) {
    return [];
  }

  // =====================================================
  // 2. GET ALL USED INVENTORY / MATERIAL CONSUMPTION
  // =====================================================

  const projectNos = projects
    .map((project) => project.project_no)
    .filter(Boolean);

  const { data: usedInventory, error: usedInventoryError } =
    await supabase
      .from("used_inventory")
      .select(`
        project_no,
        material_cost,
        bhada_charges,
        cement_charges,
        gitti_charges,
        installation_charges,
        je_charges,
        load_extension_charges,
        meter_connection_charges,
        name_change_charges,
        net_metering_charges,
        sand_charges,
        vendor_charges
      `)
      .in("project_no", projectNos);

  if (usedInventoryError) {
    throw usedInventoryError;
  }

  // =====================================================
  // 3. GROUP COSTS BY PROJECT NO
  // =====================================================

  const projectCostMap = {};

  (usedInventory || []).forEach((item) => {
    const projectNo = item.project_no;

    if (!projectNo) return;

    if (!projectCostMap[projectNo]) {
      projectCostMap[projectNo] = {
        material_cost: 0,
        other_cost: 0,
      };
    }

    // ===================================================
    // MATERIAL COST
    // ===================================================

    projectCostMap[projectNo].material_cost +=
      Number(item.material_cost || 0);

    // ===================================================
    // OTHER COST
    // ===================================================

    projectCostMap[projectNo].other_cost +=
      Number(item.bhada_charges || 0) +
      Number(item.cement_charges || 0) +
      Number(item.gitti_charges || 0) +
      Number(item.installation_charges || 0) +
      Number(item.je_charges || 0) +
      Number(item.load_extension_charges || 0) +
      Number(item.meter_connection_charges || 0) +
      Number(item.name_change_charges || 0) +
      Number(item.net_metering_charges || 0) +
      Number(item.sand_charges || 0) +
      Number(item.vendor_charges || 0);
  });

  // =====================================================
  // 4. BUILD PROFIT REPORT
  // =====================================================

  const profitData = projects.map((project) => {
    const costs = projectCostMap[project.project_no] || {
      material_cost: 0,
      other_cost: 0,
    };

    // ===================================================
    // PLANT TOTAL VALUE
    // ===================================================

    const sellingAmount = Number(
      project.total_amount || 0
    );

    // ===================================================
    // MATERIAL COST
    // ===================================================

    const materialCost = Number(
      costs.material_cost || 0
    );

    // ===================================================
    // OTHER COST
    // ===================================================

    const otherCost = Number(
      costs.other_cost || 0
    );

    // ===================================================
    // PLANT COST
    // ===================================================

    const totalCost =
      materialCost + otherCost;

    // ===================================================
    // PROFIT
    //
    // If Plant Cost is 0:
    // Profit = 0
    // Profit % = 0
    //
    // But the project/customer REMAINS in the report.
    // ===================================================

    const hasPlantCost = totalCost > 0;

    const profit = hasPlantCost
      ? sellingAmount - totalCost
      : 0;

    // ===================================================
    // PROFIT %
    // ===================================================

    const profitPercent =
      hasPlantCost && sellingAmount > 0
        ? (profit / sellingAmount) * 100
        : 0;

    // ===================================================
    // RETURN PROJECT ROW
    // ===================================================

    return {
      id: project.id,

      // Example:
      // PRJ-2026-0001
      // PRJ-2026-0002
      // PRJ-2026-0003
      project_no:
        project.project_no || "",

      // Customer belonging to this project
      customer_name:
        project.customers?.customer_name || "",

      // Example:
      // 3 KW
      // 3.5 KW
      // 5 KW
      project_size:
        project.project_size
          ? `${project.project_size} KW`
          : "",

      // Plant Total Value
      selling_amount:
        sellingAmount,

      // Internal values kept for calculation/export
      material_cost:
        materialCost,

      other_cost:
        otherCost,

      // Plant Cost
      total_cost:
        totalCost,

      // Profit
      profit_amount:
        profit,

      // Profit %
      profit_percent:
        Number(profitPercent.toFixed(2)),
    };
  });

  // =====================================================
  // 5. RETURN PROFIT REPORT
  // =====================================================

  return profitData;
}