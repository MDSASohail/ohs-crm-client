import Badge from "./Badge";
import {
  ENROLLMENT_STATUS_LABELS,
  ENROLLMENT_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
} from "../../constants/statuses";

// Enrollment status badge — pass the raw status string from DB
export const EnrollmentStatusBadge = ({ status }) => {
  if (!status) return <span className="text-muted text-xs">—</span>;
  return (
    <Badge
      label={ENROLLMENT_STATUS_LABELS[status] || status}
      colorClass={ENROLLMENT_STATUS_COLORS[status] || "bg-gray-100 text-gray-700"}
      dot
    />
  );
};

// Payment status badge — pass the raw payment status string
export const PaymentStatusBadge = ({ status }) => {
  if (!status) return <span className="text-muted text-xs">—</span>;
  return (
    <Badge
      label={PAYMENT_STATUS_LABELS[status] || status}
      colorClass={PAYMENT_STATUS_COLORS[status] || "bg-gray-100 text-gray-700"}
      dot
    />
  );
};

// Role badge — for user management tables
export const RoleBadge = ({ role }) => {
  const roleColors = {
    root: "bg-purple-100 text-purple-700",
    admin: "bg-blue-100 text-blue-700",
    staff: "bg-green-100 text-green-700",
    viewer: "bg-gray-100 text-gray-700",
  };

  if (!role) return <span className="text-muted text-xs">—</span>;
  return (
    <Badge
      label={role.charAt(0).toUpperCase() + role.slice(1)}
      colorClass={roleColors[role] || "bg-gray-100 text-gray-700"}
    />
  );
};

// Deleted record badge — shown only to Root users
export const DeletedBadge = () => (
  <Badge label="Deleted" colorClass="bg-red-100 text-danger" dot />
);