import { db } from "@/src/db";
import { posts } from "@/src/db/schema";
import { desc, eq } from "drizzle-orm";
import { PostCard } from "@/components/post-card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Posts",
  description:
    "Browse all posts on Octocat Blog - GitHub updates, releases, features, and more.",
};

async function getAllPosts() {
  return db.query.posts.findMany({
    where: eq(posts.published, true),
    with: {
      author: true,
      category: true,
    },
    orderBy: [desc(posts.publishedAt)],
  });
}

export default async function PostsPage() {
  const allPosts = await getAllPosts();

  return (
    <div className="container px-4 md:px-8 py-12">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-8"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to home
      </Link>

      {/* Header */}
      <header className="mb-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">All Posts</h1>
        <p className="text-lg text-muted-foreground">
          Browse all GitHub updates, releases, features, and engineering
          insights.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          {allPosts.length} {allPosts.length === 1 ? "post" : "posts"}
        </p>
      </header>

      {/* Posts Grid */}
      {allPosts.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {allPosts.map((post) => (
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
          <p>No posts yet. Check back soon!</p>
        </div>
      )}
    </div>
  );
}
