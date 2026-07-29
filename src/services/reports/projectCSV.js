export function exportProjectCSV(projects) {

  const headers = [
    "S.No",
    "Project No",
    "Customer",
    "Project Date",
    "Plant Size",
    "Status",
    "Total Amount",
    "Received",
    "Remaining",
  ];

  const rows = projects.map((project, index) => [

    index + 1,

    project.project_no || "",

    project.customers?.customer_name || "",

    project.project_date || "",

    project.project_size || "",

    project.status || "",

    project.total_amount || 0,

    project.received || 0,

    project.remaining || 0,

  ]);

  const csv = [headers, ...rows]
    .map(row =>
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const link = document.createElement("a");

  link.href = URL.createObjectURL(blob);

  link.download = "Project Report.csv";

  link.click();

}