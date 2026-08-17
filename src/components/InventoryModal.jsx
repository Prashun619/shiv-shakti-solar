import { useEffect, useMemo, useState } from "react";

import {
  addInventory,
  updateInventory,
} from "../services/inventoryService";

// =====================================================
// NORMAL INVENTORY PRODUCTS
// =====================================================

const inventoryProducts = [
  "Panel",
  "Inverter",
  "Rafter",
  "Perlin",
  "Leg 6ft",
  "Leg 8ft",
  "Leg 10ft",
  "Base Plate",
  "Fastener",
  "Nut Bolts",
  "Spring Bolt",
  "Spring",
  "ACDB",
  "DCDB",
  "DC Wire",
  "AC Wire",
  "LA Wire",
  "Armoured Wire",
  "L Clamp",
  "U Clamp",
  "MC4 Connector",
  "PVC Pipe",
  "L Bend",
  "U Bend",
  "T Bend",
  "Catchup 25mm",
  "Catchup 12mm",
  "Earthing Kit",
];

// =====================================================
// AUTOMATIC CATEGORY
// =====================================================

const productCategoryMap = {
  Panel: "Panel",
  Inverter: "Inverter",

  Rafter: "Structure",
  Perlin: "Structure",
  "Leg 6ft": "Structure",
  "Leg 8ft": "Structure",
  "Leg 10ft": "Structure",
  "Base Plate": "Structure",

  Fastener: "Hardware",
  "Nut Bolts": "Hardware",
  "Spring Bolt": "Hardware",
  Spring: "Hardware",

  ACDB: "Electrical",
  DCDB: "Electrical",

  "DC Wire": "Wire",
  "AC Wire": "Wire",
  "LA Wire": "Wire",
  "Armoured Wire": "Wire",

  "L Clamp": "Hardware",
  "U Clamp": "Hardware",

  "MC4 Connector": "Electrical",

  "PVC Pipe": "Accessories",
  "L Bend": "Accessories",
  "U Bend": "Accessories",
  "T Bend": "Accessories",

  "Catchup 25mm": "Accessories",
  "Catchup 12mm": "Accessories",

  "Earthing Kit": "Electrical",
};

// =====================================================
// CATEGORIES
// =====================================================

const categories = [
  "Panel",
  "Inverter",
  "Structure",
  "Electrical",
  "Wire",
  "Hardware",
  "Accessories",
  "Safety",
  "Civil",
  "Services",
];

// =====================================================
// UNITS
// =====================================================

const units = [
  "Nos",
  "Meter",
  "Feet",
  "Kg",
  "Pair",
  "Set",
  "Pack",
  "Roll",
  "Box",
];

// =====================================================
// KIT OPTIONS
// =====================================================

const kitOptions = [
  {
    id: "waaree-3kw",
    label: "Waaree 3KW Kit",
    panelQty: 6,
  },
  {
    id: "waaree-3.5kw",
    label: "Waaree 3.5KW Kit",
    panelQty: 6,
  },
];

// =====================================================
// KIT PANEL OPTIONS
// =====================================================

const kitPanelOptions = [
  "610Wp",
  "605Wp",
  "585Wp",
  "580Wp",
];

// =====================================================
// KIT INVERTER OPTIONS
// =====================================================

const kitInverterOptions = [
  "Waaree",
  "Luminous",
  "Polycab",
];

// =====================================================
// EMPTY NORMAL PRODUCT
// =====================================================

function createEmptyProduct() {
  return {
    product_name: "",
    category: "",
    company: "",
    specification: "",
    quantity: "",
    unit: "Nos",
    price: "",
    total_weight: "",
    gst: "",
    remarks: "",
  };
}

