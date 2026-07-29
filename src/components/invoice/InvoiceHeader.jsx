export default function InvoiceHeader(){

  return (

    <div className="border border-green-600">


      <div className="flex justify-between items-start p-5">


        {/* LOGO */}

        <div>

          <img
            src="/logo.png"
            alt="Shiv Shakti Solar"
            className="h-20 object-contain"
          />

        </div>



        {/* TITLE */}

        <div className="text-right">

          <h1 className="text-3xl font-bold">
            TAX INVOICE
          </h1>

        </div>


      </div>




      <div className="border-t border-green-600 p-5">


        <h2 className="text-xl font-bold">
  Shiv Shakti Solar Energy
</h2>


<p className="mt-2">
  Flat no.: 01, Ward no. 7, Opp. Stadium
</p>


<p>
  Nowgong, Distt.: Chhatarpur (MP)
</p>


<p>
  Contact No.: 9406731278
</p>


<p>
  Email: shivshaktienergies01@gmail.com
</p>


<p>
  GST No.: 23BECPD8921G1ZV
</p>

      </div>


    </div>

  );

}