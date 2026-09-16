import { notFound } from "next/navigation"
import { SpeakSession } from "@/components/speak/speak-session"
import { SPEAK_CATEGORIES, type SpeakCategory } from "@/lib/speak/track"

export function generateStaticParams() {
  return SPEAK_CATEGORIES.map((c) => ({ category: c.key }))
}

export default async function SpeakCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>
}) {
  const { category } = await params
  const meta = SPEAK_CATEGORIES.find((c) => c.key === category)
  if (!meta) notFound()
  return <SpeakSession category={meta.key as SpeakCategory} meta={meta} />
}
