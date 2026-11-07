import Image from "next/image";

import { AuthJourney, type JourneyStep } from "@/components/auth/AuthJourney";
import {
  HeartDrawing,
  LockDrawing,
  WearDrawing,
} from "@/components/landing/LineArt";

export type AuthIllustration = "heart" | "wear" | "lock" | "device";

export type AuthTitle = {
  strong: string;
  light: string;
};

type AuthVisualPanelProps = {
  title: AuthTitle;
  description: string;
  journeyStep?: JourneyStep;
  illustration: AuthIllustration;
};

const drawings = {
  heart: HeartDrawing,
  wear: WearDrawing,
  lock: LockDrawing,
};

export function AuthVisualPanel({
  title,
  description,
  journeyStep,
  illustration,
}: AuthVisualPanelProps) {
  const Drawing = illustration === "device" ? null : drawings[illustration];

  return (
    <aside className="w-full border-b border-primary-900/10 lg:w-[44%] lg:border-r lg:border-b-0">
      <div className="flex h-full flex-col px-5 py-8 sm:px-10 lg:px-14 lg:py-14 xl:px-20">
        <h2 className="hero-stagger text-[clamp(2.1rem,3.6vw,3.6rem)] leading-[0.98] tracking-[-0.05em] text-primary-900">
          <span className="font-bold">{title.strong}</span>{" "}
          <span className="font-extralight">{title.light}</span>
        </h2>
        <p
          className="hero-stagger mt-5 max-w-[440px] text-[17px] leading-[1.6] text-primary-900/80"
          style={{ "--stagger": 1 } as React.CSSProperties}
        >
          {description}
        </p>

        {journeyStep !== undefined ? (
          <div
            className="hero-stagger mt-8 lg:mt-12"
            style={{ "--stagger": 2 } as React.CSSProperties}
          >
            <AuthJourney current={journeyStep} />
          </div>
        ) : null}

        <div className="mt-auto hidden min-h-0 justify-center pt-10 lg:flex">
          {Drawing ? (
            <Drawing
              className="autodraw h-auto max-h-[30vh] w-[min(240px,70%)]"
              connectors={false}
            />
          ) : (
            <Image
              alt="Jam tangan pintar SiHEDAF"
              className="watch-float h-auto max-h-[28vh] w-auto object-contain drop-shadow-[0_24px_30px_rgba(0,49,113,0.18)]"
              height={443}
              preload
              src="/watch.png"
              width={277}
            />
          )}
        </div>
      </div>
    </aside>
  );
}
