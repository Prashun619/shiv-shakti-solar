# Kit Inverter Swap Implementation Guide

## Overview
This guide helps you implement the inverter swap feature for kits in material consumption.

## What the Feature Does

When a user selects a kit during material consumption:
1. ✅ An "Inverter Options" section appears
2. ✅ User can change the inverter brand (Waaree → Luminous, etc.)
3. ✅ Price is automatically adjusted based on inverter cost difference
4. ✅ When saved, the original inverter is returned to inventory
5. ✅ The returned inverter appears in inventory list for other customers

---

## Step-by-Step Implementation

### Step 1: Create Kit Service (NEW FILE)

**File:** `src/services/kitService.js`

This service handles:
- Kit configurations with original inverters
- Fetching inverter prices from inventory
- Calculating cost adjustments
- Returning inverters to inventory

**Key Functions:**
- `getInverterPrice(inverterBrand)` - Get price from inventory
- `returnOriginalInverterToInventory(kitData)` - Add inverter back to inventory
- `calculateKitCostAdjustment()` - Calculate price difference

---

### Step 2: Update Material Consumption Modal

**File:** `src/components/UsedInventoryModal.jsx`

**Changes Needed:**

#### 1. Add Import at Top
```javascript
import {
  INVERTER_OPTIONS,
  getInverterPrice,
  returnOriginalInverterToInventory,
} from "../services/kitService";
```

#### 2. Add State for Cost Adjustments
```javascript
const [inverterCostAdjustments, setInverterCostAdjustments] = useState({});
```

#### 3. Add Function to Handle Inverter Change
```javascript
async function handleInverterChange(index, newInverter) {
  const product = form.products[index];
  
  if (!product || product.category !== "Inverter") {
    return;
  }

  try {
    const oldPrice = await getInverterPrice(product.company);
    const newPrice = await getInverterPrice(newInverter);
    const priceDifference = newPrice - oldPrice;

    setInverterCostAdjustments(prev => ({
      ...prev,
      [index]: {
        oldPrice,
        newPrice,
        difference: priceDifference,
        oldCompany: product.company,
      }
    }));

    const updatedProducts = [...form.products];
    updatedProducts[index] = {
      ...product,
      company: newInverter,
      unit_price: newPrice,
      total: Number(product.quantity || 1) * newPrice,
    };

    updateTotals(updatedProducts);
  } catch (error) {
    console.error("Error changing inverter:", error);
    alert("Error updating inverter price");
  }
}
```

#### 4. Add Function to Process Inverter Swaps Before Save
```javascript
async function processInverterSwaps() {
  for (const [indexStr, adjustment] of Object.entries(inverterCostAdjustments)) {
    const index = parseInt(indexStr);
    const product = form.products[index];

    if (adjustment.oldCompany && product.company !== adjustment.oldCompany) {
      try {
        await returnOriginalInverterToInventory({
          kit_name: "Inverter Swap",
          kit_inverter_brand: product.company,
          original_kit_inverter: adjustment.oldCompany,
          kit_panel_watt: product.specification || "",
        });

        console.log(
          `✓ Returned ${adjustment.oldCompany} inverter to inventory`
        );
      } catch (error) {
        console.error("Error returning inverter:", error);
      }
    }
  }
}
```

#### 5. Update handleSubmit Function
```javascript
async function handleSubmit(e){
  e.preventDefault();

  try{
    setLoading(true);

    // Process inverter swaps before saving
    await processInverterSwaps();

    if(item){
      await updateUsedInventory(item.id, form);
    }
    else{
      await addUsedInventory(form);
    }

    onSaved();
    onClose();
  }
  catch(error){
    console.log(error);
    alert(error.message);
  }
  finally{
    setLoading(false);
  }
}
```

#### 6. Add UI Section for Inverter Selection
Add this **after the Products table** and **before Additional Charges section** (around line 1823):

