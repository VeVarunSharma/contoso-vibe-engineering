import { db } from "@/src/db";
import { tags, postTags } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { PostCard } from "@/components/post-card";
import Link from "next/link";
import { ArrowLeft, Tag as TagIcon } from "lucide-react";
import type { Metadata } from "next";

interface TagPageProps {
  params: Promise<{
    slug: string;
  }>;
}

async function getTag(slug: string) {
  return db.query.tags.findFirst({
    where: eq(tags.slug, slug),
  });
}

async function getPostsByTag(tagId: number) {
  // Get post IDs for this tag
  const taggedPosts = await db.query.postTags.findMany({
    where: eq(postTags.tagId, tagId),
    with: {
      post: {
        with: {
          author: true,
          category: true,
        },
      },
    },
  });

  return taggedPosts.map((tp) => tp.post);
}

export async function generateMetadata({
  params,
}: TagPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tag = await getTag(slug);

  if (!tag) {
    return {
      title: "Tag Not Found",
    };
  }

  return {
    title: `Posts tagged "${tag.name}"`,
    description: `Browse all posts tagged with ${tag.name} on Octocat Blog`,
  };
}

export default async function TagPage({ params }: TagPageProps) {
  const { slug } = await params;
  const tag = await getTag(slug);

  if (!tag) {
    notFound();
  }

  const tagPosts = await getPostsByTag(tag.id);
  const publishedPosts = tagPosts.filter((post) => post.published);

  return (
    <div className="container px-4 md:px-8 py-12">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-8"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to all posts
      </Link>

      {/* Tag Header */}
      <header className="mb-12">
        <div className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-sm font-medium mb-4">
          <TagIcon className="h-4 w-4" />
          {tag.name}
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          Posts tagged &ldquo;{tag.name}&rdquo;
        </h1>
        <p className="text-sm text-muted-foreground">
          {publishedPosts.length}{" "}
          {publishedPosts.length === 1 ? "post" : "posts"}
        </p>
      </header>

      {/* Posts Grid */}
      {publishedPosts.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {publishedPosts.map((post) => (
            <PostCard
              key={post.id}
              post={{
                ...post,
                author: post.author,
                category: post.category,
              }}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p>No posts with this tag yet. Check back soon!</p>
        </div>
      )}
    </div>
  );
}
