import React from "react";
import EditButton from "./EditButton";
import SettingButton from "./SettingButton";
import LockIcon from "@/icons/LockIcon";
import LoginIcon from "@/icons/LoginIcon";
import WarningIcon from "@/icons/WarningIcon";
import { signOut } from "@/features/auth/actions/logout";

const ProfileContent = () => {
  return (
    <div className="space-y-4">
      <EditButton fieldName="Username:" fieldValue="rikashi_shifu" />
      <EditButton fieldName="Email:" fieldValue="harryliow229@gmail.com" />
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
      />
    </div>
  );
};

export default ProfileContent;
