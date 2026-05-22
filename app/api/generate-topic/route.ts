import { generateText, Output } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const topicContentSchema = z.object({
  topic: z.object({
    title_en: z.string().describe('English title for the topic'),
    title_ja: z.string().nullable().describe('Japanese title if applicable'),
    description: z.string().describe('Brief description of what learner will achieve'),
    icon: z.string().describe('A single emoji representing the topic'),
    difficulty_level: z.number().min(1).max(5).describe('1=beginner, 5=advanced'),
  }),
  units: z.array(z.object({
    title_en: z.string().describe('Unit title'),
    title_ja: z.string().nullable(),
    can_do_statement: z.string().describe('What the learner can do after completing this unit, e.g. "I can order a coffee"'),
    learning_pattern: z.enum(['closed_set', 'rule_exceptions', 'rule_production', 'open_contextual']),
  })),
  words: z.array(z.object({
    kanji: z.string().nullable().describe('Kanji form if applicable'),
    hiragana: z.string().describe('Hiragana reading'),
    katakana: z.string().nullable().describe('Katakana form for loanwords'),
    romaji: z.string().describe('Romanized form'),
    meaning_en: z.string().describe('Primary English meaning'),
    meaning_en_alt: z.array(z.string()).nullable().describe('Alternative meanings'),
    part_of_speech: z.string().describe('noun, verb, adjective, etc.'),
    jlpt_level: z.number().min(1).max(5).nullable().describe('JLPT level (5=N5 easiest, 1=N1 hardest)'),
    unit_index: z.number().describe('Which unit this word belongs to (0-indexed)'),
    context_sentence_ja: z.string().nullable().describe('Example sentence in Japanese'),
    context_sentence_en: z.string().nullable().describe('English translation of example'),
  })),
})

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { intent } = await req.json()

  if (!intent || typeof intent !== 'string') {
    return Response.json({ error: 'Intent is required' }, { status: 400 })
  }

  try {
    // Generate topic content using AI
    const { output } = await generateText({
      model: 'anthropic/claude-sonnet-4.6',
      output: Output.object({
        schema: topicContentSchema,
      }),
      messages: [
        {
          role: 'system',
          content: `You are a Japanese language curriculum designer. Generate learning content for English speakers learning Japanese.

Guidelines:
- Create practical, real-world vocabulary focused on the user's stated goal
- Include 2-4 units that build progressively
- Each unit should have 8-15 words
- Words should be common, practical vocabulary (JLPT N5-N4 level preferred for beginners)
- Include polite forms and common phrases
- Provide context sentences that show natural usage
- learning_pattern should be 'open_contextual' for most topic-based units
- For grammar or structure units, use 'rule_production' or 'rule_exceptions'
- Keep difficulty appropriate for beginners unless the topic demands otherwise`,
        },
        {
          role: 'user',
          content: `Create a Japanese learning topic for: "${intent}"

Generate a complete topic with units and vocabulary that will help someone achieve this goal. Include practical words and phrases they'll actually use.`,
        },
      ],
    })

    if (!output) {
      return Response.json({ error: 'Failed to generate content' }, { status: 500 })
    }

    // Create slug from title
    const slug = output.topic.title_en
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    // Check if topic already exists
    const { data: existingTopic } = await supabase
      .from('topics')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existingTopic) {
      return Response.json({ 
        topicId: existingTopic.id, 
        slug,
        message: 'Topic already exists' 
      })
    }

    // Insert topic
    const { data: newTopic, error: topicError } = await supabase
      .from('topics')
      .insert({
        slug,
        title_en: output.topic.title_en,
        title_ja: output.topic.title_ja,
        description: output.topic.description,
        icon: output.topic.icon,
        difficulty_level: output.topic.difficulty_level,
        is_active: true,
      })
      .select()
      .single()

    if (topicError || !newTopic) {
      console.error('Topic insert error:', topicError)
      return Response.json({ error: 'Failed to create topic' }, { status: 500 })
    }

    // Insert units
    const unitIds: string[] = []
    for (let i = 0; i < output.units.length; i++) {
      const unit = output.units[i]
      const unitSlug = unit.title_en
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

      const { data: newUnit, error: unitError } = await supabase
        .from('units')
        .insert({
          topic_id: newTopic.id,
          slug: unitSlug,
          title_en: unit.title_en,
          title_ja: unit.title_ja,
          can_do_statement: unit.can_do_statement,
          learning_pattern: unit.learning_pattern,
          sort_order: i,
          is_active: true,
        })
        .select()
        .single()

      if (unitError || !newUnit) {
        console.error('Unit insert error:', unitError)
        continue
      }

      unitIds.push(newUnit.id)
    }

    // Insert words and link to units
    for (const word of output.words) {
      const unitId = unitIds[word.unit_index] || unitIds[0]

      // Check if word already exists (by hiragana + meaning)
      const { data: existingWord } = await supabase
        .from('words')
        .select('id')
        .eq('hiragana', word.hiragana)
        .eq('meaning_en', word.meaning_en)
        .single()

      let wordId: string

      if (existingWord) {
        wordId = existingWord.id
      } else {
        const { data: newWord, error: wordError } = await supabase
          .from('words')
          .insert({
            kanji: word.kanji,
            hiragana: word.hiragana,
            katakana: word.katakana,
            romaji: word.romaji,
            meaning_en: word.meaning_en,
            meaning_en_alt: word.meaning_en_alt,
            part_of_speech: word.part_of_speech,
            jlpt_level: word.jlpt_level,
          })
          .select()
          .single()

        if (wordError || !newWord) {
          console.error('Word insert error:', wordError)
          continue
        }

        wordId = newWord.id
      }

      // Link word to unit
      await supabase
        .from('word_unit_links')
        .insert({
          word_id: wordId,
          unit_id: unitId,
          context_sentence_ja: word.context_sentence_ja,
          context_sentence_en: word.context_sentence_en,
          sort_order: output.words.indexOf(word),
        })
        .select()
    }

    // Create user topic progress entry
    await supabase
      .from('user_topic_progress')
      .insert({
        user_id: user.id,
        topic_id: newTopic.id,
        started_at: new Date().toISOString(),
        progress_percentage: 0,
      })

    return Response.json({
      topicId: newTopic.id,
      slug,
      message: 'Topic created successfully',
      unitsCreated: unitIds.length,
      wordsCreated: output.words.length,
    })

  } catch (error) {
    console.error('Generate topic error:', error)
    return Response.json({ error: 'Failed to generate topic' }, { status: 500 })
  }
}
