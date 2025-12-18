"use client";

import React, { useState } from "react";
import EditButton from "./EditButton";
import SettingButton from "./SettingButton";
import LockIcon from "@/icons/LockIcon";
import LoginIcon from "@/icons/LoginIcon";
import WarningIcon from "@/icons/WarningIcon";
import { signOut } from "@/features/auth/actions/logout";
import DeleteAccountContent from "./DeleteAccountContent";

interface ProfileContentProps {
  userName: string;
  userEmail: string;
  setIsDialogOpen: React.Dispatch<React.SetStateAction<string>>;
  setIsSigningOut: React.Dispatch<React.SetStateAction<boolean>>;
}

const ProfileContent = ({
  userName,
  userEmail,
  setIsDialogOpen,
  setIsSigningOut,
}: ProfileContentProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  return (
    <>
      <div className="space-y-4">
        <EditButton
          fieldName="Username:"
          fieldValue={userName}
          onClick={() => setIsDialogOpen("change-username")}
        />
        <EditButton fieldName="Email:" fieldValue={userEmail} />
        <SettingButton
          fieldName="Settings"
          icon={<LockIcon />}
          title="Change Password"
          color="gray"
          onClick={() => setIsDialogOpen("change-password")}
        />
        <SettingButton
          icon={<LoginIcon />}
          title="Log Out"
          color="gray"
          onClick={() => {
            setIsSigningOut(true);
            signOut();
          }}
        />
        <SettingButton
          icon={<WarningIcon />}
          title="Delete Account"
          color="red"
          onClick={() => setShowDeleteDialog(true)}
        />
      </div>

      {showDeleteDialog && (
        <DeleteAccountContent onClose={() => setShowDeleteDialog(false)} />
      )}
    </>
  );
};

export default ProfileContent;
