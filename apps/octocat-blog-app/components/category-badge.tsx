import Link from "next/link";
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

  return (
    <Link
      href={`/category/${category.slug}`}
      className={`inline-flex items-center rounded-full font-medium text-white transition-opacity hover:opacity-90 ${sizeClasses[size]}`}
      style={{ backgroundColor: category.color || "#24292f" }}
    >
      {category.name}
    </Link>
  );
}
