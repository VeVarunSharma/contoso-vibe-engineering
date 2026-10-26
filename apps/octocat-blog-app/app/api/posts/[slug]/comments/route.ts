import { db } from "@/src/db";
import { comments, posts } from "@/src/db/schema";
import { desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

const commentSchema = z.object({
  displayName: z.string().trim().min(1).max(80),
  content: z.string().trim().min(1).max(2000),
});

async function getPublishedPost(slug: string) {
  return db.query.posts.findFirst({
    columns: { id: true, published: true },
    where: eq(posts.slug, slug),
  });
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const post = await getPublishedPost(slug);

    if (!post?.published) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const postComments = await db.query.comments.findMany({
      columns: {
        id: true,
        displayName: true,
        content: true,
        createdAt: true,
      },
      where: eq(comments.postId, post.id),
      orderBy: desc(comments.createdAt),
    });

    return NextResponse.json({ comments: postComments });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const parsed = commentSchema.safeParse(
      await request.json().catch(() => null),
    );

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid comment" }, { status: 400 });
    }

    const { slug } = await params;
    const post = await getPublishedPost(slug);

    if (!post?.published) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const [comment] = await db
      .insert(comments)
      .values({ postId: post.id, ...parsed.data })
      .returning({
        id: comments.id,
        displayName: comments.displayName,
        content: comments.content,
        createdAt: comments.createdAt,
      });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 },
    );
  }
}
