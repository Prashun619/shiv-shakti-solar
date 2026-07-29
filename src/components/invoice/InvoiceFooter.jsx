export default function InvoiceFooter(){

  return (

    <>

      {/* TERMS & CONDITIONS */}

      <div
        className="
        border
        border-green-600
        border-t-0
        bg-white
        text-black
        px-2
        py-3
        "
      >

        <h3 className="font-semibold text-left">
          Terms & Conditions :
        </h3>

      </div>




      {/* THANK YOU + SIGNATURE */}

      <div
        className="
        border
        border-green-600
        border-t-0
        bg-white
        text-black
        flex
        justify-between
        p-4
        min-h-[220px]
        "
      >


        {/* THANK YOU */}

        <div className="font-semibold self-start">

          Thank You For Your Business!

        </div>




        {/* SIGNATURE BOX */}

        <div
          className="
          border
          border-green-600
          w-72
          min-h-[210px]
          p-4
          flex
          flex-col
          items-center
          bg-white
          "
        >


          <div className="font-semibold text-center">

            For Shiv Shakti Solar Energy

          </div>



          {/* SIGNATURE IMAGE */}

<div className="flex-1 flex items-center justify-center">

  <img
    src="/signature.png"
    alt="Signature"
    className="
      max-h-20
      object-contain
    "
  />

</div>



          <div className="font-semibold text-center">

            Authorized Signatory

          </div>



        </div>



      </div>


    </>

  );

}