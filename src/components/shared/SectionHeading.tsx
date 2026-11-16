import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  light?: boolean;
  as?: "h1" | "h2";
  className?: string;
};

// Section title with an optional short lead-in line and description.
// Text renders exactly as written: no forced capitals.
export function SectionHeading({ eyebrow, title, description, align = "left", light = false, as: Tag = "h2", className }: SectionHeadingProps) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow && <p className={cn("mb-3 text-sm font-medium", light ? "text-beech" : "text-bronze")}>{eyebrow}</p>}
      <Tag className={cn(Tag === "h1" ? "text-4xl sm:text-5xl" : "text-3xl sm:text-4xl", light ? "text-porcelain" : "text-ink")}>{title}</Tag>
      {description && (
        <p className={cn("mt-4 max-w-prose text-base sm:text-lg", align === "center" && "mx-auto", light ? "text-porcelain/75" : "text-stone")}>
          {description}
        </p>
      )}
    </div>
  );
}
