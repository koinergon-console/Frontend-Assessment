const CustomButton = ({ btnType, title, handleClick, styles, disabled = false }) => {
  return (
    <button
      type={btnType}
      className={`font-epilogue font-semibold text-[16px] leading-[26px] text-white px-4 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed ${styles}`}
      onClick={handleClick}
      disabled={disabled}
    >
      {title}
    </button>
  );
};

export default CustomButton;
