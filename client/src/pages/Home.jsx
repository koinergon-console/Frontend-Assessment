import { useState, useEffect, useCallback } from "react";

import { DisplayProducts } from "../components";
import { getProducts } from "../services/products";

const Home = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [products, setProducts] = useState([]);

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await getProducts();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setProducts([]);
      setError("Something went wrong while loading products.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  return (
    <DisplayProducts
      title="All Products"
      isLoading={isLoading}
      error={error}
      products={products}
      onRetry={loadProducts}
    />
  );
};

export default Home;
