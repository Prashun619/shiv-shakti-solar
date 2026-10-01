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

  function formatInventoryUnit(unit) {
  const normalized = String(unit || "")
    .trim()
    .toLowerCase();

  if (
    normalized === "ft" ||
    normalized === "feet" ||
    normalized === "foot"
  ) {
    return "Ft";
  }

  if (
    normalized === "mtr" ||
    normalized === "meter" ||
    normalized === "metre" ||
    normalized === "meters" ||
    normalized === "metres"
  ) {
    return "Mtr";
  }

  if (
    normalized === "nos" ||
    normalized === "no" ||
    normalized === "pcs" ||
    normalized === "pc" ||
    normalized === "piece" ||
    normalized === "pieces"
  ) {
    return "Nos";
  }

  if (normalized === "kg" || normalized === "kgs") {
    return "Kg";
  }

  if (normalized === "pair" || normalized === "pairs") {
    return "Pair";
  }

  if (normalized === "set" || normalized === "sets") {
    return "Set";
  }

  if (normalized === "pack" || normalized === "packs") {
    return "Pack";
  }

  if (normalized === "roll" || normalized === "rolls") {
    return "Roll";
  }

  if (normalized === "box" || normalized === "boxes") {
    return "Box";
  }

  return unit || "";
}

  // ======================================
  // FILTER + SEARCH
  // ======================================

  const filteredItems = useMemo(() => {

  const key =
    search.toLowerCase().trim();


  return [...items]

    .map((item) => {

      const isCChannel =
  [
    "c channel 140x50x2 mm 9ft",
    "c channel 140x50x2 mm 21ft",
  ].includes(
    String(item.product_name || "")
      .trim()
      .toLowerCase()
  );    


   if (isCChannel) {
  const quantity =
    Number(item.total_quantity || 0);

  const lengthFt =
    Number(item.length_ft || 0);

  const usedQuantity =
    Number(item.used_quantity || 0);

  const totalFeet =
    quantity * lengthFt;

  const usedFeet =
    usedQuantity;

  const remainingFeet =
    Math.max(
      0,
      totalFeet - usedFeet
    );

  return {
    ...item,
    total_quantity: totalFeet,
    used_quantity: usedFeet,
    remaining: remainingFeet,
    stock_status:
      remainingFeet <= 0
        ? "Out of Stock"
        : "In Stock",
    unit: "Ft",
  };
}


      return item;

    })

  .map((item) => {
    
    const isCChannel =
  [
    "c channel 140x50x2 mm 9ft",
    "c channel 140x50x2 mm 21ft",
  ].includes(
    String(item.product_name || "")
      .trim()
      .toLowerCase()
  );

    if (isCChannel) {
      return {
        ...item,
        unit: "ft",
      };
    }

    return item;
  })

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

    // ======================================
  // DISPLAY PRODUCT NAME
  // ======================================

  function getDisplayProductName(item) {

    const category =
      String(item.category || "")
        .trim()
        .toLowerCase();

    const company =
      String(item.company || "")
        .trim();

    const specification =
      String(item.specification || "")
        .trim();

    // PANEL
    if (category === "panel") {

      return [
        company,
        specification
      ]
        .filter(Boolean)
        .join(" ");

    }

    // INVERTER
    if (category === "inverter") {

      return [
        company,
        specification
      ]
        .filter(Boolean)
        .join(" ");

    }

    // ALL OTHER PRODUCTS
    return item.product_name || "";

  }

  return (

    <div className="
      min-h-screen
      bg-gradient-to-br
      from-slate-100
      via-blue-50
      to-indigo-100
      p-3
      sm:p-4
      lg:p-6
      overflow-x-hidden
    ">


      {/* ======================================
          HEADER
      ====================================== */}

      <div
        className="
          mb-4
          sm:mb-6
          rounded-3xl
          bg-gradient-to-r
          from-indigo-700
          via-blue-600
          to-cyan-500
          p-4
          sm:p-6
          shadow-2xl
          border
          border-white/20
        "
      >

        <div className="
          flex
          flex-col
          lg:flex-row
          lg:items-center
          lg:justify-between
          gap-4
          sm:gap-5
        ">


          <div className="
            flex
            items-center
            gap-3
            sm:gap-5
            min-w-0
          ">

            <div className="
              h-12
              w-12
              sm:h-16
              sm:w-16
              shrink-0
              rounded-2xl
              bg-white/15
              backdrop-blur-md
              flex
              items-center
              justify-center
              text-2xl
              sm:text-3xl
              shadow-lg
            ">
              📦
            </div>


            <div className="min-w-0">

              <h1 className="
                text-xl
                sm:text-3xl
                font-bold
                text-white
                truncate
              ">
                Master Inventory
              </h1>


              <p className="
                mt-1
                text-xs
                sm:text-sm
                text-blue-100
              ">
                Overall Product Stock Summary
              </p>

            </div>

          </div>


          <div className="
            flex
            flex-col
            sm:flex-row
            gap-3
            sm:gap-4
            w-full
            lg:w-auto
          ">


            {/* LOW STOCK */}

            <div
              className="
                bg-white/15
                backdrop-blur-md
                rounded-2xl
                px-4
                sm:px-6
                py-3
                sm:py-4
                shadow-lg
                cursor-pointer
                flex-1
                lg:flex-none
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
                text-xs
                sm:text-sm
                text-orange-100
              ">
                Low Stock
              </p>

              <h2 className="
                mt-1
                text-2xl
                sm:text-3xl
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
              px-4
              sm:px-6
              py-3
              sm:py-4
              shadow-lg
              flex-1
              lg:flex-none
              min-w-0
            ">

              <p className="
                text-xs
                sm:text-sm
                text-blue-100
              ">
                Total Stock Value
              </p>


              <h2 className="
                mt-1
                text-xl
                sm:text-3xl
                font-bold
                text-white
                whitespace-nowrap
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
        p-4
        sm:p-5
        mb-4
        sm:mb-6
      ">

        <div className="
          flex
          flex-col
          lg:flex-row
          gap-3
          sm:gap-4
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
              min-w-0
              rounded-xl
              border-2
              border-slate-200
              bg-slate-50
              px-4
              sm:px-5
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
              w-full
              lg:w-auto
              rounded-xl
              border-2
              border-slate-200
              bg-slate-50
              px-4
              sm:px-5
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
        rounded-3xl
        bg-white
        shadow-2xl
        border
        border-slate-200
        overflow-hidden
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

          /*
           * Mobile:
           * The table keeps its natural readable width and
           * scrolls horizontally inside this container.
           */
          <div className="
            w-full
            overflow-x-auto
            overflow-y-hidden
            overscroll-x-contain
          ">

            <table className="
              w-full
              min-w-[760px]
              border-collapse
              border-2
              border-black
              text-base
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
                    text-lg
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
                    text-lg
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
                    text-lg
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
                    text-lg
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
                    text-lg
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
                    text-lg
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
                          {getDisplayProductName(item)}
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

  {item.total_quantity}{" "}
  {formatInventoryUnit(item.unit)}

</td>


{/* USED */}

<td className="
  border-2
  border-black
  px-2
  py-2
  text-center
">

  {item.used_quantity}{" "}
  {formatInventoryUnit(item.unit)}

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

    {item.remaining}{" "}
    {formatInventoryUnit(item.unit)}

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
                            whitespace-nowrap
                            ${statusStyle.wrapper}
                          `}>

                            <span className={`
                              h-2
                              w-2
                              rounded-full
                              shrink-0
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

          </div>

        )}

      </div>

    </div>

  );

}