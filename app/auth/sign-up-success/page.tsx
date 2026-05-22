import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-background">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="text-center mb-4">
            <h1 className="text-3xl font-medium tracking-tight">Nihongo</h1>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Check your email</CardTitle>
              <CardDescription>
                We sent you a confirmation link
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Click the link in your email to confirm your account, then you can start learning.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/auth/login">
                  Back to sign in
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
