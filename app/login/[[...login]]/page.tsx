import { SignIn } from '@clerk/nextjs'

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <SignIn signUpUrl="/signup" fallbackRedirectUrl="/properties" />
    </main>
  )
}
