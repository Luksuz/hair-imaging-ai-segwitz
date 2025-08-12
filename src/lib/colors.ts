export const HAIR_STRAND_COLORS: Record<string, string> = {
  strong: "#22c55e", // green
  medium: "#f59e0b", // yellow
  weak: "#ef4444", // red
  default: "#22c55e",
};

export function mapClassNameToStrength(className: string): keyof typeof HAIR_STRAND_COLORS {
  const c = (className || "").toLowerCase();
  if (c.includes("strong")) return "strong";
  if (c.includes("medium")) return "medium";
  if (c.includes("weak")) return "weak";
  return "default" as const;
}




