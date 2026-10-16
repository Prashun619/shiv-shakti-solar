import { supabase } from "../services/supabase";
import { useEffect, useState } from "react";


import {
  addCustomer,
  updateCustomer,
} from "../services/customersService";

import {
  getProjectPayments,
  updatePayment,
  deletePayment,
} from "../services/paymentsService";

export default function CustomerModal({
  open,
  onClose,
  onSaved,
  customer,
}) {

  const [pincodeCities, setPincodeCities] = useState([]);

  const initialForm = {
    customer_name: "",
    mobile: "",
    vendor_name: "",
    email: "",

    address: "",
    city: "",
    district: "",
    state: "",
    pincode: "",

    location: "",
    plant_size: "",
    payment_type: "Cash",
    total_amount: "",
    remarks: "",
    status: "Pending",
  };

  const [form, setForm] = useState(initialForm);

  const [project, setProject] = useState(null);
  const [projectNo, setProjectNo] = useState("");

  const [payments, setPayments] = useState([]);

  const [editingPayment, setEditingPayment] =
    useState(null);

  const [paymentForm, setPaymentForm] =
    useState({
      payment_date: "",
      payment_mode: "",
      payment_type: "",
      amount: "",
      reference_no: "",
      remarks: "",
    });

  useEffect(() => {
    if (!open) return;

    async function loadCustomerData() {

      if (customer) {

        setPincodeCities([]);

        // =====================================================
        // LOAD PROJECT NUMBER
        // Project Number belongs to the projects table.
        // =====================================================

        if (customer.project_id) {

          try {

            const {
              data: projectData,
              error: projectError,
            } = await supabase
              .from("projects")
              .select("id, project_no")
              .eq("id", customer.project_id)
              .single();

            if (projectError) {

              console.error(
                "Unable to load project:",
                projectError
              );

              setProject(null);
              setProjectNo("");

            } else {

              setProject(projectData);
              setProjectNo(
                projectData?.project_no || ""
              );

            }

          } catch (error) {

            console.error(
              "Unable to load project:",
              error
            );

            setProject(null);
            setProjectNo("");

          }

        } else {

          setProject(null);
          setProjectNo("");

        }


        // =====================================================
        // ADDRESS FALLBACK
        // Existing customers may have the complete address
        // stored as:
        // Address, City, District, State, Pincode
        //
        // If separate fields are empty, extract them from
        // customer.address.
        // =====================================================

        let address = customer.address || "";
        let city = customer.city || "";
        let district = customer.district || "";
        let state = customer.state || "";
        let pincode = customer.pincode || "";


        // Only parse the combined address when the separate
        // address fields are missing.

        if (
          address &&
          (!city || !district || !state || !pincode)
        ) {

          const parts = address
            .split(",")
            .map((part) => part.trim())
            .filter(Boolean);


          // Expected format:
          // Address, City, District, State, Pincode
          //
          // Take the LAST 4 comma-separated values so that
          // commas inside the actual address do not break parsing.

          if (parts.length >= 5) {

            const parsedPincode =
              parts[parts.length - 1];

            const parsedState =
              parts[parts.length - 2];

            const parsedDistrict =
              parts[parts.length - 3];

            const parsedCity =
              parts[parts.length - 4];


            if (!pincode) {
              pincode = parsedPincode;
            }

            if (!state) {
              state = parsedState;
            }

            if (!district) {
              district = parsedDistrict;
            }

            if (!city) {
              city = parsedCity;
            }


            // Keep only the actual street/house address
            // in the Address field.

            address = parts
              .slice(0, -4)
              .join(", ");

          }

        }


        setForm({

          customer_name:
            customer.customer_name || "",

          mobile:
            customer.mobile || "",

          vendor_name:
            customer.vendor_name || "",

          email:
            customer.email || "",

          address:
            address,

          city:
            city,

          district:
            district,

          state:
            state,

          pincode:
            pincode,

          location:
            customer.location || "",

          plant_size:
            customer.plant_size || "",

          payment_type:
            customer.payment_type || "Cash",

          total_amount:
            customer.total_amount || "",

          remarks:
            customer.remarks || "",

          status:
            customer.status || "Pending",

        });

      } else {

  setForm(initialForm);
  setProject(null);
  setProjectNo("");
  setPincodeCities([]);

}

    }

    loadCustomerData();

  }, [open, customer?.id, customer?.project_id]);


  useEffect(() => {

    async function loadPayments() {

      if (!customer?.project_id) {

        setPayments([]);

        return;

      }

      try {

        const data =
          await getProjectPayments(
            customer.project_id
          );

        setPayments(data || []);

      }

      catch (error) {

        console.error(error);

        setPayments([]);

      }

    }

    if (open) {

      loadPayments();

    }

  }, [open, customer]);


  function handleChange(e) {

    setForm({

      ...form,

      [e.target.name]:
        e.target.value,

    });

  }


  async function fetchPincodeFromCity(cityName) {

    const city = cityName?.trim();

    if (!city) {
      return;
    }

    try {

      const response = await fetch(
        `https://api.postalpincode.in/postoffice/${encodeURIComponent(city)}`
      );

      const data = await response.json();

      const offices =
        data?.[0]?.PostOffice || [];


      if (offices.length > 0) {

        const firstOffice =
          offices[0];


        setForm((prev) => ({

          ...prev,

          city:
            firstOffice.District
              ? city
              : prev.city,

          district:
            firstOffice.District ||
            prev.district,

          state:
            firstOffice.State ||
            prev.state,

          pincode:
            firstOffice.Pincode ||
            prev.pincode,

        }));

      }

    } catch (error) {

      console.error(
        "Unable to fetch pincode:",
        error
      );

    }

  }


  function handleEditPayment(payment) {

    setEditingPayment({
      ...payment,
    });

    setPaymentForm({

      payment_date:
        payment.payment_date || "",

      payment_mode:
        payment.payment_mode || "",

      payment_type:
        payment.payment_type || "",

      amount:
        payment.amount || "",

      reference_no:
        payment.reference_no || "",

      remarks:
        payment.remarks || "",

    });

  }


  async function handleDeletePayment(payment) {

    if (
      !window.confirm(
        "Delete this payment?"
      )
    )
      return;

    try {

      await deletePayment(

        payment.id,

        payment.project_id

      );


      const data =
        await getProjectPayments(
          payment.project_id
        );

      setPayments(data);

    }

    catch (error) {

      console.log(error);

      alert(error.message);

    }

  }


  async function savePaymentEdit() {

    try {

      const updated = {
        ...editingPayment,
        ...paymentForm,
      };


      await updatePayment(
        updated.id,
        updated,
        updated.project_id
      );


      // Reload latest payment history

      const latestPayments =
        await getProjectPayments(
          editingPayment.project_id
        );


      setPayments(
        latestPayments.map(item => ({
          ...item,
        }))
      );


      setEditingPayment(null);


      // Refresh parent customer data

      await onSaved();

    }

    catch (error) {

      console.error(error);

      alert(error.message);

    }

  }


   async function handleSubmit(e) {

    e.preventDefault();

    try {

      if (customer?.id) {

        // =====================================================
        // UPDATE CUSTOMER
        // =====================================================

        await updateCustomer(
          customer.id,
          form
        );


        // =====================================================
        // UPDATE ONLY PROJECT NUMBER
        //
        // Project Number belongs to the projects table.
        // Do not use updateProject() here because that function
        // recalculates project financial fields.
        // =====================================================

        if (
          customer.project_id &&
          projectNo.trim()
        ) {

          const {
            error: projectError
          } = await supabase
            .from("projects")
            .update({
              project_no: projectNo.trim(),
            })
            .eq(
              "id",
              customer.project_id
            );


          if (projectError) {
            throw projectError;
          }

        }

      } else {

        // =====================================================
        // CHECK DUPLICATE CUSTOMER
        // =====================================================

        const {
          data: existingCustomer,
          error: checkError
        } = await supabase
          .from("customers")
          .select(
            "id, customer_name, mobile"
          )
          .or(
            `customer_name.eq.${form.customer_name},mobile.eq.${form.mobile}`
          );


        if (checkError) {

          console.error(checkError);

          alert(
            "Unable to check customer."
          );

          return;

        }


        if (
          existingCustomer &&
          existingCustomer.length > 0
        ) {

          alert(
            "Customer name or mobile number already exists."
          );

          return;

        }


        await addCustomer(form);

      }


      onClose();

      await onSaved();

    } catch (error) {

      console.log(error);

      alert(error.message);

    }

  }


  if (!open)
    return null;


  async function handlePincodeChange(value) {
  setForm((prev) => ({
    ...prev,
    pincode: value,
  }));

  setPincodeCities([]);

  if (value.length !== 6) {
    return;
  }

  try {
    const response = await fetch(
      `https://api.postalpincode.in/pincode/${value}`
    );

    const data = await response.json();

    const postOffices = data?.[0]?.PostOffice || [];

    if (!postOffices.length) {
      return;
    }

    // Get all unique location names
    const cities = [
      ...new Set(
        postOffices
          .map((office) => office.Name)
          .filter(Boolean)
      ),
    ];

    console.log("PINCODE POST OFFICES:", postOffices);
    console.log("PINCODE CITIES:", cities);

    setPincodeCities(cities);

    const firstOffice = postOffices[0];

    setForm((prev) => ({
      ...prev,
      pincode: value,
      city: cities.length === 1 ? cities[0] : "",
      district: firstOffice.District || "",
      state: firstOffice.State || "",
    }));
  } catch (error) {
    console.error("Pincode lookup error:", error);
  }
}


  return (

    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">

      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">


        <div className="sticky top-0 bg-white border-b px-8 py-5 z-10">

          <h2 className="text-2xl font-bold">

            {customer
              ? "Edit Customer"
              : "Add Customer"}

          </h2>

        </div>


        <form
          onSubmit={handleSubmit}
          className="p-8 space-y-8"
        >


          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">


            <input
              name="customer_name"
              placeholder="Customer Name"
              value={form.customer_name}
              onChange={handleChange}
              className="border rounded-lg px-3 py-2"
            />


            <input
              name="mobile"
              placeholder="Mobile Number"
              value={form.mobile}
              onChange={handleChange}
              className="border rounded-lg px-3 py-2"
            />


           <select
  value={form.vendor_name}
  onChange={(e) =>
    setForm({
      ...form,
      vendor_name: e.target.value,
    })
  }
  className="w-full border border-gray-300 rounded-lg px-3 py-2"
>
  <option value="">Select Vendor</option>
   <option value="Gupta Brothers">Gupta Brothers </option>
    <option value="Solar Array Infinity">Solar Array Infinity</option>
</select>


            <input
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              className="border rounded-lg px-3 py-2"
            />


            <input
              name="location"
              placeholder="Location"
              value={form.location}
              onChange={handleChange}
              className="border rounded-lg px-3 py-2"
            />


            <input
              name="plant_size"
              placeholder="Plant Size"
              value={form.plant_size}
              onChange={handleChange}
              className="border rounded-lg px-3 py-2"
            />


            {customer?.id && (
  <input
    name="project_number"
    placeholder="Project Number"
    value={projectNo}
    onChange={(e) =>
      setProjectNo(e.target.value)
    }
    className="border rounded-lg px-3 py-2f"
  />
)}


            <input
              name="total_amount"
              type="number"
              placeholder="Total Amount"
              value={form.total_amount}
              onChange={handleChange}
              className="border rounded-lg px-3 py-2"
            />


            <select
              name="payment_type"
              value={form.payment_type}
              onChange={handleChange}
              className="border rounded-lg px-3 py-2"
            >

              <option value="Cash">
                Cash
              </option>

              <option value="Finance">
                Finance
              </option>

            </select>


          </div>


          {/* ADDRESS SECTION */}

          <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50">

            <h3 className="text-lg font-bold text-slate-800 mb-4">
              Address Details
            </h3>


            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">


              {/* Address */}

              <div className="md:col-span-2">

                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Address
                </label>


                <textarea
                  rows={3}
                  name="address"
                  placeholder="House No., Street, Landmark"
                  value={form.address}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                />

              </div>


              {/* City */}

              <div>

                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  City
                </label>


                {pincodeCities.length > 1 ? (
  <select
    name="city"
    value={form.city}
    onChange={handleChange}
    className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
  >
    <option value="">Select City</option>

    {pincodeCities.map((city, index) => (
      <option key={`${city}-${index}`} value={city}>
        {city}
      </option>
    ))}
  </select>
) : (
  <input
    type="text"
    name="city"
    placeholder="Enter City"
    value={form.city}
    onChange={handleChange}
    className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
  />
)}


                <p className="text-xs text-slate-500 mt-1">
  Filled automatically from Pincode
</p>

              </div>


              {/* District */}

              <div>

                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  District
                </label>


                <input
                  type="text"
                  name="district"
                  placeholder="District"
                  value={form.district}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                />

              </div>


              {/* State */}

              <div>

                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  State
                </label>


                <input
                  type="text"
                  name="state"
                  placeholder="State"
                  value={form.state}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                />

              </div>


              {/* Pincode */}

              <div>

                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Pincode
                </label>


              <input
  type="text"
  name="pincode"
  placeholder="Pincode"
  maxLength={6}
  inputMode="numeric"
  value={form.pincode}
  onChange={(e) =>
    handlePincodeChange(
      e.target.value.replace(/\D/g, "")
    )
  }
  className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
/>

              </div>


            </div>

          </div>


          <div>

            <textarea
              rows={3}
              name="remarks"
              placeholder="Remarks"
              value={form.remarks}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2"
            />

          </div>


          {customer?.id && (

            <div className="border rounded-xl p-5">

              <div className="flex justify-between items-center mb-4">

                <h3 className="text-lg font-bold">
                  Payment History
                </h3>


                <span className="text-sm text-gray-500">
                  {payments.length} Payments
                </span>

              </div>


              <div className="overflow-x-auto">

                <table className="w-full border-collapse border-2 border-black">

                  <thead className="bg-gray-200">

                    <tr>

                      <th className="border-2 border-black px-4 py-3 text-center font-bold">
                        Date
                      </th>

                      <th className="border-2 border-black px-4 py-3 text-center font-bold">
                        Amount
                      </th>

                      <th className="border-2 border-black px-4 py-3 text-center font-bold">
                        Mode
                      </th>

                      <th className="border-2 border-black px-4 py-3 text-center font-bold">
                        Reference
                      </th>

                      <th className="border-2 border-black px-4 py-3 text-center font-bold">
                        Actions
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {payments.length === 0 ? (

                      <tr>

                        <td
                          colSpan={5}
                          className="border-2 border-black py-8 text-center text-gray-500"
                        >
                          No Payment History Found
                        </td>

                      </tr>

                    ) : (

                      payments.map((payment) => (

                        <tr
                          key={`${payment.id}-${payment.amount}-${payment.payment_date}`}
                          className="hover:bg-gray-50"
                        >

                          <td className="border-2 border-black px-4 py-3 text-center align-middle">
                            {payment.payment_date}
                          </td>


                          <td className="border-2 border-black px-4 py-3 text-center align-middle">
                            ₹ {Number(payment.amount || 0).toLocaleString("en-IN")}
                          </td>


                          <td className="border-2 border-black px-4 py-3 text-center align-middle">
                            {payment.payment_mode}
                          </td>


                          <td className="border-2 border-black px-4 py-3 text-center align-middle">
                            {payment.reference_no || "-"}
                          </td>


                          <td className="border-2 border-black px-4 py-3 text-center align-middle whitespace-nowrap">

                            <button
                              type="button"
                              onClick={() =>
                                handleEditPayment(payment)
                              }
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md mr-2"
                            >
                              Edit
                            </button>


                            <button
                              type="button"
                              onClick={() =>
                                handleDeletePayment(payment)
                              }
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md"
                            >
                              Delete
                            </button>

                          </td>

                        </tr>

                      ))

                    )}

                  </tbody>

                </table>

              </div>

            </div>

          )}


          <div className="flex justify-end gap-3">

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 border rounded-lg"
            >
              Cancel
            </button>


            <button
              type="submit"
              className="px-5 py-2 bg-green-600 text-white rounded-lg"
            >
              {customer
                ? "Update Customer"
                : "Save Customer"}
            </button>

          </div>


        </form>


        {editingPayment && (

          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">

            <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl">

              <h3 className="text-xl font-bold mb-5">
                Edit Payment
              </h3>


              <div className="space-y-4">

                <input
                  type="date"
                  value={paymentForm.payment_date}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      payment_date:
                        e.target.value
                    })
                  }
                  className="w-full border rounded-lg px-3 py-2"
                />


                <input
                  type="number"
                  placeholder="Amount"
                  value={paymentForm.amount}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      amount:
                        e.target.value
                    })
                  }
                  className="w-full border rounded-lg px-3 py-2 no-spinner"
                />


                <select
                  value={paymentForm.payment_mode}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      payment_mode:
                        e.target.value
                    })
                  }
                  className="w-full border rounded-lg px-3 py-2"
                >

                  <option value="Cash">
                    Cash
                  </option>

                  <option value="UPI">
                    UPI
                  </option>

                  <option value="Bank Transfer">
                    Bank Transfer
                  </option>

                  <option value="Cheque">
                    Cheque
                  </option>

                </select>


                <input
                  placeholder="Reference Number"
                  value={paymentForm.reference_no}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      reference_no:
                        e.target.value
                    })
                  }
                  className="w-full border rounded-lg px-3 py-2"
                />


                <textarea
                  rows={3}
                  placeholder="Remarks"
                  value={paymentForm.remarks}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      remarks:
                        e.target.value
                    })
                  }
                  className="w-full border rounded-lg px-3 py-2"
                />

              </div>


              <div className="flex justify-end gap-3 mt-6">

                <button
                  type="button"
                  onClick={() =>
                    setEditingPayment(null)
                  }
                  className="px-5 py-2 border rounded-lg"
                >
                  Cancel
                </button>


                <button
                  type="button"
                  onClick={savePaymentEdit}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg"
                >
                  Update Payment
                </button>

              </div>

            </div>

          </div>

        )}

      </div>

    </div>

  );
}