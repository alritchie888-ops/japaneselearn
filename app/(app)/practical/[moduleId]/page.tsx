import { PracticalRunner } from "@/components/practical/practical-runner"

export default async function PracticalLessonPage({
  params,
}: {
  params: Promise<{ moduleId: string }>
}) {
  const { moduleId } = await params
  return <PracticalRunner moduleId={moduleId} />
}
