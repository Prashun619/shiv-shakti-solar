import jsPDF from "jspdf";
import { applyPlugin } from "jspdf-autotable";

applyPlugin(jsPDF);

// =====================================================
// IMPORTANT
// =====================================================
// This connects jspdf-autotable 3.8.4 to jsPDF 2.5.2
// so we can safely use:
//
// doc.autoTable(...)
//
// DO NOT use:
// import { autoTable } from "jspdf-autotable"
// =====================================================

applyPlugin(jsPDF);


// =====================================================
// COLOURS
// =====================================================

const NAVY = [7, 59, 102];
const BLUE = [8, 120, 201];
const CYAN = [18, 184, 214];
const GREEN = [21, 148, 71];
const LIME = [114, 180, 60];
const YELLOW = [255, 176, 0];
const ORANGE = [244, 123, 32];
const PURPLE = [122, 76, 194];
const RED = [210, 65, 65];

const WHITE = [255, 255, 255];

const LIGHT_BLUE = [234, 246, 255];
const LIGHT_GREEN = [237, 249, 238];
const LIGHT_YELLOW = [255, 247, 223];
const LIGHT_ORANGE = [255, 240, 229];
const LIGHT_PURPLE = [243, 237, 255];
const LIGHT_GREY = [245, 247, 250];

const DARK = [31, 41, 55];
const GREY = [100, 116, 139];


// =====================================================
// SAFE VALUE
// =====================================================

function value(value, fallback = "-") {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return fallback;
  }

  return String(value);
}


// =====================================================
// DATE
// =====================================================

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

  if (Number.isNaN(d.getTime())) {
    return formatDate(new Date());
  }

  const day = String(d.getDate()).padStart(2, "0");

  const month = months[d.getMonth()];

  const year = d.getFullYear();

  return `${day}-${month}-${year}`;
}


// =====================================================
// QUOTATION NUMBER
// =====================================================

function generateQuotationNumber() {

  const year = new Date().getFullYear();

  const randomNumber =
    Math.floor(
      1000 + Math.random() * 9000
    );

  return `SSSE-${year}-${randomNumber}`;
}


// =====================================================
// LOGO LOADER
// =====================================================

async function loadImage(src) {

  return new Promise((resolve) => {

    const img = new Image();

    img.onload = () => resolve(img);

    img.onerror = () => resolve(null);

    img.src = src;
  });
}


// =====================================================
// HEADER
// =====================================================

