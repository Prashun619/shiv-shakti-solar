import { useEffect, useState } from "react";

import UsedInventoryModal from "../components/UsedInventoryModal";
import ViewUsedInventoryModal from "../components/ViewUsedInventoryModal";

import {
  getUsedInventory,
  deleteUsedInventory,
} from "../services/usedInventoryService";

import {
  downloadUsedInventoryPDF,
} from "../services/usedInventoryExport";

import { getCustomers } from "../services/customersService";
import { getProjects } from "../services/projectsService";

import {
  Eye,
  Pencil,
  Trash2,
  Download,
  FileText,
  FileSpreadsheet,
  X,
} from "lucide-react";

export default function UsedInventory() {

  // ============================================================
  // STATE
  // ============================================================

  const [items, setItems] = useState([]);

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);

  const [editingItem, setEditingItem] = useState(null);

  const [viewItem, setViewItem] = useState(null);

  // Which row's download menu is open
  const [downloadMenu, setDownloadMenu] = useState(null);


  // ============================================================
  // LOAD DATA
  // ============================================================

  useEffect(() => {
    loadUsedInventory();
  }, []);


  async function loadUsedInventory() {

    try {

      const [
        usedData,
        customers,
        projects,
      ] = await Promise.all([
        getUsedInventory(),
        getCustomers(),
        getProjects(),
      ]);


      // ============================================================
      // PROJECT TOTAL VALUE MAP
      // ============================================================

      const projectValueMap = {};

      (projects || []).forEach((project) => {

        if (!project?.project_no) {
          return;
        }

        projectValueMap[
          String(project.project_no)
            .trim()
            .toLowerCase()
        ] = Number(
          project.total_amount || 0
        );

      });


      // ============================================================
      // ADD PROJECT VALUE TO MATERIAL CONSUMPTION DATA
      // ============================================================

      const enrichedData =
        (usedData || []).map((item) => {

          const projectKey =
            String(item.project_no || "")
              .trim()
              .toLowerCase();

          return {

            ...item,

            plant_total_value:
              projectValueMap[projectKey] || 0,

          };

        });


      // ============================================================
      // SORT CUSTOMERS BY ACTUAL CREATION TIME
      // ============================================================

      const sortedCustomers =
        [...(customers || [])].sort(
          (a, b) => {

            const dateA = new Date(
              a.created_at ||
              a.createdAt ||
              a.date ||
              0
            ).getTime();

            const dateB = new Date(
              b.created_at ||
              b.createdAt ||
              b.date ||
              0
            ).getTime();

            return dateA - dateB;

          }
        );


      // ============================================================
      // CUSTOMER CREATION ORDER
      // ============================================================

      const customerOrder = {};

      sortedCustomers.forEach(
        (customer, index) => {

          customerOrder[customer.id] =
            index;

        }
      );


      // ============================================================
      // SORT MATERIAL CONSUMPTION
      // USING CUSTOMER CREATION ORDER
      // ============================================================

      const sortedData =
        [...enrichedData].sort(
          (a, b) => {

            const orderA =
              customerOrder[a.customer_id] ??
              Number.MAX_SAFE_INTEGER;

            const orderB =
              customerOrder[b.customer_id] ??
              Number.MAX_SAFE_INTEGER;

            return orderA - orderB;

          }
        );


      setItems(sortedData);

      return sortedData;

    } catch (error) {

      console.error(
        "LOAD USED INVENTORY ERROR:",
        error
      );

      return [];

    }

  }


  // ============================================================
  // DELETE
  // ============================================================

  async function handleDelete(item) {

    if (!item?.allEntries?.length) {

      alert(
        "Material consumption record not found."
      );

      return;

    }


    const entries = item.allEntries;


    const message =
      entries.length > 1
        ? `This material consumption contains ${entries.length} records.\n\nDelete all records for this customer / plant?`
        : "Delete this material consumption record?";


    if (!window.confirm(message)) {

      return;

    }


    try {

      // --------------------------------------------------------
      // DELETE EVERY DATABASE RECORD IN THIS GROUP
      // --------------------------------------------------------

      for (const entry of entries) {

        await deleteUsedInventory(entry.id);

      }


      // --------------------------------------------------------
      // RELOAD TABLE
      // --------------------------------------------------------

      await loadUsedInventory();


      // --------------------------------------------------------
      // CLOSE MODALS
      // --------------------------------------------------------

      setViewItem(null);

      setEditingItem(null);

      setShowModal(false);

      setDownloadMenu(null);


    } catch (error) {

      console.error(
        "DELETE MATERIAL CONSUMPTION ERROR:",
        error
      );


      alert(
        error?.message ||
        "Unable to delete material consumption."
      );

    }

  }


  // ============================================================
  // GROUP MATERIAL CONSUMPTION
  // ============================================================

  const groupedItems = Object.values(

    items.reduce(
      (acc, item) => {

        const key =
          `${item.customer_id}_${item.plant_size}_${item.location}`;


        // ------------------------------------------------------
        // FIRST RECORD OF GROUP
        // ------------------------------------------------------

        if (!acc[key]) {

          acc[key] = {

            ...item,

            // Keep every actual database record
            allEntries: [item],

            // Explicit group ID
            group_id: key,

            // Copy products
            products: [
              ...(item.products || [])
            ],

            // Total plant cost
            total_plant_cost:
              Number(
                item.total_plant_cost || 0
              ),

            // Plant total value
            plant_total_value:
              Number(
                item.plant_total_value || 0
              ),

          };

        }

        // ------------------------------------------------------
        // ADDITIONAL RECORD IN SAME GROUP
        // ------------------------------------------------------

        else {

          acc[key].allEntries.push(item);


          acc[key].products.push(
            ...(item.products || [])
          );


          acc[key].total_plant_cost +=
            Number(
              item.total_plant_cost || 0
            );

        }


        return acc;

      },
      {}
    )

  );


  // ============================================================
  // SEARCH
  // ============================================================

  const filteredItems =
    groupedItems.filter((item) => {

      const key =
        search
          .toLowerCase()
          .trim();


      return (

        item.customers
          ?.customer_name
          ?.toLowerCase()
          .includes(key)

        ||

        item.project_no
          ?.toLowerCase()
          .includes(key)

      );

    });


  // ============================================================
  // FORMAT CURRENCY
  // ============================================================

  function formatCurrency(value) {

    return Number(value || 0)
      .toLocaleString("en-IN", {
        maximumFractionDigits: 2,
      });

  }


  // ============================================================
  // GET PLANT TOTAL VALUE
  // ============================================================

  function getPlantTotalValue(item) {

    return Number(
      item?.plant_total_value || 0
    );

  }


  // ============================================================
  // GET PLANT COST
  // ============================================================

  function getPlantCost(item) {

    return Number(
      item?.total_plant_cost || 0
    );

  }


  // ============================================================
  // GET PROFIT
  // ============================================================

  function getProfit(item) {

    const plantCost =
      getPlantCost(item);

    const plantValue =
      getPlantTotalValue(item);


    // Same rule as Profit Report:
    // If plant cost is zero, profit remains zero.

    if (plantCost <= 0) {

      return 0;

    }


    return plantValue - plantCost;

  }


  // ============================================================
  // CSV HELPER
  // ============================================================

  function escapeCSV(value) {

    const text =
      String(value ?? "");

    return `"${text.replace(
      /"/g,
      '""'
    )}"`;

  }


  // ============================================================
  // DOWNLOAD CSV
  // ============================================================

 function downloadUsedInventoryCSV(item) {

  // ============================================================
  // BASIC SUMMARY
  // ============================================================

  const plantValue =
    getPlantTotalValue(item);

  const plantCost =
    getPlantCost(item);

  const profit =
    getProfit(item);


  // ============================================================
  // HELPERS
  // ============================================================

  function cleanArray(value) {

    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((value) =>
        String(value ?? "").trim()
      )
      .filter(Boolean);

  }


  function isPanel(product) {

    return (
      String(
        product?.product_name || ""
      )
        .trim()
        .toLowerCase() === "panel"
      ||
      String(
        product?.category || ""
      )
        .trim()
        .toLowerCase() === "panel"
    );

  }


  function isInverter(product) {

    return (
      String(
        product?.product_name || ""
      )
        .trim()
        .toLowerCase() === "inverter"
      ||
      String(
        product?.category || ""
      )
        .trim()
        .toLowerCase() === "inverter"
    );

  }


  // ============================================================
  // GET ALL PRODUCTS
  // ============================================================

  const products =
    Array.isArray(item?.products)
      ? item.products
      : [];


  // ============================================================
  // PANEL DETAILS
  // ============================================================

  const panelData =
    products
      .filter(isPanel)
      .flatMap((product) => {

        const serials =
          cleanArray(
            product.serial_numbers
          );

        const quantity =
          Number(
            product.quantity || 0
          );

        const count =
          Math.max(
            quantity,
            serials.length
          );

        return Array.from(
          { length: count },
          (_, index) => ({

            company:
              product.company || "",

            serial:
              serials[index] || "",

          })
        );

      });


  // ============================================================
  // INVERTER DETAILS
  // ============================================================

  const inverterData =
    products
      .filter(isInverter)
      .flatMap((product) => {

        const serials =
          cleanArray(
            product.serial_numbers
          );

        let models =
          cleanArray(
            product.inverter_models
          );


        // --------------------------------------------------------
        // OLD RECORD FALLBACK
        // --------------------------------------------------------

        if (!models.length) {

          const specification =
            String(
              product.specification || ""
            ).trim();

          if (specification) {

            models = [
              specification
            ];

          }

        }


        const quantity =
          Number(
            product.quantity || 0
          );


        const count =
          Math.max(
            quantity,
            serials.length,
            models.length
          );


        return Array.from(
          { length: count },
          (_, index) => ({

            company:
              product.company || "",

            model:
              models[index] || "",

            serial:
              serials[index] || "",

          })
        );

      });


  // ============================================================
  // ADDITIONAL CHARGES
  // ============================================================

  const additionalCharges = [

    {
      name: "Bhada Charges",
      amount:
        Number(
          item?.bhada_charges || 0
        ),
    },

    {
      name: "Cement Charges",
      amount:
        Number(
          item?.cement_charges || 0
        ),
    },

    {
      name: "Gitti Charges",
      amount:
        Number(
          item?.gitti_charges || 0
        ),
    },

    {
      name: "Installation Charges",
      amount:
        Number(
          item?.installation_charges || 0
        ),
    },

    {
      name: "JE Charges",
      amount:
        Number(
          item?.je_charges || 0
        ),
    },

    {
      name: "Load Extension Charges",
      amount:
        Number(
          item?.load_extension_charges || 0
        ),
    },

    {
      name: "Meter Connection Charges",
      amount:
        Number(
          item?.meter_connection_charges || 0
        ),
    },

    {
      name: "Name Change Charges",
      amount:
        Number(
          item?.name_change_charges || 0
        ),
    },

    {
      name: "Net Metering Charges",
      amount:
        Number(
          item?.net_metering_charges || 0
        ),
    },

    {
      name: "Sand Charges",
      amount:
        Number(
          item?.sand_charges || 0
        ),
    },

    {
      name: "Vendor Charges",
      amount:
        Number(
          item?.vendor_charges || 0
        ),
    },

  ].filter(
    (charge) =>
      charge.amount !== 0
  );


  // ============================================================
  // CSV ROWS
  // ============================================================

  const rows = [];


  // ============================================================
  // HEADER
  // ============================================================

  rows.push([

    "Customer",
    "Project No",
    "Plant Size",
    "Total Plant Value",
    "Plant Cost",
    "Profit",

    "Panel Company",
    "Panel Serial Number",

    "Inverter Company",
    "Inverter Model",
    "Inverter Serial Number",

    "Product",
    "Category",
    "Quantity",
    "Unit Price",
    "Total",

    "Additional Charge",
    "Charge Amount",

  ]);


  // ============================================================
  // PRODUCT ROWS
  // ============================================================

  const maxRows =
    Math.max(
      products.length,
      panelData.length,
      inverterData.length,
      1
    );


  for (
    let index = 0;
    index < maxRows;
    index++
  ) {

    const product =
      products[index];

    const panel =
      panelData[index];

    const inverter =
      inverterData[index];


    const quantity =
      Number(
        product?.quantity || 0
      );


    const unitPrice =
      Number(
        product?.unit_price ??
        product?.unit_cost ??
        product?.price ??
        0
      );


    const total =
      Number(
        product?.total || 0
      ) ||
      (
        quantity *
        unitPrice
      );


    rows.push([

      item.customers
        ?.customer_name || "",

      item.project_no || "",

      item.plant_size
        ? `${item.plant_size} KW`
        : "",

      plantValue,

      plantCost,

      profit,


      // PANEL

      panel?.company || "",

      panel?.serial || "",


      // INVERTER

      inverter?.company || "",

      inverter?.model || "",

      inverter?.serial || "",


      // PRODUCT

      product
        ? (
            product.product_name ||
            product.name ||
            ""
          )
        : "",

      product?.category || "",

      product
        ? quantity
        : "",

      product
        ? unitPrice
        : "",

      product
        ? total
        : "",


      // ADDITIONAL CHARGES

      "",

      "",

    ]);

  }


  // ============================================================
  // ADDITIONAL CHARGE ROWS
  // ============================================================

  additionalCharges.forEach(
    (charge) => {

      rows.push([

        item.customers
          ?.customer_name || "",

        item.project_no || "",

        item.plant_size
          ? `${item.plant_size} KW`
          : "",

        plantValue,

        plantCost,

        profit,


        "",
        "",

        "",
        "",
        "",


        "",
        "",

        "",
        "",

        "",


        charge.name,

        charge.amount,

      ]);

    }
  );


  // ============================================================
  // CSV CONTENT
  // ============================================================

  const csvContent =
    rows
      .map((row) =>
        row
          .map(escapeCSV)
          .join(",")
      )
      .join("\r\n");


  // ============================================================
  // UTF-8 BOM
  // ============================================================

  const blob =
    new Blob(
      [
        "\uFEFF",
        csvContent,
      ],
      {
        type:
          "text/csv;charset=utf-8;",
      }
    );


  // ============================================================
  // DOWNLOAD
  // ============================================================

  const url =
    URL.createObjectURL(blob);


  const link =
    document.createElement("a");


  link.href = url;


  const customerName =
    String(
      item.customers
        ?.customer_name ||
      "Material_Consumption"
    )
      .replace(
        /[^a-z0-9]+/gi,
        "_"
      );


  link.download =
    `${customerName}_Material_Consumption.csv`;


  document.body.appendChild(link);

  link.click();

  document.body.removeChild(link);

  URL.revokeObjectURL(url);


  // ============================================================
  // CLOSE DOWNLOAD MENU
  // ============================================================

  setDownloadMenu(null);

}


  // ============================================================
  // DOWNLOAD PDF
  // ============================================================

  function handlePDFDownload(item) {

    try {

      downloadUsedInventoryPDF(item);

    } catch (error) {

      console.error(
        "PDF DOWNLOAD ERROR:",
        error
      );

      alert(
        error?.message ||
        "Unable to download PDF."
      );

    } finally {

      setDownloadMenu(null);

    }

  }


  // ============================================================
  // OPEN ADD
  // ============================================================

  function handleAdd() {

    setEditingItem(null);

    setShowModal(true);

  }


  // ============================================================
  // OPEN EDIT
  // ============================================================

  function handleEdit(item) {

    setEditingItem(item);

    setShowModal(true);

    setDownloadMenu(null);

  }


  // ============================================================
  // CLOSE EDIT MODAL
  // ============================================================

  function handleCloseModal() {

    setShowModal(false);

    setEditingItem(null);

  }


  // ============================================================
  // RENDER
  // ============================================================

  return (

    <div
      className="p-4 bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 min-h-screen"
      onClick={() => {

        if (downloadMenu !== null) {

          setDownloadMenu(null);

        }

      }}
    >

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="mb-4 rounded-2xl bg-gradient-to-r from-indigo-700 via-blue-600 to-cyan-500 p-4 shadow-xl">

        <div className="flex justify-between items-center">

          <div>

            <h1 className="text-3xl font-bold text-white tracking-wide">

              Material Consumption

            </h1>


            <p className="text-blue-100 mt-2 text-lg">

              Material Consumption Management

            </p>

          </div>


          <button

            onClick={(e) => {

              e.stopPropagation();

              handleAdd();

            }}

            className="px-4 py-2 rounded-lg bg-white text-indigo-700 font-semibold shadow hover:shadow-lg transition-all"

          >

            + Add Material Consumption

          </button>

        </div>

      </div>


      {/* ======================================================
          SEARCH
      ====================================================== */}

      <div className="bg-white rounded-xl shadow border border-slate-300 p-1 mb-2">

        <input

          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition-all duration-300 focus:border-indigo-500 focus:bg-white"

          placeholder="Search Customer or Project No..."

          value={search}

          onChange={(e) =>
            setSearch(e.target.value)
          }

        />

      </div>


      {/* ======================================================
          TABLE
      ====================================================== */}

      <div className="overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200">

        <div className="overflow-x-auto">

          <table className="w-full border-collapse border-2 border-black">

            <thead className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-900 text-white">

              <tr>

               <th className="border border-black px-3 py-2 text-center text-sm font-bold">
  Project No
</th>

                <th className="border border-black px-3 py-2 text-center text-sm font-bold">

                  Customer

                </th>


                <th className="border border-black px-3 py-2 text-center text-sm font-bold">

                  Plant Size

                </th>


                <th className="border border-black px-3 py-2 text-center text-sm font-bold">

                  Total Plant Value

                </th>


                <th className="border border-black px-3 py-2 text-center text-sm font-bold">

                  Plant Cost

                </th>


                <th className="border border-black px-3 py-2 text-center text-sm font-bold">

                  Profit

                </th>


                <th className="border border-black px-3 py-2 text-center text-sm font-bold">

                  Action

                </th>

              </tr>

            </thead>


            <tbody>

              {filteredItems.map((item) => {

                const plantValue =
                  getPlantTotalValue(item);

                const plantCost =
                  getPlantCost(item);

                const profit =
                  getProfit(item);


                return (

                  <tr

                    key={
                      item.group_id ||
                      item.id
                    }

                    className="hover:bg-slate-100 transition"

                  >

                    <td className="border border-black px-3 py-2 text-center font-semibold text-indigo-700">
  {item.project_no || "-"}
</td>

                    {/* CUSTOMER */}

                    <td className="border border-black px-3 py-2 text-center font-medium text-slate-800">

                      {
                        item.customers
                          ?.customer_name ||
                        "-"
                      }

                    </td>


                    {/* PLANT SIZE */}

                    <td className="border border-black px-3 py-2 text-center">

                      {item.plant_size
                        ? `${item.plant_size} KW`
                        : "-"}

                    </td>


                    {/* TOTAL PLANT VALUE */}

                    <td className="border border-black px-3 py-2 text-center font-semibold text-blue-700">

                      ₹{" "}
                      {formatCurrency(
                        plantValue
                      )}

                    </td>


                    {/* PLANT COST */}

                    <td className="border border-black px-3 py-2 text-center font-semibold text-orange-700">

                      ₹{" "}
                      {formatCurrency(
                        plantCost
                      )}

                    </td>


                    {/* PROFIT */}

                    <td
                      className={`border border-black px-3 py-2 text-center font-bold ${
                        profit >= 0
                          ? "text-green-700"
                          : "text-red-700"
                      }`}
                    >

                      ₹{" "}
                      {formatCurrency(
                        profit
                      )}

                    </td>


                    {/* ACTION */}

                    <td className="border border-black px-3 py-2">

                      <div
                        className="flex items-center justify-center gap-2"
                        onClick={(e) =>
                          e.stopPropagation()
                        }
                      >

                        {/* VIEW */}

                        <button

                          type="button"

                          title="View"

                          onClick={() =>
                            setViewItem(item)
                          }

                          className="w-9 h-9 flex items-center justify-center rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-sm"

                        >

                          <Eye
                            size={17}
                          />

                        </button>


                        {/* EDIT */}

                        <button

                          type="button"

                          title="Edit"

                          onClick={() =>
                            handleEdit(item)
                          }

                          className="w-9 h-9 flex items-center justify-center rounded-lg bg-sky-600 hover:bg-sky-700 text-white transition shadow-sm"

                        >

                          <Pencil
                            size={17}
                          />

                        </button>


                        {/* DELETE */}

                        <button

                          type="button"

                          title="Delete"

                          onClick={() =>
                            handleDelete(item)
                          }

                          className="w-9 h-9 flex items-center justify-center rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition shadow-sm"

                        >

                          <Trash2
                            size={17}
                          />

                        </button>


                        {/* DOWNLOAD */}

                        <div className="relative">

                          <button

                            type="button"

                            title="Download"

                            onClick={(e) => {

                              e.stopPropagation();

                              setDownloadMenu(
                                downloadMenu ===
                                  item.group_id
                                  ? null
                                  : item.group_id
                              );

                            }}

                            className="w-9 h-9 flex items-center justify-center rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm"

                          >

                            <Download
                              size={17}
                            />

                          </button>


                          {/* DOWNLOAD MENU */}

                          {downloadMenu ===
                            item.group_id && (

                            <div
                              className="absolute right-0 top-11 z-50 w-40 rounded-xl bg-white border border-slate-200 shadow-xl p-1"
                              onClick={(e) =>
                                e.stopPropagation()
                              }
                            >

                              <button

                                type="button"

                                onClick={() =>
                                  handlePDFDownload(
                                    item
                                  )
                                }

                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-red-50 hover:text-red-700 transition"

                              >

                                <FileText
                                  size={17}
                                />

                                Download PDF

                              </button>


                              <button

                                type="button"

                                onClick={() =>
                                  downloadUsedInventoryCSV(
                                    item
                                  )
                                }

                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-green-50 hover:text-green-700 transition"

                              >

                                <FileSpreadsheet
                                  size={17}
                                />

                                Download CSV

                              </button>

                            </div>

                          )}

                        </div>

                      </div>

                    </td>

                  </tr>

                );

              })}


              {/* EMPTY STATE */}

              {filteredItems.length === 0 && (

                <tr>

                  <td

                  colSpan="7"

                    className="border border-black px-4 py-8 text-center text-gray-500"

                  >

                    No material consumption records found.

                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </div>


      {/* ======================================================
          ADD / EDIT MODAL
      ====================================================== */}

      <UsedInventoryModal

        open={showModal}

        item={editingItem}

        onClose={handleCloseModal}

        onSaved={async () => {

          await loadUsedInventory();

          handleCloseModal();

        }}

      />


      {/* ======================================================
          VIEW MODAL
      ====================================================== */}

      <ViewUsedInventoryModal

        open={!!viewItem}

        item={viewItem}

        onClose={() => {

          setViewItem(null);

        }}

      />

    </div>

  );

}