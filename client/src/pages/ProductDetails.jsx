import { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { Countbox, CustomButton, Loader } from "../components";
import { loader, thirdweb } from "../assets";
import axios from "axios";
import { useStateAuth } from "../context/StateProvider";
import { getProductById } from "../services/products";
import { toast } from "react-toastify";

const emptyReview = {
  name: "",
  orderId: "",
  description: "",
  attachments: [],
  questionAnswers: [],
};

const validateReview = (review, questions, isOrderIdTracking) => {
  const errors = {};

  if (!review.name.trim()) {
    errors.name = "Please enter your name.";
  }
  if (isOrderIdTracking && !review.orderId.trim()) {
    errors.orderId = "Please enter your order ID.";
  }
  if (!review.description.trim()) {
    errors.description = "Please write a review.";
  }
  questions.forEach((question, index) => {
    if (!review.questionAnswers[index]?.answer?.trim()) {
      errors[`question-${index}`] = "Please answer this question.";
    }
  });

  return errors;
};

const FieldError = ({ message }) => {
  if (!message) return null;
  return (
    <p className="mt-1 font-epilogue text-[14px] text-[#ff6b6b]">{message}</p>
  );
};

const ProductDetails = () => {
  const { id } = useParams();
  const { pathname } = useLocation();
  const { userData, state } = useStateAuth();

  const [product, setProduct] = useState(null);
  const [isProductLoading, setIsProductLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [newReview, setNewReview] = useState(emptyReview);
  const [reviews] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [orderid, setorderid] = useState("null");
  const [isOrderIdTracking, setIsOrderIdTracking] = useState(false);

  const listPath = pathname.startsWith("/company") ? "/company" : "/home";

  useEffect(() => {
    let ignore = false;

    const loadProduct = async () => {
      setIsProductLoading(true);
      setLoadError("");
      try {
        const data = await getProductById(id);
        if (!ignore) setProduct(data);
      } catch (err) {
        console.error(err);
        if (!ignore) {
          setProduct(null);
          setLoadError("Something went wrong while loading this product.");
        }
      } finally {
        if (!ignore) setIsProductLoading(false);
      }
    };

    loadProduct();
    return () => {
      ignore = true;
    };
  }, [id]);

  const fetchReviewsAndQuestions = useCallback(async () => {
    try {
      const questionsResponse = await axios.get(
        `https://critiqall-backend.onrender.com/api/form/questions/${id}`
      );
      setQuestions(questionsResponse.data.questions ?? []);
      setIsOrderIdTracking(Boolean(questionsResponse.data.isOrderIdTracking));
    } catch (err) {
      console.error(err);
    }
  }, [id]);

  useEffect(() => {
    if (userData && product) fetchReviewsAndQuestions();
  }, [userData, product, fetchReviewsAndQuestions]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const formErrors = validateReview(newReview, questions, isOrderIdTracking);
    setErrors(formErrors);
    if (Object.keys(formErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      // only the short text answers go through the answer validation service
      const shortAnswers = newReview.questionAnswers
        .map((item, index) => ({ ...item, index }))
        .filter(({ index }) => questions[index]?.type === "short");

      if (shortAnswers.length > 0) {
        const validationRes = await axios.post(
          "http://localhost:8000/validate-answer2",
          {
            qna: shortAnswers.map(({ question, answer }) => ({
              question,
              answer,
            })),
          }
        );

        const answerErrors = {};
        validationRes.data.validation.split(" ,,,, ").forEach((result, i) => {
          if (result.trim() === "no" && shortAnswers[i]) {
            answerErrors[`question-${shortAnswers[i].index}`] =
              "This answer didn't pass validation. Please add more detail.";
          }
        });

        if (Object.keys(answerErrors).length > 0) {
          setErrors(answerErrors);
          return;
        }
      }

      setIsLoading(true);
      const rev = JSON.stringify(newReview);
      const res = await axios.post(
        "https://critiqall-backend.onrender.com/customers/sendmoney",
        {
          key: userData.pkey,
        }
      );

      if (res.data.status == true) {
        setNewReview(emptyReview);
        await BsubmitReview(orderid, rev);
      } else {
        setErrors({
          form: "We couldn't process your review right now. Please try again.",
        });
      }
    } catch (error) {
      console.error(error);
      setErrors({
        form: "Something went wrong while submitting your review. Please try again.",
      });
    } finally {
      setIsLoading(false);
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "orderId") {
      setorderid(value);
    }
    setNewReview((prevReview) => ({
      ...prevReview,
      [name]: value,
    }));
    setErrors((prevErrors) => ({ ...prevErrors, [name]: undefined }));
  };

  const handleQuestionAnswerChange = (e, index) => {
    const { value } = e.target;
    setNewReview((prevReview) => {
      const newQuestionAnswers = [...prevReview.questionAnswers];
      newQuestionAnswers[index] = {
        question: questions[index].q,
        answer: value,
      };
      return {
        ...prevReview,
        questionAnswers: newQuestionAnswers,
      };
    });
    setErrors((prevErrors) => ({
      ...prevErrors,
      [`question-${index}`]: undefined,
    }));
  };
  /////////////////////////////////////////////////

  const { ethereum } = window;

  const BsubmitReview = async (oid, rev) => {
    const { contract } = state;
    const accountss = await ethereum.request({
      method: "eth_requestAccounts",
    });
    try {
      // NewReview(string memory orderID, string memory prodID, string memory review)
      const res = await contract.methods
        .NewReview(oid.toString(), id, rev)
        .send({ from: accountss[0] });

      console.log(res);

      toast.success(res.events.event1.returnValues[0]);
      window.location.reload();
    } catch (err) {
      console.log(err);
    }
  };

  ////////////////////////////////////////////////
  if (isProductLoading) {
    return (
      <div className="flex justify-center mt-10">
        <img
          src={loader}
          alt="Loading product"
          className="w-[100px] h-[100px] object-contain"
        />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mt-10 flex flex-col items-start gap-4">
        <h2 className="font-epilogue font-semibold text-[20px] text-white">
          {loadError ? "Couldn't load this product" : "Product not found"}
        </h2>
        <p className="font-epilogue text-[16px] text-[#808191]">
          {loadError ||
            "The product you're looking for doesn't exist or was removed."}
        </p>
        <Link
          to={listPath}
          className="font-epilogue font-semibold text-[16px] text-[#8c6dfd] hover:text-[#00cec9]"
        >
          Back to products
        </Link>
      </div>
    );
  }

  return (
    <div>
      {isLoading && <Loader />}

      <div className="w-full flex md:flex-row flex-col mt-10 gap-[30px]">
        <div className="flex-1 flex-col">
          <img
            src={product.prodimg}
            alt="Product"
            className="w-full h-[410px] object-cover rounded-xl"
          />
          <div className="relative w-full h-[5px] bg-[#3a3a43] mt-2">
            {/* Progress bar implementation */}
          </div>
        </div>

        <div className="flex md:w-1/2 flex-wrap justify-between gap-[20px]">
          <Countbox
            title="Price"
            value={(Number(product.amt) / Math.pow(10, 18)).toFixed(2) + " AVAX"}
          />
          <Countbox title="Reviews" value={product.reviewCount} />
          <Countbox title="Min Review" value={product.min_review_count} />
          <div>
            <h4 className="font-epilogue font-semibold text-[18px] text-white mt-8">
              Product Details
            </h4>

            <div className="mt-[20px] flex flex-row items-center flex-wrap gap-[14px]">
              <div className="w-[52px] h-[52px] flex items-center justify-center rounded-full bg-[#2c2f32] cursor-pointer">
                <img
                  src={thirdweb}
                  alt="user"
                  className="w-[60%] h-[60%] object-contain"
                />
              </div>
              <div>
                <h4 className="font-epilogue font-semibold text-[14px] text-white break-all">
                  {product.name}
                </h4>
                <p className="mt-[4px] font-epilogue font-medium text-[12px] text-[#808191]">
                  {product.company_name}
                </p>
              </div>
            </div>

            <h4 className="font-epilogue font-semibold text-[18px] text-white mt-8">
              Description
            </h4>

            <div className="mt-[20px] font-epilogue font-normal text-[16px] text-[#808191] leading-[26px] text-justify">
              <p>{product.prod_Details}</p>
              <p>Status : {product.status}</p>
              <p>
                Next Amt :{" "}
                {(Number(product.nextAmount) / Math.pow(10, 18)).toFixed(4)} AVAX
              </p>
              <p>Owner : {product.owner}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-[60px] flex lg:flex-row flex-col gap-5">
        <div className="flex-1 flex flex-col gap-[40px]">
          <div>
            <h4 className="font-epilogue font-semibold text-[18px] text-white ">
              Reviews
            </h4>

            <div className="mt-[20px] flex flex-col gap-4">
              {reviews.length > 0 ? (
                reviews.map((item, index) => (
                  <div
                    key={`${item.donator}-${index}`}
                    className="flex justify-between items-center gap-4"
                  >
                    <p className="font-epilogue font-normal text-[16px] text-[#b2b3bd] leading-[26px] break-ll">
                      {index + 1}. {item.donator}
                    </p>
                    <p className="font-epilogue font-normal text-[16px] text-[#808191] leading-[26px] break-ll">
                      {item.donation}
                    </p>
                  </div>
                ))
              ) : (
                <p className="font-epilogue font-normal text-[16px] text-[#808191] leading-[26px] text-justify">
                  No reviews yet. Be the first one!
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1">
          <h4 className="font-epilogue font-semibold text-[18px] text-white uppercase">
            Feedback
          </h4>

          <div className="mt-8 flex flex-col p-4 bg-[#1c1c24] rounded-[10px]">
            <p className="font-epilogue fount-medium text-[20px] leading-[30px] text-center text-[#808191]">
              Review the Product
            </p>
            <form onSubmit={handleReviewSubmit} noValidate className="mt-4">
              <input
                required
                name="name"
                type="text"
                placeholder="Your name..."
                className="w-full py-2 my-2 sm:px-[20px] px-[15px] outline-none border-[1px] border-[#3a3a43] bg-transparent font-epilogue text-white text-[18px] leading-[30px] placeholder:text-[#4b5264] rounded-[10px]"
                value={newReview.name}
                onChange={handleInputChange}
              />
              <FieldError message={errors.name} />
              {isOrderIdTracking && (
                <>
                  <input
                    required
                    name="orderId"
                    type="text"
                    placeholder="Order ID..."
                    className="w-full py-2 my-2 sm:px-[20px] px-[15px] outline-none border-[1px] border-[#3a3a43] bg-transparent font-epilogue text-white text-[18px] leading-[30px] placeholder:text-[#4b5264] rounded-[10px]"
                    value={newReview.orderId}
                    onChange={handleInputChange}
                  />
                  <FieldError message={errors.orderId} />
                  <input
                    type="file"
                    name="attachments"
                    placeholder="Attach images..."
                    className="w-full py-3 my-2 sm:px-[20px] px-[15px] outline-none border-[1px] border-[#3a3a43] bg-transparent font-epilogue text-[#4b5264] leading-[30px]  rounded-[10px]"
                    onChange={(e) =>
                      setNewReview({
                        ...newReview,
                        attachments: e.target.files,
                      })
                    }
                  />
                </>
              )}

              <textarea
                required
                id="description"
                name="description"
                rows={4}
                placeholder="Write a detailed review..."
                className="w-full py-2 my-2 sm:px-[20px] px-[15px] outline-none border-[1px] border-[#3a3a43] bg-transparent font-epilogue text-white text-[18px] leading-[30px] placeholder:text-[#4b5264] rounded-[10px]"
                value={newReview.description}
                onChange={handleInputChange}
              />
              <FieldError message={errors.description} />

              <div className="my-[20px] p-4 bg-[#13131a] rounded-[10px]">
                <h4 className="font-epilogue font-semibold text-[14px] leading-[22px] text-white">
                  Back it because you believe in it.
                </h4>
                <p className="mt-2 font-epilogue font-normal leading-[22px] text-[#808191]">
                  Support the product because it speaks to you.
                </p>
              </div>

              {/* Render questions dynamically */}
              {questions.map((question, index) => (
                <div key={index} className="my-4">
                  <label
                    className="font-epilogue font-semibold text-[16px] text-white"
                    htmlFor={`question-${index}`}
                  >
                    {question.q}
                  </label>
                  {question.type === "short" ? (
                    <textarea
                      id={`question-${index}`}
                      name={`question-${index}`}
                      rows={2}
                      placeholder="Your answer..."
                      className="w-full py-2 my-2 sm:px-[20px] px-[15px] outline-none border-[1px] border-[#3a3a43] bg-transparent font-epilogue text-white text-[18px] leading-[30px] placeholder:text-[#4b5264] rounded-[10px]"
                      onChange={(e) => handleQuestionAnswerChange(e, index)}
                    />
                  ) : (
                    question.options.map((option, optionIndex) => (
                      <div key={optionIndex} className="flex items-center my-2">
                        <input
                          type="radio"
                          id={`question-${index}-option-${optionIndex}`}
                          name={`question-${index}`}
                          value={option}
                          className="mr-2"
                          onChange={(e) => handleQuestionAnswerChange(e, index)}
                        />
                        <label
                          htmlFor={`question-${index}-option-${optionIndex}`}
                          className="font-epilogue font-normal text-[16px] text-white"
                        >
                          {option}
                        </label>
                      </div>
                    ))
                  )}
                  <FieldError message={errors[`question-${index}`]} />
                </div>
              ))}

              {errors.form && (
                <p
                  role="alert"
                  className="mb-3 font-epilogue text-[14px] text-[#ff6b6b]"
                >
                  {errors.form}
                </p>
              )}

              <CustomButton
                btnType="submit"
                title={isSubmitting ? "Submitting..." : "Submit"}
                disabled={isSubmitting}
                styles="w-full bg-[#8c6dfd] hover:bg-[#00cec9] transition duration-500"
              />
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
