import {
  createReportPDF,
  drawTable,
  addFooter,
} from "./pdfTable";


export function exportProjectPDF(projects = []) {

  // =====================================================
  // SORT PROJECTS BY PROJECT NUMBER
  // =====================================================

  projects = [...projects].sort((a, b) => {
    const numA = Number(
      String(a.project_no || "").replace(/\D/g, "")
    );

    const numB = Number(
      String(b.project_no || "").replace(/\D/g, "")
    );

    return numA - numB;
  });

  // =====================================================
  // CREATE PDF
  // =====================================================

  const doc = createReportPDF("Project Report");

  // =====================================================
  // NUMBER FORMAT
  // =====================================================

  const formatAmount = (value) =>
    Number(value || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  // =====================================================
  // TOTAL CALCULATIONS
  // =====================================================

  const totalProjectValue = projects.reduce(
    (sum, project) =>
      sum + Number(project.total_amount || 0),
    0
  );

  const totalReceived = projects.reduce(
    (sum, project) =>
      sum + Number(project.received || 0),
    0
  );

  const totalPending = projects.reduce(
    (sum, project) =>
      sum +
      (
        project.remaining !== undefined &&
        project.remaining !== null
          ? Number(project.remaining || 0)
          : Number(project.total_amount || 0) -
            Number(project.received || 0)
      ),
    0
  );

  // =====================================================
  // SUMMARY SECTION
  // =====================================================

  const summaryStartY = 45;

  const summaryColumns = [
    {
      title: "TOTAL PROJECT VALUE",
      value: `Rs. ${formatAmount(totalProjectValue)}`,
    },
    {
      title: "TOTAL RECEIVED",
      value: `Rs. ${formatAmount(totalReceived)}`,
    },
    {
      title: "TOTAL PENDING AMOUNT",
      value: `Rs. ${formatAmount(totalPending)}`,
    },
  ];

  const summaryWidth = 88;
  const summaryHeight = 24;
  const summaryGap = 8;
  const summaryStartX = 15;

  summaryColumns.forEach((item, index) => {

    const x =
      summaryStartX +
      index * (summaryWidth + summaryGap);

    // -----------------------------------------------
    // HEADER
    // -----------------------------------------------

    doc.setFillColor(30, 58, 138);

    doc.roundedRect(
      x,
      summaryStartY,
      summaryWidth,
      9,
      2,
      2,
      "F"
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);

    doc.text(
      item.title,
      x + summaryWidth / 2,
      summaryStartY + 6,
      {
        align: "center",
      }
    );

    // -----------------------------------------------
    // VALUE
    // -----------------------------------------------

    doc.setFillColor(245, 247, 250);

    doc.roundedRect(
      x,
      summaryStartY + 9,
      summaryWidth,
      15,
      2,
      2,
      "F"
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);

    doc.text(
      item.value,
      x + summaryWidth / 2,
      summaryStartY + 19,
      {
        align: "center",
      }
    );
  });

  // =====================================================
  // PROJECT TABLE
  // =====================================================

  const columns = [
    {
      title: "Project No",
      width: 35,
    },
    {
      title: "Total Cost",
      width: 40,
    },
    {
      title: "Received",
      width: 40,
    },
    {
      title: "Remaining",
      width: 40,
    },
    {
      title: "Status",
      width: 35,
    },
  ];

  // =====================================================
  // TABLE ROWS
  // =====================================================

  const rows = projects.map((project) => {

    const totalCost =
      Number(project.total_amount || 0);

    const received =
      Number(project.received || 0);

    const remaining =
      project.remaining !== undefined &&
      project.remaining !== null
        ? Number(project.remaining || 0)
        : totalCost - received;

    return [
      project.project_no || "",

      formatAmount(totalCost),

      formatAmount(received),

      formatAmount(remaining),

      project.status || "",
    ];
  });

  // =====================================================
  // DRAW TABLE
  // =====================================================

  const tableStartY =
    summaryStartY + summaryHeight + 12;

  const endY = drawTable(
    doc,
    columns,
    rows,
    tableStartY
  );

  // =====================================================
  // FOOTER
  // =====================================================

  addFooter(doc);

  // =====================================================
  // SAVE
  // =====================================================

  doc.save("Project Report.pdf");
}