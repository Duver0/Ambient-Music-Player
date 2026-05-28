import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/globals.css'
import '@/styles/safe-area.css'
import '@/styles/animations.css'

const App = lazy(() => import('@/app/App'))

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element not found. Ensure index.html has a <div id="root"></div>.')
}

createRoot(rootElement).render(
  <StrictMode>
    <Suspense fallback={<div className="h-dvh bg-ambient-900" />}>
      <App />
    </Suspense>
  </StrictMode>,
)
