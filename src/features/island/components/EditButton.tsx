import React from "react";

interface EditButtonProps {
  fieldName: string;
  fieldValue: string;
}

const EditButton = ({ fieldName, fieldValue }: EditButtonProps) => {
  return (
    <div className="flex gap-4 justify-between">
      <div className="flex items-center">{fieldName}</div>
      <div className="border-4 flex w-80 h-10 justify-between">
        <div className="flex items-center ps-4">{fieldValue}</div>
        <button className="bg-[#e5e7eb] text-black font-semibold flex justify-center items-center w-10 ps-1">
          Edit
        </button>
      </div>
    </div>
  );
};

export default EditButton;
