import type { ReactNode } from "react";

type SectionLabelProps = {
  children: ReactNode;
  className?: string;
};

export function SectionLabel({ children, className = "" }: SectionLabelProps) {
  return (
    <p
      className={`inline-flex items-center gap-3 text-[0.8125rem] font-semibold tracking-[0.08em] text-primary-700 uppercase ${className}`}
    >
      <span
        aria-hidden="true"
        className="grid size-[18px] place-items-center rounded-full border-2 border-primary-300"
      >
        <span className="size-1.5 rounded-full bg-primary-300" />
      </span>
      {children}
    </p>
  );
}
