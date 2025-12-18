import React, { useState } from "react";
import AddIslandInput from "./AddIslandInput";
import AddIslandSelect from "./AdIslandSelect";
import AddIslandButton from "./AddIslandButton";
import { useIslands } from "../../hooks/useIslands";

export interface Option {
  label: string;
  value: string;
}

interface AddIslandContentProps {
  setIsDialogOpen: React.Dispatch<React.SetStateAction<string>>;
  onIslandAdded: () => void;
}

const AddIslandContent = ({
  setIsDialogOpen,
  onIslandAdded,
}: AddIslandContentProps) => {
  const [value, setValue] = useState<{
    name: string;
    genre: string;
    theme: Option | null;
  }>({
    name: "",
    genre: "",
    theme: null,
  });

  const [errors, setErrors] = useState<{
    name: string;
    genre: string;
    theme: string;
  }>({
    name: "",
    genre: "",
    theme: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue({ ...value, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const handleSelectChange = (option: Option) => {
    setValue({ ...value, theme: option });
    setErrors({ ...errors, theme: "" });
  };

  const { createIsland } = useIslands();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = {
      name: value.name ? "" : "This field is required",
      genre: value.genre ? "" : "This field is required",
      theme: value.theme ? "" : "This field is required",
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some((err) => err)) {
      return;
    }

    createIsland(value.name, value.genre, value.theme!.value).then(
      (response) => {
        if (response) {
          onIslandAdded();
          setIsDialogOpen("");
        }
      }
    );
  };

  return (
    <div className="flex h-full w-full items-center justify-center gap-4">
      <form className="flex w-[300px] flex-col gap-4" onSubmit={handleSubmit}>
        <h2 className="text-lg font-bold">Customise Your Island</h2>
        <AddIslandInput
          id="islandName"
          name="name"
          type="text"
          placeholder="Island Name"
          color="#8cada5"
          width="100%"
          value={value.name}
          handleChange={handleChange}
          error={errors.name}
        />
        <AddIslandInput
          id="islandGenre"
          name="genre"
          type="text"
          placeholder="Island Genre"
          color="#8cada5"
          width="100%"
          value={value.genre}
          handleChange={handleChange}
          error={errors.genre}
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
          value={value.theme}
          handleChange={handleSelectChange}
          error={errors.theme}
        />

        <AddIslandButton color="#8cada5" width="100%">
          Add Island
        </AddIslandButton>
      </form>
    </div>
  );
};

export default AddIslandContent;
