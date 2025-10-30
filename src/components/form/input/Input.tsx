import React, { FC, useId, useState } from "react";
import { FaEye, FaRegEyeSlash } from "react-icons/fa";

type CommonTypes = "text" | "email" | "password" | "number" | "date" | "time" | "datetime-local";

export interface InputProps {
  label?: string;
  type?: CommonTypes;
  id?: string;
  name?: string;
  placeholder?: string;
  value?: string | number;
  onValueChange?: (value: string) => void; // parent controls value
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  onFocus?: React.FocusEventHandler<HTMLInputElement>;
  disabled?: boolean;

  // formatting / constraints (purely native behavior)
  min?: number | string;
  max?: number | string;
  step?: number;

  // display-only messaging (managed by parent)
  hint?: string;
  errorMessage?: string; // if provided -> shows red border + text

  // class hooks
  className?: string;
  inputClassName?: string;
  labelClassName?: string;
}

const Input: FC<InputProps> = ({
  label,
  type = "text",
  id,
  name,
  placeholder,
  value = "",
  onValueChange,
  onBlur,
  onFocus,
  disabled = false,
  min,
  max,
  step,
  hint,
  errorMessage,
  className = "",
  inputClassName = "",
  labelClassName = "",
}) => {
  const autoId = useId();
  const inputId = id ?? autoId;

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const actualType = type === "password" ? (isPasswordVisible ? "text" : "password") : type;

  const hasError = !!errorMessage;

  const baseInput =
    "h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs " +
    "placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 " +
    "dark:text-white/90 dark:placeholder:text-white/30";

  const borderState = disabled
    ? "text-gray-500 border-gray-300 opacity-40 bg-gray-100 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
    : hasError
      ? "border-error-500 focus:border-error-300 focus:ring-error-500/20 dark:text-error-400 dark:border-error-500 dark:focus:border-error-800"
      : "bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90 dark:focus:border-brand-800";

  const inputClasses = `${baseInput} ${borderState} ${inputClassName}`.trim();

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className={`mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100 ${labelClassName}`}
        >
          {label}
        </label>
      )}

      <div className="relative">
        <input
          id={inputId}
          name={name}
          type={actualType}
          placeholder={placeholder}
          value={String(value ?? "")}
          onChange={(e) => onValueChange?.(e.target.value)}
          onBlur={onBlur}
          onFocus={onFocus}
          disabled={disabled}
          min={min as any}
          max={max as any}
          step={step}
          className={inputClasses}
          aria-invalid={hasError ? "true" : "false"}
          aria-describedby={hasError ? `${inputId}-error` : undefined}
        />

        {/* password toggle (handled INSIDE when type="password") */}
        {type === "password" && (
          <button
            type="button"
            onClick={() => setIsPasswordVisible((v) => !v)}
            aria-label={isPasswordVisible ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2"
            tabIndex={-1}
          >
            {isPasswordVisible ? (
              <FaEye className="size-5 fill-gray-500 dark:fill-gray-400" />
            ) : (
              <FaRegEyeSlash className="size-5 fill-gray-500 dark:fill-gray-400" />
            )}
          </button>
        )}
      </div>

      {/* messages (parent-controlled) */}
      {hasError ? (
        <p id={`${inputId}-error`} className="mt-1.5 text-xs text-error-500">
          {errorMessage}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-gray-500">{hint}</p>
      ) : null}
    </div>
  );
};

export default Input;
