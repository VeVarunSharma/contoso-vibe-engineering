import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import type { Post, Author, Category } from "@/src/db/schema";

interface PostCardProps {
  post: Post & {
    author: Author;
    category: Category;
  };
  featured?: boolean;
}

export function PostCard({ post, featured = false }: PostCardProps) {
  const formattedDate = post.publishedAt
    ? formatDistanceToNow(new Date(post.publishedAt), { addSuffix: true })
    : "Draft";

  if (featured) {
    return (
      <article className="group relative overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-lg">
        <Link href={`/post/${post.slug}`} className="block">
          {post.coverImage && (
            <div className="relative aspect-[2/1] overflow-hidden">
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <span
              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium mb-3"
              style={{ backgroundColor: post.category.color || "#24292f" }}
            >
              {post.category.name}
            </span>
            <h2 className="text-2xl md:text-3xl font-bold mb-2 line-clamp-2">
              {post.title}
            </h2>
            <p className="text-sm text-gray-200 line-clamp-2 mb-4">
              {post.excerpt}
            </p>
            <div className="flex items-center gap-3">
              {post.author.avatarUrl && (
                <Image
                  src={post.author.avatarUrl}
                  alt={post.author.name}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              )}
              <div className="text-sm">
                <span className="font-medium">{post.author.name}</span>
                <span className="mx-2">·</span>
                <span className="text-gray-300">{formattedDate}</span>
              </div>
            </div>
          </div>
        </Link>
      </article>
    );
  }

  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border bg-card shadow-sm transition-shadow hover:shadow-md">
      <Link href={`/post/${post.slug}`} className="block">
        {post.coverImage && (
          <div className="relative aspect-[16/9] overflow-hidden">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        )}
        <div className="flex flex-1 flex-col p-4">
          <span
            className="inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white mb-2"
            style={{ backgroundColor: post.category.color || "#24292f" }}
          >
            {post.category.name}
          </span>
          <h3 className="text-lg font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {post.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {post.excerpt}
          </p>
          <div className="flex items-center gap-2 mt-auto text-sm text-muted-foreground">
            {post.author.avatarUrl && (
              <Image
                src={post.author.avatarUrl}
                alt={post.author.name}
                width={24}
                height={24}
                className="rounded-full"
              />
            )}
            <span>{post.author.name}</span>
            <span>·</span>
            <span>{formattedDate}</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
