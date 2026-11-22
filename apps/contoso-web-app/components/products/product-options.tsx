"use client";

import * as React from "react";
import { Button } from "@workspace/ui/components/button";
import { Label } from "@workspace/ui/components/label";
import { cn } from "@workspace/ui/lib/utils";
import {
  findVariant,
  isOptionCombinationAvailable,
  AddToCartPayloadSchema,
  type AddToCartPayload,
  type Product,
  type ProductVariant,
} from "@/lib/catalog";

interface ProductOptionsProps {
  product: Product;
  onAddToCart?: (payload: AddToCartPayload) => void;
}

export function ProductOptions({ product, onAddToCart }: ProductOptionsProps) {
  const [selectedOptions, setSelectedOptions] = React.useState<
    Record<string, string>
  >({});
  const [quantity, setQuantity] = React.useState(1);
  const [statusMessage, setAddedStatusMessage] = React.useState<string | null>(
    null
  );

  const requiredOptions = product.options || [];
  const allOptionsSelected = requiredOptions.every((opt) => {
    const val = selectedOptions[opt.id];
    return typeof val === "string" && val.length > 0;
  });

  const selectedVariant: ProductVariant | null = allOptionsSelected
    ? findVariant(product, selectedOptions)
    : null;

  const isValidVariant = Boolean(selectedVariant && selectedVariant.inStock);
  const isAddToCartDisabled = !allOptionsSelected || !isValidVariant;

  const handleSelectOption = (optionId: string, value: string) => {
    setAddedStatusMessage(null);
    setSelectedOptions((prev) => ({
      ...prev,
      [optionId]: value,
    }));
  };

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => Math.min(10, Math.max(1, prev + delta)));
  };

  const handleAddToCart = () => {
    if (!allOptionsSelected || !selectedVariant || !selectedVariant.inStock) {
      return;
    }

    const payload: AddToCartPayload = {
      productId: product.id,
      productSlug: product.slug,
      productTitle: product.title,
      variantId: selectedVariant.id,
      options: selectedOptions,
      price: selectedVariant.price ?? product.price,
      quantity,
    };

    // Validate with Zod
    const validated = AddToCartPayloadSchema.parse(payload);

    if (onAddToCart) {
      onAddToCart(validated);
    }

    const optionText = Object.entries(selectedOptions)
      .map(([k, v]) => {
        const optionName =
          product.options.find((o) => o.id === k)?.name || k;
        return `${optionName}: ${v}`;
      })
      .join(", ");

    setAddedStatusMessage(
      `Added ${quantity} x ${product.title}${
        optionText ? ` (${optionText})` : ""
      } to cart.`
    );
  };

  // Determine current announcement message
  const getAnnouncementMessage = (): string => {
    if (statusMessage) {
      return statusMessage;
    }
    if (!allOptionsSelected) {
      const missingOptions = requiredOptions
        .filter((o) => !selectedOptions[o.id])
        .map((o) => o.name);
      return `Please select ${missingOptions.join(" and ")} to enable Add to Cart.`;
    }
    if (!selectedVariant) {
      return "The selected option combination is invalid or unavailable.";
    }
    if (!selectedVariant.inStock) {
      return "The selected combination is currently out of stock.";
    }
    return `Selected combination is in stock and ready to add to cart. SKU: ${selectedVariant.sku}`;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Option Pickers */}
      {requiredOptions.map((option) => {
        const currentValue = selectedOptions[option.id];
        return (
          <fieldset key={option.id} className="space-y-3">
            <legend className="text-sm font-semibold text-foreground">
              {option.name}:{" "}
              {currentValue ? (
                <span className="font-normal text-muted-foreground ml-1">
                  {option.values.find((v) => v.value === currentValue)?.label ||
                    currentValue}
                </span>
              ) : (
                <span className="text-xs font-normal text-amber-600 dark:text-amber-400 ml-1">
                  (Required)
                </span>
              )}
            </legend>
            <div
              className="flex flex-wrap gap-2.5"
              role="radiogroup"
              aria-label={`Select ${option.name}`}
            >
              {option.values.map((val) => {
                const isSelected = currentValue === val.value;
                const isAvailable = isOptionCombinationAvailable(
                  product,
                  option.id,
                  val.value,
                  selectedOptions
                );

                return (
                  <button
                    key={val.value}
                    type="button"
                    onClick={() => handleSelectOption(option.id, val.value)}
                    aria-pressed={isSelected}
                    aria-label={`${option.name} ${val.label}${
                      !isAvailable ? " (Unavailable)" : ""
                    }`}
                    className={cn(
                      "min-h-[44px] min-w-[44px] px-4 py-2 text-sm font-medium rounded-md border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary ring-2 ring-primary ring-offset-1 font-semibold"
                        : isAvailable
                        ? "bg-background text-foreground border-input hover:bg-accent hover:text-accent-foreground"
                        : "bg-muted text-muted-foreground border-dashed border-muted-foreground/30 opacity-60 line-through"
                    )}
                  >
                    {val.label}
                    {!isAvailable && (
                      <span className="sr-only"> (Unavailable)</span>
                    )}
                  </button>
                );
              })}
            </div>
          </fieldset>
        );
      })}

      {/* Quantity Picker */}
      <div className="space-y-2">
        <Label htmlFor="product-quantity-select" className="text-sm font-semibold">
          Quantity
        </Label>
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center border border-input rounded-md bg-background">
            <button
              type="button"
              onClick={() => handleQuantityChange(-1)}
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
              className="min-h-[44px] min-w-[44px] px-3 py-2 text-lg font-medium hover:bg-accent disabled:opacity-40 disabled:pointer-events-none rounded-l-md focus-visible:ring-2 focus-visible:ring-ring"
            >
              -
            </button>
            <span
              id="product-quantity-select"
              aria-live="polite"
              aria-label={`Current quantity ${quantity}`}
              className="px-4 text-sm font-semibold text-foreground min-w-[2rem] text-center"
            >
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => handleQuantityChange(1)}
              disabled={quantity >= 10}
              aria-label="Increase quantity"
              className="min-h-[44px] min-w-[44px] px-3 py-2 text-lg font-medium hover:bg-accent disabled:opacity-40 disabled:pointer-events-none rounded-r-md focus-visible:ring-2 focus-visible:ring-ring"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Add to Cart CTA */}
      <div className="pt-2">
        <Button
          type="button"
          onClick={handleAddToCart}
          disabled={isAddToCartDisabled}
          aria-disabled={isAddToCartDisabled}
          className="w-full sm:w-auto min-h-[44px] px-8 text-base font-semibold transition-all"
        >
          {!allOptionsSelected
            ? "Select Options to Add to Cart"
            : !selectedVariant
            ? "Combination Unavailable"
            : !selectedVariant.inStock
            ? "Out of Stock"
            : `Add to Cart - ${
                product.formattedPrice
              }`}
        </Button>
      </div>

      {/* Accessible Live Announcement Region */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={cn(
          "p-3 rounded-md text-sm font-medium transition-colors border",
          statusMessage
            ? "bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800"
            : !allOptionsSelected
            ? "bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800"
            : isValidVariant
            ? "bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800"
            : "bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800"
        )}
      >
        <p className="flex items-center gap-2">
          <span className="sr-only">Status: </span>
          {getAnnouncementMessage()}
        </p>
      </div>
    </div>
  );
}
