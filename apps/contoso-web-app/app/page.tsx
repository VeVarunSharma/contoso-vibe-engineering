import { HeroSection } from "@/components/landing/hero-section";
import { MissionSection } from "@/components/landing/mission-section";
import { TeamSection } from "@/components/landing/team-section";

export default function Page() {
  return (
    <div className="flex flex-col min-h-svh">
      <HeroSection />
      <MissionSection />
      <TeamSection />
    </div>
  );
}
