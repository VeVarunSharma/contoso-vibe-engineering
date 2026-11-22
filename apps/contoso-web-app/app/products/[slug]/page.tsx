import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@workspace/ui/components/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@workspace/ui/components/card";
import { ProductGallery } from "@/components/products/product-gallery";
import { ProductOptions } from "@/components/products/product-options";
import {
  getProductBySlug,
  getRelatedProducts,
  getStaticProductSlugs,
} from "@/lib/catalog";

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const slugs = getStaticProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    return {
      title: "Product Not Found | Contoso Store",
      description: "The requested product could not be found in our catalog.",
    };
  }

  const primaryImage = product.images[0];

  return {
    title: `${product.title} | Contoso Store`,
    description: product.description,
    openGraph: {
      title: `${product.title} | Contoso Store`,
      description: product.description,
      type: "website",
      images: product.images.map((img) => ({
        url: img.src,
        alt: img.alt,
        width: img.width,
        height: img.height,
      })),
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.title} | Contoso Store`,
      description: product.description,
      images: primaryImage ? [primaryImage.src] : [],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const relatedProducts = getRelatedProducts(product, 3);

  return (
    <main className="container mx-auto max-w-6xl px-4 py-8 sm:py-12">
      {/* Breadcrumbs Navigation */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex items-center gap-2 text-sm text-muted-foreground">
          <li>
            <Link
              href="/"
              className="hover:text-foreground transition-colors underline-offset-4 hover:underline"
            >
              Home
            </Link>
          </li>
          <li aria-hidden="true" className="select-none">
            /
          </li>
          <li>
            <span className="capitalize">{product.category}</span>
          </li>
          <li aria-hidden="true" className="select-none">
            /
          </li>
          <li className="font-medium text-foreground truncate max-w-[200px] sm:max-w-none">
            <span aria-current="page">{product.title}</span>
          </li>
        </ol>
      </nav>

      {/* Product Details Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
        {/* Gallery */}
        <ProductGallery images={product.images} title={product.title} />

        {/* Product Details & Purchase Form */}
        <div className="flex flex-col gap-6">
          <header className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {product.badge && (
                <Badge variant="secondary" className="font-semibold">
                  {product.badge}
                </Badge>
              )}
              <Badge
                variant={product.inStock ? "outline" : "destructive"}
                className="font-medium"
              >
                {product.availabilityText}
              </Badge>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              {product.title}
            </h1>

            <p className="text-2xl font-bold text-foreground">
              {product.formattedPrice}
            </p>
          </header>

          <p className="text-muted-foreground text-base leading-relaxed">
            {product.description}
          </p>

          {/* Client Boundary Options & Add To Cart */}
          <ProductOptions product={product} />

          {/* Product Specifications */}
          {product.details && product.details.length > 0 && (
            <section
              aria-labelledby="product-specifications-heading"
              className="border-t pt-6 mt-4"
            >
              <h2
                id="product-specifications-heading"
                className="text-lg font-semibold text-foreground mb-4"
              >
                Product Specifications
              </h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                {product.details.map((detail) => (
                  <div
                    key={detail.label}
                    className="border-b border-border/60 pb-2"
                  >
                    <dt className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                      {detail.label}
                    </dt>
                    <dd className="text-sm font-medium text-foreground mt-0.5">
                      {detail.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section
          aria-labelledby="related-products-heading"
          className="border-t border-border pt-12 mt-16"
        >
          <h2
            id="related-products-heading"
            className="text-2xl font-bold tracking-tight text-foreground mb-6"
          >
            Related Products
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {relatedProducts.map((rel) => (
              <Card
                key={rel.id}
                className="flex flex-col h-full overflow-hidden hover:shadow-md transition-all group"
              >
                <div className="relative aspect-square overflow-hidden bg-muted">
                  <Image
                    src={rel.images[0]?.src || "/images/products/placeholder.jpg"}
                    alt={rel.images[0]?.alt || rel.title}
                    width={400}
                    height={400}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {rel.badge && (
                    <div className="absolute top-3 left-3">
                      <Badge variant="secondary" className="shadow-xs">
                        {rel.badge}
                      </Badge>
                    </div>
                  )}
                </div>
                <CardHeader className="p-4 pb-2">
                  <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    <Link href={`/products/${rel.slug}`} className="focus-visible:outline-none focus-visible:underline">
                      {rel.title}
                    </Link>
                  </h3>
                </CardHeader>
                <CardContent className="p-4 pt-0 flex-1">
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                    {rel.description}
                  </p>
                  <p className="text-base font-bold text-foreground">
                    {rel.formattedPrice}
                  </p>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Link
                    href={`/products/${rel.slug}`}
                    className="inline-flex w-full items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors min-h-[44px]"
                  >
                    View Product
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
