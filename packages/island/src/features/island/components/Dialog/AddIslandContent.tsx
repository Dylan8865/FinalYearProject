import React from "react";
import AddIslandInput from "./AddIslandInput";
import AddIslandSelect from "./AdIslandSelect";
import AddIslandButton from "./AddIslandButton";

const AddIslandContent = () => {
  return (
    <div className="flex h-full w-full items-center justify-center gap-4">
      <div className="flex w-[300px] flex-col gap-4">
        <h2 className="text-lg font-bold">Customise Your Island</h2>
        <AddIslandInput
          id="islandName"
          type="text"
          placeholder="Island Name"
          color="#8cada5"
          width="100%"
        />
        <AddIslandInput
          id="islandGenre"
          type="text"
          placeholder="Island Genre"
          color="#8cada5"
          width="100%"
        />
        <AddIslandSelect
          id="islandTheme"
          color="#8cada5"
          width="100%"
          placeholder="Island Theme"
          options={[
            { label: "Spring", value: "spring" },
            { label: "Summer", value: "summer" },
            { label: "Autumn", value: "autumn" },
            { label: "Winter", value: "winter" },
          ]}
        />

        <AddIslandButton color="#8cada5" width="100%" onClick={() => {}}>
          Add Island
        </AddIslandButton>
      </div>
    </div>
  );
};

export default AddIslandContent;
