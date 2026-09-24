"use client";

import { Plus, RotateCw } from "lucide-react";
import { useAdminUsers } from "./_hooks/useAdminUsers";
import { UserStatsCards } from "./_components/UserStatsCards";
import { UserFilterBar } from "./_components/UserFilterBar";
import { UserTable } from "./_components/UserTable";
import { UserDetailDrawer } from "./_components/UserDetailDrawer";
import { CreateUserModal } from "./_components/CreateUserModal";

export default function AdminUsersPage() {
  const {
    search,
    setSearch,
    status,
    setStatus,
    role,
    setRole,
    page,
    setPage,
    limit,
    setLimit,
    users,
    totalItems,
    isLoading,
    stats,
    totalPages,
    selectedUserId,
    setSelectedUserId,
    detailData,
    setDetailData,
    isDetailLoading,
    draftStatus,
    setDraftStatus,
    draftRoles,
    setDraftRoles,
    isSavingDraft,
    isCreateModalOpen,
    setIsCreateModalOpen,
    newEmail,
    setNewEmail,
    newFullName,
    setNewFullName,
    newPassword,
    setNewPassword,
    newRoles,
    setNewRoles,
    createError,
    isCreating,
    handleCreateUser,
    handleSaveChanges,
    reloadUsers,
  } = useAdminUsers();

  return (
    <div className="space-y-4">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Quản lý Người dùng
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản trị tài khoản, phân quyền bảo mật và theo dõi trạng thái hoạt
            động.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void reloadUsers()}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-none cursor-pointer transition-colors disabled:opacity-50"
            title="Tải lại danh sách người dùng"
          >
            <RotateCw
              className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
            <span>Làm mới</span>
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2 px-4 rounded-none border border-slate-900 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo người dùng</span>
          </button>
        </div>
      </div>

      <UserStatsCards stats={stats} />

      <UserFilterBar
        search={search}
        status={status}
        role={role}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        onStatusChange={(v) => {
          setStatus(v);
          setPage(1);
        }}
        onRoleChange={(v) => {
          setRole(v);
          setPage(1);
        }}
      />

      <UserTable
        users={users}
        isLoading={isLoading}
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
        onViewDetail={setSelectedUserId}
      />

      <UserDetailDrawer
        selectedUserId={selectedUserId}
        detailData={detailData}
        isDetailLoading={isDetailLoading}
        draftStatus={draftStatus}
        draftRoles={draftRoles}
        isSavingDraft={isSavingDraft}
        onClose={() => {
          setSelectedUserId(null);
          setDetailData(null);
        }}
        onDraftStatusChange={setDraftStatus}
        onDraftRolesChange={setDraftRoles}
        onCancelDraft={() => {
          if (detailData) {
            setDraftStatus(detailData.status);
            setDraftRoles(detailData.roles);
          }
        }}
        onSaveChanges={handleSaveChanges}
      />

      <CreateUserModal
        isOpen={isCreateModalOpen}
        newFullName={newFullName}
        newEmail={newEmail}
        newPassword={newPassword}
        newRoles={newRoles}
        createError={createError}
        isCreating={isCreating}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateUser}
        onFullNameChange={setNewFullName}
        onEmailChange={setNewEmail}
        onPasswordChange={setNewPassword}
        onRolesChange={setNewRoles}
      />
    </div>
  );
}
