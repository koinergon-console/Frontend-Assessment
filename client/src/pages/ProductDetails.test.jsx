import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import axios from "axios";
import ProductDetails from "./ProductDetails";
import { getProductById } from "../services/products";
import { products } from "../fixtures/products";

vi.mock("../context/StateProvider", () => ({
  useStateAuth: () => ({ userData: { pkey: "test-key" }, state: {} }),
}));

vi.mock("../services/products", () => ({
  getProductById: vi.fn(),
}));

vi.mock("axios", () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

const renderAt = (url) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/home" element={<p>Product list</p>} />
        <Route path="/product-details/:id" element={<ProductDetails />} />
      </Routes>
    </MemoryRouter>
  );

describe("ProductDetails", () => {
  beforeEach(() => {
    axios.get.mockResolvedValue({
      data: { questions: [], isOrderIdTracking: false },
    });
  });

  it("shows a not-found message and a link back for a missing product", async () => {
    getProductById.mockResolvedValue(null);
    renderAt("/product-details/does-not-exist");

    expect(await screen.findByText("Product not found")).toBeInTheDocument();
    expect(getProductById).toHaveBeenCalledWith("does-not-exist");

    const backLink = screen.getByRole("link", { name: "Back to products" });
    expect(backLink).toHaveAttribute("href", "/home");

    fireEvent.click(backLink);
    expect(await screen.findByText("Product list")).toBeInTheDocument();
  });

  it("loads the product from the id in the url (works after a refresh)", async () => {
    getProductById.mockResolvedValue(products[1]);
    renderAt(`/product-details/${products[1].id}`);

    expect(await screen.findByText(products[1].name)).toBeInTheDocument();
    expect(getProductById).toHaveBeenCalledWith(products[1].id);
  });

  it("shows validation errors on the page instead of an alert", async () => {
    getProductById.mockResolvedValue(products[0]);
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    renderAt(`/product-details/${products[0].id}`);

    fireEvent.click(await screen.findByRole("button", { name: "Submit" }));

    expect(screen.getByText("Please enter your name.")).toBeInTheDocument();
    expect(screen.getByText("Please write a review.")).toBeInTheDocument();
    expect(alertSpy).not.toHaveBeenCalled();
    expect(axios.post).not.toHaveBeenCalled();

    fireEvent.change(screen.getByPlaceholderText("Your name..."), {
      target: { value: "Ashish" },
    });
    expect(screen.queryByText("Please enter your name.")).not.toBeInTheDocument();
  });

  it("disables the submit button while the request is running", async () => {
    getProductById.mockResolvedValue(products[0]);
    axios.post.mockReturnValue(new Promise(() => {}));
    renderAt(`/product-details/${products[0].id}`);

    fireEvent.change(await screen.findByPlaceholderText("Your name..."), {
      target: { value: "Ashish" },
    });
    fireEvent.change(screen.getByPlaceholderText("Write a detailed review..."), {
      target: { value: "Really comfortable and the battery lasts long." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    const button = await screen.findByRole("button", { name: "Submitting..." });
    expect(button).toBeDisabled();
    expect(axios.post).toHaveBeenCalledTimes(1);
  });
});
