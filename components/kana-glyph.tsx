import { cn } from "@/lib/utils"

interface KanaGlyphProps {
  text: string
  /** Render with the Japanese type face. */
  jp?: boolean
  className?: string
}

/** Renders a kana character or a romaji reading with consistent typography. */
export function KanaGlyph({ text, jp, className }: KanaGlyphProps) {
  return (
    <span
      className={cn(
        "leading-none tracking-tight",
        jp ? "font-jp" : "font-sans lowercase",
        className,
      )}
    >
      {text}
    </span>
  )
}
