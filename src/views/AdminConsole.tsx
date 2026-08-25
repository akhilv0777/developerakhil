"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Briefcase,
  Building2,
  Check,
  CheckSquare,
  ChevronRight,
  Eye,
  EyeOff,
  ExternalLink,
  GraduationCap,
  KeyRound,
  Layers,
  Layout,
  LayoutDashboard,
  Lock,
  LogOut,
  type LucideIcon,
  Mail,
  MailOpen,
  Menu,
  Palette,
  Pencil,
  Plus,
  Quote,
  Reply,
  RotateCcw,
  Save,
  Search,
  Settings,
  Square,
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
      <button type="button" onClick={() => setVisible((current) => !current)} aria-label={visible ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 flex -translate-y-1/2 cursor-pointer items-center justify-center text-muted-foreground hover:text-primary">
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
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: username, password }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setError(body.error || "Login failed.");
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
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: username }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Could not send reset email.");
      setForgotMessage(body.message);
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] bg-background grid-dots">
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
            {forgotMode ? "Reset your password" : "Sign in to Console"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {forgotMode ? "Enter your username or admin email to receive a reset link." : "Enter your credentials to manage the site."}
          </p>

          <form onSubmit={forgotMode ? handleForgotPassword : handleSubmit} className="mt-8 flex flex-col gap-5">
            <label className="block">
              <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {forgotMode ? "Username or admin email" : "Username or admin email"}
              </span>
              <input
                required
                autoFocus
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10 text-foreground"
              />
            </label>
            {!forgotMode && <label className="block">
              <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Password
              </span>
              <PasswordInput value={password} onChange={setPassword} />
            </label>}
            {error && (
              <p className="rounded-lg bg-red-900/30 border border-red-500/50 p-3 font-mono text-[10px] font-bold text-red-400 text-center">
                {error}
              </p>
            )}
            {forgotMessage && <p className="rounded-lg border border-primary/30 bg-primary/10 p-3 text-center font-mono text-[10px] font-bold text-primary">{forgotMessage}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3.5 font-mono text-[11px] font-bold uppercase tracking-wider text-background transition-all hover:bg-primary/90 disabled:opacity-50 hover:shadow-[0_0_15px_hsl(var(--primary)/0.35)]"
            >
              {forgotMode ? <Mail size={14} /> : <Lock size={14} />}
              {submitting ? "Please wait..." : forgotMode ? "Send reset link" : "Sign in"}
            </button>
            <button type="button" onClick={() => { setForgotMode((value) => !value); setError(null); setForgotMessage(null); }} className="cursor-pointer text-center font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-primary">
              {forgotMode ? "Back to sign in" : "Forgot password?"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

type Resource = "stats" | "services" | "projects" | "education" | "experience" | "testimonials";
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
  useEffect(() => {
    setForm({ ...value } as unknown as Record<string, string>);
  }, [value]);

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
                    <img
                      src={form[field]}
                      alt="Preview"
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
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Classic editor</span>
                  <button type="button" onClick={() => document.execCommand("bold")} className="ml-auto cursor-pointer rounded px-2 py-1 font-bold text-foreground hover:bg-background">B</button>
                  <button type="button" onClick={() => document.execCommand("italic")} className="cursor-pointer rounded px-2 py-1 italic text-foreground hover:bg-background">I</button>
                </div>
                <textarea
                  required
                  value={form[field] || ""}
                  rows={6}
                  onChange={(event) => setForm({ ...form, [field]: event.target.value })}
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
  const [languagesRaw, setLanguagesRaw] = useState((profile.languages || []).join(", "));
  const [rolesRaw, setRolesRaw] = useState((profile.roles || []).join(", "));
  const [imageError, setImageError] = useState<string | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);
  useEffect(() => {
    setForm(profile);
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
            roles: rolesRaw.split(",").map((s) => s.trim()).filter(Boolean),
            skills: skillsRaw.split(",").map((s) => s.trim()).filter(Boolean),
            languages: languagesRaw.split(",").map((s) => s.trim()).filter(Boolean),
          });
        }}
      className="bento-card p-5 md:p-6"
    >
      <div className="mb-8 grid gap-6 md:grid-cols-2">
        <div className="flex items-center gap-5">
          <div className="group relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 border-border bg-secondary transition-colors hover:border-primary">
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-full">
              {form.heroImage || form.image ? (
                <img
                  src={form.heroImage || form.image}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : <User size={22} className="text-muted-foreground" />}
            </div>
            <label className="absolute -bottom-1 -right-1 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-card bg-primary text-background shadow-md transition-transform hover:scale-110" title="Change hero image">
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
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-foreground">Hero image</p>
            <p className="mt-1 text-xs text-muted-foreground">Click the pencil to change it.</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-lg border border-border bg-secondary/30 p-3">
          <div className="group relative flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-secondary">
            {form.aboutImage ? <img src={form.aboutImage} alt="About" className="h-full w-full object-cover" /> : <span className="font-mono text-[9px] uppercase text-muted-foreground">No image</span>}
            <label className="absolute bottom-1 right-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-card bg-primary text-background shadow-md transition-transform hover:scale-110" title="Change about image">
              <input type="file" accept="image/*" onChange={(event) => handleImage(event, "aboutImage")} className="hidden" />
              <Pencil size={11} />
            </label>
          </div>
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-foreground">About image</p>
            <p className="mt-1 text-xs text-muted-foreground">Use a different image for the About section.</p>
          </div>
        </div>
        {imageError && <p className="font-mono text-[11px] text-red-400 md:col-span-2">{imageError}</p>}
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
          active
            ? "bg-primary text-background"
            : "bg-secondary text-primary"
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

function ChangePasswordModal({ onClose, isLight }: { onClose: () => void; isLight: boolean }) {
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto p-4">
      <button
        aria-label="Close"
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
      />
      <div
        style={isLight ? { "--background": "0 0% 98%", "--foreground": "220 25% 12%", "--border": "220 18% 86%", "--card": "0 0% 100%", "--card-border": "220 18% 88%", "--secondary": "220 17% 96%", "--muted-foreground": "220 9% 40%" } as React.CSSProperties : undefined}
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
            <PasswordInput value={currentPassword} onChange={setCurrentPassword} />
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
            <PasswordInput value={confirmPassword} onChange={setConfirmPassword} />
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

function ChangeUsernameModal({ onClose, isLight }: { onClose: () => void; isLight: boolean }) {
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
      if (!response.ok) throw new Error(body.error || "Could not change username.");
      toast({ title: "Username updated", description: "Your new username is active." });
      onClose();
      window.location.reload();
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto p-4">
      <button aria-label="Close" onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        style={isLight ? { "--background": "0 0% 98%", "--foreground": "220 25% 12%", "--border": "220 18% 86%", "--card": "0 0% 100%", "--card-border": "220 18% 88%", "--secondary": "220 17% 96%", "--muted-foreground": "220 9% 40%" } as React.CSSProperties : undefined}
        className="relative my-auto w-full max-w-sm bento-card bg-card p-5 shadow-2xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground">Change username</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="block">
            <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">New username</span>
            <input required minLength={3} maxLength={32} value={newUsername} onChange={(event) => setNewUsername(event.target.value)} className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/20" />
          </label>
          <label className="block">
            <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Current password</span>
            <PasswordInput value={currentPassword} onChange={setCurrentPassword} />
          </label>
          {error && <p className="rounded-lg border border-red-500/50 bg-red-900/30 p-3 text-center font-mono text-[10px] font-bold text-red-400">{error}</p>}
          <button type="submit" disabled={submitting} className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-mono text-[11px] font-bold uppercase tracking-wider text-background transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"><User size={16} /> {submitting ? "Updating..." : "Update username"}</button>
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
  const [open, setOpen] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [changingUsername, setChangingUsername] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((value) => !value)}
        aria-label="Account menu"
        className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-background ring-2 ring-primary/20 transition-transform hover:scale-105"
      >
        {image ? (
          <img
            src={image}
            alt={username || "Profile"}
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
              <div className="border-b border-border px-4 py-3">
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
              <Pencil size={14} className="group-hover:text-primary transition-colors" /> Edit profile
            </button>
            <button
              onClick={() => {
                setOpen(false);
                setChangingUsername(true);
              }}
              className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary group"
            >
              <User size={14} className="group-hover:text-primary transition-colors" /> Change username
            </button>
            <button
              onClick={() => {
                setOpen(false);
                setChangingPassword(true);
              }}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary group"
            >
              <KeyRound size={14} className="group-hover:text-primary transition-colors" /> Change password
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
        <ChangePasswordModal isLight={isLight} onClose={() => setChangingPassword(false)} />
      )}
      {changingUsername && <ChangeUsernameModal isLight={isLight} onClose={() => setChangingUsername(false)} />}
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
};

function SettingsEditor() {
  const [form, setForm] = useState<ContactSettings>({
    gmailAppPassword: "",
    contactToEmail: "",
    contactFromEmail: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        if (!cancelled) setForm(body.settings ?? {
          gmailAppPassword: "",
          contactToEmail: "",
          contactFromEmail: "",
        });
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
        <span className="flex items-center gap-3"><span className="h-4 w-4 animate-spin rounded-full border-2 border-primary/25 border-t-primary" /> Loading settings...</span>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bento-card shadow-sm p-5 md:p-6"
    >
      <div className="grid gap-6">
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

  const load = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetch("/api/messages", { credentials: "include" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = typeof body?.error === "string" ? body.error : "Could not load messages.";
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
  };

  useEffect(() => {
    load();
  }, []);

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
      await load();
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
            onClick={load}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-transparent px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-wider hover:bg-secondary text-foreground transition-all whitespace-nowrap"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="px-6 py-16 text-center text-sm text-muted-foreground">
          <span className="flex items-center justify-center gap-3"><span className="h-4 w-4 animate-spin rounded-full border-2 border-primary/25 border-t-primary" /> Loading messages...</span>
        </div>
      ) : loadError ? (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-red-500/10 text-red-400">
            <MailOpen size={18} />
          </span>
          <p className="text-sm font-medium text-foreground">Messages are currently unavailable</p>
          <p className="max-w-md text-xs text-muted-foreground">{loadError}</p>
          <button
            onClick={load}
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
            Submissions from your site's contact form will show up here.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 border-b border-border bg-secondary/50 px-5 py-2.5 sm:px-6">
            <button
              onClick={toggleAll}
              className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
            >
              {allSelected ? <CheckSquare size={15} className="text-primary" /> : <Square size={15} />}
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
                            {!isOpen && <span className="h-1.5 w-1.5 rounded-full bg-primary inline-block"></span>}
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

function AdminArea({
  data,
  username,
}: {
  data: PortfolioData;
  username?: string;
}) {
  const [section, setSection] = useState<
    "dashboard" | "profile" | "settings" | "messages" | "sections" | "theme" | Resource
  >("dashboard");
  const [editing, setEditing] = useState<
    PortfolioData[Resource][number] | null
  >(null);
  const [search, setSearch] = useState("");
  const [saved, setSaved] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [messageCount, setMessageCount] = useState<number | null>(null);
  const [adminLight, setAdminLight] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();
  const saveMutation = useSavePortfolioMutation();
  const resetMutation = useResetPortfolioMutation();
  const resource =
    section === "profile" ||
    section === "dashboard" ||
    section === "settings" ||
    section === "messages" ||
    section === "sections" ||
    section === "theme"
      ? null
      : section;
  const items = resource ? (data[resource] ?? []) : [];

  useEffect(() => {
    setSearch("");
  }, [section]);

  useEffect(() => {
    const requested = window.location.hash.slice(1);
    const validSections = [
      "dashboard", "profile", "settings", "messages", "sections", "theme",
      ...Object.keys(resourceMeta),
    ];
    if (validSections.includes(requested)) {
      setSection(requested as typeof section);
    }
  }, []);

  useEffect(() => {
    setAdminLight(window.localStorage.getItem("admin-theme") === "light");
  }, []);

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
      } catch {
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [section]);

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
    next: "dashboard" | "profile" | "settings" | "messages" | "sections" | "theme" | Resource,
  ) => {
    setSection(next);
    setEditing(null);
    setMobileNavOpen(false);
    window.history.replaceState(null, "", next === "dashboard" ? window.location.pathname : `#${next}`);
  };

  const persist = (next: PortfolioData, onDone?: () => void, description?: string) => {
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
  const currentLabel =
    section === "dashboard"
      ? "Dashboard"
      : section === "profile"
        ? "Profile"
        : section === "settings"
          ? "Settings"
          : section === "messages"
            ? "Messages"
            : section === "sections"
              ? "Sections"
              : section === "theme"
                ? "Theme"
                : resourceMeta[section].label;
  const resourceKeys = Object.keys(resourceMeta) as Resource[];

  return (
    <div className="admin-console flex h-[100dvh] overflow-hidden bg-background text-foreground" style={adminThemeStyle}>
      {/* Sidebar - desktop */}
      <aside className="hidden lg:flex lg:w-64 lg:shrink-0 lg:flex-col border-r border-border bg-card/90">
        <div className="flex h-16 items-center gap-3 border-b border-border px-6">
          <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-primary font-mono text-xs font-bold text-background">
            {data.profile?.heroImage || data.profile?.aboutImage || data.profile?.image ? (
              <img src={data.profile.heroImage || data.profile.aboutImage || data.profile.image} alt="Profile" className="h-full w-full object-cover" />
            ) : "AV"}
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
          <button
            onClick={() => goToSection("settings")}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 font-medium transition-colors ${
              section === "settings"
                ? "bg-primary/10 text-primary border-l-2 border-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground border-l-2 border-transparent"
            }`}
          >
            <Settings size={16} /> Settings
          </button>
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
          <div className="flex h-16 items-center gap-4 px-4 md:px-8">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground lg:hidden"
              aria-label="Open menu"
            >
              <Menu size={16} />
            </button>

            <div className="flex min-w-0 flex-1 items-center justify-end gap-2 text-sm">
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

            <div className="flex shrink-0 items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  const next = !adminLight;
                  setAdminLight(next);
                  window.localStorage.setItem("admin-theme", next ? "light" : "dark");
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
                image={data.profile?.heroImage || data.profile?.aboutImage || data.profile?.image}
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
                    {data.profile?.heroImage || data.profile?.aboutImage || data.profile?.image ? (
                      <img src={data.profile.heroImage || data.profile.aboutImage || data.profile.image} alt="Profile" className="h-full w-full object-cover" />
                    ) : "AV"}
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
                <button
                  onClick={() => goToSection("settings")}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 font-medium transition-colors ${
                    section === "settings"
                      ? "bg-primary/10 text-primary border-l-2 border-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground border-l-2 border-transparent"
                  }`}
                >
                  <Settings size={16} /> Settings
                </button>
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

              <div className="mt-10 flex flex-col gap-5 bento-card border-red-500/25 bg-red-500/[0.04] px-5 py-5 sm:flex-row sm:items-center sm:justify-between md:px-6">
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
                  {["hero", "about", "stats", "skills", "marquee", "education", "experience", "services", "projects", "testimonials", "contact"].map((key) => {
                    const isVisible = data.sectionVisibility?.[key as keyof typeof data.sectionVisibility] ?? true;
                    return (
                      <label key={key} className="flex items-center justify-between gap-4 rounded-lg border border-border bg-secondary/30 p-4">
                        <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-foreground">
                          {key}
                        </span>
                        <span className="flex items-center gap-2">
                          <span className={`font-mono text-[10px] font-bold uppercase ${isVisible ? "text-primary" : "text-muted-foreground"}`}>
                            {isVisible ? "On" : "Off"}
                          </span>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={isVisible}
                            aria-label={`${isVisible ? "Hide" : "Show"} ${key} section`}
                            onClick={() => {
                              persist({
                                ...data,
                                sectionVisibility: {
                                  ...data.sectionVisibility,
                                  [key]: !isVisible,
                                } as any,
                              }, undefined, `${key} section is now ${isVisible ? "hidden" : "visible"}.`);
                            }}
                            className={`relative h-8 w-14 shrink-0 rounded-full border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${isVisible ? "border-primary bg-primary" : "border-muted-foreground/50 bg-secondary"}`}
                          >
                            <span className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-md transition-transform ${isVisible ? "translate-x-6" : "translate-x-0"}`} />
                          </button>
                        </span>
                      </label>
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
                    {([
                      ["dark", "Dark", Moon],
                      ["light", "Light", Sun],
                      ["auto", "System", Monitor],
                    ] as const).map(([mode, label, Icon]) => (
                      <button
                        key={mode}
                        type="button"
                        aria-pressed={(data.themeSettings?.mode || "dark") === mode}
                        onClick={() => persist({
                          ...data,
                          themeSettings: { ...data.themeSettings, mode },
                        })}
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
              <SettingsEditor />
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
                      <table className="w-full min-w-[520px] text-sm text-foreground">
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
                              <td className="max-w-[220px] truncate px-3 py-3.5 font-semibold text-foreground">
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
