import React from "react";

interface ButtonProps {
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const Button = ({ children, className, onClick }: ButtonProps) => {
  return (
    <div
      className={`${className} w-20 h-10 flex justify-center items-center`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Button;
