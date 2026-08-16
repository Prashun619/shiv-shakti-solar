import jsPDF from "jspdf";
import { applyPlugin } from "jspdf-autotable";

applyPlugin(jsPDF);

// =====================================================
// COLORS
// =====================================================

const NAVY = [7, 59, 102];
const BLUE = [8, 120, 201];
const GREEN = [21, 148, 71];
const ORANGE = [244, 123, 32];
const PURPLE = [122, 76, 194];

const WHITE = [255, 255, 255];

const LIGHT_BLUE = [234, 246, 255];
const LIGHT_GREEN = [237, 249, 238];
const LIGHT_ORANGE = [255, 240, 229];
const LIGHT_PURPLE = [243, 237, 255];
const LIGHT_GREY = [245, 247, 250];

const DARK = [31, 41, 55];
const GREY = [100, 116, 139];

// =====================================================
// HELPERS
// =====================================================

function text(value, fallback = "-") {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return fallback;
  }

  return String(value);
}

function money(value) {
  const amount = Number(value || 0);

  return `₹${amount.toLocaleString("en-IN")}`;
}

function formatDate(date = new Date()) {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const d = new Date(date);

  return `${String(d.getDate()).padStart(2, "0")}-${months[d.getMonth()]}-${d.getFullYear()}`;
}

function getValidTill() {
  const date = new Date();

  date.setDate(
    date.getDate() + 13
  );

  return formatDate(date);
}

function quotationNumber() {
  const year = new Date().getFullYear();

  const random =
    Math.floor(
      1000 + Math.random() * 9000
    );

  return `SSSE-${year}-${random}`;
}

// =====================================================
// HEADER
// =====================================================

function drawHeader(
  doc,
  number,
  date
) {
  const width =
    doc.internal.pageSize.getWidth();

  // Top strip

  doc.setFillColor(...NAVY);

  doc.rect(
    0,
    0,
    width,
    8,
    "F"
  );

  doc.setFillColor(...BLUE);

  doc.rect(
    0,
    8,
    width,
    3,
    "F"
  );

  doc.setFillColor(...GREEN);

  doc.rect(
    0,
    11,
    width,
    2,
    "F"
  );

  // Company

  doc.setTextColor(...NAVY);

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(18);

  doc.text(
    "SHIV SHAKTI",
    15,
    27
  );

  doc.setTextColor(...GREEN);

  doc.setFontSize(10);

  doc.text(
    "SOLAR ENERGY",
    15,
    34
  );

  doc.setTextColor(...GREY);

  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.setFontSize(7);

  doc.text(
    "Powering a Brighter & Greener Tomorrow",
    15,
    41
  );

  // Quotation box

  doc.setFillColor(...NAVY);

  doc.roundedRect(
    width - 77,
    19,
    62,
    28,
    3,
    3,
    "F"
  );

  doc.setTextColor(...WHITE);

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(14);

  doc.text(
    "PROPOSAL",
    width - 46,
    28,
    {
      align: "center",
    }
  );

  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.setFontSize(7);

  doc.text(
    number,
    width - 46,
    36,
    {
      align: "center",
    }
  );

  doc.text(
    date,
    width - 46,
    42,
    {
      align: "center",
    }
  );
}

// =====================================================
// FOOTER
// =====================================================

function drawFooter(doc) {
  const width =
    doc.internal.pageSize.getWidth();

  const height =
    doc.internal.pageSize.getHeight();

  doc.setFillColor(...GREEN);

  doc.rect(
    0,
    height - 5,
    width,
    5,
    "F"
  );

  doc.setTextColor(...GREY);

  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.setFontSize(6.5);

  doc.text(
    "SHIV SHAKTI SOLAR ENERGY • Clean Energy • Smart Investment • Reliable Service",
    15,
    height - 8
  );

  doc.text(
    `Page ${doc.internal.getNumberOfPages()}`,
    width - 15,
    height - 8,
    {
      align: "right",
    }
  );
}

// =====================================================
// PAGE TITLE
// =====================================================

