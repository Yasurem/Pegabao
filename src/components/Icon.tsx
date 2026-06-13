// Material Symbols icon. `fill` switches to the filled variant.
export function Icon({
  name,
  className = "",
  fill = false,
}: {
  name: string;
  className?: string;
  fill?: boolean;
}) {
  return (
    <span
      aria-hidden
      className={`material-symbols-outlined${fill ? " fill" : ""} ${className}`}
    >
      {name}
    </span>
  );
}
