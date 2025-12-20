import "dotenv/config";

import { db } from "./index";
import { authors, categories, tags, posts, postTags } from "./schema";

async function seed() {
  console.log("🌱 Seeding database...");

  // Create authors
  const [octocat, vevarun] = await db
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
    ])
    .returning();

  console.log("✅ Created authors:", octocat?.name, "and", vevarun?.name);

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

  console.log("🎉 Seeding complete!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("❌ Seeding failed:", error);
  process.exit(1);
});
