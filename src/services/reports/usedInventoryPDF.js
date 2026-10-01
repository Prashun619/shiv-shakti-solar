import {
  createReportPDF,
  drawTable,
  addFooter,
} from "./pdfTable";


// =====================================================
// EXPORT MATERIAL CONSUMPTION PDF
// =====================================================

export async function exportUsedInventoryPDF(item) {
  // IMPORTANT:
  // createReportPDF() is async because it loads the logo.
  const doc = await createReportPDF(
    "Material Consumption Report"
  );

  const cleanArray = (value) => {
    if (!Array.isArray(value)) return [];

    return value
      .map((entry) => String(entry ?? "").trim())
      .filter(Boolean);
  };

  const getPlantTotalValue = (obj) =>
    Number(
      obj?.plant_total_value ||
      obj?.total_value ||
      0
    );

  const plantValue = getPlantTotalValue(item);


  // =====================================================
  // COLORS
  // =====================================================

  const DARK_BLUE = [30, 58, 138];
  const ORANGE = [217, 119, 6];
  const WHITE = [255, 255, 255];
  const BLACK = [0, 0, 0];


  // =====================================================
  // SECTION HEADER
  // =====================================================

const drawSectionHeader = (
  title,
  y,
  width = 182
) => {
  doc.setFillColor(...DARK_BLUE);

  doc.rect(
    14,
    y - 3,
    width,
    5,
    "F"
  );

  doc.setTextColor(
    ...WHITE
  );

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(7);

  doc.text(
    title,
    16,
    y + 0.5
  );

  doc.setTextColor(
    ...BLACK
  );

  return y + 5;
};



  // =====================================================
  // PARSE PRODUCTS
  // =====================================================

  const allProducts = Object.values(
    (item?.products || [])
      .filter(
        (product) =>
          Number(product?.quantity || 0) > 0
      )
      .reduce((acc, product) => {
        const unitPrice = Number(
          product?.unit_price ??
          product?.unit_cost ??
          product?.price ??
          0
        );

        const key =
          (product?.product_name || "") +
          "_" +
          (product?.category || "") +
          "_" +
          unitPrice;

        const serialNumbers = cleanArray(
          product?.serial_numbers
        );

        const inverterModels = cleanArray(
          product?.inverter_models
        );


        if (!acc[key]) {
          acc[key] = {
            ...product,

            quantity: Number(
              product?.quantity || 0
            ),

            unit_price: unitPrice,

            total:
              Number(product?.total || 0) ||
              Number(product?.quantity || 0) *
                unitPrice,

            serial_numbers: [
              ...serialNumbers,
            ],

            inverter_models: [
              ...inverterModels,
            ],
          };
        } else {
          acc[key].quantity += Number(
            product?.quantity || 0
          );

          acc[key].total +=
            Number(product?.total || 0) ||
            Number(product?.quantity || 0) *
              unitPrice;

          acc[key].serial_numbers = [
            ...(acc[key].serial_numbers || []),
            ...serialNumbers,
          ];

          acc[key].inverter_models = [
            ...(acc[key].inverter_models || []),
            ...inverterModels,
          ];
        }

        return acc;
      }, {})
  );


  // =====================================================
  // ADDITIONAL CHARGES
  // =====================================================

  const additionalCharges = [
    {
      name: "Bhada Charges",
      amount: Number(
        item?.bhada_charges ?? 0
      ),
    },

    {
      name: "Cement Charges",
      amount: Number(
        item?.cement_charges ?? 0
      ),
    },

    {
      name: "Gitti Charges",
      amount: Number(
        item?.gitti_charges ?? 0
      ),
    },

    {
      name: "Installation Charges",
      amount: Number(
        item?.installation_charges ?? 0
      ),
    },

    {
      name: "JE Charges",
      amount: Number(
        item?.je_charges ?? 0
      ),
    },

    {
      name: "Net Metering Charges",
      amount: Number(
        item?.net_metering_charges ?? 0
      ),
    },
  ].filter(
    (charge) => charge.amount > 0
  );


  // =====================================================
  // CALCULATIONS
  // =====================================================

  const productCost =
    allProducts.reduce(
      (sum, p) =>
        sum + Number(p.total || 0),
      0
    );

  const extraCost =
    additionalCharges.reduce(
      (sum, c) =>
        sum + Number(c.amount || 0),
      0
    );

  const grandTotal =
    productCost + extraCost;

  const viewProfit =
    plantValue - grandTotal;

  const profitPercent =
    plantValue > 0
      ? (viewProfit / plantValue) * 100
      : 0;


  // =====================================================
  // PANEL & INVERTER DATA
  // =====================================================

  const isPanel = (p) =>
    String(
      p?.category || ""
    ).toLowerCase() === "panel" ||
    String(
      p?.product_name || ""
    ).toLowerCase() === "panel";


  const isInverter = (p) =>
    String(
      p?.category || ""
    ).toLowerCase() === "inverter" ||
    String(
      p?.product_name || ""
    ).toLowerCase() === "inverter";


  const panelData = allProducts
    .filter(isPanel)
    .flatMap((p) => {
      const serials = cleanArray(
        p?.serial_numbers
      );

      const count = Math.max(
        Number(p?.quantity || 0),
        serials.length
      );

      return Array.from(
        { length: count },
        (_, i) => ({
          company:
            p?.company || "-",

          serial:
            serials[i] || "-",
        })
      );
    });


  const inverterData = allProducts
    .filter(isInverter)
    .flatMap((p) => {
      const serials = cleanArray(
        p?.serial_numbers
      );

      let models = cleanArray(
        p?.inverter_models
      );

      if (
        !models.length &&
        p?.specification
      ) {
        models = [
          String(
            p.specification
          ).trim(),
        ];
      }

      const count = Math.max(
        Number(p?.quantity || 0),
        serials.length,
        models.length
      );

      return Array.from(
        { length: count },
        (_, i) => ({
          company:
            p?.company || "-",

          model:
            models[i] || "-",

          serial:
            serials[i] || "-",
        })
      );
    });


  // =====================================================
  // START PDF
  // =====================================================

  let startY = 15;


  // =====================================================
  // 1. COMPANY HEADER
  // =====================================================

  doc.setFillColor(...DARK_BLUE);

  doc.rect(
  14,
  startY - 5,
  182,
  9,
  "F"
);

  doc.setTextColor(...WHITE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);

  doc.text(
    "SHIV SHAKTI SOLAR ENERGY",
    105,
    startY + 1,
    {
      align: "center",
    }
  );

  startY += 9;


  // =====================================================
  // 2. REPORT TITLE
  // =====================================================

  doc.setFillColor(...ORANGE);

  doc.rect(
  14,
  startY - 3,
  182,
  6,
  "F"
);

  doc.setTextColor(...BLACK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);

  doc.text(
    "MATERIAL CONSUMPTION REPORT",
    105,
    startY + 2,
    {
      align: "center",
    }
  );

  startY += 8;


  // =====================================================
  // 3. CUSTOMER INFORMATION
  // =====================================================

  startY = drawSectionHeader(
    "CUSTOMER INFORMATION",
    startY
  );

  startY = drawTable(
    doc,

    [
      {
        title: "Customer Name",
        width: 45,
      },

      {
        title: "Project No",
        width: 35,
      },

      {
        title: "Plant Size",
        width: 30,
      },

      {
        title: "Location",
        width: 45,
      },
    ],

    [
      [
        item?.customers?.customer_name ||
          item?.customer_name ||
          "-",

        item?.project_no ||
          "-",

        item?.plant_size
          ? `${item.plant_size} KW`
          : "-",

        item?.location ||
          "-",
      ],
    ],

    {
      startY,

      headerFillColor:
        ORANGE,

      headerTextColor:
        WHITE,
    }
  );

  startY += 3;


  // =====================================================
  // 4. FINANCIAL SUMMARY
  // =====================================================

  startY = drawSectionHeader(
    "FINANCIAL SUMMARY",
    startY
  );

  startY = drawTable(
    doc,

    [
      {
        title: "Plant Total Value",
        width: 38,
      },

      {
        title: "Plant Cost",
        width: 38,
      },

      {
        title: "Profit",
        width: 37,
      },

      {
        title: "Profit %",
        width: 37,
      },
    ],

    [
      [
        plantValue.toFixed(2),

        grandTotal.toFixed(2),

        viewProfit.toFixed(2),

        `${profitPercent.toFixed(2)}%`,
      ],
    ],

    {
      startY,

      headerFillColor:
        ORANGE,

      headerTextColor:
        WHITE,
    }
  );

  startY += 3;


  // =====================================================
  // 5. MATERIALS USED
  // =====================================================

  startY = drawSectionHeader(
    "MATERIALS USED",
    startY
  );

  const materialRows = [];

  let serialCounter = 1;


  allProducts.forEach((p) => {
    materialRows.push([
      serialCounter++,

      p?.product_name ||
        "-",

      p?.category ||
        "-",

      Number(
        p?.quantity || 0
      ),

      p?.unit ||
        "Nos",

      Number(
        p?.unit_price || 0
      ).toFixed(2),

      Number(
        p?.total || 0
      ).toFixed(2),
    ]);
  });


  additionalCharges.forEach(
    (c) => {
      materialRows.push([
        serialCounter++,

        c.name,

        "Additional Charges",

        1,

        "",

        Number(
          c.amount
        ).toFixed(2),

        Number(
          c.amount
        ).toFixed(2),
      ]);
    }
  );


  startY = drawTable(
    doc,

    [
      {
        title: "S.No",
        width: 12,
      },

      {
        title: "Product",
        width: 52,
      },

      {
        title: "Category",
        width: 35,
      },

      {
        title: "Qty",
        width: 15,
      },

      {
        title: "Unit",
        width: 15,
      },

      {
        title: "Price",
        width: 22,
      },

      {
        title: "Total",
        width: 25,
      },
    ],

    materialRows,

    {
      startY,

      headerFillColor:
        ORANGE,

      headerTextColor:
        WHITE,
    }
  );

  startY += 3;


  // =====================================================
  // 6. PANEL & INVERTER DETAILS
  // =====================================================

  if (
    panelData.length > 0 ||
    inverterData.length > 0
  ) {
    startY = drawSectionHeader(
      "PANEL & INVERTER DETAILS",
      startY
    );

    const detailsRows = [];

    const maxRows =
      Math.max(
        panelData.length,
        inverterData.length
      );


    for (
      let i = 0;
      i < maxRows;
      i++
    ) {
      const pan =
        panelData[i] || {};

      const inv =
        inverterData[i] || {};


      detailsRows.push([
        pan.company !== "-"
          ? pan.company
          : "",

        pan.serial || "",

        inv.company !== "-"
          ? inv.company
          : "",

        inv.model || "",

        inv.serial || "",
      ]);
    }


    startY = drawTable(
      doc,

      [
        {
          title: "Panel Company",
          width: 35,
        },

        {
          title: "Panel Serial",
          width: 45,
        },

        {
          title: "Inverter Company",
          width: 35,
        },

        {
          title: "Model",
          width: 30,
        },

        {
          title: "Inverter Serial",
          width: 35,
        },
      ],

      detailsRows,

      {
        startY,

        headerFillColor:
          ORANGE,

        headerTextColor:
          WHITE,
      }
    );

    startY += 3;
  }


  // =====================================================
  // 7. FINAL COST SUMMARY
  // =====================================================

  startY = drawSectionHeader(
    "FINAL COST SUMMARY",
    startY,
    76
  );


  const finalCostRows = [
    [
      "Product Cost",
      productCost.toFixed(2),
    ],

    [
      "Additional Charges",
      extraCost.toFixed(2),
    ],

    [
      "Total Cost",
      grandTotal.toFixed(2),
    ],
  ];


  startY = drawTable(
    doc,

    [
      {
        title: "Description",
        width: 48,
      },

      {
        title: "Amount",
        width: 28,
      },
    ],

    finalCostRows,

    {
      startY,

      marginLeft: 120,

      headerFillColor:
        ORANGE,

      headerTextColor:
        WHITE,
    }
  );


  // =====================================================
  // FOOTER
  // =====================================================

  addFooter(doc);


  // =====================================================
  // DOWNLOAD
  // =====================================================

  const customerName =
    item?.customers?.customer_name ||
    item?.customer_name ||
    "Used_Inventory";


  doc.save(
    `${customerName}_Material_Consumption.pdf`
  );
}
