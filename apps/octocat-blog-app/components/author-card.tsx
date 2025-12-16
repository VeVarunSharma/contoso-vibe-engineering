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
          className="font-semibold hover:text-primary transition-colors"
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
          className="text-muted-foreground hover:text-primary"
          aria-label="View GitHub profile"
        >
          <Github className="h-5 w-5" />
        </a>
      )}
    </div>
  );
}
