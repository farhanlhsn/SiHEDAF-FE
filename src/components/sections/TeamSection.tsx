import { SectionLabel } from "@/components/ui/SectionLabel";
import { TeamCard } from "@/components/ui/TeamCard";

const teamMembers = [
  {
    role: "UI/UX Designer",
    name: "Casta Garneta",
    linkedInLabel: "https://www.linkedin.com/in/castagarneta/",
    imageSrc: "/team/casta.jpeg",
  },
  {
    role: "Frontend Developer",
    name: "Hauzan Rafi Attallah",
    linkedInLabel: "https://www.linkedin.com/in/hauzan-rafi/",
    imageSrc: "/team/hauzan.png",
  },
  {
    role: "Backend Developer",
    name: "Muhammad Rifki Anandita",
    linkedInLabel:
      "https://www.linkedin.com/in/muhammad-rifki-anandita-32b481287/",
    imageSrc: "/team/rifki.png",
  },
  {
    role: "AI Developer",
    name: "Agung Ramadhan",
    linkedInLabel: "https://www.linkedin.com/in/agung-ramadhan08/",
    imageSrc: "/team/agung.png",
  },
  // Placeholder cards until the real members, roles, and photos are provided.
  { role: "Peran Anggota 5", name: "Nama Anggota 5" },
  { role: "Peran Anggota 6", name: "Nama Anggota 6" },
  { role: "Peran Anggota 7", name: "Nama Anggota 7" },
  { role: "Peran Anggota 8", name: "Nama Anggota 8" },
  { role: "Peran Anggota 9", name: "Nama Anggota 9" },
  { role: "Peran Anggota 10", name: "Nama Anggota 10" },
];

export function TeamSection() {
  return (
    <section
      aria-labelledby="team-title"
      className="section-reveal w-full bg-paper pt-16 pb-24 lg:pt-20 lg:pb-32"
    >
      <div className="mx-auto w-[calc(100%-40px)] max-w-[1440px] sm:w-[calc(100%-64px)]">
        <SectionLabel>Tim Kami</SectionLabel>
        <div className="mt-8 grid gap-6 lg:grid-cols-12 lg:items-end">
          <h1
            className="text-[clamp(2.6rem,5vw,5rem)] leading-[0.95] tracking-[-0.05em] text-primary-900 lg:col-span-8"
            id="team-title"
          >
            <span className="font-bold">Tim pengembang</span>{" "}
            <span className="font-extralight">di balik SiHEDAF.</span>
          </h1>
          <p className="max-w-[420px] text-[1.125rem] leading-[1.6] text-primary-900/80 lg:col-span-4">
            Tim yang merancang antarmuka, membangun sistem, dan melatih model AI
            pendeteksi Atrial Fibrillation.
          </p>
        </div>
      </div>

      <div className="mx-auto mt-14 grid w-[calc(100%-40px)] max-w-[1440px] grid-cols-1 gap-5 sm:w-[calc(100%-64px)] sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        {teamMembers.map((member) => (
          <TeamCard key={member.name} {...member} />
        ))}
      </div>
    </section>
  );
}
