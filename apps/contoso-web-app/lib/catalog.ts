import { z } from "zod";

export const ProductOptionValueSchema = z.object({
  label: z.string(),
  value: z.string(),
});

export const ProductOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  values: z.array(ProductOptionValueSchema),
});

export const ProductVariantSchema = z.object({
  id: z.string(),
  sku: z.string(),
  options: z.record(z.string(), z.string()),
  inStock: z.boolean(),
  price: z.number().optional(),
});

export const ProductImageSchema = z.object({
  id: z.string(),
  src: z.string(),
  alt: z.string(),
  width: z.number().default(800),
  height: z.number().default(800),
});

export const ProductSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  badge: z.string().optional(),
  description: z.string(),
  price: z.number(),
  currency: z.string().default("USD"),
  formattedPrice: z.string(),
  inStock: z.boolean(),
  availabilityText: z.string(),
  images: z.array(ProductImageSchema).min(1),
  details: z.array(z.object({ label: z.string(), value: z.string() })),
  options: z.array(ProductOptionSchema),
  variants: z.array(ProductVariantSchema),
  category: z.string(),
  relatedSlugs: z.array(z.string()).default([]),
});

export type ProductOptionValue = z.infer<typeof ProductOptionValueSchema>;
export type ProductOption = z.infer<typeof ProductOptionSchema>;
export type ProductVariant = z.infer<typeof ProductVariantSchema>;
export type ProductImage = z.infer<typeof ProductImageSchema>;
export type Product = z.infer<typeof ProductSchema>;

export const AddToCartPayloadSchema = z.object({
  productId: z.string(),
  productSlug: z.string(),
  productTitle: z.string(),
  variantId: z.string(),
  options: z.record(z.string(), z.string()),
  price: z.number(),
  quantity: z.number().min(1),
});

export type AddToCartPayload = z.infer<typeof AddToCartPayloadSchema>;

