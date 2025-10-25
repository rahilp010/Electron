import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

function KeyBind({ children }) {
  const navigate = useNavigate()
  const keyBindings = useSelector((state) => state.electron.keyBindings?.data || [])
  const location = useLocation()

  useEffect(() => {
    if (location.pathname === '/auth' || location.pathname === '/') return

    const handleKeyPress = (event) => {
      // Check for ESC key (always enabled)

      if (event.key === 'Escape') {
        const activeElement = document.activeElement
        // Close modal if any input/textarea is focused or if there's a modal
        if (
          activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          document.querySelector('[role="dialog"]')
        ) {
          return // Let modal handle ESC
        }
        navigate('/dashboard')
        return
      }

      // Check custom key bindings
      keyBindings?.forEach((binding) => {
        if (!binding.enabled) return

        const modifiers = binding.modifiers || []
        const key = binding.key?.toLowerCase()

        // Check if all required modifiers are pressed
        const ctrlMatch = !modifiers.includes('ctrl') || event.ctrlKey
        const shiftMatch = !modifiers.includes('shift') || event.shiftKey
        const altMatch = !modifiers.includes('alt') || event.altKey
        const metaMatch = !modifiers.includes('meta') || event.metaKey

        // Check if the key matches
        const keyMatch = event.key.toLowerCase() === key

        if (ctrlMatch && shiftMatch && altMatch && metaMatch && keyMatch) {
          event.preventDefault()

          // Execute the action
          switch (binding.action) {
            case 'navigate':
              navigate(binding.value)
              break
            case 'callback':
              if (typeof window[binding.value] === 'function') {
                window[binding.value]()
              }
              break
            case 'custom':
              // Dispatch custom event for other components to listen
              window.dispatchEvent(
                new CustomEvent('customKeyBinding', {
                  detail: { bindingId: binding.id, value: binding.value }
                })
              )
              break
            default:
              break
          }
        }
      })
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [navigate, keyBindings])

  return <>{children}</>
}

export default KeyBind
