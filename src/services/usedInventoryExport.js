  import {
    createReportPDF,
    drawTable,
    addFooter,
  } from "./reports/pdfTable";

  import ExcelJS from "exceljs";
  import { saveAs } from "file-saver";

  import { supabase } from "./supabase";


  // =====================================================
  // HELPERS
  // =====================================================

  function formatAmount(value) {
    return Number(value || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }


  // =====================================================
  // PRODUCT DISPLAY NAME
  // =====================================================

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

    const lowerName =
      productName.toLowerCase();


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


  // =====================================================
  // PREPARE PRODUCTS
  // =====================================================

  function getProducts(item) {
    return Object.values(
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

          const serialNumbers =
            Array.isArray(
              product.serial_numbers
            )
              ? product.serial_numbers
              : [];

          const inverterModels =
            Array.isArray(
              product.inverter_models
            )
              ? product.inverter_models
              : [];


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
                Number(
                  product.quantity || 0
                ),

              unit_price:
                unitPrice,

              total:
                Number(
                  product.total || 0
                ),

              serial_numbers: [
                ...serialNumbers,
              ],

              inverter_models: [
                ...inverterModels,
              ],
            };
          } else {
            acc[key].quantity +=
              Number(
                product.quantity || 0
              );

            acc[key].total +=
              Number(
                product.total || 0
              );

            acc[key].serial_numbers.push(
              ...serialNumbers
            );

            acc[key].inverter_models.push(
              ...inverterModels
            );
          }


          return acc;
        }, {})
    ).map((product) => {
      const quantity =
        Number(
          product.quantity || 0
        );

      const unitPrice =
        Number(
          product.unit_price || 0
        );


      return {
        ...product,

        total:
          Number(product.total || 0) > 0
            ? Number(product.total)
            : quantity * unitPrice,

        serial_numbers:
          Array.isArray(
            product.serial_numbers
          )
            ? product.serial_numbers
            : [],

        inverter_models:
          Array.isArray(
            product.inverter_models
          )
            ? product.inverter_models
            : [],
      };
    });
  }


  // =====================================================
  // CLEAN ARRAY
  // =====================================================

  function cleanArray(value) {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((item) =>
        String(item || "").trim()
      )
      .filter(Boolean);
  }


  // =====================================================
  // PANEL CHECK
  // =====================================================

  function isPanel(product) {
    return (
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
  }


  // =====================================================
  // INVERTER CHECK
  // =====================================================

  function isInverter(product) {
    return (
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
  }


  // =====================================================
  // GET PANEL DATA
  // =====================================================

  function getPanelData(products) {
    const panelProducts =
      products.filter(isPanel);


    return panelProducts.flatMap(
      (product) => {

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
          {
            length: count,
          },
          (_, index) => ({
            company:
              product.company || "-",

            serial:
              serials[index] || "-",
          })
        );
      }
    );
  }


  // =====================================================
  // GET INVERTER DATA
  // =====================================================

  function getInverterData(products) {
    const inverterProducts =
      products.filter(isInverter);


    return inverterProducts.flatMap(
      (product) => {

        const serials =
          cleanArray(
            product.serial_numbers
          );


        let models =
          cleanArray(
            product.inverter_models
          );


        if (!models.length) {

          const specification =
            String(
              product.specification || ""
            ).trim();


          if (specification) {
            models = [
              specification,
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
          {
            length: count,
          },
          (_, index) => ({
            company:
              product.company || "-",

            model:
              models[index] || "-",

            serial:
              serials[index] || "-",
          })
        );
      }
    );
  }


  // =====================================================
  // ADDITIONAL CHARGES
  // =====================================================

  function getAdditionalCharges(item) {

    return [

      {
        name: "Bhada Charges",
        amount:
          Number(
            item.bhada_charges || 0
          ),
      },

      {
        name: "Cement Charges",
        amount:
          Number(
            item.cement_charges || 0
          ),
      },

      {
        name: "Gitti Charges",
        amount:
          Number(
            item.gitti_charges || 0
          ),
      },

      {
        name: "Installation Charges",
        amount:
          Number(
            item.installation_charges || 0
          ),
      },

      {
        name: "JE Charges",
        amount:
          Number(
            item.je_charges || 0
          ),
      },

      {
        name: "Load Extension Charges",
        amount:
          Number(
            item.load_extension_charges || 0
          ),
      },

      {
        name: "Meter Connection Charges",
        amount:
          Number(
            item.meter_connection_charges || 0
          ),
      },

      {
        name: "Meter Name Change Charge",
        amount:
          Number(
            item.name_change_charges || 0
          ),
      },

      {
        name: "Meter Change Charge",
        amount:
          Number(
            item.meter_change_charges || 0
          ),
      },

      {
        name: "Net Metering Charges",
        amount:
          Number(
            item.net_metering_charges || 0
          ),
      },

      {
        name: "Sand Charges",
        amount:
          Number(
            item.sand_charges || 0
          ),
      },

      {
        name: "Vendor Charges",
        amount:
          Number(
            item.vendor_charges || 0
          ),
      },

    ].filter(
      (charge) =>
        charge.amount > 0
    );
  }


  // =====================================================
  // CENTRAL CALCULATION
  // =====================================================

  function calculateUsedInventory(
    item,
    plantTotalValue
  ) {

    const products =
      getProducts(item);


    const additionalCharges =
      getAdditionalCharges(item);


    const productCost =
      products.reduce(
        (sum, product) =>
          sum +
          Number(
            product.total || 0
          ),
        0
      );


    const extraCost =
      additionalCharges.reduce(
        (sum, charge) =>
          sum +
          Number(
            charge.amount || 0
          ),
        0
      );


    const plantCost =
      productCost +
      extraCost;


    const plantTotal =
      Number(
        plantTotalValue || 0
      );


    const profit =
      plantTotal -
      plantCost;


    const profitPercent =
      plantTotal > 0
        ? (
            profit /
            plantTotal
          ) * 100
        : 0;


    return {

      products,

      additionalCharges,

      productCost,

      extraCost,

      plantCost,

      plantTotalValue:
        plantTotal,

      profit,

      profitPercent,

    };

  }


  // =====================================================
  // GET PLANT TOTAL VALUE
  // =====================================================

  async function getPlantTotalValue(item) {

    if (!item?.project_no) {
      return 0;
    }


    const {
      data,
      error,
    } = await supabase

      .from("projects")

      .select("total_amount")

      .eq(
        "project_no",
        item.project_no
      )

      .maybeSingle();


    if (error) {

      console.error(
        "Error fetching plant total value:",
        error
      );

      return 0;

    }


    return Number(
      data?.total_amount || 0
    );

  }


  // =====================================================
  // PDF DOWNLOAD
  // =====================================================

  export async function downloadUsedInventoryPDF(item) {
    try {
      console.log(
        "PDF ITEM CUSTOMER DEBUG:",
        {
          customer_id: item?.customer_id,
          customerId: item?.customerId,
          project_id: item?.project_id,
          projectId: item?.projectId,
          customer_name: item?.customer_name,
          customerName: item?.customerName,
          customer: item?.customer,
          item,
        }
      );

      // =====================================================
      // HELPERS
      // =====================================================

      const formatAmount = (value) =>
        Number(value || 0).toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

      const formatQuantity = (value) => {
        const num = Number(value || 0);

        if (!Number.isFinite(num)) {
          return "0";
        }

        return Number.isInteger(num)
          ? String(num)
          : num
              .toFixed(2)
              .replace(/\.?0+$/, "");
      };

      const cleanArray = (value) =>
        Array.isArray(value)
          ? value.filter(Boolean)
          : [];

      const isPanel = (product) =>
        String(product?.product_name || "")
          .trim()
          .toLowerCase() === "panel";

      const isInverter = (product) =>
        String(product?.product_name || "")
          .trim()
          .toLowerCase() === "inverter";

      const isCChannel = (product) =>
        String(product?.product_name || "")
          .trim()
          .toLowerCase()
          .includes("c channel");

      // =====================================================
      // SERIAL NUMBERS
      // =====================================================

      const getSerialNumbers = (product) => {
        const serials = [];

        const addSerial = (value) => {
          if (Array.isArray(value)) {
            value.forEach(addSerial);
            return;
          }

          if (
            value !== undefined &&
            value !== null &&
            String(value).trim()
          ) {
            serials.push(
              String(value).trim()
            );
          }
        };

        addSerial(
          product?.serial_number
        );

        addSerial(
          product?.serial
        );

        addSerial(
          product?.serial_numbers
        );

        addSerial(
          product?.serialNumbers
        );

        addSerial(
          product?.serial_no
        );

        return [
          ...new Set(
            serials.filter(Boolean)
          ),
        ];
      };

      // =====================================================
      // PRODUCT DISPLAY NAME
      // =====================================================

      const getViewProductName = (product) => {
        const productName =
          String(
            product?.product_name || ""
          ).trim();

        const company =
          String(
            product?.company || ""
          ).trim();

        const specification =
          String(
            product?.specification || ""
          ).trim();

        if (isPanel(product)) {
          return [
            company,
            "Panel",
            specification,
          ]
            .filter(Boolean)
            .join(" ");
        }

        if (isInverter(product)) {
          return [
            company,
            "Inverter",
            specification,
          ]
            .filter(Boolean)
            .join(" ");
        }

        return productName || "-";
      };

      // =====================================================
      // UNIT
      // =====================================================

      const getViewInventoryUnit = (product) => {
        if (isCChannel(product)) {
          return "Ft";
        }

        const productName =
          String(
            product?.product_name || ""
          )
            .trim()
            .toLowerCase();

        const company =
          String(
            product?.company || ""
          )
            .trim()
            .toLowerCase();

        const specification =
          String(
            product?.specification || ""
          )
            .trim()
            .toLowerCase();

        const inventoryUnits =
          Array.isArray(
            item?.inventoryUnits
          )
            ? item.inventoryUnits
            : [];

        const matchingUnit =
          inventoryUnits.find(
            (row) => {
              const rowProduct =
                String(
                  row?.product_name || ""
                )
                  .trim()
                  .toLowerCase();

              const rowCompany =
                String(
                  row?.company || ""
                )
                  .trim()
                  .toLowerCase();

              const rowSpecification =
                String(
                  row?.specification || ""
                )
                  .trim()
                  .toLowerCase();

              return (
                rowProduct ===
                  productName &&
                rowCompany ===
                  company &&
                rowSpecification ===
                  specification
              );
            }
          );

        const unit =
          String(
            matchingUnit?.unit ||
            product?.unit ||
            "Nos"
          )
            .trim()
            .toLowerCase();

        const unitMap = {
          ft: "Ft",
          feet: "Ft",
          mtr: "Mtr",
          meter: "Mtr",
          metre: "Mtr",
          nos: "Nos",
          no: "Nos",
          kg: "Kg",
          pair: "Pair",
          set: "Set",
          pack: "Pack",
          roll: "Roll",
          box: "Box",
        };

        return (
          unitMap[unit] ||
          "Nos"
        );
      };

      // =====================================================
      // PRODUCTS
      // =====================================================

      const products =
        Array.isArray(item?.products)
          ? item.products
          : Array.isArray(
              item?.used_inventory?.products
            )
          ? item.used_inventory.products
          : Array.isArray(
              item?.usedProducts
            )
          ? item.usedProducts
          : [];

      // =====================================================
      // GROUP PRODUCTS
      // =====================================================

      const productGroups = [];

      products.forEach(
        (product) => {
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
              product?.company || ""
            ).trim();

          const specification =
            String(
              product?.specification || ""
            ).trim();

          const unit =
            getViewInventoryUnit(
              product
            );

          const unitPrice =
            Number(
              product?.unit_price ??
                product?.unit_cost ??
                product?.price ??
                0
            );

          const lengthFt =
            Number(
              product?.length_ft ??
                product?.source_length_ft ??
                0
            );

          const quantity =
            Number(
              product?.quantity ??
                product?.used_quantity ??
                product?.consumed_quantity ??
                0
            );

          const total =
            Number(
              product?.total ??
                product?.total_amount ??
                product?.amount ??
                quantity * unitPrice
            );

          const serialNumbers =
            getSerialNumbers(
              product
            );

          const existingGroup =
            productGroups.find(
              (row) =>
                row.productName ===
                  productName &&
                row.category ===
                  category &&
                row.company ===
                  company &&
                row.specification ===
                  specification &&
                row.unit ===
                  unit &&
                Number(
                  row.unitPrice
                ) ===
                  Number(unitPrice) &&
                Number(
                  row.lengthFt
                ) ===
                  Number(lengthFt)
            );

          if (existingGroup) {
            existingGroup.quantity +=
              quantity;

            existingGroup.total +=
              total;

            existingGroup.serialNumbers =
              [
                ...new Set([
                  ...existingGroup.serialNumbers,
                  ...serialNumbers,
                ]),
              ];
          } else {
            productGroups.push({
              productName,
              category,
              company,
              specification,
              unit,
              unitPrice,
              lengthFt,
              quantity,
              total,
              serialNumbers,
            });
          }
        }
      );

      // =====================================================
      // PANEL / INVERTER
      // =====================================================

      const panelProducts =
        products.filter(
          (product) =>
            isPanel(product)
        );

      const inverterProducts =
        products.filter(
          (product) =>
            isInverter(product)
        );

      // =====================================================
      // ADDITIONAL CHARGES
      // =====================================================

      const additionalCharges = [
        {
          label: "Bhada Charges",
          amount:
            Number(
              item?.bhada_charges ?? 0
            ),
        },
        {
          label: "Cement Charges",
          amount:
            Number(
              item?.cement_charges ?? 0
            ),
        },
        {
          label: "Gitti Charges",
          amount:
            Number(
              item?.gitti_charges ?? 0
            ),
        },
        {
          label: "Installation Charges",
          amount:
            Number(
              item?.installation_charges ?? 0
            ),
        },
        {
          label: "JE Charges",
          amount:
            Number(
              item?.je_charges ?? 0
            ),
        },
        {
          label: "Load Extension Charges",
          amount:
            Number(
              item?.load_extension_charges ?? 0
            ),
        },
        {
          label: "Meter Connection Charges",
          amount:
            Number(
              item?.meter_connection_charges ?? 0
            ),
        },
        {
          label: "Meter Name Change Charge",
          amount:
            Number(
              item?.name_change_charges ?? 0
            ),
        },
        {
          label: "Meter Change Charge",
          amount:
            Number(
              item?.meter_change_charges ?? 0
            ),
        },
        {
          label: "Net Metering Charges",
          amount:
            Number(
              item?.net_metering_charges ?? 0
            ),
        },
        {
          label: "Sand Charges",
          amount:
            Number(
              item?.sand_charges ?? 0
            ),
        },
        {
          label: "Vendor Charges",
          amount:
            Number(
              item?.vendor_charges ?? 0
            ),
        },
      ];

      // =====================================================
      // PLANT TOTAL VALUE + CENTRAL CALCULATION
      // =====================================================

      const plantTotalValue =
        await getPlantTotalValue(
          item
        );

      const calculations =
        calculateUsedInventory(
          item,
          plantTotalValue
        );

      const {
        productCost,
        extraCost,
        plantCost,
        profit,
        profitPercent,
      } = calculations;

      // =====================================================
      // CUSTOMER DETAILS
      // =====================================================

      let customerName =
        String(
          item?.customer_name ||
            item?.customerName ||
            item?.customer?.name ||
            item?.customer?.customer_name ||
            item?.customer?.full_name ||
            ""
        ).trim();

      if (
        !customerName &&
        item?.customer_id
      ) {
        try {
          const {
            data: customerData,
            error: customerError,
          } = await supabase
            .from("customers")
            .select("*")
            .eq(
              "id",
              item.customer_id
            )
            .maybeSingle();

          console.log(
            "PDF CUSTOMER LOOKUP DEBUG:",
            {
              customerData,
              customerError,
            }
          );

          if (customerData) {
            customerName =
              String(
                customerData.name ||
                  customerData.customer_name ||
                  customerData.full_name ||
                  customerData.customerName ||
                  customerData.customer ||
                  ""
              ).trim();
          }
        } catch (
          customerError
        ) {
          console.warn(
            "Unable to fetch customer:",
            customerError
          );
        }
      }

      customerName =
        customerName || "-";

      const projectNumber =
        String(
          item?.project_number ||
            item?.projectNumber ||
            item?.project_no ||
            item?.projectNo ||
            "-"
        ).trim() || "-";

      const location =
        String(
          item?.location ||
            item?.customer_location ||
            item?.customer?.address ||
            item?.customer?.location ||
            "-"
        ).trim() || "-";

      const plantSize =
        String(
          item?.plant_size ||
            item?.plantSize ||
            item?.project_size ||
            item?.projectSize ||
            "-"
        ).trim() || "-";

      // =====================================================
      // CREATE PDF
      // =====================================================

      const doc =
        await createReportPDF(
          "Material Consumption Details"
        );

      const pageWidth =
        doc.internal.pageSize.getWidth();

      const pageHeight =
        doc.internal.pageSize.getHeight();

      // =====================================================
      // PDF SETTINGS
      // =====================================================

      const margin = 10;

      const contentWidth =
        pageWidth -
        margin * 2;

      let y = 0;

      // =====================================================
      // COLORS
      // =====================================================

      const DARK_BLUE = [
        30,
        58,
        138,
      ];

      const ORANGE = [
        217,
        119,
        6,
      ];

      const LIGHT_GREY = [
        249,
        250,
        251,
      ];

      const WHITE = [
        255,
        255,
        255,
      ];

      const BLACK = [
        0,
        0,
        0,
      ];

      const GREEN = [
        22,
        163,
        74,
      ];

      // =====================================================
      // LOGO
      // =====================================================

      const getLogoDataUrl =
        async () => {
          try {
            const response =
              await fetch(
                "/logo.png"
              );

            if (!response.ok) {
              return null;
            }

            const blob =
              await response.blob();

            return await new Promise(
              (resolve) => {
                const reader =
                  new FileReader();

                reader.onload =
                  () =>
                    resolve(
                      reader.result
                    );

                reader.onerror =
                  () =>
                    resolve(null);

                reader.readAsDataURL(
                  blob
                );
              }
            );
          } catch (error) {
            console.warn(
              "Unable to load logo:",
              error
            );

            return null;
          }
        };

      const logoDataUrl =
        await getLogoDataUrl();

      // =====================================================
  // HEADER
  // =====================================================

  const drawHeader = () => {
    // Clear the area created by createReportPDF()
    // so the custom header/date do not overlap.
    doc.setFillColor(
      WHITE[0],
      WHITE[1],
      WHITE[2]
    );

    doc.rect(
      0,
      0,
      pageWidth,
      48,
      "F"
    );

    // -----------------------------------------
    // DARK BLUE HEADER
    // -----------------------------------------

    doc.setFillColor(
      DARK_BLUE[0],
      DARK_BLUE[1],
      DARK_BLUE[2]
    );

    doc.rect(
      0,
      0,
      pageWidth,
      26,
      "F"
    );

    // -----------------------------------------
    // LOGO
    // -----------------------------------------

    if (logoDataUrl) {
      try {
        doc.addImage(
          logoDataUrl,
          "PNG",
          margin,
          3,
          20,
          20
        );
      } catch (error) {
        console.warn(
          "Unable to add logo:",
          error
        );
      }
    }

    const titleX =
      logoDataUrl
        ? margin + 27
        : margin;

    // -----------------------------------------
    // TITLE
    // -----------------------------------------

    doc.setTextColor(
      WHITE[0],
      WHITE[1],
      WHITE[2]
    );

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(15);

    doc.text(
      "Material Consumption",
      titleX,
      11
    );

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(7);

    doc.text(
      "Shiv Shakti Solar Energy",
      titleX,
      17
    );

    doc.setFontSize(7);

    doc.text(
      "Material Consumption Report",
      titleX,
      22
    );

    // -----------------------------------------
    // DATE AREA
    // -----------------------------------------

    // createReportPDF() already places the
    // Generated/date information around here.
    // Keep a clean dedicated date row below
    // the blue header.

    doc.setTextColor(
      BLACK[0],
      BLACK[1],
      BLACK[2]
    );

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(7);

    const generatedDate =
      new Date().toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }
      );

    doc.text(
      `Generated: ${generatedDate}`,
      pageWidth - margin,
      34,
      {
        align: "right",
        baseline: "middle",
      }
    );

    // -----------------------------------------
    // CUSTOMER DETAILS STARTS BELOW DATE
    // -----------------------------------------

    y = 43;
  };

    

      // =====================================================
      // SECTION TITLE
      // =====================================================

    const drawSectionTitle = (title) => {
  const height = 8;

  doc.setFillColor(
    DARK_BLUE[0],
    DARK_BLUE[1],
    DARK_BLUE[2]
  );

  doc.setDrawColor(
    BLACK[0],
    BLACK[1],
    BLACK[2]
  );

  doc.setLineWidth(0.15);

  doc.rect(
    margin,
    y,
    contentWidth,
    height,
    "FD"
  );

  doc.setTextColor(
    WHITE[0],
    WHITE[1],
    WHITE[2]
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);

  doc.text(
    title,
    margin + contentWidth / 2,
    y + height / 2,
    {
      align: "center",
      baseline: "middle",
    }
  );

  y += height + 2;
};

      // =====================================================
      // CELL DRAWER
      // =====================================================

      const drawCell = (
        x,
        cellY,
        width,
        height,
        value,
        options = {}
      ) => {
        const fill =
          options.fill ||
          WHITE;

        const textColor =
          options.textColor ||
          BLACK;

        const bold =
          options.bold || false;

        const fontSize =
          options.fontSize || 8;

        const wrap =
          options.wrap !== false;

        const align =
          options.align ||
          "center";

        doc.setFillColor(
          fill[0],
          fill[1],
          fill[2]
        );

        doc.setDrawColor(
          BLACK[0],
          BLACK[1],
          BLACK[2]
        );

        doc.setLineWidth(
          0.18
        );

        doc.rect(
          x,
          cellY,
          width,
          height,
          "FD"
        );

        doc.setTextColor(
          textColor[0],
          textColor[1],
          textColor[2]
        );

        doc.setFont(
          "helvetica",
          bold
            ? "bold"
            : "normal"
        );

        doc.setFontSize(
          fontSize
        );

        const stringValue =
          String(
            value ?? ""
          );

        const lines =
          wrap
            ? doc.splitTextToSize(
                stringValue,
                Math.max(
                  width - 5,
                  2
                )
              )
            : [stringValue];

        /*
        * Important:
        * Use a realistic line height.
        * The previous version used:
        *
        * fontSize * 0.35
        *
        * which was too small and caused
        * multi-line text to overlap.
        */
        const lineHeight =
          fontSize * 0.42;

        const totalTextHeight =
          lines.length *
          lineHeight;

        const firstLineY =
          cellY +
          (
            height -
            totalTextHeight
          ) /
            2 +
          lineHeight / 2;

        doc.text(
          lines,
          x + width / 2,
          firstLineY,
          {
            align,
            baseline: "middle",
            maxWidth:
              Math.max(
                width - 5,
                2
              ),
          }
        );
      };

      // =====================================================
      // NEW PAGE
      // =====================================================

      const startNewPage =
        (sectionTitle = null) => {
          doc.addPage();

          drawHeader();

          if (sectionTitle) {
            drawSectionTitle(
              sectionTitle
            );
          }
        };

      // =====================================================
      // FIRST PAGE HEADER
      // =====================================================

      drawHeader();

      // =====================================================
      // CUSTOMER DETAILS
      // =====================================================

      drawSectionTitle(
        "CUSTOMER DETAILS"
      );

      const customerColumns = [
        {
          label: "CUSTOMER",
          value: customerName,
        },
        {
          label: "PROJECT NO",
          value: projectNumber,
        },
        {
          label: "LOCATION",
          value: location,
        },
        {
          label: "PLANT SIZE",
          value: plantSize,
        },
      ];

      const customerLabelHeight = 6;

      const customerValueHeight = 9;

      const customerWidth =
        contentWidth /
        customerColumns.length;

      let customerX =
        margin;

      customerColumns.forEach(
        (column) => {
          drawCell(
            customerX,
            y,
            customerWidth,
            customerLabelHeight,
            column.label,
            {
              fill: ORANGE,
              textColor: WHITE,
              bold: true,
              fontSize: 7.5,
              wrap: false,
            }
          );

          drawCell(
            customerX,
            y +
              customerLabelHeight,
            customerWidth,
            customerValueHeight,
            column.value,
            {
              fill: WHITE,
              textColor: BLACK,
              bold: true,
              fontSize: 8.5,
            }
          );

          customerX +=
            customerWidth;
        }
      );

      y +=
        customerLabelHeight +
        customerValueHeight +
        4;

      // =====================================================
      // PLANT FINANCIAL SUMMARY
      // =====================================================

      drawSectionTitle(
        "PLANT FINANCIAL SUMMARY"
      );

      const financialColumns = [
        {
          label: "PLANT TOTAL VALUE",
          value:
            `Rs. ${formatAmount(
              plantTotalValue
            )}`,
          color: DARK_BLUE,
        },
        {
          label: "PLANT COST",
          value:
            `Rs. ${formatAmount(
              plantCost
            )}`,
          color: ORANGE,
        },
        {
          label: "PROFIT",
          value:
            `Rs. ${formatAmount(
              profit
            )}`,
          color: GREEN,
        },
        {
          label: "PROFIT %",
          value:
            `${Number(
              profitPercent || 0
            ).toFixed(2)}%`,
          color: GREEN,
        },
      ];

      const financialWidth =
        contentWidth /
        financialColumns.length;

      let financialX =
        margin;

      financialColumns.forEach(
        (column) => {
          drawCell(
            financialX,
            y,
            financialWidth,
            6,
            column.label,
            {
              fill: ORANGE,
              textColor: WHITE,
              bold: true,
              fontSize: 7,
              wrap: false,
            }
          );

          drawCell(
            financialX,
            y + 6,
            financialWidth,
            10,
            column.value,
            {
              fill: WHITE,
              textColor: column.color,
              bold: true,
              fontSize: 9,
              wrap: false,
            }
          );

          financialX +=
            financialWidth;
        }
      );

      y +=
        16 + 4;

  const materialSectionWidth = contentWidth - 87;

doc.setFillColor(
  DARK_BLUE[0],
  DARK_BLUE[1],
  DARK_BLUE[2]
);

doc.setDrawColor(
  BLACK[0],
  BLACK[1],
  BLACK[2]
);

doc.setLineWidth(0.15);

doc.rect(
  margin,
  y,
  materialSectionWidth,
  8,
  "FD"
);

doc.setTextColor(
  WHITE[0],
  WHITE[1],
  WHITE[2]
);

doc.setFont("helvetica", "bold");
doc.setFontSize(8);

doc.text(
  "MATERIAL CONSUMPTION",
  margin + materialSectionWidth / 2,
  y + 4,
  {
    align: "center",
    baseline: "middle",
  }
);

y += 10;

const tableX = margin;

// IMPORTANT:
// All column widths together must equal contentWidth.
// This keeps MATERIAL CONSUMPTION exactly aligned
// with PRODUCT / QTY / UNIT / UNIT PRICE / TOTAL.

// TOTAL box is intentionally kept narrower.
const columns = [
  {
    label: "PRODUCT",
    width: 72,
  },
  {
    label: "QTY",
    width: 20,
  },
  {
    label: "UNIT",
    width: 20,
  },
  {
    label: "UNIT PRICE",
    width: 43,
  },
  {
    label: "TOTAL",
    width: 35,
  },
];

// 72 + 20 + 20 + 43 + 35 = 190
// which matches the A4 content width.

const tableWidth = columns.reduce(
  (sum, column) =>
    sum + column.width,
  0
);

const drawMaterialHeader = () => {

  let x = tableX;

  columns.forEach(
    (column) => {

      drawCell(
        x,
        y,
        column.width,
        7,
        column.label,
        {
          fill: ORANGE,
          textColor: WHITE,
          bold: true,
          fontSize: 7.5,
          wrap: false,
        }
      );

      x += column.width;
    }
  );

  y += 7;
};

drawMaterialHeader();

      // =====================================================
      // MATERIAL ROWS
      // =====================================================

      const materialRows = [
        ...productGroups.map(
          (product) => ({
            type: "product",
            product,
          })
        ),

        ...additionalCharges
          .filter(
            (charge) =>
              Number(
                charge.amount || 0
              ) > 0
          )
          .map(
            (charge) => ({
              type: "charge",
              product: {
                productName:
                  charge.label,
                quantity: 1,
                unit: "",
                unitPrice:
                  Number(
                    charge.amount || 0
                  ),
                total:
                  Number(
                    charge.amount || 0
                  ),
                company: "",
                specification: "",
              },
            })
          ),
      ];

      materialRows.forEach(
        (row, index) => {
          const product =
            row.product;

          const productName =
            row.type === "charge"
              ? product.productName
              : getViewProductName({
                  product_name:
                    product.productName,
                  company:
                    product.company,
                  specification:
                    product.specification,
                });

          const productLines =
            doc.splitTextToSize(
              productName,
              columns[0].width - 6
            );

          /*
          * Larger rows prevent overlap.
          * Single-line = 8
          * Two-line = 11
          * Three-line = 14
          */
          const rowHeight =
            Math.max(
              8,
              Math.min(
                14,
                productLines.length *
                  3.8 +
                  3
              )
            );

          /*
          * If there is not enough room
          * on page 1, continue material
          * on page 2.
          */
          if (
  y + rowHeight >
  pageHeight - 10
) {
  startNewPage();

  drawMaterialHeader();
}

          const rowFill =
            index % 2 === 0
              ? LIGHT_GREY
              : WHITE;

          let x =
            tableX;

          // PRODUCT
          drawCell(
            x,
            y,
            columns[0].width,
            rowHeight,
            productName,
            {
              fill: rowFill,
              textColor: BLACK,
              bold:
                row.type === "charge",
              fontSize: 8,
            }
          );

          x +=
            columns[0].width;

          // QTY
          drawCell(
            x,
            y,
            columns[1].width,
            rowHeight,
            formatQuantity(
              product.quantity
            ),
            {
              fill: rowFill,
              textColor: BLACK,
              fontSize: 8,
              wrap: false,
            }
          );

          x +=
            columns[1].width;

          // UNIT
          drawCell(
            x,
            y,
            columns[2].width,
            rowHeight,
            product.unit || "",
            {
              fill: rowFill,
              textColor: BLACK,
              fontSize: 8,
              wrap: false,
            }
          );

          x +=
            columns[2].width;

          // UNIT PRICE
          const unitPriceText =
            Number(
              product.unitPrice || 0
            ) > 0
              ? `Rs. ${formatAmount(
                  product.unitPrice
                )}`
              : "";

          drawCell(
            x,
            y,
            columns[3].width,
            rowHeight,
            unitPriceText,
            {
              fill: rowFill,
              textColor: BLACK,
              fontSize: 7.5,
              wrap: false,
            }
          );

          x +=
            columns[3].width;

          // TOTAL
          const totalText =
            Number(
              product.total || 0
            ) > 0
              ? `Rs. ${formatAmount(
                  product.total
                )}`
              : "";

          drawCell(
            x,
            y,
            columns[4].width,
            rowHeight,
            totalText,
            {
              fill: rowFill,
              textColor: BLACK,
              bold: true,
              fontSize: 7.5,
              wrap: false,
            }
          );

          y +=
            rowHeight;
        }
      );

  // =====================================================
  // PANEL & INVERTER DETAILS
  // CONTINUE IMMEDIATELY AFTER MATERIAL CONSUMPTION
  // =====================================================

  y += 6; 
  drawSectionTitle(
    "PANEL & INVERTER DETAILS"
  );



      // =====================================================
      // PANEL / INVERTER DATA
      // =====================================================

      const panelCompany =
        panelProducts[0]?.company ||
        "-";

      const inverterCompany =
        inverterProducts[0]?.company ||
        "-";

      const inverterModel =
        inverterProducts[0]
          ?.inverter_models?.[0] ||
        inverterProducts[0]
          ?.inverter_model ||
        inverterProducts[0]
          ?.model ||
        inverterProducts[0]
          ?.specification ||
        "-";

      const panelSerials =
        panelProducts.flatMap(
          (product) =>
            getSerialNumbers(
              product
            )
        );

      const inverterSerials =
        inverterProducts.flatMap(
          (product) =>
            getSerialNumbers(
              product
            )
        );

      const detailRowCount =
        Math.max(
          panelSerials.length,
          inverterSerials.length,
          1
        );

      const detailColumns = [
        {
          label: "PANEL COMPANY",
          width: 40,
        },
        {
          label: "PANEL SERIAL NUMBER",
          width: 48,
        },
        {
          label: "INVERTER COMPANY",
          width: 40,
        },
        {
          label: "INVERTER MODEL",
          width: 45,
        },
        {
          label: "INVERTER SERIAL NUMBER",
          width:
            contentWidth -
            173,
        },
      ];

      const detailHeaderHeight =
        7;

      let detailX =
        margin;

      detailColumns.forEach(
        (column) => {
          drawCell(
            detailX,
            y,
            column.width,
            detailHeaderHeight,
            column.label,
            {
              fill: ORANGE,
              textColor: WHITE,
              bold: true,
              fontSize: 8,
            }
          );

          detailX +=
            column.width;
        }
      );

      y +=
        detailHeaderHeight;

      // =====================================================
      // PANEL / INVERTER ROWS
      // =====================================================

      for (
        let rowIndex = 0;
        rowIndex < detailRowCount;
        rowIndex++
      ) {
        const panelSerial =
          panelSerials[
            rowIndex
          ] || "-";

        const inverterSerial =
          inverterSerials[
            rowIndex
          ] || "-";

        const rowHeight =
          8;

        const rowValues = [
          rowIndex === 0
            ? panelCompany
            : "",

          panelSerial,

          rowIndex === 0
            ? inverterCompany
            : "",

          rowIndex === 0
            ? inverterModel
            : "",

          inverterSerial,
        ];

        let x =
          margin;

        rowValues.forEach(
          (
            value,
            columnIndex
          ) => {
            const column =
              detailColumns[
                columnIndex
              ];

            drawCell(
              x,
              y,
              column.width,
              rowHeight,
              value,
              {
                fill:
                  rowIndex % 2 === 0
                    ? LIGHT_GREY
                    : WHITE,
                textColor: BLACK,
                bold:
                  columnIndex === 0 ||
                  columnIndex === 2 ||
                  columnIndex === 3,
                fontSize: 8,
              }
            );

            x +=
              column.width;
          }
        );

        y +=
          rowHeight;
      }

      // =====================================================
      // FINAL CALCULATION
      // =====================================================

      y += 6;

      drawSectionTitle(
        "FINAL CALCULATION"
      );

      const summaryRows = [
        {
          label: "PRODUCT COST",
          value:
            `Rs. ${formatAmount(
              productCost
            )}`,
          valueColor: BLACK,
        },
        {
          label: "ADDITIONAL CHARGES",
          value:
            `Rs. ${formatAmount(
              extraCost
            )}`,
          valueColor: BLACK,
        },
        {
          label: "TOTAL COST",
          value:
            `Rs. ${formatAmount(
              plantCost
            )}`,
          valueColor: GREEN,
        },
      ];

      const summaryLabelWidth =
        contentWidth * 0.58;

      const summaryValueWidth =
        contentWidth -
        summaryLabelWidth;

      const summaryRowHeight =
        8;

      summaryRows.forEach(
        (row) => {
          drawCell(
            margin,
            y,
            summaryLabelWidth,
            summaryRowHeight,
            row.label,
            {
              fill: WHITE,
              textColor: BLACK,
              bold: true,
              fontSize: 8.5,
              wrap: false,
            }
          );

          drawCell(
            margin +
              summaryLabelWidth,
            y,
            summaryValueWidth,
            summaryRowHeight,
            row.value,
            {
              fill: WHITE,
              textColor: BLACK,
              bold: true,
              fontSize: 8.5,
              wrap: false,
            }
          );

          y +=
            summaryRowHeight;
        }
      );

      // =====================================================
      // FOOTER
      // =====================================================

      addFooter(
        doc
      );

      // =====================================================
      // SAVE PDF
      // =====================================================

      const safeCustomerName =
        String(
          customerName ||
            "Customer"
        )
          .replace(
            /[\\/:*?"<>|]/g,
            "_"
          )
          .trim() ||
        "Customer";

      const pdfBlob =
  doc.output("blob");

const downloadUrl =
  URL.createObjectURL(pdfBlob);

const link =
  document.createElement("a");

link.href =
  downloadUrl;

link.download =
  `${safeCustomerName}_Material_Consumption.pdf`;

document.body.appendChild(link);

link.click();

document.body.removeChild(link);

setTimeout(() => {
  URL.revokeObjectURL(downloadUrl);
}, 1000);

    } catch (error) {
      console.error(
        "downloadUsedInventoryPDF error:",
        error
      );

      throw error;
    }
  }