const CATALOG_PRODUCTS: Product[] = [
  {
    id: "prod-tee",
    slug: "contoso-classic-tee",
    title: "Contoso Classic Logo Tee",
    badge: "Bestseller",
    description:
      "Super-soft organic cotton t-shirt featuring the minimalist Contoso engineering logo. Designed for everyday comfort with durable stitching and breathability.",
    price: 29.99,
    currency: "USD",
    formattedPrice: "$29.99",
    inStock: true,
    availabilityText: "In Stock",
    images: [
      {
        id: "img-tee-1",
        src: "/images/products/tee-navy-front.jpg",
        alt: "Contoso Classic Logo Tee in Navy Blue - Front view",
        width: 800,
        height: 800,
      },
      {
        id: "img-tee-2",
        src: "/images/products/tee-navy-back.jpg",
        alt: "Contoso Classic Logo Tee - Back view",
        width: 800,
        height: 800,
      },
      {
        id: "img-tee-3",
        src: "/images/products/tee-detail.jpg",
        alt: "Contoso embroidered logo detail",
        width: 800,
        height: 800,
      },
    ],
    details: [
      { label: "Material", value: "100% Ring-Spun Organic Cotton" },
      { label: "Fit", value: "Unisex Regular Fit" },
      { label: "Origin", value: "Ethically Crafted" },
      { label: "Care Instructions", value: "Machine Wash Cold, Tumble Dry Low" },
    ],
    options: [
      {
        id: "size",
        name: "Size",
        values: [
          { label: "Small (S)", value: "S" },
          { label: "Medium (M)", value: "M" },
          { label: "Large (L)", value: "L" },
          { label: "Extra Large (XL)", value: "XL" },
        ],
      },
      {
        id: "color",
        name: "Color",
        values: [
          { label: "Navy", value: "Navy" },
          { label: "Heather Gray", value: "Heather Gray" },
          { label: "White", value: "White" },
        ],
      },
    ],
    variants: [
      { id: "var-tee-s-navy", sku: "TEE-S-NVY", options: { size: "S", color: "Navy" }, inStock: true },
      { id: "var-tee-m-navy", sku: "TEE-M-NVY", options: { size: "M", color: "Navy" }, inStock: true },
      { id: "var-tee-l-navy", sku: "TEE-L-NVY", options: { size: "L", color: "Navy" }, inStock: true },
      { id: "var-tee-xl-navy", sku: "TEE-XL-NVY", options: { size: "XL", color: "Navy" }, inStock: false },
      { id: "var-tee-s-gray", sku: "TEE-S-GRY", options: { size: "S", color: "Heather Gray" }, inStock: true },
      { id: "var-tee-m-gray", sku: "TEE-M-GRY", options: { size: "M", color: "Heather Gray" }, inStock: true },
      { id: "var-tee-l-gray", sku: "TEE-L-GRY", options: { size: "L", color: "Heather Gray" }, inStock: false },
      { id: "var-tee-xl-gray", sku: "TEE-XL-GRY", options: { size: "XL", color: "Heather Gray" }, inStock: false },
      { id: "var-tee-s-white", sku: "TEE-S-WHT", options: { size: "S", color: "White" }, inStock: true },
      { id: "var-tee-m-white", sku: "TEE-M-WHT", options: { size: "M", color: "White" }, inStock: true },
      { id: "var-tee-l-white", sku: "TEE-L-WHT", options: { size: "L", color: "White" }, inStock: true },
      { id: "var-tee-xl-white", sku: "TEE-XL-WHT", options: { size: "XL", color: "White" }, inStock: true },
    ],
    category: "apparel",
    relatedSlugs: ["contoso-tech-hoodie", "contoso-vibe-cap", "contoso-tumbler"],
  },
  {
    id: "prod-hoodie",
    slug: "contoso-tech-hoodie",
    title: "Contoso Engineering Tech Hoodie",
    badge: "New",
    description:
      "Premium heavyweight fleece hoodie with concealed device pockets, thumbhole cuffs, and a weather-resistant finish for high-output engineering days.",
    price: 79.99,
    currency: "USD",
    formattedPrice: "$79.99",
    inStock: true,
    availabilityText: "In Stock",
    images: [
      {
        id: "img-hoodie-1",
        src: "/images/products/hoodie-black-front.jpg",
        alt: "Contoso Engineering Tech Hoodie in Midnight Black - Front view",
        width: 800,
        height: 800,
      },
      {
        id: "img-hoodie-2",
        src: "/images/products/hoodie-black-hood.jpg",
        alt: "Contoso Engineering Tech Hoodie - Hood detail",
        width: 800,
        height: 800,
      },
    ],
    details: [
      { label: "Material", value: "80% Organic Cotton, 20% Recycled Polyester Fleece" },
      { label: "Features", value: "Dual Zip Tech Pockets, Thumbhole Cuffs, Double-Lined Hood" },
      { label: "Care Instructions", value: "Machine Wash Cold, Hang Dry" },
    ],
    options: [
      {
        id: "size",
        name: "Size",
        values: [
          { label: "Small (S)", value: "S" },
          { label: "Medium (M)", value: "M" },
          { label: "Large (L)", value: "L" },
          { label: "Extra Large (XL)", value: "XL" },
        ],
      },
      {
        id: "color",
        name: "Color",
        values: [
          { label: "Midnight Black", value: "Midnight Black" },
          { label: "Charcoal", value: "Charcoal" },
        ],
      },
    ],
    variants: [
      { id: "var-hoodie-s-blk", sku: "HD-S-BLK", options: { size: "S", color: "Midnight Black" }, inStock: false },
      { id: "var-hoodie-m-blk", sku: "HD-M-BLK", options: { size: "M", color: "Midnight Black" }, inStock: true },
      { id: "var-hoodie-l-blk", sku: "HD-L-BLK", options: { size: "L", color: "Midnight Black" }, inStock: true },
      { id: "var-hoodie-xl-blk", sku: "HD-XL-BLK", options: { size: "XL", color: "Midnight Black" }, inStock: true },
      { id: "var-hoodie-s-chr", sku: "HD-S-CHR", options: { size: "S", color: "Charcoal" }, inStock: true },
      { id: "var-hoodie-m-chr", sku: "HD-M-CHR", options: { size: "M", color: "Charcoal" }, inStock: true },
      { id: "var-hoodie-l-chr", sku: "HD-L-CHR", options: { size: "L", color: "Charcoal" }, inStock: true },
      { id: "var-hoodie-xl-chr", sku: "HD-XL-CHR", options: { size: "XL", color: "Charcoal" }, inStock: true },
    ],
    category: "apparel",
    relatedSlugs: ["contoso-classic-tee", "contoso-tumbler"],
  },
  {
    id: "prod-cap",
    slug: "contoso-vibe-cap",
    title: "Contoso Vibe Embroidered Cap",
    badge: "Featured",
    description:
      "Structured 6-panel low-profile cap with 3D-embroidered logo, brass buckle closure, and breathable cotton twill construction.",
    price: 24.99,
    currency: "USD",
    formattedPrice: "$24.99",
    inStock: true,
    availabilityText: "In Stock",
    images: [
      {
        id: "img-cap-1",
        src: "/images/products/cap-navy.jpg",
        alt: "Contoso Vibe Embroidered Cap in Navy Blue",
        width: 800,
        height: 800,
      },
      {
        id: "img-cap-2",
        src: "/images/products/cap-black.jpg",
        alt: "Contoso Vibe Embroidered Cap in Black",
        width: 800,
        height: 800,
      },
    ],
    details: [
      { label: "Material", value: "100% Chino Cotton Twill" },
      { label: "Closure", value: "Tri-glide Antique Brass Buckle Strap" },
      { label: "Care Instructions", value: "Spot Clean Only" },
    ],
    options: [
      {
        id: "size",
        name: "Size",
        values: [{ label: "One Size", value: "One Size" }],
      },
      {
        id: "color",
        name: "Color",
        values: [
          { label: "Navy", value: "Navy" },
          { label: "Black", value: "Black" },
        ],
      },
    ],
    variants: [
      { id: "var-cap-os-nvy", sku: "CAP-OS-NVY", options: { size: "One Size", color: "Navy" }, inStock: true },
      { id: "var-cap-os-blk", sku: "CAP-OS-BLK", options: { size: "One Size", color: "Black" }, inStock: true },
    ],
    category: "accessories",
    relatedSlugs: ["contoso-classic-tee", "contoso-tech-hoodie"],
  },
  {
    id: "prod-tumbler",
    slug: "contoso-tumbler",
    title: "Contoso Insulated Stainless Tumbler",
    badge: "Limited Edition",
    description:
      "Double-wall vacuum insulated stainless steel tumbler. Keeps iced beverages cold for 24 hours or coffee hot for 12 hours with zero condensation.",
    price: 34.99,
    currency: "USD",
    formattedPrice: "$34.99",
    inStock: true,
    availabilityText: "Limited Quantity",
    images: [
      {
        id: "img-tumbler-1",
        src: "/images/products/tumbler-front.jpg",
        alt: "Contoso Insulated Stainless Tumbler 20oz Matte Black",
        width: 800,
        height: 800,
      },
      {
        id: "img-tumbler-2",
        src: "/images/products/tumbler-top.jpg",
        alt: "Contoso Insulated Tumbler - Leakproof lid view",
        width: 800,
        height: 800,
      },
    ],
    details: [
      { label: "Material", value: "18/8 Pro-Grade Stainless Steel, BPA-Free Lid" },
      { label: "Insulation", value: "TempShield Double-Wall Vacuum Insulation" },
      { label: "Care Instructions", value: "Top-Rack Dishwasher Safe" },
    ],
    options: [
      {
        id: "capacity",
        name: "Capacity",
        values: [
          { label: "20 oz", value: "20oz" },
          { label: "32 oz", value: "32oz" },
        ],
      },
      {
        id: "finish",
        name: "Finish",
        values: [
          { label: "Matte Black", value: "Matte Black" },
          { label: "Stainless Steel", value: "Stainless Steel" },
        ],
      },
    ],
    variants: [
      { id: "var-tumbler-20-blk", sku: "TMB-20-BLK", options: { capacity: "20oz", finish: "Matte Black" }, inStock: true },
      { id: "var-tumbler-32-blk", sku: "TMB-32-BLK", options: { capacity: "32oz", finish: "Matte Black" }, inStock: false },
      { id: "var-tumbler-20-ss", sku: "TMB-20-SS", options: { capacity: "20oz", finish: "Stainless Steel" }, inStock: true },
      { id: "var-tumbler-32-ss", sku: "TMB-32-SS", options: { capacity: "32oz", finish: "Stainless Steel" }, inStock: true },
    ],
    category: "lifestyle",
    relatedSlugs: ["contoso-vibe-cap", "contoso-tech-hoodie"],
  },
];

