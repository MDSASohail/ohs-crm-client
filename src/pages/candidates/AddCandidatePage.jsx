import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Phone, BookOpen, Briefcase, Users } from "lucide-react";
import { addCandidate } from "../../features/candidates/candidatesSlice";
import PageWrapper from "../../components/layout/PageWrapper";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import { toastSuccess, toastError } from "../../utils/toast";
import { usePageTitle } from "../../hooks/usePageTitle";

// Section wrapper for grouping form fields visually
const FormSection = ({ title, icon: Icon, children }) => (
  <Card className="mb-6">
    <header className="flex items-center gap-2.5 mb-5 pb-4 border-b border-border">
      <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
        <Icon className="h-4 w-4 text-accent" />
      </div>
      <h3 className="text-base font-semibold text-text-main">{title}</h3>
    </header>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
  </Card>
);

const INITIAL_FORM = {
  // Personal
  fullName: "",
  nameOnCertificate: "",
  dob: "",
  email: "",
  mobile: "",
  alternativeMobile: "",
  address: "",
  // Qualification
  qualification: "",
  currentCompany: "",
  // Family
  fatherName: "",
  fatherMobile: "",
  fatherOccupation: "",
  motherName: "",
  motherMobile: "",
  // Portal credentials
  credentialEmail: "",
  credentialPassword: "",
  // Other
  referredBy: "",
  notes: "",
};

const AddCandidatePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { mutating, mutateError } = useSelector((state) => state.candidates);
  usePageTitle("Add Candidate");

  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = "Full name is required.";
    if (!form.mobile.trim()) errs.mobile = "Mobile number is required.";
    else if (!/^\d{10}$/.test(form.mobile.trim()))
      errs.mobile = "Enter a valid 10-digit mobile number.";
    if (form.email && !/\S+@\S+\.\S+/.test(form.email))
      errs.email = "Enter a valid email address.";
    if (form.alternativeMobile && !/^\d{10}$/.test(form.alternativeMobile.trim()))
      errs.alternativeMobile = "Enter a valid 10-digit number.";
    if (form.fatherMobile && !/^\d{10}$/.test(form.fatherMobile.trim()))
      errs.fatherMobile = "Enter a valid 10-digit number.";
    if (form.motherMobile && !/^\d{10}$/.test(form.motherMobile.trim()))
      errs.motherMobile = "Enter a valid 10-digit number.";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      // Scroll to top to show errors
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Build payload — nest email credentials
    const payload = {
      fullName: form.fullName,
      nameOnCertificate: form.nameOnCertificate || undefined,
      dob: form.dob || undefined,
      email: form.email || undefined,
      mobile: form.mobile,
      alternativeMobile: form.alternativeMobile || undefined,
      address: form.address || undefined,
      qualification: form.qualification || undefined,
      currentCompany: form.currentCompany || undefined,
      fatherName: form.fatherName || undefined,
      fatherMobile: form.fatherMobile || undefined,
      fatherOccupation: form.fatherOccupation || undefined,
      motherName: form.motherName || undefined,
      motherMobile: form.motherMobile || undefined,
      emailCredential: {
        email: form.credentialEmail || undefined,
        password: form.credentialPassword || undefined,
      },
      referredBy: form.referredBy || undefined,
      notes: form.notes || undefined,
    };

    const result = await dispatch(addCandidate(payload));
    console.log("Result of candidate", result)
    if (addCandidate.fulfilled.match(result)) {
      toastSuccess("Candidate added successfully.");
      navigate(`/candidates/${result.payload.candidate._id}`);
    } else {
      toastError(result.payload);
    }
  };

  return (
    <PageWrapper title="Add Candidate">
      <section aria-label="Add new candidate">

        {/* ── Page header ──────────────────────────────────────────────── */}
        <header className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate("/candidates")}
            className="p-2 rounded-lg text-muted hover:bg-white hover:text-text-main border border-border transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h2 className="text-xl font-semibold text-text-main">
              Add New Candidate
            </h2>
            <p className="text-sm text-muted mt-0.5">
              Fill in the details below. Only name and mobile are required.
            </p>
          </div>
        </header>

        {/* ── Server error ─────────────────────────────────────────────── */}
        {mutateError && (
          <div
            role="alert"
            className="mb-6 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-danger"
          >
            {mutateError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* ── Personal Information ──────────────────────────────────── */}
          <FormSection title="Personal Information" icon={User}>
            <Input
              label="Full Name"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="e.g. Nahid Hussain"
              error={errors.fullName}
              required
            />
            <Input
              label="Name on Certificate"
              name="nameOnCertificate"
              value={form.nameOnCertificate}
              onChange={handleChange}
              placeholder="As it should appear on certificate"
            />
            <Input
              label="Date of Birth"
              name="dob"
              type="date"
              value={form.dob}
              onChange={handleChange}
            />
            <Input
              label="Email Address"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="e.g. nahid@example.com"
              error={errors.email}
            />
            <Input
              label="Mobile Number"
              name="mobile"
              value={form.mobile}
              onChange={handleChange}
              placeholder="10-digit mobile number"
              error={errors.mobile}
              required
            />
            <Input
              label="Alternative Mobile"
              name="alternativeMobile"
              value={form.alternativeMobile}
              onChange={handleChange}
              placeholder="10-digit mobile number"
              error={errors.alternativeMobile}
            />
            {/* Address spans full width */}
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-muted uppercase tracking-wide block mb-1">
                Address
              </label>
              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Full address"
                rows={3}
                className="w-full px-3 py-2 text-sm text-text-main border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent placeholder:text-muted resize-none"
              />
            </div>
            <Input
              label="Referred By"
              name="referredBy"
              value={form.referredBy}
              onChange={handleChange}
              placeholder="e.g. Facebook Ad, WhatsApp, Friend"
            />
          </FormSection>

          {/* ── Qualification & Employment ────────────────────────────── */}
          <FormSection title="Qualification & Employment" icon={BookOpen}>
            <Input
              label="Qualification"
              name="qualification"
              value={form.qualification}
              onChange={handleChange}
              placeholder="e.g. B.Tech, MBA, Diploma"
            />
            <Input
              label="Current Company"
              name="currentCompany"
              value={form.currentCompany}
              onChange={handleChange}
              placeholder="e.g. XYZ Safety Ltd"
            />
          </FormSection>

          {/* ── Family Information ────────────────────────────────────── */}
          <FormSection title="Family Information" icon={Users}>
            <Input
              label="Father's Name"
              name="fatherName"
              value={form.fatherName}
              onChange={handleChange}
              placeholder="Father's full name"
            />
            <Input
              label="Father's Mobile"
              name="fatherMobile"
              value={form.fatherMobile}
              onChange={handleChange}
              placeholder="10-digit mobile number"
              error={errors.fatherMobile}
            />
            <Input
              label="Father's Occupation"
              name="fatherOccupation"
              value={form.fatherOccupation}
              onChange={handleChange}
              placeholder="e.g. Business, Service"
            />
            <Input
              label="Mother's Name"
              name="motherName"
              value={form.motherName}
              onChange={handleChange}
              placeholder="Mother's full name"
            />
            <Input
              label="Mother's Mobile"
              name="motherMobile"
              value={form.motherMobile}
              onChange={handleChange}
              placeholder="10-digit mobile number"
              error={errors.motherMobile}
            />
          </FormSection>

          {/* ── Institute Portal Credentials ──────────────────────────── */}
          <FormSection title="Institute Portal Credentials" icon={Briefcase}>
            <Input
              label="Portal Email"
              name="credentialEmail"
              type="email"
              value={form.credentialEmail}
              onChange={handleChange}
              placeholder="Candidate's institute login email"
            />
            <Input
              label="Portal Password"
              name="credentialPassword"
              value={form.credentialPassword}
              onChange={handleChange}
              placeholder="Candidate's institute login password"
            />
          </FormSection>

          {/* ── Notes ─────────────────────────────────────────────────── */}
          <Card className="mb-6">
            <header className="flex items-center gap-2.5 mb-5 pb-4 border-b border-border">
              <h3 className="text-base font-semibold text-text-main">
                Additional Notes
              </h3>
            </header>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Any additional notes about this candidate..."
              rows={4}
              className="w-full px-3 py-2 text-sm text-text-main border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent placeholder:text-muted resize-none"
            />
          </Card>

          {/* ── Form actions ──────────────────────────────────────────── */}
          <footer className="flex items-center justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => navigate("/candidates")}
              type="button"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              loading={mutating}
            >
              Save Candidate
            </Button>
          </footer>
        </form>
      </section>
    </PageWrapper>
  );
};

export default AddCandidatePage;