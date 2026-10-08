import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import { dark } from '@clerk/themes'
import './index.css'
import '@/registry/foundation.css'
import App from './App.jsx'

import { initPostHog } from './lib/posthog'

// Import your publishable key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key")
}

// Initialize PostHog once at application startup
initPostHog()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY} 
      afterSignOutUrl="/"
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: '#ffffff',
          colorBackground: '#131416',
          colorInputBackground: '#1c1d21',
          colorInputText: '#f2f2f2',
          colorText: '#f2f2f2',
          colorTextSecondary: '#8a8a93',
          fontFamily: '"Geist Variable", "Inter", sans-serif',
          borderRadius: '0.5rem',
        },
        elements: {
          card: {
            backgroundColor: '#131416',
            border: '1px solid #26272c',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
          },
          formButtonPrimary: {
            backgroundColor: '#ffffff',
            color: '#131416',
            '&:hover': {
              backgroundColor: '#e8e8e8'
            }
          },
          navbar: {
            borderRight: '1px solid #26272c'
          },
          organizationSwitcherTrigger: {
            color: '#f2f2f2',
            '&:hover': {
              backgroundColor: '#1c1d21'
            }
          }
        }
      }}
    >
      <App />
    </ClerkProvider>
  </StrictMode>,
)
