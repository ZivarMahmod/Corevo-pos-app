import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useKiosk } from '@/hooks/useKiosk'
import KeyboardInput from '@/components/KeyboardInput'

export default function AdminLogin() {
  const navigate = useNavigate()
  const { verifyPin } = useKiosk()
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [locked, setLocked] = useState(false)

  const handleSubmit = () => {
    if (locked) return
    if (verifyPin(pin)) {
      navigate('/admin/dashboard')
    } else {
      const newAttempts = attempts + 1
      setAttempts(newAttempts)
      setPin('')
      if (newAttempts >= 3) {
        setLocked(true)
        setError('För många försök. Vänta 30 sekunder.')
        setTimeout(() => {
          setLocked(false)
          setAttempts(0)
          setError('')
        }, 30_000)
      } else {
        setError(`Fel PIN. ${3 - newAttempts} försök kvar.`)
      }
    }
  }

  return (
    <div className="flex h-full flex-col items-center justify-center bg-bg">
      <h1 className="mb-2 text-3xl font-extrabold text-text">Admin</h1>
      <p className="mb-8 text-muted">Ange PIN för att fortsätta</p>

      {error && (
        <div className="animate-shake mb-6 rounded-xl bg-red-50 px-6 py-3 text-center text-sm font-medium text-danger">
          {error}
        </div>
      )}

      <KeyboardInput
        value={pin}
        onChange={setPin}
        onSubmit={handleSubmit}
        maxLength={4}
        masked
        label="Ange admin-PIN"
      />

      <button
        onClick={() => navigate('/')}
        className="mt-10 text-sm text-muted active:opacity-70"
      >
        Tillbaka till kiosken
      </button>
    </div>
  )
}
