import Link from "next/link";
import Image from "next/image";
import type { Author } from "@/src/db/schema";
import { Github } from "lucide-react";

interface AuthorCardProps {
  author: Author;
}

export function AuthorCard({ author }: AuthorCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-lg border bg-card p-4">
      {author.avatarUrl && (
        <Image
          src={author.avatarUrl}
          alt={author.name}
          width={64}
          height={64}
          className="rounded-full"
        />
      )}
      <div className="flex-1">
        <Link
          href={`/author/${author.username}`}
          className="inline-flex min-h-11 items-center font-semibold hover:text-primary transition-colors outline-offset-4 focus-visible:outline-2"
        >
          {author.name}
        </Link>
        <p className="text-sm text-muted-foreground">@{author.username}</p>
        {author.bio && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {author.bio}
          </p>
        )}
      </div>
      {author.githubUrl && (
        <a
          href={author.githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex size-11 items-center justify-center rounded-sm text-muted-foreground hover:text-primary outline-offset-4 focus-visible:outline-2"
          aria-label="View GitHub profile"
        >
          <Github className="h-5 w-5" aria-hidden="true" />
        </a>
      )}
    </div>
  );
}
