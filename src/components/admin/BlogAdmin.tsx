"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { BlogPost } from "@/types";
import { Button } from "@/components/common/Button";
import { Input, Select, Textarea } from "@/components/common/Field";
import { ConfirmDialog, Modal } from "@/components/common/Modal";
import { useToast } from "@/components/common/Toast";
import { Photo } from "@/components/common/ui";
import { DataTable, IconButton } from "@/components/dashboard/DataTable";
import { Panel } from "@/components/dashboard/DashboardShell";
import { useStore } from "@/hooks/useStore";
import { logActivity } from "@/lib/admin";
import { insert, patch, removeWhere } from "@/lib/storage";
import { formatDate, toISODate } from "@/lib/utils";
import { IMAGE_OPTIONS, Switch, slugify } from "./ServicesAdmin";

/** Body ⇄ plain text: blank line between blocks, "## " starts a heading, "- " lines are bullet points */
export function bodyToText(body: BlogPost["body"]) {
  return body
    .map((b) => [b.heading ? `## ${b.heading}` : "", b.text, ...(b.list ?? []).map((l) => `- ${l}`)].filter(Boolean).join("\n"))
    .join("\n\n");
}

export function textToBody(text: string): BlogPost["body"] {
  return text
    .split(/\n\s*\n/)
    .map((block) => block.split("\n").map((l) => l.trim()).filter(Boolean))
    .filter((lines) => lines.length)
    .map((lines) => {
      const heading = lines[0].startsWith("## ") ? lines.shift()!.slice(3).trim() : undefined;
      const list = lines.filter((l) => l.startsWith("- ")).map((l) => l.slice(2).trim());
      const textLines = lines.filter((l) => !l.startsWith("- "));
      return { heading, text: textLines.join(" "), ...(list.length ? { list } : {}) };
    });
}

