import { ReactNode } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminShell } from "@/components/AdminShell";

export default function AdminPortalLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={["Admin", "Organizer"]}>
      <AdminShell>{children}</AdminShell>
    </ProtectedRoute>
  );
}
