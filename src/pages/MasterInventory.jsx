import { useEffect, useMemo, useState } from "react";

import {
  getMasterInventory,
} from "../services/masterInventoryService";


export default function MasterInventory() {

  const [items, setItems] = useState([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);

  const [stockFilter, setStockFilter] =
    useState("All");


  useEffect(() => {

    loadMasterInventory();

  }, []);


  async function loadMasterInventory() {

    try {

      setLoading(true);

      const data =
        await getMasterInventory();

      setItems(data || []);

    }
    catch (error) {

      console.log(error);

    }
    finally {

      setLoading(false);

    }

  }


  // ======================================
  // TOTAL STOCK VALUE
  // ======================================

  const totalStockValue = useMemo(() => {

    return items.reduce(
      (sum, item) =>
        sum +
        Number(item.stock_value || 0),
      0
    );

  }, [items]);


  // ======================================
  // LOW STOCK COUNT
  // ======================================

  const lowStockCount = useMemo(() => {

    return items.filter(
      item =>
        item.stock_status === "Low Stock" ||
        item.stock_status === "Out of Stock"
    ).length;

  }, [items]);


  // ======================================
  // FILTER + SEARCH
  // ======================================

  const filteredItems = useMemo(() => {

    const key =
      search.toLowerCase().trim();


    return [...items]

      .filter((item) => {

        const matchesSearch =

          item.display_name
            ?.toLowerCase()
            .includes(key)

          ||

          item.category
            ?.toLowerCase()
            .includes(key);


        if (!matchesSearch) {
          return false;
        }


        if (
          stockFilter === "Low Stock"
        ) {

          return (
            item.stock_status ===
            "Low Stock"
          );

        }


        if (
          stockFilter === "Out of Stock"
        ) {

          return (
            item.stock_status ===
            "Out of Stock"
          );

        }


        return true;

      })

      // Always alphabetical
      .sort((a, b) =>
        String(a.product_name || "")
          .localeCompare(
            String(b.product_name || ""),
            undefined,
            {
              sensitivity: "base"
            }
          )
      );

  }, [
    items,
    search,
    stockFilter
  ]);


  // ======================================
  // STATUS UI
  // ======================================

  function getStatusStyle(status) {

    if (status === "Out of Stock") {

      return {
        wrapper:
          "bg-red-100 text-red-700 border-red-300",
        dot:
          "bg-red-600"
      };

    }


    if (status === "Low Stock") {

      return {
        wrapper:
          "bg-orange-100 text-orange-700 border-orange-300",
        dot:
          "bg-orange-500"
      };

    }


    return {

      wrapper:
        "bg-green-100 text-green-700 border-green-300",

      dot:
        "bg-green-600"

    };

  }


  return (

    <div className="p-6 bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 min-h-screen">


      {/* ======================================
          HEADER
      ====================================== */}

      <div
        className="
          mb-6
          rounded-3xl
          bg-gradient-to-r
          from-indigo-700
          via-blue-600
          to-cyan-500
          p-6
          shadow-2xl
          border
          border-white/20
        "
      >

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">


          <div className="flex items-center gap-5">

            <div className="
              h-16
              w-16
              rounded-2xl
              bg-white/15
              backdrop-blur-md
              flex
              items-center
              justify-center
              text-3xl
              shadow-lg
            ">
              📦
            </div>


            <div>

              <h1 className="
                text-3xl
                font-bold
                text-white
              ">
                Master Inventory
              </h1>


              <p className="
                mt-1
                text-blue-100
              ">
                Overall Product Stock Summary
              </p>

            </div>

          </div>


          <div className="flex gap-4">


            {/* LOW STOCK */}

            <div className="
              bg-white/15
              backdrop-blur-md
              rounded-2xl
              px-6
              py-4
              shadow-lg
              cursor-pointer
            "
              onClick={() =>
                setStockFilter(
                  stockFilter === "Low Stock"
                    ? "All"
                    : "Low Stock"
                )
              }
            >

              <p className="
                text-sm
                text-orange-100
              ">
                Low Stock
              </p>

              <h2 className="
                mt-1
                text-3xl
                font-bold
                text-white
              ">
                {lowStockCount}
              </h2>

            </div>


            {/* TOTAL VALUE */}

            <div className="
              bg-white/15
              backdrop-blur-md
              rounded-2xl
              px-6
              py-4
              shadow-lg
            ">

              <p className="
                text-sm
                text-blue-100
              ">
                Total Stock Value
              </p>


              <h2 className="
                mt-1
                text-3xl
                font-bold
                text-white
              ">

                ₹{" "}
                {Number(
                  totalStockValue
                ).toLocaleString(
                  undefined,
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  }
                )}

              </h2>

            </div>

          </div>

        </div>

      </div>


      {/* ======================================
          SEARCH + FILTER
      ====================================== */}

      <div className="
        bg-white
        rounded-2xl
        shadow-xl
        border
        border-slate-200
        p-5
        mb-6
      ">

        <div className="
          flex
          flex-col
          lg:flex-row
          gap-4
        ">


          <input
            type="text"
            placeholder="🔍 Search Product or Category..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            className="
              flex-1
              rounded-xl
              border-2
              border-slate-200
              bg-slate-50
              px-5
              py-3
              text-sm
              outline-none
              transition-all
              duration-300
              focus:border-indigo-500
              focus:bg-white
            "
          />


          <select
            value={stockFilter}
            onChange={(e) =>
              setStockFilter(e.target.value)
            }
            className="
              rounded-xl
              border-2
              border-slate-200
              bg-slate-50
              px-5
              py-3
              text-sm
              font-medium
              outline-none
              focus:border-indigo-500
            "
          >

            <option value="All">
              All Stock
            </option>

            <option value="Low Stock">
              Low Stock
            </option>

            <option value="Out of Stock">
              Out of Stock
            </option>

          </select>


        </div>

      </div>


      {/* ======================================
          TABLE
      ====================================== */}

      <div className="
        overflow-hidden
        rounded-3xl
        bg-white
        shadow-2xl
        border
        border-slate-200
      ">


        {loading ? (

          <div className="
            flex
            items-center
            justify-center
            h-48
          ">

            <div className="text-center">

              <div className="
                animate-spin
                rounded-full
                h-12
                w-12
                border-b-4
                border-indigo-600
                mx-auto
                mb-4
              " />

              <p className="
                text-slate-600
                font-medium
              ">
                Loading Master Inventory...
              </p>

            </div>

          </div>

        ) : (

          <table className="
            w-full
            border-collapse
            border-2
            border-black
            text-xs
          ">


            <thead className="
              bg-teal-700
              text-white
            ">

              <tr>

                <th className="
                  border-2
                  border-black
                  px-2
                  py-2
                  text-center
                  text-sm
                  font-semibold
                ">
                  Product
                </th>


                <th className="
                  border-2
                  border-black
                  px-2
                  py-2
                  text-center
                  text-sm
                  font-semibold
                ">
                  Category
                </th>


                <th className="
                  border-2
                  border-black
                  px-2
                  py-2
                  text-center
                  text-sm
                  font-semibold
                ">
                  Total Quantity
                </th>


                <th className="
                  border-2
                  border-black
                  px-2
                  py-2
                  text-center
                  text-sm
                  font-semibold
                ">
                  Used Quantity
                </th>


                <th className="
                  border-2
                  border-black
                  px-2
                  py-2
                  text-center
                  text-sm
                  font-semibold
                ">
                  Remaining
                </th>

                <th className="
                  border-2
                  border-black
                  px-2
                  py-2
                  text-center
                  text-sm
                  font-semibold
                ">
                  Status
                </th>

              </tr>

            </thead>


            <tbody>


              {filteredItems.length === 0 ? (

                <tr>

                  <td
                    colSpan="6"
                    className="
                      border
                      border-black
                      py-4
                      text-center
                      text-gray-500
                    "
                  >
                    No stock found.
                  </td>

                </tr>

              ) : (

                filteredItems.map((item) => {

                  const statusStyle =
                    getStatusStyle(
                      item.stock_status
                    );


                  return (

                    <tr
                      key={
                        item.product_name +
                        item.category +
                        item.company +
                        item.specification
                      }
                      className="
                        border
                        border-slate-300
                        hover:bg-indigo-50
                        transition-all
                        duration-300
                      "
                    >


                      {/* PRODUCT */}

                      <td className="
                        border-2
                        border-black
                        px-2
                        py-2
                        text-center
                        font-medium
                      ">
                        {item.display_name}
                      </td>


                      {/* CATEGORY */}

                      <td className="
                        border-2
                        border-black
                        px-2
                        py-2
                        text-center
                      ">
                        {item.category}
                      </td>


                      {/* TOTAL */}

                      <td className="
                        border-2
                        border-black
                        px-2
                        py-2
                        text-center
                      ">

                        {item.total_quantity}

                        {" "}

                        {item.unit}

                      </td>


                      {/* USED */}

                      <td className="
                        border-2
                        border-black
                        px-2
                        py-2
                        text-center
                      ">

                        {item.used_quantity}

                        {" "}

                        {item.unit}

                      </td>


                      {/* REMAINING */}

                      <td className="
                        border-2
                        border-black
                        px-2
                        py-2
                        text-center
                      ">

                        <span className="
                          font-bold
                          text-green-700
                        ">

                          {item.remaining}

                          {" "}

                          {item.unit}

                        </span>

                      </td>


                     


                      {/* STATUS */}

                      <td className="
                        border-2
                        border-black
                        px-2
                        py-2
                        text-center
                      ">

                        <span className={`
                          inline-flex
                          items-center
                          gap-2
                          rounded-full
                          border
                          px-3
                          py-1
                          font-bold
                          ${statusStyle.wrapper}
                        `}>

                          <span className={`
                            h-2
                            w-2
                            rounded-full
                            ${statusStyle.dot}
                          `} />

                          {item.stock_status}

                        </span>

                      </td>


                    </tr>

                  );

                })

              )}

            </tbody>

          </table>

        )}

      </div>

    </div>

  );

}