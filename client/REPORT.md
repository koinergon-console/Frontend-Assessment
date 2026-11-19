# Frontend Assessment - Report

Branch: `ashish-technical-assessment`

All changes are inside `client/`. Server, wallet, leaderboard and marketplace code is untouched.

## What I did

### 1. Product list - loading, empty and error states
- `src/pages/Home.jsx` tracks loading / error / products and passes them to `DisplayProducts`.
- `src/components/DisplayProducts.jsx` shows a loader, an empty message, or an error with a **Retry** button.
- If the request fails or returns nothing (`undefined`, `null`, `[]`) the page shows the right state instead of crashing.
- Also fixed: the product count included non-"ongoing" products, and the list used fragments without keys.

### 2. Product details works after a refresh
- `src/pages/ProductDetails.jsx` reads the id with `useParams()` and loads the product itself, instead of relying on router `state` (which is lost on a fresh load).
- Unknown id → "Product not found" with a **Back to products** link.
- The review questions request is now wrapped in try/catch so a backend error doesn't break the page.

### 3. Review form
- Errors are shown under each field instead of `alert()` (name, order id when tracking is on, review text, every question).
- If the answer validation service rejects an answer, the error is shown under that question.
- The submit button is disabled and shows "Submitting..." while the request runs. The loading state is reset in `finally`, so it can't get stuck after a failure.
- `CustomButton` got an optional `disabled` prop.

### 4. Fixture instead of MetaMask
- `src/fixtures/products.js` has 3 products in the same shape the contract's `getProducts()` returns.
- `src/services/products.js` exposes `getProducts()` and `getProductById(id)` and reads from the fixture. Switching back to the contract only means changing this file.
- `ProductDetails` now uses the contract instance from `StateProvider` instead of creating a second Web3 instance.

### 5. Tests
Vitest + React Testing Library, 8 tests:

| File | Tests |
|---|---|
| `src/pages/Home.test.jsx` | loading, empty list, request returns nothing, failed load + retry |
| `src/pages/ProductDetails.test.jsx` | missing product, loads from URL id, inline form errors, submit disabled while sending |

### 6. Responsive check
Checked the list and details pages at 375px, 768px and 1440px. Fixed the details page scrolling sideways on mobile/tablet (long owner address), removed justified text that left big gaps on small screens, and styled the back link as a button so a global link style in `Landing/navbar.css` doesn't turn it white.

## How to run

Tested with Node 20.11 and npm 10.2.

```bash
cd client
npm install
npm test        # runs all tests once
npm run dev     # starts the app on http://localhost:5173
```

### Viewing the pages locally
`/home` and `/product-details/:id` are behind the customer login (which needs a wallet). To open them without MetaMask, run this in the browser console and reload:

```js
localStorage.setItem("token", JSON.stringify({ type: "CUSTOMER" }));
```

### Environment variables
None are needed for the tests or for the product list / details pages. The existing app reads these from `client/.env` for other features:

| Variable | Used by |
|---|---|
| `VITE_CALLCHIMP_API_KEY` | call button / `StateProvider` |
| `VITE_CLOUDINARY_CLOUD_NAME` | create product image upload |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | create product image upload |

## Notes
- Without MetaMask the console shows `connection not open on send()`. That comes from the existing wallet setup in `StateProvider` (left alone as asked) and doesn't affect the pages.
- `npm run lint` still reports errors in files I didn't touch (they were there before). The files I changed are lint clean.
