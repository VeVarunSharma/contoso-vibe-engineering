import { db } from "@/src/db";
import { posts, reactions, reactionTypes } from "@/src/db/schema";
import { count, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

const reactionSchema = z.object({
  type: z.enum(reactionTypes),
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

    const rows = await db
      .select({ type: reactions.type, count: count() })
      .from(reactions)
      .where(eq(reactions.postId, post.id))
      .groupBy(reactions.type);
    const counts = Object.fromEntries(
      reactionTypes.map((type) => [
        type,
        Number(rows.find((row) => row.type === type)?.count ?? 0),
      ]),
    );

    return NextResponse.json({ reactions: counts });
  } catch (error) {
    console.error("Error fetching reactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch reactions" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const parsed = reactionSchema.safeParse(
      await request.json().catch(() => null),
    );

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid reaction" }, { status: 400 });
    }

    const { slug } = await params;
    const post = await getPublishedPost(slug);

    if (!post?.published) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const [reaction] = await db
      .insert(reactions)
      .values({ postId: post.id, type: parsed.data.type })
      .returning({ type: reactions.type });

    return NextResponse.json({ reaction }, { status: 201 });
  } catch (error) {
    console.error("Error creating reaction:", error);
    return NextResponse.json(
      { error: "Failed to create reaction" },
      { status: 500 },
    );
  }
}
