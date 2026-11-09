import { DayDial } from "@/components/landing/DayDial";
import { InView } from "@/components/landing/InView";
import { ThreadPoint } from "@/components/landing/ThreadPoint";
import { ThreadStation } from "@/components/landing/ThreadStation";

const features = [
  {
    title: "Pemantauan berkala",
    description:
      "Sinyal PPG direkam setiap 3 menit, siang dan malam. Kamu tidak perlu ingat apa-apa.",
  },
  {
    title: "Deteksi AI",
    description:
      "Setiap rekaman dianalisis oleh model AI dan diklasifikasikan sebagai Normal atau AF.",
  },
  {
    title: "Riwayat di dashboard",
    description:
      "Hasil analisis tersimpan per tanggal, mudah ditunjukkan saat kontrol ke dokter.",
  },
  {
    title: "Hemat energi",
    description:
      "Perangkat dan koneksi nirkabelnya dirancang hemat daya, jadi nyaman dipakai seharian.",
  },
];

export function FeaturesSection() {
  return (
    <section
      aria-labelledby="features-title"
      className="relative py-28 lg:py-36"
      id="fitur"
    >
      <div className="mx-auto max-w-[1440px] px-5 lg:px-10">
        <ThreadStation index="02" label="Berjaga 24 jam" />

        <h2
          className="mt-10 max-w-[980px] pl-10 text-[clamp(2.4rem,4.7vw,4.75rem)] leading-[0.96] tracking-[-0.05em] text-primary-900 lg:pl-14"
          id="features-title"
        >
          <span className="font-bold">Teknologi pemantauan</span>{" "}
          <span className="font-extralight">
            yang tetap bekerja saat kamu tidur.
          </span>
        </h2>

        <div className="relative mt-20 grid gap-16 pl-10 lg:mt-24 lg:grid-cols-12 lg:gap-10 lg:pl-14">
          {/* Run down the rail past the heading before swinging into the dial. */}
          <ThreadPoint className="-top-10 left-[11px]" dir="down" />

          <InView as="ol" className="space-y-10 lg:col-span-5 lg:pt-32">
            {features.map((feature, index) => (
              <li
                className="reveal grid grid-cols-[44px_1fr] gap-4 border-t border-primary-900/10 pt-6"
                key={feature.title}
                style={{ "--i": index } as React.CSSProperties}
              >
                <span className="text-[0.9375rem] font-semibold tabular-nums text-primary-500">
                  0{index + 1}
                </span>
                <span>
                  <span className="block text-[1.375rem] font-bold tracking-[-0.035em] text-primary-900">
                    {feature.title}
                  </span>
                  <span className="mt-2 block max-w-[440px] text-[1.0625rem] leading-[1.55] text-primary-900/80">
                    {feature.description}
                  </span>
                </span>
              </li>
            ))}
          </InView>

          <div className="lg:col-span-6 lg:col-start-7">
            <DayDial />
          </div>

          {/* Desktop: drop down the right edge, then cross back below everything. */}
          <ThreadPoint
            className="-right-[14px] -bottom-10 hidden lg:block"
            dir="down"
          />
          <ThreadPoint className="-bottom-28 left-[11px]" dir="down" />
        </div>
      </div>
    </section>
  );
}
