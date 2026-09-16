import { LessonRunner } from "@/components/learn/lesson-runner"

export default async function LessonPage({
  params,
}: {
  params: Promise<{ unitId: string }>
}) {
  const { unitId } = await params
  return <LessonRunner unitId={unitId} />
}
