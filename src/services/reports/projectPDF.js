import {
  createReportPDF,
  drawTable,
  addFooter,
} from "./pdfTable";


export function exportProjectPDF(projects) {

  projects = [...projects].sort(
    (a, b) =>
      Number(a.project_no.replace(/\D/g, "")) -
      Number(b.project_no.replace(/\D/g, ""))
  );

  const doc = createReportPDF("Project Report");


  const columns = [
    { title: "S.No", width: 12 },
    { title: "Project No", width: 28 },
    { title: "Customer", width: 45 },
    { title: "Size", width: 20 },
    { title: "Status", width: 25 },
    { title: "Total", width: 30 },
    { title: "Received", width: 30 },
    { title: "Balance", width: 30 },
  ];


  const formatAmount = (value) =>
    Number(value || 0).toLocaleString(
      "en-US",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );

    

const totalValue = projects.reduce(
  (sum, item) => sum + Number(item.total_amount || 0),
  0
);

const totalReceived = projects.reduce(
  (sum, item) => sum + Number(item.received || 0),
  0
);

const totalBalance = projects.reduce(
  (sum, item) => sum + Number(item.remaining || 0),
  0
);

  const rows = projects.map(
    (project, index) => [

      index + 1,

      project.project_no || "",

      project.customers?.customer_name || "",


      project.project_size
        ? `${project.project_size} kW`
        : "",


      project.status || "",


      formatAmount(
        project.total_amount
      ),


      formatAmount(
        project.received
      ),


      formatAmount(
        project.remaining
      ),

    ]
  );


// ===============================
// PROJECT SUMMARY CARDS
// ===============================

let startX = 10;
let startY = 48;

const cards = [
  {
    title: "Projects",
    value: String(projects.length),
    color: [37, 99, 235], // Blue
  },
  {
    title: "Project Value",
    value: `Rs. ${formatAmount(totalValue)}`,
    color: [22, 163, 74], // Green
  },
  {
    title: "Received",
    value: `Rs. ${formatAmount(totalReceived)}`,
    color: [147, 51, 234], // Purple
  },
  {
    title: "Balance",
    value: `Rs. ${formatAmount(totalBalance)}`,
    color: [220, 38, 38], // Red
  },
];

cards.forEach((card, index) => {

  const x = startX + index * 68;
  const y = startY;

  // Card Background
  doc.setFillColor(...card.color);
  doc.roundedRect(
    x,
    y,
    62,
    22,
    2,
    2,
    "F"
  );

  // Title
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(255,255,255);

  doc.text(
    card.title,
    x + 31,
    y + 7,
    {
      align: "center",
    }
  );

  // Value
  doc.setFont("helvetica","bold");
  doc.setFontSize(13);

  doc.text(
    card.value,
    x + 31,
    y + 16,
    {
      align: "center",
    }
  );

});

const summaryEndY = startY + 24;

// ===============================
// Project Table
// ===============================

const endY = drawTable(
  doc,
  columns,
  rows,
  summaryEndY + 6
);

addFooter(doc);

doc.save("Project Report.pdf");

}