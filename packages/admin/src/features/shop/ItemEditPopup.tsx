"use client";

import { useState, useRef } from "react";
import { updateItem, uploadItemImage, removeItemImage } from "@/actions/shop";

interface Item {
  id: string;
  name: string | null;
  type: string | null;
  mana_required: number | null;
  mana_rate: number | null;
  image_cover_path: string | null;
}

interface ItemEditModalProps {
  item: Item;
  onClose: () => void;
  onUpdate: () => void;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

export default function ItemEditModal({
  item,
  onClose,
  onUpdate,
  onError,
  onSuccess,
}: ItemEditModalProps) {
  const [name, setName] = useState(item.name || "");
  const [itemType, setItemType] = useState(item.type || "decorative");
  const [manaRequired, setManaRequired] = useState(
    item.mana_required?.toString() || "0"
  );
  const [manaRate, setManaRate] = useState(item.mana_rate?.toString() || "0");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [removingImage, setRemovingImage] = useState(false);
  const [showRemoveImageConfirm, setShowRemoveImageConfirm] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [imageError, setImageError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get image URL from Supabase public bucket
  const getImageUrl = (imagePath: string | null) => {
    if (imagePreview) return imagePreview;
    if (!imagePath || imageError) return null;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return `${supabaseUrl}/storage/v1/object/public/items/${imagePath}`;
  };

  const handleCopyID = async () => {
    try {
      await navigator.clipboard.writeText(item.id);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      // Silent fail
    }
  };

  // Handle image selection
  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      onError("File size exceeds 50MB limit");
      return;
    }

    // Validate file type
    const validTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/gif",
      "image/webp",
    ];
    if (!validTypes.includes(file.type)) {
      onError(
        "Invalid file type. Only PNG, JPG, JPEG, GIF, and WEBP are allowed"
      );
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setShowRemoveImageConfirm(true);
  };

  const handleRemoveImageConfirm = async () => {
    setRemovingImage(true);
    setShowRemoveImageConfirm(false);
    try {
      await removeItemImage(item.id);
      setImagePreview(null);
      setSelectedFile(null);
      setImageError(false);
      onSuccess("Image removed successfully!");
      onUpdate();
    } catch (error: any) {
      onError(error.message || "Failed to remove image");
    } finally {
      setRemovingImage(false);
    }
  };

  // Handle mana required input with max validation
  const handleManaRequiredChange = (value: string) => {
    const numValue = parseInt(value) || 0;
    if (numValue <= 9999999) {
      setManaRequired(value);
    }
  };

  // Handle mana rate input
  const handleManaRateChange = (value: string) => {
    const numValue = parseInt(value) || 0;
    if (numValue <= 999) {
      setManaRate(value);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Upload image first if selected
      if (selectedFile) {
        setUploadingImage(true);
        await uploadItemImage(item.id, selectedFile);
        setUploadingImage(false);
      }

      // Update item data
      await updateItem(item.id, {
        name,
        type: itemType,
        mana_required: parseInt(manaRequired) || 0,
        mana_rate: parseInt(manaRate) || 0,
      });

      onSuccess("Item updated successfully!");
      onUpdate();
    } catch (error: any) {
      onError(error.message || "Failed to update item");
    } finally {
      setIsLoading(false);
      setUploadingImage(false);
    }
  };

  const handleDiscard = () => {
    onClose();
  };

