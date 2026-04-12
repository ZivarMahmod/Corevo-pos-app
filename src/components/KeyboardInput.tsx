interface KeyboardInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  maxLength?: number
  masked?: boolean
  label?: string
}

export default function KeyboardInput({
  value,
  onChange,
  onSubmit,
  maxLength = 6,
  masked = true,
  label = 'Ange PIN',
}: KeyboardInputProps) {
  const handleKey = (key: string) => {
    if (key === 'backspace') {
      onChange(value.slice(0, -1))
    } else if (key === 'enter') {
      onSubmit()
    } else if (value.length < maxLength) {
      onChange(value + key)
    }
  }

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'backspace']

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Label */}
      <p className="text-lg text-muted">{label}</p>

      {/* Display */}
      <div className="flex gap-3">
        {Array.from({ length: maxLength }, (_, i) => (
          <div
            key={i}
            className={`flex h-14 w-14 items-center justify-center rounded-xl border-2 text-2xl font-bold transition-colors ${
              i < value.length
                ? 'border-primary bg-primary-light'
                : 'border-gray-200 bg-white'
            }`}
          >
            {i < value.length ? (masked ? '●' : value[i]) : ''}
          </div>
        ))}
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-3">
        {keys.map((key, i) => {
          if (key === '') return <div key={i} />
          return (
            <button
              key={i}
              onClick={() => handleKey(key)}
              className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-xl font-semibold shadow-sm border border-gray-200 transition active:bg-gray-100 active:scale-95"
            >
              {key === 'backspace' ? '⌫' : key}
            </button>
          )
        })}
      </div>

      {/* Submit */}
      <button
        onClick={onSubmit}
        disabled={value.length === 0}
        className="mt-2 rounded-xl bg-primary px-12 py-4 text-lg font-semibold text-white transition active:scale-95 disabled:opacity-40"
      >
        OK
      </button>
    </div>
  )
}
