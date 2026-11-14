"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDown, ArrowUp, ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { Faq } from "@/types";
import { Button, LinkButton } from "@/components/common/Button";
import { Input, Textarea, Toggle } from "@/components/common/Field";
import { ConfirmDialog, Modal } from "@/components/common/Modal";
import { useToast } from "@/components/common/Toast";
import { Badge, DemoNote, PillTabs } from "@/components/common/ui";
import { IconButton } from "@/components/dashboard/DataTable";
import { Panel } from "@/components/dashboard/DashboardShell";
import { useStore } from "@/hooks/useStore";
import { logActivity } from "@/lib/admin";
import { insert, patch, removeWhere, write } from "@/lib/storage";
import { uid } from "@/lib/utils";

type Tab = "homepage" | "faqs" | "contact";

export function ContentAdmin() {
  const [tab, setTab] = useState<Tab>("homepage");
  return (
    <div className="space-y-5">
      <PillTabs value={tab} onChange={setTab} tabs={[{ value: "homepage", label: "Homepage" }, { value: "faqs", label: "FAQs" }, { value: "contact", label: "Contact details" }]} />
      {tab === "homepage" && <Homepage />}
      {tab === "faqs" && <Faqs />}
      {tab === "contact" && <ContactDetails />}
    </div>
  );
}

function Homepage() {
  const content = useStore("content");
  const { success } = useToast();
  const [draft, setDraft] = useState(content);
  const dirty = JSON.stringify(draft) !== JSON.stringify(content);
  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
      <Panel title="Homepage hero & announcement">
        <div className="space-y-5">
          <Input label="Hero headline" name="heroTitle" value={draft.heroTitle} onChange={(e) => setDraft({ ...draft, heroTitle: e.target.value })} hint="Shown in big white letters over the hero photo" />
          <Textarea label="Hero subtitle" name="heroSubtitle" value={draft.heroSubtitle} onChange={(e) => setDraft({ ...draft, heroSubtitle: e.target.value })} hint="Used for search engines and sharing" />
          <Toggle checked={draft.announcementOn} onChange={(v) => setDraft({ ...draft, announcementOn: v })} label="Show announcement text" description="A short promotional line used across the site" />
          <Input label="Announcement" name="announcement" value={draft.announcement} onChange={(e) => setDraft({ ...draft, announcement: e.target.value })} />
          <div className="flex flex-wrap gap-3">
            <Button
              disabled={!dirty || draft.heroTitle.trim().length < 5}
              onClick={() => {
                write("content", draft);
                logActivity("Content", "Published homepage changes", draft.heroTitle);
                success("Content published", "Changes are live on the homepage.");
              }}
            >
              Publish changes
            </Button>
            <Button variant="ghost" disabled={!dirty} onClick={() => setDraft(content)}>
              Discard
            </Button>
            <LinkButton href="/" target="_blank" variant="soft" iconRight={<ExternalLink className="size-4" />}>
              Preview site
            </LinkButton>
          </div>
        </div>
      </Panel>
      <Panel title="Live preview">
        <div className="relative overflow-hidden rounded-2xl bg-[#ece8e3] p-6 text-center">
          <div className="absolute inset-0 bg-gradient-to-b from-ink/45 to-transparent" />
          <p className="relative font-display text-3xl leading-tight font-extrabold text-white [text-shadow:0_2px_12px_rgb(0_0_0/0.35)]">{draft.heroTitle || "Your headline"}</p>
          <span className="bg-warm-gradient relative mt-4 inline-block rounded-full px-5 py-2.5 text-sm font-semibold text-white">Book my cleaning</span>
        </div>
        {draft.announcementOn && <p className="mt-4 rounded-xl bg-cream px-4 py-3 text-sm">📣 {draft.announcement}</p>}
      </Panel>
    </div>
  );
}

const faqSchema = z.object({ category: z.string().trim().min(2, "Enter a category"), q: z.string().trim().min(5, "Enter the question"), a: z.string().trim().min(10, "Enter the answer") });

