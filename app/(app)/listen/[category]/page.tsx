import { notFound } from "next/navigation"
import { AudioSession } from "@/components/listen/audio-session"
import { LISTEN_CATEGORIES, type ListenCategory } from "@/lib/audio/track"

export default async function ListenCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>
}) {
  const { category } = await params
  const valid = LISTEN_CATEGORIES.some((c) => c.key === category)
  if (!valid) notFound()
  return <AudioSession category={category as ListenCategory} />
}
