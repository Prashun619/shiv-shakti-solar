import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";

export default function ViewUsedInventoryModal({
  open,
  onClose,
  item,
}) {
  const [plantTotalValue, setPlantTotalValue] = useState(0);

  useEffect(() => {
    async function loadPlantTotalValue() {
      if (!open || !item) {
        setPlantTotalValue(0);
        return;
      }

      const { data, error } = await supabase
        .from("projects")
        .select("total_amount")
        .eq("project_no", item.project_no)
        .maybeSingle();

      if (error) {
        console.error(
          "Error fetching plant total value:",
          error
        );

        setPlantTotalValue(0);
        return;
      }

      setPlantTotalValue(
        Number(data?.total_amount || 0)
      );
    }

    loadPlantTotalValue();
  }, [open, item]);

  if (!open || !item) return null;

  // ============================================================
  // HELPERS
  // ============================================================

  function getDisplayProductName(product) {
    const productName =
      String(product.product_name || "").trim();

    const category =
      String(product.category || "").trim();

    const company =
      String(
        product.company ||
          product.brand ||
          product.manufacturer ||
          ""
      ).trim();

    const specification =
      String(
        product.specification ||
          product.capacity ||
          product.panel_capacity ||
          product.inverter_capacity ||
          ""
      ).trim();

    const lowerName = productName.toLowerCase();

    // PANEL
    if (
      lowerName === "panel" ||
      category.toLowerCase() === "panel"
    ) {
      return [
        company,
        specification,
        "panel",
      ]
        .filter(Boolean)
        .join(" ");
    }

    // INVERTER
    if (
      lowerName === "inverter" ||
      category.toLowerCase() === "inverter"
    ) {
      return [
        company,
        specification,
        "inverter",
      ]
        .filter(Boolean)
        .join(" ");
    }

    // KIT
    if (
      lowerName === "kit" ||
      category.toLowerCase() === "kit"
    ) {
      return [
        company,
        specification,
        "kit",
      ]
        .filter(Boolean)
        .join(" ");
    }

    return productName || "-";
  }

  function isPanel(product) {
    return (
      String(product?.category || "")
        .trim()
        .toLowerCase() === "panel" ||
      String(product?.product_name || "")
        .trim()
        .toLowerCase() === "panel"
    );
  }

  function isInverter(product) {
    return (
      String(product?.category || "")
        .trim()
        .toLowerCase() === "inverter" ||
      String(product?.product_name || "")
        .trim()
        .toLowerCase() === "inverter"
    );
  }

  function cleanArray(value) {
    if (!Array.isArray(value)) return [];

    return value.map((entry) =>
      String(entry ?? "").trim()
    );
  }

  // ============================================================
  // PRODUCTS
  // ============================================================

  const allProducts = Object.values(
    (item.products || [])
      .filter(
        (product) =>
          Number(product.quantity || 0) > 0
      )
      .reduce((acc, product) => {
        const unitPrice = Number(
          product.unit_price ??
            product.unit_cost ??
            product.price ??
            0
        );

        const key =
          (product.product_name || "") +
          "_" +
          (product.category || "") +
          "_" +
          (product.company || "") +
          "_" +
          (product.specification || "") +
          "_" +
          unitPrice;

        const productSerialNumbers = cleanArray(
          product.serial_numbers
        );

        const productInverterModels = cleanArray(
          product.inverter_models
        );

        if (!acc[key]) {
          acc[key] = {
            ...product,

            product_name:
              getDisplayProductName(product),

            category:
              product.category || "",

            company:
              product.company || "",

            specification:
              product.specification || "",

            quantity:
              Number(product.quantity || 0),

            unit_price:
              unitPrice,

            total:
              Number(product.total || 0),

            serial_numbers:
              [...productSerialNumbers],

            inverter_models:
              [...productInverterModels],
          };
        } else {
          acc[key].quantity +=
            Number(product.quantity || 0);

          acc[key].total +=
            Number(product.total || 0);

          // Merge serial numbers
          if (productSerialNumbers.length) {
            acc[key].serial_numbers = [
              ...(acc[key].serial_numbers || []),
              ...productSerialNumbers,
            ];
          }

          // Merge inverter models
          if (productInverterModels.length) {
            acc[key].inverter_models = [
              ...(acc[key].inverter_models || []),
              ...productInverterModels,
            ];
          }
        }

        return acc;
      }, {})
  ).map((product) => {
    const quantity =
      Number(product.quantity || 0);

    const unitPrice =
      Number(product.unit_price || 0);

    return {
      ...product,

      total:
        Number(product.total || 0) > 0
          ? Number(product.total)
          : quantity * unitPrice,

      serial_numbers: cleanArray(
        product.serial_numbers
      ),

      inverter_models: cleanArray(
        product.inverter_models
      ),
    };
  });

  // ============================================================
  // PANEL / INVERTER PRODUCTS
  // ============================================================

  const panelProducts = allProducts.filter(
    (product) => isPanel(product)
  );

  const inverterProducts = allProducts.filter(
    (product) => isInverter(product)
  );

  // ============================================================
  // ADDITIONAL CHARGES
  // ============================================================

  const additionalCharges = [
    {
      name: "Bhada Charges",
      amount: Number(
        item.bhada_charges ?? 0
      ),
    },

    {
      name: "Cement Charges",
      amount: Number(
        item.cement_charges ?? 0
      ),
    },

    {
      name: "Gitti Charges",
      amount: Number(
        item.gitti_charges ?? 0
      ),
    },

    {
      name: "Installation Charges",
      amount: Number(
        item.installation_charges ?? 0
      ),
    },

    {
      name: "JE Charges",
      amount: Number(
        item.je_charges ?? 0
      ),
    },

    {
      name: "Load Extension Charges",
      amount: Number(
        item.load_extension_charges ?? 0
      ),
    },

    {
      name: "Meter Connection Charges",
      amount: Number(
        item.meter_connection_charges ?? 0
      ),
    },

    {
      name: "Meter Name Change Charge",
      amount: Number(
        item.name_change_charges ?? 0
      ),
    },

    {
      name: "Meter Change Charge",
      amount: Number(
        item.meter_change_charges ?? 0
      ),
    },

    {
      name: "Net Metering Charges",
      amount: Number(
        item.net_metering_charges ?? 0
      ),
    },

    {
      name: "Sand Charges",
      amount: Number(
        item.sand_charges ?? 0
      ),
    },

    {
      name: "Vendor Charges",
      amount: Number(
        item.vendor_charges ?? 0
      ),
    },
  ].filter(
    (charge) => charge.amount > 0
  );

  // ============================================================
  // COST CALCULATIONS
  // ============================================================

  const productCost =
    allProducts.reduce(
      (sum, product) =>
        sum + Number(product.total || 0),
      0
    );

  const extraCost =
    additionalCharges.reduce(
      (sum, charge) =>
        sum + Number(charge.amount || 0),
      0
    );

  const grandTotal =
    productCost + extraCost;

  const profit =
    plantTotalValue - grandTotal;

  const profitPercent =
    plantTotalValue > 0
      ? (profit / plantTotalValue) * 100
      : 0;

  // ============================================================
  // SERIAL NUMBERS
  // ============================================================

  function renderSerialNumbers(product) {
    const serials = cleanArray(
      product.serial_numbers
    ).filter(Boolean);

    if (!serials.length) {
      return (
        <span className="text-slate-400">
          -
        </span>
      );
    }

    return (
      <div className="flex flex-col gap-1">
        {serials.map((serial, index) => (
          <div
            key={`${serial}-${index}`}
            className="bg-slate-100 border border-slate-300 rounded px-3 py-1 text-xs font-semibold text-slate-800"
          >
            {index + 1}. {serial}
          </div>
        ))}
      </div>
    );
  }

  // ============================================================
  // INVERTER MODELS
  // ============================================================

  function renderInverterModels(product) {
    let models = cleanArray(
      product.inverter_models
    ).filter(Boolean);

    // Backward compatibility for old records
    if (!models.length) {
      const oldSpecification =
        String(
          product.specification || ""
        ).trim();

      if (oldSpecification) {
        models = [oldSpecification];
      }
    }

    if (!models.length) {
      return (
        <span className="text-slate-400">
          -
        </span>
      );
    }

    return (
      <div className="flex flex-col gap-1">
        {models.map((model, index) => (
          <div
            key={`${model}-${index}`}
            className="bg-indigo-50 border border-indigo-200 rounded px-3 py-1 text-xs font-semibold text-indigo-800"
          >
            {index + 1}. {model}
          </div>
        ))}
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-5">

      <div className="bg-white rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.25)] border border-slate-200 w-full max-w-7xl max-h-[92vh] overflow-auto">

        {/* =====================================================
            HEADER
        ====================================================== */}

        <div className="bg-gradient-to-r from-slate-900 via-indigo-900 to-blue-700 p-5 rounded-t-2xl">

          <h2 className="text-2xl font-bold text-white">
            Material Consumption Details
          </h2>

          <p className="text-blue-100 text-sm mt-1">
            Customer Material Consumption Report
          </p>

        </div>

        <div className="p-6">

          {/* ===================================================
              CUSTOMER DETAILS
          ==================================================== */}

          <div className="border rounded-xl shadow-sm bg-gray-50 p-5 mb-6">

            <div className="grid grid-cols-3 gap-4 text-sm">

              {/* Customer Name */}

              <div className="bg-white border border-slate-200 rounded-lg p-3">

                <div className="text-xs font-semibold text-slate-500 uppercase">
                  Customer Name
                </div>

                <div className="mt-1 text-base font-bold text-slate-900">
                  {item.customers?.customer_name ||
                    item.customer_name ||
                    "-"}
                </div>

              </div>

              {/* Plant Size */}

              <div className="bg-white border border-slate-200 rounded-lg p-3">

                <div className="text-xs font-semibold text-slate-500 uppercase">
                  Plant Size
                </div>

                <div className="mt-1 text-base font-bold text-slate-900">
                  {item.plant_size || "-"} KW
                </div>

              </div>

              {/* Location */}

              <div className="bg-white border border-slate-200 rounded-lg p-3">

                <div className="text-xs font-semibold text-slate-500 uppercase">
                  Location
                </div>

                <div className="mt-1 text-base font-bold text-slate-900">
                  {item.location || "-"}
                </div>

              </div>

              {/* Plant Total Value */}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">

                <div className="text-xs font-semibold text-blue-600 uppercase">
                  Plant Total Value
                </div>

                <div className="mt-1 text-lg font-extrabold text-blue-700">
                  ₹{" "}
                  {plantTotalValue.toLocaleString(
                    "en-IN",
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  )}
                </div>

              </div>

              {/* Plant Cost */}

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">

                <div className="text-xs font-semibold text-orange-600 uppercase">
                  Plant Cost
                </div>

                <div className="mt-1 text-lg font-extrabold text-orange-700">
                  ₹{" "}
                  {grandTotal.toLocaleString(
                    "en-IN",
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  )}
                </div>

              </div>

              {/* Profit */}

              <div
                className={`rounded-lg p-3 border ${
                  profit >= 0
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}
              >

                <div
                  className={`text-xs font-semibold uppercase ${
                    profit >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  Profit
                </div>

                <div
                  className={`mt-1 text-lg font-extrabold ${
                    profit >= 0
                      ? "text-green-700"
                      : "text-red-700"
                  }`}
                >
                  ₹{" "}
                  {profit.toLocaleString(
                    "en-IN",
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  )}
                </div>

              </div>

              {/* Profit % */}

              <div
                className={`rounded-lg p-3 border ${
                  profit >= 0
                    ? "bg-emerald-50 border-emerald-200"
                    : "bg-red-50 border-red-200"
                }`}
              >

                <div
                  className={`text-xs font-semibold uppercase ${
                    profit >= 0
                      ? "text-emerald-600"
                      : "text-red-600"
                  }`}
                >
                  Profit %
                </div>

                <div
                  className={`mt-1 text-lg font-extrabold ${
                    profit >= 0
                      ? "text-emerald-700"
                      : "text-red-700"
                  }`}
                >
                  {profitPercent.toFixed(2)}%
                </div>

              </div>

            </div>

          </div>

          {/* ===================================================
              PRODUCTS USED
          ==================================================== */}

          <div className="flex justify-between items-center mb-4">

            <h3 className="text-xl font-bold border-l-4 border-indigo-700 pl-3">
              Products Used
            </h3>

          </div>

          <div className="overflow-x-auto rounded-lg border border-black shadow-sm">

            <table className="w-full min-w-[900px] border-collapse text-sm">

              <thead className="bg-gradient-to-r from-indigo-700 to-blue-700 text-white">

                <tr>

                  <th className="border border-black px-3 py-2 text-center text-xs font-bold">
                    Product
                  </th>

                  <th className="border border-black px-3 py-2 text-center text-xs font-bold">
                    Category
                  </th>

                  <th className="border border-black px-3 py-2 text-center text-xs font-bold">
                    Quantity
                  </th>

                  <th className="border border-black px-3 py-2 text-center text-xs font-bold">
                    Unit Price
                  </th>

                  <th className="border border-black px-3 py-2 text-center text-xs font-bold">
                    Total
                  </th>

                </tr>

              </thead>

              <tbody>

                {allProducts.map(
                  (product, index) => (
                    <tr
                      key={index}
                      className="hover:bg-blue-50 transition border border-black"
                    >

                      <td className="border border-black px-3 py-2 font-semibold text-center text-sm">
                        {product.product_name}
                      </td>

                      <td className="border border-black px-3 py-2 text-center text-sm">
                        {product.category}
                      </td>

                      <td className="border border-black px-3 py-2 text-center text-sm">

                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-semibold text-sm">
                          {product.quantity}
                        </span>

                      </td>

                      <td className="border border-black px-3 py-2 text-center font-semibold text-indigo-700">

                        ₹{" "}
                        {Number(
                          product.unit_price || 0
                        ).toLocaleString(
                          "en-IN",
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}

                      </td>

                      <td className="border border-black px-3 py-2 text-center font-bold text-emerald-700 text-sm">

                        ₹{" "}
                        {Number(
                          product.total || 0
                        ).toLocaleString(
                          "en-IN",
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}

                      </td>

                    </tr>
                  )
                )}

                {/* ADDITIONAL CHARGES */}

                {additionalCharges.map(
                  (charge, index) => (
                    <tr
                      key={`charge-${index}`}
                      className="hover:bg-blue-50 transition border border-black"
                    >

                      <td className="border border-black px-3 py-2 font-semibold text-center text-sm">
                        {charge.name}
                      </td>

                      <td className="border border-black px-3 py-2 text-center text-sm">
                        Additional Charges
                      </td>

                      <td className="border border-black px-3 py-2 text-center text-sm">
                        1
                      </td>

                      <td className="border border-black px-3 py-2 text-center font-semibold text-indigo-700">

                        ₹{" "}
                        {charge.amount.toLocaleString(
                          "en-IN",
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}

                      </td>

                      <td className="border border-black px-3 py-2 text-center font-bold text-emerald-700 text-sm">

                        ₹{" "}
                        {charge.amount.toLocaleString(
                          "en-IN",
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}

                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>

         {/* ===================================================
    PANEL / INVERTER DETAILS
==================================================== */}

{(panelProducts.length > 0 ||
  inverterProducts.length > 0) && (

  <div className="mt-8">

    <h3 className="text-xl font-bold border-l-4 border-indigo-700 pl-3 mb-4">
      Panel / Inverter Details
    </h3>

    <div className="overflow-x-auto rounded-lg border border-black shadow-sm">

      <table className="w-full min-w-[1000px] border-collapse text-sm">

        <thead className="bg-gradient-to-r from-indigo-700 to-blue-700 text-white">

          <tr>

            <th className="border border-black px-4 py-3 text-center text-xs font-bold">
              Panel Company
            </th>

            <th className="border border-black px-4 py-3 text-center text-xs font-bold">
              Panel Serial Number
            </th>

            <th className="border border-black px-4 py-3 text-center text-xs font-bold">
              Inverter Company
            </th>

            <th className="border border-black px-4 py-3 text-center text-xs font-bold">
              Model
            </th>

            <th className="border border-black px-4 py-3 text-center text-xs font-bold">
              Inverter Serial Number
            </th>

          </tr>

        </thead>

        <tbody>
  {(() => {
    const panelData = panelProducts.flatMap((product) => {
      const serials = cleanArray(product.serial_numbers).filter(Boolean);

      const quantity = Number(product.quantity || 0);

      const count = Math.max(quantity, serials.length);

      return Array.from({ length: count }, (_, index) => ({
        company: product.company || "-",
        serial: serials[index] || "-",
      }));
    });

    const inverterData = inverterProducts.flatMap((product) => {
      const serials = cleanArray(product.serial_numbers).filter(Boolean);

      let models = cleanArray(product.inverter_models).filter(Boolean);

      // Backward compatibility for old records
      if (!models.length) {
        const specification = String(
          product.specification || ""
        ).trim();

        if (specification) {
          models = [specification];
        }
      }

      const quantity = Number(product.quantity || 0);

      const count = Math.max(
        quantity,
        serials.length,
        models.length
      );

      return Array.from({ length: count }, (_, index) => ({
        company: product.company || "-",
        model: models[index] || "-",
        serial: serials[index] || "-",
      }));
    });

    const rowCount = Math.max(
      panelData.length,
      inverterData.length
    );

    return Array.from({ length: rowCount }, (_, index) => {
      const panel = panelData[index];
      const inverter = inverterData[index];

      return (
        <tr
          key={`panel-inverter-${index}`}
          className="hover:bg-blue-50 transition"
        >
          {/* PANEL COMPANY */}
          <td className="border border-black px-4 py-3 text-center align-middle font-semibold text-slate-800">
            {index === 0
              ? panel?.company || "-"
              : ""}
          </td>

          {/* PANEL SERIAL NUMBER */}
          <td className="border border-black px-4 py-3 text-center align-middle font-semibold text-slate-800">
            {panel?.serial || "-"}
          </td>

          {/* INVERTER COMPANY */}
          <td className="border border-black px-4 py-3 text-center align-middle font-semibold text-slate-800">
            {index === 0
              ? inverter?.company || "-"
              : ""}
          </td>

          {/* MODEL */}
          <td className="border border-black px-4 py-3 text-center align-middle font-semibold text-indigo-700">
            {index === 0
              ? inverter?.model || "-"
              : ""}
          </td>

          {/* INVERTER SERIAL NUMBER */}
          <td className="border border-black px-4 py-3 text-center align-middle font-semibold text-slate-800">
            {inverter?.serial || "-"}
          </td>
        </tr>
      );
    });
  })()}
</tbody>

      </table>

    </div>

  </div>

)}
          {/* ===================================================
              COST SUMMARY
          ==================================================== */}

          <div className="flex justify-end mt-8">

            <div className="border border-black rounded-xl overflow-hidden w-96 text-sm">

              {/* Product Cost */}

              <div className="flex justify-between px-4 py-3 border-b">

                <span className="font-semibold">
                  Product Cost
                </span>

                <span className="font-bold">
                  ₹{" "}
                  {productCost.toLocaleString(
                    "en-IN",
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  )}
                </span>

              </div>

              {/* Additional Charges */}

              <div className="flex justify-between px-4 py-3 border-b">

                <span className="font-semibold">
                  Additional Charges
                </span>

                <span className="font-bold">
                  ₹{" "}
                  {extraCost.toLocaleString(
                    "en-IN",
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  )}
                </span>

              </div>

              {/* Total */}

              <div className="flex justify-between px-4 py-3 bg-indigo-700 text-white">

                <span className="font-bold">
                  Total
                </span>

                <span className="font-bold">
                  ₹{" "}
                  {grandTotal.toLocaleString(
                    "en-IN",
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  )}
                </span>

              </div>

            </div>

          </div>

          {/* ===================================================
              CLOSE BUTTON
          ==================================================== */}

          <div className="flex justify-end mt-8">

            <button
              onClick={onClose}
              className="bg-gradient-to-r from-indigo-700 to-blue-700 hover:from-indigo-800 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-300 text-white px-8 py-3 rounded-xl font-semibold"
            >
              Close
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}