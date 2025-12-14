import React from "react";

interface ButtonProps {
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

const Button = ({ children, className, onClick, disabled }: ButtonProps) => {
  return (
    <button
      className={`${className} flex h-10 w-20 items-center justify-center`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;
