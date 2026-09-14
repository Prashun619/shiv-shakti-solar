import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Pencil,
  Trash2,
} from "lucide-react";

import InventoryModal from "../components/InventoryModal";

import {
  getInventory,
  deleteInventory,
} from "../services/inventoryService";

// =====================================================
// NUMBER TO WORDS - INDIAN FORMAT
// =====================================================

function numberToWordsIndian(num) {
  num = Number(num || 0);

  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];

  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  function twoDigits(n) {
    if (n < 20) {
      return ones[n];
    }

    return (
      tens[Math.floor(n / 10)] +
      (n % 10
        ? " " + ones[n % 10]
        : "")
    );
  }

  function convert(n) {
    if (n === 0) {
      return "";
    }

    let result = "";

    if (n >= 10000000) {
      result +=
        convert(
          Math.floor(
            n / 10000000
          )
        ) +
        " Crore ";

      n %= 10000000;
    }

    if (n >= 100000) {
      result +=
        convert(
          Math.floor(
            n / 100000
          )
        ) +
        " Lakh ";

      n %= 100000;
    }

    if (n >= 1000) {
      result +=
        convert(
          Math.floor(
            n / 1000
          )
        ) +
        " Thousand ";

      n %= 1000;
    }

    if (n >= 100) {
      result +=
        ones[
          Math.floor(
            n / 100
          )
        ] +
        " Hundred ";

      n %= 100;
    }

    if (n > 0) {
      result += twoDigits(n);
    }

    return result.trim();
  }

  const rupees = Math.floor(num);

  const paise = Math.round(
    (num - rupees) * 100
  );

  let words = "Rupees ";

  if (rupees === 0) {
    words += "Zero";
  } else {
    words += convert(rupees);
  }

  if (paise > 0) {
    words +=
      " and " +
      convert(paise) +
      " Paise";
  }

  return words
    .replace(
      /^Rupees\s+/i,
      ""
    )
    .replace(
      /\s+Only$/i,
      ""
    );
}

// =====================================================
// COMPONENT
// =====================================================

