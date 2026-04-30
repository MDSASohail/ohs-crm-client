import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, GraduationCap } from "lucide-react";
import { addEnrollment } from "../../features/enrollments/enrollmentsSlice";
import PageWrapper from "../../components/layout/PageWrapper";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import api from "../../config/axios";
import { toastSuccess, toastError } from "../../utils/toast";
import { usePageTitle } from "../../hooks/usePageTitle";
import {
    ENROLLMENT_STATUS_IGC,
  ENROLLMENT_STATUS_LABELS_IGC,
} from "../../constants/statuses";

const MONTHS = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => currentYear - 2 + i);

const selectClass =
    "w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent bg-white text-text-main";

const AddEnrollmentPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    usePageTitle("New Enrollment");

    // If navigated from candidate detail page, candidateId is pre-filled
    const prefilledCandidateId = searchParams.get("candidateId") || "";

    const { mutating, mutateError } = useSelector((state) => state.enrollments);

    const [form, setForm] = useState({
        candidateId: prefilledCandidateId,
        courseId: "",
        instituteId: "",
        enrollmentMonth: new Date().getMonth() + 1,
        enrollmentYear: currentYear,
        enrollmentDate: "",
        status: ENROLLMENT_STATUS_IGC.ENQUIRY,
        remarks: "",
    });

    const [errors, setErrors] = useState({});
    const [courses, setCourses] = useState([]);
    const [institutes, setInstitutes] = useState([]);
    const [candidates, setCandidates] = useState([]);
    const [candidateSearch, setCandidateSearch] = useState("");
    const [loadingDropdowns, setLoadingDropdowns] = useState(true);
    const [prefilledCandidate, setPrefilledCandidate] = useState(null);

    console.log("Courses", courses)

    // Load dropdown data
    useEffect(() => {
        const loadData = async () => {
            setLoadingDropdowns(true);
            try {
                const [cRes, iRes, candRes] = await Promise.all([
                    api.get("/courses"),
                    api.get("/institutes"),
                    api.get("/candidates", { params: { limit: 50 } }),
                ]);
                setCourses(cRes.data.data.filter((c) => c.isActive && !c.isDeleted));
                setInstitutes(iRes.data.data.filter((i) => i.isActive && !i.isDeleted));
                setCandidates(candRes.data.data.candidates);

                // If prefilled, find candidate name for display
                if (prefilledCandidateId) {
                    const found = candRes.data.data.candidates.find(
                        (c) => c._id === prefilledCandidateId
                    );
                    if (found) setPrefilledCandidate(found);
                }
            } catch {
                // Silent fail — validation will catch empty required fields
            } finally {
                setLoadingDropdowns(false);
            }
        };
        loadData();
    }, [prefilledCandidateId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));

        
    };

    const validate = () => {
        const errs = {};
        if (!form.candidateId) errs.candidateId = "Please select a candidate.";
        if (!form.courseId) errs.courseId = "Please select a course.";
        if (!form.instituteId) errs.instituteId = "Please select an institute.";
        return errs;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }

        const payload = {
            candidateId: form.candidateId,
            courseId: form.courseId,
            instituteId: form.instituteId,
            enrollmentMonth: Number(form.enrollmentMonth),
            enrollmentYear: Number(form.enrollmentYear),
            enrollmentDate: form.enrollmentDate || undefined,
            status: form.status,
            remarks: form.remarks || undefined,
        };

        

        const result = await dispatch(addEnrollment(payload));
        if (addEnrollment.fulfilled.match(result)) {
            toastSuccess("Enrollment created successfully.");
            navigate(`/enrollments/${result.payload._id}`);
        } else {
            toastError(result.payload);
        }
    };

    // Filtered candidates based on search
    const filteredCandidates = candidates.filter(
        (c) =>
            !c.isDeleted &&
            (c.fullName.toLowerCase().includes(candidateSearch.toLowerCase()) ||
                c.mobile.includes(candidateSearch))
    );

    return (
        <PageWrapper title="New Enrollment">
            <section aria-label="Create new enrollment">

                {/* ── Page header ───────────────────────────────────────────────── */}
                <header className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => navigate("/enrollments")}
                        className="p-2 rounded-lg text-muted hover:bg-white hover:text-text-main border border-border transition-colors"
                        aria-label="Go back"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </button>
                    <div>
                        <h2 className="text-xl font-semibold text-text-main">
                            New Enrollment
                        </h2>
                        <p className="text-sm text-muted mt-0.5">
                            Link a candidate to a course and institute.
                        </p>
                    </div>
                </header>

                {/* ── Server error ──────────────────────────────────────────────── */}
                {mutateError && (
                    <div
                        role="alert"
                        className="mb-6 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-danger"
                    >
                        {mutateError}
                    </div>
                )}

                <form onSubmit={handleSubmit} noValidate>

                    {/* ── Core Details ──────────────────────────────────────────── */}
                    <Card className="mb-6">
                        <header className="flex items-center gap-2.5 mb-5 pb-4 border-b border-border">
                            <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
                                <GraduationCap className="h-4 w-4 text-accent" />
                            </div>
                            <h3 className="text-base font-semibold text-text-main">
                                Enrollment Details
                            </h3>
                        </header>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                            {/* Candidate */}
                            {/* Candidate */}
                            <div className="sm:col-span-2 flex flex-col gap-1">
                                <label className="text-xs font-medium text-muted uppercase tracking-wide">
                                    Candidate <span className="text-danger">*</span>
                                </label>

                                {prefilledCandidate ? (
                                    <div className="flex items-center justify-between px-4 py-3 border border-border rounded-lg bg-neutral">
                                        <div>
                                            <p className="text-sm font-medium text-text-main">
                                                {prefilledCandidate.fullName}
                                            </p>
                                            <p className="text-xs text-muted">{prefilledCandidate.mobile}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setPrefilledCandidate(null);
                                                setForm((prev) => ({ ...prev, candidateId: "" }));
                                            }}
                                            className="text-xs text-accent hover:underline"
                                        >
                                            Change
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        {/* Search box */}
                                        <input
                                            type="text"
                                            placeholder="Search by name or mobile..."
                                            value={candidateSearch}
                                            onChange={(e) => setCandidateSearch(e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-muted"
                                        />

                                        {/* Candidate cards list */}
                                        <div
                                            className={`border rounded-lg overflow-hidden ${errors.candidateId ? "border-danger" : "border-border"
                                                }`}
                                        >
                                            {filteredCandidates.length === 0 ? (
                                                <div className="px-4 py-6 text-center text-sm text-muted">
                                                    {candidateSearch
                                                        ? `No candidates found for "${candidateSearch}"`
                                                        : "No candidates available"}
                                                </div>
                                            ) : (
                                                <ul className="max-h-52 overflow-y-auto divide-y divide-border">
                                                    {filteredCandidates.map((c) => (
                                                        <li key={c._id}>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setForm((prev) => ({ ...prev, candidateId: c._id }));
                                                                    setPrefilledCandidate(c);
                                                                    setCandidateSearch("");
                                                                    if (errors.candidateId)
                                                                        setErrors((prev) => ({ ...prev, candidateId: "" }));
                                                                }}
                                                                className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors hover:bg-accent/5 ${form.candidateId === c._id
                                                                    ? "bg-accent/10"
                                                                    : "bg-white"
                                                                    }`}
                                                            >
                                                                <div>
                                                                    <p className="text-sm font-medium text-text-main">
                                                                        {c.fullName}
                                                                    </p>
                                                                    <p className="text-xs text-muted mt-0.5">
                                                                        {c.mobile}
                                                                        {c.email ? ` · ${c.email}` : ""}
                                                                    </p>
                                                                </div>
                                                                {form.candidateId === c._id && (
                                                                    <span className="text-xs font-medium text-accent bg-accent/10 px-2 py-0.5 rounded-full shrink-0 ml-3">
                                                                        Selected
                                                                    </span>
                                                                )}
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {errors.candidateId && (
                                    <p className="text-xs text-danger">{errors.candidateId}</p>
                                )}
                            </div>

                            {/* Course */}
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-muted uppercase tracking-wide">
                                    Course <span className="text-danger">*</span>
                                </label>
                                <select
                                    name="courseId"
                                    value={form.courseId}
                                    onChange={handleChange}
                                    className={`${selectClass} ${errors.courseId ? "border-danger" : ""}`}
                                    disabled={loadingDropdowns}
                                >
                                    <option value="">— Select a course —</option>
                                    {courses.map((c) => (
                                        <option key={c._id} value={c._id}>
                                            {c.shortCode} — {c.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.courseId && (
                                    <p className="text-xs text-danger">{errors.courseId}</p>
                                )}
                            </div>

                            {/* Institute */}
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-muted uppercase tracking-wide">
                                    Institute <span className="text-danger">*</span>
                                </label>
                                <select
                                    name="instituteId"
                                    value={form.instituteId}
                                    onChange={handleChange}
                                    className={`${selectClass} ${errors.instituteId ? "border-danger" : ""}`}
                                    disabled={loadingDropdowns}
                                >
                                    <option value="">— Select an institute —</option>
                                    {institutes.map((i) => (
                                        <option key={i._id} value={i._id}>
                                            {i.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.instituteId && (
                                    <p className="text-xs text-danger">{errors.instituteId}</p>
                                )}
                            </div>

                            {/* Enrollment Month */}
                            {/* <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-muted uppercase tracking-wide">
                                    Enrollment Month
                                </label>
                                <select
                                    name="enrollmentMonth"
                                    value={form.enrollmentMonth}
                                    onChange={handleChange}
                                    className={selectClass}
                                >
                                    {MONTHS.map((m) => (
                                        <option key={m.value} value={m.value}>
                                            {m.label}
                                        </option>
                                    ))}
                                </select>
                            </div> */}

                            {/* Enrollment Year */}
                            {/* <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-muted uppercase tracking-wide">
                                    Enrollment Year
                                </label>
                                <select
                                    name="enrollmentYear"
                                    value={form.enrollmentYear}
                                    onChange={handleChange}
                                    className={selectClass}
                                >
                                    {YEARS.map((y) => (
                                        <option key={y} value={y}>
                                            {y}
                                        </option>
                                    ))}
                                </select>
                            </div> */}

                            {/* Enrollment Date */}
                            <Input
                                label="Enrollment Date"
                                name="enrollmentDate"
                                type="date"
                                value={form.enrollmentDate}
                                onChange={handleChange}
                            />

                            {/* Initial Status */}
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-muted uppercase tracking-wide">
                                    Initial Status
                                </label>
                                <select
                                    name="status"
                                    value={form.status}
                                    onChange={handleChange}
                                    className={selectClass}
                                >
                                    {Object.entries(ENROLLMENT_STATUS_IGC).map(([key, value]) => (
                                        <option key={key} value={value}>
                                            {ENROLLMENT_STATUS_LABELS_IGC[value]}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Remarks */}
                            <div className="sm:col-span-2 flex flex-col gap-1">
                                <label className="text-xs font-medium text-muted uppercase tracking-wide">
                                    Remarks
                                </label>
                                <textarea
                                    name="remarks"
                                    value={form.remarks}
                                    onChange={handleChange}
                                    placeholder="Any initial remarks about this enrollment..."
                                    rows={3}
                                    className="w-full px-3 py-2 text-sm text-text-main border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-muted resize-none"
                                />
                            </div>
                        </div>
                    </Card>

                    {/* ── Form actions ──────────────────────────────────────────── */}
                    <footer className="flex items-center justify-end gap-3">
                        <Button
                            variant="secondary"
                            type="button"
                            onClick={() => navigate("/enrollments")}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            type="submit"
                            loading={mutating}
                        >
                            Create Enrollment
                        </Button>
                    </footer>
                </form>
            </section>
        </PageWrapper>
    );
};

export default AddEnrollmentPage;