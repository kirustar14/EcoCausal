import { useState, type FormEvent } from "react";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (q: string) => void;
  disabled?: boolean;
  placeholder?: string;
};

export function ChatInput({ value, onChange, onSubmit, disabled, placeholder }: Props) {
  const [focused, setFocused] = useState(false);

  const handle = (e: FormEvent) => {
    e.preventDefault();
    const q = value.trim();
    if (!q || disabled) return;
    onSubmit(q);
  };

  return (
    <form onSubmit={handle} className="w-full">
      <div
        className="flex items-stretch gap-0 overflow-hidden rounded-2xl bg-card p-1.5 transition-all"
        style={{
          border: `1px solid ${focused ? "var(--lab-green)" : "color-mix(in oklab, var(--ink) 12%, transparent)"}`,
          boxShadow: focused
            ? "0 8px 30px -12px color-mix(in oklab, var(--lab-green) 40%, transparent)"
            : "0 4px 20px -10px color-mix(in oklab, var(--ink) 18%, transparent)",
        }}
      >
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder ?? "Type your research question…"}
          disabled={disabled}
          className="flex-1 bg-transparent py-3.5 px-5 text-base text-foreground placeholder:text-foreground/35 outline-none disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-all hover:bg-lab-green disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span>Ask</span>
          <span aria-hidden>→</span>
        </button>
      </div>
    </form>
  );
}
