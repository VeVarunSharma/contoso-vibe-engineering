import "dotenv/config";

import { db } from "./index";
import { authors, categories, tags, posts, postTags } from "./schema";

async function seed() {
  console.log("🌱 Seeding database...");

  // Clear existing data (in correct order to respect foreign key constraints)
  console.log("🧹 Clearing existing data...");
  await db.delete(postTags);
  await db.delete(posts);
  await db.delete(tags);
  await db.delete(categories);
  await db.delete(authors);
  console.log("✅ Existing data cleared");

  // Create authors
  const [octocat, vevarun, andrea] = await db
    .insert(authors)
    .values([
      {
        name: "Octocat",
        username: "octocat",
        avatarUrl: "https://avatars.githubusercontent.com/u/583231?v=4",
        bio: "The official GitHub mascot sharing the latest updates from GitHub.",
        githubUrl: "https://github.com/octocat",
      },
      {
        name: "Ve Varun Sharma",
        username: "VeVarunSharma",
        avatarUrl: "https://avatars.githubusercontent.com/u/62218708?v=4",
        bio: "Developer and open source enthusiast.",
        githubUrl: "https://github.com/VeVarunSharma",
      },
      {
        name: "Andrea Griffiths",
        username: "AndreaGriffiths11",
        avatarUrl:
          "https://avatars.githubusercontent.com/u/AndreaGriffiths11?v=4",
        bio: "Developer advocate passionate about AI-powered developer tools.",
        githubUrl: "https://github.com/AndreaGriffiths11",
      },
    ])
    .returning();

  console.log(
    "✅ Created authors:",
    octocat?.name,
    ",",
    vevarun?.name,
    ", and",
    andrea?.name
  );

  // Create categories
  const [releasesCategory, _featuresCategory, changelogCategory] = await db
    .insert(categories)
    .values([
      {
        name: "Releases",
        slug: "releases",
        description: "New GitHub releases and version updates",
        color: "#238636",
      },
      {
        name: "Features",
        slug: "features",
        description: "New features and product announcements",
        color: "#1f6feb",
      },
      {
        name: "Changelog",
        slug: "changelog",
        description: "Platform updates and changes",
        color: "#8957e5",
      },
      {
        name: "Engineering",
        slug: "engineering",
        description: "Behind the scenes of GitHub engineering",
        color: "#f78166",
      },
      {
        name: "Security",
        slug: "security",
        description: "Security updates and best practices",
        color: "#da3633",
      },
    ])
    .returning();

  console.log("✅ Created categories");

  // Create tags
  const createdTags = await db
    .insert(tags)
    .values([
      { name: "GitHub Actions", slug: "github-actions" },
      { name: "Copilot", slug: "copilot" },
      { name: "AI", slug: "ai" },
      { name: "Open Source", slug: "open-source" },
      { name: "DevOps", slug: "devops" },
      { name: "Security", slug: "security" },
      { name: "Productivity", slug: "productivity" },
      { name: "API", slug: "api" },
    ])
    .returning();

  console.log("✅ Created tags");

  // Create the first featured blog post
  const [firstPost] = await db
    .insert(posts)
    .values({
      title:
        "Introducing GitHub Copilot Extensions: Your AI Pair Programmer Just Got Smarter",
      slug: "introducing-github-copilot-extensions",
      excerpt:
        "Today, we're thrilled to announce GitHub Copilot Extensions — a new way to extend Copilot with third-party tools, APIs, and custom knowledge bases directly in your IDE.",
      content: `# Introducing GitHub Copilot Extensions

Today marks an exciting milestone in our journey to make every developer more productive. We're thrilled to announce **GitHub Copilot Extensions** — a groundbreaking way to extend Copilot with third-party tools, APIs, and custom knowledge bases directly in your IDE.

## What are Copilot Extensions?

Copilot Extensions allow you to bring your favorite developer tools directly into the Copilot chat experience. Whether you need to query a database, check your deployment status, or search your company's documentation, Extensions make it possible without ever leaving your coding flow.

### Key Features

- **Seamless Integration**: Extensions work directly in Copilot Chat, appearing as natural conversation partners alongside Copilot.
- **Third-Party Tools**: Connect popular services like Sentry, Datadog, Docker, and more.
- **Custom Knowledge Bases**: Build your own extensions to query internal documentation, APIs, or databases.
- **Context-Aware**: Extensions have access to the same context as Copilot, making responses more relevant.

## Getting Started

To start using Copilot Extensions, you'll need:

1. A GitHub Copilot subscription (Individual, Business, or Enterprise)
2. VS Code or JetBrains IDE with the latest Copilot extension
3. Access to the Extensions marketplace (now in public beta)

\`\`\`typescript
// Example: Querying a database with a custom extension
// @my-extension query users where active = true

// Copilot responds with the results directly in chat
// and can help you write code based on the data structure
\`\`\`

## What's Next?

This is just the beginning. We're working with partners across the developer ecosystem to bring even more integrations to Copilot Extensions. Stay tuned for:

- **More built-in extensions** from popular developer tools
- **Extension SDK** for building custom integrations
- **Enterprise features** for managing extensions across organizations

## Try It Today

Copilot Extensions are now available in public beta for all Copilot users. Head to the Extensions marketplace in VS Code or visit [github.com/copilot/extensions](https://github.com/features/copilot/extensions) to get started.

We can't wait to see what you build with Copilot Extensions!

---

*Happy coding!*  
*The GitHub Team* 🐙`,
      coverImage:
        "https://github.blog/wp-content/themes/github-2021-child/assets/img/featured-v3-new-releases.svg",
      authorId: octocat!.id,
      categoryId: releasesCategory!.id,
      published: true,
      featured: true,
      publishedAt: new Date(),
    })
    .returning();

  console.log("✅ Created first blog post:", firstPost?.title);

  // Create the second blog post about Copilot usage tracking
  const [secondPost] = await db
    .insert(posts)
    .values({
      title: "Track organization Copilot usage",
      slug: "track-organization-copilot-usage",
      excerpt:
        "You can now access your organization's Copilot usage metrics via the Copilot usage APIs.",
      content: `# Track organization Copilot usage

You can now access your organization's Copilot usage metrics via the Copilot usage APIs.

The APIs contain reports with aggregated and user-specific metrics, including usage statistics for various Copilot features, user engagement data, and feature adoption metrics.

## Enabling Copilot Usage Metrics

To see these metrics, the Copilot usage metrics policy must be enabled.

### For Enterprise Accounts

To enable this setting for an enterprise account:
1. Go to the Enterprises page
2. Select your enterprise
3. Click on the **AI Controls** tab
4. In the left sidebar, select **Copilot**
5. Scroll down to **Metrics**
6. Select **Enabled everywhere**

### For Standalone Organization Accounts

To enable this setting for a standalone organization account:
1. Go to the Organization page
2. Select your organization
3. Click on the **Settings** tab
4. In the left sidebar, select **Copilot > Policies**
5. Scroll down to **Features > Copilot usage metrics**
6. Select **Enabled**

## Access Permissions

Organization owners and users with an organization custom role that has the **View Organization Copilot Metrics** permission can access the API.

To learn more, see our [documentation](https://docs.github.com/en/copilot).

---

*Happy coding!*  
*The GitHub Team* 🐙`,
      coverImage:
        "https://github.blog/wp-content/themes/github-2021-child/assets/img/featured-v3-new-releases.svg",
      authorId: octocat!.id,
      categoryId: releasesCategory!.id,
      published: true,
      featured: false,
      publishedAt: new Date("2025-12-16"),
    })
    .returning();

  console.log("✅ Created second blog post:", secondPost?.title);

  // Create the third blog post about Agent Skills
  const [thirdPost] = await db
    .insert(posts)
    .values({
      title: "GitHub Copilot now supports Agent Skills",
      slug: "github-copilot-agent-skills",
      excerpt:
        "You can now create Agent Skills to teach Copilot how to perform specialized tasks in a specific, repeatable way.",
      content: `# GitHub Copilot now supports Agent Skills

You can now create Agent Skills to teach Copilot how to perform specialized tasks in a specific, repeatable way.

Agent Skills are folders containing instructions, scripts, and resources that Copilot automatically loads when relevant to your prompt.

## Where Agent Skills Work

They work across:
- Copilot coding agent
- Copilot CLI
- Agent mode in Visual Studio Code Insiders

Skills support is coming to the stable version of VS Code in early January.

## How It Works

When Copilot determines a skill is relevant to your task, it loads the instructions and follows them—including any resources you've included in the skill directory.

## Getting Started with Skills

You can write your own skills, or use skills shared by others, such as those in:
- The [anthropics/skills repository](https://github.com/anthropics/skills)
- GitHub's community created [github/awesome-copilot collection](https://github.com/github/awesome-copilot)

## Claude Code Compatibility

If you've already set up skills for Claude Code in the \`.claude/skills\` directory in your repository, Copilot will pick them up automatically.

## Learn More

📚 [Learn more about Agent Skills](https://docs.github.com/en/copilot)

Join the discussion within [GitHub Community](https://github.community).

---

*Happy coding!*  
*The GitHub Team* 🐙`,
      coverImage:
        "https://github.blog/wp-content/themes/github-2021-child/assets/img/featured-v3-new-releases.svg",
      authorId: octocat!.id,
      categoryId: changelogCategory!.id,
      published: true,
      featured: false,
      publishedAt: new Date("2025-12-18"),
    })
    .returning();

  console.log("✅ Created third blog post:", thirdPost?.title);

  // Create the fourth blog post about GitHub Copilot Spaces
  const [fourthPost] = await db
    .insert(posts)
    .values({
      title: "How to use GitHub Copilot Spaces to debug issues faster",
      slug: "how-to-use-github-copilot-spaces-to-debug-issues-faster",
      excerpt:
        "Follow this step-by-step guide to learn how to debug your issues using GitHub Copilot Spaces and Copilot coding agent.",
      content: `# How to use GitHub Copilot Spaces to debug issues faster

Every developer knows this pain: you open an issue, and before you can write a single line of code, you're hunting. You're digging through old pull requests, searching for that design doc from three months ago, trying to remember which file has the security guidelines.

That hunting phase? It takes forever. And it's not even the actual work. And even if you want to bring AI into the picture, GitHub Copilot still needs the same thing you do: context. Without it, you get generic answers that don't understand your codebase.

**GitHub Copilot Spaces fixes that.**

Spaces gives GitHub Copilot the project knowledge it needs—files, pull requests, issues, repos—so its responses are grounded in your actual code, not guesses.

## What is a space, again?

Think of a space as a project knowledge bundle. You curate the files, docs, and decisions that matter for your project, and Copilot uses all of that when generating plans, explanations, or pull requests.

You can:

- Add entire repositories or specific files, pull requests and issues (just paste the URL)
- Include text content like notes, video transcripts, or Slack messages
- Add design docs and architecture decisions
- Trigger Copilot coding agent directly from the space
- Use the space in your IDE through the GitHub MCP server

The best part? Link it once and forget about it. Spaces automatically stay synced with the linked content. When your codebase updates, your space updates too.

## How to debug issues with spaces

### 1. Start with an issue

A contributor opened an issue reporting an unsafe usage of check_call in your project.

As a maintainer, you might not know the best way to fix it immediately. On your own, you'd start by searching the repo, checking past pull requests, and combing through security guidelines just to figure out where to begin.

With Spaces, you don't have to do that manually. Create a space, add the issue and the key files or docs, and let Copilot reason across everything at once.

### 2. Create a space for your project

Inside the space, add:

- Design patterns (e.g., \`/docs/security/check-patterns.md\`, \`/docs/design/architecture-overview.md\`)
- Security guidelines
- Accessibility recommendations
- The entire repository (for broad coverage) or a curated set of the most relevant files for your specific use case. Spaces work best when you're intentional about what you include.
- The URL to the issue itself

### 3. Add Instructions for Copilot

Each space includes an Instructions panel. This is where you tell Copilot how you want it to work inside your project.

Here are some example instructions that will help with our task at hand:

\`\`\`
You are an experienced engineer working on this codebase.
Always ground your answers in the linked docs and sources in this space.
Before writing code, produce a 3–5 step plan that includes:
  - The goal
  - The approach
  - The execution steps
Cite the exact files that justify your recommendations.
After I approve a plan, use the Copilot coding agent to propose a PR.
\`\`\`

These instructions keep Copilot consistent. It won't hallucinate patterns that don't exist in your repo because you've told it to cite its sources.

### 4. Ask Copilot to debug the issue

With everything set up, ask Copilot: "Help me debug this issue."

Copilot already knows which issue you mean because it's linked to the space. It parses through all the sources, then returns a clear plan:

**Goal:** Fix unsafe usage of runBinaryCheck to ensure input paths are validated.

**Approach:**

1. Search the repo for usages of runBinaryCheck
2. Compare each usage to the safe pattern in the security docs
3. Identify the required refactor
4. Prepare a diff for each file with unsafe usage

This isn't a generic LLM answer. It's grounded in the actual project context.

### 5. Generate the pull request

Once you approve the plan, tell Copilot: "Propose code changes using Copilot coding agent."

The agent generates a pull request with:

- The before version and the after version
- An explanation of what changed
- References to the exact files that informed the fix
- The instructions that guided its choices

Every file in the pull request shows which source informed the suggestion. You can audit the reasoning before you merge.

### 6. Iterate if you need to

Not happy with something? Mention @copilot in the pull request comments to iterate on the existing pull request, or go back to the space to generate a fresh one. Keep working with Copilot until you get exactly what you need.

### 7. Share your space with your team

Spaces are private by default. But you can share them with specific individuals, your entire team, or your whole organization (if admins allow it).

Enterprise admins control who can share what, so you stay aligned with your company's security policies.

## Use GitHub Copilot Spaces from your IDE

Spaces are now available in your IDE via the GitHub MCP Server.

Install the MCP server, and you can call your spaces directly from your editor. Same curated context, same grounded answers, but right where you're already working.

Being able to call a space from the IDE has been a game changer for me. It lets me stay focused without switching between the browser and my editor, which cuts out a ton of friction in debugging.

## Coming soon

Here's what's on the roadmap:

- Public API
- Image support
- Additional file types like doc/docx and PDFs

## Three ways teams are using spaces right now

1. **Code generation and debugging.** Use spaces with Copilot coding agent to generate pull requests aligned with your patterns, security rules, and architecture.

2. **Planning features.** Link issues, design docs, and repos to plan features and draft requirements. Ask Copilot for a technical plan and it generates a pull request.

3. **Knowledge sharing and onboarding.** Spaces become living knowledge bases. New engineers onboard faster. Existing engineers stop answering the same questions repeatedly.

## Try it on your next issue

Here's my challenge to you:

1. Create a GitHub Copilot Space.
2. Add one issue and three to four key files.
3. Add simple instructions.
4. Ask Copilot to analyze the issue and propose a debugging plan.
5. Approve the plan.
6. Trigger the coding agent to generate a pull request.

You'll see exactly how much time you save when Copilot actually knows your project. Your AI assistant should never lack the right context. That's what spaces are for.

---

*Happy coding!*  
*Andrea Griffiths* 🐙`,
      coverImage:
        "https://github.blog/wp-content/themes/github-2021-child/assets/img/featured-v3-new-releases.svg",
      authorId: andrea!.id,
      categoryId: releasesCategory!.id,
      published: true,
      featured: true,
      publishedAt: new Date("2025-12-04"),
    })
    .returning();

  console.log("✅ Created fourth blog post:", fourthPost?.title);

  // Add tags to the posts
  const copilotTag = createdTags.find((t) => t.slug === "copilot");
  const aiTag = createdTags.find((t) => t.slug === "ai");
  const productivityTag = createdTags.find((t) => t.slug === "productivity");
  const apiTag = createdTags.find((t) => t.slug === "api");

  if (copilotTag && aiTag && productivityTag && firstPost) {
    await db.insert(postTags).values([
      { postId: firstPost.id, tagId: copilotTag.id },
      { postId: firstPost.id, tagId: aiTag.id },
      { postId: firstPost.id, tagId: productivityTag.id },
    ]);
    console.log("✅ Added tags to first post");
  }

  // Add tags to the second post
  if (copilotTag && apiTag && secondPost) {
    await db.insert(postTags).values([
      { postId: secondPost.id, tagId: copilotTag.id },
      { postId: secondPost.id, tagId: apiTag.id },
    ]);
    console.log("✅ Added tags to second post");
  }

  // Add tags to the third post
  if (copilotTag && aiTag && thirdPost) {
    await db.insert(postTags).values([
      { postId: thirdPost.id, tagId: copilotTag.id },
      { postId: thirdPost.id, tagId: aiTag.id },
    ]);
    console.log("✅ Added tags to third post");
  }

  // Add tags to the fourth post (Copilot Spaces)
  if (copilotTag && aiTag && productivityTag && fourthPost) {
    await db.insert(postTags).values([
      { postId: fourthPost.id, tagId: copilotTag.id },
      { postId: fourthPost.id, tagId: aiTag.id },
      { postId: fourthPost.id, tagId: productivityTag.id },
    ]);
    console.log("✅ Added tags to fourth post");
  }

  console.log("🎉 Seeding complete!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("❌ Seeding failed:", error);
  process.exit(1);
});
