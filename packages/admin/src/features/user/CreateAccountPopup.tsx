"use client";

import { useState } from "react";

interface CreateAccountModalProps {
  onClose: () => void;
  onSuccess: () => void;
  onError: (message: string) => void;
}

export default function CreateAccountModal({ onClose, onSuccess, onError }: CreateAccountModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accountType, setAccountType] = useState("island");
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    // Validation
    const errors: typeof fieldErrors = {};
    
    if (!name.trim()) {
      errors.name = "Name is required";
    }
    
    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please enter a valid email address";
    }
    
    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }
    
    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/create-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          type: accountType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create account");
      }

      onClose();
      onSuccess();
    } catch (error: any) {
      onError(error.message || "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-[#333333] rounded-lg border border-[#3B3B3B] p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl leading-none"
        >
          ×
        </button>
        {/* Modal Header */}
        <div className="mb-4">
          <h2 className="text-white text-xl font-semibold">Create Account</h2>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Name */}
          <div>
            <label className="text-gray-400 text-xs mb-2 block">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (fieldErrors.name) {
                  setFieldErrors({ ...fieldErrors, name: undefined });
                }
              }}
              disabled={isLoading}
              className={`w-full bg-[#1E1E1E] text-white px-3 py-2 rounded border ${fieldErrors.name ? 'border-red-500' : 'border-[#3B3B3B]'} focus:outline-none focus:border-[#7B7B7B] disabled:opacity-50`}
              placeholder="Enter full name"
            />
            {fieldErrors.name && (
              <p className="text-red-400 text-xs mt-1">{fieldErrors.name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="text-gray-400 text-xs mb-2 block">Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) {
                  setFieldErrors({ ...fieldErrors, email: undefined });
                }
              }}
              disabled={isLoading}
              className={`w-full bg-[#1E1E1E] text-white px-3 py-2 rounded border ${fieldErrors.email ? 'border-red-500' : 'border-[#3B3B3B]'} focus:outline-none focus:border-[#7B7B7B] disabled:opacity-50`}
              placeholder="user@example.com"
            />
            {fieldErrors.email && (
              <p className="text-red-400 text-xs mt-1">{fieldErrors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="text-gray-400 text-xs mb-2 block">Password *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) {
                  setFieldErrors({ ...fieldErrors, password: undefined });
                }
              }}
              disabled={isLoading}
              className={`w-full bg-[#1E1E1E] text-white px-3 py-2 rounded border ${fieldErrors.password ? 'border-red-500' : 'border-[#3B3B3B]'} focus:outline-none focus:border-[#7B7B7B] disabled:opacity-50`}
              placeholder="Minimum 6 characters"
            />
            {fieldErrors.password && (
              <p className="text-red-400 text-xs mt-1">{fieldErrors.password}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="text-gray-400 text-xs mb-2 block">Confirm Password *</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (fieldErrors.confirmPassword) {
                  setFieldErrors({ ...fieldErrors, confirmPassword: undefined });
                }
              }}
              disabled={isLoading}
              className={`w-full bg-[#1E1E1E] text-white px-3 py-2 rounded border ${fieldErrors.confirmPassword ? 'border-red-500' : 'border-[#3B3B3B]'} focus:outline-none focus:border-[#7B7B7B] disabled:opacity-50`}
              placeholder="Re-enter password"
            />
            {fieldErrors.confirmPassword && (
              <p className="text-red-400 text-xs mt-1">{fieldErrors.confirmPassword}</p>
            )}
          </div>

          {/* Account Type */}
          <div>
            <label className="text-gray-400 text-xs mb-2 block">Account Type *</label>
            <select
              value={accountType}
              onChange={(e) => setAccountType(e.target.value)}
              disabled={isLoading}
              className="w-full bg-[#1E1E1E] text-white px-3 py-2 rounded border border-[#3B3B3B] focus:outline-none focus:border-[#7B7B7B] disabled:opacity-50"
            >
              <option value="island">Island</option>
              <option value="non-island">Non-Island</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="w-full bg-[#333333] hover:bg-[#4B4B4B] text-white border-2 border-[#4B4B4B] py-2 rounded transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#6D3F33] hover:bg-[#7B4A3A] text-white py-2 rounded transition-colors disabled:opacity-50"
            >
              {isLoading ? "Creating..." : "Create Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
