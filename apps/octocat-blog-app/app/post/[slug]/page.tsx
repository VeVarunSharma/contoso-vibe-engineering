import { db } from "@/src/db";
import { posts } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { CategoryBadge } from "@/components/category-badge";
import { AuthorCard } from "@/components/author-card";
import type { Metadata } from "next";

interface PostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

async function getPost(slug: string) {
  return db.query.posts.findFirst({
    where: eq(posts.slug, slug),
    with: {
      author: true,
      category: true,
      postTags: {
        with: {
          tag: true,
        },
      },
    },
  });
}

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return {
      title: "Post Not Found",
    };
  }

  return {
    title: post.title,
    description: post.excerpt || `Read ${post.title} on Octocat Blog`,
    openGraph: {
      title: post.title,
      description: post.excerpt || `Read ${post.title} on Octocat Blog`,
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      authors: [post.author.name],
      images: post.coverImage ? [post.coverImage] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt || `Read ${post.title} on Octocat Blog`,
      images: post.coverImage ? [post.coverImage] : [],
    },
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post || !post.published) {
    notFound();
  }

  // Estimate reading time (average 200 words per minute)
  const wordCount = post.content.split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / 200);

  return (
    <article className="container max-w-4xl px-4 md:px-8 py-12">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-8"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to all posts
      </Link>

      {/* Header */}
      <header className="mb-8">
        <CategoryBadge category={post.category} size="md" />

        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mt-4 mb-6">
          {post.title}
        </h1>

        {post.excerpt && (
          <p className="text-xl text-muted-foreground mb-6">{post.excerpt}</p>
        )}

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            {post.author.avatarUrl && (
              <Image
                src={post.author.avatarUrl}
                alt={post.author.name}
                width={32}
                height={32}
                className="rounded-full"
              />
            )}
            <Link
              href={`/author/${post.author.username}`}
              className="font-medium hover:text-primary"
            >
              {post.author.name}
            </Link>
          </div>
          {post.publishedAt && (
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {format(new Date(post.publishedAt), "MMMM d, yyyy")}
            </div>
          )}
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {readingTime} min read
          </div>
        </div>
      </header>

      {/* Cover Image */}
      {post.coverImage && (
        <div className="relative aspect-[2/1] overflow-hidden rounded-xl mb-8">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Content */}
      <div className="prose prose-neutral dark:prose-invert max-w-none mb-12">
        {/* Parse markdown content */}
        <div
          dangerouslySetInnerHTML={{
            __html: parseMarkdown(post.content),
          }}
        />
      </div>

      {/* Tags */}
      {post.postTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8 pb-8 border-b">
          {post.postTags.map(({ tag }) => (
            <Link
              key={tag.id}
              href={`/tag/${tag.slug}`}
              className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              #{tag.name}
            </Link>
          ))}
        </div>
      )}

      {/* Author Card */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">About the Author</h3>
        <AuthorCard author={post.author} />
      </div>

      {/* Share */}
      <div className="flex items-center gap-4 pt-8 border-t">
        <span className="text-sm font-medium">Share this post:</span>
        <a
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(`https://octocat-blog.example.com/post/${post.slug}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-primary"
        >
          Twitter
        </a>
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://octocat-blog.example.com/post/${post.slug}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-primary"
        >
          LinkedIn
        </a>
      </div>
    </article>
  );
}

// Simple markdown parser for basic formatting
function parseMarkdown(content: string): string {
  return (
    content
      // Code blocks
      .replace(
        /```(\w+)?\n([\s\S]*?)```/g,
        '<pre><code class="language-$1">$2</code></pre>'
      )
      // Inline code
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      // Headers
      .replace(/^### (.*$)/gim, "<h3>$1</h3>")
      .replace(/^## (.*$)/gim, "<h2>$1</h2>")
      .replace(/^# (.*$)/gim, "<h1>$1</h1>")
      // Bold
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      // Italic
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      // Links
      .replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" class="text-primary hover:underline">$1</a>'
      )
      // Unordered lists
      .replace(/^- (.*$)/gim, "<li>$1</li>")
      // Ordered lists
      .replace(/^\d+\. (.*$)/gim, "<li>$1</li>")
      // Horizontal rule
      .replace(/^---$/gim, "<hr>")
      // Paragraphs
      .replace(/\n\n/g, "</p><p>")
      // Line breaks
      .replace(/\n/g, "<br>")
  );
}
