"use client";

import { ArrowLeft, Clock } from "lucide-react";
import Link from "next/link";
import type { BlogPost } from "@/types";
import { Photo } from "@/components/common/ui";
import { LinkButton } from "@/components/common/Button";
import { Breadcrumbs } from "@/components/services/ServicePage";
import { useHydrated, useStore } from "@/hooks/useStore";
import { EmptyState, Spinner } from "@/components/common/ui";
import { formatDate } from "@/lib/utils";

/** Looks the article up in the store so posts added/edited in Admin → Blog Management appear here */
export function BlogArticleClient({ slug }: { slug: string }) {
  const hydrated = useHydrated();
  const posts = useStore("posts");
  const post = posts.find((p) => p.slug === slug && p.published !== false);
  if (!post && !hydrated) return <Spinner label="Loading article" />;
  if (!post) {
    return (
      <div className="container-site py-20">
        <EmptyState title="Article not found" description="It may have been unpublished or removed." action={<LinkButton href="/blog">Back to the mag</LinkButton>} />
      </div>
    );
  }
  return <BlogArticle post={post} />;
}

export function BlogArticle({ post }: { post: BlogPost }) {
  const BLOG_POSTS = useStore("posts").filter((p) => p.published !== false);
  const related = BLOG_POSTS.filter((p) => p.slug !== post.slug && p.category === post.category).concat(BLOG_POSTS.filter((p) => p.slug !== post.slug && p.category !== post.category)).slice(0, 3);
  return (
    <article>
      <header className="bg-cream">
        <div className="container-site max-w-4xl py-10 lg:py-16">
          <Breadcrumbs items={[{ href: "/blog", label: "The mag" }, { label: post.category }]} />
          <h1 className="mt-6 text-[2.4rem] leading-[1.02] font-extrabold text-balance sm:text-5xl">{post.title}</h1>
          <p className="mt-4 text-lg text-ink-soft">{post.excerpt}</p>
          <p className="mt-5 flex flex-wrap items-center gap-2 text-sm text-muted">
            By <strong className="text-ink">{post.author}</strong> · {formatDate(post.date, { day: "numeric", month: "long", year: "numeric" })} ·
            <Clock className="size-4" /> {post.readMins} min read
          </p>
        </div>
      </header>
      <div className="container-site max-w-4xl">
        <div className="relative -mt-2 aspect-[16/9] overflow-hidden rounded-[32px] shadow-lift">
          <Photo src={post.image} alt={post.title} fill priority sizes="(max-width: 1024px) 100vw, 900px" />
        </div>
        <div className="mx-auto max-w-2xl space-y-6 py-12 text-[18px] leading-relaxed text-ink-soft">
          {post.body.map((b, i) => (
            <section key={i} className="space-y-3">
              {b.heading && <h2 className="pt-2 text-2xl font-extrabold text-ink">{b.heading}</h2>}
              <p>{b.text}</p>
              {b.list && (
                <ul className="space-y-2 pl-5">
                  {b.list.map((li) => (
                    <li key={li} className="list-disc">
                      {li}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
          <div className="rounded-3xl bg-cream p-6 text-ink">
            <p className="text-lg font-extrabold">Rather leave it to a pro?</p>
            <p className="mt-1 text-[15px] text-ink-soft">Book a vetted Ginnara cleaner from tomorrow.</p>
            <LinkButton href="/booking" className="mt-4">
              Book a clean
            </LinkButton>
          </div>
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-semibold text-ink hover:text-brand">
            <ArrowLeft className="size-4" /> Back to all articles
          </Link>
        </div>
      </div>
      <section className="bg-cream-2 py-14">
        <div className="container-site">
          <h2 className="mb-6 text-2xl font-extrabold">Keep reading</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {related.map((p) => (
              <Link key={p.slug} href={`/blog/${p.slug}`} className="group overflow-hidden rounded-3xl bg-white shadow-soft">
                <div className="relative aspect-[3/2]">
                  <Photo src={p.image} alt={p.title} fill sizes="400px" />
                </div>
                <div className="p-5">
                  <p className="text-xs font-bold text-brand uppercase">{p.category}</p>
                  <p className="mt-1 font-extrabold group-hover:underline">{p.title}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </article>
  );
}