  // Shortened ID for display
  const shortID = item.id.slice(0, 8) + "..." + item.id.slice(-8);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-8">
      <div className="bg-[#333333] rounded-lg border border-[#3B3B3B] w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
        {/* Modal Header */}
        <div className="relative pb-2">
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-gray-400 hover:text-white text-2xl w-8 h-8 flex items-center justify-center rounded-full z-50"
          >
            ×
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 grid grid-cols-5 gap-6">
          {/* Left Side - 2 columns */}
          <div className="col-span-2 space-y-4">
            {/* Item Image */}
            <div>
              <label className="text-gray-400 text-xs mb-2 block">
                Item Image
              </label>
              <div
                onClick={handleImageClick}
                className="w-full aspect-square bg-[#1E1E1E] border-2 border-dashed border-[#3B3B3B] rounded-lg overflow-hidden cursor-pointer hover:border-[#7B7B7B] transition-colors relative group flex items-center justify-center p-2"
              >
                {getImageUrl(item.image_cover_path) ? (
                  <img
                    src={getImageUrl(item.image_cover_path)!}
                    alt={name || "Item"}
                    className="max-w-full max-h-full object-contain"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="text-gray-500 text-xs text-center">
                    No Image
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="text-white text-center">
                    <div className="text-sm">
                      Click to {selectedFile ? "change" : "upload"} image
                    </div>
                    <div className="text-xs text-gray-300 mt-1">Max 50MB</div>
                  </div>
                </div>
                {uploadingImage && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                    <div className="text-white text-sm">Uploading...</div>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
              {selectedFile && (
                <div className="mt-2 text-xs text-green-400">
                  ✓ New image selected: {selectedFile.name}
                </div>
              )}
              {(item.image_cover_path || imagePreview) && (
                <button
                  onClick={handleRemoveImage}
                  disabled={isLoading || removingImage || uploadingImage}
                  className="w-full mt-2 bg-red-900/20 hover:bg-red-900/30 text-red-400 border border-red-900/50 py-1.5 rounded transition-colors disabled:opacity-50 text-xs"
                >
                  {removingImage ? "Removing..." : "Remove Image"}
                </button>
              )}
            </div>

            {/* Item ID */}
            <div>
              <label className="text-gray-400 text-xs mb-1 block">
                Item ID
              </label>
              <div className="flex items-center gap-2">
                <div className="text-white text-sm font-mono" title={item.id}>
                  {shortID}
                </div>
                <button
                  onClick={handleCopyID}
                  className="text-gray-400 hover:text-white text-xs px-2 py-0.5 rounded border border-gray-600 hover:border-gray-400 transition-colors"
                >
                  {copySuccess ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={handleDiscard}
                disabled={isLoading}
                className="w-full bg-[#333333] hover:bg-[#4B4B4B] text-white border-2 border-[#4B4B4B] py-2 rounded transition-colors disabled:opacity-50"
              >
                Discard Changes
              </button>
              <button
                onClick={handleSave}
                disabled={isLoading || uploadingImage || removingImage}
                className="w-full bg-[#6D3F33] hover:bg-[#7B4A3A] text-white py-2 rounded transition-colors disabled:opacity-50"
              >
                {isLoading
                  ? "Saving..."
                  : uploadingImage
                  ? "Uploading Image..."
                  : "Save Changes"}
              </button>
            </div>
          </div>

          {/* Right Side - 3 columns */}
          <div className="col-span-3 space-y-4">
            {/* Item Name */}
            <div>
              <label className="text-gray-400 text-xs mb-2 block">
                Item Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#1E1E1E] text-white px-4 py-2 rounded border border-[#3B3B3B] focus:outline-none focus:border-[#7B7B7B]"
                placeholder="Enter item name"
              />
            </div>

            {/* Item Type */}
            <div>
              <label className="text-gray-400 text-xs mb-2 block">
                Item Type
              </label>
              <select
                value={itemType}
                onChange={(e) => setItemType(e.target.value)}
                className="w-full bg-[#1E1E1E] text-white px-4 py-2 rounded border border-[#3B3B3B] focus:outline-none focus:border-[#7B7B7B]"
              >
                <option value="decorative">Decorative</option>
                <option value="terrain">Terrain</option>
                <option value="functional">Functional</option>
              </select>
            </div>

            {/* Mana Required (Price) */}
            <div>
              <label className="text-gray-400 text-xs mb-2 block">
                Mana Required (Max: 9,999,999)
              </label>
              <input
                type="number"
                value={manaRequired}
                onChange={(e) => handleManaRequiredChange(e.target.value)}
                className="w-full bg-[#1E1E1E] text-white px-4 py-2 rounded border border-[#3B3B3B] focus:outline-none focus:border-[#7B7B7B]"
                placeholder="0"
                min="0"
                max="9999999"
              />
            </div>

            {/* Mana Rate */}
            <div>
              <label className="text-gray-400 text-xs mb-2 block">
                Mana Generation Rate Per Second (Max: 999)
              </label>
              <input
                type="number"
                value={manaRate}
                onChange={(e) => handleManaRateChange(e.target.value)}
                className="w-full bg-[#1E1E1E] text-white px-4 py-2 rounded border border-[#3B3B3B] focus:outline-none focus:border-[#7B7B7B]"
                placeholder="0"
                min="0"
                max="999"
              />
            </div>

            {/* Info Box */}
            <div className="bg-[#1E1E1E] border border-[#3B3B3B] rounded p-4 space-y-2 mt-4">
              <div className="text-gray-400 text-xs mb-2">
                Current Information
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-gray-400 text-xs">Current Price:</span>
                  <div className="text-white text-sm">
                    {item.mana_required?.toLocaleString() || "0"}
                  </div>
                </div>
                <div>
                  <span className="text-gray-400 text-xs">
                    Current Mana Rate:
                  </span>
                  <div className="text-white text-sm">
                    {item.mana_rate || "0"}/m
                  </div>
                </div>
                <div>
                  <span className="text-gray-400 text-xs">Current Type:</span>
                  <div className="text-white text-sm capitalize">
                    {item.type || "N/A"}
                  </div>
                </div>
                <div>
                  <span className="text-gray-400 text-xs">Image:</span>
                  <div className="text-white text-sm">
                    {item.image_cover_path || "None"}
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            <div className="bg-[#1E1E1E] border border-[#3B3B3B] rounded p-4">
              <div className="text-gray-400 text-xs mb-2">Note</div>
              <ul className="text-gray-400 text-xs space-y-1 list-disc list-inside">
                <li>
                  Image will be stored as {item.id}.extension in the items
                  bucket
                </li>
                <li>Accepted formats: PNG, JPG, JPEG, GIF, WEBP (Max: 50MB)</li>
                <li>Changes will be reflected immediately after saving</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Remove Image Confirmation Modal */}
      {showRemoveImageConfirm && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
          <div className="bg-[#1E1E1E] rounded-lg border border-red-900/50 p-6 w-full max-w-md">
            <h4 className="text-red-400 text-lg font-semibold mb-2">
              Remove Image
            </h4>
            <p className="text-white text-sm mb-4">
              Are you sure you want to remove this item's image? This action
              cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowRemoveImageConfirm(false)}
                disabled={removingImage}
                className="flex-1 bg-[#3B3B3B] hover:bg-[#4B4B4B] text-white py-2 rounded transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveImageConfirm}
                disabled={removingImage}
                className="flex-1 bg-[#800000] hover:bg-[#900000] text-white py-2 rounded transition-colors disabled:opacity-50"
              >
                {removingImage ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
