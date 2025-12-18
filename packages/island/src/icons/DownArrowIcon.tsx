import React from "react";

interface DownArrowIconProps {
  className?: string;
}

const DownArrowIcon = ({ className }: DownArrowIconProps) => {
  return <i className={`hn hn-angle-down-solid ${className}`}></i>;
};

export default DownArrowIcon;
