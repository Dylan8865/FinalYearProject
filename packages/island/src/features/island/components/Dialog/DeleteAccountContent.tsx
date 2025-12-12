"use client";

import React, { useState, useTransition } from "react";
import { deleteAccount } from "@/features/auth/actions/deleteAccount";
import ExclaimationIcon from "@/features/shared/icons/ExclaimationIcon";
import Dialog from "./Dialog";
import Button from "./Button";

interface DeleteAccountContentProps {
  onClose: () => void;
}

const DeleteAccountContent = ({ onClose }: DeleteAccountContentProps) => {
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (confirmText !== "DELETE") {
      setError('Please type "DELETE" to confirm');
      return;
    }

    startTransition(async () => {
      const result = await deleteAccount();
      if (result?.error) {
        setError(result.error);
      }
    });
  };

  return (
    <div className="fixed left-0 top-0 z-50 flex h-screen w-screen items-center justify-center bg-black bg-opacity-50">
      <Dialog
        iconStyle="bg-[#8B0000] text-white"
        icon={<ExclaimationIcon />}
        title="Delete Account"
        size="medium"
        setIsDialogOpen={onClose}
        className="flex items-center justify-center"
      >
        <div className="space-y-6 p-6">
          {/* warning message */}
          <div className="space-y-3 rounded border-2 border-[#5a1a1a] bg-[#2d0a0a]/40 p-4">
            <p className="text-center font-bold text-[#ff6b6b]">
              This action cannot be undone!
            </p>
            <p className="text-center text-sm text-[#b8b8b8]">
              This will permanently delete:
            </p>
            <ul className="space-y-1 text-sm text-[#b8b8b8]">
              <li>• Your account and profile</li>
              <li>• All your islands</li>
              <li>• All your items and inventory</li>
              <li>• All your progress and data</li>
            </ul>
          </div>

          {/* Confirmation input */}
          <div className="space-y-2">
            <label className="block text-center text-sm text-white">
              Type <span className="font-bold text-[#ff6b6b]">DELETE</span> to
              confirm:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full border-2 border-[#5a1a1a] bg-[#1a0a0a] p-3 text-center text-white placeholder-[#5a3a3a] focus:border-[#8B0000] focus:outline-none disabled:opacity-50"
              placeholder="DELETE"
              disabled={isPending}
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="rounded border border-[#5a1a1a] bg-[#2d0a0a]/40 p-3 text-center text-sm text-[#ff6b6b]">
              {error}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-center gap-4">
            <Button
              className="cursor-pointer border border-transparent bg-[#4a4a4a] transition hover:border-[#5a5a5a]"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              className={`border border-transparent transition ${
                isPending || confirmText !== "DELETE"
                  ? "cursor-not-allowed bg-[#4a1a1a] opacity-50"
                  : "cursor-pointer bg-[#8B0000] hover:border-[#a00000]"
              }`}
              onClick={handleDelete}
              disabled={isPending || confirmText !== "DELETE"}
            >
              Delete
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default DeleteAccountContent;
