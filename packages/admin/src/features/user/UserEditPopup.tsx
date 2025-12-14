"use client";

import { useState } from "react";
import { updateUser, deleteUser, resetUser } from "@/actions/user";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  created_at: string;
  last_login_time: string | null;
  mana: number | null;
  level: number | null;
  type: string | null;
}

interface UserEditModalProps {
  user: User;
  onClose: () => void;
  onUpdate: () => void;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

export default function UserEditModal({ user, onClose, onUpdate, onError, onSuccess }: UserEditModalProps) {
  const [mana, setMana] = useState(user.mana?.toString() || "0");
  const [level, setLevel] = useState(user.level?.toString() || "0");
  const [accountType, setAccountType] = useState(user.type || "island");
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);

  // Handle mana input with max validation
  const handleManaChange = (value: string) => {
    const numValue = parseInt(value) || 0;
    if (numValue <= 999999999) {
      setMana(value);
    }
  };

  // Handle level input with max 20 validation
  const handleLevelChange = (value: string) => {
    const numValue = parseInt(value) || 0;
    if (numValue <= 20) {
      setLevel(value);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    
    // Handle different timestamp formats
    let date: Date;
    if (dateString.includes('+') || dateString.includes('Z')) {
      // Already has timezone info, parse directly
      date = new Date(dateString);
    } else {
      // No timezone info, treat as UTC
      const utcString = dateString.replace(' ', 'T') + 'Z';
      date = new Date(utcString);
    }
    
    if (isNaN(date.getTime())) return "Invalid Date";
    
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleCopyUID = async () => {
    try {
      await navigator.clipboard.writeText(user.id);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      // Silent fail - clipboard API might not be available
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateUser(user.id, {
        mana: parseInt(mana) || 0,
        level: parseInt(level) || 0,
        type: accountType,
      });
      onUpdate();
      onSuccess("User updated successfully!");
    } catch (error) {
      onError("Failed to update user");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiscard = () => {
    setMana(user.mana?.toString() || "0");
    setLevel(user.level?.toString() || "0");
    setAccountType(user.type || "island");
  };

  const handleDeleteConfirm = async () => {
    if (confirmText !== "DELETE") return;

    setIsLoading(true);
    setShowDeleteConfirm(false);
    
    try {
      await deleteUser(user.id);
      onSuccess("User deleted successfully!");
      onUpdate();
      onClose();
    } catch (error: any) {
      onError(error.message || "Failed to delete user");
      onClose();
    } finally {
      setIsLoading(false);
      setConfirmText("");
    }
  };

  const handleResetConfirm = async () => {
    if (confirmText !== "RESET") return;

    setIsLoading(true);
    setShowResetConfirm(false);
    
    try {
      await resetUser(user.id);
      onSuccess("User data reset successfully!");
      onUpdate();
      onClose();
    } catch (error: any) {
      onError(error.message || "Failed to reset user");
      onClose();
    } finally {
      setIsLoading(false);
      setConfirmText("");
    }
  };

  // Shortened UID for display
  const shortUID = user.id.slice(0, 8) + "..." + user.id.slice(-8);

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
            {/* Username */}
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Username</label>
              <div className="text-white text-lg font-semibold">{user.name || "N/A"}</div>
            </div>

            {/* UID */}
            <div>
              <label className="text-gray-400 text-xs mb-1 block">User ID</label>
              <div className="flex items-center gap-2">
                <div className="text-white text-sm font-mono" title={user.id}>
                  {shortUID}
                </div>
                <button
                  onClick={handleCopyUID}
                  className="text-gray-400 hover:text-white text-xs px-2 py-0.5 rounded border border-gray-600 hover:border-gray-400 transition-colors"
                >
                  {copySuccess ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Email</label>
              <div className="bg-[#1E1E1E] border border-[#3B3B3B] rounded px-3 py-2 text-white text-sm">
                {user.email || "N/A"}
              </div>
            </div>

            {/* Account Info Box */}
            <div className="bg-[#1E1E1E] border border-[#3B3B3B] rounded p-4 space-y-2">
              <div>
                <span className="text-gray-400 text-xs">Account Creation:</span>
                <div className="text-white text-sm">{formatDate(user.created_at)}</div>
              </div>
              <div>
                <span className="text-gray-400 text-xs">Last Login Time:</span>
                <div className="text-white text-sm">{formatDate(user.last_login_time)}</div>
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
                disabled={isLoading}
                className="w-full bg-[#6D3F33] hover:bg-[#7B4A3A] text-white py-2 rounded transition-colors disabled:opacity-50"
              >
                {isLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>

          {/* Right Side - 3 columns */}
          <div className="col-span-3 space-y-4">
            {/* Mana */}
            <div>
              <label className="text-gray-400 text-xs mb-2 block">Mana (Max: 999,999,999)</label>
              <input
                type="number"
                value={mana}
                onChange={(e) => handleManaChange(e.target.value)}
                className="w-full bg-[#1E1E1E] text-white px-4 py-2 rounded border border-[#3B3B3B] focus:outline-none focus:border-[#7B7B7B]"
                placeholder={user.mana?.toString() || "0"}
                min="0"
                max="999999999"
              />
            </div>

            {/* Level */}
            <div>
              <label className="text-gray-400 text-xs mb-2 block">Level (Max: 20)</label>
              <input
                type="number"
                value={level}
                onChange={(e) => handleLevelChange(e.target.value)}
                className="w-full bg-[#1E1E1E] text-white px-4 py-2 rounded border border-[#3B3B3B] focus:outline-none focus:border-[#7B7B7B]"
                placeholder={user.level?.toString() || "0"}
                min="0"
                max="20"
              />
            </div>

            {/* Account Type */}
            <div>
              <label className="text-gray-400 text-xs mb-2 block">Account Type</label>
              <select
                value={accountType}
                onChange={(e) => setAccountType(e.target.value)}
                className="w-full bg-[#1E1E1E] text-white px-4 py-2 rounded border border-[#3B3B3B] focus:outline-none focus:border-[#7B7B7B]"
              >
                <option value="admin">Admin</option>
                <option value="island">Island</option>
                <option value="non-island">Non-Island</option>
              </select>
            </div>

            {/* Danger Zone */}
            <div className="bg-[#1E1E1E] border border-[#3B3B3B] rounded p-4 space-y-4 mt-8">
              <div>
                <p className="text-gray-400 text-xs mb-2">
                  Completely remove user account data from the database. Irreversible.
                </p>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(true);
                    setConfirmText("");
                  }}
                  disabled={isLoading}
                  className="w-full bg-[#800000] hover:bg-[#900000] text-white py-2 rounded transition-colors disabled:opacity-50"
                >
                  Delete Account
                </button>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-2">
                  Remove all user data (search, island etc.) related to this account. Irreversible.
                </p>
                <button
                  onClick={() => {
                    setShowResetConfirm(true);
                    setConfirmText("");
                  }}
                  disabled={isLoading}
                  className="w-full bg-[#8B8B8B] hover:bg-[#9A9A9A] text-white py-2 rounded transition-colors disabled:opacity-50"
                >
                  Reset Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
          <div className="bg-[#1E1E1E] rounded-lg border border-red-900/50 p-6 w-full max-w-md">
            <h4 className="text-red-400 text-lg font-semibold mb-2">Warning</h4>
            <p className="text-white text-sm mb-4">
              Are you sure you want to delete this user? This action is irreversible.
            </p>
            <input
              type="text"
              placeholder='Type "DELETE" to confirm'
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full bg-[#333333] text-white px-4 py-2 rounded border border-[#3B3B3B] focus:outline-none focus:border-red-500 mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setConfirmText("");
                }}
                disabled={isLoading}
                className="flex-1 bg-[#3B3B3B] hover:bg-[#4B4B4B] text-white py-2 rounded transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isLoading || confirmText !== "DELETE"}
                className="flex-1 bg-[#800000] hover:bg-[#900000] text-white py-2 rounded transition-colors disabled:opacity-50"
              >
                {isLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
          <div className="bg-[#1E1E1E] rounded-lg border border-red-900/50 p-6 w-full max-w-md">
            <h4 className="text-red-400 text-lg font-semibold mb-2">Warning</h4>
            <p className="text-white text-sm mb-4">
              Are you sure you want to reset this user's data? This action is irreversible.
            </p>
            <input
              type="text"
              placeholder='Type "RESET" to confirm'
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full bg-[#333333] text-white px-4 py-2 rounded border border-[#3B3B3B] focus:outline-none focus:border-red-500 mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowResetConfirm(false);
                  setConfirmText("");
                }}
                disabled={isLoading}
                className="flex-1 bg-[#3B3B3B] hover:bg-[#4B4B4B] text-white py-2 rounded transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleResetConfirm}
                disabled={isLoading || confirmText !== "RESET"}
                className="flex-1 bg-[#800000] hover:bg-[#900000] text-white py-2 rounded transition-colors disabled:opacity-50"
              >
                {isLoading ? "Resetting..." : "Reset"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