export default function InventoryModal({
  open,
  onClose,
  onSaved,
  product,
}) {
  const [products, setProducts] = useState([
    createEmptyProduct(),
  ]);

  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [supplier, setSupplier] = useState("");

  const [transportation, setTransportation] =
    useState("");

  // ===================================================
  // PURCHASE TYPE
  // ===================================================

  const [purchaseType, setPurchaseType] =
    useState("Product");

  // ===================================================
  // KIT STATE
  // ===================================================

  const [selectedKitId, setSelectedKitId] =
    useState("");

  const [kitPanelWatt, setKitPanelWatt] =
    useState("");

  const [kitPanelQty, setKitPanelQty] =
    useState("");

  const [kitInverterBrand, setKitInverterBrand] =
    useState("");

  const [kitOverallValue, setKitOverallValue] =
    useState("");

  const [kitGST, setKitGST] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const isEditMode = Boolean(product);

  // ===================================================
  // SELECTED KIT
  // ===================================================

  const selectedKit = useMemo(() => {
    return kitOptions.find(
      (kit) => kit.id === selectedKitId
    ) || null;
  }, [selectedKitId]);

  // ===================================================
  // RESET FORM
  // ===================================================

  function resetForm() {
    setDate(
      new Date()
        .toISOString()
        .split("T")[0]
    );

    setSupplier("");

    setTransportation("");

    setPurchaseType("Product");

    setSelectedKitId("");

    setKitPanelWatt("");

    setKitPanelQty("");

    setKitInverterBrand("");

    setKitOverallValue("");

    setKitGST("");

    setProducts([
      createEmptyProduct(),
    ]);
  }

  // ===================================================
  // LOAD FORM
  // ===================================================

  useEffect(() => {
    if (!open) return;

    if (product) {
      const isKit =
        product.purchase_type === "Kit";

      setDate(
        product.date ||
          new Date()
            .toISOString()
            .split("T")[0]
      );

      setSupplier(
        product.supplier || ""
      );

      setTransportation(
        product.transportation || ""
      );

      setPurchaseType(
        product.purchase_type ||
          "Product"
      );

      // -----------------------------------------------
      // FIND KIT ID FROM SAVED KIT NAME
      // -----------------------------------------------

      const matchedKit =
        kitOptions.find(
          (kit) =>
            kit.label ===
            product.kit_name
        );

      setSelectedKitId(
        matchedKit?.id || ""
      );

      setKitPanelWatt(
        product.kit_panel_watt ||
          ""
      );

      setKitPanelQty(
        product.kit_panel_qty ??
          ""
      );

      setKitInverterBrand(
        product.kit_inverter_brand ||
          ""
      );

      setKitOverallValue(
        product.kit_overall_value ??
          ""
      );

      setKitGST(
        product.kit_gst ??
          ""
      );

      setProducts([
        {
          product_name:
            product.product_name ||
            "",

          category:
            product.category ||
            productCategoryMap[
              product.product_name
            ] ||
            "",

          company:
            product.company || "",

          specification:
            product.specification ||
            "",

          quantity:
            isKit
              ? product.kit_panel_qty ??
                product.quantity ??
                ""
              : product.quantity ??
                "",

          unit:
            isKit
              ? "Kit"
              : product.unit ||
                "Nos",

          price:
            product.price ??
            product.unit_cost ??
            "",

          total_weight:
            product.total_weight ??
            "",

          gst:
            isKit
              ? product.kit_gst ??
                0
              : product.gst ??
                Number(
                  product.cgst || 0
                ) +
                  Number(
                    product.sgst || 0
                  ),

          remarks:
            product.remarks || "",
        },
      ]);
    } else {
      resetForm();
    }
  }, [open, product]);

  // ===================================================
  // UPDATE NORMAL PRODUCT
  // ===================================================

  function updateProduct(
    index,
    field,
    value
  ) {
    setProducts((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  }

  // ===================================================
  // HANDLE NORMAL PRODUCT CHANGE
  // ===================================================

  function handleProductChange(
    index,
    field,
    value
  ) {
    if (
      field === "product_name"
    ) {
      setProducts((prev) =>
        prev.map(
          (item, itemIndex) =>
            itemIndex === index
              ? {
                  ...item,
                  product_name: value,
                  category:
                    productCategoryMap[
                      value
                    ] || "",
                }
              : item
        )
      );

      return;
    }

    if (field === "unit") {
      setProducts((prev) =>
        prev.map(
          (item, itemIndex) =>
            itemIndex === index
              ? {
                  ...item,
                  unit: value,
                  total_weight:
                    value === "Kg"
                      ? item.total_weight
                      : "",
                }
              : item
        )
      );

      return;
    }

    updateProduct(
      index,
      field,
      value
    );
  }

  // ===================================================
  // ADD NORMAL PRODUCT ROW
  // ===================================================

  function addProductRow() {
    setProducts((prev) => [
      ...prev,
      createEmptyProduct(),
    ]);
  }

  // ===================================================
  // REMOVE NORMAL PRODUCT ROW
  // ===================================================

  function removeProductRow(
    index
  ) {
    if (
      products.length === 1
    ) {
      return;
    }

    setProducts((prev) =>
      prev.filter(
        (_, itemIndex) =>
          itemIndex !== index
      )
    );
  }

  // ===================================================
  // KIT CHANGE
  // ===================================================

  function handleKitChange(
    kitId
  ) {
    const selected =
      kitOptions.find(
        (kit) =>
          kit.id === kitId
      );

    setSelectedKitId(kitId);

    setKitPanelWatt("");

    // Panel Qty is editable.
    // Start with the kit's default quantity.
    setKitPanelQty(
      selected?.panelQty ?? ""
    );

    setKitInverterBrand("");

    setKitOverallValue("");

    setKitGST("");

    setProducts([]);
  }

  // ===================================================
  // PRODUCT BASE CALCULATION
  // ===================================================

  function calculateProductBase(
    item
  ) {
    const quantity =
      Number(
        item.quantity || 0
      );

    const price =
      Number(
        item.price || 0
      );

    // KG FORMULA:
    // Qty × Total Weight × Price per Kg
    if (
      item.unit === "Kg"
    ) {
      const totalWeight =
        Number(
          item.total_weight ||
            0
        );

      return (
        quantity *
        totalWeight *
        price
      );
    }

    return (
      quantity * price
    );
  }

  // ===================================================
  // PRODUCT GST
  // ===================================================

  function calculateProductGST(
    item
  ) {
    const base =
      calculateProductBase(
        item
      );

    const gst =
      Number(
        item.gst || 0
      );

    return (
      base *
      gst /
      100
    );
  }

  // ===================================================
  // NORMAL PURCHASE SUMMARY
  // ===================================================

  const normalBaseAmount =
    useMemo(() => {
      return products.reduce(
        (sum, item) =>
          sum +
          calculateProductBase(
            item
          ),
        0
      );
    }, [products]);

  const normalGSTAmount =
    useMemo(() => {
      return products.reduce(
        (sum, item) =>
          sum +
          calculateProductGST(
            item
          ),
        0
      );
    }, [products]);

  // ===================================================
  // KIT SUMMARY
  // ===================================================

  const numericKitValue =
    Number(
      kitOverallValue || 0
    );

  const numericKitGST =
    Number(
      kitGST || 0
    );

  const kitGSTAmount =
    (
      numericKitValue *
      numericKitGST
    ) / 100;

  const kitTotalAmount =
    numericKitValue +
    kitGSTAmount +
    Number(
      transportation || 0
    );

  // ===================================================
  // FINAL SUMMARY
  // ===================================================

  const totalBaseAmount =
    purchaseType === "Kit"
      ? numericKitValue
      : normalBaseAmount;

  const totalGSTAmount =
    purchaseType === "Kit"
      ? kitGSTAmount
      : normalGSTAmount;

  const totalAmount =
    purchaseType === "Kit"
      ? kitTotalAmount
      : totalBaseAmount +
        totalGSTAmount +
        Number(
          transportation || 0
        );

  // ===================================================
  // VALIDATE NORMAL PRODUCTS
  // ===================================================

  function validateNormalProducts() {
    if (
      !products.length
    ) {
      alert(
        "Please add at least one product."
      );

      return false;
    }

    for (
      let index = 0;
      index < products.length;
      index++
    ) {
      const item =
        products[index];

      if (
        !item.product_name
      ) {
        alert(
          `Please select Product for row ${
            index + 1
          }.`
        );

        return false;
      }

      if (
        !item.category
      ) {
        alert(
          `Please select Category for row ${
            index + 1
          }.`
        );

        return false;
      }

      if (
        ["Panel", "Inverter"].includes(
          item.product_name
        )
      ) {
        if (
          !String(
            item.company || ""
          ).trim()
        ) {
          alert(
            `Please enter Company for row ${
              index + 1
            }.`
          );

          return false;
        }

        if (
          !String(
            item.specification ||
              ""
          ).trim()
        ) {
          alert(
            `Please enter Specification for row ${
              index + 1
            }.`
          );

          return false;
        }
      }

      if (
        Number(
          item.quantity || 0
        ) <= 0
      ) {
        alert(
          `Please enter a valid Quantity for row ${
            index + 1
          }.`
        );

        return false;
      }

      if (
        item.unit === "Kg" &&
        Number(
          item.total_weight ||
            0
        ) <= 0
      ) {
        alert(
          `Please enter Total Weight for row ${
            index + 1
          }.`
        );

        return false;
      }

      if (
        Number(
          item.price || 0
        ) < 0
      ) {
        alert(
          `Please enter a valid Price for row ${
            index + 1
          }.`
        );

        return false;
      }
    }

    return true;
  }

  // ===================================================
  // SUBMIT
  // ===================================================

  async function handleSubmit(e) {
    e.preventDefault();

    if (
      !String(
        supplier || ""
      ).trim()
    ) {
      alert(
        "Please enter Supplier."
      );

      return;
    }

    // =================================================
    // KIT VALIDATION
    // =================================================

    if (
      purchaseType === "Kit"
    ) {
      if (!selectedKitId) {
        alert(
          "Please select Kit."
        );

        return;
      }

      if (!kitPanelWatt) {
        alert(
          "Please select Panel Watt."
        );

        return;
      }

      if (
        Number(
          kitPanelQty || 0
        ) <= 0
      ) {
        alert(
          "Please enter a valid Panel Qty."
        );

        return;
      }

      if (!kitInverterBrand) {
        alert(
          "Please select Inverter."
        );

        return;
      }

      if (
        numericKitValue <= 0
      ) {
        alert(
          "Please enter Overall Kit Value."
        );

        return;
      }

      if (
        numericKitGST < 0
      ) {
        alert(
          "Please enter a valid Kit GST."
        );

        return;
      }
    }

    // =================================================
    // NORMAL PRODUCT VALIDATION
    // =================================================

    if (
      purchaseType ===
      "Product"
    ) {
      if (
        !validateNormalProducts()
      ) {
        return;
      }
    }

    try {
      setLoading(true);

      // ===============================================
      // EDIT
      // ===============================================

      if (isEditMode) {
        const item =
          products[0];

        const payload = {
          date,

          supplier,

          product_name:
            purchaseType ===
            "Kit"
              ? selectedKit?.label ||
                item.product_name
              : item.product_name,

          category:
            purchaseType ===
            "Kit"
              ? "Kit"
              : item.category,

          company:
            purchaseType ===
            "Kit"
              ? selectedKit?.label ||
                ""
              : item.company ||
                "",

          specification:
            purchaseType ===
            "Kit"
              ? kitPanelWatt
              : item.specification ||
                "",

          quantity:
            purchaseType ===
            "Kit"
              ? Number(
                  kitPanelQty || 0
                )
              : Number(
                  item.quantity || 0
                ),

          unit:
            purchaseType ===
            "Kit"
              ? "Kit"
              : item.unit,

          price:
            purchaseType ===
            "Kit"
              ? numericKitValue
              : Number(
                  item.price || 0
                ),

          total_weight:
            purchaseType ===
            "Kit"
              ? 0
              : Number(
                  item.total_weight ||
                    0
                ),

          gst:
            purchaseType ===
            "Kit"
              ? numericKitGST
              : Number(
                  item.gst || 0
                ),

          cgst: 0,
          sgst: 0,

          transportation:
            Number(
              transportation || 0
            ),

          total_amount:
            totalAmount,

          remarks:
            purchaseType ===
            "Kit"
              ? "Includes Panel, Inverter, ACDB, DCDB and Earthing Kit"
              : item.remarks ||
                "",

          purchase_type:
            purchaseType,

          kit_name:
            purchaseType ===
            "Kit"
              ? selectedKit?.label ||
                null
              : null,

          kit_panel_watt:
            purchaseType ===
            "Kit"
              ? kitPanelWatt
              : null,

          kit_panel_qty:
            purchaseType ===
            "Kit"
              ? Number(
                  kitPanelQty || 0
                )
              : 0,

          kit_inverter_brand:
            purchaseType ===
            "Kit"
              ? kitInverterBrand
              : null,

          kit_overall_value:
            purchaseType ===
            "Kit"
              ? numericKitValue
              : 0,

          kit_gst:
            purchaseType ===
            "Kit"
              ? numericKitGST
              : 0,

          kit_component:
            false,

          kit_price_locked:
            false,

          active: true,

          is_default: false,
        };

        await updateInventory(
          product.id,
          payload
        );
      }

      // ===============================================
      // ADD
      // ===============================================

      else {
        if (
          purchaseType ===
          "Kit"
        ) {
          await addInventory({
            date,

            supplier,

            purchase_type:
              "Kit",

            kit_name:
              selectedKit?.label ||
              null,

            kit_panel_watt:
              kitPanelWatt,

            kit_panel_qty:
              Number(
                kitPanelQty || 0
              ),

            kit_inverter_brand:
              kitInverterBrand,

            kit_overall_value:
              numericKitValue,

            kit_gst:
              numericKitGST,

            transportation:
              Number(
                transportation || 0
              ),
          });
        } else {
          await addInventory({
            date,

            supplier,

            purchase_type:
              "Product",

            products,

            transportation:
              Number(
                transportation || 0
              ),
          });
        }
      }

      onSaved();
      onClose();

    } catch (error) {
      console.error(
        "INVENTORY SAVE ERROR:",
        error
      );

      alert(
        error?.message ||
          "Unable to save inventory."
      );
    } finally {
      setLoading(false);
    }
  }

  // ===================================================
  // FORMAT
  // ===================================================

  function formatAmount(
    value
  ) {
    return Number(
      value || 0
    ).toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );
  }

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

      <div className="bg-white w-full max-w-5xl rounded-xl shadow-lg p-5 max-h-[94vh] overflow-y-auto">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex justify-between items-center mb-4">

          <h2 className="text-xl font-bold">
            {isEditMode
              ? "Edit Purchase"
              : "Add Purchase"}
          </h2>

          {!isEditMode &&
            purchaseType ===
              "Product" && (
              <button
                type="button"
                onClick={
                  addProductRow
                }
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                + Add Product
              </button>
            )}

        </div>

        <form
          onSubmit={
            handleSubmit
          }
          className="space-y-4"
        >

          {/* =================================================
              HEADER FIELDS
          ================================================= */}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

            {/* DATE */}

            <div>
              <label className="block mb-1 font-medium">
                Date
              </label>

              <input
                type="date"
                value={date}
                onChange={(e) =>
                  setDate(
                    e.target.value
                  )
                }
                className="border rounded-lg p-2 w-full"
                required
              />
            </div>

            {/* SUPPLIER */}

            <div>
              <label className="block mb-1 font-medium">
                Supplier
              </label>

              <input
                type="text"
                value={supplier}
                onChange={(e) =>
                  setSupplier(
                    e.target.value
                  )
                }
                className="border rounded-lg p-2 w-full"
                required
              />
            </div>

            {/* PURCHASE TYPE */}

            <div>
              <label className="block mb-1 font-medium">
                Purchase Type
              </label>

              <select
                value={
                  purchaseType
                }
                disabled={
                  isEditMode
                }
                onChange={(e) => {
                  const value =
                    e.target.value;

                  setPurchaseType(
                    value
                  );

                  if (
                    value ===
                    "Product"
                  ) {
                    setSelectedKitId(
                      ""
                    );

                    setKitPanelWatt(
                      ""
                    );

                    setKitPanelQty(
                      ""
                    );

                    setKitInverterBrand(
                      ""
                    );

                    setKitOverallValue(
                      ""
                    );

                    setKitGST(
                      ""
                    );

                    setProducts([
                      createEmptyProduct(),
                    ]);
                  } else {
                    setProducts([]);
                  }
                }}
                className="border rounded-lg p-2 w-full disabled:bg-slate-200"
              >
                <option value="Product">
                  Normal Product
                </option>

                <option value="Kit">
                  Solar Kit
                </option>
              </select>
            </div>

          </div>

          {/* =================================================
              KIT FIELDS
          ================================================= */}

          {purchaseType ===
            "Kit" && (
            <div className="border border-blue-300 rounded-xl p-4 bg-blue-50">

              <h3 className="font-bold text-blue-900 mb-3">
                Solar Kit Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">

                {/* KIT */}

                <div>
                  <label className="block mb-1 font-medium">
                    Kit
                  </label>

                  <select
                    value={
                      selectedKitId
                    }
                    onChange={(e) =>
                      handleKitChange(
                        e.target.value
                      )
                    }
                    className="border border-slate-300 rounded-lg px-2 w-44 h-8 bg-white text-sm leading-none"
                  >
                    <option value="">
                      Select Kit
                    </option>

                    {kitOptions.map(
                      (kit) => (
                        <option
                          key={
                            kit.id
                          }
                          value={
                            kit.id
                          }
                        >
                          {
                            kit.label
                          }
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* PANEL WATT */}

                <div>
                  <label className="block mb-1 font-medium">
                    Panel Watt
                  </label>

                  <select
                    value={
                      kitPanelWatt
                    }
                    onChange={(e) =>
                      setKitPanelWatt(
                        e.target.value
                      )
                    }
                    disabled={
                      !selectedKitId
                    }
                    className="border border-slate-300 rounded-lg px-2 w-44 h-8 bg-white text-sm leading-none disabled:bg-slate-100"
                  >
                    <option value="">
                      Select Panel
                    </option>

                    {kitPanelOptions.map(
                      (watt) => (
                        <option
                          key={
                            watt
                          }
                          value={
                            watt
                          }
                        >
                          {watt}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* PANEL QUANTITY */}

                <div>
                  <label className="block mb-1 font-medium">
                    Panel Qty
                  </label>

                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={
                      kitPanelQty
                    }
                    onChange={(e) =>
                      setKitPanelQty(
                        e.target.value
                      )
                    }
                    disabled={
                      !selectedKitId
                    }
                    className="border border-slate-300 rounded-lg px-2 w-24 h-8 bg-white text-sm disabled:bg-slate-100"
                  />
                </div>

                {/* INVERTER */}

                <div>
                  <label className="block mb-1 font-medium">
                    Inverter
                  </label>

                  <select
                    value={
                      kitInverterBrand
                    }
                    onChange={(e) =>
                      setKitInverterBrand(
                        e.target.value
                      )
                    }
                    disabled={
                      !selectedKitId
                    }
                    className="border border-slate-300 rounded-lg px-2 w-36 h-8 bg-white text-sm leading-none disabled:bg-slate-100"
                  >
                    <option value="">
                      Select Inverter
                    </option>

                    {kitInverterOptions.map(
                      (
                        brand
                      ) => (
                        <option
                          key={
                            brand
                          }
                          value={
                            brand
                          }
                        >
                          {
                            brand
                          }
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* KIT VALUE */}

                <div>
                  <label className="block mb-1 font-medium">
                    Overall Kit Value
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={
                      kitOverallValue
                    }
                    onChange={(e) =>
                      setKitOverallValue(
                        e.target.value
                      )
                    }
                    disabled={
                      !selectedKitId
                    }
                    placeholder="Kit value"
                    className="border border-slate-300 rounded-lg px-2 w-full h-8 bg-white text-sm disabled:bg-slate-100"
                  />
                </div>

              </div>

              {/* SECOND KIT ROW */}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">

                {/* KIT GST */}

                <div>
                  <label className="block mb-1 font-medium">
                    Kit GST %
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={
                      kitGST
                    }
                    onChange={(e) =>
                      setKitGST(
                        e.target.value
                      )
                    }
                    disabled={
                      !selectedKitId
                    }
                    placeholder="GST %"
                    className="border border-slate-300 rounded-lg px-2 w-full h-8 bg-white text-sm disabled:bg-slate-100"
                  />
                </div>

                {/* INCLUDED */}

                <div className="md:col-span-2">

                  <label className="block mb-1 font-medium">
                    Included In Kit
                  </label>

                  <div className="border border-slate-300 rounded-lg px-3 h-8 flex items-center bg-white text-sm text-slate-700">
                    Panel + Inverter + ACDB +
                    DCDB + Earthing Kit
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* =================================================
              NORMAL PRODUCTS
          ================================================= */}

          {purchaseType ===
            "Product" && (
            <>
              {products.map(
                (
                  item,
                  index
                ) => {

                  const itemBase =
                    calculateProductBase(
                      item
                    );

                  const itemGST =
                    calculateProductGST(
                      item
                    );

                  return (
                    <div
                      key={index}
                      className="border border-slate-300 rounded-xl p-4 bg-slate-50"
                    >

                      <div className="flex justify-between items-center mb-3">

                        <h3 className="font-semibold">
                          Product{" "}
                          {index + 1}
                        </h3>

                        {products.length >
                          1 && (
                          <button
                            type="button"
                            onClick={() =>
                              removeProductRow(
                                index
                              )
                            }
                            className="text-red-600 font-semibold"
                          >
                            Remove
                          </button>
                        )}

                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

                        {/* PRODUCT */}

                        <div>
                          <label className="block mb-1 font-medium">
                            Product
                          </label>

                          <select
                            value={
                              item.product_name
                            }
                            onChange={(e) =>
                              handleProductChange(
                                index,
                                "product_name",
                                e.target.value
                              )
                            }
                            className="border rounded-lg p-2 w-full"
                            required
                          >
                            <option value="">
                              Select Product
                            </option>

                            {inventoryProducts.map(
                              (
                                name
                              ) => (
                                <option
                                  key={
                                    name
                                  }
                                  value={
                                    name
                                  }
                                >
                                  {
                                    name
                                  }
                                </option>
                              )
                            )}
                          </select>
                        </div>

                        {/* CATEGORY */}

                        <div>
                          <label className="block mb-1 font-medium">
                            Category
                          </label>

                          <select
                            value={
                              item.category
                            }
                            onChange={(e) =>
                              handleProductChange(
                                index,
                                "category",
                                e.target.value
                              )
                            }
                            className="border rounded-lg p-2 w-full"
                            required
                          >
                            <option value="">
                              Select Category
                            </option>

                            {categories.map(
                              (
                                category
                              ) => (
                                <option
                                  key={
                                    category
                                  }
                                  value={
                                    category
                                  }
                                >
                                  {
                                    category
                                  }
                                </option>
                              )
                            )}
                          </select>
                        </div>

                        {/* COMPANY */}

                        {[
                          "Panel",
                          "Inverter",
                        ].includes(
                          item.product_name
                        ) && (
                          <div>
                            <label className="block mb-1 font-medium">
                              Company
                            </label>

                            <input
                              type="text"
                              value={
                                item.company
                              }
                              onChange={(e) =>
                                handleProductChange(
                                  index,
                                  "company",
                                  e.target.value
                                )
                              }
                              className="border rounded-lg p-2 w-full"
                              required
                            />
                          </div>
                        )}

                        {/* SPECIFICATION */}

                        {[
                          "Panel",
                          "Inverter",
                        ].includes(
                          item.product_name
                        ) && (
                          <div>
                            <label className="block mb-1 font-medium">
                              Specification
                            </label>

                            <input
                              type="text"
                              value={
                                item.specification
                              }
                              onChange={(e) =>
                                handleProductChange(
                                  index,
                                  "specification",
                                  e.target.value
                                )
                              }
                              className="border rounded-lg p-2 w-full"
                              required
                            />
                          </div>
                        )}

                        {/* QUANTITY */}

                        <div>
                          <label className="block mb-1 font-medium">
                            Qty
                          </label>

                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={
                              item.quantity
                            }
                            onChange={(e) =>
                              handleProductChange(
                                index,
                                "quantity",
                                e.target.value
                              )
                            }
                            className="border rounded-lg p-2 w-full"
                            required
                          />
                        </div>

                        {/* UNIT */}

                        <div>
                          <label className="block mb-1 font-medium">
                            Unit
                          </label>

                          <select
                            value={
                              item.unit
                            }
                            onChange={(e) =>
                              handleProductChange(
                                index,
                                "unit",
                                e.target.value
                              )
                            }
                            className="border rounded-lg p-2 w-full"
                          >
                            {units.map(
                              (
                                unit
                              ) => (
                                <option
                                  key={
                                    unit
                                  }
                                  value={
                                    unit
                                  }
                                >
                                  {
                                    unit
                                  }
                                </option>
                              )
                            )}
                          </select>
                        </div>

                        {/* KG TOTAL WEIGHT */}

                        {item.unit ===
                          "Kg" && (
                          <div>
                            <label className="block mb-1 font-medium">
                              Total Weight / Item (Kg)
                            </label>

                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={
                                item.total_weight
                              }
                              onChange={(e) =>
                                handleProductChange(
                                  index,
                                  "total_weight",
                                  e.target.value
                                )
                              }
                              className="border rounded-lg p-2 w-full"
                              required
                            />
                          </div>
                        )}

                        {/* PRICE */}

                        <div>
                          <label className="block mb-1 font-medium">
                            {item.unit ===
                            "Kg"
                              ? "Price per Kg"
                              : "Price"}
                          </label>

                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={
                              item.price
                            }
                            onChange={(e) =>
                              handleProductChange(
                                index,
                                "price",
                                e.target.value
                              )
                            }
                            className="border rounded-lg p-2 w-full"
                            required
                          />
                        </div>

                        {/* GST */}

                        <div>
                          <label className="block mb-1 font-medium">
                            GST %
                          </label>

                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={
                              item.gst
                            }
                            onChange={(e) =>
                              handleProductChange(
                                index,
                                "gst",
                                e.target.value
                              )
                            }
                            className="border rounded-lg p-2 w-full"
                          />
                        </div>

                      </div>

                      {/* KG CALCULATION */}

                      {item.unit ===
                        "Kg" && (
                        <div className="mt-3 rounded-lg bg-blue-50 border border-blue-200 p-3 text-blue-800">

                          <div className="font-semibold">
                            Calculation
                          </div>

                          <div className="mt-1">
                            {Number(
                              item.quantity ||
                                0
                            )}
                            {" × "}
                            {Number(
                              item.total_weight ||
                                0
                            )}
                            {" Kg × ₹"}
                            {Number(
                              item.price ||
                                0
                            ).toFixed(
                              2
                            )}
                          </div>

                          <div>
                            Base Amount = ₹{" "}
                            {formatAmount(
                              itemBase
                            )}
                          </div>

                        </div>
                      )}

                      {/* PRODUCT SUMMARY */}

                      <div className="flex justify-between flex-wrap gap-2 mt-3 text-sm">

                        <span>
                          Base: ₹{" "}
                          {formatAmount(
                            itemBase
                          )}
                        </span>

                        <span>
                          GST: ₹{" "}
                          {formatAmount(
                            itemGST
                          )}
                        </span>

                        <span className="font-semibold">
                          Product Total: ₹{" "}
                          {formatAmount(
                            itemBase +
                              itemGST
                          )}
                        </span>

                      </div>

                    </div>
                  );
                }
              )}
            </>
          )}

          {/* =================================================
              TRANSPORTATION
          ================================================= */}

          <div className="border border-slate-300 rounded-xl p-4">

            <label className="block mb-1 font-medium">
              Transportation
            </label>

            <input
              type="number"
              min="0"
              step="any"
              value={
                transportation
              }
              onChange={(e) =>
                setTransportation(
                  e.target.value
                )
              }
              className="border rounded-lg p-2 w-full md:w-1/3"
            />

            <p className="text-xs text-slate-500 mt-1">
              Transportation is applied only once to this purchase.
            </p>

          </div>

          {/* =================================================
              SUMMARY
          ================================================= */}

          <div className="bg-gray-50 rounded-lg p-4 border">

            {purchaseType ===
            "Kit" ? (
              <>
                <div className="flex justify-between mb-2">
                  <span>
                    Overall Kit Value
                  </span>

                  <strong>
                    ₹{" "}
                    {formatAmount(
                      numericKitValue
                    )}
                  </strong>
                </div>

                <div className="flex justify-between mb-2">
                  <span>
                    GST Amount
                  </span>

                  <strong>
                    ₹{" "}
                    {formatAmount(
                      kitGSTAmount
                    )}
                  </strong>
                </div>

                <div className="flex justify-between mb-2">
                  <span>
                    Transportation
                  </span>

                  <strong>
                    ₹{" "}
                    {formatAmount(
                      transportation
                    )}
                  </strong>
                </div>

                <hr className="my-2" />

                <div className="flex justify-between text-xl font-bold text-green-700">
                  <span>
                    Total Amount
                  </span>

                  <span>
                    ₹{" "}
                    {formatAmount(
                      kitTotalAmount
                    )}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between mb-2">
                  <span>
                    Base Amount
                  </span>

                  <strong>
                    ₹{" "}
                    {formatAmount(
                      totalBaseAmount
                    )}
                  </strong>
                </div>

                <div className="flex justify-between mb-2">
                  <span>
                    GST Amount
                  </span>

                  <strong>
                    ₹{" "}
                    {formatAmount(
                      totalGSTAmount
                    )}
                  </strong>
                </div>

                <div className="flex justify-between mb-2">
                  <span>
                    Transportation
                  </span>

                  <strong>
                    ₹{" "}
                    {formatAmount(
                      transportation
                    )}
                  </strong>
                </div>

                <hr className="my-2" />

                <div className="flex justify-between text-xl font-bold text-green-700">
                  <span>
                    Total Amount
                  </span>

                  <span>
                    ₹{" "}
                    {formatAmount(
                      totalAmount
                    )}
                  </span>
                </div>
              </>
            )}

          </div>

          {/* =================================================
              ACTIONS
          ================================================= */}

          <div className="flex justify-end gap-3 pt-2">

            <button
              type="button"
              onClick={
                onClose
              }
              className="px-5 py-2 rounded-lg border"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                loading
              }
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg disabled:opacity-60"
            >
              {loading
                ? "Saving..."
                : isEditMode
                ? "Update Purchase"
                : "Save Purchase"}
            </button>

          </div>

        </form>

      </div>
    </div>
  );
}