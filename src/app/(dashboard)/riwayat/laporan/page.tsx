import { DoctorReportView } from "@/components/dashboard/DoctorReportView";

export default async function DoctorReportPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string | string[]; to?: string | string[] }>;
}) {
  const { from, to } = await searchParams;

  return <DoctorReportView initialParams={{ from, to }} />;
}
