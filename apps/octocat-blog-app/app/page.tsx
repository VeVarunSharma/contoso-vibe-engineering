import { db } from "@/src/db";
import { posts } from "@/src/db/schema";
import { desc, eq } from "drizzle-orm";
import { HeroSection } from "@/components/hero-section";
import { PostCard } from "@/components/post-card";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

async function getFeaturedPosts() {
  return db.query.posts.findMany({
    where: eq(posts.published, true),
    with: {
      author: true,
      category: true,
    },
    orderBy: [desc(posts.featured), desc(posts.publishedAt)],
    limit: 5,
  });
}

async function getCategories() {
  return db.query.categories.findMany();
}

export default async function HomePage() {
  const allPosts = await getFeaturedPosts();
  const allCategories = await getCategories();

  const featuredPost = allPosts.find((post) => post.featured);
  const regularPosts = allPosts.filter((post) => !post.featured);

  return (
    <>
      <HeroSection />

      <section
        id="latest-posts"
        className="container px-4 md:px-8 py-12 md:py-20"
      >
        {/* Categories */}
        <div className="flex flex-wrap gap-2 mb-12">
          <Link
            href="/"
            className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            All Posts
          </Link>
          {allCategories.map((category) => (
            <Link
              key={category.id}
              href={`/category/${category.slug}`}
              className="inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {category.name}
            </Link>
          ))}
        </div>

        {/* Featured Post */}
        {featuredPost && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Featured</h2>
            <PostCard
              post={{
                ...featuredPost,
                author: featuredPost.author,
                category: featuredPost.category,
              }}
              featured
            />
          </div>
        )}

        {/* Latest Posts Grid */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Latest Posts</h2>
            <Link
              href="/posts"
              className="inline-flex items-center text-sm font-medium text-primary hover:underline"
            >
              View all posts
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>

          {regularPosts.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {regularPosts.map((post) => (
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
      </section>

      {/* Newsletter Section */}
      <section className="border-t bg-muted/30 py-16">
        <div className="container px-4 md:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Stay in the Loop</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            Get the latest GitHub updates, feature announcements, and
            engineering insights delivered straight to your inbox.
          </p>
          <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 rounded-md border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="submit"
              className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