export function getAllProducts(): Product[] {
  return CATALOG_PRODUCTS.map((p) => ProductSchema.parse(p));
}

export function getStaticProductSlugs(): string[] {
  return getAllProducts().map((p) => p.slug);
}

export function getProductBySlug(slug: unknown): Product | null {
  if (typeof slug !== "string" || !slug.trim()) {
    return null;
  }
  const cleanSlug = slug.trim().toLowerCase();
  const found = CATALOG_PRODUCTS.find((p) => p.slug.toLowerCase() === cleanSlug);
  if (!found) {
    return null;
  }
  const result = ProductSchema.safeParse(found);
  return result.success ? result.data : null;
}

export function getRelatedProducts(currentProduct: Product, limit = 3): Product[] {
  const all = getAllProducts().filter((p) => p.slug !== currentProduct.slug);
  const byRelatedSlugs: Product[] = [];

  if (currentProduct.relatedSlugs && currentProduct.relatedSlugs.length > 0) {
    for (const relSlug of currentProduct.relatedSlugs) {
      const match = all.find((p) => p.slug === relSlug);
      if (match && !byRelatedSlugs.some((p) => p.slug === match.slug)) {
        byRelatedSlugs.push(match);
      }
    }
  }

  if (byRelatedSlugs.length < limit) {
    const sameCategory = all.filter(
      (p) =>
        p.category === currentProduct.category &&
        !byRelatedSlugs.some((rel) => rel.slug === p.slug)
    );
    byRelatedSlugs.push(...sameCategory);
  }

  if (byRelatedSlugs.length < limit) {
    const fallback = all.filter((p) => !byRelatedSlugs.some((rel) => rel.slug === p.slug));
    byRelatedSlugs.push(...fallback);
  }

  return byRelatedSlugs.slice(0, limit);
}

export function findVariant(
  product: Product,
  selectedOptions: Record<string, string>
): ProductVariant | null {
  const requiredOptionIds = product.options.map((o) => o.id);
  const hasAllOptions = requiredOptionIds.every(
    (optId) => typeof selectedOptions[optId] === "string" && selectedOptions[optId].length > 0
  );

  if (!hasAllOptions) {
    return null;
  }

  const match = product.variants.find((v) => {
    return requiredOptionIds.every((optId) => v.options[optId] === selectedOptions[optId]);
  });

  return match ? ProductVariantSchema.parse(match) : null;
}

export function isOptionCombinationAvailable(
  product: Product,
  optionId: string,
  optionValue: string,
  currentSelections: Record<string, string>
): boolean {
  const candidateSelections = {
    ...currentSelections,
    [optionId]: optionValue,
  };

  const matchingVariants = product.variants.filter((v) => {
    return Object.entries(candidateSelections).every(([optKey, optVal]) => {
      if (!optVal) return true;
      return v.options[optKey] === optVal;
    });
  });

  if (matchingVariants.length === 0) {
    return false;
  }

  return matchingVariants.some((v) => v.inStock);
}
