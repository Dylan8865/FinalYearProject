import React, { useState } from "react";
import AddIslandInput from "./AddIslandInput";
import AddIslandSelect from "./AddIslandSelect";
import AddIslandButton from "./AddIslandButton";
import Button from "./Button";
import { useIslands } from "../../hooks/useIslands";

export interface Option {
  label: string;
  value: string;
}

interface EditIslandContentProps {
  setIsDialogOpen: React.Dispatch<React.SetStateAction<string>>;
  island: {
    id: string;
    name: string;
    genre: string;
    theme: string;
  };
  onIslandUpdated: () => void;
  noOfIslands: number;
}

const EditIslandContent = ({
  setIsDialogOpen,
  island,
  onIslandUpdated,
  noOfIslands,
}: EditIslandContentProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [disabled, setDisabled] = useState(false);

  const [value, setValue] = useState<{
    name: string;
    genre: string;
    theme: Option | null;
  }>({
    name: island.name,
    genre: island.genre,
    theme:
      {
        spring: { label: "Spring", value: "spring" },
        summer: { label: "Summer", value: "summer" },
        autumn: { label: "Autumn", value: "autumn" },
        winter: { label: "Winter", value: "winter" },
      }[island.theme] || null,
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

  const { updateIsland, deleteIsland } = useIslands();

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

    updateIsland(island.id, {
      name: value.name,
      genre: value.genre,
      theme: value.theme!.value,
    }).then((response) => {
      if (response) {
        onIslandUpdated();
        setIsDialogOpen("");
      }
    });
  };

  const handleDelete = async () => {
    if (confirmText !== "DELETE") {
      setDeleteError('Please type "DELETE" to confirm');
      return;
    }

    setDisabled(true);
    const success = await deleteIsland(island.id);
    if (success) {
      onIslandUpdated();
      setIsDialogOpen("");
    } else {
      setDeleteError("Failed to delete island");
    }
    setDisabled(false);
  };

  if (isDeleting) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center p-4">
        <div className="w-full space-y-6">
          <div className="space-y-3 rounded border-2 border-[#5a1a1a] bg-[#2d0a0a]/40 p-4">
            <p className="text-center font-bold text-[#ff6b6b]">
              This action cannot be undone!
            </p>
            <p className="text-center text-sm text-[#b8b8b8]">
              This will permanently delete:
            </p>
            <ul className="space-y-1 text-center text-sm text-[#b8b8b8]">
              <li>• Island "{island.name}"</li>
              <li>• All items on this island</li>
            </ul>
          </div>

          <div className="space-y-2">
            <label className="block text-center text-sm text-white">
              Type <span className="font-bold text-[#ff6b6b]">DELETE</span> to
              confirm:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full border-2 border-[#5a1a1a] bg-[#1a0a0a] p-3 text-center text-white placeholder-[#5a3a3a] focus:border-[#8B0000] focus:outline-none"
              placeholder="DELETE"
            />
          </div>

          {deleteError && (
            <div className="rounded border border-[#5a1a1a] bg-[#2d0a0a]/40 p-3 text-center text-sm text-[#ff6b6b]">
              {deleteError}
            </div>
          )}

          <div className="flex justify-center gap-4">
            <Button
              className="cursor-pointer border border-transparent bg-[#4a4a4a] transition hover:border-[#5a5a5a]"
              onClick={() => setIsDeleting(false)}
            >
              Cancel
            </Button>
            <Button
              className={`border border-[#5a1a1a] transition ${
                confirmText !== "DELETE"
                  ? "cursor-not-allowed bg-[#4a1a1a] opacity-50"
                  : "cursor-pointer bg-[#8B0000] hover:border-[#a00000]"
              }`}
              onClick={handleDelete}
              disabled={confirmText !== "DELETE"}
            >
              Delete
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center gap-4">
      <form className="flex w-[300px] flex-col gap-4" onSubmit={handleSubmit}>
        <h2 className="text-lg font-bold">Edit Your Island</h2>
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
          Save Changes
        </AddIslandButton>

        {noOfIslands > 1 && (
          <button
            type="button"
            onClick={() => setIsDeleting(true)}
            className="rounded-md border border-[#5a1a1a] p-3 text-sm font-semibold text-red-500 hover:border-[#a00000] hover:text-red-400 hover:underline"
          >
            Delete Island
          </button>
        )}
      </form>
    </div>
  );
};

export default EditIslandContent;