export function BlogAdmin() {
  const posts = useStore("posts");
  const { success } = useToast();
  const [editing, setEditing] = useState<BlogPost | "new" | null>(null);
  const [deleting, setDeleting] = useState<BlogPost | null>(null);
  const rows = [...posts].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <Panel>
      <DataTable
        rows={rows}
        rowKey={(p) => p.slug}
        searchText={(p) => `${p.title} ${p.category} ${p.author}`}
        searchPlaceholder="Search articles"
        toolbar={<Button size="sm" icon={<Plus className="size-4" />} onClick={() => setEditing("new")}>New article</Button>}
        columns={[
          {
            key: "title",
            header: "Article",
            sortValue: (p) => p.title,
            render: (p) => (
              <div className="flex items-center gap-3">
                <span className="relative h-11 w-16 shrink-0 overflow-hidden rounded-lg">
                  <Photo src={p.image} alt="" fill sizes="64px" />
                </span>
                <div className="max-w-xs">
                  <p className="line-clamp-1 font-semibold">{p.title}</p>
                  <a href={`/blog/${p.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-brand hover:underline">
                    /blog/{p.slug} <ExternalLink className="size-3" />
                  </a>
                </div>
              </div>
            ),
          },
          { key: "category", header: "Category", sortValue: (p) => p.category, render: (p) => p.category },
          { key: "author", header: "Author", render: (p) => p.author },
          { key: "date", header: "Date", sortValue: (p) => p.date, render: (p) => formatDate(p.date, { day: "numeric", month: "short", year: "numeric" }) },
          {
            key: "published",
            header: "Published",
            render: (p) => (
              <Switch
                on={p.published !== false}
                label={`Toggle ${p.title}`}
                onChange={() => {
                  const next = p.published === false;
                  patch("posts", (x) => x.slug === p.slug, { published: next });
                  logActivity("Blog", next ? "Published article" : "Unpublished article", p.title);
                  success(next ? "Article published" : "Article hidden from the blog");
                }}
              />
            ),
          },
          {
            key: "actions",
            header: "",
            className: "text-right",
            render: (p) => (
              <div className="flex justify-end gap-1">
                <IconButton label="Edit article" onClick={() => setEditing(p)}>
                  <Pencil className="size-4" />
                </IconButton>
                <IconButton label="Delete article" tone="danger" onClick={() => setDeleting(p)}>
                  <Trash2 className="size-4" />
                </IconButton>
              </div>
            ),
          },
        ]}
      />
      {editing && <PostModal initial={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete article?"
        description={`"${deleting?.title}" will be removed from The mag.`}
        confirmLabel="Delete article"
        onConfirm={() => {
          if (!deleting) return;
          removeWhere("posts", (p) => p.slug === deleting.slug);
          logActivity("Blog", "Deleted article", deleting.title);
          success("Article deleted");
        }}
      />
    </Panel>
  );
}

const postSchema = z.object({
  title: z.string().trim().min(8, "At least 8 characters"),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers and dashes only"),
  category: z.string().trim().min(2, "Enter a category"),
  excerpt: z.string().trim().min(20, "At least 20 characters"),
  author: z.string().trim().min(2, "Enter the author"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date"),
  readMins: z.coerce.number().int().min(1).max(60),
  image: z.string().min(1),
  body: z.string().trim().min(40, "Write at least a short paragraph"),
  published: z.boolean(),
});
type PostForm = z.input<typeof postSchema>;

function PostModal({ initial, onClose }: { initial?: BlogPost; onClose: () => void }) {
  const posts = useStore("posts");
  const { success } = useToast();
  const categories = Array.from(new Set(posts.map((p) => p.category)));
  const { register, handleSubmit, formState, setValue, watch, setError } = useForm<PostForm>({
    resolver: zodResolver(postSchema),
    defaultValues: initial
      ? { ...initial, body: bodyToText(initial.body), published: initial.published !== false }
      : { title: "", slug: "", category: categories[0] ?? "Cleaning tips", excerpt: "", author: "Ginnara team", date: toISODate(new Date()), readMins: 4, image: IMAGE_OPTIONS[0].value, body: "", published: true },
  });
  const image = watch("image");
  const save = handleSubmit((raw) => {
    const v = postSchema.parse(raw);
    if (posts.some((p) => p.slug === v.slug && p.slug !== initial?.slug)) return setError("slug", { message: "Slug already used" });
    const data: BlogPost = { ...v, body: textToBody(v.body) };
    if (initial) patch("posts", (p) => p.slug === initial.slug, data);
    else insert("posts", data);
    logActivity("Blog", initial ? "Edited article" : "Created article", v.title);
    success(initial ? "Article updated" : "Article created", v.published ? `Live at /blog/${v.slug}` : "Saved as draft");
    onClose();
  });
  return (
    <Modal open onClose={onClose} title={initial ? "Edit article" : "New article"} size="lg" footer={<Button onClick={save}>{initial ? "Save article" : "Create article"}</Button>}>
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={save} noValidate>
        <Input
          label="Title"
          wrapClassName="sm:col-span-2"
          error={formState.errors.title?.message}
          {...register("title", {
            onChange: (e) => {
              if (!initial) setValue("slug", slugify(e.target.value).slice(0, 60));
            },
          })}
        />
        <Input label="URL slug" hint="/blog/your-slug" error={formState.errors.slug?.message} {...register("slug")} />
        <Input label="Category" list="blog-cats" error={formState.errors.category?.message} {...register("category")} />
        <datalist id="blog-cats">
          {categories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <Input label="Author" error={formState.errors.author?.message} {...register("author")} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Date" type="date" error={formState.errors.date?.message} {...register("date")} />
          <Input label="Read time (min)" type="number" error={formState.errors.readMins?.message} {...register("readMins")} />
        </div>
        <Textarea label="Excerpt" wrapClassName="sm:col-span-2" rows={2} error={formState.errors.excerpt?.message} {...register("excerpt")} />
        <div className="flex items-end gap-3 sm:col-span-2">
          <Select label="Cover photo" wrapClassName="flex-1" options={IMAGE_OPTIONS} {...register("image")} />
          <span className="relative h-12 w-16 shrink-0 overflow-hidden rounded-xl">
            <Photo src={image} alt="" fill sizes="64px" />
          </span>
        </div>
        <Textarea
          label="Article body"
          wrapClassName="sm:col-span-2"
          rows={12}
          className="font-mono text-sm"
          hint='Leave a blank line between paragraphs. Start a line with "## " for a heading and "- " for a bullet point.'
          error={formState.errors.body?.message}
          {...register("body")}
        />
        <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-2">
          <input type="checkbox" className="size-4 accent-[#f2602b]" {...register("published")} /> Published on the website
        </label>
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  );
}
