'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ArrowRight, Mic, Loader2 } from 'lucide-react'

interface IntentInputProps {
  placeholder?: string
  onSubmit?: (intent: string) => void
  className?: string
  generateTopic?: boolean
}

export function IntentInput({ 
  placeholder = "What do you want to study?",
  onSubmit,
  className = '',
  generateTopic = true
}: IntentInputProps) {
  const router = useRouter()
  const [value, setValue] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!value.trim() || isGenerating) return
    
    if (onSubmit) {
      onSubmit(value.trim())
      return
    }
    
    if (generateTopic) {
      // Generate a new topic via AI
      setIsGenerating(true)
      try {
        const response = await fetch('/api/generate-topic', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ intent: value.trim() }),
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.slug) {
            router.push(`/learn/${data.slug}`)
            router.refresh()
          }
        } else {
          console.error('Failed to generate topic')
        }
      } catch (error) {
        console.error('Generate topic error:', error)
      } finally {
        setIsGenerating(false)
        setValue('')
      }
    } else {
      router.push(`/learn?intent=${encodeURIComponent(value.trim())}`)
    }
  }

  function handleVoiceInput() {
    // Check if browser supports speech recognition
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)
    
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript
      setValue(transcript)
    }

    recognition.start()
  }

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <Input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={isGenerating ? 'Generating topic...' : placeholder}
        className="pr-20 h-12 text-base"
        disabled={isGenerating}
      />
      <div className="absolute right-1 top-1 flex gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-10 w-10"
          onClick={handleVoiceInput}
          disabled={isListening || isGenerating}
        >
          <Mic className={`h-4 w-4 ${isListening ? 'text-accent animate-pulse' : ''}`} />
          <span className="sr-only">Voice input</span>
        </Button>
        <Button
          type="submit"
          size="icon"
          className="h-10 w-10"
          disabled={!value.trim() || isGenerating}
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowRight className="h-4 w-4" />
          )}
          <span className="sr-only">Submit</span>
        </Button>
      </div>
    </form>
  )
}

// Type declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}
