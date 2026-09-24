import { useState } from "react";
import {
  X,
  ShieldAlert,
  User as UserIcon,
  Mail,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

interface CreateUserModalProps {
  isOpen: boolean;
  newFullName: string;
  newEmail: string;
  newPassword: string;
  newRoles: string[];
  createError: string | null;
  isCreating: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onFullNameChange: (v: string) => void;
  onEmailChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onRolesChange: (roles: string[]) => void;
}

export function CreateUserModal({
  isOpen,
  newFullName,
  newEmail,
  newPassword,
  newRoles,
  createError,
  isCreating,
  onClose,
  onSubmit,
  onFullNameChange,
  onEmailChange,
  onPasswordChange,
  onRolesChange,
}: CreateUserModalProps) {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.roles?.includes("SuperAdmin");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (newPassword.length < 6) {
      setLocalError("Mật khẩu phải chứa ít nhất 6 ký tự.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setLocalError("Mật khẩu nhập lại không trùng khớp.");
      return;
    }

    onSubmit(e);
  };

  const activeError = localError || createError;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 z-50 backdrop-blur-xs"
          />

          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 select-none">
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-2 text-slate-900">
                  <UserIcon className="w-4 h-4 text-teal-600" />
                  <h3 className="font-sans text-sm font-semibold text-slate-900">
                    Tạo tài khoản người dùng
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
                  title="Đóng"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form */}
              <form
                onSubmit={handleSubmit}
                className="p-5 space-y-4 font-sans text-xs"
              >
                {activeError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg font-sans text-xs flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{activeError}</span>
                  </div>
                )}

                {/* Full Name */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block text-xs">
                    Họ và tên *
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="Nguyễn Văn A"
                      value={newFullName}
                      onChange={(e) => onFullNameChange(e.target.value)}
                      className="pl-9 pr-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 w-full transition-colors text-slate-900 font-sans text-xs"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block text-xs">
                    Địa chỉ Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="example@email.com"
                      value={newEmail}
                      onChange={(e) => onEmailChange(e.target.value)}
                      className="pl-9 pr-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 w-full transition-colors text-slate-900 font-sans text-xs"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block text-xs">
                    Mật khẩu khởi tạo *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => onPasswordChange(e.target.value)}
                      className="pl-9 pr-10 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 w-full transition-colors text-slate-900 text-xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block text-xs">
                    Nhập lại mật khẩu *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-9 pr-10 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 w-full transition-colors text-slate-900 text-xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Roles (Select 1 only) */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block text-xs">
                    Phân quyền vai trò *
                  </label>
                  <select
                    value={newRoles[0] || "Audience"}
                    onChange={(e) => onRolesChange([e.target.value])}
                    className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-sans font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 w-full h-10 transition-colors cursor-pointer"
                  >
                    <option value="Audience">Audience (Khách hàng)</option>
                    {isSuperAdmin && (
                      <option value="SuperAdmin">
                        SuperAdmin (Quản trị cấp cao)
                      </option>
                    )}
                    {isSuperAdmin && (
                      <option value="Admin">Admin (Quản trị viên)</option>
                    )}
                    <option value="Checker">Checker (Soát vé)</option>
                    <option value="Organizer">Organizer (Ban tổ chức)</option>
                  </select>
                </div>

                {/* Actions */}
                <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 mt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-sans text-xs font-medium py-2 px-3.5 rounded-lg transition-colors cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="bg-teal-600 hover:bg-teal-700 text-white font-sans text-xs font-medium py-2 px-4 rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isCreating ? "Đang tạo..." : "Lưu tài khoản"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
