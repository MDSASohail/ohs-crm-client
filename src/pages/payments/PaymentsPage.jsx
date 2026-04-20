import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { usePageTitle } from "../../hooks/usePageTitle";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  CreditCard,
  Receipt,
  TrendingDown,
  Settings,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import {
  fetchPayment,
  createPaymentThunk,
  updatePaymentThunk,
  addTransactionThunk,
  updateTransactionThunk,
  deleteTransactionThunk,
  addExpenseThunk,
  updateExpenseThunk,
  deleteExpenseThunk,
  clearPayment,
} from "../../features/payments/paymentsSlice";
import { useAuth } from "../../hooks/useAuth";
import { ROLES } from "../../constants/roles";
import { formatDate } from "../../utils/formatDate";
import { formatCurrency } from "../../utils/formatCurrency";
import {
  EXPENSE_CATEGORY_LABELS,
  PAID_TO_LABELS,
} from "../../constants/categories";
import PageWrapper from "../../components/layout/PageWrapper";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Spinner from "../../components/ui/Spinner";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { PaymentStatusBadge } from "../../components/ui/StatusBadge";
import api from "../../config/axios";

// ── Select styling ────────────────────────────────────────────────────────────
const selectClass =
  "w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-white text-text-main";

// ── Summary stat card ─────────────────────────────────────────────────────────
const StatCard = ({ label, value, color = "text-text-main", icon: Icon }) => (
  <div className="bg-white rounded-xl border border-border p-4 flex items-center gap-4">
    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
      color === "text-success" ? "bg-green-50" :
      color === "text-danger" ? "bg-red-50" :
      color === "text-warning" ? "bg-yellow-50" :
      "bg-neutral"
    }`}>
      <Icon className={`h-5 w-5 ${color}`} />
    </div>
    <div>
      <p className="text-xs font-medium text-muted uppercase tracking-wide">
        {label}
      </p>
      <p className={`text-lg font-semibold mt-0.5 ${color}`}>{value}</p>
    </div>
  </div>
);

// ── Payment status icon ───────────────────────────────────────────────────────
const StatusIcon = ({ status }) => {
  if (status === "complete")
    return <CheckCircle2 className="h-5 w-5 text-success" />;
  if (status === "overdue")
    return <AlertCircle className="h-5 w-5 text-danger" />;
  return <Clock className="h-5 w-5 text-warning" />;
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const PaymentsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  usePageTitle("Payments");

  // enrollmentId comes from URL query param — e.g. /payments?enrollmentId=xxx
  const enrollmentId = searchParams.get("enrollmentId");

  const { user } = useAuth();
  const { current: payment, loading, error, mutating, mutateError } =
    useSelector((state) => state.payments);

  // Enrollment info for display
  const [enrollment, setEnrollment] = useState(null);

  // Modal states
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null); // { type, id }

  // Setup form — create/update fee and deadline
  const [setupForm, setSetupForm] = useState({
    totalFeeCharged: "",
    paymentDeadline: "",
  });

  // Transaction form
  const [txForm, setTxForm] = useState({
    amount: "",
    date: new Date().toISOString().split("T")[0],
    paidTo: "us",
    note: "",
  });

  // Expense form
  const [expForm, setExpForm] = useState({
    amount: "",
    date: new Date().toISOString().split("T")[0],
    category: "document",
    note: "",
  });

  // Load payment on mount
  useEffect(() => {
    if (!enrollmentId) return;

    dispatch(fetchPayment(enrollmentId));

    // Also fetch enrollment details for the header
    const loadEnrollment = async () => {
      try {
        const res = await api.get(`/enrollments/${enrollmentId}`);
        setEnrollment(res.data.data);
      } catch {
        // Silent fail
      }
    };
    loadEnrollment();

    return () => dispatch(clearPayment());
  }, [dispatch, enrollmentId]);

  // Pre-fill setup form when payment loads
  useEffect(() => {
    if (payment) {
      setSetupForm({
        totalFeeCharged: payment.totalFeeCharged ?? "",
        paymentDeadline: payment.paymentDeadline
          ? payment.paymentDeadline.split("T")[0]
          : "",
      });
    }
  }, [payment]);

  // Pre-fill transaction form when editing
  useEffect(() => {
    if (editingTransaction) {
      setTxForm({
        amount: editingTransaction.amount ?? "",
        date: editingTransaction.date
          ? editingTransaction.date.split("T")[0]
          : "",
        paidTo: editingTransaction.paidTo || "us",
        note: editingTransaction.note || "",
      });
    } else {
      setTxForm({
        amount: "",
        date: new Date().toISOString().split("T")[0],
        paidTo: "us",
        note: "",
      });
    }
  }, [editingTransaction]);

  // Pre-fill expense form when editing
  useEffect(() => {
    if (editingExpense) {
      setExpForm({
        amount: editingExpense.amount ?? "",
        date: editingExpense.date
          ? editingExpense.date.split("T")[0]
          : "",
        category: editingExpense.category || "document",
        note: editingExpense.note || "",
      });
    } else {
      setExpForm({
        amount: "",
        date: new Date().toISOString().split("T")[0],
        category: "document",
        note: "",
      });
    }
  }, [editingExpense]);

  const canWrite = user?.role !== ROLES.VIEWER;

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleSetup = async () => {
    const data = {
      totalFeeCharged: Number(setupForm.totalFeeCharged) || 0,
      paymentDeadline: setupForm.paymentDeadline || undefined,
    };

    let result;
    if (payment) {
      result = await dispatch(updatePaymentThunk({ enrollmentId, data }));
    } else {
      result = await dispatch(
        createPaymentThunk({ enrollmentId, ...data })
      );
    }
    if (
      updatePaymentThunk.fulfilled.match(result) ||
      createPaymentThunk.fulfilled.match(result)
    ) {
      setShowSetupModal(false);
    }
  };

  const handleTransactionSubmit = async () => {
    const data = {
      amount: Number(txForm.amount),
      date: txForm.date,
      paidTo: txForm.paidTo,
      note: txForm.note || undefined,
    };

    let result;
    if (editingTransaction) {
      result = await dispatch(
        updateTransactionThunk({
          enrollmentId,
          transactionId: editingTransaction._id,
          data,
        })
      );
    } else {
      result = await dispatch(addTransactionThunk({ enrollmentId, data }));
    }

    if (
      addTransactionThunk.fulfilled.match(result) ||
      updateTransactionThunk.fulfilled.match(result)
    ) {
      setShowTransactionModal(false);
      setEditingTransaction(null);
    }
  };

  const handleExpenseSubmit = async () => {
    const data = {
      amount: Number(expForm.amount),
      date: expForm.date,
      category: expForm.category,
      note: expForm.note || undefined,
    };

    let result;
    if (editingExpense) {
      result = await dispatch(
        updateExpenseThunk({
          enrollmentId,
          expenseId: editingExpense._id,
          data,
        })
      );
    } else {
      result = await dispatch(addExpenseThunk({ enrollmentId, data }));
    }

    if (
      addExpenseThunk.fulfilled.match(result) ||
      updateExpenseThunk.fulfilled.match(result)
    ) {
      setShowExpenseModal(false);
      setEditingExpense(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "transaction") {
      await dispatch(
        deleteTransactionThunk({
          enrollmentId,
          transactionId: deleteTarget.id,
        })
      );
    } else {
      await dispatch(
        deleteExpenseThunk({ enrollmentId, expenseId: deleteTarget.id })
      );
    }
    setDeleteTarget(null);
  };

  // ── No enrollmentId — show enrollment picker ──────────────────────────────
  if (!enrollmentId) {
    return (
      <PageWrapper title="Payments">
        <EnrollmentPicker />
      </PageWrapper>
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <PageWrapper title="Payments">
        <div className="flex items-center justify-center py-32">
          <Spinner size="lg" />
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Payments">
      <section aria-label="Payment tracking">

        {/* ── Page header ───────────────────────────────────────────── */}
        <header className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg text-muted hover:bg-white hover:text-text-main border border-border transition-colors shrink-0"
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h2 className="text-xl font-semibold text-text-main">
                Payment Tracking
              </h2>
              {enrollment && (
                <p className="text-sm text-muted mt-0.5">
                  {enrollment.candidateId?.fullName} ·{" "}
                  {enrollment.courseId?.shortCode} ·{" "}
                  {enrollment.instituteId?.name}
                </p>
              )}
            </div>
          </div>

          {canWrite && (
            <Button
              variant="secondary"
              icon={Settings}
              onClick={() => setShowSetupModal(true)}
            >
              {payment ? "Edit Fee Setup" : "Setup Payment"}
            </Button>
          )}
        </header>

        {/* ── No payment record yet ─────────────────────────────────── */}
        {!payment ? (
          <Card>
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="h-14 w-14 rounded-full bg-neutral flex items-center justify-center">
                <CreditCard className="h-7 w-7 text-muted" />
              </div>
              <div className="text-center">
                <h3 className="text-base font-semibold text-text-main">
                  No payment record yet
                </h3>
                <p className="text-sm text-muted mt-1">
                  Set up the fee and deadline to start tracking payments.
                </p>
              </div>
              {canWrite && (
                <Button
                  variant="primary"
                  icon={Plus}
                  onClick={() => setShowSetupModal(true)}
                >
                  Setup Payment
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <>
            {/* ── Summary stats ────────────────────────────────────── */}
            <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Total Fee"
                value={formatCurrency(payment.totalFeeCharged)}
                icon={CreditCard}
              />
              <StatCard
                label="Total Paid"
                value={formatCurrency(payment.totalPaid)}
                color="text-success"
                icon={CheckCircle2}
              />
              <StatCard
                label="Remaining"
                value={formatCurrency(payment.remainingBalance)}
                color={
                  payment.remainingBalance > 0 ? "text-danger" : "text-success"
                }
                icon={AlertCircle}
              />
              <StatCard
                label="Total Expenses"
                value={formatCurrency(payment.totalExpenses)}
                color="text-warning"
                icon={TrendingDown}
              />
            </div>

            {/* ── Payment status bar ───────────────────────────────── */}
            <Card className="mb-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <StatusIcon status={payment.paymentStatus} />
                  <div>
                    <p className="text-sm font-medium text-text-main">
                      Payment Status
                    </p>
                    {payment.paymentDeadline && (
                      <p className="text-xs text-muted">
                        Deadline: {formatDate(payment.paymentDeadline)}
                      </p>
                    )}
                  </div>
                </div>
                <PaymentStatusBadge status={payment.paymentStatus} />
              </div>

              {/* Progress bar */}
              {payment.totalFeeCharged > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-muted">
                      Payment progress
                    </span>
                    <span className="text-xs font-medium text-text-main">
                      {Math.min(
                        100,
                        Math.round(
                          (payment.totalPaid / payment.totalFeeCharged) * 100
                        )
                      )}
                      %
                    </span>
                  </div>
                  <div className="h-2 bg-neutral rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        payment.paymentStatus === "complete"
                          ? "bg-success"
                          : payment.paymentStatus === "overdue"
                          ? "bg-danger"
                          : "bg-accent"
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round(
                            (payment.totalPaid / payment.totalFeeCharged) * 100
                          )
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </Card>

            {/* ── Transactions ─────────────────────────────────────── */}
            <Card className="mb-6">
              <header className="flex items-center justify-between mb-5 pb-4 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
                    <CreditCard className="h-4 w-4 text-accent" />
                  </div>
                  <h3 className="text-base font-semibold text-text-main">
                    Payment Transactions
                  </h3>
                </div>
                {canWrite && (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Plus}
                    onClick={() => {
                      setEditingTransaction(null);
                      setShowTransactionModal(true);
                    }}
                  >
                    Add
                  </Button>
                )}
              </header>

              {payment.transactions.length === 0 ? (
                <p className="text-sm text-muted italic text-center py-8">
                  No transactions recorded yet.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {payment.transactions.map((tx) => (
                    <li
                      key={tx._id}
                      className="flex items-center justify-between py-3 gap-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                          <CreditCard className="h-4 w-4 text-success" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-success">
                            {formatCurrency(tx.amount)}
                          </p>
                          <p className="text-xs text-muted">
                            {formatDate(tx.date)} ·{" "}
                            {PAID_TO_LABELS[tx.paidTo] || tx.paidTo}
                            {tx.note ? ` · ${tx.note}` : ""}
                          </p>
                          {tx.recordedBy?.name && (
                            <p className="text-xs text-muted">
                              By {tx.recordedBy.name}
                            </p>
                          )}
                        </div>
                      </div>
                      {canWrite && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => {
                              setEditingTransaction(tx);
                              setShowTransactionModal(true);
                            }}
                            className="p-1.5 rounded-lg text-muted hover:text-accent hover:bg-accent/10 transition-colors"
                            aria-label="Edit transaction"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() =>
                              setDeleteTarget({
                                type: "transaction",
                                id: tx._id,
                                label: formatCurrency(tx.amount),
                              })
                            }
                            className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-red-50 transition-colors"
                            aria-label="Delete transaction"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {/* ── Expenses ─────────────────────────────────────────── */}
            <Card className="mb-6">
              <header className="flex items-center justify-between mb-5 pb-4 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-warning/10 flex items-center justify-center">
                    <TrendingDown className="h-4 w-4 text-warning" />
                  </div>
                  <h3 className="text-base font-semibold text-text-main">
                    Expenses
                  </h3>
                </div>
                {canWrite && (
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={Plus}
                    onClick={() => {
                      setEditingExpense(null);
                      setShowExpenseModal(true);
                    }}
                  >
                    Add
                  </Button>
                )}
              </header>

              {payment.expenses.length === 0 ? (
                <p className="text-sm text-muted italic text-center py-8">
                  No expenses recorded yet.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {payment.expenses.map((exp) => (
                    <li
                      key={exp._id}
                      className="flex items-center justify-between py-3 gap-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-lg bg-yellow-50 flex items-center justify-center shrink-0">
                          <Receipt className="h-4 w-4 text-warning" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-warning">
                            {formatCurrency(exp.amount)}
                          </p>
                          <p className="text-xs text-muted">
                            {formatDate(exp.date)} ·{" "}
                            {EXPENSE_CATEGORY_LABELS[exp.category] ||
                              exp.category}
                            {exp.note ? ` · ${exp.note}` : ""}
                          </p>
                          {exp.recordedBy?.name && (
                            <p className="text-xs text-muted">
                              By {exp.recordedBy.name}
                            </p>
                          )}
                        </div>
                      </div>
                      {canWrite && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => {
                              setEditingExpense(exp);
                              setShowExpenseModal(true);
                            }}
                            className="p-1.5 rounded-lg text-muted hover:text-accent hover:bg-accent/10 transition-colors"
                            aria-label="Edit expense"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() =>
                              setDeleteTarget({
                                type: "expense",
                                id: exp._id,
                                label: formatCurrency(exp.amount),
                              })
                            }
                            className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-red-50 transition-colors"
                            aria-label="Delete expense"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {/* ── Amount saved ─────────────────────────────────────── */}
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-main">
                    Amount Saved (Net Profit)
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    Total Paid − Total Expenses
                  </p>
                </div>
                <p
                  className={`text-xl font-bold ${
                    payment.amountSaved >= 0 ? "text-success" : "text-danger"
                  }`}
                >
                  {formatCurrency(payment.amountSaved)}
                </p>
              </div>
            </Card>
          </>
        )}
      </section>

      {/* ── Setup modal ───────────────────────────────────────────── */}
      <Modal
        isOpen={showSetupModal}
        onClose={() => setShowSetupModal(false)}
        title={payment ? "Edit Fee Setup" : "Setup Payment"}
        onConfirm={handleSetup}
        confirmLabel={payment ? "Save Changes" : "Create Payment Record"}
        confirmLoading={mutating}
        size="sm"
      >
        {mutateError && (
          <div
            role="alert"
            className="mb-4 px-3 py-2.5 rounded-lg bg-red-50 border border-red-200 text-sm text-danger"
          >
            {mutateError}
          </div>
        )}
        <div className="flex flex-col gap-4">
          <Input
            label="Total Fee Charged"
            name="totalFeeCharged"
            type="number"
            value={setupForm.totalFeeCharged}
            onChange={(e) =>
              setSetupForm((p) => ({
                ...p,
                totalFeeCharged: e.target.value,
              }))
            }
            placeholder="e.g. 25000"
          />
          <Input
            label="Payment Deadline"
            name="paymentDeadline"
            type="date"
            value={setupForm.paymentDeadline}
            onChange={(e) =>
              setSetupForm((p) => ({
                ...p,
                paymentDeadline: e.target.value,
              }))
            }
          />
        </div>
      </Modal>

      {/* ── Transaction modal ─────────────────────────────────────── */}
      <Modal
        isOpen={showTransactionModal}
        onClose={() => {
          setShowTransactionModal(false);
          setEditingTransaction(null);
        }}
        title={editingTransaction ? "Edit Transaction" : "Add Transaction"}
        onConfirm={handleTransactionSubmit}
        confirmLabel={editingTransaction ? "Save Changes" : "Add Transaction"}
        confirmLoading={mutating}
        size="sm"
      >
        {mutateError && (
          <div
            role="alert"
            className="mb-4 px-3 py-2.5 rounded-lg bg-red-50 border border-red-200 text-sm text-danger"
          >
            {mutateError}
          </div>
        )}
        <div className="flex flex-col gap-4">
          <Input
            label="Amount"
            name="amount"
            type="number"
            value={txForm.amount}
            onChange={(e) =>
              setTxForm((p) => ({ ...p, amount: e.target.value }))
            }
            placeholder="e.g. 5000"
            required
          />
          <Input
            label="Date"
            name="date"
            type="date"
            value={txForm.date}
            onChange={(e) =>
              setTxForm((p) => ({ ...p, date: e.target.value }))
            }
            required
          />
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted uppercase tracking-wide">
              Paid To
            </label>
            <select
              value={txForm.paidTo}
              onChange={(e) =>
                setTxForm((p) => ({ ...p, paidTo: e.target.value }))
              }
              className={selectClass}
            >
              <option value="us">Us</option>
              <option value="institute">Institute</option>
            </select>
          </div>
          <Input
            label="Note"
            name="note"
            value={txForm.note}
            onChange={(e) =>
              setTxForm((p) => ({ ...p, note: e.target.value }))
            }
            placeholder="Optional note"
          />
        </div>
      </Modal>

      {/* ── Expense modal ─────────────────────────────────────────── */}
      <Modal
        isOpen={showExpenseModal}
        onClose={() => {
          setShowExpenseModal(false);
          setEditingExpense(null);
        }}
        title={editingExpense ? "Edit Expense" : "Add Expense"}
        onConfirm={handleExpenseSubmit}
        confirmLabel={editingExpense ? "Save Changes" : "Add Expense"}
        confirmLoading={mutating}
        size="sm"
      >
        {mutateError && (
          <div
            role="alert"
            className="mb-4 px-3 py-2.5 rounded-lg bg-red-50 border border-red-200 text-sm text-danger"
          >
            {mutateError}
          </div>
        )}
        <div className="flex flex-col gap-4">
          <Input
            label="Amount"
            name="amount"
            type="number"
            value={expForm.amount}
            onChange={(e) =>
              setExpForm((p) => ({ ...p, amount: e.target.value }))
            }
            placeholder="e.g. 500"
            required
          />
          <Input
            label="Date"
            name="date"
            type="date"
            value={expForm.date}
            onChange={(e) =>
              setExpForm((p) => ({ ...p, date: e.target.value }))
            }
            required
          />
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted uppercase tracking-wide">
              Category
            </label>
            <select
              value={expForm.category}
              onChange={(e) =>
                setExpForm((p) => ({ ...p, category: e.target.value }))
              }
              className={selectClass}
            >
              <option value="document">Document</option>
              <option value="shipping">Shipping</option>
              <option value="courier">Courier</option>
              <option value="other">Other</option>
            </select>
          </div>
          <Input
            label="Note"
            name="note"
            value={expForm.note}
            onChange={(e) =>
              setExpForm((p) => ({ ...p, note: e.target.value }))
            }
            placeholder="Optional note"
          />
        </div>
      </Modal>

      {/* ── Delete confirmation ───────────────────────────────────── */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={mutating}
        title={`Delete ${deleteTarget?.type === "transaction" ? "Transaction" : "Expense"}`}
        message={`Are you sure you want to remove this ${deleteTarget?.type} of ${deleteTarget?.label}?`}
        confirmLabel="Delete"
        variant="danger"
      />
    </PageWrapper>
  );
};

// ── Enrollment Picker — shown when no enrollmentId in URL ─────────────────────
const EnrollmentPicker = () => {
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/enrollments", { params: { limit: 100 } });
        setEnrollments(res.data.data.enrollments);
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = enrollments.filter(
    (e) =>
      e.candidateId?.fullName
        ?.toLowerCase()
        .includes(search.toLowerCase()) ||
      e.courseId?.shortCode?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <section aria-label="Select enrollment for payment">
      <header className="mb-6">
        <h2 className="text-xl font-semibold text-text-main">Payments</h2>
        <p className="text-sm text-muted mt-0.5">
          Select an enrollment to view or manage its payment.
        </p>
      </header>

      <Card>
        <div className="mb-4">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by candidate name or course..."
            className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-muted"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="md" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted text-center py-12 italic">
            No enrollments found.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((e) => (
              <li key={e._id}>
                <button
                  onClick={() =>
                    navigate(`/payments?enrollmentId=${e._id}`)
                  }
                  className="w-full flex items-center justify-between px-2 py-3 hover:bg-neutral rounded-lg transition-colors text-left"
                >
                  <div>
                    <p className="text-sm font-medium text-text-main">
                      {e.candidateId?.fullName}
                    </p>
                    <p className="text-xs text-muted mt-0.5">
                      {e.courseId?.shortCode} · {e.instituteId?.name}
                    </p>
                  </div>
                  <span className="text-xs text-accent font-medium">
                    View →
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </section>
  );
};

export default PaymentsPage;