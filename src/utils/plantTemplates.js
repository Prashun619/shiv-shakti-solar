
export const panelOptions = [
  { id: "waaree-610wp", label: "Waaree 610Wp", price: 0, gst: 0 },
  { id: "waaree-605wp", label: "Waaree 605Wp", price: 0, gst: 0 },
  { id: "waaree-585wp", label: "Waaree 585Wp", price: 0, gst: 0 },
  { id: "adani-585wp", label: "Adani 585Wp", price: 0, gst: 0 },
  { id: "adani-580wp", label: "Adani 580Wp", price: 0, gst: 0 },
];

export const inverterOptions = [
  { id: "waaree", label: "Waaree", price: 0, gst: 0 },
  { id: "polycab", label: "Polycab", price: 0, gst: 0 },
  { id: "luminous", label: "Luminous", price: 0, gst: 0 },
];

// Inventory products: 16 items
const inventoryProducts = [
  "Panel",
  "Inverter",
  "AC Wire",
  "DC Wire",
  "LA Wire",
  "Armoured Cable",
  "Earthing",
  "ACDB Box",
  "DCDB Box",
  "Leg 6ft",
  "Leg 8ft",
  "Rafter",
  "Purlin 13ft",
  "Purlin 21ft",
  "C Channel 140x50x2 mm 21ft",
  "C Channel 140x50x2 mm 9ft",
];

// All quantities start at zero.
// Panel quantity is handled by PlantCosting separately.
const createTemplate = () =>
  inventoryProducts.map((item) => ({
    item,
    qty: 0,
  }));

export const plantTemplates = {
  "3KW": createTemplate(),
  "3.5KW": createTemplate(),
  "5KW": createTemplate(),
};

// Manually entered charges: 5 items
export const manualCostItems = [
  "Civil Material",
  "Installation",
  "MPEB Charges",
  "Vendor Charges",
  "Other Charges",
];
