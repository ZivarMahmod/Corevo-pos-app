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
    <div className="flex flex-col items-center gap-8">
      {/* Label */}
      <p className="text-lg font-medium text-muted">{label}</p>

      {/* PIN dots */}
      <div className="flex gap-4">
        {Array.from({ length: maxLength }, (_, i) => (
          <div
            key={i}
            className={`flex h-14 w-14 items-center justify-center rounded-2xl border-2 transition-all duration-200 ${
              i < value.length
                ? 'border-primary bg-primary'
                : 'border-gray-200 bg-white'
            }`}
          >
            {i < value.length ? (
              masked ? (
                <div className="h-3 w-3 rounded-full bg-white" />
              ) : (
                <span className="text-xl font-bold text-white">{value[i]}</span>
              )
            ) : null}
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
              className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-xl font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-black/[0.06] transition active:bg-gray-100 active:scale-95"
              style={{ willChange: 'transform' }}
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
        className="rounded-full bg-primary px-14 py-4 text-lg font-bold text-white shadow-[0_4px_16px_rgba(45,107,90,0.3)] transition active:scale-95 disabled:opacity-40"
        style={{ willChange: 'transform' }}
      >
        OK
      </button>
    </div>
  )
}
