import type { Metadata } from "next";
import { BLOG_POSTS } from "@/data/mock-content";
import { BlogArticleClient } from "@/components/pages/BlogArticle";

export function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  return post ? { title: post.title, description: post.excerpt } : { title: "The mag" };
}

export default async function BlogPostPage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  return <BlogArticleClient slug={slug} />;
}
