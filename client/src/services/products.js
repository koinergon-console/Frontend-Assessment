import { products } from "../fixtures/products";

// Products come from a local fixture for now so the pages work without MetaMask.
// To go back to the contract, swap these for the calls in StateProvider.

const DELAY_MS = 300;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const getProducts = async () => {
  await wait(DELAY_MS);
  return products;
};

export const getProductById = async (id) => {
  await wait(DELAY_MS);
  return products.find((product) => product.id === String(id)) ?? null;
};