```javascript
{/* INVERTER CHANGE SECTION */}
{form.products.some(p => p.category === "Inverter") && (
  <div className="border border-blue-300 rounded-xl p-5 mb-8 bg-blue-50">
    <h3 className="text-lg font-bold mb-4 text-blue-900">
      🔄 Inverter Options
    </h3>
    <p className="text-sm text-blue-700 mb-4">
      Select a different inverter. The original one will automatically return to inventory.
    </p>
    
    <div className="space-y-3">
      {form.products.map((product, index) => 
        product.category === "Inverter" ? (
          <div key={index} className="bg-white p-4 rounded border border-blue-200">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Current Inverter
                </label>
                <input
                  type="text"
                  readOnly
                  value={product.company}
                  className="border p-2 rounded bg-gray-100 w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">
                  Change to:
                </label>
                <select
                  value={product.company}
                  onChange={(e) => handleInverterChange(index, e.target.value)}
                  className="border p-2 rounded w-full"
                >
                  {INVERTER_OPTIONS.map((inv) => (
                    <option key={inv.id} value={inv.brand}>
                      {inv.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">
                  Price
                </label>
                <input
                  type="text"
                  readOnly
                  value={`₹ ${Number(product.unit_price || 0).toFixed(2)}`}
                  className="border p-2 rounded bg-gray-100 w-full font-bold text-green-700"
                />
              </div>
            </div>

            {inverterCostAdjustments[index] && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                <p className="text-yellow-800">
                  <strong>Price Adjustment:</strong> ₹{Math.abs(inverterCostAdjustments[index].difference).toFixed(2)} 
                  {inverterCostAdjustments[index].difference > 0 ? " (Increase)" : " (Decrease)"}
                </p>
              </div>
            )}
          </div>
        ) : null
      )}
    </div>
  </div>
)}
```

---

## How It Works - User Flow

### Scenario: Customer wants Luminous inverter instead of Waaree

1. **User adds material consumption** → Selects Waaree 3KW Kit
2. **Inverter section appears** → Shows current: Waaree
3. **User changes inverter** → Selects Luminous from dropdown
4. **Price updates** → System fetches Luminous price, calculates difference, updates total
5. **User saves** → System:
   - Consumes materials from inventory (FIFO)
   - Creates NEW inventory entry for Waaree inverter (returned)
   - Original inverter now available for other customers
6. **In Inventory List** → Waaree inverter appears with note "Returned from Kit Swap"

---

## Testing Checklist

- [ ] Kit with inverter loads correctly
- [ ] Inverter Options section appears
- [ ] Can select different inverter brands
- [ ] Price updates when inverter changes
- [ ] Price adjustment shown correctly
- [ ] On save, material is consumed
- [ ] On save, original inverter returns to inventory
- [ ] Returned inverter appears in inventory list
- [ ] Inverter has correct remarks ("Returned from Kit Swap...")
- [ ] FIFO allocation works correctly

---

## Database Check

After save, verify in Supabase:

1. **used_inventory table:**
   - Record created with products consumed
   - Material costs calculated correctly

2. **inventory table:**
   - Original materials deducted (quantity decreased)
   - NEW entry created for returned inverter
   - Supplier: "Kit Swap - [Kit Name]"
   - Remarks: "Returned from [Kit Name] - Inverter swapped to [New Brand]"

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Inverter options not showing | Check if any selected product has `category: "Inverter"` |
| Price not updating | Verify inverter exists in inventory with unit_cost set |
| Inverter not returning | Check processInverterSwaps runs before save |
| Duplicate inverters in list | Check FIFO calculation logic |

---

## Files Modified

- ✅ `src/services/kitService.js` - NEW
- ✅ `src/components/UsedInventoryModal.jsx` - UPDATED

---

## Next Steps

1. Create `kitService.js` file with the service code
2. Update `UsedInventoryModal.jsx` with new functions and UI
3. Test the feature end-to-end
4. Verify inventory tracking in database

