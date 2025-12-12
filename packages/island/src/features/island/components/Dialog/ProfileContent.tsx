"use client";

import React, { useState } from "react";
import EditButton from "./EditButton";
import SettingButton from "./SettingButton";
import LockIcon from "@/features/shared/icons/LockIcon";
import LoginIcon from "@/features/shared/icons/LoginIcon";
import WarningIcon from "@/features/shared/icons/WarningIcon";
import { signOut } from "@/features/auth/actions/logout";
import DeleteAccountContent from "./DeleteAccountContent";

interface ProfileContentProps {
  userName: string;
  userEmail: string;
}

const ProfileContent = ({ userName, userEmail }: ProfileContentProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  return (
    <>
      <div className="space-y-4">
        <EditButton fieldName="Username:" fieldValue={userName} />
        <EditButton fieldName="Email:" fieldValue={userEmail} />
        <SettingButton
          fieldName="Settings"
          icon={<LockIcon />}
          title="Change Password"
          color="gray"
        />
        <SettingButton
          icon={<LoginIcon />}
          title="Log Out"
          color="gray"
          onClick={signOut}
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
