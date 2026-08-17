import { useEffect, useMemo, useState } from "react";

import {
  addInventory,
  updateInventory,
} from "../services/inventoryService";

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

  const [loading, setLoading] = useState(false);

  const isEditMode = Boolean(product);

  useEffect(() => {
    if (!open) return;

    if (product) {
      setDate(
        product.date ||
          new Date().toISOString().split("T")[0]
      );

      setSupplier(product.supplier || "");

      setTransportation(
        product.transportation || ""
      );

      setProducts([
        {
          product_name:
            product.product_name || "",

          category:
            product.category ||
            productCategoryMap[
              product.product_name
            ] ||
            "",

          company:
            product.company || "",

          specification:
            product.specification || "",

          quantity:
            product.quantity ?? "",

          unit:
            product.unit || "Nos",

          price:
            product.price ??
            product.unit_cost ??
            "",

          total_weight:
            product.total_weight ?? "",

          gst:
            product.gst ??
            Number(product.cgst || 0) +
              Number(product.sgst || 0),

          remarks:
            product.remarks || "",
        },
      ]);
    } else {
      setDate(
        new Date().toISOString().split("T")[0]
      );

      setSupplier("");

      setTransportation("");

      setProducts([
        createEmptyProduct(),
      ]);
    }
  }, [open, product]);

  function updateProduct(index, field, value) {
    setProducts((prev) =>
      prev.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item;
        }

        return {
          ...item,
          [field]: value,
        };
      })
    );
  }

  function handleProductChange(
    index,
    field,
    value
  ) {
    if (field === "product_name") {
      updateProduct(
        index,
        "product_name",
        value
      );

      updateProduct(
        index,
        "category",
        productCategoryMap[value] || ""
      );

      return;
    }

    if (field === "unit") {
      setProducts((prev) =>
        prev.map((item, itemIndex) => {
          if (itemIndex !== index) {
            return item;
          }

          return {
            ...item,
            unit: value,
            total_weight:
              value === "Kg"
                ? item.total_weight
                : "",
          };
        })
      );

      return;
    }

    updateProduct(
      index,
      field,
      value
    );
  }

  function addProductRow() {
    setProducts((prev) => [
      ...prev,
      createEmptyProduct(),
    ]);
  }

  function removeProductRow(index) {
    if (products.length === 1) {
      return;
    }

    setProducts((prev) =>
      prev.filter(
        (_, itemIndex) =>
          itemIndex !== index
      )
    );
  }

 function calculateProductBase(item) {
  const quantity = Number(item.quantity || 0);
  const price = Number(item.price || 0);

  if (item.unit === "Kg") {
    const totalWeight = Number(
      item.total_weight || 0
    );

    return quantity * totalWeight * price;
  }

  return quantity * price;
}

  function calculateProductGST(item) {
    const base =
      calculateProductBase(item);

    const gst =
      Number(item.gst || 0);

    return (
      base * gst / 100
    );
  }

  const baseAmount = useMemo(() => {
    return products.reduce(
      (sum, item) =>
        sum +
        calculateProductBase(item),
      0
    );
  }, [products]);

  const gstAmount = useMemo(() => {
    return products.reduce(
      (sum, item) =>
        sum +
        calculateProductGST(item),
      0
    );
  }, [products]);

  const totalAmount = useMemo(() => {
    return (
      baseAmount +
      gstAmount +
      Number(transportation || 0)
    );
  }, [
    baseAmount,
    gstAmount,
    transportation,
  ]);

  function validateProducts() {
    for (
      let index = 0;
      index < products.length;
      index++
    ) {
      const item = products[index];

      if (!item.product_name) {
        alert(
          `Please select Product for row ${
            index + 1
          }.`
        );
        return false;
      }

      if (!item.category) {
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
        if (!item.company.trim()) {
          alert(
            `Please enter Company for row ${
              index + 1
            }.`
          );
          return false;
        }

        if (!item.specification.trim()) {
          alert(
            `Please enter Specification for row ${
              index + 1
            }.`
          );
          return false;
        }
      }

      if (
        Number(item.quantity || 0) <= 0
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
        Number(item.total_weight || 0) <= 0
      ) {
        alert(
          `Please enter Total Weight for row ${
            index + 1
          }.`
        );
        return false;
      }

      if (
        Number(item.price || 0) < 0
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

  async function handleSubmit(e) {
    e.preventDefault();

    if (!supplier.trim()) {
      alert("Please enter Supplier.");
      return;
    }

    if (!validateProducts()) {
      return;
    }

    try {
      setLoading(true);

      // =========================================
      // EDIT EXISTING SINGLE PRODUCT
      // =========================================

      if (isEditMode) {
        const item = products[0];

        const payload = {
          date,

          supplier,

          product_name:
            item.product_name,

          category:
            item.category,

          company:
            item.company,

          specification:
            item.specification,

          quantity:
            Number(item.quantity || 0),

          unit:
            item.unit,

          price:
            Number(item.price || 0),

          total_weight:
            Number(item.total_weight || 0),

          gst:
            Number(item.gst || 0),

          // Keep old fields zeroed for the
          // new GST-only calculation.
          cgst: 0,
          sgst: 0,

          transportation:
            Number(transportation || 0),

          remarks:
            item.remarks || "",

          active: true,

          is_default: false,
        };

        await updateInventory(
          product.id,
          payload
        );
      }

      // =========================================
      // ADD MULTIPLE PRODUCTS
      // =========================================

      else {
        await addInventory({
          date,
          supplier,
          transportation:
            Number(transportation || 0),
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

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

      <div className="bg-white w-full max-w-5xl rounded-xl shadow-lg p-5 max-h-[92vh] overflow-y-auto">

        <div className="flex justify-between items-center mb-4">

          <h2 className="text-xl font-bold">
            {isEditMode
              ? "Edit Purchase"
              : "Add Purchase"}
          </h2>

          {!isEditMode && (
            <button
              type="button"
              onClick={addProductRow}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              + Add Product
            </button>
          )}

        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >

          {/* HEADER */}

          <div className="grid grid-cols-2 gap-3">

            <div>
              <label className="block mb-1 font-medium">
                Date
              </label>

              <input
                type="date"
                value={date}
                onChange={(e) =>
                  setDate(e.target.value)
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
                  setSupplier(e.target.value)
                }
                className="border rounded-lg p-2 w-full"
                required
              />
            </div>

          </div>

          {/* PRODUCTS */}

          {products.map(
            (item, index) => {

              const itemBase =
                calculateProductBase(
                  item
                );

              const itemGst =
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
                      Product {index + 1}
                    </h3>

                    {!isEditMode &&
                      products.length > 1 && (
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
                          (productName) => (
                            <option
                              key={productName}
                              value={productName}
                            >
                              {productName}
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
                        value={item.category}
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
                          (category) => (
                            <option
                              key={category}
                              value={category}
                            >
                              {category}
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
                          placeholder={
                            item.category ===
                            "Panel"
                              ? "605Wp"
                              : "3KW"
                          }
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
                          (unit) => (
                            <option
                              key={unit}
                              value={unit}
                            >
                              {unit}
                            </option>
                          )
                        )}

                      </select>
                    </div>

                    {/* TOTAL WEIGHT FOR KG */}

                   {item.unit === "Kg" && (
  <div>
    <label className="block mb-1 font-medium">
  Total Weight / Item (Kg)
</label>

    <input
      type="number"
      min="0"
      step="any"
      value={item.total_weight}
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

                  <div className="mt-3 text-sm text-slate-600">

  {item.unit === "Kg" ? (
    <div className="mb-2 rounded-lg bg-blue-50 border border-blue-200 p-3">

      <div className="font-medium text-blue-800">
        Calculation
      </div>

      <div className="text-blue-700 mt-1">
        {Number(item.quantity || 0)}
        {" × "}
        {Number(item.total_weight || 0)}
        {" Kg × ₹"}
        {Number(item.price || 0).toFixed(2)}
      </div>

      <div className="text-blue-700">
        Base Amount = ₹{" "}
        {itemBase.toLocaleString("en-IN", {
          minimumFractionDigits: 2,
        })}
      </div>

    </div>
  ) : null}

  <div className="flex justify-between">

    <span>
      Base: ₹{" "}
      {itemBase.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
      })}
    </span>

    <span>
      GST: ₹{" "}
      {itemGst.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
      })}
    </span>

    <span className="font-semibold">
      Product Total: ₹{" "}
      {(itemBase + itemGst).toLocaleString(
        "en-IN",
        {
          minimumFractionDigits: 2,
        }
      )}
    </span>

  </div>

</div>

                </div>
              );
            }
          )}

          {/* TRANSPORTATION */}

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

          {/* SUMMARY */}

          <div className="bg-gray-50 rounded-lg p-4 border">

            <div className="flex justify-between mb-2">
              <span>
                Base Amount
              </span>

              <strong>
                ₹{" "}
                {baseAmount.toLocaleString(
                  "en-IN",
                  {
                    minimumFractionDigits: 2,
                  }
                )}
              </strong>
            </div>

            <div className="flex justify-between mb-2">
              <span>
                GST Amount
              </span>

              <strong>
                ₹{" "}
                {gstAmount.toLocaleString(
                  "en-IN",
                  {
                    minimumFractionDigits: 2,
                  }
                )}
              </strong>
            </div>

            <div className="flex justify-between mb-2">
              <span>
                Transportation
              </span>

              <strong>
                ₹{" "}
                {Number(
                  transportation || 0
                ).toLocaleString(
                  "en-IN",
                  {
                    minimumFractionDigits: 2,
                  }
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
                {totalAmount.toLocaleString(
                  "en-IN",
                  {
                    minimumFractionDigits: 2,
                  }
                )}
              </span>
            </div>

          </div>

          {/* ACTIONS */}

          <div className="flex justify-end gap-3 pt-2">

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-lg border"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
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