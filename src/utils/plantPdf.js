import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { loadImage } from "./plantHelpers";

export async function downloadPlantCostingPDF({
  items,
  selectedSize,
  materialTotal,
  gstTotal,
  grandTotal,
}) {

  const doc = new jsPDF();
  
  const logo = await loadImage("/logo.png");
  const signature = await loadImage("/signature.png");

const pageWidth = doc.internal.pageSize.getWidth();

if (logo) {
  doc.addImage(
    logo,
    "PNG",
    14,
    10,
    22,
    22
  );
}

// Green Header Background
doc.setFillColor(22, 163, 74);
doc.rect(10, 10, pageWidth - 20, 30, "F");

// Logo
if (logo) {
  doc.addImage(logo, "PNG", 14, 13, 20, 20);
}

// Company Name
doc.setTextColor(255, 255, 255);
doc.setFont("helvetica", "bold");
doc.setFontSize(20);

doc.text(
  "SHIV SHAKTI SOLAR ENERGY",
  pageWidth / 2,
  20,
  { align: "center" }
);

// Address
doc.setFont("helvetica", "normal");
doc.setFontSize(10);

doc.text(
  "Nowgong, Dist. Chhatarpur (M.P.)",
  pageWidth / 2,
  27,
  { align: "center" }
);

// Report Name
doc.setFont("helvetica", "bold");
doc.setFontSize(14);

doc.text(
  "PLANT COSTING REPORT",
  pageWidth / 2,
  35,
  { align: "center" }
);

doc.setTextColor(0, 0, 0);
doc.setFontSize(11);

doc.text(`Plant Size : ${selectedSize}`,14,50);

doc.text(
`Date : ${new Date().toLocaleDateString("en-GB")}`,
pageWidth-14,
54,
  { align: "right" }
);

  

  
 autoTable(doc, {

 startY:58,

  head: [[
  "S.No.",
  "Item",
  "Qty",
  "Price",
  "CGST %",
  "SGST %",
  "Amount"
]],

body: [

  ...items.map((item, index) => [

    index + 1,

    item.item,

    `${item.qty} Nos`,

    `${Number(item.price || 0).toLocaleString("en-IN")}`,

    item.manual ? "-" : `${item.cgst}%`,

    item.manual ? "-" : `${item.sgst}%`,

    `${(
      Number(item.qty || 0) * Number(item.price || 0)
    ).toLocaleString("en-IN")}`

  ]),

  [
    "",
    "",
    "",
    "",
    "",
    "Total",
    `${materialTotal.toLocaleString("en-IN")}`
  ]

],
  theme: "grid",

  styles: {
  fontSize: 9,
  cellPadding: 2.5,
  lineColor: [180, 180, 180],
  lineWidth: 0.2,
  valign: "middle",
  halign: "center",
  textColor: [40, 40, 40]
},

  headStyles: {
  fillColor: [22, 163, 74],
  textColor: [255, 255, 255],
  fontStyle: "bold",
  fontSize: 10,
  halign: "center",
  valign: "middle"
},

  alternateRowStyles: {
  fillColor: [245, 252, 245]
},

  bodyStyles: {

    textColor: [0, 0, 0]

  },

  columnStyles: {

  0: {
    cellWidth: 18,
    halign: "center"
  },

  1: {
    cellWidth: 45,
    halign: "center"
  },

  2: {
    cellWidth: 18,
    halign: "center"
  },

  3: {
    cellWidth: 28,
    halign: "center"
  },

  4: {
    cellWidth: 20,
    halign: "center"
  },

  5: {
    cellWidth: 20,
    halign: "center"
  },

  6: {
    cellWidth: 30,
    halign: "center"
  }

},

didParseCell: function (data) {

  // Amount column
  if (
    data.section === "body" &&
    data.column.index === 6
  ) {
    data.cell.styles.fontStyle = "bold";
    data.cell.styles.textColor = [22, 120, 60];
  }

  // Total row
  if (
    data.section === "body" &&
    data.row.index === items.length
  ) {

    data.cell.styles.fillColor = [22, 163, 74];
    data.cell.styles.textColor = [255, 255, 255];
    data.cell.styles.fontStyle = "bold";

  }

},
  
});



  const finalY = doc.lastAutoTable.finalY + 12;

const signY = Math.min(finalY + 45, 250);

const boxX = 118;
const boxY = finalY;
const boxWidth = 82;

// Outer Border
doc.setDrawColor(22, 163, 74);
doc.setLineWidth(0.8);
doc.roundedRect(
  boxX,
  boxY,
  boxWidth,
  34,
  2,
  2
);

// Header
doc.setFillColor(22, 163, 74);
doc.roundedRect(
  boxX,
  boxY,
  boxWidth,
  8,
  2,
  2,
  "F"
);

doc.setFont("helvetica", "bold");
doc.setFontSize(12);
doc.setTextColor(255,255,255);

doc.text(
  "COST SUMMARY",
  boxX + boxWidth/2,
  boxY + 5.5,
  {
    align:"center"
  }
);

// Body
doc.setTextColor(0,0,0);
doc.setFontSize(10);
doc.setFont("helvetica","normal");

// Material
doc.text(
  "Material Cost",
  boxX + 4,
  boxY + 14
);

doc.text(
  `${materialTotal.toLocaleString("en-IN")}`,
  boxX + boxWidth - 4,
  boxY + 14,
  {
    align:"right"
  }
);

// GST
doc.text(
  "GST",
  boxX + 4,
  boxY + 21
);

doc.text(
  `${gstTotal.toLocaleString("en-IN")}`,
  boxX + boxWidth - 4,
  boxY + 21,
  {
    align:"right"
  }
);

// Divider
doc.setDrawColor(180);
doc.line(
  boxX + 2,
  boxY + 24,
  boxX + boxWidth - 2,
  boxY + 24
);

// Grand Total
doc.setFont("helvetica","bold");
doc.setFontSize(11);

doc.text(
  "Grand Total",
  boxX + 4,
  boxY + 31
);

doc.setTextColor(22,163,74);

doc.text(
  `${grandTotal.toLocaleString("en-IN")}`,
  boxX + boxWidth - 4,
  boxY + 31,
  {
    align:"right"
  }
);


// Divider line
doc.setDrawColor(180);
doc.line(10, signY - 5, pageWidth - 10, signY - 5);



// Prepared By
doc.setFont("helvetica", "bold");
doc.setFontSize(11);
doc.setTextColor(0);

doc.text(
  "Prepared By",
  18,
  signY
);

doc.setFont("helvetica", "normal");
doc.setFontSize(10);

doc.text(
  "Shiv Shakti Solar Energy",
  18,
  signY + 7
);

// Authorized Signatory
doc.setFont("helvetica", "bold");

doc.text(
  "Authorized Signatory",
  pageWidth - 18,
signY + 25,
  {
    align: "right"
  }
);

if (signature) {
  doc.addImage(
    signature,
    "PNG",
   pageWidth - 48,
signY + 5,
30,
15
  );
}

const pages = doc.internal.getNumberOfPages();

const generatedOn = new Date().toLocaleString("en-IN");

for (let i = 1; i <= pages; i++) {

  doc.setPage(i);

  // Green line
  doc.setDrawColor(22, 163, 74);
  doc.setLineWidth(0.5);

  doc.line(
    10,
    285,
    pageWidth - 10,
    285
  );

  // Company
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(22, 163, 74);

  doc.text(
    "Shiv Shakti Solar Energy",
    12,
    290
  );

  // Generated Time
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80);

  doc.text(
    `Generated: ${generatedOn}`,
    pageWidth / 2,
    290,
    {
      align: "center"
    }
  );

  // Page Number
  doc.text(
    `Page ${i} of ${pages}`,
    pageWidth - 12,
    290,
    {
      align: "right"
    }
  );

}
doc.save(`${selectedSize}-Plant-Costing.pdf`);

}