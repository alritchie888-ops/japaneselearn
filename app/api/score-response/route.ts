import { generateText, Output } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const scoringResultSchema = z.object({
  isCorrect: z.boolean().describe('Whether the response is acceptable'),
  score: z.number().min(0).max(100).describe('Score from 0-100'),
  feedback: z.string().describe('Brief, factual feedback on the response'),
  correctExample: z.string().nullable().describe('A correct example if the response was wrong'),
  grammarNotes: z.string().nullable().describe('Any grammar points to note'),
})

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { 
    userResponse, 
    expectedMeaning, 
    acceptableResponses,
    context,
    responseType // 'typed' | 'spoken'
  } = await req.json()

  if (!userResponse || !expectedMeaning) {
    return Response.json({ error: 'User response and expected meaning are required' }, { status: 400 })
  }

  try {
    const { output } = await generateText({
      model: 'anthropic/claude-sonnet-4.6',
      output: Output.object({
        schema: scoringResultSchema,
      }),
      messages: [
        {
          role: 'system',
          content: `You are a Japanese language evaluator. Score learner responses fairly and provide helpful feedback.

Guidelines:
- Be encouraging but honest
- Accept minor typos and variations
- Accept both polite and casual forms unless context requires specific register
- Consider the context when evaluating appropriateness
- Provide brief, factual feedback (no cheerleading)
- If wrong, provide a correct example
- Note any grammar issues briefly`,
        },
        {
          role: 'user',
          content: `Evaluate this Japanese response:

User's response: "${userResponse}"
Expected meaning: "${expectedMeaning}"
${acceptableResponses ? `Known acceptable responses: ${acceptableResponses.join(', ')}` : ''}
${context ? `Context: ${context}` : ''}
Response type: ${responseType || 'typed'}

Score this response. Consider:
1. Does it convey the expected meaning?
2. Is the grammar correct?
3. Is it appropriate for the context?
4. Are there minor errors that don't affect comprehension?`,
        },
      ],
    })

    if (!output) {
      // Fallback to simple matching if AI fails
      const isExactMatch = acceptableResponses?.some(
        (r: string) => r.toLowerCase() === userResponse.toLowerCase()
      )
      
      return Response.json({
        isCorrect: isExactMatch,
        score: isExactMatch ? 100 : 0,
        feedback: isExactMatch ? 'Correct.' : 'Response does not match expected answer.',
        correctExample: isExactMatch ? null : acceptableResponses?.[0] || null,
        grammarNotes: null,
      })
    }

    return Response.json(output)

  } catch (error) {
    console.error('Score response error:', error)
    
    // Fallback scoring
    const isExactMatch = acceptableResponses?.some(
      (r: string) => r.toLowerCase() === userResponse.toLowerCase()
    )
    
    return Response.json({
      isCorrect: isExactMatch,
      score: isExactMatch ? 100 : 0,
      feedback: isExactMatch ? 'Correct.' : 'Could not evaluate response.',
      correctExample: null,
      grammarNotes: null,
    })
  }
}
