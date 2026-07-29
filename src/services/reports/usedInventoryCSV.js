export function exportUsedInventoryCSV(data) {
  const headers = [
    "Customer",
    "Project No",
    "Plant Size",
    "Location",
    "Material Cost",
    "Installation",
    "Civil Material",
    "Vendor",
    "Agreement",
    "JE Charges",
    "Name Change",
    "Load Extension",
    "Net Metering",
    "Total Plant Cost",
  ];

  const rows = data.map((item) => [
    item.customers?.customer_name || "",
    item.project_no || "",
    item.plant_size || "",
    item.location || "",
    item.material_cost || 0,
    item.installation_charges || 0,
    item.civil_material || 0,
    item.vendor_charges || 0,
    item.agreement_charges || 0,
    item.je_charges || 0,
    item.name_change_charges || 0,
    item.load_extension_charges || 0,
    item.net_metering_charges || 0,
    item.total_plant_cost || 0,
  ]);

  const csv = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "Used_Inventory_Report.csv";
  link.click();
}