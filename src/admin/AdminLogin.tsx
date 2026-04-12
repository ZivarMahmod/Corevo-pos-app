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
    <div className="flex h-full flex-col items-center justify-center bg-gray-50">
      <h1 className="mb-8 text-2xl font-bold">Admin</h1>

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 px-6 py-3 text-center text-sm text-danger">
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
        className="mt-8 text-muted hover:underline"
      >
        Tillbaka till kiosken
      </button>
    </div>
  )
}
