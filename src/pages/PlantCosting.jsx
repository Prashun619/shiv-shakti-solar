import { useEffect, useMemo, useState } from "react";

import {
  plantTemplates,
  manualCostItems,
  panelOptions,
  inverterOptions,
} from "../utils/plantTemplates";

export default function PlantCosting() {
  const [selectedSize, setSelectedSize] = useState("");
  const [items, setItems] = useState([]);

  const [showChargesModal, setShowChargesModal] =
    useState(false);

  const [selectedCharges, setSelectedCharges] =
    useState([]);

  const plantSizes = Object.keys(plantTemplates);

  // =====================================================
  // LOAD TEMPLATE
  // =====================================================

  function loadTemplate(size) {
    const template = plantTemplates[size];

    if (!template) {
      setItems([]);
      return;
    }

    const rows = template.map((templateItem) => ({
  item: templateItem.item,
  qty: Number(templateItem.qty || 0),
  templateQty: Number(templateItem.qty || 0),

  options:
    templateItem.item === "Panel"
      ? panelOptions
      : templateItem.item === "Inverter"
      ? inverterOptions
      : [],

  selectedOptionId: "",

  price: 0,
  gst: 0,
  amount: 0,
}));

    setItems(rows);
  }

  // =====================================================
  // PLANT SIZE CHANGE
  // =====================================================

  function handlePlantSize(size) {
    setSelectedSize(size);
    setSelectedCharges([]);
    loadTemplate(size);
  }

  // =====================================================
  // UPDATE ROW
  // =====================================================

  function updateRow(index, changes) {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              ...changes,
            }
          : item
      )
    );
  }

  // =====================================================
  // CALCULATIONS
  // =====================================================

  const materialTotal = useMemo(() => {
    return items.reduce((sum, row) => {
      return (
        sum +
        Number(row.qty || 0) *
          Number(row.price || 0)
      );
    }, 0);
  }, [items]);

  const gstTotal = useMemo(() => {
    return items.reduce((sum, row) => {
      const base =
        Number(row.qty || 0) *
        Number(row.price || 0);

      const gstRate =
        Number(row.gst || 0);

      return (
        sum +
        (base * gstRate) / 100
      );
    }, 0);
  }, [items]);

  const grandTotal =
    materialTotal + gstTotal;

  // =====================================================
  // DISPLAY
  // =====================================================

  function formatAmount(value) {
    return Number(value || 0).toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );
  }

  // =====================================================
  // ADD OTHER CHARGES
  // =====================================================

  function addSelectedCharges() {
    const newCharges =
      selectedCharges
        .filter(
          (charge) =>
            !items.some(
              (item) =>
                item.item === charge
            )
        )
        .map((charge) => ({
          item: charge,
          qty: 1,
          templateQty: 1,
          price: 0,
          gst: 0,
          amount: 0,
          manual: true,
        }));

    setItems((prev) => [
      ...prev,
      ...newCharges,
    ]);

    setSelectedCharges([]);
    setShowChargesModal(false);
  }

  return (
    <div className="p-3">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="bg-gradient-to-r from-slate-900 via-green-800 to-green-600 rounded-lg px-4 py-3 shadow border-2 border-black">

        <h1 className="text-2xl font-bold text-white">
          Plant Costing
        </h1>

        <p className="text-green-100 mt-2">
          Independent Plant Cost Calculation
        </p>

      </div>

      {/* =================================================
          PLANT SIZE
      ================================================= */}

      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-4">

        {plantSizes.map((size) => (

          <button
            key={size}
            onClick={() =>
              handlePlantSize(size)
            }
            className={`rounded-lg py-3 text-base font-semibold border-2 border-black transition-all ${
              selectedSize === size
                ? "bg-green-700 text-white"
                : "bg-white border-green-600 text-green-700 hover:bg-green-50"
            }`}
          >
            {size}
          </button>

        ))}

      </div>

      {/* =================================================
          SELECTED PLANT
      ================================================= */}

      {selectedSize && (

        <div className="mt-4 bg-white rounded-lg shadow border-2 border-black p-3">

          <div className="flex justify-between items-center mb-3">

            <h2 className="text-2xl font-bold text-green-700">
              {selectedSize} Solar Plant
            </h2>

            <button
              onClick={() =>
                setShowChargesModal(true)
              }
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold"
            >
              + Add Other Charges
            </button>

          </div>

          {/* =================================================
              TABLE
          ================================================= */}

          <div className="overflow-x-auto rounded-lg border-2 border-black">

            <table className="w-full border-collapse text-xs">

              <thead className="bg-slate-900 text-white">

                <tr>

                  <th className="border-2 border-black px-2 py-2 text-center">
                    #
                  </th>

                  <th className="border-2 border-black px-2 py-2 text-center min-w-[220px]">
                    Item
                  </th>

                  <th className="border-2 border-black px-2 py-2 text-center">
                    Qty
                  </th>

                  <th className="border-2 border-black px-2 py-2 text-center min-w-[120px]">
                    Price
                  </th>

                  <th className="border-2 border-black px-2 py-2 text-center min-w-[100px]">
                    GST %
                  </th>

                  <th className="border-2 border-black px-2 py-2 text-center min-w-[150px]">
                    Amount
                  </th>

                </tr>

              </thead>

              <tbody>

                {items.map((row, index) => {

                  const qty =
                    Number(row.qty || 0);

                  const price =
                    Number(row.price || 0);

                  const base =
                    qty * price;

                  const gst =
                    Number(row.gst || 0);

                  const gstAmount =
                    (base * gst) / 100;

                  const total =
                    base + gstAmount;

                  return (

                    <tr
                      key={`${row.item}-${index}`}
                      className={
                        index % 2 === 0
                          ? "bg-white"
                          : "bg-green-50"
                      }
                    >

                      {/* NUMBER */}

                      <td className="border-2 border-black px-2 py-2 text-center">
                        {index + 1}
                      </td>

                      {/* ITEM */}

                      <td className="border-2 border-black px-2 py-2">

                        <div className="font-semibold text-slate-800">
                          {row.item}
                        </div>

                        {row.item === "Panel" ? (
  <div>
    <div className="font-semibold mb-2">
      Panel
    </div>

    <select
      value={row.selectedOptionId || ""}
      onChange={(e) => {
        const selected =
          panelOptions.find(
            (option) =>
              option.id === e.target.value
          );

        updateRow(index, {
          selectedOptionId:
            selected?.id || "",
          price:
            Number(selected?.price || 0),
          gst:
            Number(selected?.gst || 0),
        });
      }}
      className="border border-black rounded px-2 py-1 w-full"
    >
      <option value="">
        Select Panel
      </option>

      {panelOptions.map((option) => (
        <option
          key={option.id}
          value={option.id}
        >
          {option.label}
        </option>
      ))}
    </select>
  </div>

) : row.item === "Inverter" ? (

  <div>
    <div className="font-semibold mb-2">
      Inverter
    </div>

    <select
      value={row.selectedOptionId || ""}
      onChange={(e) => {
        const selected =
          inverterOptions.find(
            (option) =>
              option.id === e.target.value
          );

        updateRow(index, {
          selectedOptionId:
            selected?.id || "",
          price:
            Number(selected?.price || 0),
          gst:
            Number(selected?.gst || 0),
        });
      }}
      className="border border-black rounded px-2 py-1 w-full"
    >
      <option value="">
        Select Inverter
      </option>

      {inverterOptions.map((option) => (
        <option
          key={option.id}
          value={option.id}
        >
          {option.label}
        </option>
      ))}
    </select>
  </div>

) : (
  <div className="font-semibold">
    {row.item}
  </div>
)}

                        {row.item === "Inverter" && (
                          <div className="text-xs text-slate-500 mt-1">
                            Enter the selected inverter
                            price manually.
                          </div>
                        )}

                      </td>

                      {/* QTY */}

                      <td className="border-2 border-black px-2 py-2 text-center">

                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={
                            row.qty === 0
                              ? ""
                              : row.qty
                          }
                          onChange={(e) => {

                            const qty =
                              e.target.value === ""
                                ? 0
                                : Number(
                                    e.target.value
                                  );

                            updateRow(
                              index,
                              {
                                qty,
                              }
                            );
                          }}
                          className="border border-black rounded px-2 py-1 w-20 text-center"
                        />

                      </td>

                      {/* PRICE */}

                      <td className="border-2 border-black px-2 py-2 text-center">

                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={row.price}
                          onChange={(e) => {

                            const price =
                              e.target.value === ""
                                ? 0
                                : Number(
                                    e.target.value
                                  );

                            updateRow(
                              index,
                              {
                                price,
                              }
                            );
                          }}
                          className="border border-black rounded px-2 py-1 w-28 text-center"
                        />

                      </td>

                      {/* GST */}

                      <td className="border-2 border-black px-2 py-2 text-center">

                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={row.gst}
                          onChange={(e) => {

                            const gst =
                              e.target.value === ""
                                ? 0
                                : Number(
                                    e.target.value
                                  );

                            updateRow(
                              index,
                              {
                                gst,
                              }
                            );
                          }}
                          className="border border-black rounded px-2 py-1 w-20 text-center"
                        />

                      </td>

                      {/* TOTAL */}

                      <td className="border-2 border-black px-2 py-2 text-center font-semibold text-green-700">

                        ₹{" "}
                        {formatAmount(
                          total
                        )}

                      </td>

                    </tr>

                  );
                })}

              </tbody>

            </table>

          </div>

          {/* =================================================
              SUMMARY
          ================================================= */}

          <div className="mt-4 flex justify-end">

            <div className="w-80 border-2 border-black rounded-xl shadow-lg overflow-hidden">

              <div className="bg-slate-900 text-white text-center py-3 font-bold">
                Cost Summary
              </div>

              <div className="bg-white">

                <div className="grid grid-cols-2 border-t-2 border-black">

                  <div className="border-r-2 border-black px-3 py-2 font-medium">
                    Material Total
                  </div>

                  <div className="px-3 py-2 text-right font-semibold">
                    ₹{" "}
                    {formatAmount(
                      materialTotal
                    )}
                  </div>

                </div>

                <div className="grid grid-cols-2 border-t-2 border-black">

                  <div className="border-r-2 border-black px-3 py-2 font-medium">
                    Total GST
                  </div>

                  <div className="px-3 py-2 text-right font-semibold">
                    ₹{" "}
                    {formatAmount(
                      gstTotal
                    )}
                  </div>

                </div>

                <div className="grid grid-cols-2 border-t-2 border-black bg-green-100">

                  <div className="border-r-2 border-black px-3 py-3 text-lg font-bold">
                    Grand Total
                  </div>

                  <div className="px-3 py-3 text-right text-lg font-bold text-green-700">
                    ₹{" "}
                    {formatAmount(
                      grandTotal
                    )}
                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      )}

      {/* =================================================
          OTHER CHARGES MODAL
      ================================================= */}

      {showChargesModal && (

        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">

          <div className="bg-white rounded-xl shadow-2xl border-2 border-black w-[700px] max-w-[95vw] max-h-[80vh] overflow-hidden">

            <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">

              <h2 className="text-xl font-bold">
                Add Other Charges
              </h2>

              <button
                onClick={() => {
                  setSelectedCharges([]);
                  setShowChargesModal(false);
                }}
                className="text-2xl hover:text-red-400"
              >
                ✕
              </button>

            </div>

            <div className="p-5 border-b">

              <button
                className="bg-green-600 text-white px-4 py-2 rounded-lg"
                onClick={() =>
                  setSelectedCharges([
                    ...manualCostItems,
                  ])
                }
              >
                Select All
              </button>

            </div>

            <div className="grid grid-cols-2 gap-3 p-5 max-h-[380px] overflow-y-auto">

              {manualCostItems.map(
                (charge) => (

                  <label
                    key={charge}
                    className="border rounded-lg p-3 hover:bg-green-50 cursor-pointer flex items-center gap-3"
                  >

                    <input
                      type="checkbox"
                      checked={selectedCharges.includes(
                        charge
                      )}
                      onChange={(e) => {

                        if (
                          e.target.checked
                        ) {

                          setSelectedCharges(
                            (prev) => [
                              ...prev,
                              charge,
                            ]
                          );

                        } else {

                          setSelectedCharges(
                            (prev) =>
                              prev.filter(
                                (item) =>
                                  item !==
                                  charge
                              )
                          );

                        }

                      }}
                    />

                    <div className="text-xl">
                      💰
                    </div>

                    <div className="font-medium">
                      {charge}
                    </div>

                  </label>

                )
              )}

            </div>

            <div className="border-t p-4 flex justify-end gap-3">

              <button
                className="px-5 py-2 border rounded-lg"
                onClick={() => {
                  setSelectedCharges([]);
                  setShowChargesModal(false);
                }}
              >
                Cancel
              </button>

              <button
                className="bg-green-700 hover:bg-green-800 text-white px-6 py-2 rounded-lg"
                onClick={
                  addSelectedCharges
                }
              >
                Add Selected
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}