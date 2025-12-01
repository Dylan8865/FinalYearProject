import React from "react";

interface IconProps {
  className?: string;
}

const WILogo: React.FC<IconProps> = ({ className }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M15 27H12V30H15V27ZM15 27H27V24H24V12H27V9H21V12H18V15H21V24H15V27ZM0 36H33V30H30V33H12V30H9V33H0V36ZM12 18H15V12H12V18ZM27 30H30V27H27V30ZM9 9H12V6H9V9ZM15 12H18V9H15V12ZM12 6H18V3H12V6ZM18 9H21V6H18V9ZM27 15H30V12H27V15ZM21 6H27V3H21V6Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default WILogo;
