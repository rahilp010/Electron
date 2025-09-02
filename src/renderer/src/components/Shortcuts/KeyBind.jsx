import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function KeyBind({ children }) {
  const navigate = useNavigate()

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        navigate('/') // go to homepage
      }
    }

    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [navigate])

  return <>{children}</>
}

export default KeyBind
