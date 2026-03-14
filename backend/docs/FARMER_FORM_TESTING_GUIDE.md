# 🧪 Farmer Form - Quick Test Guide

## ⚡ Quick Start (5 minutes)

### Prerequisites
```bash
# Terminal 1: Start Backend
cd backend
npm run dev

# Terminal 2: Start Frontend
cd frontend
npm run dev
```

**Expected Output:**
- Backend: "✓ Server running on port 5000"
- Frontend: "VITE ready in XXX ms"
- No errors in console

---

## 🎯 Test Case 1: Load Vegetables (1 min)

### Steps:
1. Login as Farmer
2. Navigate to "Publish Order" page
3. Open browser DevTools (F12 → Console)

### Expected Results:
- ✅ Page loads without white screen
- ✅ "Select Vegetable" dropdown visible
- ✅ Console shows: `✓ Fetched X vegetables from API`
- ✅ Dropdown has options (e.g., "VEG001 - Tomato")
- ✅ No red errors in console

### Debug if Failed:
```
Check console for:
❌ CORS error → Backend CORS not configured
❌ 401 error → Token issue, login again
❌ Connection refused → Backend not running
```

---

## 🎯 Test Case 2: Select Vegetable (2 min)

### Steps:
1. Click vegetable dropdown
2. Select any vegetable (e.g., "Tomato")
3. Watch the price field

### Expected Results:
- ✅ Dropdown shows all vegetables
- ✅ Selection updates form
- ✅ Console shows: `[Changed] Selected vegetable: Tomato`
- ✅ Price field shows loading message
- ✅ After 1-2 seconds, price auto-fills

### Expected Price Field States:
**Scenario 1: Price Available**
```
Price field: ₨ 45.50
Message: ✓ Market price: ₨45.50/kg (Auto-filled)
```

**Scenario 2: No Price**
```
Price field: (empty)
Message: ⚠ No market price available for this vegetable
```

---

## 🎯 Test Case 3: Auto-Price Population (2 min)

### Steps:
1. Select vegetable with known price
2. Observe price field
3. Check console

