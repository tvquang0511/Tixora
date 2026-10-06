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
      {/* Head */}
      <div className="head stickyhead flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="htcaa-h1 m-0">Quản lý Người dùng</h1>
            <span className="htcaa-badge-count-pill">
              {totalItems} tài khoản
            </span>
          </div>
          <p className="sub">
            Quản trị tài khoản, phân quyền bảo mật và theo dõi trạng thái hoạt
            động.
          </p>
        </div>
        <div className="head-actions flex items-center gap-2">
          <button
            onClick={() => void reloadUsers()}
            disabled={isLoading}
            className="btn"
            title="Tải lại danh sách người dùng"
          >
            <RotateCw
              className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[#0052ff]" : "text-slate-500"}`}
            />
            <span>{isLoading ? "Đang tải…" : "Làm mới"}</span>
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn btn-primary"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tạo người dùng</span>
          </button>
        </div>
      </div>

      <UserStatsCards stats={stats} />

      <UserFilterBar
        search={search}
        status={status}
        role={role}
        limit={limit}
        totalItems={totalItems}
        displayedCount={users.length}
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
        onLimitChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
        }}
        onReset={() => {
          setSearch("");
          setStatus("All");
          setRole("All");
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
