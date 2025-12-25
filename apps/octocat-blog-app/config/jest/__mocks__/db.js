// Mock data for testing
export const mockAuthor = {
  id: 1,
  name: "Octocat",
  slug: "octocat",
  email: "octocat@github.com",
  bio: "The face of GitHub",
  avatarUrl:
    "https://github.githubassets.com/images/modules/logos_page/Octocat.png",
  githubUrl: "https://github.com/octocat",
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
};

export const mockCategory = {
  id: 1,
  name: "Releases",
  slug: "releases",
  description: "New GitHub releases and version updates",
  color: "#238636",
  createdAt: new Date("2025-01-01"),
};

export const mockCategories = [
  mockCategory,
  {
    id: 2,
    name: "Engineering",
    slug: "engineering",
    description: "Engineering blog posts",
    color: "#8957e5",
    createdAt: new Date("2025-01-01"),
  },
  {
    id: 3,
    name: "Open Source",
    slug: "open-source",
    description: "Open source news and updates",
    color: "#f6c246",
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
    name: "Security",
    slug: "security",
    createdAt: new Date("2025-01-01"),
  },
];

export const mockPosts = [
  {
    id: 1,
    title: "Test Post 1",
    slug: "test-post-1",
    excerpt: "This is a test post excerpt",
    content: "This is the full content of the test post.",
    coverImage: "https://example.com/image.jpg",
    published: true,
    featured: false,
    authorId: 1,
    categoryId: 1,
    publishedAt: new Date("2025-01-15"),
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    author: mockAuthor,
    category: mockCategory,
    postTags: [
      {
        postId: 1,
        tagId: 1,
        tag: mockTags[0],
      },
    ],
  },
];

export const mockUnpublishedPost = {
  id: 2,
  title: "Draft Post",
  slug: "draft-post",
  excerpt: "This is a draft",
  content: "Draft content",
  coverImage: null,
  published: false,
  featured: false,
  authorId: 1,
  categoryId: 1,
  publishedAt: null,
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
  author: mockAuthor,
  category: mockCategory,
  postTags: [],
};

// Create a shared mock database instance that tests can use
// This instance is created once and shared across all tests
const sharedMockDb = {
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  leftJoin: jest.fn().mockReturnThis(),
  innerJoin: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  offset: jest.fn().mockReturnThis(),
  execute: jest.fn().mockResolvedValue([]),
  query: {
    posts: {
      findMany: jest.fn().mockResolvedValue(mockPosts),
      findFirst: jest.fn().mockResolvedValue(null),
    },
    authors: {
      findMany: jest.fn().mockResolvedValue([mockAuthor]),
      findFirst: jest.fn().mockResolvedValue(null),
    },
    categories: {
      findMany: jest.fn().mockResolvedValue(mockCategories),
      findFirst: jest.fn().mockResolvedValue(null),
    },
    tags: {
      findMany: jest.fn().mockResolvedValue(mockTags),
      findFirst: jest.fn().mockResolvedValue(null),
    },
  },
};

// Export the shared mock for tests to configure
export const mockDb = sharedMockDb;

// Factory function that returns the SAME shared instance
// This ensures both the jest.mock and the test file use the same mock
export function createMockDb() {
  return sharedMockDb;
}
