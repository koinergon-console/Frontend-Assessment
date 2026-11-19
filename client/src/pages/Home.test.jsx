import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Home from "./Home";
import { getProducts } from "../services/products";
import { products } from "../fixtures/products";

// the layout components read from the wallet context, keep it out of these tests
vi.mock("../context/StateProvider", () => ({
  useStateAuth: () => ({ userData: {}, state: {} }),
}));

vi.mock("../services/products", () => ({
  getProducts: vi.fn(),
}));

const renderHome = () =>
  render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  );

describe("Home - product list", () => {
  it("shows a loader while products are loading", () => {
    getProducts.mockReturnValue(new Promise(() => {}));
    renderHome();

    expect(screen.getByAltText("Loading products")).toBeInTheDocument();
  });

  it("shows the empty state when there are no products", async () => {
    getProducts.mockResolvedValue([]);
    renderHome();

    expect(await screen.findByText("No products to display")).toBeInTheDocument();
    expect(screen.getByText("All Products (0)")).toBeInTheDocument();
  });

  it("shows the empty state when the request returns nothing", async () => {
    getProducts.mockResolvedValue(undefined);
    renderHome();

    expect(await screen.findByText("No products to display")).toBeInTheDocument();
  });

  it("shows an error with a retry button when loading fails", async () => {
    getProducts
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce(products);
    vi.spyOn(console, "error").mockImplementation(() => {});
    renderHome();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Something went wrong while loading products.");

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findByText(products[0].name)).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(getProducts).toHaveBeenCalledTimes(2);
  });
});
