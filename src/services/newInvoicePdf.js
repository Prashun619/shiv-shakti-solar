import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export async function generateNewInvoicePDF(customerName = "Customer") {
  const element = document.getElementById(
    "new-invoice-pdf-document"
  );

  if (!element) {
    throw new Error(
      "Invoice PDF document was not found."
    );
  }

  /*
    ---------------------------------------------------------
    CAPTURE COMPLETE INVOICE
    ---------------------------------------------------------
  */

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
  });

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  const pageWidth =
    pdf.internal.pageSize.getWidth();

  const pageHeight =
    pdf.internal.pageSize.getHeight();

  const margin = 6;

  const usableWidth =
    pageWidth - margin * 2;

  const usableHeight =
    pageHeight - margin * 2;

  const imageWidth = canvas.width;
  const imageHeight = canvas.height;

  /*
    ---------------------------------------------------------
    PIXELS AVAILABLE FOR ONE PDF PAGE
    ---------------------------------------------------------
  */

  const pageHeightPixels = Math.floor(
    (usableHeight / usableWidth) *
      imageWidth
  );

  /*
    ---------------------------------------------------------
    FIND SAFE BREAK POINTS
    ---------------------------------------------------------

    We do NOT cut the invoice at an arbitrary pixel.

    Safe points are:
    1. End of every non-break section
    2. End of every table row

    This prevents:
      - Tax Summary being cut
      - Amount in Words being cut
      - Bank Details being cut
      - Terms being cut
      - Table rows being cut
    ---------------------------------------------------------
  */

  const elementRect =
    element.getBoundingClientRect();

  const safeBreakPoints = [];

  /*
    Non-break sections
  */

  const nonBreakSections =
    element.querySelectorAll(
      ".print-no-break"
    );

  nonBreakSections.forEach((section) => {
    const rect =
      section.getBoundingClientRect();

    const bottom =
      (rect.bottom -
        elementRect.top) *
      (canvas.width /
        element.scrollWidth);

    safeBreakPoints.push(
      Math.round(bottom)
    );
  });

  /*
    Table rows
  */

  const tableRows =
    element.querySelectorAll(
      ".print-table tr"
    );

  tableRows.forEach((row) => {
    const rect =
      row.getBoundingClientRect();

    const bottom =
      (rect.bottom -
        elementRect.top) *
      (canvas.width /
        element.scrollWidth);

    safeBreakPoints.push(
      Math.round(bottom)
    );
  });

  /*
    Always include the complete invoice end.
  */

  safeBreakPoints.push(imageHeight);

  /*
    Remove duplicates and sort.
  */

  const breakPoints = [
    ...new Set(
      safeBreakPoints
        .filter(
          (point) =>
            point > 0 &&
            point <= imageHeight
        )
        .sort((a, b) => a - b)
    ),
  ];

  /*
    ---------------------------------------------------------
    CREATE PAGE RANGES
    ---------------------------------------------------------
  */

  const pageRanges = [];

  let startY = 0;

  while (startY < imageHeight) {
    const maximumEnd =
      Math.min(
        startY + pageHeightPixels,
        imageHeight
      );

    /*
      Find the LAST safe break point that
      fits inside this page.
    */

    let bestBreak = null;

    for (const point of breakPoints) {
      if (
        point > startY &&
        point <= maximumEnd
      ) {
        bestBreak = point;
      }
    }

    /*
      If no safe break exists, use the normal
      page boundary as a fallback.
    */

    let endY =
      bestBreak !== null
        ? bestBreak
        : maximumEnd;

    /*
      Safety against infinite loops.
    */

    if (endY <= startY) {
      endY = maximumEnd;
    }

    pageRanges.push({
      startY,
      endY,
    });

    startY = endY;
  }

  /*
    ---------------------------------------------------------
    RENDER EACH PAGE
    ---------------------------------------------------------
  */

  pageRanges.forEach(
    ({ startY, endY }, pageIndex) => {
      if (pageIndex > 0) {
        pdf.addPage();
      }

      const currentHeight =
        endY - startY;

      const pageCanvas =
        document.createElement("canvas");

      pageCanvas.width =
        imageWidth;

      pageCanvas.height =
        currentHeight;

      const context =
        pageCanvas.getContext("2d");

      /*
        White background
      */

      context.fillStyle = "#ffffff";

      context.fillRect(
        0,
        0,
        pageCanvas.width,
        pageCanvas.height
      );

      /*
        Copy only the safe page area.
      */

      context.drawImage(
        canvas,
        0,
        startY,
        imageWidth,
        currentHeight,
        0,
        0,
        imageWidth,
        currentHeight
      );

      const pageImage =
        pageCanvas.toDataURL(
          "image/jpeg",
          0.95
        );

      const currentPdfHeight =
        (currentHeight * usableWidth) /
        imageWidth;

      pdf.addImage(
        pageImage,
        "JPEG",
        margin,
        margin,
        usableWidth,
        currentPdfHeight,
        undefined,
        "FAST"
      );
    }
  );

  /*
    ---------------------------------------------------------
    DOWNLOAD
    ---------------------------------------------------------
  */

const pdfcustomerName =
  document.querySelector(
    "#new-invoice-pdf-document"
  )?.querySelector(
    "[data-customer-name]"
  )?.textContent?.trim();

const invoiceName =
  customerName ||
  element.dataset.customerName ||
  "Customer";

const safeCustomerName = String(customerName || "Customer")
  .trim()
  .replace(/[<>:"/\\|?*]/g, "")
  .replace(/\s+/g, " ");

pdf.save(`${safeCustomerName} Invoice.pdf`);
}