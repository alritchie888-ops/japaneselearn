import { generateText, Output } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const scenarioSchema = z.object({
  title: z.string().describe('Brief title for the scenario'),
  setting: z.string().describe('Where the conversation takes place'),
  description: z.string().describe('Brief setup for the learner'),
  dialogue: z.array(z.object({
    speaker: z.enum(['npc', 'learner']).describe('Who is speaking'),
    japanese: z.string().describe('The Japanese text'),
    romaji: z.string().describe('Romanized version'),
    english: z.string().describe('English translation'),
    isPrompt: z.boolean().describe('True if learner should respond here'),
    acceptableResponses: z.array(z.string()).nullable().describe('If isPrompt, acceptable responses in Japanese'),
  })),
  targetVocabulary: z.array(z.string()).describe('Key words being practiced'),
})

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { unitId, vocabularyWords, difficulty } = await req.json()

  if (!unitId || !vocabularyWords || !Array.isArray(vocabularyWords)) {
    return Response.json({ error: 'Unit ID and vocabulary words are required' }, { status: 400 })
  }

  // Get unit info
  const { data: unit } = await supabase
    .from('units')
    .select('*, topics(*)')
    .eq('id', unitId)
    .single()

  if (!unit) {
    return Response.json({ error: 'Unit not found' }, { status: 404 })
  }

  const difficultyLevel = difficulty || 1

  try {
    const { output } = await generateText({
      model: 'anthropic/claude-sonnet-4.6',
      output: Output.object({
        schema: scenarioSchema,
      }),
      messages: [
        {
          role: 'system',
          content: `You are a Japanese language scenario designer. Create short, practical conversation scenarios for language learners.

Guidelines:
- Keep scenarios brief (4-8 dialogue exchanges)
- Use the provided vocabulary naturally
- Match the difficulty level (${difficultyLevel}/5)
- For difficulty 1-2: use simple, polite forms, short sentences
- For difficulty 3-4: use casual forms, longer sentences
- For difficulty 5: use native-speed natural speech
- Make the scenario feel realistic and useful
- Include 1-2 prompts where the learner must respond
- Provide multiple acceptable responses for prompts`,
        },
        {
          role: 'user',
          content: `Create a scenario for the unit "${unit.title_en}" (${unit.can_do_statement}).

Topic context: ${unit.topics?.title_en || 'General Japanese'}

Target vocabulary to include:
${vocabularyWords.map((w: { japanese: string; english: string }) => `- ${w.japanese} (${w.english})`).join('\n')}

Difficulty level: ${difficultyLevel}/5

Create a realistic scenario where the learner can practice these words in context.`,
        },
      ],
    })

    if (!output) {
      return Response.json({ error: 'Failed to generate scenario' }, { status: 500 })
    }

    // Store the scenario
    const { data: newScenario, error: scenarioError } = await supabase
      .from('scenarios')
      .insert({
        unit_id: unitId,
        title: output.title,
        description: output.description,
        setting: output.setting,
        difficulty_level: difficultyLevel,
        is_ai_generated: true,
        system_prompt: JSON.stringify(output),
      })
      .select()
      .single()

    if (scenarioError) {
      console.error('Scenario insert error:', scenarioError)
    }

    return Response.json({
      scenario: output,
      scenarioId: newScenario?.id,
    })

  } catch (error) {
    console.error('Generate scenario error:', error)
    return Response.json({ error: 'Failed to generate scenario' }, { status: 500 })
  }
}
