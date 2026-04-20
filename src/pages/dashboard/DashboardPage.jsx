import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePageTitle } from "../../hooks/usePageTitle";
import {
  Users,
  GraduationCap,
  CreditCard,
  TrendingUp,
  Calendar,
  ClipboardList,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  getDashboardSummary,
  getEnrollmentsByMonth,
  getPassFailRatio,
  getUpcomingDates,
  getPendingChecklist,
  getOverduePayments,
} from "../../services/dashboard.service";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatDate } from "../../utils/formatDate";
import { ENROLLMENT_STATUS_LABELS } from "../../constants/statuses";
import PageWrapper from "../../components/layout/PageWrapper";
import Card from "../../components/ui/Card";
import Spinner from "../../components/ui/Spinner";
import { EnrollmentStatusBadge } from "../../components/ui/StatusBadge";

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon: Icon, color, sub }) => (
  <article className="bg-white rounded-xl border border-border p-5 flex items-start gap-4">
    <div
      className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}
    >
      <Icon className="h-5 w-5 text-white" />
    </div>
    <div>
      <p className="text-xs font-medium text-muted uppercase tracking-wide">
        {label}
      </p>
      <p className="text-2xl font-bold text-text-main mt-0.5">{value}</p>
      {sub && <p className="text-xs text-muted mt-0.5">{sub}</p>}
    </div>
  </article>
);

// ── Section heading ───────────────────────────────────────────────────────────
const SectionHeading = ({ title, icon: Icon }) => (
  <div className="flex items-center gap-2 mb-4">
    <Icon className="h-4 w-4 text-accent" />
    <h2 className="text-base font-semibold text-text-main">{title}</h2>
  </div>
);

