import React, {
  type FC,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ChangeEvent,
} from "react";

export interface Option {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  options: Option[];

  // value control
  value?: string;                // controlled value
  defaultValue?: string;         // uncontrolled initial value
  onChange: (value: string) => void;

  // UI
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  errorMessage?: string;         // page controls error display
  className?: string;            // wrapper
  buttonClassName?: string;      // trigger button
  listClassName?: string;        // dropdown container

  // Search (optional)
  searchable?: boolean;
  searchPlaceholder?: string;
  noResultsText?: string;
  // (controlled search, optional)
  searchValue?: string;
  onSearchChange?: (text: string) => void;

  // Custom filter (optional): return true to keep an option
  filterOption?: (option: Option, searchText: string) => boolean;
}

const Select: FC<SelectProps> = ({
  options,
  value,
  defaultValue = "",
  onChange,

  label,
  placeholder = "Select an option",
  disabled = false,
  errorMessage,
  className = "",
  buttonClassName = "",
  listClassName = "",

  searchable = false,
  searchPlaceholder = "Search…",
  noResultsText = "No results",

  searchValue,
  onSearchChange,
  filterOption,
}) => {
  const autoId = useId();
  const buttonId = `select-btn-${autoId}`;
  const listId = `select-list-${autoId}`;

  const isControlled = value !== undefined;
  const [internal, setInternal] = useState<string>(defaultValue);
  const currentValue = isControlled ? (value as string) : internal;

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);

  const [localSearch, setLocalSearch] = useState("");
  const searchText = searchValue !== undefined ? searchValue : localSearch;

  const selected = useMemo(
    () => options.find((o) => o.value === currentValue),
    [options, currentValue]
  );

  // Outside click closes
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Focus search on open & initialize active index
  useEffect(() => {
    if (!open) return;
    if (searchable) setTimeout(() => searchRef.current?.focus(), 0);

    const list = filteredOptions();
    let idx = list.findIndex((o) => o.value === currentValue && !o.disabled);
    if (idx === -1) idx = list.findIndex((o) => !o.disabled);
    setActiveIndex(idx);
  }, [open]); // eslint-disable-line

  const filteredOptions = () => {
    if (!searchable || !searchText.trim()) return options;
    if (filterOption) return options.filter((o) => filterOption(o, searchText));
    const t = searchText.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(t));
  };

  const filtered = filteredOptions();

  const commitChange = (val: string) => {
    if (!isControlled) setInternal(val);
    onChange(val);
    setOpen(false);
    setTimeout(() => btnRef.current?.focus(), 0);
  };

  const onTriggerKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (e.key === " " || e.key === "Enter" || e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
    }
  };

  const onListKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      setTimeout(() => btnRef.current?.focus(), 0);
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!filtered.length) return;
      let next = activeIndex;
      const dir = e.key === "ArrowDown" ? 1 : -1;
      for (let i = 0; i < filtered.length; i++) {
        next = (next + dir + filtered.length) % filtered.length;
        if (!filtered[next].disabled) break;
      }
      setActiveIndex(next);
      listRef.current
        ?.querySelector<HTMLElement>(`[data-index="${next}"]`)
        ?.scrollIntoView({ block: "nearest" });
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && !filtered[activeIndex]?.disabled) {
        commitChange(filtered[activeIndex].value);
      }
    }
  };

  const onSearchInput = (e: ChangeEvent<HTMLInputElement>) => {
    onSearchChange?.(e.target.value);
    if (searchValue === undefined) setLocalSearch(e.target.value);
    setActiveIndex(-1);
  };

  const hasError = !!errorMessage;

  return (
    <div className={`relative ${className}`} ref={wrapRef}>
      {label && (
        <label
          htmlFor={buttonId}
          className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100"
        >
          {label}
        </label>
      )}

      <button
        id={buttonId}
        ref={btnRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={onTriggerKeyDown}
        className={`relative mt-1 w-full cursor-pointer rounded-md border px-3 py-2 text-left text-sm shadow-theme-xs outline-none focus:ring-3
          ${disabled ? "cursor-not-allowed opacity-50" : ""}
          ${
            hasError
              ? "border-red-500 focus:ring-red-500/20 dark:border-red-500"
              : "border-gray-300 focus:ring-brand-500/20 dark:border-gray-700"
          }
          bg-white placeholder:text-gray-400 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30
          ${buttonClassName}
        `}
      >
        <div className="relative flex w-full items-center justify-between">
          <span
            className={`truncate ${
              selected ? "text-gray-800 dark:text-white/90" : "text-gray-400 dark:text-gray-400"
            }`}
          >
            {selected ? selected.label : placeholder}
          </span>

          {/* caret — perfectly aligned & rotates when open */}
          <span className="ml-2 flex items-center justify-center text-gray-500 dark:text-gray-400">
            <svg
              width="16"
              height="16"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
              className={`transition-transform duration-150 ${open ? "rotate-180" : "rotate-0"}`}
            >
              <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" />
            </svg>
          </span>
        </div>
      </button>

      {open && (
        <div
          className={`absolute z-50 mt-2 w-full overflow-hidden rounded-lg border bg-white shadow-md dark:bg-gray-900 ${
            hasError ? "border-red-200 dark:border-red-800" : "border-gray-200 dark:border-white/10"
          } ${listClassName}`}
        >
          {/* search input (optional) */}
          {searchable && (
            <div className="border-b border-gray-200 p-2 dark:border-white/10">
              <input
                ref={searchRef}
                type="text"
                value={searchText}
                onChange={onSearchInput}
                placeholder={searchPlaceholder}
                className="h-9 w-full rounded-md border border-gray-300 bg-white px-2 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
                aria-label="Search options"
              />
            </div>
          )}

          <ul
            id={listId}
            role="listbox"
            tabIndex={-1}
            ref={listRef}
            onKeyDown={onListKeyDown}
            className="max-h-60 w-full overflow-auto"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">{noResultsText}</li>
            ) : (
              filtered.map((opt, idx) => {
                const isSelected = currentValue === opt.value;
                const base =
                  "flex w-full items-center justify-between px-3 py-2 text-left text-sm focus:outline-none";
                const enabled =
                  "cursor-pointer text-gray-600 hover:bg-gray-50 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-gray-100";
                const disabledCls = "opacity-50 cursor-not-allowed text-gray-400";
                return (
                  <li
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    data-index={idx}
                    className={`${base} ${opt.disabled ? disabledCls : enabled}`}
                    onClick={() => !opt.disabled && commitChange(opt.value)}
                  >
                    <span>{opt.label}</span>
                    {isSelected && (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="text-pink-600"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.704 5.29a1 1 0 010 1.42l-7.01 7.01a1 1 0 01-1.414 0l-3.01-3.01a1 1 0 111.414-1.42l2.303 2.303 6.303-6.303a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}

      {errorMessage ? (
        <p className="mt-1.5 text-xs text-error-500">{errorMessage}</p>
      ) : null}
    </div>
  );
};

export default Select;


{/* <Select
label="User Type *"
options={roleOptions}
placeholder="Select Role"
value={roleId ? String(roleId) : ""}
onChange={(val) => {
  setRoleId(Number(val) as RoleId);
  setRoleError("");
}}
errorMessage={roleError}
searchable={false}
searchPlaceholder="Search roles…"
// Example: custom filter (optional)
// filterOption={(opt, text) => opt.label.toLowerCase().startsWith(text.toLowerCase())}
/> */}