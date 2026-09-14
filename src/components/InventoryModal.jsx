  import {
    useEffect,
    useMemo,
    useState,
  } from "react";

  import {
  addInventory,
  updateInventoryBatch,
  getInventoryByBatch,
} from "../services/inventoryService";

  // =====================================================
  // NORMAL INVENTORY PRODUCTS
  // =====================================================

  const inventoryProducts = [
  "Panel",
  "Inverter",
  "Rafter",
  "Purlin 13 ft",
  "Purlin 21 ft",
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
  "End Clamp",
  "Mid Clamp",
  "Universal Clamp",
  "MC4 Connector",
  "PVC Pipe",
  "L Bend",
  "U Bend",
  "T Bend",
  "Catchup 25mm",
  "Catchup 12mm",
  "Earthing Kit",

  "Tie",
  "Chemical",
  "LA Copper Wire 2.5mm",
];

  // =====================================================
  // ALPHABETICAL PRODUCT DROPDOWN
  // =====================================================

  const sortedInventoryProducts = [
    ...inventoryProducts,
  ].sort((a, b) =>
    a.localeCompare(b, undefined, {
      numeric: true,
      sensitivity: "base",
    })
  );

  // =====================================================
  // AUTOMATIC CATEGORY
  // =====================================================

  const productCategoryMap = {
    Panel: "Panel",
    Inverter: "Inverter",

   Rafter: "Structure",
"Purlin 13 ft": "Structure",
"Purlin 21 ft": "Structure",
"Leg 6ft": "Structure",
"Leg 8ft": "Structure",
"Leg 10ft": "Structure",
"Base Plate": "Structure",

    Fastener: "Hardware",
    "Nut Bolts": "Hardware",
    "Spring Bolt": "Hardware",
    Spring: "Hardware",
    Tie: "Hardware",

    ACDB: "Electrical",
    DCDB: "Electrical",

    "DC Wire": "Wire",
    "AC Wire": "Wire",
    "LA Wire": "Wire",
    "Armoured Wire": "Wire",
    "LA Copper Wire 2.5mm": "Wire",

    "End Clamp": "Hardware",
"Mid Clamp": "Hardware",
"Universal Clamp": "Hardware",

    "MC4 Connector": "Electrical",

    "PVC Pipe": "Accessories",
    "L Bend": "Accessories",
    "U Bend": "Accessories",
    "T Bend": "Accessories",
    Chemical: "Accessories",

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
  {
    company: "Waaree",
    specification: "3 KW",
  },
  {
    company: "Waaree",
    specification: "3.4 KW",
  },
  {
    company: "Luminous",
    specification: "3 KW",
  },
  {
    company: "Luminous",
    specification: "3.4 KW",
  },
  {
    company: "Polycab",
    specification: "3 KW",
  },
  {
    company: "Polycab",
    specification: "3.4 KW",
  },
];

  // =====================================================
  // CREATE NORMAL PRODUCT
  // =====================================================

  function createEmptyProduct() {
    return {
      id: crypto.randomUUID(),

      type: "Product",

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

      active: true,
      is_default: false,
    };
  }

  // =====================================================
  // CREATE KIT
  // =====================================================

  function createEmptyKit() {
    return {
      id: crypto.randomUUID(),

      type: "Kit",

      product_name: "",
      category: "Kit",
      company: "",
      specification: "",

      quantity: "",
      unit: "Kit",

      price: "",
      total_weight: 0,

      gst: "",

      remarks:
        "Includes Panel, Inverter, ACDB, DCDB and Earthing Kit",

      // =================================================
      // KIT BASIC DETAILS
      // =================================================

      kit_name: "",
      kit_panel_watt: "",
      kit_panel_qty: "",
      kit_inverter_brand: "",

      // =================================================
      // KIT PURCHASE VALUE
      // =================================================

      kit_overall_value: "",
      kit_gst: "",

      // =================================================
      // KIT COMPONENT COSTS
      // =================================================

      kit_components: [
        {
          id: crypto.randomUUID(),

          type: "Panel",

          product_name: "Panel",

          company: "Waaree",

          specification: "",

          quantity: 6,

          unit: "Nos",

          unit_price: "",

          total_price: 0,
        },

        {
          id: crypto.randomUUID(),

          type: "Inverter",

          product_name: "Inverter",

          company: "",

          specification: "",

          quantity: 1,

          unit: "Nos",

          unit_price: "",

          total_price: 0,
        },

        {
          id: crypto.randomUUID(),

          type: "ACDB",

          product_name: "ACDB",

          company: "",

          specification: "",

          quantity: 1,

          unit: "Nos",

          unit_price: "",

          total_price: 0,
        },

        {
          id: crypto.randomUUID(),

          type: "DCDB",

          product_name: "DCDB",

          company: "",

          specification: "",

          quantity: 1,

          unit: "Nos",

          unit_price: "",

          total_price: 0,
        },

        {
          id: crypto.randomUUID(),

          type: "Earthing Kit",

          product_name: "Earthing Kit",

          company: "",

          specification: "",

          quantity: 1,

          unit: "Set",

          unit_price: "",

          total_price: 0,
        },
      ],

      active: true,
      is_default: false,
    };
  }

  // =====================================================
  // CONVERT DATABASE ROW TO FORM ITEM
  // =====================================================

  function databaseRowToItem(row) {
    const isKit =
      row.purchase_type === "Kit" ||
      row.category === "Kit";

    // =====================================================
    // KIT
    // =====================================================

    if (isKit) {
      const purchasedQuantity =
        row.purchased_quantity ??
        row.quantity ??
        0;

      return {
        id: row.id,

        type: "Kit",

        product_name:
          row.product_name ||
          row.kit_name ||
          "",

        category: "Kit",

        company:
          row.company || "",

        specification:
          row.specification ||
          row.kit_panel_watt ||
          "",

        // ===============================================
        // PURCHASED QUANTITY
        // ===============================================

        quantity: purchasedQuantity,

        unit: "Kit",

        price:
          row.kit_overall_value ??
          row.price ??
          "",

        total_weight: 0,

        gst:
          row.kit_gst ??
          row.gst ??
          "",

        remarks:
          row.remarks ||
          "Includes Panel, Inverter, ACDB, DCDB and Earthing Kit",

        kit_name:
          row.kit_name ||
          row.product_name ||
          "",

        kit_panel_watt:
          row.kit_panel_watt ||
          row.specification ||
          "",

        kit_panel_qty:
          row.kit_panel_qty ?? "",

        kit_inverter_brand:
          row.kit_inverter_brand ||
          "",

        kit_overall_value:
          row.kit_overall_value ??
          row.price ??
          "",

        kit_gst:
          row.kit_gst ??
          row.gst ??
          "",

        active:
          row.active ?? true,

        is_default:
          row.is_default ?? false,

        used_quantity:
          row.used_quantity ?? 0,

        purchased_quantity:
          purchasedQuantity,

        batch_id:
          row.batch_id || null,
      };
    }

    // =====================================================
    // NORMAL PRODUCT
    // =====================================================

    const purchasedQuantity =
      row.purchased_quantity ??
      row.quantity ??
      0;

    return {
      id: row.id,

      type: "Product",

      product_name:
        row.product_name || "",

      category:
        row.category ||
        productCategoryMap[
          row.product_name
        ] ||
        "",

      company:
        row.company || "",

      specification:
        row.specification || "",

      // ===============================================
      // PURCHASED QUANTITY
      // ===============================================

      quantity: purchasedQuantity,

      unit:
        row.unit || "Nos",

      price:
        row.price ??
        row.unit_cost ??
        "",

      total_weight:
        row.total_weight ?? "",

      gst:
        row.gst ??
        Number(row.cgst || 0) +
          Number(row.sgst || 0),

      remarks:
        row.remarks || "",

      active:
        row.active ?? true,

      is_default:
        row.is_default ?? false,

      used_quantity:
        row.used_quantity ?? 0,

      purchased_quantity:
        purchasedQuantity,

      batch_id:
        row.batch_id || null,
    };
  }

  // =====================================================
  // COMPONENT
  // =====================================================

  export default function InventoryModal({
    open,
    onClose,
    onSaved,
    product,
  }) {
    const [products, setProducts] =
      useState([
        createEmptyProduct(),
      ]);

    const [date, setDate] =
      useState(
        new Date()
          .toISOString()
          .split("T")[0]
      );

    const [supplier, setSupplier] =
      useState("");

    const [
      transportation,
      setTransportation,
    ] = useState("");

    const [loading, setLoading] =
      useState(false);

    const [
      loadingBatch,
      setLoadingBatch,
    ] = useState(false);

    const isEditMode =
      Boolean(product);

    // ===================================================
    // RESET
    // ===================================================

    function resetForm() {
      setDate(
        new Date()
          .toISOString()
          .split("T")[0]
      );

      setSupplier("");

      setTransportation("");

      setProducts([
        createEmptyProduct(),
      ]);
    }

    // ===================================================
    // LOAD FORM
    // ===================================================

    useEffect(() => {
      if (!open) {
        return;
      }

      async function loadForm() {
        if (!product) {
          resetForm();
          return;
        }

        try {
          setLoadingBatch(true);

          const batchId =
            product.batch_id || null;

          let rows = [];

          if (batchId) {
            rows =
              await getInventoryByBatch(
                batchId
              );
          }

          if (
            !Array.isArray(rows) ||
            rows.length === 0
          ) {
            rows = [product];
          }

          const firstRow =
            rows[0];

          setDate(
            firstRow.date ||
              new Date()
                .toISOString()
                .split("T")[0]
          );

          setSupplier(
            firstRow.supplier || ""
          );

          const totalTransportation =
            rows.reduce(
              (sum, row) =>
                sum +
                Number(
                  row.transportation || 0
                ),
              0
            );

          setTransportation(
            totalTransportation
          );

          const formProducts =
            rows.map(
              (row) =>
                databaseRowToItem(row)
            );

          setProducts(
            formProducts
          );

        } catch (error) {
          console.error(
            "LOAD INVENTORY BATCH ERROR:",
            error
          );

          alert(
            error?.message ||
              "Unable to load purchase."
          );

          onClose();

        } finally {
          setLoadingBatch(false);
        }
      }

      loadForm();

    }, [
      open,
      product,
    ]);

    // ===================================================
    // UPDATE ITEM
    // ===================================================

    function updateItem(
      index,
      field,
      value
    ) {
      setProducts(
        (prev) =>
          prev.map(
            (
              item,
              itemIndex
            ) =>
              itemIndex ===
              index
                ? {
                    ...item,
                    [field]:
                      value,
                  }
                : item
          )
      );
    }

    // ===================================================
    // NORMAL PRODUCT CHANGE
    // ===================================================

    function handleProductChange(
      index,
      field,
      value
    ) {
      if (
        field ===
        "product_name"
      ) {
        setProducts(
          (prev) =>
            prev.map(
              (
                item,
                itemIndex
              ) =>
                itemIndex ===
                index
                  ? {
                      ...item,

                      product_name:
                        value,

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

      if (
        field === "unit"
      ) {
        setProducts(
          (prev) =>
            prev.map(
              (
                item,
                itemIndex
              ) =>
                itemIndex ===
                index
                  ? {
                      ...item,

                      unit:
                        value,

                      total_weight:
                        value ===
                        "Kg"
                          ? item.total_weight
                          : "",
                    }
                  : item
            )
        );

        return;
      }

      updateItem(
        index,
        field,
        value
      );
    }

    // ===================================================
    // ADD NORMAL PRODUCT
    // ===================================================

    function addProductRow() {
      setProducts(
        (prev) => [
          createEmptyProduct(),
          ...prev,
        ]
      );
    }

    // ===================================================
    // ADD KIT
    // ===================================================

    function addKitRow() {
      setProducts(
        (prev) => [
          createEmptyKit(),
          ...prev,
        ]
      );
    }

    // ===================================================
    // REMOVE ITEM
    // ===================================================

    function removeItem(
      index
    ) {
      if (
        products.length ===
        1
      ) {
        alert(
          "At least one product or kit is required."
        );

        return;
      }

      setProducts(
        (prev) =>
          prev.filter(
            (
              _,
              itemIndex
            ) =>
              itemIndex !==
              index
          )
      );
    }

    // ===================================================
    // KIT CHANGE
    // ===================================================

  function handleKitChange(
    index,
    kitId
  ) {
    const selected =
      kitOptions.find(
        (kit) =>
          kit.id === kitId
      );

    setProducts(
      (prev) =>
        prev.map(
          (
            item,
            itemIndex
          ) => {
            if (
              itemIndex !== index
            ) {
              return item;
            }

            return {
              ...item,

              product_name:
                selected?.label || "",

              category:
                "Kit",

              company:
                selected?.label
                  ?.replace(
                    /\s+Kit$/i,
                    ""
                  )
                  .trim() || "",

              kit_name:
                selected?.label || "",

              /*
              * IMPORTANT:
              * Do NOT overwrite kit_panel_qty here.
              *
              * The user must be able to
              * edit Panel Quantity manually.
              */
              kit_panel_qty:
                item.kit_panel_qty ||
                selected?.panelQty ||
                "",

              unit:
                "Kit",
            };
          }
        )
    );
  }
    // ===================================================
    // KIT FIELD CHANGE
    // ===================================================

   function handleKitFieldChange(
  index,
  field,
  value
) {
  setProducts((prev) =>
    prev.map((item, itemIndex) => {
      if (itemIndex !== index) {
        return item;
      }

      const updated = {
        ...item,
        [field]: value,
      };

      // =================================================
      // KIT PANEL WATT
      // =================================================

      if (field === "kit_panel_watt") {
        updated.specification = value;
      }

      // =================================================
      // KIT OVERALL VALUE
      // =================================================

      if (field === "kit_overall_value") {
        updated.price = value;
      }

      // =================================================
      // KIT GST
      // =================================================

      if (field === "kit_gst") {
        updated.gst = value;
      }

      // =================================================
      // KIT COMPONENT PRICE
      // =================================================

      if (field === "kit_panel_price") {
        updated.kit_panel_price = value;
      }

      if (field === "kit_inverter_price") {
        updated.kit_inverter_price = value;
      }

      if (field === "kit_acdb_price") {
        updated.kit_acdb_price = value;
      }

      if (field === "kit_dcdb_price") {
        updated.kit_dcdb_price = value;
      }

      if (field === "kit_earthing_kit_price") {
        updated.kit_earthing_kit_price = value;
      }

      // =================================================
      // KIT PANEL QUANTITY
      // =================================================
      // When Panel Quantity changes at the top,
      // update the Panel component quantity too.
      // =================================================

      if (field === "kit_panel_qty") {
        const panelQty = Number(value) || 0;

        updated.kit_panel_qty = panelQty;

        updated.kit_components = (
          updated.kit_components || []
        ).map((component) => {

          if (
            String(component.type || "").trim().toLowerCase() ===
            "panel"
          ) {
            const unitPrice =
              Number(component.unit_price || 0);

            return {
              ...component,

              quantity: panelQty,

              total_price:
                panelQty * unitPrice,
            };
          }

          return component;
        });
      }

      return updated;
    })
  );
} 

    // ===================================================
    // PRODUCT BASE
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

      if (
        item.unit === "Kg"
      ) {
        return (
          Number(
            item.total_weight ||
              0
          ) * price
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

// =====================================================
// PURCHASE VALUE FOR TRANSPORTATION ALLOCATION
// =====================================================

function calculatePurchaseValue(item) {
  if (item.type === "Kit") {
    const kitQuantity =
      Number(item.quantity || 0);

    const kitValue =
      Number(
        item.kit_overall_value ??
        item.price ??
        0
      );

    return (
      kitQuantity *
      kitValue
    );
  }

  const quantity =
    Number(item.quantity || 0);

  const price =
    Number(item.price || 0);

  if (item.unit === "Kg") {
    return (
      Number(item.total_weight || 0) *
      price
    );
  }

  return (
    quantity *
    price
  );
}

// =====================================================
// TOTAL PURCHASE VALUE
// =====================================================

const totalPurchaseValue =
  useMemo(
    () =>
      products.reduce(
        (sum, item) =>
          sum +
          calculatePurchaseValue(item),
        0
      ),
    [products]
  );

// =====================================================
// TRANSPORTATION ALLOCATED TO PRODUCT
// =====================================================

function calculateItemTransportation(item) {
  const totalTransport =
    Number(
      transportation || 0
    );

  const itemPurchaseValue =
    calculatePurchaseValue(item);

  if (
    totalTransport <= 0 ||
    itemPurchaseValue <= 0 ||
    totalPurchaseValue <= 0
  ) {
    return 0;
  }

  return (
    totalTransport *
    itemPurchaseValue /
    totalPurchaseValue
  );
}

// =====================================================
// PRODUCT UNIT PRICE WITH GST + TRANSPORTATION
// =====================================================

function calculateProductUnitPriceWithGST(item) {
  const price =
    Number(item.price || 0);

  const gst =
    Number(item.gst || 0);

  const gstPerUnit =
    (price * gst) / 100;

  const quantity =
    Number(item.quantity || 0);

  if (quantity <= 0) {
    return (
      price +
      gstPerUnit
    );
  }

  const itemTransportation =
    calculateItemTransportation(
      item
    );

  const transportationPerUnit =
    itemTransportation /
    quantity;

  return (
    price +
    gstPerUnit +
    transportationPerUnit
  );
}

    // ===================================================
    // KIT BASE
    // ===================================================

    function calculateKitBase(
  item
) {
  const kitQty =
    Number(
      item.quantity || 0
    );

  const componentCostPerKit =
    (item.kit_components || [])
      .reduce(
        (
          sum,
          component
        ) => {
          const quantity =
            component.product_name ===
            "Panel"
              ? Number(
                  item.kit_panel_qty ||
                    0
                )
              : Number(
                  component.quantity ||
                    0
                );

          const unitPrice =
            Number(
              component.unit_price ||
                0
            );

          return (
            sum +
            quantity *
              unitPrice
          );
        },
        0
      );

  return (
    componentCostPerKit *
    kitQty
  );
} 

    // ===================================================
    // KIT GST
    // ===================================================

    function calculateKitGST(
  item
) {
  const base =
    calculateKitBase(
      item
    );

  const gst =
    Number(
      item.kit_gst ||
        item.gst ||
        0
    );

  return (
    base *
    gst /
    100
  );
}

    // ===================================================
    // ITEM BASE
    // ===================================================

    function calculateItemBase(
      item
    ) {
      return item.type ===
        "Kit"
        ? calculateKitBase(
            item
          )
        : calculateProductBase(
            item
          );
    }

    // ===================================================
    // ITEM GST
    // ===================================================

    function calculateItemGST(
      item
    ) {
      return item.type ===
        "Kit"
        ? calculateKitGST(
            item
          )
        : calculateProductGST(
            item
          );
    }

    // ===================================================
    // TOTAL BASE
    // ===================================================

    const totalBaseAmount =
      useMemo(
        () =>
          products.reduce(
            (
              sum,
              item
            ) =>
              sum +
              calculateItemBase(
                item
              ),
            0
          ),
        [products]
      );

    // ===================================================
    // TOTAL GST
    // ===================================================

    const totalGSTAmount =
      useMemo(
        () =>
          products.reduce(
            (
              sum,
              item
            ) =>
              sum +
              calculateItemGST(
                item
              ),
            0
          ),
        [products]
      );

    // ===================================================
    // TOTAL
    // ===================================================

    const totalAmount =
      totalBaseAmount +
      totalGSTAmount +
      Number(
        transportation || 0
      );

    // ===================================================
    // VALIDATE
    // ===================================================

    function validateProducts() {
      if (
        !products.length
      ) {
        alert(
          "Please add at least one product or kit."
        );

        return false;
      }

      for (
        let index = 0;
        index <
        products.length;
        index++
      ) {
        const item =
          products[index];

        if (
          item.type === "Kit"
        ) {
          if (
            !item.kit_name
          ) {
            alert(
              `Please select Kit for row ${
                index + 1
              }.`
            );

            return false;
          }

          if (
            !item.kit_panel_watt
          ) {
            alert(
              `Please select Panel Watt for kit row ${
                index + 1
              }.`
            );

            return false;
          }

          if (
            Number(
              item.kit_panel_qty ||
                0
            ) <= 0
          ) {
            alert(
              `Please enter Panel Qty per Kit for kit row ${
                index + 1
              }.`
            );

            return false;
          }

          if (
            Number(
              item.quantity ||
                0
            ) <= 0
          ) {
            alert(
              `Please enter Kit Quantity for kit row ${
                index + 1
              }.`
            );

            return false;
          }

          if (
            !item.kit_inverter_brand
          ) {
            alert(
              `Please select Inverter for kit row ${
                index + 1
              }.`
            );

            return false;
          }

            

  // =================================================
  // VALIDATE KIT COMPONENT TOTAL
  // =================================================

  const componentCostPerKit =
    (
      Number(
        item.kit_panel_qty || 0
      ) *
      Number(
        item.kit_panel_price || 0
      )
    ) +
    Number(
      item.kit_inverter_price || 0
    ) +
    Number(
      item.kit_acdb_price || 0
    ) +
    Number(
      item.kit_dcdb_price || 0
    ) +
    Number(
      item.kit_earthing_kit_price || 0
    );

  const enteredKitValue =
    Number(
      item.kit_overall_value || 0
    );

  const difference =
    Math.abs(
      componentCostPerKit -
        enteredKitValue
    );

  if (
    difference > 0.01
  ) {
    alert(
      `Kit row ${
        index + 1
      } component total ₹${formatAmount(
        componentCostPerKit
      )} does not match Overall Kit Value ₹${formatAmount(
        enteredKitValue
      )}.`
    );

    return false;
  }

          if (
            Number(
              item.kit_gst || 0
            ) < 0
          ) {
            alert(
              `Please enter valid Kit GST for kit row ${
                index + 1
              }.`
            );

            return false;
          }

          continue;
        }

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
          [
            "Panel",
            "Inverter",
          ].includes(
            item.product_name
          )
        ) {
          if (
            !String(
              item.company ||
                ""
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
            `Please enter valid Quantity for row ${
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
            `Please enter valid Price for row ${
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

    async function handleSubmit(
      e
    ) {
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

      if (
        !validateProducts()
      ) {
        return;
      }

      try {
        setLoading(true);

        if (isEditMode) {
          await updateInventoryBatch(
            product.batch_id,
            {
              date,
              supplier,
              transportation:
                Number(
                  transportation ||
                    0
                ),
              products,
            }
          );
        } else {
          await addInventory({
            date,
            supplier,

            transportation:
              Number(
                transportation ||
                  0
              ),

            products,
          });
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

    // ===================================================
    // CLOSED
    // ===================================================

    if (!open) {
      return null;
    }

    // ===================================================
    // RENDER
    // ===================================================

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

        <div className="bg-white w-full max-w-6xl rounded-xl shadow-lg p-5 max-h-[94vh] overflow-y-auto">

          <div className="flex justify-between items-center mb-4">

            <h2 className="text-xl font-bold">
              {isEditMode
                ? "Edit Purchase"
                : "Add Purchase"}
            </h2>

            <div className="flex gap-2">

              <button
                type="button"
                onClick={
                  addProductRow
                }
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                + Add Product
              </button>

              <button
                type="button"
                onClick={
                  addKitRow
                }
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
              >
                + Add Kit
              </button>

            </div>

          </div>

          {loadingBatch ? (
            <div className="py-12 text-center text-slate-500">
              Loading purchase...
            </div>
          ) : (
            <form
              onSubmit={
                handleSubmit
              }
              className="space-y-4"
            >

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

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

              </div>

              {products.map(
                (
                  item,
                  index
                ) => {
                  const itemBase =
                    calculateItemBase(
                      item
                    );

                  const itemGST =
                    calculateItemGST(
                      item
                    );

                  const isKit =
                    item.type ===
                    "Kit";

                  return (
                    <div
                      key={item.id}
                      className={`border rounded-xl p-4 ${
                        isKit
                          ? "border-purple-300 bg-purple-50"
                          : "border-slate-300 bg-slate-50"
                      }`}
                    >

                      <div className="flex justify-between items-center mb-3">

                        <div className="flex items-center gap-2">

                          <h3 className="font-semibold">
                            {isKit
                              ? `Kit ${
                                  index + 1
                                }`
                              : `Product ${
                                  index + 1
                                }`}
                          </h3>

                          <span
                            className={`text-xs px-2 py-1 rounded-full font-semibold ${
                              isKit
                                ? "bg-purple-200 text-purple-800"
                                : "bg-blue-200 text-blue-800"
                            }`}
                          >
                            {isKit
                              ? "KIT"
                              : "PRODUCT"}
                          </span>

                        </div>

                        {products.length >
                          1 && (
                          <button
                            type="button"
                            onClick={() =>
                              removeItem(
                                index
                              )
                            }
                            className="text-red-600 font-semibold"
                          >
                            Remove
                          </button>
                        )}

                      </div>

                      {isKit ? (
                        <>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">

                            <div>
                              <label className="block mb-1 font-medium">
                                Kit
                              </label>

                              <select
                                value={
                                  kitOptions.find(
                                    (
                                      kit
                                    ) =>
                                      kit.label ===
                                      item.kit_name
                                  )?.id ||
                                  ""
                                }
                                onChange={(
                                  e
                                ) =>
                                  handleKitChange(
                                    index,
                                    e.target.value
                                  )
                                }
                                className="border rounded-lg p-2 w-full"
                                required
                              >
                                <option value="">
                                  Select Kit
                                </option>

                                {kitOptions.map(
                                  (
                                    kit
                                  ) => (
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

                            <div>
                              <label className="block mb-1 font-medium">
                                Panel Watt
                              </label>

                              <select
                                value={
                                  item.kit_panel_watt ||
                                  ""
                                }
                                onChange={(
                                  e
                                ) =>
                                  handleKitFieldChange(
                                    index,
                                    "kit_panel_watt",
                                    e.target.value
                                  )
                                }
                                disabled={
                                  !item.kit_name
                                }
                                className="border rounded-lg p-2 w-full disabled:bg-slate-100"
                                required
                              >
                                <option value="">
                                  Select Panel
                                </option>

                                {kitPanelOptions.map(
                                  (
                                    watt
                                  ) => (
                                    <option
                                      key={
                                        watt
                                      }
                                      value={
                                        watt
                                      }
                                    >
                                      {
                                        watt
                                      }
                                    </option>
                                  )
                                )}
                              </select>
                            </div>

                            <div>
                              <label className="block mb-1 font-medium">
                                Kit Quantity
                              </label>

                              <input
                                type="number"
                                min="1"
                                step="1"
                                value={
                                  item.quantity ||
                                  ""
                                }
                                onChange={(
                                  e
                                ) =>
                                  handleKitFieldChange(
                                    index,
                                    "quantity",
                                    e.target.value
                                  )
                                }
                                disabled={
                                  !item.kit_name
                                }
                                className="border rounded-lg p-2 w-full disabled:bg-slate-100"
                                required
                              />
                            </div>

                            <div>
    <label className="block mb-1 font-medium">
      Panel Quantity
    </label>

    <input
      type="number"
      min="1"
      step="1"
      value={
        item.kit_panel_qty ??
        ""
      }
      onChange={(e) =>
        handleKitFieldChange(
          index,
          "kit_panel_qty",
          e.target.value
        )
      }
      disabled={!item.kit_name}
      className="border rounded-lg p-2 w-full disabled:bg-slate-100"
      required
    />
  </div>

                            <div>
                              <label className="block mb-1 font-medium">
                                Inverter
                              </label>

                              <select
  value={
    item.kit_inverter_brand || ""
  }
  onChange={(e) => {
    const selected =
      kitInverterOptions.find(
        (option) =>
          `${option.company} - ${option.specification}` ===
          e.target.value
      );

    setProducts(
      (prev) =>
        prev.map(
          (
            productItem,
            productIndex
          ) => {
            if (
              productIndex !== index
            ) {
              return productItem;
            }

            return {
              ...productItem,

              kit_inverter_brand:
                selected
                  ? `${selected.company} - ${selected.specification}`
                  : "",

              kit_inverter_company:
                selected?.company || "",

              kit_inverter_specification:
                selected?.specification || "",

              kit_components:
                (
                  productItem.kit_components ||
                  []
                ).map(
                  (
                    component
                  ) =>
                    component.type ===
                      "Inverter"
                      ? {
                          ...component,

                          company:
                            selected?.company ||
                            "",

                          specification:
                            selected?.specification ||
                            "",
                        }
                      : component
                ),
            };
          }
        )
    );
  }}
  disabled={!item.kit_name}
  className="border rounded-lg p-2 w-full disabled:bg-slate-100"
  required
>
  <option value="">
    Select Inverter
  </option>

  {kitInverterOptions.map(
    (option) => (
      <option
        key={`${option.company}-${option.specification}`}
        value={`${option.company} - ${option.specification}`}
      >
        {option.company} -{" "}
        {option.specification}
      </option>
    )
  )}
</select>
                            </div>

                          </div>

                                

  {/* =====================================================
      KIT COMPONENT PRICES
  ===================================================== */}

  <div className="mt-4 border border-purple-200 rounded-xl bg-white p-4">

    <div className="flex justify-between items-center mb-3">

      <h4 className="font-semibold text-purple-800">
        Kit Component Costs
      </h4>

      <span className="text-xs text-slate-500">
        Enter exact purchase price for each component
      </span>

    </div>

    <div className="space-y-3">

      {(item.kit_components || []).map(
        (component, componentIndex) => {

          const componentQuantity =
  component.type === "Panel"
    ? Number(item.kit_panel_qty || 0)
    : Number(component.quantity || 0);

          const componentUnitPrice =
            Number(
              component.unit_price || 0
            );

          const componentTotal =
            componentQuantity *
            componentUnitPrice;

          return (
            <div
              key={
                component.id ||
                componentIndex
              }
              className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end border border-slate-200 rounded-lg p-3"
            >

             {/* COMPONENT */}

<div>
  <label className="block mb-1 font-medium text-sm">
    Component
  </label>

  <input
    type="text"
    value={
      component.type === "Panel"
        ? `${component.company || ""} ${
            component.specification || ""
          } Panel`.trim()
        : component.type === "Inverter"
        ? `${component.company || ""} ${
            component.specification || ""
          } Inverter`.trim()
        : component.product_name || ""
    }
    readOnly
    className="border rounded-lg p-2 w-full bg-slate-100"
  />
</div>

              {/* QUANTITY */}

              <div>
                <label className="block mb-1 font-medium text-sm">
                  Qty
                </label>

                <input
  type="number"
  value={componentQuantity}
  readOnly
  className="border rounded-lg p-2 w-full bg-slate-100"
/>
              </div>

              {/* UNIT PRICE */}

              <div>
                <label className="block mb-1 font-medium text-sm">
                  Unit Price
                </label>

                <input
                  type="number"
                  min="0"
                  step="any"
                  value={
                    component.unit_price ||
                    ""
                  }
                  onChange={(e) => {

                    const value =
                      e.target.value;

                    setProducts(
                      (prev) =>
                        prev.map(
                          (
                            productItem,
                            productIndex
                          ) => {

                            if (
                              productIndex !==
                              index
                            ) {
                              return productItem;
                            }

                            return {
                              ...productItem,

                              kit_components:
                                (
                                  productItem.kit_components ||
                                  []
                                ).map(
                                  (
                                    currentComponent,
                                    currentComponentIndex
                                  ) =>
                                    currentComponentIndex ===
                                    componentIndex
                                      ? {
                                          ...currentComponent,

                                          unit_price:
                                            value,

                                          total_price:
                                            Number(
                                              currentComponent.quantity ||
                                                0
                                            ) *
                                            Number(
                                              value ||
                                                0
                                            ),
                                        }
                                      : currentComponent
                                ),
                            };
                          }
                        )
                    );

                  }}
                  className="border rounded-lg p-2 w-full"
                />
              </div>

              {/* TOTAL */}

              <div>
                <label className="block mb-1 font-medium text-sm">
                  Total
                </label>

                <div className="border rounded-lg p-2 w-full bg-slate-100 font-semibold">
                  ₹{" "}
                  {formatAmount(
                    componentTotal
                  )}
                </div>
              </div>

            </div>
          );
        }
      )}

    </div>

    {/* =================================================
        COMPONENT TOTAL
    ================================================= */}

    <div className="flex justify-between items-center mt-4 pt-3 border-t border-purple-200">

      <span className="font-semibold text-purple-800">
        Total Component Cost
      </span>

      <span className="text-lg font-bold text-purple-800">
        ₹{" "}
        {formatAmount(
          (item.kit_components || [])
  .reduce(
    (
      sum,
      component
    ) => {
      const quantity =
        component.product_name === "Panel"
          ? Number(
              item.kit_panel_qty || 0
            )
          : Number(
              component.quantity || 0
            );

      const unitPrice =
        Number(
          component.unit_price || 0
        );

      return (
        sum +
        quantity * unitPrice
      );
    },
    0
  )
        )}
      </span>

    </div>

  </div>
                        </>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">

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

                              {sortedInventoryProducts.map(
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

                          {item.unit ===
                            "Kg" && (
                            <div>
                              <label className="block mb-1 font-medium">
                                Total Weight (Kg)
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

                        {/* Transport / Unit */}
<div>
  <label className="block mb-1 font-medium whitespace-nowrap">
    Transport / Unit
  </label>

  <div className="border rounded-lg p-2 w-full bg-orange-50 border-orange-300 font-semibold text-orange-700">
    ₹{" "}
    {formatAmount(
      calculateItemTransportation(item) /
        Math.max(
          Number(item.quantity || 0),
          1
        )
    )}
  </div>
</div>

{/* Unit Price with GST */}
<div>
  <label className="block mb-1 font-medium whitespace-nowrap">
    Unit Price
  </label>

  <div className="border rounded-lg p-2 w-full bg-green-50 border-green-300 font-semibold text-green-700">
    ₹{" "}
    {formatAmount(
      calculateProductUnitPriceWithGST(item)
    )}
  </div>
</div>


                        </div>
                      )}

                      {!isKit &&
                        item.unit ===
                          "Kg" && (
                          <div className="mt-3 rounded-lg bg-blue-50 border border-blue-200 p-3 text-blue-800">

                            <div className="font-semibold">
                              Calculation
                            </div>

                            <div className="mt-1">
                              {Number(
                                item.total_weight ||
                                  0
                              ).toFixed(2)}
                              {" Kg × ₹"}
                              {Number(
                                item.price ||
                                  0
                              ).toFixed(2)}
                            </div>

                            <div>
                              Base Amount =
                              ₹{" "}
                              {formatAmount(
                                itemBase
                              )}
                            </div>

                          </div>
                        )}

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
                          {isKit
                            ? "Kit Total"
                            : "Product Total"}
                          : ₹{" "}
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
  Transportation is entered once and automatically
  divided between products according to their
  purchase value.
</p>

              </div>

              <div className="bg-gray-50 rounded-lg p-4 border">

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

                <div className="flex justify-between mb-2 text-sm text-slate-500">
                  <span>
                    Items in Purchase
                  </span>

                  <strong>
                    {products.length}
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

              </div>

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
          )}

        </div>
      </div>
    );
  }