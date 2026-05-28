import { RouterProvider } from '@tanstack/react-router'
import { router } from './router'
import { Providers } from './providers'

/**
 * Root application component.
 * Sets up providers and routing for the Ambient Music Player.
 */
export default function App() {
  return (
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  )
}
