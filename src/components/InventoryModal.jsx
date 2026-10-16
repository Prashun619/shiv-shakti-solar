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
      "C Channel 140x50x2 mm 9ft",
    "C Channel 140x50x2 mm 21ft",
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
      "Lugs",
      "SS Nut",
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
      "C Channel 140x50x2 mm 9ft": "Structure",
    "C Channel 140x50x2 mm 21ft": "Structure",
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
      "Lugs": "Hardware",
      "SS Nut": "Hardware",

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
    
    //====================================================
    // PANEL COMPANIES + SPECIFICATIONS
    //====================================================
    
  const panelCompanies = [
    
    "Adani",
    "Luminous",
    "Vikram",
    "Waaree",
  ];

  const panelSpecifications = [
    "575Wp",
    "580Wp",
    "585Wp",
    "600Wp",
    "605Wp",
    "610Wp",
    "620Wp",
    "625Wp",
  ];

  const inverterCompanies = [
    
    "Luminous",
    "Polycab",
    "Waaree",
  ];

  const inverterSpecifications = [
    "3 KW",
    "3.4 KW",
    "5 KW",
    "8 KW",
    "10 KW",
    "15 KW",
    "20 KW",
  ];

  // =====================================================
  // SUPPLIERS
  // =====================================================  

  const suppliers = [
  "Aditya Power",
  "Chhatarpur",
  "CNS Nema",
  "Gupta Brothers",
  "Nowgong",
  "Pack & Dec Industries",
  "Shri Dhar Renewable",
  "Urmila Traders",
  "Vidhyut Bhavan",

  
];

    // =====================================================
    // CREATE NORMAL PRODUCT
    // =====================================================

  function createEmptyProduct() {
    return {
      id: crypto.randomUUID(),

      product_name: "",
        category: "",
        company: "",
        specification: "",
        

        quantity: "",
        unit: "Nos",
        length_ft: "",

        price: "",
        total_weight: "",

        gst: "",
        remarks: "",

        active: true,
        is_default: false,
      };
    }


      
    // =====================================================
  // DATABASE ROW → NORMAL PRODUCT
  // =====================================================

  function databaseRowToItem(row) {
    const purchasedQuantity =
      row.purchased_quantity ??
      row.quantity ??
      0;

    return {
      id: row.id,

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

      quantity: purchasedQuantity,

      unit:
        row.unit || "Nos",

      length_ft:
        row.length_ft ??
        row.length ??
        "",

      price:
        row.price ??
        "",

      unit_cost:
        String(
          row.product_name || ""
        )
          .trim()
          .toLowerCase()
          .includes("c channel")
          ? Number(
              row.unit_cost || 0
            )
          : (
              row.unit_cost ??
              ""
            ),

      total_weight:
        row.total_weight ??
        "",

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
      // LENGTH-BASED MATERIALS
      // ===================================================

      function isLengthBasedMaterial(item) {
        return [
          "Rafter",
          "C Channel 140x50x2 mm 9ft",
        "C Channel 140x50x2 mm 21ft",
          "Purlin 13 ft",
          "Purlin 21 ft",
          "Leg 6ft",
          "Leg 8ft",
          "Leg 10ft",
        ].includes(item.product_name);
      }

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
        // =================================================
        // PRODUCT
        // =================================================

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
            ) => {
              if (
                itemIndex !== index
              ) {
                return item;
              }

              const isCChannel =
      value ===
        "C Channel 140x50x2 mm 9ft" ||
      value ===
        "C Channel 140x50x2 mm 21ft";

            return {
      ...item,

      product_name:
        value,

      category:
        productCategoryMap[
          value
        ] || "",

    

      unit:
        isCChannel
          ? "Kg"
          : item.unit,

      total_weight:
        isCChannel
          ? item.total_weight
          : item.total_weight,
    };
            }
          )
      );

      return;
    }

        // =================================================
        // UNIT
        // =================================================

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
                          value === "Kg"
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
            "At least one product is required."
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

        // For every Kg product, price is per Kg
        // and total weight comes from the bill.
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

      // ===================================================
  // PURCHASE VALUE
  // ===================================================

  function calculatePurchaseValue(item) {
    const quantity =
      Number(item.quantity || 0);

    const price =
      Number(item.price || 0);

    // Kg products
    if (item.unit === "Kg") {
      return (
        Number(item.total_weight || 0) *
        price
      );
    }

    // Normal products
    return quantity * price;
  }
      
  // ===================================================
  // ITEM BASE
  // ===================================================

  function calculateItemBase(item) {
    return calculateProductBase(item);
  }

  // ===================================================
  // ITEM GST
  // ===================================================

  function calculateItemGST(item) {
    return calculateProductGST(item);
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
                calculatePurchaseValue(
                  item
                ),
              0
            ),
          [products]
        );

      // =====================================================
      // TRANSPORTATION ALLOCATED TO PRODUCT
      // =====================================================

      function calculateItemTransportation(
        item
      ) {
        const totalTransport =
          Number(
            transportation || 0
          );

        const itemPurchaseValue =
          calculatePurchaseValue(
            item
          );

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

    function calculateProductUnitPriceWithGST(
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

      const gst =
        Number(
          item.gst || 0
        );

      const itemTransportation =
        calculateItemTransportation(
          item
        );


      // =================================================
      // C CHANNEL
      // =================================================
      // Quantity = number of pieces
      // Length = feet per piece
      // Total Length = Quantity × Length
      //
      // Material Cost = Total Weight × Price/Kg
      // Material Cost/Ft = Material Cost ÷ Total Length
      // GST/Ft = Material Cost/Ft × GST%
      // Transport/Ft = Transport ÷ Total Length
      // Unit Price/Ft = Material Cost/Ft + GST/Ft + Transport/Ft
      // =================================================

      const isCChannel =
        item.product_name ===
          "C Channel 140x50x2 mm 9ft" ||
        item.product_name ===
          "C Channel 140x50x2 mm 21ft";

      if (isCChannel) {

        const lengthFt =
          Number(
            item.length_ft || 0
          );

        const totalWeight =
          Number(
            item.total_weight || 0
          );

        const totalLength =
          quantity *
          lengthFt;

        if (
          totalLength <= 0
        ) {
          return 0;
        }

        // -----------------------------------------------
        // MATERIAL COST
        // -----------------------------------------------

        const materialCost =
          totalWeight *
          price;

        // -----------------------------------------------
        // MATERIAL COST / FT
        // -----------------------------------------------

        const materialCostPerFt =
          materialCost /
          totalLength;

        // -----------------------------------------------
        // GST / FT
        // -----------------------------------------------

        const gstPerFt =
          (
            materialCostPerFt *
            gst
          ) / 100;

        // -----------------------------------------------
        // TRANSPORT / FT
        // -----------------------------------------------

        const transportPerFt =
          itemTransportation /
          totalLength;

        // -----------------------------------------------
        // FINAL UNIT PRICE / FT
        // -----------------------------------------------

        return (
          materialCostPerFt +
          gstPerFt +
          transportPerFt
        );
      }


      // =================================================
      // LEG / PURLIN / RAFTER + KG
      // =================================================
      // Total Weight is manually entered from the bill.
      // Length is NOT used for calculation.
      // =================================================

      const transportationPerUnit =
        quantity > 0
          ? itemTransportation /
            quantity
          : 0;

      if (
        isLengthBasedMaterial(item) &&
        item.unit === "Kg"
      ) {
        if (
          quantity <= 0
        ) {
          return 0;
        }

        const totalWeight =
          Number(
            item.total_weight || 0
          );

        const pricePerKg =
          Number(
            item.price || 0
          );

        // Weight per Nos
        const weightPerNos =
          totalWeight /
          quantity;

        // Material Cost per Nos
        const materialCostPerNos =
          weightPerNos *
          pricePerKg;

        // GST per Nos
        const gstPerNos =
          (
            materialCostPerNos *
            gst
          ) / 100;

        // Final Unit Price
        return (
          materialCostPerNos +
          gstPerNos +
          transportationPerUnit
        );
      }


      // =================================================
      // NORMAL UNIT CALCULATION
      // =================================================

      const gstPerUnit =
        (
          price *
          gst
        ) / 100;

      return (
        price +
        gstPerUnit +
        transportationPerUnit
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
            "Please add at least one product."
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

        

          // ===============================================
          // NORMAL PRODUCT
          // ===============================================

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

          // ===============================================
          // KG WEIGHT
          // ===============================================

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

                {/* =================================================
                    DATE + SUPPLIER
                ================================================= */}

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

  <select
    value={supplier}
    onChange={(e) =>
      setSupplier(e.target.value)
    }
    className="border rounded-lg p-2 w-full"
    required
  >
    <option value="">
      Select Supplier
    </option>

    {suppliers.map((supplierName) => (
      <option
        key={supplierName}
        value={supplierName}
      >
        {supplierName}
      </option>
    ))}
  </select>
</div>

                </div>

                {/* =================================================
                    PRODUCTS
                ================================================= */}

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

                    

                    return (
                      <div
      key={item.id}
      className="border border-slate-300 bg-slate-50 rounded-xl p-4"
    >

                        {/* =================================================
                            ITEM HEADER
                        ================================================= */}

                        <div className="flex justify-between items-center mb-3">

                          <div className="flex items-center gap-2">
      <h3 className="font-semibold">
        Product {index + 1}
      </h3>

      <span className="text-xs px-2 py-1 rounded-full font-semibold bg-blue-200 text-blue-800">
        PRODUCT
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

                        

                                            {/* =================================================
                            NORMAL PRODUCT
                        ================================================= */}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">

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

    <select
      value={item.company}
      onChange={(e) =>
        handleProductChange(
          index,
          "company",
          e.target.value
        )
      }
      className="border rounded-lg p-2 w-full"
      required
    >
      <option value="">
        Select Company
      </option>

      {(item.product_name === "Panel"
        ? panelCompanies
        : inverterCompanies
      ).map((company) => (
        <option
          key={company}
          value={company}
        >
          {company}
        </option>
      ))}
    </select>
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

    <select
      value={item.specification}
      onChange={(e) =>
        handleProductChange(
          index,
          "specification",
          e.target.value
        )
      }
      className="border rounded-lg p-2 w-full"
      required
    >
      <option value="">
        Select Specification
      </option>

      {(item.product_name === "Panel"
        ? panelSpecifications
        : inverterSpecifications
      ).map((specification) => (
        <option
          key={specification}
          value={specification}
        >
          {specification}
        </option>
      ))}
    </select>
  </div>
)}

                        

                            {/* QTY */}

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

                            {/* LENGTH */}

                            {isLengthBasedMaterial(
                              item
                            ) && (
                              <div>
                                <label className="block mb-1 font-medium">
                                  Length (ft)
                                </label>

                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={
                                    item.length_ft ||
                                    ""
                                  }
                                  onChange={(e) =>
                                    handleProductChange(
                                      index,
                                      "length_ft",
                                      e.target.value
                                    )
                                  }
                                  className="border rounded-lg p-2 w-full"
                                />
                              </div>
                            )}

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

                            {/* TOTAL WEIGHT */}

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

                            {/* =================================================
        TRANSPORT / UNIT
    ================================================= */}

    <div>
      <label className="block mb-1 font-medium whitespace-nowrap">
        {(
          item.product_name ===
            "C Channel 140x50x2 mm 9ft" ||
          item.product_name ===
            "C Channel 140x50x2 mm 21ft"
        )
          ? "Transport / Ft"
          : "Transport / Unit"}
      </label>

      <div className="border rounded-lg p-2 w-full bg-orange-50 border-orange-300 font-semibold text-orange-700">
        ₹{" "}
        {formatAmount(
          (
            item.product_name ===
              "C Channel 140x50x2 mm 9ft" ||
            item.product_name ===
              "C Channel 140x50x2 mm 21ft"
          )
            ? calculateItemTransportation(
                item
              ) /
              Math.max(
                Number(
                  item.quantity || 0
                ) *
                Number(
                  item.length_ft || 0
                ),
                1
              )
            : calculateItemTransportation(
                item
              ) /
              Math.max(
                Number(
                  item.quantity || 0
                ),
                1
              )
        )}
      </div>
    </div>

                            {/* UNIT PRICE */}

                            <div>
                              <label className="block mb-1 font-medium whitespace-nowrap">
                                Unit Price
                              </label>

                              <div className="border rounded-lg p-2 w-full bg-green-50 border-green-300 font-semibold text-green-700">
                                ₹{" "}
                                {formatAmount(
                                  calculateProductUnitPriceWithGST(
                                    item
                                  )
                                )}
                              </div>
                            </div>

                          </div>
                        
  {/* =================================================
        SPECIAL MATERIAL CALCULATION
    ================================================= */}

    {(
      (
        item.product_name ===
          "C Channel 140x50x2 mm 9ft" ||
        item.product_name ===
          "C Channel 140x50x2 mm 21ft"
      ) ||
      (
        isLengthBasedMaterial(item) &&
        item.unit === "Kg"
      )
    ) && (

      <div className="mt-3 rounded-lg bg-blue-50 border border-blue-200 p-4 text-blue-800">

        <div className="font-semibold text-base">
          Calculation
        </div>


        {/* =================================================
            C CHANNEL
        ================================================= */}

        {(
          item.product_name ===
            "C Channel 140x50x2 mm 9ft" ||
          item.product_name ===
            "C Channel 140x50x2 mm 21ft"
        ) ? (

          <>
            {/* TOTAL LENGTH */}

            <div className="mt-3">
              <div className="font-semibold">
                Total Length
              </div>

              <div>
                {formatAmount(
                  Number(
                    item.quantity || 0
                  )
                )}
                {" × "}
                {formatAmount(
                  Number(
                    item.length_ft || 0
                  )
                )}
                {" ft"}
              </div>

              <div className="font-bold">
                ={" "}
                {formatAmount(
                  Number(
                    item.quantity || 0
                  ) *
                  Number(
                    item.length_ft || 0
                  )
                )}
                {" ft"}
              </div>
            </div>


            {/* MATERIAL COST */}

            <div className="mt-3">
              <div className="font-semibold">
                Material Cost
              </div>

              <div>
                {formatAmount(
                  Number(
                    item.total_weight || 0
                  )
                )}
                {" Kg × ₹"}
                {formatAmount(
                  Number(
                    item.price || 0
                  )
                )}
                {" / Kg"}
              </div>

              <div className="font-bold">
                = ₹{" "}
                {formatAmount(
                  Number(
                    item.total_weight || 0
                  ) *
                  Number(
                    item.price || 0
                  )
                )}
              </div>
            </div>


            {/* MATERIAL COST / FT */}

            <div className="mt-3">
              <div className="font-semibold">
                Material Cost / Ft
              </div>

              <div>
                ₹{" "}
                {formatAmount(
                  Number(
                    item.total_weight || 0
                  ) *
                  Number(
                    item.price || 0
                  )
                )}
                {" ÷ "}
                {formatAmount(
                  Number(
                    item.quantity || 0
                  ) *
                  Number(
                    item.length_ft || 0
                  )
                )}
                {" ft"}
              </div>

              <div className="font-bold">
                = ₹{" "}
                {formatAmount(
                  (
                    Number(
                      item.quantity || 0
                    ) *
                    Number(
                      item.length_ft || 0
                    )
                  ) > 0
                    ? (
                        Number(
                          item.total_weight || 0
                        ) *
                        Number(
                          item.price || 0
                        )
                      ) /
                      (
                        Number(
                          item.quantity || 0
                        ) *
                        Number(
                          item.length_ft || 0
                        )
                      )
                    : 0
                )}
                {" / ft"}
              </div>
            </div>


            {/* GST / FT */}

            <div className="mt-3">
              <div className="font-semibold">
                GST / Ft
              </div>

              <div>
                ₹{" "}
                {formatAmount(
                  (
                    Number(
                      item.quantity || 0
                    ) *
                    Number(
                      item.length_ft || 0
                    )
                  ) > 0
                    ? (
                        Number(
                          item.total_weight || 0
                        ) *
                        Number(
                          item.price || 0
                        )
                      ) /
                      (
                        Number(
                          item.quantity || 0
                        ) *
                        Number(
                          item.length_ft || 0
                        )
                      )
                    : 0
                )}
                {" × "}
                {formatAmount(
                  Number(
                    item.gst || 0
                  )
                )}
                {"%"}
              </div>

              <div className="font-bold">
                = ₹{" "}
                {formatAmount(
                  (
                    (
                      Number(
                        item.quantity || 0
                      ) *
                      Number(
                        item.length_ft || 0
                      )
                    ) > 0
                      ? (
                          Number(
                            item.total_weight || 0
                          ) *
                          Number(
                            item.price || 0
                          )
                        ) /
                        (
                          Number(
                            item.quantity || 0
                          ) *
                          Number(
                            item.length_ft || 0
                          )
                        )
                      : 0
                  ) *
                  Number(
                    item.gst || 0
                  ) /
                  100
                )}
                {" / ft"}
              </div>
            </div>


            {/* TRANSPORT / FT */}

            <div className="mt-3">
              <div className="font-semibold">
                Transport / Ft
              </div>

              <div>
                ₹{" "}
                {formatAmount(
                  calculateItemTransportation(
                    item
                  )
                )}
                {" ÷ "}
                {formatAmount(
                  Number(
                    item.quantity || 0
                  ) *
                  Number(
                    item.length_ft || 0
                  )
                )}
                {" ft"}
              </div>

              <div className="font-bold">
                = ₹{" "}
                {formatAmount(
                  (
                    Number(
                      item.quantity || 0
                    ) *
                    Number(
                      item.length_ft || 0
                    )
                  ) > 0
                    ? calculateItemTransportation(
                        item
                      ) /
                      (
                        Number(
                          item.quantity || 0
                        ) *
                        Number(
                          item.length_ft || 0
                        )
                      )
                    : 0
                )}
                {" / ft"}
              </div>
            </div>


            {/* UNIT PRICE / FT */}

            <div className="mt-3 pt-3 border-t border-blue-200">

              <div className="font-semibold">
                Unit Price / Ft
              </div>

              <div className="text-lg font-bold">
                = ₹{" "}
                {formatAmount(
                  calculateProductUnitPriceWithGST(
                    item
                  )
                )}
                {" / ft"}
              </div>

            </div>

          </>

        ) : (

          /* =================================================
            EXISTING KG CALCULATION
          ================================================= */

          <>
            {/* WEIGHT PER NOS */}

            <div className="mt-3">
              <div className="font-semibold">
                Weight per Nos
              </div>

              <div>
                {formatAmount(
                  Number(
                    item.total_weight || 0
                  )
                )}
                {" ÷ "}
                {formatAmount(
                  Number(
                    item.quantity || 0
                  )
                )}
              </div>

              <div className="font-bold">
                ={" "}
                {formatAmount(
                  Number(
                    item.quantity || 0
                  ) > 0
                    ? Number(
                        item.total_weight || 0
                      ) /
                      Number(
                        item.quantity || 0
                      )
                    : 0
                )}
                {" Kg"}
              </div>
            </div>


            {/* MATERIAL COST PER NOS */}

            <div className="mt-3">
              <div className="font-semibold">
                Material Cost per Nos
              </div>

              <div>
                {formatAmount(
                  Number(
                    item.quantity || 0
                  ) > 0
                    ? Number(
                        item.total_weight || 0
                      ) /
                      Number(
                        item.quantity || 0
                      )
                    : 0
                )}
                {" × ₹"}
                {formatAmount(
                  Number(
                    item.price || 0
                  )
                )}
              </div>

              <div className="font-bold">
                = ₹{" "}
                {formatAmount(
                  Number(
                    item.quantity || 0
                  ) > 0
                    ? (
                        Number(
                          item.total_weight || 0
                        ) /
                        Number(
                          item.quantity || 0
                        )
                      ) *
                      Number(
                        item.price || 0
                      )
                    : 0
                )}
              </div>
            </div>


            {/* GST PER NOS */}

            <div className="mt-3">
              <div className="font-semibold">
                GST per Nos
              </div>

              <div>
                ₹{" "}
                {formatAmount(
                  Number(
                    item.quantity || 0
                  ) > 0
                    ? (
                        Number(
                          item.total_weight || 0
                        ) /
                        Number(
                          item.quantity || 0
                        )
                      ) *
                      Number(
                        item.price || 0
                      )
                    : 0
                )}
                {" × "}
                {formatAmount(
                  Number(
                    item.gst || 0
                  )
                )}
                %
              </div>

              <div className="font-bold">
                = ₹{" "}
                {formatAmount(
                  (
                    Number(
                      item.quantity || 0
                    ) > 0
                      ? (
                          Number(
                            item.total_weight || 0
                          ) /
                          Number(
                            item.quantity || 0
                          )
                        ) *
                        Number(
                          item.price || 0
                        )
                      : 0
                  ) *
                  Number(
                    item.gst || 0
                  ) /
                  100
                )}
              </div>
            </div>


            {/* TRANSPORT / UNIT */}

            <div className="mt-3">
              <div className="font-semibold">
                Transport / Unit
              </div>

              <div className="font-bold">
                = ₹{" "}
                {formatAmount(
                  Number(
                    item.quantity || 0
                  ) > 0
                    ? calculateItemTransportation(
                        item
                      ) /
                      Number(
                        item.quantity || 0
                      )
                    : 0
                )}
              </div>
            </div>


            {/* UNIT PRICE */}

            <div className="mt-3 pt-3 border-t border-blue-200">

              <div className="font-semibold">
                Unit Price
              </div>

              <div className="text-lg font-bold">
                = ₹{" "}
                {formatAmount(
                  calculateProductUnitPriceWithGST(
                    item
                  )
                )}
              </div>

            </div>
          </>
        )}

      </div>
    )}

                        {/* =================================================
                            ITEM TOTALS
                        ================================================= */}

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
                    Transportation is entered once and automatically
                    divided between products according to their
                    purchase value.
                  </p>

                </div>

                {/* =================================================
                    TOTALS
                ================================================= */}

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

                {/* =================================================
                    BUTTONS
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
            )}

          </div>
        </div>
      );
    }