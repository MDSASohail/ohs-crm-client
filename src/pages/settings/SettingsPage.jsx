import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { toastSuccess, toastError } from "../../utils/toast";
import { usePageTitle } from "../../hooks/usePageTitle";
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Power,
  PowerOff,
  Save,
  CreditCard,
  X,
  Shield,
  Key,
} from "lucide-react";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  deactivateUser,
  activateUser,
} from "../../services/user.service";
import { useAuth } from "../../hooks/useAuth";
import { ROLES } from "../../constants/roles";
import { formatDate } from "../../utils/formatDate";
import { logout } from "../../features/auth/authSlice";
import PageWrapper from "../../components/layout/PageWrapper";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
import Badge from "../../components/ui/Badge";
import Spinner from "../../components/ui/Spinner";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { RoleBadge, DeletedBadge } from "../../components/ui/StatusBadge";

// ── Section wrapper ───────────────────────────────────────────────────────────
const Section = ({ title, icon: Icon, children, action }) => (
  <Card className="mb-6">
    <header className="flex items-center justify-between mb-5 pb-4 border-b border-border">
      <div className="flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-accent" />
        </div>
        <h3 className="text-base font-semibold text-text-main">{title}</h3>
      </div>
      {action && <div>{action}</div>}
    </header>
    {children}
  </Card>
);

const INITIAL_USER_FORM = {
  name: "",
  email: "",
  password: "",
  role: "staff",
};

const selectClass =
  "w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-white text-text-main";

