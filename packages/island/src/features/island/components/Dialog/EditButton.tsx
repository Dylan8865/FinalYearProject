import React from "react";

interface EditButtonProps {
  fieldName: string;
  fieldValue: string;
}

const EditButton = ({ fieldName, fieldValue }: EditButtonProps) => {
  return (
    <div className="flex w-80 justify-between md:w-auto md:gap-4">
      <div className="flex items-center">{fieldName}</div>
      <div className="flex h-8 w-60 justify-between border-4 md:h-10 md:w-80">
        <div className="flex items-center ps-4 text-xs md:text-sm">
          {fieldValue}
        </div>
        <button className="flex w-10 items-center justify-center bg-[#e5e7eb] ps-1 text-xs font-semibold text-black md:text-sm">
          Edit
        </button>
      </div>
    </div>
  );
};

export default EditButton;
