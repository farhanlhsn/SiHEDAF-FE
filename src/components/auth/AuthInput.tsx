import { type Ref, type ClipboardEvent, useId, useState } from "react";
import { CircleAlert, Eye, EyeOff } from "lucide-react";

type AuthInputProps = {
  label: string;
  name: string;
  placeholder: string;
  type?: "text" | "email" | "password";
  value: string;
  autoComplete?: string;
  error?: string;
  hint?: string;
  /** Monospaced, widely spaced text for codes such as a Device ID. */
  mono?: boolean;
  inputRef?: Ref<HTMLInputElement>;
  required?: boolean;
  onBlur?: () => void;
  onChange: (value: string) => void;
  onPaste?: (event: ClipboardEvent<HTMLInputElement>) => void;
};

export function AuthInput({
  label,
  name,
  placeholder,
  type = "text",
  value,
  autoComplete,
  error,
  hint,
  mono = false,
  inputRef,
  required = true,
  onBlur,
  onChange,
  onPaste,
}: AuthInputProps) {
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;
  const describedBy = [error ? errorId : null, hint ? hintId : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div>
      <label
        className="mb-2.5 block text-[0.9375rem] font-semibold tracking-[-0.01em] text-primary-900"
        htmlFor={inputId}
      >
        {label}
      </label>
      <div className="relative">
        <input
          aria-describedby={describedBy || undefined}
          aria-invalid={Boolean(error)}
          autoComplete={autoComplete}
          className={`h-14 w-full rounded-[14px] border-[1.5px] bg-white px-5 text-[1rem] text-primary-900 outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-primary-900/60 focus:ring-4 ${
            isPassword ? "pr-14" : ""
          } ${mono ? "font-mono tracking-[0.14em]" : "font-medium"} ${
            error
              ? "border-af-500 focus:border-af-500 focus:ring-af-50"
              : "border-primary-900/15 hover:border-primary-900/30 focus:border-primary-300 focus:ring-primary-100"
          }`}
          id={inputId}
          name={name}
          onBlur={onBlur}
          onChange={(event) => onChange(event.target.value)}
          onPaste={onPaste}
          placeholder={placeholder}
          ref={inputRef}
          required={required}
          spellCheck={mono ? false : undefined}
          type={inputType}
          value={value}
        />
        {isPassword ? (
          <button
            aria-label={
              showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"
            }
            aria-pressed={showPassword}
            className="absolute top-1/2 right-2.5 grid size-10 -translate-y-1/2 place-items-center rounded-[10px] text-primary-900/75 transition-colors hover:bg-paper-deep hover:text-primary-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-300"
            onClick={() => setShowPassword((visible) => !visible)}
            type="button"
          >
            {showPassword ? (
              <EyeOff aria-hidden="true" className="size-5" strokeWidth={2} />
            ) : (
              <Eye aria-hidden="true" className="size-5" strokeWidth={2} />
            )}
          </button>
        ) : null}
      </div>
      {hint && !error ? (
        <p className="mt-2 text-[0.875rem] text-primary-900/75" id={hintId}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p
          className="mt-2 flex items-start gap-1.5 text-[0.875rem] font-medium text-af-700"
          id={errorId}
          role="alert"
        >
          <CircleAlert
            aria-hidden="true"
            className="mt-[2px] size-4 shrink-0"
            strokeWidth={2.25}
          />
          {error}
        </p>
      ) : null}
    </div>
  );
}
