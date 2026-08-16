export function getInventoryBatches(inventoryItems, itemName) {
  const key = itemName.trim().toLowerCase();

  return inventoryItems.filter(
    (inv) =>
      inv.product_name?.trim().toLowerCase() === key
  );
}

export function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = src;

    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
  });
}

export function calculateMaterialTotal(items) {
  return items.reduce((sum, item) => {
    const amount =
      Number(item.qty || 0) *
      Number(item.price || 0);

    return sum + amount;
  }, 0);
}

export function calculateGST(items) {
  return items.reduce((sum, item) => {
    const amount =
      Number(item.qty || 0) *
      Number(item.price || 0);

    return (
      sum +
      amount * (Number(item.cgst || 0) / 100) +
      amount * (Number(item.sgst || 0) / 100)
    );
  }, 0);
}

export function calculateGrandTotal(material, gst) {
  return material + gst;
}

export function createInventoryMap(inventoryItems) {
  const inventoryMap = {};

  inventoryItems.forEach((inv) => {
    const key = inv.product_name?.trim().toLowerCase();

    if (!inventoryMap[key]) {
      inventoryMap[key] = [];
    }

    inventoryMap[key].push(inv);
  });

  return inventoryMap;
}

function generatePlantItems() {

  console.log("generatePlantItems called");

  if (!selectedSize)
    return;

 const inventoryMap = createInventoryMap(inventoryItems);

console.log("===== INVENTORY MAP =====");
console.log(inventoryMap);

 const updated =
  plantTemplates[selectedSize].map((item) => {

    const isManual = manualCostItems.includes(item.item);

    const templateName = item.item.trim().toLowerCase();

console.log(
  "Searching:",
  templateName,
  inventoryMap[templateName]
);

const inventoryList =
  inventoryMap[templateName] || [];

let inventoryItem =
  inventoryList.find(
    inv =>
      inv.id === selectedBatches[item.item]
  )
  ||
  inventoryList[0];

if (!inventoryItem) {

  inventoryItem = Object.values(inventoryMap)
  .flat()
  .find(inv => {

    const inventoryName =
      inv.product_name?.trim().toLowerCase() || "";

    return inventoryName === templateName;

  });

}


    if(item.item==="Panel" && selectedPanel){

  console.log("SELECTED PANEL DATA:", selectedPanel);



  return {
  ...item,
  qty: items.find(i => i.item === item.item)?.qty ?? 0,

    company: selectedPanel.company,

    specification: selectedPanel.specification,

    price:Number(
  selectedPanel.unit_cost ??
  selectedPanel.price ??
  0
),

    cgst: Number(selectedPanel.cgst || 0),

    sgst: Number(selectedPanel.sgst || 0)

  };

}



    if(item.item === "Inverter" && selectedInverter){

  return {
    ...item,
    qty: items.find(i => i.item === item.item)?.qty ?? 0,

    company: selectedInverter.company,
    specification: selectedInverter.specification,

    price: Number(
      selectedInverter.unit_cost ??
      selectedInverter.price ??
      0
    ),

    cgst: Number(selectedInverter.cgst || 0),
    sgst: Number(selectedInverter.sgst || 0)

  };

}

if (inventoryItem) {

  console.log(
    "MATCH:",
    item.item,
    inventoryItem.product_name,
    inventoryItem.unit_cost
  );

  return {
  ...item,
  qty: items.find(i => i.item === item.item)?.qty ?? 0,

    company: inventoryItem.company,

    specification: inventoryItem.specification,

    price: inventoryItem.unit_cost,

    cgst: inventoryItem.cgst,

    sgst: inventoryItem.sgst

  };

}

console.log("No Match:", item.item);

    return {
  ...item,
  qty: items.find(i => i.item === item.item)?.qty ?? 0,
  price: 0,
  cgst: 0,
  sgst: 0,
  company: "",
  specification: ""
};


  });


  setItems(updated);

}

export function getInventoryItem(
  inventoryMap,
  itemName,
  selectedBatchId
) {
  const inventoryList =
    inventoryMap[itemName] || [];

  return (
    inventoryList.find(
      inv => inv.id === selectedBatchId
    ) ||
    inventoryList[0] ||
    null
  );
}