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
              className="bg-white border border-slate-300 rounded-none w-full max-w-md shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-2 text-slate-900">
                  <UserIcon className="w-4 h-4 text-slate-700" />
                  <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-slate-900">
                    Tạo tài khoản người dùng
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 hover:bg-slate-200 text-slate-500 hover:text-slate-900 rounded-none transition-colors cursor-pointer"
                  title="Đóng"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form */}
              <form
                onSubmit={handleSubmit}
                className="p-5 space-y-4 font-mono text-xs"
              >
                {activeError && (
                  <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 rounded-none font-sans text-xs flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{activeError}</span>
                  </div>
                )}

                {/* Full Name */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 uppercase tracking-wider block text-[10px]">
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
                      className="pl-9 pr-3 py-2 border border-slate-300 rounded-none bg-white focus:outline-none focus:border-slate-800 w-full transition-colors text-slate-900 font-sans text-xs"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 uppercase tracking-wider block text-[10px]">
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
                      className="pl-9 pr-3 py-2 border border-slate-300 rounded-none bg-white focus:outline-none focus:border-slate-800 w-full transition-colors text-slate-900 font-mono text-xs"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 uppercase tracking-wider block text-[10px]">
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
                      className="pl-9 pr-10 py-2 border border-slate-300 rounded-none bg-white focus:outline-none focus:border-slate-800 w-full transition-colors text-slate-900 text-xs font-mono"
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
                  <label className="font-bold text-slate-600 uppercase tracking-wider block text-[10px]">
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
                      className="pl-9 pr-10 py-2 border border-slate-300 rounded-none bg-white focus:outline-none focus:border-slate-800 w-full transition-colors text-slate-900 text-xs font-mono"
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
                  <label className="font-bold text-slate-600 uppercase tracking-wider block text-[10px]">
                    Phân quyền vai trò *
                  </label>
                  <select
                    value={newRoles[0] || "Audience"}
                    onChange={(e) => onRolesChange([e.target.value])}
                    className="bg-white border border-slate-300 rounded-none px-3 py-2 text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:border-slate-800 w-full h-10 transition-colors cursor-pointer"
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
                <div className="flex gap-2 justify-end pt-3 border-t border-slate-200 mt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-mono text-xs font-semibold py-2 px-3 rounded-none transition-colors cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-mono text-xs font-bold py-2 px-4 rounded-none transition-colors cursor-pointer disabled:opacity-50"
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
