import React, { useState } from "react";
import AddIslandInput from "./AddIslandInput";
import AddIslandSelect from "./AddIslandSelect";
import AddIslandButton from "./AddIslandButton";
import { useIslands } from "../../hooks/useIslands";
import { useProfile } from "../../hooks/useProfile";

export interface Option {
  label: string;
  value: string;
}

interface AddIslandContentProps {
  setIsDialogOpen: React.Dispatch<React.SetStateAction<string>>;
  onIslandAdded: () => void;
  mana: number;
  onUpdateMana: (newMana: number) => void;
}

const AddIslandContent = ({
  setIsDialogOpen,
  onIslandAdded,
  mana,
  onUpdateMana,
}: AddIslandContentProps) => {
  const [value, setValue] = useState<{
    name: string;
    description: string;
    theme: Option | null;
  }>({
    name: "",
    description: "",
    theme: null,
  });

  const [errors, setErrors] = useState<{
    name: string;
    description: string;
    theme: string;
  }>({
    name: "",
    description: "",
    theme: "",
  });

  const [disabled, setDisabled] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue({ ...value, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const handleSelectChange = (option: Option) => {
    setValue({ ...value, theme: option });
    setErrors({ ...errors, theme: "" });
  };

  const { createIsland } = useIslands();
  const { updateProfile } = useProfile();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = {
      name: value.name ? "" : "This field is required",
      description: value.description ? "" : "This field is required",
      theme: value.theme ? "" : "This field is required",
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some((err) => err)) {
      return;
    }

    setDisabled(true);
    createIsland(value.name, value.description, value.theme!.value).then(
      (response) => {
        if (response) {
          const newMana = mana - 1_000_000;
          onIslandAdded();
          updateProfile({ mana: newMana });
          onUpdateMana(newMana);
          setIsDialogOpen("");
          setDisabled(false);
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
          id="islandDescription"
          name="description"
          type="text"
          placeholder="Island Description"
          color="#8cada5"
          width="100%"
          value={value.description}
          handleChange={handleChange}
          error={errors.description}
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

        <AddIslandButton color="#8cada5" width="100%" disabled={disabled}>
          Add Island
        </AddIslandButton>
      </form>
    </div>
  );
};

export default AddIslandContent;
