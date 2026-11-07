"use client";

import { useEffect, useRef, useState } from "react";
import { DayPicker, type DateRange } from "@daypicker/react";
import { id } from "@daypicker/react/locale";
import { CalendarDays } from "lucide-react";

type DateRangePickerProps = Readonly<{
  onChange: (range: DateRange | undefined) => void;
  value: DateRange | undefined;
}>;

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function formatRange(range: DateRange | undefined) {
  if (!range || !range.from) return "Pilih rentang tanggal";
  if (!range.to) return dateFormatter.format(range.from);
  return `${dateFormatter.format(range.from)} - ${dateFormatter.format(range.to)}`;
}

export function DateRangePicker({ onChange, value }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [draftRange, setDraftRange] = useState<DateRange | undefined>(value);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node))
        setIsOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function toggleCalendar() {
    setDraftRange(value);
    setIsOpen((current) => !current);
  }

  function applyRange() {
    if (!draftRange?.from || !draftRange.to) return;
    onChange(draftRange);
    setIsOpen(false);
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className="flex h-12 items-center gap-3 rounded-full border-[1.5px] border-primary-900/20 bg-white px-5 text-[15px] font-semibold text-primary-900 transition-colors hover:bg-paper-deep focus-visible:outline-2 focus-visible:outline-primary-300"
        onClick={toggleCalendar}
        type="button"
      >
        {formatRange(value)}
        <CalendarDays aria-hidden="true" size={18} strokeWidth={2} />
      </button>

      {isOpen ? (
        <div
          aria-label="Pilih rentang tanggal"
          className="page-enter absolute top-[calc(100%+12px)] right-0 z-40 w-[min(340px,calc(100vw-2rem))] rounded-[24px] border border-primary-900/10 bg-white p-4 shadow-[0_22px_60px_rgba(0,39,88,0.16)]"
          role="dialog"
        >
          <DayPicker
            defaultMonth={draftRange?.from}
            locale={id}
            mode="range"
            onSelect={setDraftRange}
            selected={draftRange}
          />
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-primary-900/10 pt-4">
            <button
              className="h-11 rounded-full border-[1.5px] border-primary-900/20 text-[15px] font-semibold text-primary-900 transition-colors hover:bg-paper-deep"
              onClick={() => {
                setDraftRange(undefined);
                onChange(undefined);
                setIsOpen(false);
              }}
              type="button"
            >
              Reset Filter
            </button>
            <button
              className="btn-primary h-11 rounded-full bg-primary-900 text-[15px] font-semibold text-white"
              disabled={!draftRange?.from || !draftRange.to}
              onClick={applyRange}
              type="button"
            >
              Terapkan
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
