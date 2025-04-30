import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import {Playground} from './playground.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Playground />
  </StrictMode>,
)
