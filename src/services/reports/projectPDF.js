import {
  createReportPDF,
  drawTable,
  addFooter,
} from "./pdfTable";


export function exportProjectPDF(projects) {

  const doc = createReportPDF("Project Report");


  const columns = [
    { title: "S.No", width: 12 },
    { title: "Project No", width: 28 },
    { title: "Customer", width: 45 },
    { title: "Date", width: 25 },
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


  const rows = projects.map(
    (project, index) => [

      index + 1,

      project.project_no || "",

      project.customers?.customer_name || "",


      project.project_date
        ? new Date(project.project_date)
            .toLocaleDateString(
              "en-GB",
              {
                day: "2-digit",
                month: "short",
                year: "numeric",
              }
            )
        : "",


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


  const endY = drawTable(
    doc,
    columns,
    rows
  );


  // Summary

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(11);


  doc.text(
    `Total Projects : ${projects.length}`,
    10,
    endY + 12
  );


  const totalValue =
    projects.reduce(
      (sum, item) =>
        sum +
        Number(
          item.total_amount || 0
        ),
      0
    );


  doc.text(
    `Total Project Value : ${formatAmount(totalValue)}`,
    10,
    endY + 20
  );


  addFooter(doc);


  doc.save(
    "Project Report.pdf"
  );

}