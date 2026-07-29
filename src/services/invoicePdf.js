import "@fontsource/noto-serif/400.css";
import "@fontsource/noto-serif/700.css";
import jsPDF from "jspdf";

/* Utility to load images */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function loadFont(url) {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();

  let binary = "";
  const bytes = new Uint8Array(buffer);

  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary);
}

function numberToWordsIndian(num) {
  if (num === 0) return "Zero Rupees Only";

  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven",
    "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen",
    "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen",
    "Nineteen"
  ];

  const tens = [
    "", "", "Twenty", "Thirty", "Forty",
    "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
  ];

  function convert(n) {
    if (n < 20) return ones[n];

    if (n < 100)
      return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");

    if (n < 1000)
      return (
        ones[Math.floor(n / 100)] +
        " Hundred" +
        (n % 100 ? " " + convert(n % 100) : "")
      );

    if (n < 100000)
      return (
        convert(Math.floor(n / 1000)) +
        " Thousand" +
        (n % 1000 ? " " + convert(n % 1000) : "")
      );

    if (n < 10000000)
      return (
        convert(Math.floor(n / 100000)) +
        " Lakh" +
        (n % 100000 ? " " + convert(n % 100000) : "")
      );

    return (
      convert(Math.floor(n / 10000000)) +
      " Crore" +
      (n % 10000000 ? " " + convert(n % 10000000) : "")
    );
  }

  return convert(num) + " Rupees Only";
}