const SettingsPage = () => {
  const dispatch = useDispatch();
  const { user: currentUser, isRoot } = useAuth();
  usePageTitle("Settings");

  // Users state
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);

  // Create user modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState(INITIAL_USER_FORM);
  const [createErrors, setCreateErrors] = useState({});
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // Edit user modal
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editError, setEditError] = useState("");
  const [editing, setEditing] = useState(false);

  // Action targets
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toggleTarget, setToggleTarget] = useState(null);
  const [actioning, setActioning] = useState(false);

  // Change own password
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    password: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await getUsers();
      setUsers(res.data.data);
    } catch {
      // Silent fail
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    if (isRoot) loadUsers();
  }, [isRoot]);

  // Pre-fill edit form
  useEffect(() => {
    if (editTarget) {
      setEditForm({
        name: editTarget.name || "",
        email: editTarget.email || "",
        role: editTarget.role || "staff",
        password: "",
      });
      setEditError("");
    }
  }, [editTarget]);

  // ── Create user ─────────────────────────────────────────────────────────────
  const validateCreate = () => {
    const errs = {};
    if (!createForm.name.trim()) errs.name = "Name is required.";
    if (!createForm.email.trim()) errs.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(createForm.email))
      errs.email = "Enter a valid email.";
    if (!createForm.password) errs.password = "Password is required.";
    else if (createForm.password.length < 8)
      errs.password = "Password must be at least 8 characters.";
    return errs;
  };

  const handleCreate = async () => {
    const errs = validateCreate();
    if (Object.keys(errs).length > 0) {
      setCreateErrors(errs);
      return;
    }
    setCreateError("");
    setCreating(true);
    try {
      await createUser(createForm);
      setShowCreateModal(false);

      toastSuccess("User created successfully.");

      setCreateForm(INITIAL_USER_FORM);
      setCreateErrors({});
      await loadUsers();
    } catch (err) {
      setCreateError(
        err.response?.data?.message || "Failed to create user."
      );
    } finally {
      setCreating(false);
    }
  };

  // ── Edit user ───────────────────────────────────────────────────────────────
  const handleEdit = async () => {
    setEditError("");
    setEditing(true);
    try {
      const payload = {
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
      };
      if (editForm.password) payload.password = editForm.password;

      await updateUser(editTarget._id, payload);

      toastSuccess("User updated successfully.");

      setEditTarget(null);
      await loadUsers();
    } catch (err) {
      setEditError(
        err.response?.data?.message || "Failed to update user."
      );
    } finally {
      setEditing(false);
    }
  };

  // ── Delete user ─────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActioning(true);
    try {
      await deleteUser(deleteTarget._id);
      setDeleteTarget(null);
      await loadUsers();
    } catch {
      // Silent fail
    } finally {
      setActioning(false);
    }
  };

  // ── Toggle active ───────────────────────────────────────────────────────────
  const handleToggle = async () => {
    if (!toggleTarget) return;
    setActioning(true);
    try {
      if (toggleTarget.isActive) {
        await deactivateUser(toggleTarget._id);
      } else {
        await activateUser(toggleTarget._id);
      }
      setToggleTarget(null);
      await loadUsers();
    } catch {
      // Silent fail
    } finally {
      setActioning(false);
    }
  };

  // ── Change own password ─────────────────────────────────────────────────────
  const handlePasswordChange = async () => {
    setPasswordError("");
    if (!passwordForm.password) {
      setPasswordError("New password is required.");
      return;
    }
    if (passwordForm.password.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return;
    }
    if (passwordForm.password !== passwordForm.confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }
    setSavingPassword(true);
    try {
      await updateUser(currentUser._id, {
        password: passwordForm.password,
      });
      toastSuccess("Password updated successfully.");
      setShowPasswordModal(false);

      setPasswordForm({ password: "", confirmPassword: "" });
    } catch (err) {
      setPasswordError(
        err.response?.data?.message || "Failed to update password."
      );
    } finally {
      setSavingPassword(false);
    }
  };

  const activeUsers = users.filter((u) => !u.isDeleted);
  const deletedUsers = users.filter((u) => u.isDeleted);

  return (
    <PageWrapper title="Settings">
      <section aria-label="Settings">

        {/* ── Page header ───────────────────────────────────────────── */}
        <header className="mb-6">
          <h2 className="text-xl font-semibold text-text-main">Settings</h2>
          <p className="text-sm text-muted mt-0.5">
            Manage your workspace and team.
          </p>
        </header>

        {/* ── My Account ───────────────────────────────────────────── */}
        <Section title="My Account" icon={Shield}>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-accent flex items-center justify-center shrink-0">
                <span className="text-white text-xl font-bold">
                  {currentUser?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-base font-semibold text-text-main">
                  {currentUser?.name}
                </p>
                <p className="text-sm text-muted">{currentUser?.email}</p>
                <div className="mt-1.5">
                  <RoleBadge role={currentUser?.role} />
                </div>
              </div>
            </div>
            <Button
              variant="secondary"
              icon={Key}
              onClick={() => setShowPasswordModal(true)}
            >
              Change Password
            </Button>
          </div>
        </Section>

        {/* ── User Management — root only ───────────────────────────── */}
        {isRoot && (
          <Section
            title="Team Members"
            icon={Users}
            action={
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => setShowCreateModal(true)}
              >
                Add User
              </Button>
            }
          >
            {usersLoading ? (
              <div className="flex justify-center py-8">
                <Spinner size="md" />
              </div>
            ) : activeUsers.length === 0 ? (
              <p className="text-sm text-muted italic">No team members yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {activeUsers.map((u) => (
                  <li
                    key={u._id}
                    className="flex items-center justify-between py-4 gap-4"
                  >
                    {/* Avatar + info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                        <span className="text-accent text-sm font-semibold">
                          {u.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-text-main">
                            {u.name}
                          </p>
                          {u._id === currentUser?._id && (
                            <span className="text-xs text-muted bg-neutral px-1.5 py-0.5 rounded">
                              You
                            </span>
                          )}
                          {!u.isActive && (
                            <Badge
                              label="Inactive"
                              colorClass="bg-yellow-100 text-warning"
                              dot
                            />
                          )}
                        </div>
                        <p className="text-xs text-muted truncate">
                          {u.email}
                        </p>
                        <div className="mt-1">
                          <RoleBadge role={u.role} />
                        </div>
                      </div>
                    </div>

                    {/* Actions — cannot act on self */}
                    {u._id !== currentUser?._id && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Edit */}
                        <button
                          onClick={() => setEditTarget(u)}
                          className="p-1.5 rounded-lg text-muted hover:text-accent hover:bg-accent/10 transition-colors"
                          title="Edit user"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>

                        {/* Toggle active */}
                        <button
                          onClick={() => setToggleTarget(u)}
                          className={`p-1.5 rounded-lg transition-colors ${u.isActive
                            ? "text-muted hover:text-warning hover:bg-yellow-50"
                            : "text-muted hover:text-success hover:bg-green-50"
                            }`}
                          title={u.isActive ? "Deactivate" : "Activate"}
                        >
                          {u.isActive ? (
                            <PowerOff className="h-4 w-4" />
                          ) : (
                            <Power className="h-4 w-4" />
                          )}
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => setDeleteTarget(u)}
                          className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-red-50 transition-colors"
                          title="Delete user"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {/* Deleted users */}
            {deletedUsers.length > 0 && (
              <div className="mt-6 pt-4 border-t border-border">
                <p className="text-xs font-medium text-muted uppercase tracking-wide mb-3">
                  Deleted Users
                </p>
                <ul className="space-y-2">
                  {deletedUsers.map((u) => (
                    <li
                      key={u._id}
                      className="flex items-center gap-3 py-2 opacity-60"
                    >
                      <div className="h-8 w-8 rounded-full bg-neutral flex items-center justify-center shrink-0">
                        <span className="text-muted text-sm font-medium">
                          {u.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-text-main line-through truncate">
                          {u.name}
                        </p>
                        <p className="text-xs text-muted">
                          Deleted {formatDate(u.deletedAt)}
                        </p>
                      </div>
                      <DeletedBadge />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Section>
        )}

        {/* ── Role permissions reference ────────────────────────────── */}
        <Section title="Role Permissions" icon={Shield}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 text-xs font-medium text-muted uppercase tracking-wide">
                    Permission
                  </th>
                  {["Root", "Admin", "Staff", "Viewer"].map((role) => (
                    <th
                      key={role}
                      className="text-center py-2 px-3 text-xs font-medium text-muted uppercase tracking-wide"
                    >
                      {role}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  {
                    label: "View everything",
                    root: true,
                    admin: true,
                    staff: true,
                    viewer: true,
                  },
                  {
                    label: "Add / edit candidates",
                    root: true,
                    admin: true,
                    staff: true,
                    viewer: false,
                  },
                  {
                    label: "Add / edit enrollments",
                    root: true,
                    admin: true,
                    staff: true,
                    viewer: false,
                  },
                  {
                    label: "Record payments",
                    root: true,
                    admin: true,
                    staff: true,
                    viewer: false,
                  },
                  {
                    label: "Send reminders",
                    root: true,
                    admin: true,
                    staff: true,
                    viewer: false,
                  },
                  {
                    label: "Upload documents",
                    root: true,
                    admin: true,
                    staff: true,
                    viewer: false,
                  },
                  {
                    label: "Manage courses & institutes",
                    root: true,
                    admin: true,
                    staff: false,
                    viewer: false,
                  },
                  {
                    label: "Export reports",
                    root: true,
                    admin: true,
                    staff: false,
                    viewer: false,
                  },
                  {
                    label: "View activity logs",
                    root: true,
                    admin: true,
                    staff: false,
                    viewer: false,
                  },
                  {
                    label: "Manage users",
                    root: true,
                    admin: false,
                    staff: false,
                    viewer: false,
                  },
                  {
                    label: "See deleted records",
                    root: true,
                    admin: false,
                    staff: false,
                    viewer: false,
                  },
                  {
                    label: "Settings",
                    root: true,
                    admin: false,
                    staff: false,
                    viewer: false,
                  },
                ].map((row) => (
                  <tr key={row.label}>
                    <td className="py-2.5 pr-4 text-sm text-text-main">
                      {row.label}
                    </td>
                    {["root", "admin", "staff", "viewer"].map((role) => (
                      <td
                        key={role}
                        className="py-2.5 px-3 text-center"
                      >
                        {row[role] ? (
                          <span className="text-success font-bold">✓</span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </Section>
        {/* ── Billing & Subscription ───────────────────────────────── */}
        {isRoot && (
          <Section title="Billing & Subscription" icon={CreditCard}>
            <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
              <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-main">
                  Billing management coming soon
                </p>
                <p className="text-xs text-muted mt-1 max-w-sm">
                  Subscription plans, usage limits, and billing history will
                  be available here. Currently on the free plan with no
                  restrictions.
                </p>
              </div>
              <span className="text-xs font-medium text-success bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
                ✓ Free Plan — All features unlocked
              </span>
            </div>
          </Section>
        )}
      </section>

      {/* ── Create user modal ─────────────────────────────────────── */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setCreateForm(INITIAL_USER_FORM);
          setCreateErrors({});
          setCreateError("");
        }}
        title="Add Team Member"
        onConfirm={handleCreate}
        confirmLabel="Create User"
        confirmLoading={creating}
        size="sm"
      >
        {createError && (
          <div
            role="alert"
            className="mb-4 px-3 py-2.5 rounded-lg bg-red-50 border border-red-200 text-sm text-danger"
          >
            {createError}
          </div>
        )}
        <div className="flex flex-col gap-4">
          <Input
            label="Full Name"
            name="name"
            value={createForm.name}
            onChange={(e) =>
              setCreateForm((p) => ({ ...p, name: e.target.value }))
            }
            placeholder="e.g. Rahul Sharma"
            error={createErrors.name}
            required
          />
          <Input
            label="Email Address"
            name="email"
            type="email"
            value={createForm.email}
            onChange={(e) =>
              setCreateForm((p) => ({ ...p, email: e.target.value }))
            }
            placeholder="rahul@example.com"
            error={createErrors.email}
            required
          />
          <Input
            label="Password"
            name="password"
            type="password"
            value={createForm.password}
            onChange={(e) =>
              setCreateForm((p) => ({ ...p, password: e.target.value }))
            }
            placeholder="Minimum 8 characters"
            error={createErrors.password}
            required
          />
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted uppercase tracking-wide">
              Role <span className="text-danger">*</span>
            </label>
            <select
              value={createForm.role}
              onChange={(e) =>
                setCreateForm((p) => ({ ...p, role: e.target.value }))
              }
              className={selectClass}
            >
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
        </div>
      </Modal>

      {/* ── Edit user modal ───────────────────────────────────────── */}
      <Modal
        isOpen={!!editTarget}
        onClose={() => {
          setEditTarget(null);
          setEditError("");
        }}
        title={`Edit — ${editTarget?.name}`}
        onConfirm={handleEdit}
        confirmLabel="Save Changes"
        confirmLoading={editing}
        size="sm"
      >
        {editError && (
          <div
            role="alert"
            className="mb-4 px-3 py-2.5 rounded-lg bg-red-50 border border-red-200 text-sm text-danger"
          >
            {editError}
          </div>
        )}
        <div className="flex flex-col gap-4">
          <Input
            label="Full Name"
            name="name"
            value={editForm.name || ""}
            onChange={(e) =>
              setEditForm((p) => ({ ...p, name: e.target.value }))
            }
            required
          />
          <Input
            label="Email Address"
            name="email"
            type="email"
            value={editForm.email || ""}
            onChange={(e) =>
              setEditForm((p) => ({ ...p, email: e.target.value }))
            }
            required
          />
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted uppercase tracking-wide">
              Role
            </label>
            <select
              value={editForm.role || "staff"}
              onChange={(e) =>
                setEditForm((p) => ({ ...p, role: e.target.value }))
              }
              className={selectClass}
            >
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <Input
            label="New Password"
            name="password"
            type="password"
            value={editForm.password || ""}
            onChange={(e) =>
              setEditForm((p) => ({ ...p, password: e.target.value }))
            }
            placeholder="Leave empty to keep current password"
            helperText="Only fill this to reset the user's password"
          />
        </div>
      </Modal>

      {/* ── Change own password modal ─────────────────────────────── */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setPasswordForm({ password: "", confirmPassword: "" });
          setPasswordError("");
        }}
        title="Change Password"
        onConfirm={handlePasswordChange}
        confirmLabel="Update Password"
        confirmLoading={savingPassword}
        size="sm"
      >
        {passwordError && (
          <div
            role="alert"
            className="mb-4 px-3 py-2.5 rounded-lg bg-red-50 border border-red-200 text-sm text-danger"
          >
            {passwordError}
          </div>
        )}
        <div className="flex flex-col gap-4">
          <Input
            label="New Password"
            name="password"
            type="password"
            value={passwordForm.password}
            onChange={(e) =>
              setPasswordForm((p) => ({
                ...p,
                password: e.target.value,
              }))
            }
            placeholder="Minimum 8 characters"
            required
          />
          <Input
            label="Confirm New Password"
            name="confirmPassword"
            type="password"
            value={passwordForm.confirmPassword}
            onChange={(e) =>
              setPasswordForm((p) => ({
                ...p,
                confirmPassword: e.target.value,
              }))
            }
            placeholder="Repeat new password"
            required
          />
        </div>
      </Modal>

      {/* ── Toggle active confirm ─────────────────────────────────── */}
      <ConfirmDialog
        isOpen={!!toggleTarget}
        onClose={() => setToggleTarget(null)}
        onConfirm={handleToggle}
        loading={actioning}
        title={toggleTarget?.isActive ? "Deactivate User" : "Activate User"}
        message={
          toggleTarget?.isActive
            ? `Deactivating "${toggleTarget?.name}" will prevent them from logging in.`
            : `Activating "${toggleTarget?.name}" will restore their access.`
        }
        confirmLabel={toggleTarget?.isActive ? "Deactivate" : "Activate"}
        variant={toggleTarget?.isActive ? "danger" : "primary"}
      />

      {/* ── Delete confirm ────────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={actioning}
        title="Delete User"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? They will lose all access immediately.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </PageWrapper>
  );
};

export default SettingsPage;