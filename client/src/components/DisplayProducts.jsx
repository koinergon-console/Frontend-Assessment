import { useNavigate } from "react-router-dom";
import ProductCard from "./ProductCard";
import CustomButton from "./CustomButton";
import { loader } from "../assets";

const DisplayProducts = ({ title, isLoading, error, products = [], onRetry }) => {
  const navigate = useNavigate();
  const ongoingProducts = products.filter(
    (product) => product.status === "ongoing"
  );

  const handleNavigate = (product) => {
    navigate(`/product-details/${product.id}`);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <img
          src={loader}
          alt="Loading products"
          className="w-[100px] h-[100px] object-contain"
        />
      );
    }

    if (error) {
      return (
        <div role="alert" className="flex flex-col items-start gap-4">
          <p className="font-epilogue font-semibold text-[14px] leading-[30px] text-[#ff6b6b]">
            {error}
          </p>
          <CustomButton
            btnType="button"
            title="Retry"
            handleClick={onRetry}
            styles="bg-[#8c6dfd] hover:bg-[#00cec9] transition duration-500"
          />
        </div>
      );
    }

    if (ongoingProducts.length === 0) {
      return (
        <p className="font-epilogue font-semibold text-[14px] leading-[30px] text-[#818183]">
          No products to display
        </p>
      );
    }

    return ongoingProducts.map((product) => (
      <ProductCard
        key={product.id}
        {...product}
        handleClick={() => handleNavigate(product)}
      />
    ));
  };

  return (
    <div>
      <h1 className="font-epilogue font-semibold text-[18px] text-white text-left">
        {title} ({ongoingProducts.length})
      </h1>

      <div className="flex flex-wrap mt-[20px] gap-[26px]">
        {renderContent()}
      </div>
    </div>
  );
};

export default DisplayProducts;
