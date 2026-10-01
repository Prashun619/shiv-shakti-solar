import jsPDF from "jspdf";

// ==========================================================
// CREATE REPORT PDF
// ==========================================================

export async function createReportPDF(title) {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth =
    doc.internal.pageSize.getWidth();

  // ==========================================================
  // HEADER BACKGROUND
  // ==========================================================

  doc.setFillColor(
    15,
    23,
    42
  );

  doc.rect(
    0,
    0,
    pageWidth,
    32,
    "F"
  );

  // ==========================================================
  // LOAD LOGO BEFORE ADDING IT
  // ==========================================================

  try {
    const logoData =
      await new Promise(
        (resolve, reject) => {
          const img =
            new Image();

          img.onload = () => {
            const canvas =
              document.createElement(
                "canvas"
              );

            canvas.width =
              img.naturalWidth ||
              img.width;

            canvas.height =
              img.naturalHeight ||
              img.height;

            const ctx =
              canvas.getContext(
                "2d"
              );

            ctx.drawImage(
              img,
              0,
              0
            );

            resolve(
              canvas.toDataURL(
                "image/png"
              )
            );
          };

          img.onerror = () => {
            reject(
              new Error(
                "Unable to load company logo."
              )
            );
          };

          img.src =
            "/logo.png";
        }
      );

    doc.addImage(
      logoData,
      "PNG",
      12,
      5,
      22,
      22
    );
  } catch (error) {
    console.error(
      "PDF LOGO ERROR:",
      error
    );
  }

  // ==========================================================
  // COMPANY NAME
  // ==========================================================

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(
    21
  );

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

  // ==========================================================
  // REPORT TITLE
  // ==========================================================

  doc.setFontSize(
    13
  );

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

  // ==========================================================
  // DATE
  // ==========================================================

  doc.setTextColor(
    0,
    0,
    0
  );

  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.setFontSize(
    9
  );

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

  // ==========================================================
  // CONFIDENTIAL TEXT
  // ==========================================================

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

// ==========================================================
// DRAW TABLE
// ==========================================================

export function drawTable(
  doc,
  columns,
  rows,
  startYOrOptions = 48,
  rowHeight = 4.5
) {
  let startY = 48;

  let headerFillColor = [
    14,
    116,
    144,
  ];

  let headerTextColor = [
    255,
    255,
    255,
  ];

  let marginLeft = 10;


  // =====================================================
  // OPTIONS
  // =====================================================

  if (
    typeof startYOrOptions === "object" &&
    startYOrOptions !== null
  ) {
    startY =
      startYOrOptions.startY ?? 48;

    rowHeight =
      startYOrOptions.rowHeight ?? 4.5;

    headerFillColor =
      startYOrOptions.headerFillColor ??
      [14, 116, 144];

    headerTextColor =
      startYOrOptions.headerTextColor ??
      [255, 255, 255];

    marginLeft =
      startYOrOptions.marginLeft ?? 10;
  } else {
    startY =
      startYOrOptions ?? 48;
  }


  const pageHeight =
    doc.internal.pageSize.getHeight();

  const margin =
    marginLeft;

  let y = startY;


  // =====================================================
  // DRAW HEADER
  // =====================================================

  let x = margin;

  columns.forEach(
    (column) => {
      doc.setFillColor(
        ...headerFillColor
      );

      doc.setDrawColor(
        0,
        0,
        0
      );

      doc.setLineWidth(
        0.25
      );

      doc.rect(
        x,
        y,
        column.width,
        rowHeight,
        "FD"
      );

      doc.setTextColor(
        ...headerTextColor
      );

      doc.setFont(
        "helvetica",
        "bold"
      );

      doc.setFontSize(7);

      doc.text(
        String(
          column.title ?? ""
        ),
        x + column.width / 2,
        y + rowHeight / 2,
        {
          align: "center",
          baseline: "middle",
        }
      );

      x += column.width;
    }
  );

  y += rowHeight;


  // =====================================================
  // DATA ROWS
  // =====================================================

  rows.forEach(
    (row) => {

      // -------------------------------------------------
      // PAGE BREAK
      // -------------------------------------------------

      if (
        y >
        pageHeight - 16
      ) {
        doc.addPage();

        y = 15;


        // -----------------------------------------------
        // REPEAT HEADER
        // -----------------------------------------------

        let headerX =
          margin;

        columns.forEach(
          (column) => {
            doc.setFillColor(
              ...headerFillColor
            );

            doc.setDrawColor(
              0,
              0,
              0
            );

            doc.setLineWidth(
              0.25
            );

            doc.rect(
              headerX,
              y,
              column.width,
              rowHeight,
              "FD"
            );

            doc.setTextColor(
              ...headerTextColor
            );

            doc.setFont(
              "helvetica",
              "bold"
            );

            doc.setFontSize(7);

            doc.text(
              String(
                column.title ?? ""
              ),
              headerX +
                column.width / 2,
              y +
                rowHeight / 2,
              {
                align: "center",
                baseline: "middle",
              }
            );

            headerX +=
              column.width;
          }
        );

        y += rowHeight;
      }


      // -------------------------------------------------
      // DATA CELLS
      // -------------------------------------------------

      x = margin;

      row.forEach(
        (value, index) => {
          const column =
            columns[index];

          if (!column) {
            return;
          }


          doc.setDrawColor(
            0,
            0,
            0
          );

          doc.setLineWidth(
            0.15
          );

          doc.rect(
            x,
            y,
            column.width,
            rowHeight
          );


          doc.setFont(
            "helvetica",
            "normal"
          );

          doc.setTextColor(
            0,
            0,
            0
          );

          doc.setFontSize(7);


          // ---------------------------------------------
          // HORIZONTAL + VERTICAL CENTER
          // ---------------------------------------------

          doc.text(
            String(
              value ?? ""
            ),
            x +
              column.width / 2,
            y +
              rowHeight / 2,
            {
              align: "center",
              baseline: "middle",
              maxWidth:
                Math.max(
                  column.width - 2,
                  2
                ),
            }
          );

          x +=
            column.width;
        }
      );

      y += rowHeight;
    }
  );


  return y;
}


// ==========================================================
// FOOTER
// ==========================================================

export function addFooter(doc) {
  const pageCount =
    doc.getNumberOfPages();

  for (
    let i = 1;
    i <= pageCount;
    i++
  ) {
    doc.setPage(i);

    const pageWidth =
      doc.internal.pageSize.getWidth();

    const pageHeight =
      doc.internal.pageSize.getHeight();

    // ======================================================
    // Footer line
    // ======================================================

    doc.setDrawColor(
      180
    );

    doc.setLineWidth(
      0.2
    );

    doc.line(
      10,
      pageHeight - 12,
      pageWidth - 10,
      pageHeight - 12
    );

    // ======================================================
    // Left Footer
    // ======================================================

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(
      8
    );

    doc.setTextColor(
      100
    );

    doc.text(
      "Shiv Shakti Solar Energy ERP",
      10,
      pageHeight - 6
    );

    // ======================================================
    // Right Footer
    // ======================================================

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
