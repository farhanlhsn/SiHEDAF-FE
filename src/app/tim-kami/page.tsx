import type { Metadata } from "next";

import { FooterSection } from "@/components/sections/FooterSection";
import { HeaderSection } from "@/components/sections/HeaderSection";
import { TeamSection } from "@/components/sections/TeamSection";

export const metadata: Metadata = {
  title: "Tim Kami | SiHEDAF",
  description: "Tim pengembang SiHEDAF",
};

export default function TeamPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-paper text-primary-900">
      <HeaderSection activePage="team" />
      <div className="page-enter flex flex-1 flex-col">
        <main className="flex flex-1">
          <TeamSection />
        </main>
        <FooterSection />
      </div>
    </div>
  );
}
