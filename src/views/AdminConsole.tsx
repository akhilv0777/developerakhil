"use client";

import NextImage from "next/image";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Bell,
  Briefcase,
  Building2,
  Check,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Clock3,
  Eye,
  EyeOff,
  ExternalLink,
  GraduationCap,
  KeyRound,
  Layers,
  Layout,
  LayoutDashboard,
  Maximize2,
  Minimize2,
  PanelLeftClose,
  PanelLeftOpen,
  Lock,
  LogOut,
  type LucideIcon,
  Mail,
  MailOpen,
  Menu,
  Palette,
  Globe2,
  Pencil,
  Plus,
  Quote,
  Reply,
  RotateCcw,
  Save,
  Search,
  Settings,
  Square,
  Smartphone,
  Sun,
  Moon,
  Monitor,
  Trash2,
  User,
  X,
} from "lucide-react";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { useMotionFlow } from "@/lib/motionflow";
import type {
  Education,
  Experience,
  PortfolioData,
  Profile,
  Project,
  SectionPattern,
  Service,
  Stat,
  Testimonial,
} from "@/lib/portfolio-types";
import {
  useAuthQuery,
  usePortfolioQuery,
  useResetPortfolioMutation,
  useSavePortfolioMutation,
} from "@/lib/portfolio-api";
import { PortfolioLoading } from "./PublicSite";
import { useTurnstile } from "@/components/Turnstile";

// ---------------------------------------------------------------------
// Console / Admin area - content editing, protected by /api/auth.
// ---------------------------------------------------------------------

