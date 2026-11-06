import {
  AnalyseDrawing,
  NotifyDrawing,
  RecordDrawing,
  WearDrawing,
} from "@/components/landing/LineArt";
import { ThreadPoint } from "@/components/landing/ThreadPoint";
import { ThreadStation } from "@/components/landing/ThreadStation";

const steps = [
  {
    title: "Kenakan wristband SiHEDAF",
    description:
      "Pasang di pergelangan tangan seperti jam biasa. Sensor PPG langsung aktif membaca perubahan aliran darah.",
    Drawing: WearDrawing,
  },
  {
    title: "Sinyal direkam berkala",
    description:
      "Setiap 3 menit perangkat merekam sinyal PPG, lalu mengirimnya dalam bentuk terkompresi lewat koneksi nirkabel hemat energi.",
    Drawing: RecordDrawing,
  },
  {
    title: "AI memeriksa iramanya",
    description:
      "Model AI membaca jarak antar detak di setiap rekaman dan mengelompokkannya: Normal atau AF terdeteksi.",
    Drawing: AnalyseDrawing,
  },
  {
    title: "Kamu dapat peringatan",
    description:
      "Hasil tampil di dashboard. Jika AF terdeteksi, notifikasi dikirim supaya kamu bisa segera berkonsultasi ke dokter.",
    Drawing: NotifyDrawing,
  },
];

export function ProcessSection() {
  return (
    <section
      aria-labelledby="process-title"
      className="relative py-28 lg:py-36"
      id="cara-kerja"
    >
      <div className="mx-auto max-w-[1440px] px-5 lg:px-10">
        <ThreadStation index="03" label="Cara kerja" />

        <h2
          className="mt-10 max-w-[980px] pl-10 text-[clamp(2.4rem,4.7vw,4.75rem)] leading-[0.96] tracking-[-0.05em] text-primary-900 lg:pl-14"
          id="process-title"
        >
          <span className="font-bold">Langkah sederhana,</span>{" "}
          <span className="font-extralight">
            dari pergelangan tangan sampai peringatan.
          </span>
        </h2>

        <div className="relative mt-20 lg:mt-40">
          {/* Clear the heading on the rail before crossing to the first drawing. */}
          <ThreadPoint
            className="-top-10 left-[11px] hidden lg:block"
            dir="down"
          />

          <ol className="space-y-24 pl-10 lg:space-y-36 lg:pl-14">
            {steps.map((step, index) => {
              const drawingOnRight = index % 2 === 0;
              const target = `step-${index + 1}`;

              return (
                <li
                  className="relative grid items-center gap-8 lg:grid-cols-12 lg:gap-10"
                  key={step.title}
                >
                  <ThreadPoint
                    className="top-0 -left-[29px] lg:hidden"
                    target={target}
                    to="line"
                  />

                  <div
                    className={`relative flex justify-center lg:col-span-5 ${
                      drawingOnRight ? "lg:order-2 lg:col-start-8" : ""
                    }`}
                    data-thread-for={target}
                  >
                    <ThreadPoint
                      className="top-0 left-1/2 hidden lg:block"
                      target={target}
                      to="jump"
                    />
                    <step.Drawing className="size-[190px] lg:size-[250px]" />
                    <ThreadPoint className="bottom-0 left-1/2 hidden lg:block" />
                  </div>

                  <div
                    className={`lg:col-span-5 ${
                      drawingOnRight
                        ? "lg:order-1 lg:col-start-1"
                        : "lg:col-start-7"
                    }`}
                  >
                    <p className="text-[clamp(3rem,5vw,4.75rem)] leading-none font-extralight tracking-[-0.06em] text-primary-300 tabular-nums">
                      0{index + 1}
                    </p>
                    <h3 className="mt-4 text-[clamp(1.6rem,2.3vw,2.2rem)] leading-[1.1] font-bold tracking-[-0.035em] text-primary-900">
                      {step.title}
                    </h3>
                    <p className="mt-3 max-w-[460px] text-[1.125rem] leading-[1.6] text-primary-900/80">
                      {step.description}
                    </p>
                  </div>

                  <ThreadPoint className="bottom-0 -left-[29px] lg:hidden" />
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