function Faqs() {
  const faqs = useStore("faqs");
  const { success } = useToast();
  const [editing, setEditing] = useState<Faq | "new" | null>(null);
  const [deleting, setDeleting] = useState<Faq | null>(null);
  const categories = Array.from(new Set(faqs.map((f) => f.category)));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= faqs.length) return;
    const next = [...faqs];
    [next[i], next[j]] = [next[j], next[i]];
    write("faqs", next);
  };
  return (
    <Panel title={`FAQs (${faqs.length})`} action={<Button size="sm" icon={<Plus className="size-4" />} onClick={() => setEditing("new")}>Add FAQ</Button>}>
      <ul className="divide-y divide-line rounded-2xl border border-line">
        {faqs.map((f, i) => (
          <li key={f.id ?? f.q} className="flex items-start gap-3 px-4 py-3">
            <div className="flex flex-col">
              <button aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)} className="rounded p-0.5 text-muted hover:text-ink disabled:opacity-30">
                <ArrowUp className="size-4" />
              </button>
              <button aria-label="Move down" disabled={i === faqs.length - 1} onClick={() => move(i, 1)} className="rounded p-0.5 text-muted hover:text-ink disabled:opacity-30">
                <ArrowDown className="size-4" />
              </button>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{f.q}</p>
              <p className="line-clamp-2 text-sm text-ink-soft">{f.a}</p>
              <Badge className="mt-1.5">{f.category}</Badge>
            </div>
            <IconButton label="Edit FAQ" onClick={() => setEditing(f)}>
              <Pencil className="size-4" />
            </IconButton>
            <IconButton label="Delete FAQ" tone="danger" onClick={() => setDeleting(f)}>
              <Trash2 className="size-4" />
            </IconButton>
          </li>
        ))}
      </ul>
      <DemoNote className="mt-4">FAQs appear on the FAQ page, Help centre and homepage (first six) in this order.</DemoNote>
      {editing && <FaqModal initial={editing === "new" ? undefined : editing} categories={categories} onClose={() => setEditing(null)} />}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete FAQ?"
        description={`"${deleting?.q}" will be removed from the website.`}
        confirmLabel="Delete FAQ"
        onConfirm={() => {
          if (!deleting) return;
          removeWhere("faqs", (f) => (f.id ?? f.q) === (deleting.id ?? deleting.q));
          logActivity("Content", "Deleted FAQ", deleting.q);
          success("FAQ deleted");
        }}
      />
    </Panel>
  );
}

function FaqModal({ initial, categories, onClose }: { initial?: Faq; categories: string[]; onClose: () => void }) {
  const { success } = useToast();
  const { register, handleSubmit, formState } = useForm<z.infer<typeof faqSchema>>({ resolver: zodResolver(faqSchema), defaultValues: initial ?? { category: categories[0] ?? "Booking", q: "", a: "" } });
  const save = handleSubmit((v) => {
    if (initial) patch("faqs", (f) => (f.id ?? f.q) === (initial.id ?? initial.q), v);
    else insert("faqs", { ...v, id: uid("faq") }, false);
    logActivity("Content", initial ? "Edited FAQ" : "Added FAQ", v.q);
    success(initial ? "FAQ updated" : "FAQ added");
    onClose();
  });
  return (
    <Modal open onClose={onClose} title={initial ? "Edit FAQ" : "Add FAQ"} footer={<Button onClick={save}>Save FAQ</Button>}>
      <form className="space-y-4" onSubmit={save} noValidate>
        <Input label="Category" list="faq-cats" error={formState.errors.category?.message} {...register("category")} />
        <datalist id="faq-cats">
          {categories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <Input label="Question" error={formState.errors.q?.message} {...register("q")} />
        <Textarea label="Answer" rows={5} error={formState.errors.a?.message} {...register("a")} />
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  );
}

const contactSchema = z.object({
  businessName: z.string().trim().min(2, "Required"),
  supportPhone: z.string().trim().min(6, "Enter a phone number"),
  supportEmail: z.string().email("Enter a valid email"),
  website: z.string().trim().min(4, "Required"),
  address: z.string().trim().min(2, "Required"),
  openingHours: z.string().trim().min(3, "Required"),
});

function ContactDetails() {
  const settings = useStore("settings");
  const { success } = useToast();
  const { register, handleSubmit, formState, reset } = useForm<z.infer<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
    defaultValues: { businessName: settings.businessName ?? "", supportPhone: settings.supportPhone, supportEmail: settings.supportEmail, website: settings.website ?? "", address: settings.address ?? "", openingHours: settings.openingHours ?? "" },
  });
  return (
    <Panel title="Contact details shown on the website">
      <form
        noValidate
        className="grid max-w-3xl gap-5 sm:grid-cols-2"
        onSubmit={handleSubmit((v) => {
          write("settings", { ...settings, ...v });
          reset(v);
          logActivity("Content", "Updated contact details", `${v.supportPhone} · ${v.supportEmail}`);
          success("Contact details saved", "Updated in the footer, menu, contact page and booking pages.");
        })}
      >
        <Input label="Business name" error={formState.errors.businessName?.message} {...register("businessName")} />
        <Input label="Website" error={formState.errors.website?.message} {...register("website")} />
        <Input label="Phone" error={formState.errors.supportPhone?.message} {...register("supportPhone")} />
        <Input label="Email" type="email" error={formState.errors.supportEmail?.message} {...register("supportEmail")} />
        <Input label="Address / area" error={formState.errors.address?.message} {...register("address")} />
        <Input label="Opening hours" error={formState.errors.openingHours?.message} {...register("openingHours")} />
        <div className="sm:col-span-2">
          <Button type="submit" disabled={!formState.isDirty}>
            Save contact details
          </Button>
        </div>
      </form>
    </Panel>
  );
}

