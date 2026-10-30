
🚀 Technical Assessment 🚀

-Work only in client/. 
-On the product list, show loading, empty, and error states. The page must not crash when the product request fails or returns nothing. Add a retry button on the error state.
-Make /product-details/:id still show the product after a refresh. Read the id from the URL. If the product does not exist, show a not-found message and a link back to the list.
-On the review form, show validation errors on the page instead of alert(), and disable the submit button while the request is running.
-Add a test runner and at least 3 tests: empty list, failed load, and a missing product. npm test inside client/ must pass.
-Use a small fixture for products so this runs without MetaMask. Leave the server, wallet, leaderboard, and marketplace alone.