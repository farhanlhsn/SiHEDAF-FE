type TeamCardProps = {
  role: string;
  name: string;
  linkedInLabel?: string;
  imageSrc?: string;
};

import Image from "next/image";
import { LinkedinIcon } from "@/components/ui/LinkedinIcon";

export function TeamCard({
  role,
  name,
  linkedInLabel,
  imageSrc,
}: TeamCardProps) {
  const hasLinkedIn = Boolean(linkedInLabel && linkedInLabel.includes("http"));

  return (
    <article
      aria-label={`${role}: ${name}`}
      className="relative aspect-[0.76] min-h-[300px] overflow-hidden rounded-[20px] bg-gradient-to-b from-paper-deep via-[#d6d2c8] to-[#8a877f]"
    >
      {imageSrc ? (
        <>
          <Image
            alt={name}
            className="object-cover object-center transition-transform duration-700 hover:scale-105"
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 25vw"
            src={imageSrc}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/80" />
        </>
      ) : null}
      <span className="absolute top-4 left-4 inline-flex h-9 items-center rounded-full bg-paper px-4 text-[13px] font-semibold text-primary-900">
        {role}
      </span>

      <div className="absolute right-4 bottom-4 left-4 text-white">
        <h2 className="text-[24px] leading-[1.05] font-bold tracking-[-0.035em]">
          {name}
        </h2>
        {hasLinkedIn ? (
          <a
            aria-label={`LinkedIn ${name}`}
            className="mt-4 inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-[14px] font-semibold text-primary-900 transition-[transform,background-color] duration-300 ease-out hover:-translate-y-0.5 hover:bg-primary-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            href={linkedInLabel}
            rel="noopener noreferrer"
            target="_blank"
          >
            <LinkedinIcon
              aria-hidden="true"
              className="h-4 w-4"
              strokeWidth={2}
            />
            <span>LinkedIn</span>
          </a>
        ) : (
          <div className="mt-4 inline-flex h-10 items-center gap-2 rounded-full bg-white/20 px-4 text-[14px] font-semibold text-white">
            <LinkedinIcon
              aria-hidden="true"
              className="h-4 w-4"
              strokeWidth={2}
            />
            <span>LinkedIn</span>
          </div>
        )}
      </div>
    </article>
  );
}
