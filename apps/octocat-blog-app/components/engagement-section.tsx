"use client";

import { Button, Input, Label, Textarea } from "@workspace/ui";
import { FormEvent, useEffect, useRef, useState } from "react";

interface EngagementSectionProps {
  slug: string;
}

interface Comment {
  id: number;
  displayName: string;
  content: string;
  createdAt: string;
}

type ReactionType = "like" | "love" | "celebrate";
type ReactionCounts = Record<ReactionType, number>;

const reactionOptions: {
  type: ReactionType;
  emoji: string;
  label: string;
}[] = [
  { type: "like", emoji: "👍", label: "Like" },
  { type: "love", emoji: "❤️", label: "Love" },
  { type: "celebrate", emoji: "🎉", label: "Celebrate" },
];

const emptyReactionCounts: ReactionCounts = {
  like: 0,
  love: 0,
  celebrate: 0,
};

export function EngagementSection({ slug }: EngagementSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [reactions, setReactions] =
    useState<ReactionCounts>(emptyReactionCounts);
  const [displayName, setDisplayName] = useState("");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    message: string;
    error: boolean;
  } | null>(null);
  const feedbackRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    async function loadEngagement() {
      try {
        const [commentsResponse, reactionsResponse] = await Promise.all([
          fetch(`/api/posts/${encodeURIComponent(slug)}/comments`),
          fetch(`/api/posts/${encodeURIComponent(slug)}/reactions`),
        ]);

        if (!commentsResponse.ok || !reactionsResponse.ok) {
          throw new Error("Unable to load engagement");
        }

        const commentsData = (await commentsResponse.json()) as {
          comments: Comment[];
        };
        const reactionsData = (await reactionsResponse.json()) as {
          reactions: ReactionCounts;
        };
        setComments(commentsData.comments);
        setReactions(reactionsData.reactions);
      } catch {
        setFeedback({
          message: "Comments and reactions could not be loaded.",
          error: true,
        });
      } finally {
        setIsLoading(false);
      }
    }

    void loadEngagement();
  }, [slug]);

  useEffect(() => {
    if (feedback) {
      feedbackRef.current?.focus();
    }
  }, [feedback]);

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const response = await fetch(
        `/api/posts/${encodeURIComponent(slug)}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayName, content }),
        },
      );

      if (!response.ok) {
        throw new Error("Unable to add comment");
      }

      const data = (await response.json()) as { comment: Comment };
      setComments((current) => [data.comment, ...current]);
      setContent("");
      setFeedback({ message: "Your comment was added.", error: false });
    } catch {
      setFeedback({
        message: "Your comment could not be added. Please try again.",
        error: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function addReaction(type: ReactionType) {
    setFeedback(null);

    try {
      const response = await fetch(
        `/api/posts/${encodeURIComponent(slug)}/reactions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type }),
        },
      );

      if (!response.ok) {
        throw new Error("Unable to add reaction");
      }

      setReactions((current) => ({
        ...current,
        [type]: current[type] + 1,
      }));
      setFeedback({ message: "Your reaction was added.", error: false });
    } catch {
      setFeedback({
        message: "Your reaction could not be added. Please try again.",
        error: true,
      });
    }
  }

  return (
    <section aria-labelledby="engagement-heading" className="border-t pt-8">
      <h2 id="engagement-heading" className="text-2xl font-semibold">
        Join the conversation
      </h2>

      <section aria-labelledby="reactions-heading" className="mt-6">
        <h3 id="reactions-heading" className="text-lg font-semibold">
          Reactions
        </h3>
        <div className="mt-3 flex flex-wrap gap-3">
          {reactionOptions.map(({ type, emoji, label }) => (
            <Button
              key={type}
              type="button"
              variant="outline"
              className="min-h-11"
              aria-label={`${label}, ${reactions[type]} reactions`}
              onClick={() => void addReaction(type)}
            >
              <span aria-hidden="true">{emoji}</span>
              {reactions[type]}
            </Button>
          ))}
        </div>
      </section>

      <form
        className="mt-8 space-y-4"
        aria-labelledby="comment-form-heading"
        onSubmit={submitComment}
      >
        <h3 id="comment-form-heading" className="text-lg font-semibold">
          Leave a comment
        </h3>
        <div className="space-y-2">
          <Label htmlFor="comment-display-name">Display name</Label>
          <Input
            id="comment-display-name"
            name="displayName"
            maxLength={80}
            required
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="comment-content">Comment</Label>
          <Textarea
            id="comment-content"
            name="content"
            maxLength={2000}
            required
            rows={5}
            value={content}
            onChange={(event) => setContent(event.target.value)}
          />
        </div>
        <Button
          type="submit"
          className="min-h-11"
          disabled={isLoading || isSubmitting}
        >
          {isSubmitting ? "Posting…" : isLoading ? "Loading…" : "Post comment"}
        </Button>
      </form>

      {feedback && (
        <p
          ref={feedbackRef}
          role={feedback.error ? "alert" : "status"}
          tabIndex={-1}
          className={`mt-4 text-sm ${
            feedback.error ? "text-destructive" : "text-muted-foreground"
          }`}
        >
          {feedback.message}
        </p>
      )}

      <section aria-labelledby="comments-heading" className="mt-8">
        <h3 id="comments-heading" className="text-lg font-semibold">
          Comments ({comments.length})
        </h3>
        {comments.length === 0 ? (
          <p className="mt-3 text-muted-foreground">Be the first to comment.</p>
        ) : (
          <ol className="mt-4 space-y-4">
            {comments.map((comment) => (
              <li key={comment.id} className="rounded-lg border p-4">
                <article>
                  <header className="flex flex-wrap items-baseline justify-between gap-2">
                    <h4 className="font-semibold">{comment.displayName}</h4>
                    <time
                      dateTime={comment.createdAt}
                      className="text-sm text-muted-foreground"
                    >
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </time>
                  </header>
                  <p className="mt-2 whitespace-pre-wrap">{comment.content}</p>
                </article>
              </li>
            ))}
          </ol>
        )}
      </section>
    </section>
  );
}
