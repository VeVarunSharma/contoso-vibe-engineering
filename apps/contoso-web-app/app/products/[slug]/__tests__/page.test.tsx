import { render, screen } from "@testing-library/react";
import ProductPage, { generateMetadata, generateStaticParams } from "../page";
import { notFound } from "next/navigation";

jest.mock("next/navigation", () => ({
  notFound: jest.fn(),
}));

describe("ProductPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("generateStaticParams returns params for all catalog product slugs", async () => {
    const params = await generateStaticParams();
    expect(params.length).toBeGreaterThan(0);
    expect(params).toContainEqual({ slug: "contoso-classic-tee" });
    expect(params).toContainEqual({ slug: "contoso-tech-hoodie" });
  });

  it("generateMetadata returns product-specific OpenGraph metadata for valid slug", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: "contoso-classic-tee" }),
    });

    expect(metadata.title).toBe("Contoso Classic Logo Tee | Contoso Store");
    expect(metadata.description).toMatch(/super-soft organic cotton/i);
    expect(metadata.openGraph).toBeDefined();
  });

  it("generateMetadata returns fallback title for invalid slug", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: "invalid-product" }),
    });

    expect(metadata.title).toBe("Product Not Found | Contoso Store");
  });

  it("renders product details, specifications, and related products for valid product", async () => {
    const PageComponent = await ProductPage({
      params: Promise.resolve({ slug: "contoso-classic-tee" }),
    });

    render(PageComponent);

    // Title
    expect(
      screen.getByRole("heading", { level: 1, name: /contoso classic logo tee/i })
    ).toBeInTheDocument();

    // Price
    expect(screen.getByText("$29.99")).toBeInTheDocument();

    // Badge
    expect(screen.getByText("Bestseller")).toBeInTheDocument();

    // Specifications
    expect(
      screen.getByRole("heading", { level: 2, name: /product specifications/i })
    ).toBeInTheDocument();
    expect(screen.getByText("100% Ring-Spun Organic Cotton")).toBeInTheDocument();

    // Related Products Section
    const relatedHeading = screen.getByRole("heading", {
      level: 2,
      name: /related products/i,
    });
    expect(relatedHeading).toBeInTheDocument();

    // Related products should not include current product
    const relatedLinks = screen.getAllByRole("link", { name: /contoso/i });
    expect(
      relatedLinks.some((link) =>
        link.getAttribute("href")?.includes("contoso-classic-tee")
      )
    ).toBe(false);
  });

  it("calls notFound() for invalid or missing product slug", async () => {
    // Force notFound() to throw or just be called
    (notFound as unknown as jest.Mock).mockImplementation(() => {
      throw new Error("NEXT_NOT_FOUND");
    });

    await expect(
      ProductPage({
        params: Promise.resolve({ slug: "non-existent-slug" }),
      })
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(notFound).toHaveBeenCalledTimes(1);
  });
});