export default function Inventory() {
  const [items, setItems] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [showModal, setShowModal] =
    useState(false);

  const [editingProduct, setEditingProduct] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  // =====================================================
  // LOAD INVENTORY
  // =====================================================

  useEffect(() => {
    loadInventory();
  }, []);

  // =====================================================
  // LOAD INVENTORY WHEN SEARCH CHANGES
  // =====================================================

  useEffect(() => {
    loadInventory();
  }, [search]);

  // =====================================================
  // LOAD INVENTORY
  // =====================================================

  async function loadInventory() {
    try {
      setLoading(true);

      const data =
        await getInventory();

      setItems(data || []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  // =====================================================
  // DELETE
  // =====================================================

  async function handleDelete(id) {
    if (
      !window.confirm(
        "Delete this purchase?"
      )
    ) {
      return;
    }

    try {
      await deleteInventory(id);

      loadInventory();
    } catch (error) {
      console.log(error);

      alert(
        error.message
      );
    }
  }

  // =====================================================
  // OPEN PURCHASE
  // DATE NOW WORKS AS VIEW BUTTON
  // =====================================================

  function handleView(item) {
    setEditingProduct(item);
    setShowModal(true);
  }

  // =====================================================
  // OPEN EDIT
  // =====================================================

  function handleEdit(item) {
    setEditingProduct(item);
    setShowModal(true);
  }

  // =====================================================
  // TOTAL PURCHASE VALUE
  // =====================================================

  const totalPurchaseValue =
    useMemo(() => {
      return items.reduce(
        (
          sum,
          item
        ) =>
          sum +
          Number(
            item.total_amount ||
              0
          ),
        0
      );
    }, [items]);

  // =====================================================
  // FILTER
  // =====================================================

  const filteredItems =
    items.filter(
      (item) => {
        const key =
          search.toLowerCase();

        return (
          item.product_name
            ?.toLowerCase()
            .includes(key) ||

          item.category
            ?.toLowerCase()
            .includes(key) ||

          item.company
            ?.toLowerCase()
            .includes(key) ||

          item.specification
            ?.toLowerCase()
            .includes(key) ||

          item.supplier
            ?.toLowerCase()
            .includes(key)
        );
      }
    );

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="w-full overflow-hidden p-3">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="mb-2 rounded-xl bg-gradient-to-r from-indigo-700 via-blue-600 to-cyan-500 p-6 shadow-2xl">

        <div className="flex justify-between items-center">

          <div>

            <h1 className="text-2xl font-extrabold text-white tracking-wide">
              Inventory
            </h1>

            <p className="text-blue-100 mt text-sm">
              Purchase & Stock Management
            </p>

          </div>

          <div className="text-right">

            <p className="text-black font-bold text-sm mt-1 max-w-xl">
              Total Purchase Value
            </p>

            <h2 className="text-3xl font-bold text-red-700">
              ₹{" "}
              {Number(
                totalPurchaseValue
              ).toLocaleString(
                "en-IN",
                {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }
              )}
            </h2>

            <p className="text-black font-bold text-sm mt-1 max-w-xl">
              {numberToWordsIndian(
                totalPurchaseValue
              )}
            </p>

          </div>

        </div>

      </div>

      {/* =================================================
          SEARCH + ADD
      ================================================= */}

      <div className="sm-cyan rounded-xl shadow-xl border border-slate-200 p-4 mb-5">

        <div className="flex justify-between items-center gap-3">

          <input
            type="text"
            placeholder="Search Product, Category or Supplier..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            className="flex-1 rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-2 outline-none focus:border-indigo-500"
          />

          <button
            onClick={() => {
              setEditingProduct(
                null
              );

              setShowModal(
                true
              );
            }}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:scale-105 transition-all text-white px-6 py-3 rounded-xl shadow-lg"
          >
            + Add Purchase
          </button>

        </div>

      </div>

      {/* =================================================
          INVENTORY TABLE
      ================================================= */}

      <div className="w-full overflow-x-auto rounded-lg bg-white shadow-md border border-slate-200">

        {loading ? (

          <div className="p-10 text-center text-base">
            Loading Inventory...
          </div>

        ) : (

          <table className="w-full overflow-hidden rounded-2xl text-sm">

            {/* =================================================
                TABLE HEADER
            ================================================= */}

            <thead className="bg-gradient-to-r from-indigo-900 via-slate-800 to-slate-900 text-white shadow-md">

              <tr>

                <th className="border border-black px-5 py-4 text-center text-sm font-semibold whitespace-nowrap">
                  Date
                </th>

                <th className="border border-black px-5 py-4 text-center text-sm font-semibold whitespace-nowrap">
                  Supplier
                </th>

                <th className="border border-black px-5 py-4 text-center text-sm font-semibold whitespace-nowrap">
                  Product
                </th>

                <th className="border border-black px-5 py-4 text-center text-sm font-semibold whitespace-nowrap">
                  Company
                </th>

                <th className="border border-black px-5 py-4 text-center text-sm font-semibold whitespace-nowrap">
                  Specification
                </th>

                <th className="border border-black px-5 py-4 text-center text-sm font-semibold whitespace-nowrap">
                  Quantity
                </th>

                <th className="border border-black px-5 py-4 text-center text-sm font-semibold whitespace-nowrap">
                  Unit Cost
                </th>

                <th className="border border-black px-5 py-4 text-center text-sm font-semibold whitespace-nowrap">
                  Total Amount
                </th>

                <th className="border border-black px-5 py-4 text-center text-sm font-semibold whitespace-nowrap">
                  Actions
                </th>

              </tr>

            </thead>

            {/* =================================================
                TABLE BODY
            ================================================= */}

            <tbody>

              {filteredItems.length === 0 ? (

                <tr>

                  <td
                    colSpan="9"
                    className="text-center py-10 text-gray-500 text-sm"
                  >
                    No purchases found.
                  </td>

                </tr>

              ) : (

                filteredItems.map(
                  (item) => (

                    <tr
                      key={item.id}
                      className="border-b border-gray-200 even:bg-slate-50 hover:bg-green-50 transition-all duration-200 hover:shadow-sm"
                    >

                      {/* =================================================
                          DATE - NOW WORKS AS VIEW BUTTON
                      ================================================= */}

                      <td className="border border-black w-24 h-1 px-3 py-2 text-center align-middle whitespace-nowrap">

                        <button
                          type="button"
                          onClick={() =>
                            handleView(
                              item
                            )
                          }
                          title="View purchase"
                          className="font-semibold text-indigo-700 hover:text-indigo-900 hover:underline cursor-pointer transition-all"
                        >
                          {item.date
                            ? new Date(
                                item.date
                              )
                                .toLocaleDateString(
                                  "en-GB"
                                )
                                .replace(
                                  /\//g,
                                  "-"
                                )
                            : "-"}
                        </button>

                      </td>

                      {/* =================================================
                          SUPPLIER
                      ================================================= */}

                      <td className="border border-black w-24 h-1 px-3 py-2 text-center whitespace-nowrap">
                        {item.supplier ||
                          "-"}
                      </td>

                      {/* =================================================
                          PRODUCT - BOLD
                      ================================================= */}

                      <td className="border border-black w-24 h-1 px-3 py-2 text-center font-bold text-slate-900 whitespace-nowrap">
                        {item.product_name ||
                          "-"}
                      </td>

                      {/* =================================================
                          COMPANY
                      ================================================= */}

                      <td className="border border-black w-24 h-1 px-3 py-2 text-center whitespace-nowrap">
                        {item.company ||
                          "-"}
                      </td>

                      {/* =================================================
                          SPECIFICATION
                      ================================================= */}

                      <td className="border border-black w-24 h-1 px-3 py-2 text-center whitespace-nowrap">
                        {item.specification ||
                          "-"}
                      </td>

                      {/* =================================================
                          QUANTITY
                      ================================================= */}

                      <td className="border border-black w-24 h-1 px-3 py-2 text-center whitespace-nowrap">
                        {item.purchased_quantity ??
                          item.quantity ??
                          "-"}
                      </td>

                      {/* =================================================
                          UNIT COST
                      ================================================= */}

                      <td className="border border-black w-24 h-1 px-3 py-2 text-center font-semibold whitespace-nowrap">
                        ₹{" "}
                        {Number(
                          item.unit_cost ||
                            0
                        ).toFixed(2)}
                      </td>

                      {/* =================================================
                          TOTAL AMOUNT
                      ================================================= */}

                      <td className="border border-black w-24 h-1 px-3 py-2 text-center font-bold text-green-700 whitespace-nowrap">
                        ₹{" "}
                        {Number(
                          item.total_amount ||
                            0
                        ).toFixed(2)}
                      </td>

                      {/* =================================================
                          ACTIONS - SYMBOLS ONLY
                      ================================================= */}

                      <td className="border border-black w-20 h-1 px-2 py-1 text-center whitespace-nowrap">

                        <div className="flex justify-center items-center gap-3">

                          {/* EDIT */}

                          <button
                            type="button"
                            onClick={() =>
                              handleEdit(
                                item
                              )
                            }
                            title="Edit purchase"
                            aria-label="Edit purchase"
                            className="text-sky-600 hover:text-sky-800 transition-all duration-200 hover:scale-110"
                          >
                            <Pencil
                              size={20}
                              strokeWidth={2.5}
                            />
                          </button>

                          {/* DELETE */}

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                item.id
                              )
                            }
                            title="Delete purchase"
                            aria-label="Delete purchase"
                            className="text-rose-600 hover:text-rose-800 transition-all duration-200 hover:scale-110"
                          >
                            <Trash2
                              size={20}
                              strokeWidth={2.5}
                            />
                          </button>

                        </div>

                      </td>

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        )}

      </div>

      {/* =================================================
          MODAL
      ================================================= */}

      <InventoryModal
        open={showModal}
        product={
          editingProduct
        }
        onClose={() => {
          setShowModal(
            false
          );

          setEditingProduct(
            null
          );
        }}
        onSaved={() => {
          loadInventory();

          setShowModal(
            false
          );

          setEditingProduct(
            null
          );
        }}
      />

    </div>
  );
}