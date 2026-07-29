export function exportInventoryCSV(data) {
  const headers = [
  "S.No",
  "Product",
  "Category",
  "Available Qty",
  "Unit",
  "Unit Cost",
  "Stock Value",
];

  const rows = data.map((item, index) => {

  let productName = item.product_name || "";

  if (item.company) {
    productName = `${item.company} ${productName}`;
  }

  if (item.specification) {
    productName += ` ${item.specification}`;
  }

  return [
    index + 1,
    productName,
    item.category || "",
    item.quantity || 0,
    item.unit || "",
    Math.round(item.unit_cost || 0),
    Math.round((item.quantity || 0) * (item.unit_cost || 0)),
  ];

});

  const csv = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "Inventory_Report.csv";
  link.click();
}