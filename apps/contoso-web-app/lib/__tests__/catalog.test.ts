import {
  getAllProducts,
  getStaticProductSlugs,
  getProductBySlug,
  getRelatedProducts,
  findVariant,
  isOptionCombinationAvailable,
  AddToCartPayloadSchema,
} from "../catalog";

describe("lib/catalog", () => {
  it("getAllProducts returns all catalog products conforming to schema", () => {
    const products = getAllProducts();
    expect(products.length).toBeGreaterThan(0);
    for (const p of products) {
      expect(p.id).toBeDefined();
      expect(p.slug).toBeDefined();
      expect(p.title).toBeDefined();
      expect(p.images.length).toBeGreaterThan(0);
    }
  });

  it("getStaticProductSlugs returns list of valid product slugs", () => {
    const slugs = getStaticProductSlugs();
    expect(slugs).toContain("contoso-classic-tee");
    expect(slugs).toContain("contoso-tech-hoodie");
  });

  it("getProductBySlug retrieves product for valid slug and returns null for invalid", () => {
    const tee = getProductBySlug("contoso-classic-tee");
    expect(tee).not.toBeNull();
    expect(tee?.title).toBe("Contoso Classic Logo Tee");

    expect(getProductBySlug("non-existent-slug")).toBeNull();
    expect(getProductBySlug("")).toBeNull();
    expect(getProductBySlug(null as unknown as string)).toBeNull();
  });

  it("getRelatedProducts excludes current product and respects limits", () => {
    const tee = getProductBySlug("contoso-classic-tee")!;
    const related = getRelatedProducts(tee, 2);

    expect(related).toHaveLength(2);
    expect(related.some((p) => p.slug === tee.slug)).toBe(false);
  });

  it("findVariant evaluates complete vs incomplete option selections", () => {
    const tee = getProductBySlug("contoso-classic-tee")!;

    // Incomplete selection
    expect(findVariant(tee, { size: "M" })).toBeNull();

    // Complete selection - in stock
    const validVariant = findVariant(tee, { size: "M", color: "Navy" });
    expect(validVariant).not.toBeNull();
    expect(validVariant?.id).toBe("var-tee-m-navy");
    expect(validVariant?.inStock).toBe(true);

    // Complete selection - out of stock variant
    const outOfStockVariant = findVariant(tee, { size: "XL", color: "Navy" });
    expect(outOfStockVariant).not.toBeNull();
    expect(outOfStockVariant?.inStock).toBe(false);
  });

  it("isOptionCombinationAvailable identifies in-stock vs out-of-stock combinations", () => {
    const tee = getProductBySlug("contoso-classic-tee")!;

    // Size M, Navy -> available
    expect(isOptionCombinationAvailable(tee, "color", "Navy", { size: "M" })).toBe(true);

    // Size XL, Navy -> XL Navy is out of stock in variants
    expect(isOptionCombinationAvailable(tee, "color", "Navy", { size: "XL" })).toBe(false);
  });

  it("AddToCartPayloadSchema validates cart payload", () => {
    const validPayload = {
      productId: "prod-tee",
      productSlug: "contoso-classic-tee",
      productTitle: "Contoso Classic Logo Tee",
      variantId: "var-tee-m-navy",
      options: { size: "M", color: "Navy" },
      price: 29.99,
      quantity: 1,
    };

    const parseResult = AddToCartPayloadSchema.safeParse(validPayload);
    expect(parseResult.success).toBe(true);
  });
});
