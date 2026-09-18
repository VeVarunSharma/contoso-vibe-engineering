import { HeroSection } from "@/components/landing/hero-section";
import { ProductCatalog } from "@/components/landing/product-catalog";
import { DistributionSection } from "@/components/landing/distribution-section";

export default function Page() {
  return (
    <main className="flex min-h-svh flex-col">
      <HeroSection />
      <ProductCatalog />
      <DistributionSection />
    </main>
  );
}
