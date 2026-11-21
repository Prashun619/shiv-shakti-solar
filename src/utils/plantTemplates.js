
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
  "Wire",
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

const createTemplate = (size) => {
  return inventoryProducts
    .filter((item) => {
      if (
        (size === "3KW" || size === "3.5KW") &&
        item === "Purlin 21ft"
      ) {
        return false;
      }

      if (size === "5KW" && item === "Purlin 13ft") {
        return false;
      }

      return true;
    })
    .map((item) => ({
      item,
      qty:
        item === "Rafter"
          ? size === "5KW" ? 3 : 2
          : item === "Purlin 13ft" && size !== "5KW"
          ? 4
          : item === "Purlin 21ft" && size === "5KW"
          ? 4
          : 0,
    }));
};

export const plantTemplates = {
  "3KW": createTemplate("3KW"),
  "3.5KW": createTemplate("3.5KW"),
  "5KW": createTemplate("5KW"),
};

// Manually entered charges: 5 items
export const manualCostItems = [
  "Civil Material",
  "Installation",
  "MPEB Charges",
  "Vendor Charges",
  "Other Charges",
];
