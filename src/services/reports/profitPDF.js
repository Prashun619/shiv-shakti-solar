import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


export async function exportProfitPDF(profitData = []) {

  console.log("PROFIT PDF DATA:", profitData);


  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });


  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();


  // ==============================
  // LOAD LOGO
  // ==============================

  const logo = new Image();

  logo.src = "/logo.png";


  await new Promise((resolve)=>{
    logo.onload = resolve;
    logo.onerror = resolve;
  });



  // ==============================
  // CALCULATIONS
  // ==============================

  const totalSelling = profitData.reduce(
    (sum,item)=>sum + Number(item.selling_amount || 0),
    0
  );


  const totalCost = profitData.reduce(
    (sum,item)=>sum + Number(item.total_cost || 0),
    0
  );


  const totalProfit = profitData.reduce(
    (sum,item)=>sum + Number(item.profit_amount || 0),
    0
  );


  const profitPercent =
    totalSelling > 0
    ? ((totalProfit / totalSelling)*100).toFixed(2)
    : "0.00";



  // ==============================
  // HEADER
  // ==============================

  doc.setFillColor(22,101,52);

  doc.rect(
    0,
    0,
    pageWidth,
    35,
    "F"
  );


  if(logo.complete){

    doc.addImage(
      logo,
      "PNG",
      12,
      8,
      20,
      20
    );

  }


  doc.setTextColor(255,255,255);

  doc.setFont(
    "helvetica",
    "bold"
  );


  doc.setFontSize(22);


  doc.text(
    "SHIV SHAKTI SOLAR ENERGY",
    pageWidth/2,
    14,
    {
      align:"center"
    }
  );


  doc.setFontSize(13);


  doc.text(
    "PROFIT ANALYSIS REPORT",
    pageWidth/2,
    24,
    {
      align:"center"
    }
  );


  doc.setFontSize(9);


  doc.text(
    `Generated : ${new Date().toLocaleDateString("en-GB")}`,
    pageWidth-12,
    30,
    {
      align:"right"
    }
  );


  doc.setTextColor(0,0,0);



  // ==============================
  // COLORFUL KPI CARDS
  // ==============================


  const cards=[

    {
      title:"TOTAL SELLING",
      value:totalSelling
    },

    {
      title:"TOTAL COST",
      value:totalCost
    },

    {
      title:"NET PROFIT",
      value:totalProfit
    },

    {
      title:"PROFIT MARGIN",
      value:`${profitPercent}%`
    }

  ];


  const cardColors=[

  [147,197,253],   // Blue
  [253,224,71],    // Yellow
  [134,239,172],   // Green
  [216,180,254]    // Purple

];


  let cardX = 12;


  cards.forEach((card,index)=>{


    doc.setFillColor(
      ...cardColors[index]
    );


    // Card background

doc.setFillColor(
  ...cardColors[index]
);

doc.roundedRect(
  cardX,
  45,
  62,
  20,
  3,
  3,
  "F"
);


// Solid black border

doc.setDrawColor(
  0,
  0,
  0
);

doc.setLineWidth(0.5);

doc.roundedRect(
  cardX,
  45,
  62,
  20,
  3,
  3
);


    doc.setTextColor(
      0,
      0,
      0
    );


    doc.setFont(
      "helvetica",
      "bold"
    );


    doc.setFontSize(8);


    doc.text(
      card.title,
      cardX + 31,
      52,
      {
        align:"center"
      }
    );


    doc.setFontSize(10);


    let displayValue =
      typeof card.value === "number"
      ? `Rs. ${card.value.toLocaleString()}`
      : card.value;


    doc.text(
      displayValue,
      cardX + 31,
      61,
      {
        align:"center"
      }
    );


    cardX += 68;


  });



  // ==============================
  // PROFIT TABLE
  // ==============================


  doc.autoTable({

    startY:80,


    head:[[

      "S.No",
      "Project No",
      "Customer",
      "Size",
      "Selling",
      "Material",
      "Other",
      "Cost",
      "Profit",
      "%"

    ]],


    body:profitData.map((item,index)=>[

      index+1,

      item.project_no || "-",

      item.customer_name || "-",

      `${item.project_size || "-"} KW`,

      `Rs. ${Number(item.selling_amount||0).toLocaleString()}`,

      `Rs. ${Number(item.material_cost||0).toLocaleString()}`,

      `Rs. ${Number(item.other_cost||0).toLocaleString()}`,

      `Rs. ${Number(item.total_cost||0).toLocaleString()}`,

      `Rs. ${Number(item.profit_amount||0).toLocaleString()}`,

      `${item.profit_percent}%`

    ]),


    theme:"grid",


    styles:{

  fontSize:8,

  cellPadding:4,

  halign:"center",

  valign:"middle",

  textColor:[0,0,0],

  lineColor:[0,0,0],

  lineWidth:0.3

},


    headStyles:{

  fillColor:[22,101,52],

  textColor:[255,255,255],

  fontStyle:"bold",

  lineColor:[0,0,0],

  lineWidth:0.5

},


    columnStyles:{

      8:{
        fontStyle:"bold"
      }

    },


    margin:{
      left:10,
      right:10
    }

  });



  // ==============================
  // FOOTER
  // ==============================


  const pages =
    doc.internal.getNumberOfPages();


  for(let i=1;i<=pages;i++){


    doc.setPage(i);


    doc.setDrawColor(180);


    doc.line(
      10,
      pageHeight-12,
      pageWidth-10,
      pageHeight-12
    );


    doc.setFontSize(9);


    doc.setTextColor(100);


    doc.text(
      "Generated by Shiv Shakti Solar ERP | Confidential Report",
      10,
      pageHeight-6
    );


    doc.text(
      `Page ${i} of ${pages}`,
      pageWidth-10,
      pageHeight-6,
      {
        align:"right"
      }
    );

  }



  doc.save(
    "Profit Report.pdf"
  );

}