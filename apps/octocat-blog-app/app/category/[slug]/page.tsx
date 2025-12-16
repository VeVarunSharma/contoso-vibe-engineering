import { db } from "@/src/db";
import { posts, categories } from "@/src/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { PostCard } from "@/components/post-card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

async function getCategory(slug: string) {
  return db.query.categories.findFirst({
    where: eq(categories.slug, slug),
  });
}

async function getPostsByCategory(categoryId: number) {
  return db.query.posts.findMany({
    where: eq(posts.categoryId, categoryId),
    with: {
      author: true,
      category: true,
    },
    orderBy: [desc(posts.publishedAt)],
  });
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);

  if (!category) {
    return {
      title: "Category Not Found",
    };
  }

  return {
    title: `${category.name} Posts`,
    description:
      category.description ||
      `Browse all ${category.name} posts on Octocat Blog`,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = await getCategory(slug);

  if (!category) {
    notFound();
  }

  const categoryPosts = await getPostsByCategory(category.id);
  const publishedPosts = categoryPosts.filter((post) => post.published);

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

      {/* Category Header */}
      <header className="mb-12">
        <div
          className="inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium text-white mb-4"
          style={{ backgroundColor: category.color || "#24292f" }}
        >
          {category.name}
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          {category.name} Posts
        </h1>
        {category.description && (
          <p className="text-lg text-muted-foreground">
            {category.description}
          </p>
        )}
        <p className="text-sm text-muted-foreground mt-2">
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
          <p>No posts in this category yet. Check back soon!</p>
        </div>
      )}
    </div>
  );
}