const DashboardPage = () => {
  usePageTitle("Dashboard");
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  const [summary, setSummary] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [passFailData, setPassFailData] = useState(null);
  const [upcomingDates, setUpcomingDates] = useState(null);
  const [pendingChecklist, setPendingChecklist] = useState(null);
  const [overduePayments, setOverduePayments] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Load all dashboard data in parallel
  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      try {
        const [
          summaryRes,
          monthlyRes,
          passFailRes,
          upcomingRes,
          checklistRes,
          overdueRes,
        ] = await Promise.all([
          getDashboardSummary(),
          getEnrollmentsByMonth(selectedYear),
          getPassFailRatio(),
          getUpcomingDates(),
          getPendingChecklist(),
          getOverduePayments(),
        ]);
        setSummary(summaryRes.data.data);
        setMonthlyData(monthlyRes.data.data.months);
        setPassFailData(passFailRes.data.data);
        setUpcomingDates(upcomingRes.data.data);
        setPendingChecklist(checklistRes.data.data);
        setOverduePayments(overdueRes.data.data);
      } catch {
        // Silent fail — individual sections show empty state
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, [selectedYear]);

  // Reload monthly chart when year changes
  const handleYearChange = async (year) => {
    setSelectedYear(year);
  };

  if (loading) {
    return (
      <PageWrapper title="Dashboard">
        <div className="flex items-center justify-center py-32">
          <Spinner size="lg" />
        </div>
      </PageWrapper>
    );
  }

  // Build enrollment status summary rows
  const statusRows = summary?.enrollmentsByStatus
    ? Object.entries(summary.enrollmentsByStatus)
        .filter(([, count]) => count > 0)
        .sort(([, a], [, b]) => b - a)
    : [];

  // Combine all upcoming dates into one flat list
  const allUpcoming = upcomingDates
    ? [
        ...(upcomingDates.ig1Dates || []).map((e) => ({
          ...e,
          dateType: "IG-1 Exam",
          date: e.ig1Date,
        })),
        ...(upcomingDates.ig2Dates || []).map((e) => ({
          ...e,
          dateType: "IG-2 Exam",
          date: e.ig2Date,
        })),
        ...(upcomingDates.interviewDates || []).map((e) => ({
          ...e,
          dateType: "Interview",
          date: e.interviewDate,
        })),
        ...(upcomingDates.resultDates || []).map((e) => ({
          ...e,
          dateType: "Result",
          date: e.resultDate,
        })),
      ].sort((a, b) => new Date(a.date) - new Date(b.date))
    : [];

  return (
    <PageWrapper title="Dashboard">
      <section aria-label="Dashboard overview">

        {/* ── Summary stats ──────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-4 mb-8 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Candidates"
            value={summary?.totalCandidates ?? 0}
            icon={Users}
            color="bg-accent"
          />
          <StatCard
            label="Active Enrollments"
            value={summary?.activeEnrollments ?? 0}
            icon={GraduationCap}
            color="bg-primary"
            sub={`${summary?.totalEnrollments ?? 0} total`}
          />
          <StatCard
            label="Total Revenue"
            value={formatCurrency(summary?.financials?.totalRevenue ?? 0)}
            icon={TrendingUp}
            color="bg-success"
          />
          <StatCard
            label="Outstanding"
            value={formatCurrency(summary?.financials?.totalOutstanding ?? 0)}
            icon={CreditCard}
            color="bg-danger"
          />
        </div>

        {/* ── Main grid ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* ── Left column (2/3 width) ──────────────────────────────── */}
          <div className="lg:col-span-2 flex flex-col gap-6">

            {/* Enrollment by month chart */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-accent" />
                  <h2 className="text-base font-semibold text-text-main">
                    Enrollments by Month
                  </h2>
                </div>
                <select
                  value={selectedYear}
                  onChange={(e) =>
                    handleYearChange(Number(e.target.value))
                  }
                  className="text-sm border border-border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-accent bg-white"
                >
                  {Array.from({ length: 5 }, (_, i) => currentYear - 2 + i).map(
                    (y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    )
                  )}
                </select>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlyData}
                    margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis
                      dataKey="monthName"
                      tick={{ fontSize: 11, fill: "#6B7280" }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#6B7280" }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid #E5E7EB",
                        fontSize: "12px",
                      }}
                    />
                    <Bar
                      dataKey="count"
                      fill="#2E86AB"
                      radius={[4, 4, 0, 0]}
                      name="Enrollments"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Pass/fail ratio by course */}
            <Card>
              <SectionHeading
                title="Pass / Fail by Course"
                icon={GraduationCap}
              />
              {!passFailData?.byCourse?.length ? (
                <p className="text-sm text-muted italic">
                  No result data available yet.
                </p>
              ) : (
                <ul className="space-y-3">
                  {passFailData.byCourse.map((item) => (
                    <li key={item._id}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-accent bg-accent/10 px-2 py-0.5 rounded">
                            {item.shortCode}
                          </span>
                          <span className="text-sm text-text-main">
                            {item.courseName}
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-success">
                          {item.passRate}% pass
                        </span>
                      </div>
                      <div className="h-2 bg-neutral rounded-full overflow-hidden flex">
                        <div
                          className="h-full bg-success transition-all"
                          style={{
                            width: `${item.passRate}%`,
                          }}
                        />
                        <div
                          className="h-full bg-danger transition-all"
                          style={{
                            width: `${100 - item.passRate}%`,
                          }}
                        />
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-xs text-success">
                          ✓ {item.pass} passed
                        </span>
                        <span className="text-xs text-danger">
                          ✗ {item.fail} failed
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {/* Overdue payments */}
            <Card>
              <SectionHeading
                title="Overdue Payments"
                icon={AlertCircle}
              />
              {!overduePayments?.payments?.length ? (
                <p className="text-sm text-muted italic">
                  No overdue payments. 🎉
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {overduePayments.payments.slice(0, 5).map((item) => (
                    <li
                      key={item.paymentId}
                      className="flex items-center justify-between py-3 gap-4"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text-main truncate">
                          {item.candidate?.fullName}
                        </p>
                        <p className="text-xs text-muted">
                          Due {formatDate(item.paymentDeadline)} ·{" "}
                          {item.daysOverdue} days overdue
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-danger">
                          {formatCurrency(item.remainingBalance)}
                        </p>
                        <button
                          onClick={() =>
                            navigate(
                              `/payments?enrollmentId=${item.enrollmentId?._id || item.enrollmentId}`
                            )
                          }
                          className="text-xs text-accent hover:underline"
                        >
                          View →
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {overduePayments?.total > 5 && (
                <p className="text-xs text-muted mt-3 text-center">
                  + {overduePayments.total - 5} more overdue
                </p>
              )}
            </Card>
          </div>

          {/* ── Right column (1/3 width) ─────────────────────────────── */}
          <div className="flex flex-col gap-6">

            {/* Enrollment status breakdown */}
            <Card>
              <SectionHeading
                title="Enrollment Status"
                icon={GraduationCap}
              />
              {statusRows.length === 0 ? (
                <p className="text-sm text-muted italic">
                  No enrollments yet.
                </p>
              ) : (
                <ul className="space-y-2.5">
                  {statusRows.map(([status, count]) => (
                    <li
                      key={status}
                      className="flex items-center justify-between"
                    >
                      <EnrollmentStatusBadge status={status} />
                      <span className="text-sm font-semibold text-text-main">
                        {count}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {/* Upcoming dates this week */}
            <Card>
              <SectionHeading
                title="This Week"
                icon={Calendar}
              />
              {allUpcoming.length === 0 ? (
                <p className="text-sm text-muted italic">
                  No upcoming dates this week.
                </p>
              ) : (
                <ul className="space-y-3">
                  {allUpcoming.slice(0, 6).map((item, index) => (
                    <li
                      key={`${item._id}-${index}`}
                      className="flex items-start gap-3"
                    >
                      <div className="h-7 w-7 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Calendar className="h-3.5 w-3.5 text-accent" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-accent">
                          {item.dateType}
                        </p>
                        <p className="text-sm text-text-main truncate">
                          {item.candidateId?.fullName}
                        </p>
                        <p className="text-xs text-muted">
                          {formatDate(item.date)} ·{" "}
                          {item.courseId?.shortCode}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {allUpcoming.length > 6 && (
                <p className="text-xs text-muted mt-3 text-center">
                  + {allUpcoming.length - 6} more
                </p>
              )}
            </Card>

            {/* Pending checklist */}
            <Card>
              <SectionHeading
                title="Pending Checklists"
                icon={ClipboardList}
              />
              {!pendingChecklist?.enrollments?.length ? (
                <p className="text-sm text-muted italic">
                  All checklists up to date. ✓
                </p>
              ) : (
                <ul className="space-y-3">
                  {pendingChecklist.enrollments.slice(0, 5).map((item) => (
                    <li key={item.enrollmentId}>
                      <button
                        onClick={() =>
                          navigate(`/enrollments/${item.enrollmentId}`)
                        }
                        className="w-full flex items-center justify-between gap-3 hover:bg-neutral rounded-lg p-2 -mx-2 transition-colors text-left"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-text-main truncate">
                            {item.candidate?.fullName}
                          </p>
                          <p className="text-xs text-muted">
                            {item.course?.shortCode} ·{" "}
                            {item.pendingSteps} step
                            {item.pendingSteps !== 1 ? "s" : ""} pending
                            {item.pendingRequiredSteps > 0 && (
                              <span className="text-danger ml-1">
                                ({item.pendingRequiredSteps} required)
                              </span>
                            )}
                          </p>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-muted shrink-0" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {pendingChecklist?.total > 5 && (
                <p className="text-xs text-muted mt-3 text-center">
                  + {pendingChecklist.total - 5} more
                </p>
              )}
            </Card>
          </div>
        </div>
      </section>
    </PageWrapper>
  );
};

export default DashboardPage;