async function drawHeader(
  doc,
  quotationNumber,
  date
) {

  const pageWidth =
    doc.internal.pageSize.getWidth();

  // ---------------------------------------------
  // TOP BANDS
  // ---------------------------------------------

  doc.setFillColor(...NAVY);

  doc.rect(
    0,
    0,
    pageWidth,
    8,
    "F"
  );

  doc.setFillColor(...BLUE);

  doc.rect(
    0,
    8,
    pageWidth,
    3,
    "F"
  );

  doc.setFillColor(...GREEN);

  doc.rect(
    0,
    11,
    pageWidth,
    2,
    "F"
  );


  // ---------------------------------------------
  // LOGO
  // ---------------------------------------------

  const logo =
    await loadImage("/logo.png");

  if (logo) {

    try {

      doc.addImage(
        logo,
        "PNG",
        15,
        18,
        25,
        25
      );

    } catch (error) {

      console.warn(
        "Logo could not be added:",
        error
      );

    }

  }


  // ---------------------------------------------
  // COMPANY NAME
  // ---------------------------------------------

  const companyX =
    logo ? 44 : 15;

  doc.setTextColor(...NAVY);

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(19);

  doc.text(
    "SHIV SHAKTI",
    companyX,
    27
  );


  doc.setTextColor(...GREEN);

  doc.setFontSize(10);

  doc.text(
    "SOLAR ENERGY",
    companyX,
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
    companyX,
    41
  );


  // ---------------------------------------------
  // QUOTATION BOX
  // ---------------------------------------------

  doc.setFillColor(...NAVY);

  doc.roundedRect(
    pageWidth - 77,
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

  doc.setFontSize(16);

  doc.text(
    "QUOTATION",
    pageWidth - 46,
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
    quotationNumber,
    pageWidth - 46,
    36,
    {
      align: "center",
    }
  );

  doc.text(
    date,
    pageWidth - 46,
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

  const pageWidth =
    doc.internal.pageSize.getWidth();

  const pageHeight =
    doc.internal.pageSize.getHeight();

  doc.setFillColor(...GREEN);

  doc.rect(
    0,
    pageHeight - 5,
    pageWidth,
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
    pageHeight - 8
  );


  doc.text(
    `Page ${doc.internal.getNumberOfPages()}`,
    pageWidth - 15,
    pageHeight - 8,
    {
      align: "right",
    }
  );
}


// =====================================================
// SECTION HEADER
// =====================================================

function sectionHeader(
  doc,
  title,
  y,
  color = BLUE
) {

  const pageWidth =
    doc.internal.pageSize.getWidth();

  doc.setFillColor(...color);

  doc.roundedRect(
    15,
    y,
    pageWidth - 30,
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
// SMALL INFO CARD
// =====================================================

function infoCard(
  doc,
  x,
  y,
  width,
  height,
  title,
  main,
  bgColor,
  mainColor = NAVY
) {

  doc.setFillColor(...bgColor);

  doc.roundedRect(
    x,
    y,
    width,
    height,
    3,
    3,
    "F"
  );


  doc.setTextColor(...GREY);

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(6.5);

  doc.text(
    title,
    x + width / 2,
    y + 9,
    {
      align: "center",
    }
  );


  doc.setTextColor(...mainColor);

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(12);

  const text =
    value(main);

  doc.text(
    text,
    x + width / 2,
    y + 21,
    {
      align: "center",
      maxWidth: width - 8,
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

  const pageWidth =
    doc.internal.pageSize.getWidth();

  doc.setFillColor(...LIGHT_BLUE);

  doc.roundedRect(
    15,
    53,
    pageWidth - 30,
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
// MONEY FORMAT
// =====================================================

function money(amount) {

  const number =
    Number(amount);

  if (
    Number.isNaN(number) ||
    number === 0
  ) {
    return "₹ -";
  }

  return `₹ ${number.toLocaleString(
    "en-IN",
    {
      maximumFractionDigits: 0,
    }
  )}`;
}


// =====================================================
// MAIN FUNCTION
// =====================================================

export async function generateQuotationPDF(
  quotation = {}
) {

  try {

    // =================================================
    // NORMALIZE DATA
    // =================================================

    const data = {

      customerName:
        value(
          quotation.customerName,
          "Customer"
        ),

      mobile:
        value(
          quotation.mobile
        ),

      email:
        value(
          quotation.email
        ),

      address:
        value(
          quotation.address
        ),

      location:
        value(
          quotation.location
        ),

      plantSize:
        value(
          quotation.plantSize,
          "3 KW"
        ),

      panelCompany:
        value(
          quotation.panelCompany,
          "Waaree"
        ),

      panelCapacity:
        value(
          quotation.panelCapacity,
          "605 Wp"
        ),

      panelQuantity:
        value(
          quotation.panelQuantity
        ),

      inverter:
        value(
          quotation.inverter,
          "Waaree / Luminous / Polycab Inverter"
        ),

      structure:
        value(
          quotation.structure,
          "JSW / APL APOLLO / TATA"
        ),

      wire:
        value(
          quotation.wire,
          "Waacab / Polycab"
        ),

      discom:
        value(
          quotation.discom,
          "Applicable DISCOM"
        ),

      price:
        Number(
          quotation.price || 0
        ),

      tariff:
        Number(
          quotation.tariff || 0
        ),

      annualGeneration:
        Number(
          quotation.annualGeneration || 0
        ),

      installation:
        value(
          quotation.installation,
          "Complete installation & commissioning"
        ),

      paymentTerms:
        value(
          quotation.paymentTerms,
          "As mutually agreed"
        ),

    };


    // =================================================
    // PDF
    // =================================================

    const doc =
      new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });


    const pageWidth =
      doc.internal.pageSize.getWidth();

    const pageHeight =
      doc.internal.pageSize.getHeight();


    const quotationNumber =
      generateQuotationNumber();

    const date =
      formatDate();


    // =================================================
    // PAGE 1
    // =================================================

    await drawHeader(
      doc,
      quotationNumber,
      date
    );


    pageTitle(
      doc,
      `${data.plantSize} ON-GRID SOLAR`,
      "Professional Rooftop Solar Power System Proposal"
    );


    let y = 88;


    // -------------------------------------------------
    // CUSTOMER DETAILS
    // -------------------------------------------------

    sectionHeader(
      doc,
      "CUSTOMER & PROJECT DETAILS",
      y,
      GREEN
    );


    y += 14;


    // Customer card

    doc.setFillColor(...LIGHT_BLUE);

    doc.roundedRect(
      15,
      y,
      57,
      52,
      3,
      3,
      "F"
    );


    doc.setTextColor(...NAVY);

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(7);

    doc.text(
      "PREPARED FOR",
      20,
      y + 8
    );


    doc.setFontSize(10);

    doc.text(
      data.customerName,
      20,
      y + 17,
      {
        maxWidth: 47,
      }
    );


    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(7);

    doc.text(
      `Mobile: ${data.mobile}`,
      20,
      y + 28
    );


    if (data.email !== "-") {

      doc.text(
        `Email: ${data.email}`,
        20,
        y + 36,
        {
          maxWidth: 47,
        }
      );

    }


    // Project card

    doc.setFillColor(...LIGHT_GREEN);

    doc.roundedRect(
      76,
      y,
      57,
      52,
      3,
      3,
      "F"
    );


    doc.setTextColor(...GREEN);

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(7);

    doc.text(
      "PROJECT DETAILS",
      81,
      y + 8
    );


    doc.setTextColor(...DARK);

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(7.5);

    doc.text(
      `Capacity: ${data.plantSize}`,
      81,
      y + 18
    );

    doc.text(
      "Type: On-Grid Rooftop",
      81,
      y + 27
    );

    doc.text(
      `Panel: ${data.panelCompany}`,
      81,
      y + 36
    );

    doc.text(
      `Capacity: ${data.panelCapacity}`,
      81,
      y + 45
    );


    // Site card

    doc.setFillColor(...LIGHT_YELLOW);

    doc.roundedRect(
      137,
      y,
      58,
      52,
      3,
      3,
      "F"
    );


    doc.setTextColor(...ORANGE);

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(7);

    doc.text(
      "INSTALLATION SITE",
      142,
      y + 8
    );


    doc.setTextColor(...DARK);

    doc.setFontSize(8);

    doc.text(
      data.location,
      142,
      y + 18,
      {
        maxWidth: 48,
      }
    );


    doc.setFontSize(7);

    const addressLines =
      doc.splitTextToSize(
        data.address,
        48
      );


    doc.text(
      addressLines,
      142,
      y + 27
    );


    y += 63;


    // -------------------------------------------------
    // SYSTEM HIGHLIGHTS
    // -------------------------------------------------

    sectionHeader(
      doc,
      "SYSTEM HIGHLIGHTS",
      y,
      BLUE
    );


    y += 14;


    infoCard(
      doc,
      15,
      y,
      42,
      32,
      "PLANT SIZE",
      data.plantSize,
      LIGHT_GREEN,
      GREEN
    );


    infoCard(
      doc,
      62,
      y,
      42,
      32,
      "PANEL BRAND",
      data.panelCompany,
      LIGHT_BLUE,
      BLUE
    );


    infoCard(
      doc,
      109,
      y,
      42,
      32,
      "PANEL",
      data.panelCapacity,
      LIGHT_ORANGE,
      ORANGE
    );


    infoCard(
      doc,
      156,
      y,
      39,
      32,
      "DISCOM",
      data.discom,
      LIGHT_PURPLE,
      PURPLE
    );


    y += 43;


    // -------------------------------------------------
    // SYSTEM CONFIGURATION
    // -------------------------------------------------

    sectionHeader(
      doc,
      "SYSTEM CONFIGURATION",
      y,
      NAVY
    );


    y += 13;


    doc.autoTable({

      startY: y,

      head: [
        [
          "COMPONENT",
          "PROPOSED SPECIFICATION",
        ],
      ],

      body: [

        [
          "Solar PV Modules",
          `${data.panelCompany} ${data.panelCapacity}`,
        ],

        [
          "Plant Capacity",
          data.plantSize,
        ],

        [
          "Solar Inverter",
          data.inverter,
        ],

        [
          "Mounting Structure",
          data.structure,
        ],

        [
          "Solar Wire",
          data.wire,
        ],

        [
          "Installation",
          data.installation,
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
        cellPadding: 3,
      },

      alternateRowStyles: {
        fillColor: LIGHT_GREY,
      },

      columnStyles: {

        0: {
          cellWidth: 60,
          fontStyle: "bold",
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


    drawFooter(doc);


    // =================================================
    // PAGE 2
    // =================================================

    doc.addPage();


    await drawHeader(
      doc,
      quotationNumber,
      date
    );


    pageTitle(
      doc,
      "SYSTEM COST & SAVINGS",
      "Commercial overview of the proposed solar system"
    );


    y = 90;


    sectionHeader(
      doc,
      "SYSTEM COST SUMMARY",
      y,
      ORANGE
    );


    y += 14;


    // Pricing card

    doc.setFillColor(...LIGHT_ORANGE);

    doc.roundedRect(
      15,
      y,
      pageWidth - 30,
      34,
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
      "PROPOSED SYSTEM VALUE",
      22,
      y + 10
    );


    doc.setTextColor(...NAVY);

    doc.setFontSize(20);

    doc.text(
      data.price > 0
        ? money(data.price)
        : "To be finalized",
      22,
      y + 24
    );


    if (data.price <= 0) {

      doc.setTextColor(...GREY);

      doc.setFont(
        "helvetica",
        "normal"
      );

      doc.setFontSize(7);

      doc.text(
        "Commercial pricing can be entered from the quotation form.",
        115,
        y + 20
      );

    }


    y += 45;


    sectionHeader(
      doc,
      "ESTIMATED GENERATION & SAVINGS",
      y,
      GREEN
    );


    y += 14;


    let annualSavings = 0;

    if (
      data.annualGeneration > 0 &&
      data.tariff > 0
    ) {

      annualSavings =
        data.annualGeneration *
        data.tariff;

    }


    let payback = 0;

    if (
      data.price > 0 &&
      annualSavings > 0
    ) {

      payback =
        data.price /
        annualSavings;

    }


    doc.autoTable({

      startY: y,

      head: [
        [
          "PARAMETER",
          "VALUE",
          "REMARK",
        ],
      ],

      body: [

        [
          "Plant Capacity",
          data.plantSize,
          "As selected",
        ],

        [
          "Expected Annual Generation",
          data.annualGeneration > 0
            ? `${data.annualGeneration.toLocaleString("en-IN")} kWh`
            : "Site dependent",
          "Subject to irradiation and site conditions",
        ],

        [
          "Electricity Tariff",
          data.tariff > 0
            ? `₹ ${data.tariff}/unit`
            : "To be entered",
          "Actual tariff may vary",
        ],

        [
          "Estimated Annual Savings",
          annualSavings > 0
            ? money(annualSavings)
            : "Site dependent",
          "Indicative",
        ],

        [
          "Estimated Payback",
          payback > 0
            ? `${payback.toFixed(1)} Years`
            : "Site dependent",
          "Indicative",
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
        textColor: DARK,
        fontSize: 8,
        cellPadding: 3,
      },

      alternateRowStyles: {
        fillColor: LIGHT_GREEN,
      },

      columnStyles: {

        0: {
          cellWidth: 65,
          fontStyle: "bold",
        },

        1: {
          cellWidth: 45,
          halign: "center",
        },

        2: {
          cellWidth: 60,
        },

      },

      margin: {
        left: 15,
        right: 15,
      },

    });


    y =
      doc.lastAutoTable.finalY + 15;


    sectionHeader(
      doc,
      "IMPORTANT",
      y,
      YELLOW
    );


    y += 13;


    doc.setFillColor(...LIGHT_YELLOW);

    doc.roundedRect(
      15,
      y,
      pageWidth - 30,
      38,
      3,
      3,
      "F"
    );


    doc.setTextColor(...DARK);

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(7.5);


    const commercialNote =
      "Generation, savings and payback figures are indicative estimates. Actual performance depends on solar irradiation, shading, roof orientation, system losses, electricity tariff, DISCOM regulations and operating conditions.";


    doc.text(
      doc.splitTextToSize(
        commercialNote,
        pageWidth - 48
      ),
      22,
      y + 11
    );


    drawFooter(doc);


    // =================================================
    // PAGE 3
    // =================================================

    doc.addPage();


    await drawHeader(
      doc,
      quotationNumber,
      date
    );


    pageTitle(
      doc,
      "SOLAR GENERATION",
      "Expected performance and environmental benefits"
    );


    y = 90;


    sectionHeader(
      doc,
      "EXPECTED SOLAR GENERATION",
      y,
      BLUE
    );


    y += 14;


    const monthlyGeneration = [
      ["January", "Site dependent"],
      ["February", "Site dependent"],
      ["March", "Site dependent"],
      ["April", "Site dependent"],
      ["May", "Site dependent"],
      ["June", "Site dependent"],
      ["July", "Site dependent"],
      ["August", "Site dependent"],
      ["September", "Site dependent"],
      ["October", "Site dependent"],
      ["November", "Site dependent"],
      ["December", "Site dependent"],
    ];


    doc.autoTable({

      startY: y,

      head: [
        [
          "MONTH",
          "EXPECTED GENERATION",
        ],
      ],

      body: monthlyGeneration,

      theme: "grid",

      headStyles: {
        fillColor: BLUE,
        textColor: WHITE,
        fontStyle: "bold",
        fontSize: 8,
      },

      bodyStyles: {
        fontSize: 7.5,
        textColor: DARK,
      },

      alternateRowStyles: {
        fillColor: LIGHT_BLUE,
      },

      columnStyles: {

        0: {
          cellWidth: 75,
        },

        1: {
          cellWidth: 95,
          halign: "center",
        },

      },

      margin: {
        left: 15,
        right: 15,
      },

    });


    y =
      doc.lastAutoTable.finalY + 12;


    sectionHeader(
      doc,
      "ENVIRONMENTAL IMPACT",
      y,
      GREEN
    );


    y += 14;


    doc.autoTable({

      startY: y,

      head: [
        [
          "BENEFIT",
          "DESCRIPTION",
        ],
      ],

      body: [

        [
          "Clean Energy",
          "Solar energy reduces dependence on conventional grid electricity.",
        ],

        [
          "Lower Carbon Footprint",
          "Renewable generation can help reduce carbon emissions.",
        ],

        [
          "Energy Independence",
          "Generate electricity at the customer's premises.",
        ],

        [
          "Long-Term Savings",
          "Solar can reduce electricity expenses over the system life.",
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
        textColor: DARK,
        fontSize: 8,
      },

      alternateRowStyles: {
        fillColor: LIGHT_GREEN,
      },

      columnStyles: {

        0: {
          cellWidth: 55,
          fontStyle: "bold",
        },

        1: {
          cellWidth: 115,
        },

      },

      margin: {
        left: 15,
        right: 15,
      },

    });


    drawFooter(doc);


    // =================================================
    // PAGE 4
    // =================================================

    doc.addPage();


    await drawHeader(
      doc,
      quotationNumber,
      date
    );


    pageTitle(
      doc,
      "SYSTEM COMPONENTS",
      "Proposed equipment and warranty information"
    );


    y = 90;


    sectionHeader(
      doc,
      "PROPOSED EQUIPMENT",
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
          "MAKE / SPECIFICATION",
          "STATUS",
        ],
      ],

      body: [

        [
          "1",
          "Solar PV Modules",
          `${data.panelCompany} ${data.panelCapacity}`,
          "Proposed",
        ],

        [
          "2",
          "Solar Inverter",
          data.inverter,
          "Proposed",
        ],

        [
          "3",
          "Mounting Structure",
          data.structure,
          "Proposed",
        ],

        [
          "4",
          "Solar Wire",
          data.wire,
          "Proposed",
        ],

        [
          "5",
          "Protection & BOS",
          "As per approved system design",
          "Included",
        ],

        [
          "6",
          "Installation",
          data.installation,
          "Included",
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
        valign: "middle",
      },

      alternateRowStyles: {
        fillColor: LIGHT_BLUE,
      },

      columnStyles: {

        0: {
          cellWidth: 10,
          halign: "center",
        },

        1: {
          cellWidth: 42,
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
      doc.lastAutoTable.finalY + 15;


    sectionHeader(
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
          "COMPONENT",
          "WARRANTY",
          "DESCRIPTION",
        ],
      ],

      body: [

        [
          "Solar Modules",
          "As per OEM",
          "Product and performance warranty as applicable.",
        ],

        [
          "Inverter",
          "As per OEM",
          "Manufacturer warranty applies.",
        ],

        [
          "Mounting Structure",
          "As applicable",
          "Subject to material and installation conditions.",
        ],

        [
          "BOS",
          "As applicable",
          "As specified in final approved quotation.",
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
        textColor: DARK,
        fontSize: 8,
      },

      alternateRowStyles: {
        fillColor: LIGHT_GREEN,
      },

      columnStyles: {

        0: {
          cellWidth: 55,
          fontStyle: "bold",
        },

        1: {
          cellWidth: 35,
          halign: "center",
        },

        2: {
          cellWidth: 80,
        },

      },

      margin: {
        left: 15,
        right: 15,
      },

    });


    y =
      doc.lastAutoTable.finalY + 15;


    sectionHeader(
      doc,
      "WHAT IS INCLUDED",
      y,
      ORANGE
    );


    y += 14;


    const included = [

      [
        "✓",
        "SUPPLY",
        "Solar modules, inverter, structure and specified BOS items.",
      ],

      [
        "✓",
        "INSTALLATION",
        "Complete installation, testing and commissioning.",
      ],

      [
        "✓",
        "DOCUMENTATION",
        "Project documentation as applicable.",
      ],

      [
        "✓",
        "CUSTOMER GUIDANCE",
        "Basic system operation guidance after commissioning.",
      ],

    ];


    doc.autoTable({

      startY: y,

      body: included,

      theme: "grid",

      bodyStyles: {
        textColor: DARK,
        fontSize: 7.5,
      },

      columnStyles: {

        0: {
          cellWidth: 12,
          halign: "center",
          fontStyle: "bold",
        },

        1: {
          cellWidth: 40,
          fontStyle: "bold",
        },

        2: {
          cellWidth: 118,
        },

      },

      margin: {
        left: 15,
        right: 15,
      },

    });


    drawFooter(doc);


    // =================================================
    // PAGE 5
    // =================================================

    doc.addPage();


    await drawHeader(
      doc,
      quotationNumber,
      date
    );


    pageTitle(
      doc,
      "COMMERCIAL TERMS",
      "Payment conditions and important project terms"
    );


    y = 90;


    sectionHeader(
      doc,
      "PAYMENT TERMS",
      y,
      ORANGE
    );


    y += 14;


    doc.setFillColor(...LIGHT_ORANGE);

    doc.roundedRect(
      15,
      y,
      pageWidth - 30,
      35,
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


    doc.text(
      data.paymentTerms,
      22,
      y + 13,
      {
        maxWidth: pageWidth - 45,
      }
    );


    y += 48;


    sectionHeader(
      doc,
      "TERMS & CONDITIONS",
      y,
      NAVY
    );


    y += 14;


    const terms = [

      "Prices and commercial terms are subject to the final approved quotation.",

      "Final equipment selection is subject to site survey and product availability.",

      "Any work outside the agreed scope will be charged separately where applicable.",

      "Customer shall provide suitable access and installation conditions.",

      "Generation estimates may vary depending on site conditions, irradiation and system losses.",

      "Warranty shall be governed by the respective manufacturer's warranty terms.",

      "Electrical approvals, net metering and DISCOM procedures are subject to applicable regulations.",

      "The final system configuration may be modified after technical site assessment.",

    ];


    terms.forEach(
      (term, index) => {

        doc.setTextColor(...DARK);

        doc.setFont(
          "helvetica",
          "normal"
        );

        doc.setFontSize(7.5);


        doc.text(
          `${index + 1}.`,
          19,
          y
        );


        const lines =
          doc.splitTextToSize(
            term,
            162
          );


        doc.text(
          lines,
          27,
          y
        );


        y +=
          7 +
          (lines.length - 1) * 3;

      }
    );


    y += 8;


    sectionHeader(
      doc,
      "CUSTOMER RESPONSIBILITY",
      y,
      PURPLE
    );


    y += 14;


    doc.setFillColor(...LIGHT_PURPLE);

    doc.roundedRect(
      15,
      y,
      pageWidth - 30,
      35,
      3,
      3,
      "F"
    );


    doc.setTextColor(...DARK);

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(7.5);


    const responsibility =
      "The customer shall provide safe access to the installation site, required electrical information, suitable roof/access conditions and any documents required for applicable approvals.";


    doc.text(
      doc.splitTextToSize(
        responsibility,
        pageWidth - 48
      ),
      22,
      y + 11
    );


    drawFooter(doc);


    // =================================================
    // PAGE 6
    // =================================================

    doc.addPage();


    await drawHeader(
      doc,
      quotationNumber,
      date
    );


    pageTitle(
      doc,
      "CUSTOMER ACCEPTANCE",
      "Confirmation of proposed system configuration"
    );


    y = 90;


    sectionHeader(
      doc,
      "SYSTEM SUMMARY",
      y,
      BLUE
    );


    y += 14;


    doc.autoTable({

      startY: y,

      body: [

        [
          "Customer",
          data.customerName,
        ],

        [
          "Mobile",
          data.mobile,
        ],

        [
          "Plant Size",
          data.plantSize,
        ],

        [
          "Panel",
          `${data.panelCompany} ${data.panelCapacity}`,
        ],

        [
          "Inverter",
          data.inverter,
        ],

        [
          "Structure",
          data.structure,
        ],

        [
          "Wire",
          data.wire,
        ],

        [
          "Location",
          data.location,
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
          cellWidth: 55,
          fontStyle: "bold",
          fillColor: LIGHT_BLUE,
        },

        1: {
          cellWidth: 115,
        },

      },

      margin: {
        left: 15,
        right: 15,
      },

    });


    y =
      doc.lastAutoTable.finalY + 15;


    sectionHeader(
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
      pageWidth - 30,
      38,
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
      "I/We have reviewed the above quotation, system details, specifications and terms. I/We accept the proposed system configuration subject to the final agreed commercial terms.";


    doc.text(
      doc.splitTextToSize(
        declaration,
        pageWidth - 48
      ),
      22,
      y + 12
    );


    y += 50;


    sectionHeader(
      doc,
      "SIGNATURE",
      y,
      PURPLE
    );


    y += 15;


    // Customer box

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


    // Company box

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
      pageWidth - 30,
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
      pageWidth / 2,
      y + 11,
      {
        align: "center",
      }
    );


    doc.setTextColor(...GREEN);

    doc.setFontSize(8);

    doc.text(
      "Clean Energy • Smart Investment • Reliable Service",
      pageWidth / 2,
      y + 19,
      {
        align: "center",
      }
    );


    doc.setTextColor(...GREY);

    doc.setFontSize(6.5);

    doc.text(
      "Thank you for choosing solar energy.",
      pageWidth / 2,
      y + 25,
      {
        align: "center",
      }
    );


    drawFooter(doc);


    // =================================================
    // SAVE PDF
    // =================================================

    const safeCustomerName =
      data.customerName
        .replace(
          /[^a-z0-9]/gi,
          "_"
        )
        .substring(
          0,
          40
        );


    doc.save(
      `Shiv_Shakti_Solar_Quotation_${safeCustomerName || "Customer"}.pdf`
    );

  } catch (error) {

    console.error(
      "Quotation PDF Error:",
      error
    );

    throw error;
  }
}