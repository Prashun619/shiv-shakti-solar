import jsPDF from "jspdf";


export function createReportPDF(title) {

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });


  const pageWidth = doc.internal.pageSize.getWidth();


  // Header background
  doc.setFillColor(15, 23, 42);
  doc.rect(
    0,
    0,
    pageWidth,
    32,
    "F"
  );


  // Logo
const logo = "/logo.png";

const img = new Image();

img.src = logo;

doc.addImage(
  img,
  "PNG",
  12,
  5,
  22,
  22
);



  // Company Name

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(21);

  doc.setTextColor(
    255,
    255,
    255
  );


  doc.text(
    "Shiv Shakti Solar Energy",
    pageWidth / 2,
    14,
    {
      align: "center",
    }
  );



  // Report Title

  doc.setFontSize(13);

  doc.setFont(
    "helvetica",
    "normal"
  );


  doc.text(
    title,
    pageWidth / 2,
    23,
    {
      align: "center",
    }
  );



  // Date

  doc.setTextColor(
    0,
    0,
    0
  );


  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.setFontSize(9);


  const today =
    new Date().toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );


  const time =
    new Date().toLocaleTimeString(
      "en-GB",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );


  doc.text(
    `Generated : ${today}   ${time}`,
    14,
    42
  );



  doc.setFont(
    "helvetica",
    "bold"
  );


  doc.text(
    "Confidential Business Report",
    pageWidth - 14,
    42,
    {
      align: "right",
    }
  );


  return doc;
}

export function drawTable(doc, columns, rows, startY = 48) {

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const totalTableWidth = columns.reduce(
  (sum, col) => sum + col.width,
  0
);

const margin =
  (pageWidth - totalTableWidth) / 2;
  const rowHeight = 9;

  let y = startY;

  // ---------- Header ----------
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.2);

  let x = margin;

  columns.forEach((column) => {

    doc.setFillColor(14, 116, 144);

    doc.rect(
      x,
      y,
      column.width,
      rowHeight,
      "FD"
    );

    doc.setTextColor(255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);

    doc.text(
  column.title,
  x + column.width / 2,
  y + rowHeight / 2 + 1,
  {
    align: "center",
    baseline: "middle",
  }
);

    x += column.width;

  });

  y += rowHeight;

  // ---------- Rows ----------

  rows.forEach((row, rowIndex) => {

    // Automatic Page Break
    if (y > pageHeight - 18) {

      doc.addPage();

      y = 20;

      x = margin;

      columns.forEach((column) => {

        doc.setFillColor(14, 116, 144);

        doc.rect(
          x,
          y,
          column.width,
          rowHeight,
          "FD"
        );

        doc.setTextColor(255);

        doc.setFont("helvetica", "bold");

        doc.text(
          column.title,
          x + column.width / 2,
          y + 5,
          {
            align: "center",
          }
        );

        x += column.width;

      });

      y += rowHeight;

    }

    x = margin;

    

   row.forEach((value, index) => {

  // Thin black border
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.2);

  doc.rect(
    x,
    y,
    columns[index].width,
    rowHeight
  );

  // Black text
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  doc.text(
  String(value ?? ""),
  x + columns[index].width / 2,
  y + rowHeight / 2 + 1,
  {
    align: "center",
    baseline: "middle",
  }
);

  x += columns[index].width;

});

    y += rowHeight;

  });

  return y;

}

export function addFooter(doc) {

  const pageCount = doc.getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {

    doc.setPage(i);

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Footer line
    doc.setDrawColor(180);
    doc.setLineWidth(0.2);
    doc.line(10, pageHeight - 12, pageWidth - 10, pageHeight - 12);

    // Left Footer
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100);

    doc.text(
      "Shiv Shakti Solar Energy ERP",
      10,
      pageHeight - 6
    );

    // Right Footer
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth - 10,
      pageHeight - 6,
      {
        align: "right",
      }
    );

  }

}