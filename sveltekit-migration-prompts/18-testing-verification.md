# 18 - Testing & Verification

## Prerequisites
- `01-project-setup.md` through `17-deployment-setup.md` completed

## Next Prompt
- None (this is the final prompt)

---

## MCP Servers to Use

For final testing and verification, these MCP servers may be helpful for troubleshooting:

| MCP Server | Usage |
|------------|-------|
| **svelte** | Use `get-documentation` for debugging Svelte components and `svelte-autofixer` to validate any fixes |
| **better-auth** | Use `search` or `chat` to troubleshoot any authentication issues |
| **cloudflare-docs** | Use `search_cloudflare_documentation` for production debugging, logs, and D1 queries |
| **context7** | Use for any library-specific issues (papaparse, xlsx) |

### Troubleshooting MCP Queries
```
If auth issues:
- better-auth MCP: search "troubleshooting session"
- better-auth MCP: chat "Why might session not persist after OAuth?"

If deployment issues:
- cloudflare-docs MCP: search "Workers debugging"
- cloudflare-docs MCP: search "wrangler tail"

If component issues:
- svelte MCP: svelte-autofixer on problematic component
- svelte MCP: get-documentation for specific feature
```

**Note**: This is the final testing prompt. MCP servers are for troubleshooting specific issues that arise during verification.

---

## Objective

Perform comprehensive testing of the migrated application to ensure all functionality works correctly. This is the final verification before considering the migration complete.

---

## Instructions

### Step 1: Functional Testing Checklist

#### Authentication Flow
- [ ] **Login page loads**: Visit /login, see Google sign-in button
- [ ] **Google OAuth works**: Click button, complete OAuth flow
- [ ] **Session persists**: Refresh page, still logged in
- [ ] **Logout works**: Click logout, redirected to login
- [ ] **Session expires**: After timeout, requires re-login

#### Authorization Flow
- [ ] **Authorized user**: Login with allowed email, see main UI
- [ ] **Unauthorized user**: Login with other email, see "Access Denied"
- [ ] **Email allowlist**: Verify brands.ts emails are checked

#### File Processing
- [ ] **CSV upload**: Drag and drop CSV file
- [ ] **File type validation**: Reject non-CSV files
- [ ] **Excel generation**: Download triggers automatically
- [ ] **File naming**: Output file named correctly

#### Courier Selection
- [ ] **Courier picker renders**: All courier options visible
- [ ] **Selection works**: Click to select courier
- [ ] **User default shown**: "Your default" label appears
- [ ] **Selection state**: Green border on selected

#### SteadFast Processing
- [ ] **Phone normalization**: +880 prefix removed
- [ ] **Invoice field**: Uses merchant_id
- [ ] **Contact info**: Includes brand name and phone
- [ ] **All fields populated**: Check Excel output

#### Pathao Processing
- [ ] **Order number**: Extracted correctly
- [ ] **Product name**: From lineitem
- [ ] **Address fields**: City, address separate
- [ ] **All fields populated**: Check Excel output

#### UI/UX
- [ ] **Loading states**: Spinner shows during load
- [ ] **Error states**: Errors display properly
- [ ] **Responsive design**: Works on mobile
- [ ] **Animations**: Transitions smooth

### Step 2: Create Test Script

**scripts/test-processing.ts:**
```typescript
/**
 * Test script for verifying courier processing
 * Run with: bun run scripts/test-processing.ts
 */

import { CourierService } from "../src/lib/services";
import { Courier } from "../src/lib/types";

const testData = [
    ["Name", "Email", "Financial Status", "Paid at", "Fulfillment Status", "Fulfilled at", "Accepts Marketing", "Currency", "Subtotal", "Shipping", "Taxes", "Total", "Discount Code", "Discount Amount", "Shipping Method", "Created at", "Lineitem quantity", "Lineitem name", "Lineitem price", "Lineitem compare at price", "Lineitem sku", "Lineitem requires shipping", "Lineitem taxable", "Lineitem fulfillment status", "Billing Name", "Billing Street", "Billing Address1", "Billing Address2", "Billing Company", "Billing City", "Billing Zip", "Billing Province", "Billing Country", "Billing Phone", "Shipping Name", "Shipping Street", "Shipping Address1", "Shipping Address2", "Shipping Company", "Shipping City", "Shipping Zip", "Shipping Province", "Shipping Country", "Shipping Phone", "Notes"],
    ["#13826", "test@example.com", "paid", "2024-01-15", "unfulfilled", "", "no", "BDT", "1200", "50", "0", "1250", "", "", "Standard", "2024-01-15", "1", "Product A", "1200", "", "SKU001", "yes", "yes", "", "John Doe", "123 Main St", "123 Main St", "Apt 4", "", "Dhaka", "1205", "Dhaka", "Bangladesh", "01712345678", "John Doe", "123 Main St", "123 Main St", "Apt 4", "", "Dhaka", "1205", "Dhaka", "Bangladesh", "+8801712345678", "Handle with care"],
    ["#13827", "test2@example.com", "paid", "2024-01-15", "unfulfilled", "", "no", "BDT", "800", "50", "0", "850", "", "", "Standard", "2024-01-15", "1", "Product B", "800", "", "SKU002", "yes", "yes", "", "Jane Smith", "456 Oak Ave", "456 Oak Ave", "", "", "Chittagong", "4000", "Chittagong", "Bangladesh", "01898765432", "Jane Smith", "456 Oak Ave", "456 Oak Ave", "", "", "Chittagong", "4000", "Chittagong", "Bangladesh", "01898765432", ""]
];

const testUser = {
    name: "Test Brand",
    phone: "01700000000",
    merchant_id: "12345"
};

console.log("Testing SteadFast Processing...");
const steadfastResult = CourierService.processOrders(Courier.SteadFast, testData, testUser);
console.log("SteadFast Result:", JSON.stringify(steadfastResult, null, 2));

console.log("\nTesting Pathao Processing...");
const pathaoResult = CourierService.processOrders(Courier.Pathao, testData, testUser);
console.log("Pathao Result:", JSON.stringify(pathaoResult, null, 2));

// Verify SteadFast phone normalization
const phone = steadfastResult[0]?.Phone;
if (phone && phone.startsWith("1") && !phone.includes("+")) {
    console.log("\n✓ Phone normalization working correctly");
} else {
    console.log("\n✗ Phone normalization issue:", phone);
}

// Verify merchant ID
if (steadfastResult[0]?.Invoice === testUser.merchant_id) {
    console.log("✓ Merchant ID correctly set as Invoice");
} else {
    console.log("✗ Merchant ID issue");
}

console.log("\n=== All tests completed ===");
```

