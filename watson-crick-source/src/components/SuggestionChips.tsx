type Props = {
  suggestions: string[];
  onPick: (q: string) => void;
  disabled?: boolean;
};

export function SuggestionChips({ suggestions, onPick, disabled }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {suggestions.map((s) => (
        <button
          key={s}
          type="button"
          disabled={disabled}
          onClick={() => onPick(s)}
          className="rounded-full bg-transparent px-3.5 py-1.5 text-xs text-foreground/65 transition-colors hover:text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {s}
        </button>
      ))}
    </div>
  );
}
