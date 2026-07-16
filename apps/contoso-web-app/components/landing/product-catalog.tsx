"use client";

import { useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
} from "@workspace/ui";
import { Cannabis, MapPin, Search, Tag, Wine } from "lucide-react";

type Category = "All" | "Liquor" | "Cannabis";

interface Product {
  id: string;
  name: string;
  category: Exclude<Category, "All">;
  detail: string;
  price: string;
  sku: string;
  shelf: string;
}

const categories: Category[] = ["All", "Liquor", "Cannabis"];

const products: Product[] = [
  {
    id: "reserve-bourbon",
    name: "Contoso Reserve Bourbon",
    category: "Liquor",
    detail: "12 × 750 ml case · 45% ABV",
    price: "$312.00",
    sku: "LQ-BBN-104",
    shelf: "A-12",
  },
  {
    id: "coastal-vodka",
    name: "Coastal Botanical Vodka",
    category: "Liquor",
    detail: "12 × 750 ml case · 40% ABV",
    price: "$228.00",
    sku: "LQ-VDK-218",
    shelf: "A-18",
  },
  {
    id: "craft-ipa",
    name: "Northline Craft IPA",
    category: "Liquor",
    detail: "24 × 355 ml case · 6.2% ABV",
    price: "$62.00",
    sku: "LQ-BER-332",
    shelf: "B-04",
  },
  {
    id: "mary-jane-flower",
    name: "Premium Cannabis Flower — Mary Jane",
    category: "Cannabis",
    detail: "Indica · 12 × 3.5 g case",
    price: "$264.00",
    sku: "CB-FLW-420",
    shelf: "C-20",
  },
  {
    id: "citrus-pre-rolls",
    name: "Citrus Grove Pre-Rolls",
    category: "Cannabis",
    detail: "Sativa · 20 × 5-pack case",
    price: "$180.00",
    sku: "CB-PRL-126",
    shelf: "C-24",
  },
  {
    id: "berry-gummies",
    name: "Berry Balance Gummies",
    category: "Cannabis",
    detail: "10 mg THC · 24-unit case",
    price: "$144.00",
    sku: "CB-EDB-508",
    shelf: "D-08",
  },
];

export function ProductCatalog() {
  const [category, setCategory] = useState<Category>("All");
  const [query, setQuery] = useState("");
  const [taggedProduct, setTaggedProduct] = useState<string | null>(null);

  const visibleProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return products.filter(
      (product) =>
        (category === "All" || product.category === category) &&
        (normalizedQuery.length === 0 ||
          product.name.toLowerCase().includes(normalizedQuery) ||
          product.sku.toLowerCase().includes(normalizedQuery)),
    );
  }, [category, query]);

  function generateShelfTag(productId: string) {
    setTaggedProduct(productId);
  }

  return (
    <section id="catalog" className="w-full py-16 md:py-24">
      <div className="container px-4 md:px-6">
        <div className="mx-auto max-w-3xl space-y-3 text-center">
          <Badge variant="outline">Wholesale catalog</Badge>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Curated for modern retailers
          </h2>
          <p className="text-muted-foreground md:text-lg">
            Search products, confirm shelf locations, and generate clear shelf
            tags for every item.
          </p>
        </div>

        <div className="mx-auto mt-10 flex max-w-5xl flex-col gap-4 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Product categories"
          >
            {categories.map((item) => (
              <Button
                key={item}
                type="button"
                className="min-h-11"
                variant={category === item ? "default" : "outline"}
                aria-pressed={category === item}
                onClick={() => setCategory(item)}
              >
                {item === "Liquor" && <Wine aria-hidden="true" />}
                {item === "Cannabis" && <Cannabis aria-hidden="true" />}
                {item}
              </Button>
            ))}
          </div>
          <label className="relative block w-full sm:max-w-xs">
            <span className="sr-only">Search products</span>
            <Search
              className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              className="min-h-11 pl-9"
              placeholder="Search name or SKU"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        </div>

        {visibleProducts.length > 0 ? (
          <div className="mx-auto mt-8 grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-3">
            {visibleProducts.map((product) => {
              const tagIsReady = taggedProduct === product.id;

              return (
                <Card key={product.id} className="gap-4">
                  <CardHeader>
                    <div className="flex items-center justify-between gap-3">
                      <Badge
                        variant={
                          product.category === "Liquor"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {product.category}
                      </Badge>
                      <span className="text-xs font-medium text-muted-foreground">
                        {product.sku}
                      </span>
                    </div>
                    <CardTitle>
                      <h3 className="text-lg">{product.name}</h3>
                    </CardTitle>
                    <CardDescription>{product.detail}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-2xl font-bold">{product.price}</p>
                    <div className="flex items-center gap-2 rounded-lg bg-muted p-3 text-sm">
                      <MapPin
                        className="h-4 w-4 text-primary"
                        aria-hidden="true"
                      />
                      Shelf location
                      <strong className="ml-auto">{product.shelf}</strong>
                    </div>
                    {tagIsReady && (
                      <output
                        className="block rounded-lg border-2 border-dashed border-primary bg-primary/5 p-4 text-sm print:fixed print:inset-8 print:z-50 print:bg-background"
                        aria-live="polite"
                        aria-label={`${product.name} printable shelf tag`}
                      >
                        <span className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Shelf tag ready · {product.category}
                        </span>
                        <strong className="mt-2 block text-base">
                          {product.name}
                        </strong>
                        <span className="mt-2 grid grid-cols-2 gap-2">
                          <span>SKU: {product.sku}</span>
                          <span className="text-right">
                            Shelf: {product.shelf}
                          </span>
                          <span className="col-span-2 text-xl font-bold">
                            {product.price} wholesale case
                          </span>
                        </span>
                        <Button
                          type="button"
                          className="mt-3 min-h-11 w-full print:hidden"
                          size="sm"
                          onClick={() => window.print()}
                        >
                          Print shelf tag
                        </Button>
                      </output>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button
                      type="button"
                      className="min-h-11 w-full"
                      variant={tagIsReady ? "secondary" : "outline"}
                      aria-pressed={tagIsReady}
                      disabled={tagIsReady}
                      onClick={() => generateShelfTag(product.id)}
                    >
                      <Tag aria-hidden="true" />
                      {tagIsReady ? "Tag generated" : "Generate shelf tag"}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        ) : (
          <p
            className="mx-auto mt-8 max-w-5xl rounded-xl border border-dashed p-10 text-center text-muted-foreground"
            role="status"
          >
            No products match your search.
          </p>
        )}
      </div>
    </section>
  );
}
