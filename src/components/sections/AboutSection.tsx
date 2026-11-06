import { AfFacts } from "@/components/landing/AfFacts";
import { RhythmCompare } from "@/components/landing/RhythmCompare";
import { ThreadStation } from "@/components/landing/ThreadStation";

export function AboutSection() {
  return (
    <section
      aria-labelledby="about-title"
      className="relative pt-36 pb-28 lg:pt-44 lg:pb-36"
      id="tentang"
    >
      <div className="mx-auto max-w-[1440px] px-5 lg:px-10">
        <ThreadStation index="01" label="Masalahnya" />

        <div className="mt-10 grid gap-8 pl-10 lg:grid-cols-12 lg:pl-14">
          <h2
            className="text-[clamp(2.4rem,4.7vw,4.75rem)] leading-[0.96] tracking-[-0.05em] text-primary-900 lg:col-span-8"
            id="about-title"
          >
            <span className="font-bold">
              Stroke adalah ancaman yang bisa dicegah,
            </span>{" "}
            <span className="font-extralight">
              asal AF ketahuan lebih awal.
            </span>
          </h2>
          <p className="max-w-[460px] self-end text-[1.125rem] leading-[1.6] text-primary-900/80 lg:col-span-4">
            Atrial Fibrillation (AF) adalah gangguan irama jantung yang menjadi
            faktor risiko utama stroke. SiHEDAF, Sistem Hemat Energi Detektor
            Atrial Fibrilasi, memantaunya untukmu dari pergelangan tangan.
          </p>
        </div>

        <RhythmCompare />
        <AfFacts />
      </div>
    </section>
  );
}
