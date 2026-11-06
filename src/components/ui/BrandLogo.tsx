import Image from "next/image";
import Link from "next/link";

type BrandLogoProps = {
  compact?: boolean;
  tone?: "dark" | "light";
};

export function BrandLogo({ compact = false, tone = "dark" }: BrandLogoProps) {
  const imageSize = compact ? 22 : 30;
  const textColor = tone === "light" ? "text-white" : "text-primary-900";

  return (
    <Link
      aria-label="Kembali ke halaman utama SiHEDAF"
      className="inline-flex shrink-0 items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-400"
      href="/#top"
    >
      <Image
        alt="Logo SiHEDAF"
        height={imageSize}
        preload={!compact}
        src="/logo.png"
        width={imageSize}
      />
      <span
        className={`${
          compact ? "text-[14px]" : "text-[19px]"
        } font-bold tracking-[-0.035em] ${textColor}`}
      >
        SiHEDAF
      </span>
    </Link>
  );
}
