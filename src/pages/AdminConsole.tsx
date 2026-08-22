import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "wouter";
import {
  BarChart3,
  Briefcase,
  Building2,
  Check,
  ChevronRight,
  ExternalLink,
  GraduationCap,
  KeyRound,
  Layers,
  LayoutDashboard,
  Lock,
  LogOut,
  type LucideIcon,
  Menu,
  Pencil,
  Plus,
  Quote,
  RotateCcw,
  Save,
  Search,
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
// Console / Admin area — content editing, protected by /api/auth.
// ---------------------------------------------------------------------

function LoginPage() {
  const queryClient = useQueryClient();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
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
        body: JSON.stringify({ username, password }),
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

  return (
    <div className="flex min-h-[100dvh] bg-background">
      {/* Brand panel — desktop only */}
      <div className="relative hidden w-[44%] flex-col justify-between overflow-hidden bg-foreground p-12 text-background lg:flex">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/20 blur-[100px]" />
        <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-primary/10 blur-[100px]" />

        <div className="relative flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary font-mono text-sm font-bold text-primary-foreground">
            AV
          </span>
          <span className="font-mono text-[11px] font-bold uppercase tracking-[.2em] text-background/70">
            Console
          </span>
        </div>

        <div className="relative">
          <h1 className="text-[clamp(2.2rem,3.2vw,3rem)] font-bold leading-[1.1] tracking-tight">
            Run the site
            <br />
            from one place.
          </h1>
          <p className="mt-5 max-w-sm text-sm leading-[1.7] text-background/60">
            Profile, projects, timeline, testimonials — every section of the
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
                className="flex items-start gap-3 text-sm text-background/80"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                  <Check size={12} />
                </span>
                {line}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative font-mono text-[10px] uppercase tracking-wider text-background/40">
          © {new Date().getFullYear()} · Secure admin access
        </p>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center px-5 py-16">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col gap-2 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Lock size={18} />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-foreground">
            Sign in to Console
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter your credentials to manage the site.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
            <label className="block">
              <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Username
              </span>
              <input
                required
                autoFocus
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10"
              />
            </label>
            <label className="block">
              <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Password
              </span>
              <input
                required
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10"
              />
            </label>
            {error && (
              <p className="rounded-lg bg-red-50 p-3 font-mono text-[10px] font-bold text-destructive text-center">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3.5 font-mono text-[11px] font-bold uppercase tracking-wider text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50 hover:shadow-lg"
            >
              <Lock size={14} />
              {submitting ? "Checking…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

type Resource = Exclude<keyof PortfolioData, "profile">;
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
    return `${item.value || "—"} · ${item.label || "Untitled"}`;
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
        reject(new Error("That file doesn’t look like a valid image."));
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
    ],
    education: ["degree", "institution", "period", "detail"],
    experience: ["role", "company", "period", "detail"],
    testimonials: ["quote", "name", "role"],
  };
  const labels: Record<string, string> = {
    value: "Value (e.g. 06, 100+, ∞)",
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
      className="rounded-xl border border-border bg-card shadow-sm"
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
                      className="h-16 w-16 shrink-0 rounded-lg object-cover shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({ ...prev, [field]: "" }))
                      }
                      className="font-mono text-[10px] font-bold text-destructive uppercase tracking-wider hover:underline whitespace-nowrap"
                    >
                      Remove Image
                    </button>
                  </div>
                ) : (
                  <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                    No image uploaded.
                  </span>
                )}
                <label className="sm:ml-auto inline-flex w-full sm:w-auto cursor-pointer items-center justify-center rounded-md bg-primary/10 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-primary hover:bg-primary/20 transition-colors whitespace-nowrap">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, field)}
                    className="hidden"
                  />
                  {form[field] ? "Replace Image" : "Upload Image"}
                </label>
              </div>
            ) : field === "accent" ? (
              <select
                value={form[field] || ""}
                onChange={(event) =>
                  setForm({ ...form, [field]: event.target.value })
                }
                className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm outline-none focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10"
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
                className="w-full resize-y rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm outline-none focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10"
              />
            ) : (
              <input
                required
                value={form[field] || ""}
                onChange={(event) =>
                  setForm({ ...form, [field]: event.target.value })
                }
                className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm outline-none focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10"
              />
            )}
          </label>
        ))}
      </div>
      <div className="flex flex-col gap-3 border-t border-border px-5 py-4 sm:flex-row sm:px-6">
        <button
          type="submit"
          className="inline-flex w-full sm:w-auto justify-center items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-mono text-[11px] font-bold uppercase tracking-wider text-primary-foreground hover:bg-primary/90 hover:shadow-md transition-all"
        >
          <Save size={14} /> Save {resourceMeta[resource].singular}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg w-full sm:w-auto border border-border bg-card px-5 py-2.5 font-mono text-[11px] font-bold uppercase tracking-wider hover:bg-secondary transition-all"
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
  const [imageError, setImageError] = useState<string | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);
  useEffect(() => {
    setForm(profile);
  }, [profile]);

  const fields: { key: keyof Profile; label: string; long?: boolean }[] = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "tagline", label: "Tagline" },
    { key: "location", label: "Location" },
    { key: "github", label: "GitHub (e.g. github.com/you)" },
    { key: "bio1", label: "Headline bio", long: true },
    { key: "bio2", label: "About paragraph 1", long: true },
    { key: "bio3", label: "About paragraph 2", long: true },
    { key: "contactTitle", label: "Contact heading", long: true },
    { key: "contactNote", label: "Contact note" },
  ];

  const handleImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageError(null);
    try {
      const dataUrl = await fileToResizedDataUrl(file);
      setForm((current) => ({ ...current, image: dataUrl }));
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
      setResumeError("That file is too large — please keep it under 2MB.");
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
        onSave(form);
      }}
      className="rounded-xl border border-border bg-card shadow-sm p-5 md:p-8"
    >
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div className="flex h-20 w-20 sm:h-24 sm:w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-secondary bg-secondary">
          {form.image ? (
            <img
              src={form.image}
              alt="Profile"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="font-mono text-[10px] uppercase text-muted-foreground">
              No photo
            </span>
          )}
        </div>
        <div className="flex flex-col gap-3 w-full sm:w-auto">
          <div className="flex flex-col sm:flex-row gap-3">
            <label className="inline-flex w-full sm:w-auto cursor-pointer items-center justify-center rounded-md bg-secondary px-6 py-3 font-mono text-[11px] font-bold uppercase tracking-wider hover:bg-secondary/70 transition-colors whitespace-nowrap">
              <input
                type="file"
                accept="image/*"
                onChange={handleImage}
                className="hidden"
              />{" "}
              Upload new photo
            </label>
            {form.image && (
              <button
                type="button"
                onClick={() =>
                  setForm((current) => ({ ...current, image: "" }))
                }
                className="w-full sm:w-auto rounded-md bg-red-50 px-6 py-3 font-mono text-[11px] font-bold uppercase tracking-wider text-red-600 hover:bg-red-100 transition-colors whitespace-nowrap"
              >
                Remove
              </button>
            )}
          </div>
          {imageError && (
            <p className="font-mono text-[11px] text-destructive">
              {imageError}
            </p>
          )}
        </div>
      </div>

      <div className="mb-10 rounded-lg bg-secondary/30 p-5 md:p-6 border border-border min-w-0">
        <span className="mb-4 block font-mono text-[11px] font-bold uppercase tracking-wider text-foreground">
          Résumé Document
        </span>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <label className="inline-flex w-full sm:w-auto cursor-pointer items-center justify-center rounded-md bg-primary/10 px-6 py-3 font-mono text-[11px] font-bold uppercase tracking-wider text-primary hover:bg-primary/20 transition-colors whitespace-nowrap">
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
                className="shrink-0 font-mono text-[11px] font-bold uppercase text-destructive hover:underline"
              >
                Remove
              </button>
            </div>
          )}
        </div>
        {resumeError && (
          <p className="mt-3 font-mono text-[11px] text-destructive">
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
                value={form[key]}
                rows={3}
                onChange={(event) =>
                  setForm({ ...form, [key]: event.target.value })
                }
                className="w-full resize-y rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10"
              />
            ) : (
              <input
                required
                value={form[key]}
                onChange={(event) =>
                  setForm({ ...form, [key]: event.target.value })
                }
                className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10"
              />
            )}
          </label>
        ))}
      </div>
      <div className="mt-8 flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex w-full sm:w-auto justify-center items-center gap-2 rounded-lg bg-primary px-8 py-3.5 font-mono text-[11px] font-bold uppercase tracking-wider text-primary-foreground hover:bg-primary/90 hover:shadow-md transition-all disabled:opacity-50 whitespace-nowrap"
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
      className={`flex flex-col items-start gap-3 rounded-xl border p-4 text-left transition-all ${
        active
          ? "border-primary/40 bg-primary/5 shadow-sm"
          : "border-border bg-card hover:border-primary/30 hover:bg-secondary/40"
      }`}
    >
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-lg ${
          active
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-muted-foreground"
        }`}
      >
        <Icon size={15} />
      </span>
      <div>
        <p className="text-xl font-bold text-foreground leading-none">
          {String(count).padStart(2, "0")}
        </p>
        <p className="mt-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
      </div>
    </button>
  );
}

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
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
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
      />
      <div className="relative my-auto max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground">
            Change password
          </h3>
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
            <input
              required
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10"
            />
          </label>
          <label className="block">
            <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              New password
            </span>
            <input
              required
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10"
            />
          </label>
          <label className="block">
            <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Confirm new password
            </span>
            <input
              required
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10"
            />
          </label>
          {error && (
            <p className="rounded-lg bg-red-50 p-3 font-mono text-[10px] font-bold text-destructive text-center">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full justify-center items-center gap-2 rounded-lg bg-primary px-6 py-3 font-mono text-[11px] font-bold uppercase tracking-wider text-primary-foreground hover:bg-primary/90 hover:shadow-md transition-all disabled:opacity-50"
          >
            <KeyRound size={16} /> Update password
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
  onEditProfile,
  onLogout,
}: {
  image?: string;
  username?: string;
  onEditProfile: () => void;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((value) => !value)}
        aria-label="Account menu"
        className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-primary-foreground ring-2 ring-primary/15 transition-transform hover:scale-105"
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
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              <Pencil size={14} /> Edit profile
            </button>
            <button
              onClick={() => {
                setOpen(false);
                setChangingPassword(true);
              }}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              <KeyRound size={14} /> Change password
            </button>
            <button
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="flex w-full items-center gap-2.5 border-t border-border px-4 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-red-50"
            >
              <LogOut size={14} /> Log out
            </button>
          </div>
        </>
      )}

      {changingPassword && (
        <ChangePasswordModal onClose={() => setChangingPassword(false)} />
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
  const [section, setSection] = useState<"dashboard" | "profile" | Resource>(
    "dashboard",
  );
  const [editing, setEditing] = useState<
    PortfolioData[Resource][number] | null
  >(null);
  const [search, setSearch] = useState("");
  const [saved, setSaved] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const saveMutation = useSavePortfolioMutation();
  const resetMutation = useResetPortfolioMutation();
  const resource =
    section === "profile" || section === "dashboard" ? null : section;
  const items = resource ? (data[resource] ?? []) : [];

  useEffect(() => {
    setSearch("");
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

  const goToSection = (next: "dashboard" | "profile" | Resource) => {
    setSection(next);
    setEditing(null);
    setMobileNavOpen(false);
  };

  const persist = (next: PortfolioData, onDone?: () => void) => {
    saveMutation.mutate(next, {
      onSuccess: () => {
        setSaved(true);
        window.setTimeout(() => setSaved(false), 1800);
        toast({
          title: "Saved ✨",
          description: "Your beautiful changes are live!",
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
        : resourceMeta[section].label;
  const resourceKeys = Object.keys(resourceMeta) as Resource[];

  return (
    <div className="flex min-h-[100dvh] bg-background">
      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex lg:w-64 lg:shrink-0 lg:flex-col border-r border-border bg-card">
        <div className="flex h-16 items-center gap-3 border-b border-border px-6">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-mono text-xs font-bold text-primary-foreground">
            AV
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

        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <button
            onClick={() => goToSection("dashboard")}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              section === "dashboard"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <LayoutDashboard size={16} /> Dashboard
          </button>

          <p className="mb-2 mt-6 px-3 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Content
          </p>
          <div className="flex flex-col gap-0.5">
            {resourceKeys.map((key) => {
              const Icon = resourceMeta[key].icon;
              return (
                <button
                  key={key}
                  onClick={() => goToSection(key)}
                  className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    section === key
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon size={16} /> {resourceMeta[key].label}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${
                      section === key
                        ? "bg-primary/15 text-primary"
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

        <div className="border-t border-border p-3">
          <button
            onClick={() => setLocation("/")}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <ExternalLink size={16} /> View site
          </button>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-red-50"
          >
            <LogOut size={16} /> Log out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-md">
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
                className="hidden shrink-0 text-muted-foreground sm:block"
              />
              <span className="truncate font-semibold text-foreground">
                {currentLabel}
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              {saveMutation.isPending && (
                <span className="hidden font-mono text-[10px] uppercase text-primary sm:inline">
                  Saving…
                </span>
              )}
              {saved && (
                <span className="hidden items-center gap-1.5 font-mono text-[10px] uppercase text-green-600 sm:flex">
                  <Check size={13} /> Saved
                </span>
              )}
              <ProfileMenu
                image={data.profile?.image}
                username={username}
                onEditProfile={() => goToSection("profile")}
                onLogout={logout}
              />
            </div>
          </div>
        </header>

        {/* Nav drawer — mobile */}
        {mobileNavOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              aria-label="Close menu"
              onClick={() => setMobileNavOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
            />
            <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col border-r border-border bg-card shadow-xl">
              <div className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border px-5">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-mono text-xs font-bold text-primary-foreground">
                    AV
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

              <nav className="flex-1 overflow-y-auto px-3 py-5">
                <button
                  onClick={() => goToSection("dashboard")}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    section === "dashboard"
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <LayoutDashboard size={16} /> Dashboard
                </button>

                <p className="mb-2 mt-6 px-3 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Content
                </p>
                <div className="flex flex-col gap-0.5">
                  {resourceKeys.map((key) => {
                    const Icon = resourceMeta[key].icon;
                    return (
                      <button
                        key={key}
                        onClick={() => goToSection(key)}
                        className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                          section === key
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <Icon size={16} /> {resourceMeta[key].label}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${
                            section === key
                              ? "bg-primary/15 text-primary"
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

              <div className="border-t border-border p-3">
                <button
                  onClick={() => {
                    setMobileNavOpen(false);
                    setLocation("/");
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <ExternalLink size={16} /> View site
                </button>
                <button
                  onClick={() => {
                    setMobileNavOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-red-50"
                >
                  <LogOut size={16} /> Log out
                </button>
              </div>
            </aside>
          </div>
        )}

        <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">
          {section === "dashboard" ? (
            <section className="min-w-0">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-foreground">
                  Dashboard
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Overview of everything on your site.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
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

                <div className="min-w-0 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
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
                          placeholder="Search…"
                          className="w-36 rounded-lg border border-border bg-secondary/50 py-2 pl-8 pr-3 text-sm outline-none transition-all focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10 sm:w-48"
                        />
                      </div>
                      <button
                        onClick={() => setEditing(emptyFor(resource))}
                        className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-primary-foreground hover:bg-primary/90 hover:shadow-md transition-all whitespace-nowrap"
                      >
                        <Plus size={15} /> Add
                      </button>
                    </div>
                  </div>

                  {filteredItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-muted-foreground">
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
                      <table className="w-full min-w-[520px] text-sm">
                        <thead>
                          <tr className="border-b border-border bg-secondary/30 text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
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
                              className="group transition-colors hover:bg-secondary/30"
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
                                    className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                                  >
                                    <Pencil size={14} />
                                  </button>
                                  <button
                                    onClick={() => deleteItem(item.id)}
                                    aria-label="Delete"
                                    className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-red-600 hover:text-white"
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

          <div className="mt-10 flex items-center justify-between gap-4 rounded-xl border border-dashed border-red-200 bg-red-50/50 px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-destructive">
                Reset all content
              </p>
              <p className="text-xs text-red-600/70">
                Replaces everything with the original portfolio defaults.
              </p>
            </div>
            <button
              onClick={resetAll}
              disabled={resetMutation.isPending}
              className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-red-600 hover:bg-red-100 transition-colors"
            >
              <RotateCcw size={13} /> Reset
            </button>
          </div>
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