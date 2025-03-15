import type { AppProps } from 'next/app'
import { AuthProvider } from '@/components/auth/auth-provider'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  )
}

export default MyApp