"use client";

import { TEXT_SIZES, TEXT_SIZE_LABEL } from "@/components/ui/TextSize";
import { useTextSize } from "@/components/ui/hooks/UseTextSize";

export function TextSizeSetting() {
  const { size, setSize } = useTextSize();

  return (
    <fieldset className="px-6 py-5 sm:px-7">
      <legend className="text-[1rem] font-semibold text-primary-900">
        Ukuran teks
      </legend>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {TEXT_SIZES.map((option) => (
          <label
            className="flex min-h-12 cursor-pointer items-center justify-center rounded-full border-[1.5px] border-primary-900/20 bg-white px-5 text-[0.9375rem] font-semibold text-primary-900 transition-colors hover:bg-paper-deep has-checked:border-primary-900 has-checked:bg-primary-900 has-checked:text-white has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary-300"
            key={option}
          >
            <input
              checked={size === option}
              className="sr-only"
              name="text-size"
              onChange={() => setSize(option)}
              type="radio"
              value={option}
            />
            {TEXT_SIZE_LABEL[option]}
          </label>
        ))}
      </div>
      <p className="mt-4 rounded-[14px] bg-paper px-4 py-3 text-[1.125rem] font-semibold text-primary-900">
        Irama terakhirmu normal.
      </p>
    </fieldset>
  );
}
