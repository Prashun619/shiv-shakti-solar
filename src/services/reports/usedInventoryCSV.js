export function exportUsedInventoryCSV(data) {

  const escapeCSV = (value) => {

    const text =
      String(value ?? "");

    if (
      text.includes(",") ||
      text.includes('"') ||
      text.includes("\n")
    ) {
      return `"${text.replace(
        /"/g,
        '""'
      )}"`;
    }

    return text;
  };


  const csvRows = [];


  // =====================================================
  // PROCESS EACH MATERIAL CONSUMPTION RECORD
  // =====================================================

  data.forEach((item, itemIndex) => {

    // ===================================================
    // PROJECT SUMMARY
    // ===================================================

    const plantTotalValue =
      Number(
        item.plant_total_value ??
        item.total_plant_value ??
        item.project_total_value ??
        item.total_amount ??
        0
      );


    const plantCost =
      Number(
        item.plant_cost ??
        item.total_plant_cost ??
        0
      );


    const profit =
      Number(
        item.profit ??
        plantTotalValue - plantCost
      );


    // ===================================================
    // COMPANY HEADER
    // ===================================================

    csvRows.push([
      "SHIV SHAKTI SOLAR ENERGY",
    ]);


    csvRows.push([
      "Material Consumption Report",
    ]);


    csvRows.push([
      "",
    ]);


    // ===================================================
    // PROJECT SUMMARY HEADER
    // ===================================================

    csvRows.push([
      "Customer",
      "Project No",
      "Plant Size",
      "Total Plant Value",
      "Plant Cost",
      "Profit",
    ]);


    // ===================================================
    // PROJECT SUMMARY DATA
    // ===================================================

    csvRows.push([
      item.customers?.customer_name ||
        item.customer_name ||
        "",

      item.project_no ||
        "",

      item.plant_size
        ? `${item.plant_size} KW`
        : "",

      plantTotalValue,

      plantCost,

      profit,
    ]);


    csvRows.push([
      "",
    ]);


    // ===================================================
    // PRODUCT TABLE HEADER
    // ===================================================

    csvRows.push([
      "Product",
      "Category",
      "Quantity",
      "Unit Price",
      "Total",
    ]);


    // ===================================================
    // PRODUCTS
    // ===================================================

    const products =
      Array.isArray(item.products)
        ? item.products
        : [];


    products
      .filter(
        (product) =>
          Number(
            product.quantity || 0
          ) > 0
      )
      .forEach((product) => {

        const quantity =
          Number(
            product.quantity || 0
          );


        const unitPrice =
          Number(
            product.unit_price ??
            product.unit_cost ??
            product.price ??
            0
          );


        const total =
          Number(
            product.total || 0
          ) ||
          quantity * unitPrice;


        csvRows.push([
          getCSVProductName(product),
          product.category || "",
          quantity,
          unitPrice,
          total,
        ]);

      });


    csvRows.push([
      "",
    ]);


    // ===================================================
    // ADDITIONAL CHARGES
    // ===================================================

    csvRows.push([
      "Additional Charge",
      "Charge Amount",
    ]);


    const charges = [

      [
        "Bhada Charges",
        item.bhada_charges,
      ],

      [
        "Cement Charges",
        item.cement_charges,
      ],

      [
        "Gitti Charges",
        item.gitti_charges,
      ],

      [
        "Installation Charges",
        item.installation_charges,
      ],

      [
        "JE Charges",
        item.je_charges,
      ],

      [
        "Load Extension Charges",
        item.load_extension_charges,
      ],

      [
        "Meter Connection Charges",
        item.meter_connection_charges,
      ],

      [
        "Meter Name Change Charge",
        item.name_change_charges,
      ],

      [
        "Meter Change Charge",
        item.meter_change_charges,
      ],

      [
        "Net Metering Charges",
        item.net_metering_charges,
      ],

      [
        "Sand Charges",
        item.sand_charges,
      ],

      [
        "Vendor Charges",
        item.vendor_charges,
      ],

    ];


    charges
      .filter(
        ([, amount]) =>
          Number(amount || 0) > 0
      )
      .forEach(
        ([name, amount]) => {

          csvRows.push([
            name,
            Number(amount || 0),
          ]);

        }
      );


    csvRows.push([
      "",
    ]);


    // ===================================================
    // PANEL / INVERTER DETAILS
    // ===================================================

    csvRows.push([
      "Panel Company",
      "Panel Serial Number",
      "Inverter Company",
      "Inverter Model",
      "Inverter Serial Number",
    ]);


    const panelProducts =
      products.filter(
        (product) =>
          String(
            product.product_name || ""
          )
            .trim()
            .toLowerCase() === "panel" ||

          String(
            product.category || ""
          )
            .trim()
            .toLowerCase() === "panel"
      );


    const inverterProducts =
      products.filter(
        (product) =>
          String(
            product.product_name || ""
          )
            .trim()
            .toLowerCase() === "inverter" ||

          String(
            product.category || ""
          )
            .trim()
            .toLowerCase() === "inverter"
      );


    const panelRows =
      panelProducts.flatMap(
        (product) => {

          const serials =
            Array.isArray(
              product.serial_numbers
            )
              ? product.serial_numbers
              : [];


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
            {
              length: count,
            },
            (_, index) => ({
              company:
                product.company ||
                product.brand ||
                "",

              serial:
                serials[index] ||
                "",
            })
          );

        }
      );


    const inverterRows =
      inverterProducts.flatMap(
        (product) => {

          const serials =
            Array.isArray(
              product.serial_numbers
            )
              ? product.serial_numbers
              : [];


          const models =
            Array.isArray(
              product.inverter_models
            )
              ? product.inverter_models
              : [];


          const fallbackModel =
            product.specification ||
            "";


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
            {
              length: count,
            },
            (_, index) => ({
              company:
                product.company ||
                product.brand ||
                "",

              model:
                models[index] ||
                fallbackModel ||
                "",

              serial:
                serials[index] ||
                "",
            })
          );

        }
      );


    const detailCount =
      Math.max(
        panelRows.length,
        inverterRows.length
      );


    for (
      let index = 0;
      index < detailCount;
      index++
    ) {

      csvRows.push([

        panelRows[index]?.company ||
          "",

        panelRows[index]?.serial ||
          "",

        inverterRows[index]?.company ||
          "",

        inverterRows[index]?.model ||
          "",

        inverterRows[index]?.serial ||
          "",

      ]);

    }


    // ===================================================
    // SEPARATOR BETWEEN RECORDS
    // ===================================================

    if (
      itemIndex <
      data.length - 1
    ) {

      csvRows.push([
        "",
      ]);

      csvRows.push([
        "",
      ]);

    }

  });


  // =====================================================
  // BUILD CSV
  // =====================================================

  const csv =
    csvRows
      .map((row) =>
        row
          .map(escapeCSV)
          .join(",")
      )
      .join("\r\n");


  const blob =
    new Blob(
      [
        "\uFEFF" +
        csv,
      ],
      {
        type:
          "text/csv;charset=utf-8;",
      }
    );


  const url =
    URL.createObjectURL(
      blob
    );


  const link =
    document.createElement(
      "a"
    );


  link.href = url;


  link.download =
    "Used_Inventory_Report.csv";


  document.body.appendChild(
    link
  );


  link.click();


  document.body.removeChild(
    link
  );


  URL.revokeObjectURL(
    url
  );

}


// =====================================================
// CSV PRODUCT NAME
// =====================================================

function getCSVProductName(product) {

  const productName =
    String(
      product?.product_name || ""
    ).trim();


  const category =
    String(
      product?.category || ""
    ).trim();


  const company =
    String(
      product?.company ||
      product?.brand ||
      product?.manufacturer ||
      ""
    ).trim();


  const specification =
    String(
      product?.specification ||
      product?.capacity ||
      product?.panel_capacity ||
      product?.inverter_capacity ||
      ""
    ).trim();


  const lowerName =
    productName.toLowerCase();


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