function pageTitle(
  doc,
  title,
  subtitle
) {
  const width =
    doc.internal.pageSize.getWidth();

  doc.setFillColor(...LIGHT_BLUE);

  doc.roundedRect(
    15,
    53,
    width - 30,
    28,
    4,
    4,
    "F"
  );

  doc.setTextColor(...NAVY);

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(18);

  doc.text(
    title,
    21,
    65
  );

  doc.setTextColor(...GREEN);

  doc.setFontSize(9);

  doc.text(
    subtitle,
    21,
    73
  );
}

// =====================================================
// SECTION
// =====================================================

function section(
  doc,
  title,
  y,
  color = BLUE
) {
  const width =
    doc.internal.pageSize.getWidth();

  doc.setFillColor(...color);

  doc.roundedRect(
    15,
    y,
    width - 30,
    9,
    2,
    2,
    "F"
  );

  doc.setTextColor(...WHITE);

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(9);

  doc.text(
    title,
    20,
    y + 6
  );
}

// =====================================================
// MAIN PDF
// =====================================================

export async function generateProposalPDF({
  form = {},
  customer = {},
}) {
  try {

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const width =
      doc.internal.pageSize.getWidth();

    // =================================================
    // DATA
    // =================================================

    const customerName =
      text(
        customer?.person_name,
        "Customer"
      );

    const mobile =
      text(
        customer?.phone
      );

    const email =
      text(
        customer?.email
      );

    const address =
      text(
        customer?.address
      );

    const location =
      text(
        customer?.location ||
        customer?.billing_city
      );

    const plantSize =
      text(
        form.project_size
      );

    const moduleCompany =
      text(
        form.module_company
      );

    const moduleSpecification =
      text(
        form.module_specification
      );

    const moduleQuantity =
      text(
        form.module_quantity
      );

    const inverterCompany =
      text(
        form.inverter_company
      );

    const inverterModel =
      text(
        form.inverter_model
      );

    const inverterQuantity =
      text(
        form.inverter_quantity,
        "1"
      );

    const projectCost =
      Number(
        form.project_basic_cost || 0
      );

    const systemCode =
      projectCost;

    const structure =
      "JSW / APL APOLLO / TATA";

    const cable =
      "Waacab / Polycab";

    const bos =
      "As per OEM";

    const date =
      formatDate();

    const validTill =
      getValidTill();

    const number =
      quotationNumber();

    // =================================================
    // PAGE 1
    // =================================================

    drawHeader(
      doc,
      number,
      date
    );

    pageTitle(
      doc,
      `${plantSize || "SOLAR"} PROPOSAL`,
      "Complete Solar Power System Proposal"
    );

    let y = 90;

    // Customer

    section(
      doc,
      "CUSTOMER DETAILS",
      y,
      GREEN
    );

    y += 14;

    doc.autoTable({
      startY: y,

      body: [
        [
          "Customer",
          customerName,
        ],
        [
          "Mobile",
          mobile,
        ],
        [
          "Email",
          email,
        ],
        [
          "Address",
          address,
        ],
        [
          "Location",
          location,
        ],
      ],

      theme: "grid",

      bodyStyles: {
        fontSize: 8,
        textColor: DARK,
        cellPadding: 3,
      },

      columnStyles: {
        0: {
          cellWidth: 50,
          fontStyle: "bold",
          fillColor: LIGHT_BLUE,
        },

        1: {
          cellWidth: 120,
        },
      },

      margin: {
        left: 15,
        right: 15,
      },
    });

    y =
      doc.lastAutoTable.finalY + 12;

    // Project summary

    section(
      doc,
      "PROJECT SUMMARY",
      y,
      BLUE
    );

    y += 14;

    doc.autoTable({
      startY: y,

      body: [
        [
          "System Capacity",
          plantSize,
        ],
        [
          "Project Type",
          text(
            form.project_type,
            "On Grid"
          ),
        ],
        [
          "Project Class",
          text(
            form.project_class,
            "Residential"
          ),
        ],
        [
          "Mounting Type",
          text(
            form.mounting,
            "Rooftop"
          ),
        ],
        [
          "Proposal Date",
          date,
        ],
        [
          "Valid Till",
          validTill,
        ],
      ],

      theme: "grid",

      bodyStyles: {
        fontSize: 8,
        textColor: DARK,
        cellPadding: 3,
      },

      columnStyles: {
        0: {
          cellWidth: 50,
          fontStyle: "bold",
          fillColor: LIGHT_GREEN,
        },

        1: {
          cellWidth: 120,
        },
      },

      margin: {
        left: 15,
        right: 15,
      },
    });

    y =
      doc.lastAutoTable.finalY + 14;

    // Cost box

    doc.setFillColor(...LIGHT_ORANGE);

    doc.roundedRect(
      15,
      y,
      width - 30,
      38,
      4,
      4,
      "F"
    );

    doc.setTextColor(...ORANGE);

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(9);

    doc.text(
      "PROJECT BASIC COST",
      22,
      y + 11
    );

    doc.setTextColor(...NAVY);

    doc.setFontSize(21);

    doc.text(
      money(projectCost),
      22,
      y + 27
    );

    doc.setTextColor(...GREY);

    doc.setFontSize(7);

    doc.text(
      "System Code",
      width - 60,
      y + 12
    );

    doc.setTextColor(...NAVY);

    doc.setFontSize(11);

    doc.text(
      money(systemCode),
      width - 20,
      y + 25,
      {
        align: "right",
      }
    );

    drawFooter(doc);

    // =================================================
    // PAGE 2 - BOM
    // =================================================

    doc.addPage();

    drawHeader(
      doc,
      number,
      date
    );

    pageTitle(
      doc,
      "BILL OF MATERIALS",
      "Proposed solar system components"
    );

    y = 90;

    section(
      doc,
      "SYSTEM COMPONENTS",
      y,
      BLUE
    );

    y += 14;

    doc.autoTable({
      startY: y,

      head: [
        [
          "#",
          "COMPONENT",
          "SPECIFICATION",
          "QTY",
        ],
      ],

      body: [
        [
          "1",
          "Modules",
          `${moduleCompany} ${moduleSpecification}`,
          moduleQuantity,
        ],

        [
          "2",
          "Inverter",
          inverterModel ||
            inverterCompany,
          inverterQuantity,
        ],

        [
          "3",
          "Structure",
          structure,
          "1",
        ],

        [
          "4",
          "Cable",
          cable,
          "1",
        ],

        [
          "5",
          "BOS",
          bos,
          "1",
        ],
      ],

      theme: "grid",

      headStyles: {
        fillColor: NAVY,
        textColor: WHITE,
        fontStyle: "bold",
        fontSize: 8,
      },

      bodyStyles: {
        textColor: DARK,
        fontSize: 8,
        cellPadding: 4,
      },

      alternateRowStyles: {
        fillColor: LIGHT_GREY,
      },

      columnStyles: {
        0: {
          cellWidth: 12,
          halign: "center",
        },

        1: {
          cellWidth: 40,
          fontStyle: "bold",
        },

        2: {
          cellWidth: 88,
        },

        3: {
          cellWidth: 30,
          halign: "center",
        },
      },

      margin: {
        left: 15,
        right: 15,
      },
    });

    y =
      doc.lastAutoTable.finalY + 16;

    // Warranty

    section(
      doc,
      "WARRANTY",
      y,
      GREEN
    );

    y += 14;

    doc.autoTable({
      startY: y,

      head: [
        [
          "WARRANTY",
          "COVERAGE",
        ],
      ],

      body: [
        [
          "System Warranty",
          "5 years",
        ],
        [
          "Modules - Power",
          "As per OEM",
        ],
        [
          "Modules - Product",
          "As per OEM",
        ],
        [
          "Inverter",
          "As per OEM",
        ],
        [
          "Structure",
          "As per OEM",
        ],
        [
          "BOS",
          "As per OEM",
        ],
      ],

      theme: "grid",

      headStyles: {
        fillColor: GREEN,
        textColor: WHITE,
        fontStyle: "bold",
        fontSize: 8,
      },

      bodyStyles: {
        fontSize: 8,
        textColor: DARK,
        cellPadding: 3,
      },

      alternateRowStyles: {
        fillColor: LIGHT_GREEN,
      },

      columnStyles: {
        0: {
          cellWidth: 75,
          fontStyle: "bold",
        },

        1: {
          cellWidth: 95,
        },
      },

      margin: {
        left: 15,
        right: 15,
      },
    });

    drawFooter(doc);

    // =================================================
    // PAGE 3 - PAYMENT + TERMS
    // =================================================

    doc.addPage();

    drawHeader(
      doc,
      number,
      date
    );

    pageTitle(
      doc,
      "COMMERCIAL TERMS",
      "Payment terms and important conditions"
    );

    y = 90;

    // Payment

    section(
      doc,
      "PAYMENT TERMS",
      y,
      ORANGE
    );

    y += 14;

    doc.autoTable({
      startY: y,

      head: [
        [
          "#",
          "PAYMENT STAGE",
          "PERCENTAGE",
        ],
      ],

      body: [
        [
          "1",
          "Advance at booking",
          "10%",
        ],
        [
          "2",
          "Before material dispatch",
          "70%",
        ],
        [
          "3",
          "After installation & commissioning",
          "20%",
        ],
      ],

      theme: "grid",

      headStyles: {
        fillColor: ORANGE,
        textColor: WHITE,
        fontStyle: "bold",
        fontSize: 8,
      },

      bodyStyles: {
        fontSize: 8,
        textColor: DARK,
        cellPadding: 4,
      },

      alternateRowStyles: {
        fillColor: LIGHT_ORANGE,
      },

      columnStyles: {
        0: {
          cellWidth: 12,
          halign: "center",
        },

        1: {
          cellWidth: 120,
        },

        2: {
          cellWidth: 38,
          halign: "center",
          fontStyle: "bold",
        },
      },

      margin: {
        left: 15,
        right: 15,
      },
    });

    y =
      doc.lastAutoTable.finalY + 15;

    // Terms

    section(
      doc,
      "TERMS & CONDITIONS",
      y,
      NAVY
    );

    y += 14;

    doc.autoTable({
      startY: y,

      body: [
        [
          "1.",
          "Prices quoted are valid till proposal validity.",
        ],
        [
          "2.",
          "Offer Price may vary after detailed site survey or with change in site conditions.",
        ],
        [
          "3.",
          "Customer shall provide supply for electricity, water connection during installation & commissioning.",
        ],
        [
          "4.",
          "Customer shall provide suitable and safe space to keep the material during installation & commissioning.",
        ],
        [
          "5.",
          "Customer shall provide other facilities like ladder/stool/high-stool etc. wherever required.",
        ],
        [
          "6.",
          "Customer shall provide working internet connection (wifi/lan) and auxiliary power supply for data logger.",
        ],
        [
          "7.",
          "Customer shall provide free access for service personal to work at the roof and the meter board or wherever required performing the service.",
        ],
      ],

      theme: "grid",

      bodyStyles: {
        fontSize: 7.5,
        textColor: DARK,
        cellPadding: 3,
        valign: "top",
      },

      alternateRowStyles: {
        fillColor: LIGHT_GREY,
      },

      columnStyles: {
        0: {
          cellWidth: 12,
          halign: "center",
          fontStyle: "bold",
        },

        1: {
          cellWidth: 158,
        },
      },

      margin: {
        left: 15,
        right: 15,
      },
    });

    drawFooter(doc);

    // =================================================
    // PAGE 4 - ACCEPTANCE
    // =================================================

    doc.addPage();

    drawHeader(
      doc,
      number,
      date
    );

    pageTitle(
      doc,
      "PROPOSAL ACCEPTANCE",
      "Confirmation of proposed solar system"
    );

    y = 90;

    section(
      doc,
      "FINAL SYSTEM SUMMARY",
      y,
      BLUE
    );

    y += 14;

    doc.autoTable({
      startY: y,

      body: [
        [
          "Customer",
          customerName,
        ],
        [
          "System Capacity",
          plantSize,
        ],
        [
          "Modules",
          `${moduleCompany} ${moduleSpecification}`,
        ],
        [
          "Module Quantity",
          moduleQuantity,
        ],
        [
          "Inverter",
          inverterModel ||
            inverterCompany,
        ],
        [
          "Inverter Quantity",
          inverterQuantity,
        ],
        [
          "Structure",
          structure,
        ],
        [
          "Cable",
          cable,
        ],
        [
          "BOS",
          bos,
        ],
        [
          "Project Basic Cost",
          money(projectCost),
        ],
        [
          "Valid Till",
          validTill,
        ],
      ],

      theme: "grid",

      bodyStyles: {
        fontSize: 8,
        textColor: DARK,
        cellPadding: 3,
      },

      columnStyles: {
        0: {
          cellWidth: 60,
          fontStyle: "bold",
          fillColor: LIGHT_BLUE,
        },

        1: {
          cellWidth: 110,
        },
      },

      margin: {
        left: 15,
        right: 15,
      },
    });

    y =
      doc.lastAutoTable.finalY + 15;

    section(
      doc,
      "DECLARATION",
      y,
      GREEN
    );

    y += 14;

    doc.setFillColor(...LIGHT_GREEN);

    doc.roundedRect(
      15,
      y,
      width - 30,
      42,
      3,
      3,
      "F"
    );

    doc.setTextColor(...DARK);

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(8);

    const declaration =
      "I/We have reviewed the above proposal, system configuration, commercial terms, payment terms, warranty information and terms & conditions. I/We accept the proposed solar system subject to the final agreed terms.";

    doc.text(
      doc.splitTextToSize(
        declaration,
        width - 48
      ),
      22,
      y + 12
    );

    y += 55;

    section(
      doc,
      "SIGNATURE",
      y,
      PURPLE
    );

    y += 15;

    // Customer signature

    doc.setDrawColor(...GREY);

    doc.rect(
      15,
      y,
      80,
      45
    );

    doc.setTextColor(...DARK);

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(8);

    doc.text(
      "CUSTOMER",
      20,
      y + 9
    );

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.text(
      "Signature: _______________________",
      20,
      y + 27
    );

    doc.text(
      "Date: ____________________________",
      20,
      y + 37
    );

    // Company signature

    doc.rect(
      115,
      y,
      80,
      45
    );

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.text(
      "SHIV SHAKTI SOLAR ENERGY",
      120,
      y + 9
    );

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.text(
      "Authorized Signatory",
      120,
      y + 27
    );

    doc.text(
      "Company Seal",
      120,
      y + 37
    );

    y += 58;

    // Final branding

    doc.setFillColor(...LIGHT_BLUE);

    doc.roundedRect(
      15,
      y,
      width - 30,
      30,
      3,
      3,
      "F"
    );

    doc.setTextColor(...NAVY);

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(13);

    doc.text(
      "SHIV SHAKTI SOLAR ENERGY",
      width / 2,
      y + 11,
      {
        align: "center",
      }
    );

    doc.setTextColor(...GREEN);

    doc.setFontSize(8);

    doc.text(
      "Clean Energy • Smart Investment • Reliable Service",
      width / 2,
      y + 19,
      {
        align: "center",
      }
    );

    doc.setTextColor(...GREY);

    doc.setFontSize(6.5);

    doc.text(
      "Thank you for choosing solar energy.",
      width / 2,
      y + 25,
      {
        align: "center",
      }
    );

    drawFooter(doc);

    // =================================================
    // SAVE
    // =================================================

    const safeName =
      customerName
        .replace(
          /[^a-z0-9]/gi,
          "_"
        )
        .substring(
          0,
          40
        );

    doc.save(
      `Shiv_Shakti_Solar_Proposal_${safeName || "Customer"}.pdf`
    );

  } catch (error) {

    console.error(
      "Proposal PDF Error:",
      error
    );

    throw error;
  }
}