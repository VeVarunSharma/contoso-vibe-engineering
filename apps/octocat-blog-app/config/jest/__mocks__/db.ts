// Mock database for API tests
export const mockPosts = [
  {
    id: 1,
    title: "Test Post 1",
    slug: "test-post-1",
    excerpt: "Test excerpt 1",
    content: "Test content 1",
    coverImage: "https://example.com/cover1.jpg",
    authorId: 1,
    categoryId: 1,
    published: true,
    featured: true,
    publishedAt: new Date("2025-12-20"),
    createdAt: new Date("2025-12-20"),
    updatedAt: new Date("2025-12-20"),
    author: {
      id: 1,
      name: "Octocat",
      username: "octocat",
      avatarUrl: "https://avatars.githubusercontent.com/u/583231?v=4",
      bio: "The official GitHub mascot",
      githubUrl: "https://github.com/octocat",
      createdAt: new Date("2025-01-01"),
    },
    category: {
      id: 1,
      name: "Releases",
      slug: "releases",
      description: "New GitHub releases",
      color: "#238636",
      createdAt: new Date("2025-01-01"),
    },
    postTags: [
      {
        postId: 1,
        tagId: 1,
        tag: {
          id: 1,
          name: "GitHub Actions",
          slug: "github-actions",
          createdAt: new Date("2025-01-01"),
        },
      },
    ],
  },
  {
    id: 2,
    title: "Test Post 2",
    slug: "test-post-2",
    excerpt: "Test excerpt 2",
    content: "Test content 2",
    coverImage: "https://example.com/cover2.jpg",
    authorId: 1,
    categoryId: 2,
    published: true,
    featured: false,
    publishedAt: new Date("2025-12-19"),
    createdAt: new Date("2025-12-19"),
    updatedAt: new Date("2025-12-19"),
    author: {
      id: 1,
      name: "Octocat",
      username: "octocat",
      avatarUrl: "https://avatars.githubusercontent.com/u/583231?v=4",
      bio: "The official GitHub mascot",
      githubUrl: "https://github.com/octocat",
      createdAt: new Date("2025-01-01"),
    },
    category: {
      id: 2,
      name: "Features",
      slug: "features",
      description: "New features and product announcements",
      color: "#1f6feb",
      createdAt: new Date("2025-01-01"),
    },
    postTags: [],
  },
];

export const mockUnpublishedPost = {
  id: 3,
  title: "Unpublished Post",
  slug: "unpublished-post",
  excerpt: "This post is not published",
  content: "Draft content",
  coverImage: null,
  authorId: 1,
  categoryId: 1,
  published: false,
  featured: false,
  publishedAt: null,
  createdAt: new Date("2025-12-18"),
  updatedAt: new Date("2025-12-18"),
  author: mockPosts[0]?.author ?? null,
  category: mockPosts[0]?.category ?? null,
  postTags: [],
};

export const mockCategories = [
  {
    id: 1,
    name: "Releases",
    slug: "releases",
    description: "New GitHub releases and version updates",
    color: "#238636",
    createdAt: new Date("2025-01-01"),
  },
  {
    id: 2,
    name: "Features",
    slug: "features",
    description: "New features and product announcements",
    color: "#1f6feb",
    createdAt: new Date("2025-01-01"),
  },
  {
    id: 3,
    name: "Changelog",
    slug: "changelog",
    description: "Platform updates and changes",
    color: "#8957e5",
    createdAt: new Date("2025-01-01"),
  },
];

export const mockTags = [
  {
    id: 1,
    name: "GitHub Actions",
    slug: "github-actions",
    createdAt: new Date("2025-01-01"),
  },
  {
    id: 2,
    name: "Copilot",
    slug: "copilot",
    createdAt: new Date("2025-01-01"),
  },
  {
    id: 3,
    name: "AI",
    slug: "ai",
    createdAt: new Date("2025-01-01"),
  },
];

// Mock database query functions
export const createMockDb = () => ({
  query: {
    posts: {
      findMany: jest.fn().mockResolvedValue(mockPosts),
      findFirst: jest.fn().mockImplementation(({ where }) => {
        // This is a simplified mock - in reality would parse the where clause
        return Promise.resolve(mockPosts[0]);
      }),
    },
    categories: {
      findMany: jest.fn().mockResolvedValue(mockCategories),
    },
    tags: {
      findMany: jest.fn().mockResolvedValue(mockTags),
    },
  },
});
