import React, { StrictMode } from 'react'
import Navigation from './navigation'
import { ThemeProvider } from './context/ThemeContext'

const App: React.FC = () => {
  return (
    <StrictMode>
      <ThemeProvider>
        <Navigation />
      </ThemeProvider>
    </StrictMode>
  )
}

export default App