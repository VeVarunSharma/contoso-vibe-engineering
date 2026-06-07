import Link from "next/link";
import { Tag } from "lucide-react";
import type { Category } from "@/src/db/schema";

interface CategoryBadgeProps {
  category: Category;
  size?: "sm" | "md";
}

export function CategoryBadge({ category, size = "sm" }: CategoryBadgeProps) {
  const sizeClasses = {
    sm: "px-2.5 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
  };

  const iconSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";

  return (
    <Link
      href={`/category/${category.slug}`}
      className={`inline-flex items-center gap-1 rounded-full font-medium text-white transition-opacity hover:opacity-90 ${sizeClasses[size]}`}
      style={{ backgroundColor: category.color || "#24292f" }}
      aria-label={`View all posts in category: ${category.name}`}
    >
      <Tag className={iconSize} aria-hidden="true" />
      {category.name}
    </Link>
  );
}

