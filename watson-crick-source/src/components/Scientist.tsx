import watsonImg from "@/assets/watson.png";
import crickImg from "@/assets/crick.png";

type Props = {
  who: "watson" | "crick";
  size?: number;
  className?: string;
  showName?: boolean;
};

const NAMES = { watson: "Dr. Watson", crick: "Dr. Crick" };
const ROLES = { watson: "Hypothesis lead", crick: "Critical review" };

export function Scientist({ who, size = 180, className = "", showName = false }: Props) {
  const src = who === "watson" ? watsonImg : crickImg;
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <img
        src={src}
        alt={NAMES[who]}
        width={size}
        height={size}
        className={who === "watson" ? "animate-bob" : "animate-float-slow"}
      />
      {showName && (
        <div className="mt-3 text-center">
          <div className="text-sm font-medium text-foreground">{NAMES[who]}</div>
          <div className="mono text-[10px] uppercase tracking-[0.18em] text-foreground/45 mt-0.5">
            {ROLES[who]}
          </div>
        </div>
      )}
    </div>
  );
}