export async function generateInvoicePDF(invoice, download = true) {
  console.log(JSON.stringify(invoice, null, 2));
  const doc = new jsPDF("p", "mm", "a4");


  doc.setFont("Cambria", "normal");
  const margin = 10;
  const pageWidth = 210;
  const pageHeight = 297;

  // 0. Full Page Border (Added as requested)
  doc.setDrawColor(34, 177, 76);   // Green
doc.setLineWidth(0.8);           // Thickness (increase if needed)
  doc.rect(margin, margin, pageWidth - (margin * 2), pageHeight - (margin * 2));

  // Set consistent heights
  const headerHeight = 25; 
  const infoHeight = 30;   
  const billToHeight = 25; 

  // Calculated vertical positions
  const infoY = 10 + headerHeight; 
  const billToY = infoY + infoHeight; 
  const midX = pageWidth / 2;

  /* 1. Header Block */
  doc.rect(margin, 10, pageWidth - (margin * 2), headerHeight); 
  try {
    const logo = await loadImage("/logo.png");
    doc.addImage(logo, "PNG", margin + 2, 12, 25, 25);
  } catch(e) {
    doc.text("LOGO", margin + 5, 25);
  }
  // Tax Invoice - Green & Bold
doc.setFont("Cambria", "bold");
doc.setFontSize(25);
doc.setTextColor(34, 177, 76);   // Green

doc.text(
  "Tax Invoice",
  pageWidth - margin - 5,
  25,
  { align: "right" }
);

// Reset immediately
doc.setTextColor(0, 0, 0);
doc.setFont("times", "normal");

// Reset color and font after Tax Invoice only
doc.setTextColor(0, 0, 0);
doc.setFont("times", "normal");

  /* 2. Secondary Info Block */
  doc.rect(margin, infoY, pageWidth - (margin * 2), infoHeight);
  

// Company Name - Black & Bold
doc.setFont("times", "bold");
doc.setFontSize(20);
doc.setTextColor(0, 0, 0);

doc.text(
  "Shiv Shakti Solar Energy",
  margin + 2,
  infoY + 7
);

// Reset for remaining company details
doc.setTextColor(0, 0, 0);
doc.setFont("times", "normal");
  
  doc.setFontSize(10)
  doc.text("Flat no.: 01, Ward no. 7, Opp. Stadium", margin + 2, infoY + 12);
  doc.text("Nowgong, Distt.: Chhatarpur (MP)", margin + 2, infoY + 16);
  doc.text("Contact No.: 9406731278", margin + 2, infoY + 20);
  doc.text("Email: shivshaktienergies01@gmail.com", margin + 2, infoY + 24);
  doc.setFont("times", "bold");
  doc.text("GST No.: 23BECPD8921G1ZV", margin + 2, infoY + 28);

  /* 3. Third Block: Bill To / Invoice Details */
  doc.rect(margin, billToY, pageWidth - (margin * 2), billToHeight);
  doc.line(midX, billToY, midX, billToY + billToHeight);

  // Left: Bill To
  doc.setFont("times", "bold");
  doc.setFontSize(11);
  doc.text("Bill To:", margin + 2, billToY + 5);
  doc.setFont("times", "normal");
  doc.text(invoice.customer_name || "", margin + 2, billToY + 11);
  const addr = doc.splitTextToSize(invoice.customer_address || "", 80);
  doc.text(addr, margin + 2, billToY + 16);

  // Right: Invoice Details (Aligned to Far Right)
  const rightColX = pageWidth - margin - 2;
  doc.setFont("times", "bold");
  doc.text("Invoice Details:", rightColX, billToY + 5, { align: "right" });
  doc.setFont("times", "normal");
  doc.text("Invoice No.: " + (invoice.invoice_number || ""), rightColX, billToY + 11, { align: "right" });
  const invoiceDate = invoice.invoice_date
  ? new Date(invoice.invoice_date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).replace(/ /g, "-")
  : "";

  doc.text(
"Date: " + invoiceDate,
rightColX,
billToY + 16,
{ align:"right" }
);

  /* 4. Table Block (Dynamic) */

  doc.setDrawColor(0, 0, 0);
doc.setLineWidth(0.2);

  const tableSideMargin = 2;
  const tableMargin = margin + tableSideMargin;
  const tableWidth = pageWidth - (tableMargin * 2);
  const tableTop = billToY + billToHeight + 2; 
  const rowHeight = 8;
  const colWidths = [10, 58, 25, 20, 30, 43]; 
  const headers = ["#", "Item Name", "HSN/SAC", "QTY", "Price", "Amount"];

  // Draw Table Headers
  doc.setFont("times", "bold");
  doc.setFontSize(10.5);
  doc.setFillColor(240, 240, 240);
  doc.rect(tableMargin, tableTop, tableWidth, rowHeight, "F");
  
  let currentX = tableMargin;
  headers.forEach((h, i) => {
    doc.rect(currentX, tableTop, colWidths[i], rowHeight);
    doc.text(h, currentX + (colWidths[i] / 2), tableTop + 5, { align: "center" });
    currentX += colWidths[i];
  });

  // Draw Dynamic Rows based on invoice.items
  doc.setFont("times", "normal");
  doc.setFontSize(10);
  let calculatedTotal = 0;
  let itemCount = 0; // NEW: Counter for visible items
  const totalRows = 12; 

  for (let i = 0; i < totalRows; i++) {
    let rowY = tableTop + ((i + 1) * rowHeight);
    currentX = tableMargin;
    
    const item = invoice.items && invoice.items[i];
    const isTotalRow = (i === totalRows - 1);

    colWidths.forEach((width, colIdx) => {
      doc.rect(currentX, rowY, width, rowHeight);
      
if (isTotalRow) {
        if (colIdx === 1) {
          doc.setFont("times", "bold");
          doc.text("Total", currentX + (width / 2), rowY + 5, { align: "center" });
        } else if (colIdx === 5) {
          doc.setFont("times", "bold");
          
          // Replace 'total_amount' below with the exact name of the field 
          // you use in your 'create invoice' form
          const manualTotal = invoice.total || invoice.subtotal || "";
          
          doc.text(manualTotal.toString(), currentX + (width / 2), rowY + 5, { align: "center" });
        }
      }
      else if (item && (item.name || item.itemName || item.item_name)) {
        // Increment the serial number counter only if an item is found
        if (colIdx === 0) {
            itemCount++; 
            doc.text(itemCount.toString(), currentX + (width / 2), rowY + 5, { align: "center" });
        } else if (colIdx === 1) doc.text(item.name || item.itemName || item.item_name || "", currentX + (width / 2), rowY + 5, { align: "center" });
        else if (colIdx === 2) doc.text(item.hsn || item.hsnCode || "", currentX + (width / 2), rowY + 5, { align: "center" });
        else if (colIdx === 3) doc.text(item.qty ? item.qty.toString() : "", currentX + (width / 2), rowY + 5, { align: "center" });
        else if (colIdx === 4) doc.text(item.price ? item.price.toString() : "", currentX + (width / 2), rowY + 5, { align: "center" });
        
        if (colIdx === 5 && item.qty && item.price) {
          calculatedTotal += (parseFloat(item.qty) * parseFloat(item.price));
        }
      }
      currentX += width;
    });
  }

  const bottomY = billToY + billToHeight + 106;

  
/* ======================================================
   BOTTOM SECTION
====================================================== */



// Left width (aligned with table after Qty column)
const leftWidth = 115;

// Right width
const rightWidth = (pageWidth - (margin * 2)) - leftWidth;

// Amount box X
const amountX = margin + leftWidth;

// Total Value
const totalValue = Number(invoice.total || invoice.subtotal || 0);

// Positions
const termsY = bottomY + 15;
const thanksY = termsY + 35;
const signX = amountX;

// ======================================
// DRAW ONE CONTINUOUS BOX
// ======================================

// Outer Border

doc.setDrawColor(34, 177, 76);
doc.setLineWidth(0.8);
doc.rect(
  margin +2,
  bottomY,
  pageWidth - (margin * 2) - 4,
  65
);

// Vertical Divider
doc.line(
  amountX,
  bottomY,
  amountX,
  bottomY + 65
);

// Left Horizontal Lines
doc.line(
  margin + 2,
  bottomY + 15,
  amountX,
  bottomY + 15
);

doc.line(
  margin + 2,
  bottomY + 50,
  amountX,
  bottomY + 50
);

// Right Horizontal Line (Subtotal / Grand Total)
doc.line(
  amountX,
  bottomY + 7.5,
  pageWidth - margin -2,
  bottomY + 7.5
);

// Line below Grand Total
doc.line(
  amountX,
  bottomY + 15,
  pageWidth - margin - 2,
  bottomY + 15
);

// ======================================
// AMOUNT IN WORDS
// ======================================

doc.setFont("times", "bold");
doc.setFontSize(10);
doc.text("Amount In Words", margin + 4, bottomY + 5);

doc.setFont("times", "normal");
doc.text(
  numberToWordsIndian(totalValue),
  margin + 4,
  bottomY + 11
);

// ======================================
// SUBTOTAL / GRAND TOTAL
// ======================================

doc.setFont("times", "bold");

doc.text("Subtotal", amountX + 2, bottomY + 5);

doc.text(
  totalValue.toString(),
  pageWidth - margin - 18,
  bottomY + 5,
  { align: "right" }
);

doc.text("Grand Total", amountX + 2, bottomY + 13);

doc.text(
  totalValue.toString(),
  pageWidth - margin - 18,
  bottomY + 13,
  { align: "right" }
);

// ======================================
// TERMS
// ======================================

doc.setFont("times", "bold");
doc.setFontSize(11);

doc.text(
  "Terms & Conditions",
  margin + 4,
  termsY + 5
);

doc.setFont("times", "normal");
doc.setFontSize(10);



// ======================================
// THANK YOU
// ======================================

doc.setFont("times", "bold");
doc.setFontSize(11);

doc.text(
  "Thank You For Your Business!",
  margin + leftWidth / 2,
  thanksY + 9,
  { align: "center" }
);

// ======================================
// SIGNATURE
// ======================================

doc.setFont("times", "bold");
doc.setFontSize(10);

doc.text(
  "For Shiv Shakti Solar Energy",
  signX + rightWidth / 2,
  termsY + 8,
  { align: "center" }
);

try {

  const sign = await loadImage("/signature.png");

  doc.addImage(
    sign,
    "PNG",
    signX + (rightWidth - 40) / 2,
    termsY + 16,
    40,
    18
  );

} catch (e) {}

doc.setFont("times", "bold");

doc.text(
  "Authorized Signatory",
  signX + rightWidth / 2,
  termsY + 46,
  { align: "center" }
);

if (download)
    doc.save(`Invoice_${invoice.invoice_number || 'draft'}.pdf`);
else
    window.open(doc.output("bloburl"), "_blank");
}