function PasswordInput({
  value,
  onChange,
  placeholder,
  required = true,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        required={required}
        type={visible ? "text" : "password"}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-3 pr-11 text-sm text-foreground outline-none transition-all focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10"
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute right-3 top-1/2 flex -translate-y-1/2 cursor-pointer items-center justify-center text-muted-foreground hover:text-primary"
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

function LoginPage() {
  const queryClient = useQueryClient();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [forgotMode, setForgotMode] = useState(false);
  const [loginMode, setLoginMode] = useState<"password" | "otp">("password");
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);
  const [otpChallengeId, setOtpChallengeId] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { containerRef: turnstileRef, execute: executeTurnstile } =
    useTurnstile("auth");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const turnstileToken = await executeTurnstile();
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: username,
          password,
          loginMode,
          "cf-turnstile-response": turnstileToken,
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(body.error || "Login failed.");
        return;
      }
      if (body.requiresOtp) {
        setOtpChallengeId(body.challengeId);
        setPassword("");
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOtpSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId: otpChallengeId, otp }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(body.error || "Verification failed.");
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setForgotMessage(null);
    setSubmitting(true);
    try {
      const turnstileToken = await executeTurnstile();
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: username,
          "cf-turnstile-response": turnstileToken,
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(body.error || "Could not send reset email.");
      setForgotMessage(body.message);
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-dvh bg-background grid-dots">
      {/* Brand panel - desktop only */}
      <div className="relative hidden w-[44%] flex-col justify-between overflow-hidden bg-card border-r border-border p-12 text-foreground lg:flex">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/20 blur-[100px]" />
        <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-primary/10 blur-[100px]" />

        <div className="relative flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary font-mono text-sm font-bold text-background">
            AV
          </span>
          <span className="font-mono text-[11px] font-bold uppercase tracking-[.2em] text-foreground/70">
            Console
          </span>
        </div>

        <div className="relative">
          <h1 className="text-[clamp(2.2rem,3.2vw,3rem)] font-bold leading-[1.1] tracking-tight">
            Run the site
            <br />
            <span className="text-gradient">from one place.</span>
          </h1>
          <p className="mt-5 max-w-sm text-sm leading-[1.7] text-muted-foreground">
            Profile, projects, timeline, testimonials - every section of the
            portfolio is editable here and reflected on the live site right
            away.
          </p>

          <ul className="mt-10 flex flex-col gap-4">
            {[
              "Edits publish instantly, no deploys.",
              "Every change is saved to the live database.",
              "Made a mistake? Reset to the defaults anytime.",
            ].map((line) => (
              <li
                key={line}
                className="flex items-start gap-3 text-sm text-foreground/80"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                  <Check size={12} />
                </span>
                {line}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60">
          (c) {new Date().getFullYear()} - Secure admin access
        </p>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center px-5 py-16">
        <div className="w-full max-w-sm bento-card glow-border p-6 rounded-xl">
          <div className="mb-8 flex flex-col gap-2 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-background">
              <Lock size={18} />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-foreground">
            {forgotMode
              ? "Reset your password"
              : otpChallengeId
                ? "Enter verification code"
                : "Sign in to Console"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {forgotMode
              ? "Enter your username or admin email to receive a reset link."
              : otpChallengeId
                ? loginMode === "password"
                  ? "Your password was accepted. We sent a 6-digit code to your admin email."
                  : "We sent a 6-digit code to your admin email."
                : loginMode === "otp"
                  ? "We will send a one-time code to your admin email."
                  : "Enter your credentials to manage the site."}
          </p>

          <form
            onSubmit={
              forgotMode
                ? handleForgotPassword
                : otpChallengeId
                  ? handleOtpSubmit
                  : handleSubmit
            }
            className="mt-8 flex flex-col gap-5"
          >
            <div>
              <div ref={turnstileRef} aria-hidden="true" />
            </div>
            {!forgotMode && !otpChallengeId && (
              <div className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-secondary/30 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setLoginMode("password");
                    setError(null);
                  }}
                  className={`rounded-md px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors ${loginMode === "password" ? "bg-primary text-background" : "text-muted-foreground hover:text-foreground"}`}
                >
                  Password
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginMode("otp");
                    setPassword("");
                    setError(null);
                  }}
                  className={`rounded-md px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors ${loginMode === "otp" ? "bg-primary text-background" : "text-muted-foreground hover:text-foreground"}`}
                >
                  OTP
                </button>
              </div>
            )}
            {!otpChallengeId && (
              <label className="block">
                <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {forgotMode
                    ? "Username or admin email"
                    : "Username or admin email"}
                </span>
                <input
                  required
                  autoFocus
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10 text-foreground"
                />
              </label>
            )}
            {loginMode === "password" && !forgotMode && !otpChallengeId && (
              <label className="block">
                <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Password
                </span>
                <PasswordInput value={password} onChange={setPassword} />
              </label>
            )}
            {otpChallengeId && (
              <label className="block">
                <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  6-digit OTP
                </span>
                <input
                  required
                  autoFocus
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={otp}
                  onChange={(event) =>
                    setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-3 text-center text-lg tracking-[.45em] text-foreground outline-none transition-all focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10"
                />
              </label>
            )}
            {error && (
              <p className="rounded-lg bg-red-900/30 border border-red-500/50 p-3 font-mono text-[10px] font-bold text-red-400 text-center">
                {error}
              </p>
            )}
            {forgotMessage && (
              <p className="rounded-lg border border-primary/30 bg-primary/10 p-3 text-center font-mono text-[10px] font-bold text-primary">
                {forgotMessage}
              </p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3.5 font-mono text-[11px] font-bold uppercase tracking-wider text-background transition-all hover:bg-primary/90 disabled:opacity-50 hover:shadow-[0_0_15px_hsl(var(--primary)/0.35)]"
            >
              {forgotMode ? (
                <Mail size={14} />
              ) : otpChallengeId ? (
                <KeyRound size={14} />
              ) : loginMode === "otp" ? (
                <KeyRound size={14} />
              ) : (
                <Lock size={14} />
              )}
              {submitting
                ? "Please wait..."
                : forgotMode
                  ? "Send reset link"
                  : otpChallengeId
                    ? "Verify and sign in"
                    : loginMode === "otp"
                      ? "Send OTP"
                      : "Sign in"}
            </button>
            {otpChallengeId ? (
              <button
                type="button"
                onClick={() => {
                  setOtpChallengeId(null);
                  setOtp("");
                  setError(null);
                }}
                className="cursor-pointer text-center font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-primary"
              >
                Start over
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setForgotMode((value) => !value);
                  setError(null);
                  setForgotMessage(null);
                }}
                className="cursor-pointer text-center font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-primary"
              >
                {forgotMode ? "Back to sign in" : "Forgot password?"}
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

type Resource =
  | "stats"
  | "services"
  | "projects"
  | "education"
  | "experience"
  | "testimonials";
const resourceMeta: Record<
  Resource,
  { label: string; singular: string; icon: LucideIcon }
> = {
  stats: { label: "Stats", singular: "stat", icon: BarChart3 },
  services: { label: "Services", singular: "service", icon: Layers },
  projects: { label: "Projects", singular: "project", icon: Briefcase },
  education: { label: "Education", singular: "education", icon: GraduationCap },
  experience: { label: "Experience", singular: "role", icon: Building2 },
  testimonials: { label: "Testimonials", singular: "testimonial", icon: Quote },
};
const sectionPatternOptions: Array<{ value: SectionPattern; label: string }> = [
  { value: "none", label: "None" },
  ...Array.from({ length: 7 }, (_, index) => {
    const number = String(index + 1).padStart(2, "0");
    return {
      value: `pattern-${number}` as SectionPattern,
      label: `Pattern ${number}`,
    };
  }),
];

const patternBackgrounds: Partial<Record<SectionPattern, string>> = {
  "pattern-01":
    "repeating-linear-gradient(45deg, transparent 0 24px, rgba(0, 0, 0, .12) 24px 25px)",
  "pattern-02":
    "linear-gradient(rgba(0, 0, 0, .12) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, .12) 1px, transparent 1px)",
  "pattern-03": "radial-gradient(rgba(0, 0, 0, .16) 1px, transparent 1px)",
  "pattern-04":
    "repeating-radial-gradient(circle at 100% 100%, rgba(0, 0, 0, .12) 0 1px, transparent 1px 20px)",
  "pattern-05":
    "repeating-conic-gradient(from 0deg at 50% 50%, rgba(0, 0, 0, .12) 0deg 1deg, transparent 1deg 9deg)",
  "pattern-06":
    "repeating-linear-gradient(60deg, rgba(0, 0, 0, .12) 0 1px, transparent 1px 18px), repeating-linear-gradient(120deg, rgba(0, 0, 0, .12) 0 1px, transparent 1px 18px), repeating-linear-gradient(0deg, rgba(0, 0, 0, .12) 0 1px, transparent 1px 31px)",
  "pattern-07":
    "repeating-linear-gradient(45deg, rgba(0, 0, 0, .12) 0 8px, transparent 8px 16px)",
};

function PatternPicker({
  value,
  onChange,
}: {
  value: SectionPattern;
  onChange: (value: SectionPattern) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected =
    sectionPatternOptions.find((option) => option.value === value) ||
    sectionPatternOptions[0];
  return (
    <div className="relative min-w-0 flex-1">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 rounded-lg border border-border bg-background px-2 py-2 text-left hover:border-primary/50"
      >
        <span
          className={`h-8 w-14 shrink-0 rounded border border-border bg-background ${value === "none" ? "" : `kf-${value}`}`}
          style={{ backgroundImage: patternBackgrounds[value] }}
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1 truncate font-mono text-[10px] font-bold uppercase tracking-wider text-foreground">
          {selected.label}
        </span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <>
          <button
            type="button"
            aria-label="Close pattern picker"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-y-auto rounded-lg border border-border bg-card p-1 shadow-2xl">
            {sectionPatternOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-md p-2 text-left hover:bg-secondary ${option.value === value ? "bg-primary/10" : ""}`}
              >
                <span
                  className={`h-10 w-20 shrink-0 rounded border border-border bg-background ${option.value === "none" ? "" : `kf-${option.value}`}`}
                  style={{ backgroundImage: patternBackgrounds[option.value] }}
                  aria-hidden="true"
                />
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-foreground">
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
const emptyFor = (resource: Resource): PortfolioData[Resource][number] => {
  const id = `${resource.slice(0, -1)}-${Date.now()}`;
  if (resource === "stats") return { id, value: "", label: "" } as Stat;
  if (resource === "services")
    return { id, number: "0X", title: "", description: "" } as Service;
  if (resource === "projects")
    return {
      id,
      title: "",
      category: "",
      year: String(new Date().getFullYear()),
      description: "",
      tags: "",
      accent: "lime",
      image: "",
      liveUrl: "",
    } as Project;
  if (resource === "education")
    return {
      id,
      degree: "",
      institution: "",
      period: "",
      detail: "",
    } as Education;
  if (resource === "experience")
    return { id, role: "", company: "", period: "", detail: "" } as Experience;
  return { id, quote: "", name: "", role: "" } as Testimonial;
};
const itemTitle = (
  item: Stat | Service | Project | Education | Experience | Testimonial,
): string => {
  if ("value" in item && "label" in item)
    return `${item.value || "-"} - ${item.label || "Untitled"}`;
  if ("title" in item) return item.title || "Untitled";
  if ("degree" in item) return item.degree || "Untitled";
  if ("role" in item && "company" in item) return item.role || "Untitled";
  if ("name" in item) return item.name || "Untitled";
  return "Untitled";
};
const itemSubtitle = (
  item: Stat | Service | Project | Education | Experience | Testimonial,
): string => {
  if ("description" in item) return String(item.description);
  if ("institution" in item) return String(item.institution);
  if ("company" in item) return String(item.company);
  if ("detail" in item) return String(item.detail);
  if ("quote" in item) return String(item.quote);
  return "";
};

function fileToResizedDataUrl(file: File, maxDimension = 480): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () =>
        reject(new Error("That file does not look like a valid image."));
      img.onload = () => {
        const scale = Math.min(
          1,
          maxDimension / Math.max(img.width, img.height),
        );
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx)
          return reject(
            new Error("Image processing is not supported in this browser."),
          );
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function AdminForm({
  resource,
  value,
  mode,
  onSave,
  onCancel,
}: {
  resource: Resource;
  value: PortfolioData[Resource][number];
  mode: "new" | "edit";
  onSave: (value: PortfolioData[Resource][number]) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Record<string, string>>(
    () => ({ ...value }) as unknown as Record<string, string>,
  );

  const fields: Record<Resource, string[]> = {
    stats: ["value", "label"],
    services: ["number", "title", "description"],
    projects: [
      "title",
      "category",
      "year",
      "description",
      "tags",
      "accent",
      "image",
      "liveUrl",
    ],
    education: ["degree", "institution", "period", "detail"],
    experience: ["role", "company", "period", "detail"],
    testimonials: ["quote", "name", "role"],
  };
  const labels: Record<string, string> = {
    value: "Value (e.g. 06, 100+, infinity)",
    label: "Label (e.g. years making)",
    number: "Index",
    title: "Title",
    description: "Description",
    category: "Category",
    year: "Year",
    tags: "Tags",
    accent: "Color treatment Fallback",
    degree: "Degree",
    institution: "Institution",
    period: "Period",
    detail: "Detail",
    role: "Role",
    company: "Company",
    quote: "Quote",
    name: "Name",
    image: "Project Image (Optional)",
    liveUrl: "Live Project URL (Optional)",
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    field: string,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await fileToResizedDataUrl(file);
      setForm((prev) => ({ ...prev, [field]: dataUrl }));
    } catch (error) {
      console.error(error);
    } finally {
      event.target.value = "";
    }
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSave({ ...value, ...form } as PortfolioData[Resource][number]);
      }}
      className="bento-card glow-border p-0"
    >
      <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
        <h3 className="font-semibold text-foreground">
          {mode === "edit" ? "Edit" : "New"} {resourceMeta[resource].singular}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close"
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <X size={16} />
        </button>
      </div>

      <div className="grid gap-6 p-5 sm:p-6 md:grid-cols-2">
        {fields[resource].map((field) => (
          <label
            key={field}
            className={
              field === "description" ||
              field === "detail" ||
              field === "quote" ||
              field === "image"
                ? "md:col-span-2"
                : ""
            }
          >
            <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {labels[field]}
            </span>
            {field === "image" ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-lg border border-border bg-secondary/50 p-4">
                {form[field] ? (
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <NextImage
                      src={form[field]}
                      alt="Preview"
                      width={64}
                      height={64}
                      className="h-16 w-16 shrink-0 rounded-lg object-cover shadow-sm ring-1 ring-border"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({ ...prev, [field]: "" }))
                      }
                      className="font-mono text-[10px] font-bold text-red-500 uppercase tracking-wider hover:underline whitespace-nowrap"
                    >
                      Remove Image
                    </button>
                  </div>
                ) : (
                  <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                    No image uploaded.
                  </span>
                )}
                <label className="sm:ml-auto inline-flex w-full sm:w-auto cursor-pointer items-center justify-center rounded-md border border-primary/50 bg-primary/10 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-primary hover:bg-primary/20 transition-colors whitespace-nowrap">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, field)}
                    className="hidden"
                  />
                  {form[field] ? "Replace Image" : "Upload Image"}
                </label>
              </div>
            ) : field === "description" && resource === "projects" ? (
              <div className="overflow-hidden rounded-lg border border-border bg-secondary/50">
                <div className="flex items-center gap-1 border-b border-border bg-secondary px-3 py-2">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Classic editor
                  </span>
                  <button
                    type="button"
                    onClick={() => document.execCommand("bold")}
                    className="ml-auto cursor-pointer rounded px-2 py-1 font-bold text-foreground hover:bg-background"
                  >
                    B
                  </button>
                  <button
                    type="button"
                    onClick={() => document.execCommand("italic")}
                    className="cursor-pointer rounded px-2 py-1 italic text-foreground hover:bg-background"
                  >
                    I
                  </button>
                </div>
                <textarea
                  required
                  value={form[field] || ""}
                  rows={6}
                  onChange={(event) =>
                    setForm({ ...form, [field]: event.target.value })
                  }
                  className="w-full resize-y bg-transparent px-4 py-3 text-sm text-foreground outline-none"
                  placeholder="Explain the project, your contribution, and the result..."
                />
              </div>
            ) : field === "accent" ? (
              <select
                value={form[field] || ""}
                onChange={(event) =>
                  setForm({ ...form, [field]: event.target.value })
                }
                className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm outline-none focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/20 text-foreground"
              >
                <option value="lime">Lime</option>
                <option value="coral">Coral</option>
                <option value="blue">Blue</option>
              </select>
            ) : field === "description" ||
              field === "detail" ||
              field === "quote" ? (
              <textarea
                required
                value={form[field] || ""}
                rows={4}
                onChange={(event) =>
                  setForm({ ...form, [field]: event.target.value })
                }
                className="w-full resize-y rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm outline-none focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/20 text-foreground"
              />
            ) : (
              <input
                required={field !== "liveUrl"}
                value={form[field] || ""}
                onChange={(event) =>
                  setForm({ ...form, [field]: event.target.value })
                }
                className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm outline-none focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/20 text-foreground"
              />
            )}
          </label>
        ))}
      </div>
      <div className="flex flex-col gap-3 border-t border-border px-5 py-4 sm:flex-row sm:px-6">
        <button
          type="submit"
          className="inline-flex w-full sm:w-auto justify-center items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-mono text-[11px] font-bold uppercase tracking-wider text-background hover:bg-primary/90 hover:shadow-[0_0_10px_rgba(0,255,136,0.3)] transition-all"
        >
          <Save size={14} /> Save {resourceMeta[resource].singular}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg w-full sm:w-auto border border-border bg-transparent px-5 py-2.5 font-mono text-[11px] font-bold uppercase tracking-wider text-foreground hover:bg-secondary transition-all"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function ProfileEditor({
  profile,
  onSave,
  saving,
}: {
  profile: Profile;
  onSave: (value: Profile) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<Profile>(profile);
  const [skillsRaw, setSkillsRaw] = useState((profile.skills || []).join(", "));
  const [languagesRaw, setLanguagesRaw] = useState(
    (profile.languages || []).join(", "),
  );
  const [rolesRaw, setRolesRaw] = useState((profile.roles || []).join(", "));
  const [imageError, setImageError] = useState<string | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);
  useEffect(() => {
    // Sync form state when profile prop changes
    // Multiple setState calls are necessary to keep all form fields in sync
    // eslint-disable-next-line
    setForm({ ...profile });
    setSkillsRaw((profile.skills || []).join(", "));
    setLanguagesRaw((profile.languages || []).join(", "));
    setRolesRaw((profile.roles || []).join(", "));
  }, [profile]);

  const fields: { key: keyof Profile; label: string; long?: boolean }[] = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "whatsapp", label: "WhatsApp" },
    { key: "tagline", label: "Tagline" },
    { key: "location", label: "Location" },
    { key: "github", label: "GitHub (e.g. github.com/you)" },
    { key: "linkedin", label: "LinkedIn" },
    { key: "bio1", label: "Headline bio", long: true },
    { key: "bio2", label: "About paragraph 1", long: true },
    { key: "bio3", label: "About paragraph 2", long: true },
    { key: "contactTitle", label: "Contact heading", long: true },
    { key: "contactNote", label: "Contact note" },
  ];

  const handleImage = async (
    event: React.ChangeEvent<HTMLInputElement>,
    field: "heroImage" | "aboutImage",
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageError(null);
    try {
      const dataUrl = await fileToResizedDataUrl(file);
      setForm((current) => ({ ...current, [field]: dataUrl }));
    } catch (error) {
      setImageError((error as Error).message);
    } finally {
      event.target.value = "";
    }
  };

  const handleResume = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setResumeError(null);
    if (file.size > 2 * 1024 * 1024) {
      setResumeError("That file is too large - please keep it under 2MB.");
      event.target.value = "";
      return;
    }
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error("Could not read that file."));
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      setForm((current) => ({
        ...current,
        resume: dataUrl,
        resumeName: file.name,
      }));
    } catch (error) {
      setResumeError((error as Error).message);
    } finally {
      event.target.value = "";
    }
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSave({
          ...form,
          whatsapp: (form.whatsapp ?? "").trim(),
          roles: rolesRaw
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          skills: skillsRaw
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          languages: languagesRaw
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        });
      }}
      className="bento-card p-5 md:p-6"
    >
      <div className="mb-8 grid gap-6 md:grid-cols-2">
        <div className="flex items-center gap-5">
          <div className="group relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 border-border bg-secondary transition-colors hover:border-primary">
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-full">
              {form.heroImage || form.image ? (
                <NextImage
                  src={form.heroImage || form.image}
                  alt="Profile"
                  width={80}
                  height={80}
                  className="h-full w-full object-cover"
                />
              ) : (
                <User size={22} className="text-muted-foreground" />
              )}
            </div>
            <label
              className="absolute -bottom-1 -right-1 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-card bg-primary text-background shadow-md transition-transform hover:scale-110"
              title="Change hero image"
            >
              <input
                type="file"
                accept="image/*"
                onChange={(event) => handleImage(event, "heroImage")}
                className="hidden"
              />
              <Pencil size={12} />
            </label>
          </div>
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-foreground">
              Hero image
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Click the pencil to change it.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-lg border border-border bg-secondary/30 p-3">
          <div className="group relative flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-secondary">
            {form.aboutImage ? (
              <NextImage
                src={form.aboutImage}
                alt="About"
                width={96}
                height={64}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="font-mono text-[9px] uppercase text-muted-foreground">
                No image
              </span>
            )}
            <label
              className="absolute bottom-1 right-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-card bg-primary text-background shadow-md transition-transform hover:scale-110"
              title="Change about image"
            >
              <input
                type="file"
                accept="image/*"
                onChange={(event) => handleImage(event, "aboutImage")}
                className="hidden"
              />
              <Pencil size={11} />
            </label>
          </div>
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-foreground">
              About image
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Use a different image for the About section.
            </p>
          </div>
        </div>
        {imageError && (
          <p className="font-mono text-[11px] text-red-400 md:col-span-2">
            {imageError}
          </p>
        )}
      </div>

      <div className="mb-10 rounded-lg bg-secondary/30 p-5 md:p-6 border border-border min-w-0">
        <span className="mb-4 block font-mono text-[11px] font-bold uppercase tracking-wider text-foreground">
          Resume Document
        </span>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <label className="inline-flex w-full sm:w-auto cursor-pointer items-center justify-center rounded-md border border-primary/50 bg-primary/10 px-6 py-3 font-mono text-[11px] font-bold uppercase tracking-wider text-primary hover:bg-primary/20 transition-colors whitespace-nowrap">
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleResume}
              className="hidden"
            />
            {form.resume ? "Replace file" : "Upload file"}
          </label>
          {form.resume && (
            <div className="flex items-center gap-4 min-w-0 w-full sm:w-auto">
              <span className="font-mono text-[12px] font-medium text-foreground truncate">
                {form.resumeName || "resume.pdf"}
              </span>
              <button
                type="button"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    resume: "",
                    resumeName: "",
                  }))
                }
                className="shrink-0 font-mono text-[11px] font-bold uppercase text-red-500 hover:underline"
              >
                Remove
              </button>
            </div>
          )}
        </div>
        {resumeError && (
          <p className="mt-3 font-mono text-[11px] text-red-400">
            {resumeError}
          </p>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {fields.map(({ key, label, long }) => (
          <label key={key} className={long ? "md:col-span-2" : ""}>
            <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {label}
            </span>
            {long ? (
              <textarea
                required
                value={String(form[key] ?? "")}
                rows={3}
                onChange={(event) =>
                  setForm({ ...form, [key]: event.target.value })
                }
                className="w-full resize-y rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/20 text-foreground"
              />
            ) : (
              <input
                required
                value={String(form[key] ?? "")}
                onChange={(event) =>
                  setForm({ ...form, [key]: event.target.value })
                }
                className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/20 text-foreground"
              />
            )}
          </label>
        ))}
        <label className="md:col-span-2">
          <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Roles (comma separated)
          </span>
          <textarea
            value={rolesRaw}
            rows={2}
            onChange={(event) => setRolesRaw(event.target.value)}
            className="w-full resize-y rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/20 text-foreground"
          />
        </label>
        <label className="md:col-span-2">
          <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Skills (comma separated)
          </span>
          <textarea
            value={skillsRaw}
            rows={3}
            onChange={(event) => setSkillsRaw(event.target.value)}
            className="w-full resize-y rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/20 text-foreground"
          />
        </label>
        <label className="md:col-span-2">
          <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Languages (comma separated)
          </span>
          <textarea
            value={languagesRaw}
            rows={3}
            onChange={(event) => setLanguagesRaw(event.target.value)}
            className="w-full resize-y rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/20 text-foreground"
          />
        </label>
      </div>
      <div className="mt-8 flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex w-full sm:w-auto justify-center items-center gap-2 rounded-lg bg-primary px-8 py-3.5 font-mono text-[11px] font-bold uppercase tracking-wider text-background hover:bg-primary/90 hover:shadow-[0_0_10px_rgba(0,255,136,0.3)] transition-all disabled:opacity-50 whitespace-nowrap"
        >
          <Save size={16} /> Save profile
        </button>
      </div>
    </form>
  );
}

function StatTile({
  icon: Icon,
  label,
  count,
  active,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`bento-card flex flex-col items-start gap-3 p-4 text-left transition-all ${
        active
          ? "border-primary/40 bg-primary/5 shadow-[0_0_15px_rgba(0,255,136,0.1)]"
          : "hover:border-primary/30 hover:bg-secondary/40"
      }`}
    >
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-lg ${
          active ? "bg-primary text-background" : "bg-secondary text-primary"
        }`}
      >
        <Icon size={15} />
      </span>
      <div>
        <p className="font-mono text-3xl font-bold text-primary leading-none text-gradient">
          {String(count).padStart(2, "0")}
        </p>
        <p className="mt-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
      </div>
    </button>
  );
}

function ChangePasswordModal({
  onClose,
  isLight,
}: {
  onClose: () => void;
  isLight: boolean;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError("New passwords don't match.");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setError(body.error || "Could not change password.");
        return;
      }
      toast({
        title: "Password updated",
        description: "Use your new password next time you sign in.",
      });
      onClose();
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-60 flex items-center justify-center overflow-y-auto p-4">
      <button
        aria-label="Close"
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
      />
      <div
        style={
          isLight
            ? ({
                "--background": "0 0% 98%",
                "--foreground": "220 25% 12%",
                "--border": "220 18% 86%",
                "--card": "0 0% 100%",
                "--card-border": "220 18% 88%",
                "--secondary": "220 17% 96%",
                "--muted-foreground": "220 9% 40%",
              } as React.CSSProperties)
            : undefined
        }
        className="relative my-auto max-h-[90vh] w-full max-w-sm overflow-y-auto bento-card bg-card p-5 shadow-2xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground">Change password</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary"
          >
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="block">
            <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Current password
            </span>
            <PasswordInput
              value={currentPassword}
              onChange={setCurrentPassword}
            />
          </label>
          <label className="block">
            <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              New password
            </span>
            <PasswordInput value={newPassword} onChange={setNewPassword} />
          </label>
          <label className="block">
            <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Confirm new password
            </span>
            <PasswordInput
              value={confirmPassword}
              onChange={setConfirmPassword}
            />
          </label>
          {error && (
            <p className="rounded-lg bg-red-900/30 border border-red-500/50 p-3 font-mono text-[10px] font-bold text-red-400 text-center">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full justify-center items-center gap-2 rounded-lg bg-primary px-6 py-3 font-mono text-[11px] font-bold uppercase tracking-wider text-background hover:bg-primary/90 hover:shadow-[0_0_10px_rgba(0,255,136,0.3)] transition-all disabled:opacity-50"
          >
            <KeyRound size={16} /> Update password
          </button>
        </form>
      </div>
    </div>,
    document.body,
  );
}

function ChangeUsernameModal({
  onClose,
  isLight,
}: {
  onClose: () => void;
  isLight: boolean;
}) {
  const [newUsername, setNewUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/change-username", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newUsername, currentPassword }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(body.error || "Could not change username.");
      toast({
        title: "Username updated",
        description: "Your new username is active.",
      });
      onClose();
      window.location.reload();
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-60 flex items-center justify-center overflow-y-auto p-4">
      <button
        aria-label="Close"
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
      />
      <div
        style={
          isLight
            ? ({
                "--background": "0 0% 98%",
                "--foreground": "220 25% 12%",
                "--border": "220 18% 86%",
                "--card": "0 0% 100%",
                "--card-border": "220 18% 88%",
                "--secondary": "220 17% 96%",
                "--muted-foreground": "220 9% 40%",
              } as React.CSSProperties)
            : undefined
        }
        className="relative my-auto w-full max-w-sm bento-card bg-card p-5 shadow-2xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground">Change username</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary"
          >
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="block">
            <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              New username
            </span>
            <input
              required
              minLength={3}
              maxLength={32}
              value={newUsername}
              onChange={(event) => setNewUsername(event.target.value)}
              className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/20"
            />
          </label>
          <label className="block">
            <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Current password
            </span>
            <PasswordInput
              value={currentPassword}
              onChange={setCurrentPassword}
            />
          </label>
          {error && (
            <p className="rounded-lg border border-red-500/50 bg-red-900/30 p-3 text-center font-mono text-[10px] font-bold text-red-400">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-mono text-[11px] font-bold uppercase tracking-wider text-background transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <User size={16} /> {submitting ? "Updating..." : "Update username"}
          </button>
        </form>
      </div>
    </div>,
    document.body,
  );
}

function ProfileMenu({
  image,
  username,
  isLight,
  onEditProfile,
  onLogout,
}: {
  image?: string;
  username?: string;
  isLight: boolean;
  onEditProfile: () => void;
  onLogout: () => void;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [changingUsername, setChangingUsername] = useState(false);
  const [loggingOutAll, setLoggingOutAll] = useState(false);

  const handleLogoutAllDevices = async () => {
    setOpen(false);
    setLoggingOutAll(true);
    try {
      const response = await fetch("/api/auth/logout-all-devices", {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        toast({
          variant: "destructive",
          title: "Could not log out all devices",
          description: body.error || "Please try again.",
        });
        return;
      }
      toast({
        title: "Logged out of all devices",
        description: "All active sessions have been invalidated.",
      });
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    } catch {
      toast({
        variant: "destructive",
        title: "Could not log out all devices",
        description: "Could not reach the server. Please try again.",
      });
    } finally {
      setLoggingOutAll(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((value) => !value)}
        aria-label="Account menu"
        className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-background ring-2 ring-primary/20 transition-transform hover:scale-105"
      >
        {image ? (
          <NextImage
            src={image}
            alt={username || "Profile"}
            width={36}
            height={36}
            className="h-full w-full object-cover"
          />
        ) : (
          <User size={16} />
        )}
      </button>

      {open && (
        <>
          <button
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
            {username && (
              <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                <User size={15} className="shrink-0 text-primary" />
                <p className="truncate text-sm font-semibold text-foreground">
                  {username}
                </p>
              </div>
            )}
            <button
              onClick={() => {
                setOpen(false);
                onEditProfile();
              }}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary group"
            >
              <Pencil
                size={14}
                className="group-hover:text-primary transition-colors"
              />{" "}
              Edit profile
            </button>
            <button
              onClick={() => {
                setOpen(false);
                setChangingUsername(true);
              }}
              className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary group"
            >
              <User
                size={14}
                className="group-hover:text-primary transition-colors"
              />{" "}
              Change username
            </button>
            <button
              onClick={() => {
                setOpen(false);
                setChangingPassword(true);
              }}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary group"
            >
              <KeyRound
                size={14}
                className="group-hover:text-primary transition-colors"
              />{" "}
              Change password
            </button>
            <button
              onClick={handleLogoutAllDevices}
              disabled={loggingOutAll}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-amber-500 transition-colors hover:bg-amber-500/10 disabled:opacity-50"
            >
              <LogOut size={14} />
              {loggingOutAll ? "Logging out…" : "Logout all devices"}
            </button>
            <button
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="flex w-full items-center gap-2.5 border-t border-border px-4 py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-900/20"
            >
              <LogOut size={14} /> Log out
            </button>
          </div>
        </>
      )}

      {changingPassword && (
        <ChangePasswordModal
          isLight={isLight}
          onClose={() => setChangingPassword(false)}
        />
      )}
      {changingUsername && (
        <ChangeUsernameModal
          isLight={isLight}
          onClose={() => setChangingUsername(false)}
        />
      )}
    </div>
  );
}

type ContactMessage = {
  id: number;
  name: string;
  email: string;
  message: string;
  createdAt: string;
  replied?: boolean;
  repliedAt?: string;
};

type ContactSettings = {
  gmailAppPassword: string;
  contactToEmail: string;
  contactFromEmail: string;
  twoFactorEnabled: boolean;
  siteName: string;
  faviconUrl: string;
  turnstileSiteKey: string;
  turnstileSecretKey: string;
  turnstileHostnames: string;
};

type ActiveSession = {
  id: string;
  model: string;
  browser: string;
  location: string;
  ipAddress: string;
  createdAt: string;
  lastActiveAt: string;
  current: boolean;
};

function ActiveSessions() {
  const queryClient = useQueryClient();
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);

  const loadSessions = async () => {
    const response = await fetch("/api/auth/sessions", { credentials: "include", cache: "no-store" });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || "Could not load active sessions.");
    setSessions(body.sessions || []);
  };

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/sessions", { credentials: "include", cache: "no-store" })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error || "Could not load active sessions.");
        if (!cancelled) setSessions(body.sessions || []);
      })
      .catch((error) => {
        if (!cancelled) toast({ variant: "destructive", title: "Could not load sessions", description: error.message });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const revoke = async (id: string) => {
    setRevoking(id);
    try {
      const response = await fetch("/api/auth/sessions", {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: id }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Could not revoke session.");
      if (body.current) await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      await loadSessions();
      toast({ title: "Session revoked", description: "That device can no longer access this account." });
    } catch (error) {
      toast({ variant: "destructive", title: "Could not revoke session", description: (error as Error).message });
    } finally {
      setRevoking(null);
    }
  };

  const revokeAll = async () => {
    setRevoking("all");
    try {
      const response = await fetch("/api/auth/logout-all-devices", { method: "POST", credentials: "include" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Could not log out all devices.");
      setSessions([]);
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      toast({ title: "Logged out of all devices", description: "All active sessions have been invalidated." });
    } catch (error) {
      toast({ variant: "destructive", title: "Could not log out all devices", description: (error as Error).message });
    } finally {
      setRevoking(null);
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading active sessions...</p>;
  if (!sessions.length) return <p className="rounded-lg border border-border bg-secondary/30 p-4 text-sm text-muted-foreground">No active sessions found. Sign in again to register this device.</p>;

  return <div className="grid gap-3">
    <div className="flex items-center justify-between gap-3">
      <p className="text-xs text-muted-foreground">Review every browser currently signed in to your account.</p>
      <div className="flex shrink-0 flex-wrap justify-end gap-2">
        <button type="button" onClick={() => revoke(sessions.find((session) => session.current)?.id || "")} disabled={!sessions.some((session) => session.current) || !!revoking} className="inline-flex items-center gap-2 rounded-lg border border-red-500/40 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-red-400 hover:bg-red-500/10 disabled:opacity-50"><LogOut size={13} /> Log out this device</button>
        <button type="button" onClick={revokeAll} disabled={!!revoking} className="inline-flex items-center gap-2 rounded-lg border border-red-500/40 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-red-400 hover:bg-red-500/10 disabled:opacity-50"><LogOut size={13} /> Log out all</button>
      </div>
    </div>
    {sessions.map((session) => <div key={session.id} className="flex flex-col gap-4 rounded-lg border border-border bg-secondary/20 p-4 md:flex-row md:items-center md:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Smartphone size={17} /></span>
        <div className="min-w-0">
          <p className="font-semibold text-foreground">{session.model} · {session.browser} {session.current && <span className="ml-2 rounded bg-primary/15 px-2 py-1 font-mono text-[9px] uppercase text-primary">Current</span>}</p>
          <div className="mt-2 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2 sm:gap-x-5"><span><Globe2 className="mr-1 inline" size={12} />{session.location}</span><span><Clock3 className="mr-1 inline" size={12} />Active {new Date(session.lastActiveAt).toLocaleString()}</span><span>IP {session.ipAddress}</span><span>Signed in {new Date(session.createdAt).toLocaleString()}</span></div>
        </div>
      </div>
      <button type="button" onClick={() => revoke(session.id)} disabled={revoking === session.id} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:border-red-500/50 hover:text-red-400 disabled:opacity-50"><LogOut size={13} /> {revoking === session.id ? "Revoking..." : "Revoke"}</button>
    </div>)}
  </div>;
}

function SettingsEditor({ activeTab }: { activeTab: "security" | "sessions" }) {
  const [form, setForm] = useState<ContactSettings>({
    gmailAppPassword: "",
    contactToEmail: "",
    contactFromEmail: "",
    twoFactorEnabled: false,
    siteName: "Akhilesh Vishwakarma",
    faviconUrl: "",
    turnstileSiteKey: "",
    turnstileSecretKey: "",
    turnstileHostnames: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [turnstileSecretConfigured, setTurnstileSecretConfigured] =
    useState(false);
  const [error, setError] = useState<string | null>(null);
  const [faviconError, setFaviconError] = useState<string | null>(null);

  const handleFaviconUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFaviconError(null);
    try {
      const dataUrl = await fileToResizedDataUrl(file, 128);
      setForm((current) => ({ ...current, faviconUrl: dataUrl }));
    } catch (uploadError) {
      setFaviconError((uploadError as Error).message);
    } finally {
      event.target.value = "";
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/settings", {
          credentials: "include",
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(body.error || "Could not load settings.");
        }
        if (!cancelled)
          setForm(
            body.settings ?? {
              gmailAppPassword: "",
              contactToEmail: "",
              contactFromEmail: "",
              twoFactorEnabled: false,
              siteName: "Akhilesh Vishwakarma",
              faviconUrl: "",
              turnstileSiteKey: "",
              turnstileSecretKey: "",
              turnstileHostnames: "",
            },
          );
        if (!cancelled)
          setTurnstileSecretConfigured(Boolean(body.turnstileSecretConfigured));
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Could not save settings.");
      }
      const saved = await response.json().catch(() => ({}));
      setTurnstileSecretConfigured(Boolean(saved.turnstileSecretConfigured));

      toast({
        title: "Settings saved",
        description: "The contact form will use these right away.",
      });
    } catch (err) {
      setError((err as Error).message);
      toast({
        variant: "destructive",
        title: "Save failed",
        description: (err as Error).message,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bento-card p-6 text-sm text-muted-foreground shadow-sm">
        <span className="flex items-center gap-3">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />{" "}
          Loading settings...
        </span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bento-card shadow-sm p-5 md:p-6">
      <div className="grid gap-8">
        <div>
          <p className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[.16em] text-primary">
            Site settings
          </p>
          <div className="grid gap-5">
            <label className="block">
              <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Site name
              </span>
              <input
                value={form.siteName}
                onChange={(event) =>
                  setForm({ ...form, siteName: event.target.value })
                }
                placeholder="Akhilesh Vishwakarma"
                className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm text-foreground outline-none transition-all focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/20"
              />
            </label>
            <label className="block">
              <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Favicon URL
              </span>
              <input
                type="url"
                value={form.faviconUrl}
                onChange={(event) =>
                  setForm({ ...form, faviconUrl: event.target.value })
                }
                placeholder="https://example.com/favicon.png"
                className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm text-foreground outline-none transition-all focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/20"
              />
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-primary/50 bg-primary/10 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-primary transition-colors hover:bg-primary/20">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml,.ico"
                    onChange={handleFaviconUpload}
                    className="hidden"
                  />
                  {form.faviconUrl?.startsWith("data:")
                    ? "Replace favicon"
                    : "Upload favicon"}
                </label>
                {form.faviconUrl && (
                  <NextImage
                    src={form.faviconUrl}
                    loader={({ src }) => src}
                    unoptimized
                    alt="Favicon preview"
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded border border-border bg-background object-contain"
                  />
                )}
                {form.faviconUrl?.startsWith("data:") && (
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, faviconUrl: "" })}
                    className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-red-400"
                  >
                    Remove
                  </button>
                )}
              </div>
              {faviconError && (
                <p className="mt-2 font-mono text-[10px] text-red-400">
                  {faviconError}
                </p>
              )}
            </label>
          </div>
        </div>

        <div className="border-t border-border pt-6">
          <p className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[.16em] text-primary">Security</p>
          {activeTab === "security" ? <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-border bg-secondary/30 p-4">
            <span>
              <span className="block text-sm font-semibold text-foreground">
                Require 2-step verification
              </span>
              <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                Password ke baad admin email par one-time code aayega.
              </span>
            </span>
            <span className="relative shrink-0">
              <input
                type="checkbox"
                checked={form.twoFactorEnabled}
                onChange={(event) =>
                  setForm({ ...form, twoFactorEnabled: event.target.checked })
                }
                className="peer sr-only"
              />
              <span className="block h-6 w-11 rounded-full bg-muted transition-colors peer-checked:bg-primary" />
              <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
            </span>
          </label> : <ActiveSessions />}
        </div>

        {activeTab === "security" && <div className="border-t border-border pt-6">
          <p className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[.16em] text-primary">
            Cloudflare Turnstile
          </p>
          <p className="mb-4 text-xs leading-5 text-muted-foreground">
            Invisible CAPTCHA will be enabled for login, password reset, and
            contact forms when all three fields are completed. CAPTCHA will
            remain disabled if any field is left blank.
          </p>
          <div className="grid gap-5">
            <label className="block">
              <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Site key
              </span>
              <input
                value={form.turnstileSiteKey}
                onChange={(event) =>
                  setForm({ ...form, turnstileSiteKey: event.target.value })
                }
                placeholder="0x4AAAA..."
                className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm text-foreground outline-none focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/20"
              />
            </label>
            <label className="block">
              <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Secret key
              </span>
              <input
                type="password"
                value={
                  form.turnstileSecretKey ||
                  (turnstileSecretConfigured ? "********" : "")
                }
                onFocus={() => {
                  if (turnstileSecretConfigured && !form.turnstileSecretKey)
                    setForm({ ...form, turnstileSecretKey: "" });
                }}
                onChange={(event) =>
                  setForm({ ...form, turnstileSecretKey: event.target.value })
                }
                placeholder="Enter Turnstile secret key"
                autoComplete="new-password"
                className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm text-foreground outline-none focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/20"
              />
              {turnstileSecretConfigured && (
                <span className="mt-2 flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-emerald-500">
                  <Check size={12} /> Secret key saved successfully
                </span>
              )}
            </label>
            <label className="block">
              <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Allowed hostnames
              </span>
              <input
                value={form.turnstileHostnames}
                onChange={(event) =>
                  setForm({ ...form, turnstileHostnames: event.target.value })
                }
                placeholder="developerakhil.vercel.app,localhost"
                className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm text-foreground outline-none focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/20"
              />
              <span className="mt-2 block text-xs text-muted-foreground">
                Enter hostnames only, without https://, ports, or page paths.
              </span>
            </label>
          </div>
        </div>}

        <label className="block">
          <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Gmail app password
          </span>
          <div className="relative">
            <input
              type={showKey ? "text" : "password"}
              value={form.gmailAppPassword}
              onChange={(event) =>
                setForm({ ...form, gmailAppPassword: event.target.value })
              }
              placeholder="xxxxxxxxxxxxxxxxxxxx"
              className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-3 pr-11 text-sm outline-none transition-all focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/20 text-foreground"
            />
            <button
              type="button"
              onClick={() => setShowKey((value) => !value)}
              aria-label={showKey ? "Hide key" : "Show key"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
            >
              {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </label>

        <label className="block">
          <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Send notifications to
          </span>
          <input
            type="email"
            value={form.contactToEmail}
            onChange={(event) =>
              setForm({ ...form, contactToEmail: event.target.value })
            }
            placeholder="you@example.com"
            className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/20 text-foreground"
          />
        </label>

        <label className="block">
          <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            From address
          </span>
          <input
            value={form.contactFromEmail}
            onChange={(event) =>
              setForm({ ...form, contactFromEmail: event.target.value })
            }
            placeholder="contact@yourdomain.com"
            className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/20 text-foreground"
          />
        </label>
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-900/30 border border-red-500/50 p-3 font-mono text-[10px] font-bold text-red-400">
          {error}
        </p>
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex w-full sm:w-auto justify-center items-center gap-2 rounded-lg bg-primary px-8 py-3.5 font-mono text-[11px] font-bold uppercase tracking-wider text-background hover:bg-primary/90 hover:shadow-[0_0_10px_rgba(0,255,136,0.3)] transition-all disabled:opacity-50 whitespace-nowrap"
        >
          <Save size={16} /> {saving ? "Saving..." : "Save settings"}
        </button>
      </div>
    </form>
  );
}

function formatMessageDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function MessagesPanel() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [expanded, setExpanded] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetch("/api/messages", { credentials: "include" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message =
          typeof body?.error === "string"
            ? body.error
            : "Could not load messages.";
        setLoadError(message);
        setMessages([]);
        return;
      }
      setMessages(body.messages ?? []);
    } catch (err) {
      setLoadError((err as Error).message || "Could not load messages.");
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Load messages on mount - the reload function handles its own state management
    // eslint-disable-next-line
    reload();
  }, [reload]);

  const allSelected = messages.length > 0 && selected.size === messages.length;

  const toggleOne = (id: number) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(messages.map((m) => m.id)));
  };

  const deleteIds = async (ids: number[]) => {
    if (ids.length === 0) return;
    const label =
      ids.length === 1 ? "this message" : `these ${ids.length} messages`;
    if (!window.confirm(`Delete ${label}? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const response = await fetch("/api/messages", {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!response.ok) throw new Error("Could not delete.");
      const updatedMessages = messages.filter((m) => !ids.includes(m.id));
      setMessages(updatedMessages);
      setSelected((current) => {
        const next = new Set(current);
        ids.forEach((id) => next.delete(id));
        return next;
      });
      await reload();
      toast({
        title:
          ids.length === 1
            ? "Message deleted"
            : `${ids.length} messages deleted`,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: (err as Error).message,
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleReply = async (event: FormEvent, messageId: number) => {
    event.preventDefault();
    if (!replyText.trim()) return;
    setSendingReply(true);
    try {
      const response = await fetch("/api/messages/reply", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, replyText }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Could not send reply.");
      }
      toast({
        title: "Reply sent",
        description: "Your message has been sent successfully.",
      });
      setReplyingTo(null);
      setReplyText("");
      await reload();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed to send reply",
        description: (err as Error).message,
      });
    } finally {
      setSendingReply(false);
    }
  };

  return (
    <div className="bento-card overflow-hidden p-0">
      <div className="flex flex-col gap-4 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-foreground">Messages</h2>
          <p className="text-sm text-muted-foreground">
            {messages.length} {messages.length === 1 ? "message" : "messages"}{" "}
            from your contact form
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <button
              onClick={() => deleteIds(Array.from(selected))}
              disabled={deleting}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600/90 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-white hover:bg-red-600 transition-all disabled:opacity-50 whitespace-nowrap"
            >
              <Trash2 size={14} /> Delete selected ({selected.size})
            </button>
          )}
          <button
            onClick={() => reload()}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-transparent px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-wider hover:bg-secondary text-foreground transition-all whitespace-nowrap"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="px-6 py-16 text-center text-sm text-muted-foreground">
          <span className="flex items-center justify-center gap-3">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />{" "}
            Loading messages...
          </span>
        </div>
      ) : loadError ? (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-red-500/10 text-red-400">
            <MailOpen size={18} />
          </span>
          <p className="text-sm font-medium text-foreground">
            Messages are currently unavailable
          </p>
          <p className="max-w-md text-xs text-muted-foreground">{loadError}</p>
          <button
            onClick={() => reload()}
            className="mt-2 font-mono text-[10px] font-bold uppercase tracking-wider text-primary hover:underline"
          >
            Retry
          </button>
        </div>
      ) : messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-primary">
            <MailOpen size={18} />
          </span>
          <p className="text-sm font-medium text-foreground">No messages yet</p>
          <p className="max-w-xs text-xs text-muted-foreground">
            Submissions from your site&apos;s contact form will show up here.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 border-b border-border bg-secondary/50 px-5 py-2.5 sm:px-6">
            <button
              onClick={toggleAll}
              className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
            >
              {allSelected ? (
                <CheckSquare size={15} className="text-primary" />
              ) : (
                <Square size={15} />
              )}
              Select all
            </button>
          </div>
          <div className="divide-y divide-border">
            {messages.map((msg) => {
              const isOpen = expanded === msg.id;
              // using green dot indicator by rendering a small dot if it was unread (we mock unread logic since we don't have it in the type, but let's just render the content beautifully)
              return (
                <div
                  key={msg.id}
                  className="group px-5 py-4 transition-colors hover:bg-secondary/40 sm:px-6 bg-card"
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleOne(msg.id)}
                      aria-label="Select message"
                      className="mt-0.5 shrink-0 text-muted-foreground hover:text-primary transition-colors"
                    >
                      {selected.has(msg.id) ? (
                        <CheckSquare size={16} className="text-primary" />
                      ) : (
                        <Square size={16} />
                      )}
                    </button>
                    <div className="min-w-0 flex-1">
                      <button
                        onClick={() => setExpanded(isOpen ? null : msg.id)}
                        className="w-full text-left"
                      >
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                          <span className="font-semibold text-foreground flex items-center gap-2">
                            {!isOpen && (
                              <span className="h-1.5 w-1.5 rounded-full bg-primary inline-block"></span>
                            )}
                            {msg.name}
                          </span>
                          <a
                            href={`mailto:${msg.email}`}
                            onClick={(event) => event.stopPropagation()}
                            className="truncate text-xs text-muted-foreground hover:text-primary transition-colors"
                          >
                            {msg.email}
                          </a>
                          {msg.replied && (
                            <span className="inline-flex items-center gap-1 rounded bg-primary/20 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-primary">
                              <Check size={10} /> Replied
                            </span>
                          )}
                          <span className="ml-auto shrink-0 font-mono text-[10px] uppercase text-muted-foreground">
                            {formatMessageDate(msg.createdAt)}
                          </span>
                        </div>
                        <div
                          className={
                            isOpen
                              ? "mt-3 p-4 rounded-lg bg-background/50 border border-border whitespace-pre-wrap text-sm text-foreground/80 font-mono"
                              : "mt-1 truncate text-sm text-muted-foreground"
                          }
                        >
                          {msg.message}
                        </div>
                      </button>

                      {isOpen && (
                        <div className="mt-4 flex flex-col gap-3">
                          {replyingTo === msg.id ? (
                            <form
                              onSubmit={(e) => handleReply(e, msg.id)}
                              className="flex flex-col gap-2 border-t border-border pt-4"
                            >
                              <textarea
                                autoFocus
                                required
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Type your reply..."
                                rows={3}
                                className="w-full resize-y rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/20 text-foreground"
                              />
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReplyingTo(null);
                                    setReplyText("");
                                  }}
                                  className="rounded-lg px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:bg-secondary transition-all"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="submit"
                                  disabled={sendingReply}
                                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-background hover:bg-primary/90 transition-all disabled:opacity-50"
                                >
                                  <Reply size={14} /> Send Reply
                                </button>
                              </div>
                            </form>
                          ) : (
                            <button
                              onClick={() => {
                                setReplyingTo(msg.id);
                                setReplyText("");
                              }}
                              className="inline-flex w-fit items-center gap-2 rounded-lg border border-border bg-transparent px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-wider hover:bg-secondary text-foreground transition-all"
                            >
                              <Reply size={14} /> Reply
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => deleteIds([msg.id])}
                      aria-label="Delete message"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-red-500/20 hover:text-red-500 md:opacity-0 md:group-hover:opacity-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

type AdminNotification = {
  id: number;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
};

function NotificationsPanel() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/notifications", {
        credentials: "include",
      });
      const body = await response.json().catch(() => ({}));
      if (response.ok) setNotifications(body.notifications ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload();
  }, [reload]);

  const runAction = async (method: "PATCH" | "DELETE", ids: number[]) => {
    try {
      const response = await fetch("/api/notifications", {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!response.ok) throw new Error("Could not update notifications.");
      await reload();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Notification update failed",
        description: (error as Error).message,
      });
    }
  };

  return (
    <div className="bento-card overflow-hidden p-0">
      <div className="flex flex-col gap-4 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h2 className="text-lg font-bold text-foreground">Notifications</h2>
          <p className="text-sm text-muted-foreground">
            System issues that need your attention.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() =>
              runAction(
                "PATCH",
                notifications
                  .filter((item) => !item.read)
                  .map((item) => item.id),
              )
            }
            disabled={!notifications.some((item) => !item.read)}
            className="rounded-lg border border-border px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-foreground disabled:opacity-40"
          >
            Mark all read
          </button>
          <button
            onClick={() =>
              runAction(
                "DELETE",
                notifications.map((item) => item.id),
              )
            }
            disabled={!notifications.length}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600/90 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-white disabled:opacity-40"
          >
            <Trash2 size={14} /> Clear all
          </button>
        </div>
      </div>
      {loading ? (
        <div className="px-6 py-16 text-center text-sm text-muted-foreground">
          Loading notifications...
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <Bell size={22} className="text-primary" />
          <p className="text-sm font-medium text-foreground">
            No notifications
          </p>
          <p className="text-xs text-muted-foreground">
            Cloudflare and delivery issues will appear here.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`flex items-start gap-4 px-5 py-4 sm:px-6 ${notification.read ? "opacity-65" : "bg-primary/5"}`}
            >
              <Bell
                size={16}
                className={`mt-1 shrink-0 ${notification.read ? "text-muted-foreground" : "text-primary"}`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-semibold text-foreground">
                    {notification.title}
                  </p>
                  <time className="font-mono text-[10px] text-muted-foreground">
                    {formatMessageDate(notification.createdAt)}
                  </time>
                </div>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {notification.message}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  onClick={() => runAction("PATCH", [notification.id])}
                  disabled={notification.read}
                  aria-label="Mark notification as read"
                  className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-primary disabled:opacity-30"
                >
                  <MailOpen size={14} />
                </button>
                <button
                  onClick={() => runAction("DELETE", [notification.id])}
                  aria-label="Delete notification"
                  className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-red-500/20 hover:text-red-500"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminArea({
  data,
  username,
}: {
  data: PortfolioData;
  username?: string;
}) {
  const getInitialSection = () => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.slice(1);
      const validSections = [
        "dashboard",
        "profile",
        "settings",
        "messages",
        "notifications",
        "sections",
        "theme",
        "stats",
        "services",
        "projects",
        "education",
        "experience",
        "testimonials",
      ];
      if (validSections.includes(hash))
        return hash as
          | "dashboard"
          | "profile"
          | "settings"
          | "messages"
          | "sections"
          | "theme"
          | Resource;
    }
    return "dashboard";
  };
  const getInitialTheme = () => {
    if (typeof window !== "undefined") {
      return window.localStorage.getItem("admin-theme") === "light";
    }
    return false;
  };
  const [section, setSection] = useState<
    | "dashboard"
    | "profile"
    | "settings"
    | "messages"
    | "notifications"
    | "sections"
    | "theme"
    | Resource
  >(getInitialSection);
  const [editing, setEditing] = useState<
    PortfolioData[Resource][number] | null
  >(null);
  const [search, setSearch] = useState("");
  const [saved, setSaved] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSubtab, setSettingsSubtab] = useState<"security" | "sessions">("security");
  const [messageCount, setMessageCount] = useState<number | null>(null);
  const [notificationCount, setNotificationCount] = useState<number | null>(
    null,
  );
  const [quickNotifications, setQuickNotifications] = useState<
    AdminNotification[]
  >([]);
  const [quickNotificationsOpen, setQuickNotificationsOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [adminLight, setAdminLight] = useState(getInitialTheme);
  const router = useRouter();
  const queryClient = useQueryClient();
  const saveMutation = useSavePortfolioMutation();
  const resetMutation = useResetPortfolioMutation();
  const resource =
    section === "profile" ||
    section === "dashboard" ||
    section === "settings" ||
    section === "messages" ||
    section === "notifications" ||
    section === "sections" ||
    section === "theme"
      ? null
      : section;
  const items = useMemo(
    () => (resource ? (data[resource] ?? []) : []),
    [resource, data],
  );

  const adminThemeStyle = adminLight
    ? ({
        "--background": "0 0% 98%",
        "--foreground": "220 25% 12%",
        "--border": "220 18% 86%",
        "--input": "220 18% 92%",
        "--card": "0 0% 100%",
        "--card-foreground": "220 25% 12%",
        "--card-border": "220 18% 88%",
        "--primary-foreground": "220 25% 12%",
        "--secondary": "220 17% 96%",
        "--secondary-foreground": "220 25% 12%",
        "--muted": "220 18% 95%",
        "--muted-foreground": "220 9% 40%",
      } as React.CSSProperties)
    : undefined;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/messages", {
          credentials: "include",
        });
        if (!response.ok) return;
        const body = await response.json();
        if (!cancelled) setMessageCount(body.messages?.length ?? 0);
        const notificationResponse = await fetch("/api/notifications", {
          credentials: "include",
        });
        const notificationBody = await notificationResponse
          .json()
          .catch(() => ({}));
        if (!cancelled && notificationResponse.ok) {
          const notifications = notificationBody.notifications ?? [];
          setQuickNotifications(notifications);
          setNotificationCount(
            notifications.filter((item: AdminNotification) => !item.read)
              .length,
          );
        }
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [section]);

  useEffect(() => {
    const pollNotifications = async () => {
      try {
        const response = await fetch("/api/notifications", {
          credentials: "include",
        });
        if (!response.ok) return;
        const body = await response.json();
        const notifications = body.notifications ?? [];
        setQuickNotifications(notifications);
        setNotificationCount(
          notifications.filter((item: AdminNotification) => !item.read).length,
        );
      } catch {}
    };
    const interval = window.setInterval(pollNotifications, 15000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const syncFullscreen = () =>
      setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () =>
      document.removeEventListener("fullscreenchange", syncFullscreen);
  }, []);

  const toggleFullscreen = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await document.documentElement.requestFullscreen();
    }
  };

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.trim().toLowerCase();
    return items.filter(
      (item) =>
        itemTitle(item).toLowerCase().includes(q) ||
        itemSubtitle(item).toLowerCase().includes(q),
    );
  }, [items, search]);

  const goToSection = (
    next:
      | "dashboard"
      | "profile"
      | "settings"
      | "messages"
      | "notifications"
      | "sections"
      | "theme"
      | Resource,
  ) => {
    setSection(next);
    setEditing(null);
    setMobileNavOpen(false);
    window.history.replaceState(
      null,
      "",
      next === "dashboard" ? window.location.pathname : `#${next}`,
    );
  };

  const persist = (
    next: PortfolioData,
    onDone?: () => void,
    description?: string,
  ) => {
    saveMutation.mutate(next, {
      onSuccess: () => {
        setSaved(true);
        window.setTimeout(() => setSaved(false), 1800);
        toast({
          title: "Saved",
          description: description || "Your beautiful changes are live!",
        });
        onDone?.();
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Save failed",
          description: (error as Error)?.message || "Something went wrong.",
        });
      },
    });
  };

  const saveProfile = (value: Profile) => persist({ ...data, profile: value });
  const saveItem = (value: PortfolioData[Resource][number]) => {
    if (!resource) return;
    const next = items.some((item) => item.id === value.id)
      ? items.map((item) => (item.id === value.id ? value : item))
      : [...items, value];
    persist({ ...data, [resource]: next }, () => setEditing(null));
  };
  const deleteItem = (id: string) => {
    if (!resource) return;
    if (!window.confirm("Delete this item? This cannot be undone.")) return;
    persist({ ...data, [resource]: items.filter((item) => item.id !== id) });
  };
  const resetAll = () => {
    if (!window.confirm("Reset all content to the original portfolio?")) return;
    resetMutation.mutate(undefined, {
      onSuccess: () => {
        toast({
          title: "Reset complete",
          description: "Fresh default content is live.",
        });
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Reset failed",
          description: (error as Error)?.message,
        });
      },
    });
  };
  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
  };
  const markQuickNotificationRead = async (id: number) => {
    const response = await fetch("/api/notifications", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] }),
    });
    if (!response.ok) return;
    setQuickNotifications((current) =>
      current.map((item) => (item.id === id ? { ...item, read: true } : item)),
    );
    setNotificationCount((current) => Math.max(0, (current ?? 1) - 1));
  };
  const currentLabel =
    section === "dashboard"
      ? "Dashboard"
      : section === "profile"
        ? "Profile"
        : section === "settings"
          ? "Settings"
          : section === "messages"
            ? "Messages"
            : section === "notifications"
              ? "Notifications"
              : section === "sections"
                ? "Sections"
                : section === "theme"
                  ? "Theme"
                  : resourceMeta[section].label;
  const resourceKeys = Object.keys(resourceMeta) as Resource[];
  const searchSuggestions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return [];
    return resourceKeys
      .flatMap((key) =>
        (data[key] ?? [])
          .filter((item) =>
            `${itemTitle(item)} ${itemSubtitle(item)}`
              .toLowerCase()
              .includes(query),
          )
          .slice(0, 3)
          .map((item) => ({ key, title: itemTitle(item) })),
      )
      .slice(0, 6);
  }, [data, resourceKeys, search]);

  return (
    <div
      className="admin-console flex h-dvh overflow-hidden bg-background text-foreground"
      style={adminThemeStyle}
    >
      {/* Sidebar - desktop */}
      <aside
        className={`${desktopSidebarOpen ? "lg:flex" : "lg:hidden"} hidden lg:w-64 lg:shrink-0 lg:flex-col border-r border-border bg-card/90`}
      >
        <div className="flex h-16 items-center gap-3 border-b border-border px-6">
          <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-primary font-mono text-xs font-bold text-background">
            {data.profile?.heroImage ||
            data.profile?.aboutImage ||
            data.profile?.image ? (
              <NextImage
                src={
                  data.profile.heroImage ||
                  data.profile.aboutImage ||
                  data.profile.image
                }
                alt="Profile"
                width={32}
                height={32}
                className="h-full w-full object-cover"
              />
            ) : (
              "AV"
            )}
          </span>
          <div className="min-w-0">
            <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-foreground">
              Console
            </p>
            {username && (
              <p className="truncate text-[11px] text-muted-foreground">
                {username}
              </p>
            )}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5 font-mono uppercase text-xs">
          <button
            onClick={() => goToSection("dashboard")}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 font-medium transition-colors ${
              section === "dashboard"
                ? "bg-primary/10 text-primary border-l-2 border-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground border-l-2 border-transparent"
            }`}
          >
            <LayoutDashboard size={16} /> Dashboard
          </button>

          <p className="mb-2 mt-6 px-4 text-[10px] font-bold tracking-wider text-muted-foreground/50">
            Content
          </p>
          <div className="flex flex-col gap-1">
            {resourceKeys.map((key) => {
              const Icon = resourceMeta[key].icon;
              return (
                <button
                  key={key}
                  onClick={() => goToSection(key)}
                  className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-3 font-medium transition-colors ${
                    section === key
                      ? "bg-primary/10 text-primary border-l-2 border-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground border-l-2 border-transparent"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon size={16} /> {resourceMeta[key].label}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      section === key
                        ? "bg-primary/20 text-primary"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {(data[key] ?? []).length}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-border p-3 font-mono uppercase text-xs">
          <button
            onClick={() => goToSection("messages")}
            className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-3 font-medium transition-colors ${
              section === "messages"
                ? "bg-primary/10 text-primary border-l-2 border-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground border-l-2 border-transparent"
            }`}
          >
            <span className="flex items-center gap-3">
              <Mail size={16} /> Messages
            </span>
            {messageCount !== null && messageCount > 0 && (
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  section === "messages"
                    ? "bg-primary/20 text-primary"
                    : "bg-secondary text-primary"
                }`}
              >
                {messageCount}
              </span>
            )}
          </button>
          <button
            onClick={() => goToSection("notifications")}
            className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-3 font-medium transition-colors ${section === "notifications" ? "bg-primary/10 text-primary border-l-2 border-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground border-l-2 border-transparent"}`}
          >
            <span className="flex items-center gap-3">
              <Bell size={16} /> Notifications
            </span>
            {notificationCount !== null && notificationCount > 0 && (
              <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">
                {notificationCount}
              </span>
            )}
          </button>
          <button
            onClick={() => goToSection("sections")}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 font-medium transition-colors ${
              section === "sections"
                ? "bg-primary/10 text-primary border-l-2 border-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground border-l-2 border-transparent"
            }`}
          >
            <Layout size={16} /> Sections
          </button>
          <button
            onClick={() => goToSection("theme")}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 font-medium transition-colors ${
              section === "theme"
                ? "bg-primary/10 text-primary border-l-2 border-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground border-l-2 border-transparent"
            }`}
          >
            <Palette size={16} /> Theme
          </button>
          <div className="flex flex-col gap-1">
            <div className={`flex w-full items-center rounded-lg font-medium transition-colors ${
              section === "settings"
                ? "bg-primary/10 text-primary border-l-2 border-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground border-l-2 border-transparent"
            }`}>
              <button onClick={() => goToSection("settings")} className="flex min-w-0 flex-1 items-center gap-3 px-3 py-3 text-left">
                <Settings size={16} /> Settings
              </button>
              <button type="button" aria-label="Expand Settings" onClick={() => setSettingsOpen((value) => !value)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md hover:bg-secondary hover:text-primary">
                {settingsOpen ? <ChevronDown size={15} /> : <Plus size={15} />}
              </button>
            </div>
            {settingsOpen && <div className="ml-8 flex flex-col gap-1 border-l border-border pl-2">
              {([["security", "Security"], ["sessions", "Active Sessions"]] as const).map(([value, label]) => <button key={value} type="button" onClick={() => { setSettingsSubtab(value); goToSection("settings"); }} className={`rounded-md px-3 py-2 text-left font-mono text-[10px] font-bold uppercase tracking-wider ${section === "settings" && settingsSubtab === value ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>{label}</button>)}
            </div>}
          </div>
          <button
            onClick={() => router.push("/")}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-3 font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground border-l-2 border-transparent"
          >
            <ExternalLink size={16} /> View site
          </button>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-3 font-medium text-red-500 transition-colors hover:bg-red-500/10 border-l-2 border-transparent mt-2"
          >
            <LogOut size={16} /> Log out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur-md">
          <div className="flex min-h-[4rem] flex-wrap items-center gap-4 px-4 py-2 md:px-8">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground lg:hidden"
              aria-label="Open menu"
            >
              <Menu size={16} />
            </button>

            <div className="hidden items-center gap-2 lg:flex">
              <button
                type="button"
                onClick={() => setDesktopSidebarOpen((open) => !open)}
                aria-label={
                  desktopSidebarOpen ? "Close sidebar" : "Open sidebar"
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-foreground transition-colors hover:bg-primary/10 hover:text-primary"
              >
                {desktopSidebarOpen ? (
                  <PanelLeftClose size={17} />
                ) : (
                  <PanelLeftOpen size={17} />
                )}
              </button>
              <button
                type="button"
                onClick={toggleFullscreen}
                aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-foreground transition-colors hover:bg-primary/10 hover:text-primary"
              >
                {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setMobileSearchOpen(true);
                setSearchFocused(true);
              }}
              aria-label="Open search"
              className={`${mobileSearchOpen ? "hidden" : "flex"} h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground md:hidden`}
            >
              <Search size={17} />
            </button>
            <div
              className={`${mobileSearchOpen ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-full opacity-0"} fixed inset-x-0 top-0 z-50 flex h-20 w-full border-b border-border bg-transparent px-4 shadow-xl transition-[transform,opacity] duration-300 ease-out sm:px-6 md:static md:inset-auto md:z-auto md:h-auto md:w-auto md:translate-y-0 md:opacity-100 md:pointer-events-auto md:flex md:min-w-0 md:flex-1 md:max-w-xs md:border-0 md:bg-transparent md:px-0 md:shadow-none`}
            >
              <Search
                size={22}
                className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-foreground md:hidden"
              />
              <Search
                size={17}
                className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 text-muted-foreground md:block"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onFocus={() => setSearchFocused(true)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") setSearchFocused(false);
                  if (event.key === "Enter" && searchSuggestions[0]) {
                    setSearchFocused(false);
                    goToSection(searchSuggestions[0].key);
                    setSearch(searchSuggestions[0].title);
                  }
                }}
                placeholder="Type and press enter to search..."
                aria-label="Search current content"
                className="h-14 min-w-0 flex-1 rounded-none border-0 bg-transparent pl-11 pr-10 text-base leading-6 text-foreground outline-none placeholder:text-muted-foreground focus:border-transparent focus:ring-0 md:h-9 md:rounded-full md:border md:border-transparent md:bg-secondary md:pl-4 md:pr-9 md:text-sm md:focus:border-transparent md:focus:bg-secondary"
              />
              {searchFocused && search.trim() && (
                <div className="absolute left-0 right-0 top-11 z-50 overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
                  {searchSuggestions.length > 0 ? (
                    searchSuggestions.map((suggestion, index) => (
                      <button
                        key={`${suggestion.key}-${suggestion.title}-${index}`}
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          setSearchFocused(false);
                          goToSection(suggestion.key);
                          setSearch(suggestion.title);
                        }}
                        className="flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left last:border-0 hover:bg-secondary"
                      >
                        <Search
                          size={14}
                          className="mt-0.5 shrink-0 text-primary"
                        />
                        <span className="min-w-0 truncate text-xs font-semibold text-foreground">
                          {suggestion.title}
                          <span className="ml-2 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                            {resourceMeta[suggestion.key].label}
                          </span>
                        </span>
                      </button>
                    ))
                  ) : (
                    <p className="px-4 py-4 text-xs text-muted-foreground">
                      No matching content found
                    </p>
                  )}
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  setMobileSearchOpen(false);
                  setSearchFocused(false);
                }}
                aria-label="Close search"
                className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-foreground hover:bg-background/60 md:hidden"
              >
                <X size={23} />
              </button>
            </div>

            <div className="hidden min-w-0 flex-1 items-center justify-end gap-2 text-sm md:flex">
              <span className="hidden font-mono text-[11px] uppercase tracking-wider text-muted-foreground sm:inline">
                Console
              </span>
              <ChevronRight
                size={14}
                className="hidden shrink-0 text-primary sm:block"
              />
              <span className="truncate font-semibold text-foreground font-mono uppercase text-xs tracking-wide">
                {currentLabel}
              </span>
            </div>

            <div className="ml-auto flex shrink-0 items-center gap-2 md:gap-3">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setQuickNotificationsOpen((open) => !open)}
                  aria-label="Open notifications"
                  aria-expanded={quickNotificationsOpen}
                  className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border bg-secondary text-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  <Bell size={16} />
                  {notificationCount !== null && notificationCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 font-mono text-[9px] font-bold text-background">
                      {notificationCount}
                    </span>
                  )}
                </button>
                {quickNotificationsOpen && (
                  <div className="fixed left-2 right-2 top-16 z-50 max-h-[calc(100dvh-5rem)] overflow-hidden rounded-xl border border-border bg-card shadow-2xl md:absolute md:left-auto md:right-0 md:top-12 md:w-[min(22rem,calc(100vw-2rem))]">
                    <div className="flex items-center justify-between border-b border-border px-4 py-3">
                      <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-foreground">
                        Notifications
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setQuickNotificationsOpen(false);
                          goToSection("notifications");
                        }}
                        className="font-mono text-[10px] font-bold uppercase tracking-wider text-primary hover:underline"
                      >
                        View all
                      </button>
                    </div>
                    {quickNotifications.length === 0 ? (
                      <p className="px-4 py-8 text-center text-xs text-muted-foreground">
                        No notifications
                      </p>
                    ) : (
                      <div className="max-h-[calc(100dvh-10rem)] overflow-y-auto divide-y divide-border">
                        {quickNotifications.slice(0, 5).map((notification) => (
                          <div
                            key={notification.id}
                            className={`px-4 py-3 ${notification.read ? "opacity-60" : "bg-primary/5"}`}
                          >
                            <div className="flex min-w-0 items-start gap-3">
                              <Bell
                                size={14}
                                className={`mt-0.5 shrink-0 ${notification.read ? "text-muted-foreground" : "text-primary"}`}
                              />
                              <div className="min-w-0 flex-1">
                                <p className="break-words text-xs font-semibold text-foreground">
                                  {notification.title}
                                </p>
                                <p className="mt-1 break-words text-xs leading-5 text-muted-foreground">
                                  {notification.message}
                                </p>
                                <time className="mt-1 block font-mono text-[9px] text-muted-foreground">
                                  {formatMessageDate(notification.createdAt)}
                                </time>
                              </div>
                              {!notification.read && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    markQuickNotificationRead(notification.id)
                                  }
                                  aria-label="Mark notification as read"
                                  className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-primary"
                                >
                                  <MailOpen size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  const next = !adminLight;
                  setAdminLight(next);
                  window.localStorage.setItem(
                    "admin-theme",
                    next ? "light" : "dark",
                  );
                  toast({ title: `${next ? "Light" : "Dark"} theme enabled` });
                }}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-border bg-secondary text-foreground transition-colors hover:border-primary hover:text-primary"
                aria-label={`Switch to ${adminLight ? "dark" : "light"} admin theme`}
              >
                {adminLight ? <Moon size={16} /> : <Sun size={16} />}
              </button>
              {saveMutation.isPending && (
                <span className="hidden font-mono text-[10px] uppercase text-primary sm:inline">
                  Saving...
                </span>
              )}
              {saved && (
                <span className="hidden items-center gap-1.5 font-mono text-[10px] uppercase text-primary bg-primary/10 px-2 py-1 rounded-full sm:flex">
                  <Check size={13} /> Saved
                </span>
              )}
              <ProfileMenu
                image={
                  data.profile?.heroImage ||
                  data.profile?.aboutImage ||
                  data.profile?.image
                }
                username={username}
                isLight={adminLight}
                onEditProfile={() => goToSection("profile")}
                onLogout={logout}
              />
            </div>
          </div>
        </header>

        {/* Nav drawer - mobile */}
        {mobileNavOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              aria-label="Close menu"
              onClick={() => setMobileNavOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            />
            <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col border-r border-border bg-card shadow-2xl">
              <div className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border px-5">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-primary font-mono text-xs font-bold text-background">
                    {data.profile?.heroImage ||
                    data.profile?.aboutImage ||
                    data.profile?.image ? (
                      <NextImage
                        src={
                          data.profile.heroImage ||
                          data.profile.aboutImage ||
                          data.profile.image
                        }
                        alt="Profile"
                        width={200}
                        height={200}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      "AV"
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-foreground">
                      Console
                    </p>
                    {username && (
                      <p className="truncate text-[11px] text-muted-foreground">
                        {username}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setMobileNavOpen(false)}
                  aria-label="Close menu"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary"
                >
                  <X size={16} />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto px-3 py-5 font-mono uppercase text-xs">
                <button
                  onClick={() => goToSection("dashboard")}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 font-medium transition-colors ${
                    section === "dashboard"
                      ? "bg-primary/10 text-primary border-l-2 border-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground border-l-2 border-transparent"
                  }`}
                >
                  <LayoutDashboard size={16} /> Dashboard
                </button>

                <p className="mb-2 mt-6 px-4 text-[10px] font-bold tracking-wider text-muted-foreground/50">
                  Content
                </p>
                <div className="flex flex-col gap-1">
                  {resourceKeys.map((key) => {
                    const Icon = resourceMeta[key].icon;
                    return (
                      <button
                        key={key}
                        onClick={() => goToSection(key)}
                        className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-3 font-medium transition-colors ${
                          section === key
                            ? "bg-primary/10 text-primary border-l-2 border-primary"
                            : "text-muted-foreground hover:bg-secondary hover:text-foreground border-l-2 border-transparent"
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <Icon size={16} /> {resourceMeta[key].label}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            section === key
                              ? "bg-primary/20 text-primary"
                              : "bg-secondary text-muted-foreground"
                          }`}
                        >
                          {(data[key] ?? []).length}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </nav>

              <div className="border-t border-border p-3 font-mono uppercase text-xs">
                <button
                  onClick={() => goToSection("messages")}
                  className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-3 font-medium transition-colors ${
                    section === "messages"
                      ? "bg-primary/10 text-primary border-l-2 border-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground border-l-2 border-transparent"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Mail size={16} /> Messages
                  </span>
                  {messageCount !== null && messageCount > 0 && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        section === "messages"
                          ? "bg-primary/20 text-primary"
                          : "bg-secondary text-primary"
                      }`}
                    >
                      {messageCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => goToSection("notifications")}
                  className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-3 font-medium transition-colors ${section === "notifications" ? "bg-primary/10 text-primary border-l-2 border-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground border-l-2 border-transparent"}`}
                >
                  <span className="flex items-center gap-3">
                    <Bell size={16} /> Notifications
                  </span>
                  {notificationCount !== null && notificationCount > 0 && (
                    <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">
                      {notificationCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => goToSection("sections")}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 font-medium transition-colors ${
                    section === "sections"
                      ? "bg-primary/10 text-primary border-l-2 border-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground border-l-2 border-transparent"
                  }`}
                >
                  <Layout size={16} /> Sections
                </button>
                <button
                  onClick={() => goToSection("theme")}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 font-medium transition-colors ${
                    section === "theme"
                      ? "bg-primary/10 text-primary border-l-2 border-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground border-l-2 border-transparent"
                  }`}
                >
                  <Palette size={16} /> Theme
                </button>
                  <div className="flex flex-col gap-1">
                    <div className={`flex w-full items-center rounded-lg font-medium transition-colors ${
                    section === "settings"
                      ? "bg-primary/10 text-primary border-l-2 border-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground border-l-2 border-transparent"
                    }`}>
                      <button onClick={() => goToSection("settings")} className="flex min-w-0 flex-1 items-center gap-3 px-3 py-3 text-left"><Settings size={16} /> Settings</button>
                      <button type="button" aria-label="Expand Settings" onClick={() => setSettingsOpen((value) => !value)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md hover:bg-secondary hover:text-primary">{settingsOpen ? <ChevronDown size={15} /> : <Plus size={15} />}</button>
                    </div>
                    {settingsOpen && <div className="ml-8 flex flex-col gap-1 border-l border-border pl-2">
                      {([["security", "Security"], ["sessions", "Active Sessions"]] as const).map(([value, label]) => <button key={value} type="button" onClick={() => { setSettingsSubtab(value); goToSection("settings"); setMobileNavOpen(false); }} className={`rounded-md px-3 py-2 text-left font-mono text-[10px] font-bold uppercase tracking-wider ${section === "settings" && settingsSubtab === value ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>{label}</button>)}
                    </div>}
                  </div>
                <button
                  onClick={() => {
                    setMobileNavOpen(false);
                    router.push("/");
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-3 font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground border-l-2 border-transparent"
                >
                  <ExternalLink size={16} /> View site
                </button>
                <button
                  onClick={() => {
                    setMobileNavOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-3 font-medium text-red-500 transition-colors hover:bg-red-500/10 border-l-2 border-transparent mt-2"
                >
                  <LogOut size={16} /> Log out
                </button>
              </div>
            </aside>
          </div>
        )}

        <main className="min-w-0 flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8 grid-dots">
          {section === "dashboard" ? (
            <section className="min-w-0">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-foreground">Dashboard</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Overview of everything on your site.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                <StatTile
                  icon={Mail}
                  label="Messages"
                  count={messageCount ?? 0}
                  active={false}
                  onClick={() => goToSection("messages")}
                />
                <StatTile
                  icon={Bell}
                  label="Notifications"
                  count={notificationCount ?? 0}
                  active={false}
                  onClick={() => goToSection("notifications")}
                />
                {resourceKeys.map((key) => (
                  <StatTile
                    key={key}
                    icon={resourceMeta[key].icon}
                    label={resourceMeta[key].label}
                    count={(data[key] ?? []).length}
                    active={false}
                    onClick={() => goToSection(key)}
                  />
                ))}
              </div>

              <div className="mt-10 flex flex-col gap-5 bento-card border-red-500/25 bg-red-500/4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between md:px-6">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                    Reset all content
                  </p>
                  <p className="mt-1 text-xs leading-5 text-red-600/70 dark:text-red-400/70">
                    Replaces everything with the original portfolio defaults.
                  </p>
                </div>
                <button
                  onClick={resetAll}
                  disabled={resetMutation.isPending}
                  className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-wider text-red-600 transition-colors hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400 dark:hover:text-white"
                >
                  <RotateCcw size={13} /> Reset
                </button>
              </div>
            </section>
          ) : section === "profile" ? (
            <section className="min-w-0">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-foreground">
                  Profile settings
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Customize your personal brand across the site.
                </p>
              </div>
              <ProfileEditor
                profile={data.profile}
                onSave={saveProfile}
                saving={saveMutation.isPending}
              />
            </section>
          ) : section === "messages" ? (
            <section className="min-w-0 flex flex-col gap-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">Messages</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Everything submitted through your contact form, saved straight
                  to the database.
                </p>
              </div>
              <MessagesPanel />
            </section>
          ) : section === "notifications" ? (
            <section className="min-w-0 flex flex-col gap-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  Notifications
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Monitor Cloudflare and contact email delivery issues.
                </p>
              </div>
              <NotificationsPanel />
            </section>
          ) : section === "sections" ? (
            <section className="min-w-0">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-foreground">Sections</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Toggle the visibility of sections on your portfolio.
                </p>
              </div>
              <div className="bento-card p-5 md:p-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {[
                    "hero",
                    "about",
                    "stats",
                    "skills",
                    "marquee",
                    "education",
                    "experience",
                    "services",
                    "projects",
                    "testimonials",
                    "contact",
                  ].map((key) => {
                    const isVisible =
                      data.sectionVisibility?.[
                        key as keyof typeof data.sectionVisibility
                      ] ?? true;
                    return (
                      <div
                        key={key}
                        className="flex flex-col gap-4 rounded-lg border border-border bg-secondary/30 p-4"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-foreground">
                            {key}
                          </span>
                          <span className="flex items-center gap-2">
                            <span
                              className={`font-mono text-[10px] font-bold uppercase ${isVisible ? "text-primary" : "text-muted-foreground"}`}
                            >
                              {isVisible ? "On" : "Off"}
                            </span>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={isVisible}
                              aria-label={`${isVisible ? "Hide" : "Show"} ${key} section`}
                              onClick={() => {
                                persist(
                                  {
                                    ...data,
                                    sectionVisibility: {
                                      ...data.sectionVisibility,
                                      [key as keyof typeof data.sectionVisibility]:
                                        !isVisible,
                                    },
                                  },
                                  undefined,
                                  `${key} section is now ${isVisible ? "hidden" : "visible"}.`,
                                );
                              }}
                              className={`relative h-8 w-14 shrink-0 rounded-full border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${isVisible ? "border-primary bg-primary" : "border-muted-foreground/50 bg-secondary"}`}
                            >
                              <span
                                className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-md transition-transform ${isVisible ? "translate-x-6" : "translate-x-0"}`}
                              />
                            </button>
                          </span>
                        </div>
                        <label className="flex items-center gap-3 border-t border-border pt-3">
                          <span
                            className={`h-8 w-14 shrink-0 rounded-md border border-border bg-background ${data.sectionPatterns?.[key as keyof typeof data.sectionVisibility] && data.sectionPatterns[key as keyof typeof data.sectionVisibility] !== "none" ? `kf-${data.sectionPatterns[key as keyof typeof data.sectionVisibility]}` : ""}`}
                            style={{
                              backgroundImage:
                                patternBackgrounds[
                                  data.sectionPatterns?.[
                                    key as keyof typeof data.sectionVisibility
                                  ] || "none"
                                ],
                            }}
                            aria-hidden="true"
                          />
                          <span className="sr-only">
                            Background pattern for {key}
                          </span>
                          <PatternPicker
                            value={
                              data.sectionPatterns?.[
                                key as keyof typeof data.sectionVisibility
                              ] || "none"
                            }
                            onChange={(value) =>
                              persist(
                                {
                                  ...data,
                                  sectionPatterns: {
                                    ...data.sectionPatterns,
                                    [key]: value,
                                  },
                                },
                                undefined,
                                `${key} background pattern updated.`,
                              )
                            }
                          />
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          ) : section === "theme" ? (
            <section className="min-w-0">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-foreground">Theme</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Customize the look and feel of your portfolio.
                </p>
              </div>
              <div className="bento-card p-5 md:p-6 flex flex-col gap-6">
                <label className="block">
                  <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Accent Color (Hex)
                  </span>
                  <div className="flex gap-4 items-center">
                    <input
                      type="color"
                      value={data.themeSettings?.accentColor || "#10b981"}
                      onChange={(e) => {
                        persist({
                          ...data,
                          themeSettings: {
                            ...data.themeSettings,
                            accentColor: e.target.value,
                          },
                        });
                      }}
                      className="h-11 w-16 cursor-pointer rounded-lg border border-border bg-secondary p-1"
                    />
                    <input
                      type="text"
                      value={data.themeSettings?.accentColor || "#10b981"}
                      onChange={(e) => {
                        persist({
                          ...data,
                          themeSettings: {
                            ...data.themeSettings,
                            accentColor: e.target.value,
                          },
                        });
                      }}
                      className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2 text-sm uppercase text-foreground outline-none focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/20"
                    />
                  </div>
                </label>
                <label className="block">
                  <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Theme Mode
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        ["dark", "Dark", Moon],
                        ["light", "Light", Sun],
                        ["auto", "System", Monitor],
                      ] as const
                    ).map(([mode, label, Icon]) => (
                      <button
                        key={mode}
                        type="button"
                        aria-pressed={
                          (data.themeSettings?.mode || "dark") === mode
                        }
                        onClick={() =>
                          persist({
                            ...data,
                            themeSettings: { ...data.themeSettings, mode },
                          })
                        }
                        className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-3 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors ${(data.themeSettings?.mode || "dark") === mode ? "border-primary bg-primary/10 text-primary" : "border-border bg-secondary/50 text-muted-foreground hover:border-primary/50 hover:text-foreground"}`}
                      >
                        <Icon size={14} /> {label}
                      </button>
                    ))}
                  </div>
                </label>
              </div>
            </section>
          ) : section === "settings" ? (
            <section className="min-w-0">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-foreground">Settings</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Configure how contact-form messages reach you.
                </p>
              </div>
              <SettingsEditor activeTab={settingsSubtab} />
            </section>
          ) : (
            resource && (
              <section className="min-w-0 flex flex-col gap-6">
                {editing && (
                  <AdminForm
                    key={editing.id}
                    resource={resource}
                    value={editing}
                    mode={
                      items.some((item) => item.id === editing.id)
                        ? "edit"
                        : "new"
                    }
                    onSave={saveItem}
                    onCancel={() => setEditing(null)}
                  />
                )}

                <div className="bento-card overflow-hidden p-0">
                  <div className="flex flex-col gap-4 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <div className="min-w-0">
                      <h2 className="text-lg font-bold text-foreground truncate">
                        {resourceMeta[resource].label}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {items.length} {items.length === 1 ? "item" : "items"}{" "}
                        total
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Search
                          size={14}
                          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        />
                        <input
                          value={search}
                          onChange={(event) => setSearch(event.target.value)}
                          placeholder="Search..."
                          className="w-36 rounded-lg border border-border bg-secondary/50 py-2 pl-8 pr-3 text-sm outline-none transition-all focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/20 text-foreground sm:w-48"
                        />
                      </div>
                      <button
                        onClick={() => setEditing(emptyFor(resource))}
                        className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-background hover:bg-primary/90 hover:shadow-[0_0_10px_rgba(0,255,136,0.3)] transition-all whitespace-nowrap"
                      >
                        <Plus size={15} /> Add
                      </button>
                    </div>
                  </div>

                  {filteredItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-primary">
                        {(() => {
                          const Icon = resourceMeta[resource].icon;
                          return <Icon size={18} />;
                        })()}
                      </span>
                      <p className="text-sm font-medium text-foreground">
                        {search
                          ? `No results for "${search}"`
                          : `No ${resourceMeta[resource].label.toLowerCase()} yet`}
                      </p>
                      {!search && (
                        <button
                          onClick={() => setEditing(emptyFor(resource))}
                          className="mt-1 font-mono text-[11px] font-bold uppercase tracking-wider text-primary hover:underline"
                        >
                          Add the first {resourceMeta[resource].singular}
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-130 text-sm text-foreground">
                        <thead>
                          <tr className="border-b border-border bg-secondary/50 text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                            <th className="w-12 px-5 py-3 font-semibold sm:px-6">
                              #
                            </th>
                            <th className="px-3 py-3 font-semibold">Title</th>
                            <th className="hidden px-3 py-3 font-semibold md:table-cell">
                              Details
                            </th>
                            <th className="px-5 py-3 text-right font-semibold sm:px-6">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {filteredItems.map((item, index) => (
                            <tr
                              key={item.id}
                              className="group transition-colors hover:bg-secondary/20 even:bg-card odd:bg-background/50"
                            >
                              <td className="px-5 py-3.5 font-mono text-[11px] font-bold text-muted-foreground sm:px-6">
                                {String(index + 1).padStart(2, "0")}
                              </td>
                              <td className="max-w-55 truncate px-3 py-3.5 font-semibold text-foreground">
                                {itemTitle(item)}
                              </td>
                              <td className="hidden max-w-xs truncate px-3 py-3.5 text-muted-foreground md:table-cell">
                                {itemSubtitle(item)}
                              </td>
                              <td className="px-5 py-3.5 sm:px-6">
                                <div className="flex justify-end gap-1.5">
                                  <button
                                    onClick={() => setEditing(item)}
                                    aria-label="Edit"
                                    className="flex h-8 w-8 items-center justify-center rounded-md border border-primary/20 text-primary transition-colors hover:bg-primary hover:text-background"
                                  >
                                    <Pencil size={14} />
                                  </button>
                                  <button
                                    onClick={() => deleteItem(item.id)}
                                    aria-label="Delete"
                                    className="flex h-8 w-8 items-center justify-center rounded-md border border-red-500/20 text-red-500 transition-colors hover:bg-red-500 hover:text-white"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </section>
            )
          )}
        </main>
      </div>
    </div>
  );
}

export function ConsolePage() {
  const auth = useAuthQuery();
  const portfolio = usePortfolioQuery();
  useMotionFlow([portfolio.data]);

  if (auth.isLoading) return <PortfolioLoading />;
  if (!auth.data?.authenticated) return <LoginPage />;
  if (portfolio.isLoading) return <PortfolioLoading />;
  if (portfolio.isError || !portfolio.data) return <PortfolioLoading error />;
  return <AdminArea data={portfolio.data} username={auth.data.username} />;
}