### Expected Results:
- ✅ Price field auto-fills (no manual entry needed)
- ✅ Unit field updates (kg, lb, dozen)
- ✅ Console shows: `[Auto-Price] Loaded price for vegetable: ₨X/kg`
- ✅ Message shows: "✓ Market price: ₨X/kg (Auto-filled)"
- ✅ Price field is read-only (can't edit)

### Test All Units:
```
Tomato:    ₨45.50/kg ✓
Carrot:    ₨30.00/kg ✓
Cabbage:   ₨20.00/dozen ✓
```

---

## 🎯 Test Case 4: Form Submission (2 min)

### Steps:
1. Select vegetable (auto-fills price)
2. Enter quantity: 100
3. Select unit: kg
4. Enter location: "Colombo"
5. Click "Publish Order"

### Expected Results:
- ✅ Form submits successfully
- ✅ Success message: "Order published successfully!"
- ✅ Form resets after 3 seconds
- ✅ Vegetable dropdown resets to empty

### Summary Should Show:
```
Vegetable: VEG001 - Tomato
Quantity: 100 kg
Unit Price: ₨ 45.50
Total Price: ₨ 4550.00
```

---

## 🎯 Test Case 5: Error Handling (1 min)

### Test Backend Disconnect:
1. Stop backend server
2. Refresh page
3. Try to select vegetable

**Expected:**
```
Error: Failed to load vegetables. Ensure backend is running on port 5000.
No vegetables available. Check backend connection.
```

### Test No Token:
1. Clear localStorage
2. Refresh page
3. Try to access form

**Expected:**
```
Error: Please login to continue
```

### Test Missing Price:
1. Select vegetable with no market price
2. Check price field

**Expected:**
```
Price field: (empty)
Message: ⚠ No market price available for this vegetable
```

---

## 📋 Complete Test Checklist

### On Page Load
- [ ] No JavaScript errors
- [ ] Vegetables dropdown populated
- [ ] Console log: "✓ Fetched X vegetables"
- [ ] Console log: "✓ Fetched prices for X vegetables"
- [ ] Error message cleared

### On Vegetable Selection
- [ ] Form state updates
- [ ] Console log: "[Changed] Selected vegetable: X"
- [ ] Price field shows loading state briefly
- [ ] Price field auto-fills after loading

### On Form Submission
- [ ] All form data sent to backend
- [ ] Success message displays
- [ ] Form resets
- [ ] Can publish another order immediately

### On Network Error
- [ ] Error message shows
- [ ] Form doesn't crash
- [ ] Can retry after fixing network

### Mobile/Responsive
- [ ] Dropdown works on mobile
- [ ] Price updates on tablet
- [ ] Layout responsive on all sizes

---

## 🔧 Code Inspection (Optional)

### Check Vegetable Options:
```javascript
// Open DevTools Console
console.log(document.querySelector('select').length) // Should be > 1
```

### Verify Price Map:
```javascript
// In browser console (need to modify component to expose state)
window.__vegetablePrices  // Should show price mapping
```

### Monitor API Calls:
```
DevTools → Network tab
Look for:
✓ GET /api/vegetables (should be 200)
✓ GET /api/admin/market-prices (should be 200)
✓ POST /api/farmer/publish-order (should be 201)
```

---

## ✅ Pass/Fail Criteria

### PASS If:
- ✅ Vegetables load automatically
- ✅ Can select vegetable from dropdown
- ✅ Price auto-fills correctly
- ✅ Form submits successfully
- ✅ Error messages appear appropriately
- ✅ No console errors (except CORS warnings)

### FAIL If:
- ❌ Vegetables don't load
- ❌ Dropdown is empty
- ❌ Price doesn't auto-fill
- ❌ Form crashes on submission
- ❌ JavaScript errors in console
- ❌ Connection refused error

---

## 🐛 Common Issues & Fixes

### Issue: "Failed to load vegetables"
```
Fix:
1. Check backend is running: npm run dev
2. Verify port 5000: lsof -i :5000
3. Clear browser cache: Ctrl+Shift+Delete
4. Check token: localStorage.getItem('token')
```

### Issue: Price doesn't load
```
Fix:
1. Check market prices exist in DB
2. Verify pricePerKg field is set
3. Check vegetableId matches in both models
4. Look for errors in Network tab
```

### Issue: Form doesn't submit
```
Fix:
1. Check all required fields filled
2. Look for errors in Network tab
3. Check backend logs
4. Verify token is valid
```

### Issue: Dropdown is empty
```
Fix:
1. Check vegetables in database
2. Verify API response: curl http://localhost:5000/api/vegetables
3. Check authentication token
4. Look for CORS errors in console
```

---

## 📊 Expected API Responses

### GET /api/vegetables Success:
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "vegetableId": "VEG001",
      "name": "Tomato",
      "category": "Vegetable",
      "defaultUnit": "kg"
    }
  ]
}
```

### GET /api/admin/market-prices Success:
```json
{
  "total": 5,
  "prices": [
    {
      "vegetableId": "507f1f77bcf86cd799439011",
      "pricePerKg": 45.50,
      "unit": "kg",
      "priceChangePercentage": 2.5
    }
  ]
}
```

### POST /api/farmer/publish-order Success:
```json
{
  "success": true,
  "message": "Order published successfully",
  "order": {
    "_id": "...",
    "vegetableId": "VEG001",
    "quantity": 100,
    "unit": "kg",
    "pricePerUnit": 45.50
  }
}
```

---

## 🚀 Testing Summary

**Estimated Total Time:** 10-15 minutes

**What to Verify:**
1. ✅ Data loads dynamically
2. ✅ Selection works correctly
3. ✅ Prices auto-populate
4. ✅ Form submits successfully
5. ✅ Errors handled gracefully

**Result:** Component is **PRODUCTION READY** when all tests pass! ✨

