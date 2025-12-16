import { db } from "@/src/db";
import { authors, posts } from "@/src/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Image from "next/image";
import { PostCard } from "@/components/post-card";
import Link from "next/link";
import { ArrowLeft, Github, ExternalLink } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import type { Metadata } from "next";

interface AuthorPageProps {
  params: Promise<{
    username: string;
  }>;
}

async function getAuthor(username: string) {
  return db.query.authors.findFirst({
    where: eq(authors.username, username),
  });
}

async function getPostsByAuthor(authorId: number) {
  return db.query.posts.findMany({
    where: eq(posts.authorId, authorId),
    with: {
      author: true,
      category: true,
    },
    orderBy: [desc(posts.publishedAt)],
  });
}

export async function generateMetadata({
  params,
}: AuthorPageProps): Promise<Metadata> {
  const { username } = await params;
  const author = await getAuthor(username);

  if (!author) {
    return {
      title: "Author Not Found",
    };
  }

  return {
    title: `Posts by ${author.name}`,
    description:
      author.bio || `Read all posts by ${author.name} on Octocat Blog`,
  };
}

export default async function AuthorPage({ params }: AuthorPageProps) {
  const { username } = await params;
  const author = await getAuthor(username);

  if (!author) {
    notFound();
  }

  const authorPosts = await getPostsByAuthor(author.id);
  const publishedPosts = authorPosts.filter((post) => post.published);

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

      {/* Author Header */}
      <header className="flex flex-col md:flex-row items-start gap-6 mb-12 pb-8 border-b">
        {author.avatarUrl && (
          <Image
            src={author.avatarUrl}
            alt={author.name}
            width={120}
            height={120}
            className="rounded-full"
          />
        )}
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-2">{author.name}</h1>
          <p className="text-muted-foreground mb-4">@{author.username}</p>
          {author.bio && (
            <p className="text-muted-foreground mb-4">{author.bio}</p>
          )}
          <div className="flex gap-4">
            {author.githubUrl && (
              <Button variant="outline" size="sm" asChild>
                <a
                  href={author.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github className="mr-2 h-4 w-4" />
                  GitHub Profile
                  <ExternalLink className="ml-2 h-3 w-3" />
                </a>
              </Button>
            )}
          </div>
        </div>
        <div className="text-center p-4 bg-muted rounded-lg">
          <div className="text-3xl font-bold">{publishedPosts.length}</div>
          <div className="text-sm text-muted-foreground">
            {publishedPosts.length === 1 ? "Post" : "Posts"}
          </div>
        </div>
      </header>

      {/* Posts Section */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Posts by {author.name}</h2>

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
            <p>No posts by this author yet. Check back soon!</p>
          </div>
        )}
      </section>
    </div>
  );
}