### Step 3: Run Automated Checks

```bash
# TypeScript type checking
bun run check

# Linting
bun run lint

# Build (catches any build errors)
bun run build

# Preview (manual testing)
bun run preview
```

### Step 4: Manual E2E Testing

1. **Start the app locally**:
   ```bash
   bun run preview
   ```

2. **Test complete flow**:
   - Open http://localhost:8787
   - Click "Sign In"
   - Complete Google OAuth
   - Select courier (SteadFast or Pathao)
   - Upload test CSV
   - Verify Excel downloads
   - Check Excel content is correct
   - Click "Log Out"

### Step 5: Cross-Browser Testing

Test in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (if available)
- [ ] Mobile Chrome
- [ ] Mobile Safari

### Step 6: Performance Check

```bash
# Build and analyze
bun run build

# Check build output size
ls -la .svelte-kit/cloudflare/
```

Expected: Bundle should be under 500KB

### Step 7: Cleanup

Remove test/development pages before final deployment:

```bash
# Remove test pages
rm -rf src/routes/test-processing
rm -rf src/routes/asset-test
rm -rf src/routes/auth-test
rm -rf src/routes/style-check

# Remove test files
rm -f static/test-orders.csv
rm -f scripts/test-processing.ts
```

### Step 8: Final Production Deploy

```bash
# Final build and deploy
bun run deploy
```

### Step 9: Post-Deployment Verification

1. Visit production URL
2. Complete full user flow
3. Verify with real Shopify export file
4. Check Cloudflare analytics

---

## Verification Checklist

```markdown
## Final Migration Verification

### Code Quality
- [ ] No TypeScript errors (`bun run check`)
- [ ] No linting errors (`bun run lint`)
- [ ] Build succeeds (`bun run build`)

### Authentication
- [ ] Google OAuth login works
- [ ] Session persists across refreshes
- [ ] Logout clears session
- [ ] Email allowlist enforced

### Core Functionality
- [ ] CSV file upload works
- [ ] SteadFast processing correct
- [ ] Pathao processing correct
- [ ] Excel file downloads
- [ ] Phone normalization works

### UI/UX
- [ ] Visual design matches original
- [ ] Responsive on mobile
- [ ] Animations/transitions work
- [ ] All states render correctly

### Deployment
- [ ] Production deployed
- [ ] Secrets configured
- [ ] D1 database working
- [ ] No console errors
```

---

## Files to Remove Before Production

```bash
# Test routes
src/routes/test-processing/
src/routes/asset-test/
src/routes/auth-test/
src/routes/style-check/

# Test files
static/test-orders.csv
scripts/test-processing.ts

# Old Next.js files (after full verification)
src/app/
src/middleware.ts
next.config.ts
next-env.d.ts
.env.local
```

---

## Migration Complete!

Once all checks pass:

1. Delete old Next.js files
2. Update README.md with new setup instructions
3. Archive the migration prompts (or delete)
4. Celebrate!

---

## Rollback Plan

If issues are found in production:

1. **Quick rollback**: Re-deploy previous Next.js version to Vercel
2. **Fix and redeploy**: Fix issues and redeploy SvelteKit version
3. **Database**: D1 data is independent, no migration needed

---

## Notes

- Keep original Next.js app until fully verified in production
- Monitor Cloudflare analytics for any errors
- Better Auth session data in D1 persists across deploys
- This migration prompt series can be archived for reference
