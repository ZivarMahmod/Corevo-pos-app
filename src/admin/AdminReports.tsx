import { useNavigate } from 'react-router-dom'
import { useKiosk } from '@/hooks/useKiosk'
import { useIdleTimer } from '@/hooks/useIdleTimer'
import { supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'

interface DayReport {
  orderCount: number
  totalRevenue: number
  swishTotal: number
  cardTotal: number
}

export default function AdminReports() {
  const navigate = useNavigate()
  const { kiosk } = useKiosk()
  const [report, setReport] = useState<DayReport | null>(null)
  const [loading, setLoading] = useState(true)

  useIdleTimer(300_000, () => navigate('/'))

  useEffect(() => {
    async function fetchReport() {
      if (!kiosk) return

      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)

      const { data: orders } = await supabase
        .from('orders')
        .select('total, payment_method, status')
        .eq('kiosk_id', kiosk.kioskId)
        .gte('created_at', todayStart.toISOString())
        .eq('status', 'completed')

      if (orders) {
        setReport({
          orderCount: orders.length,
          totalRevenue: orders.reduce((sum, o) => sum + (o.total ?? 0), 0),
          swishTotal: orders
            .filter((o) => o.payment_method === 'swish')
            .reduce((sum, o) => sum + (o.total ?? 0), 0),
          cardTotal: orders
            .filter((o) => o.payment_method === 'card')
            .reduce((sum, o) => sum + (o.total ?? 0), 0),
        })
      }
      setLoading(false)
    }
    fetchReport()
  }, [kiosk])

  return (
    <div className="flex h-full flex-col bg-gray-50">
      <div className="flex items-center justify-between border-b bg-white px-6 py-4">
        <h1 className="text-xl font-bold">Dagens rapport</h1>
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium transition active:scale-95"
        >
          Tillbaka
        </button>
      </div>

      <div className="flex flex-1 items-center justify-center p-8">
        {loading ? (
          <p className="text-muted">Laddar rapport...</p>
        ) : report ? (
          <div className="grid grid-cols-2 gap-6 max-w-lg w-full">
            <ReportCard label="Antal ordrar" value={String(report.orderCount)} />
            <ReportCard label="Total" value={`${report.totalRevenue} kr`} />
            <ReportCard label="Swish" value={`${report.swishTotal} kr`} />
            <ReportCard label="Kort" value={`${report.cardTotal} kr`} />
          </div>
        ) : (
          <p className="text-muted">Inga data</p>
        )}
      </div>
    </div>
  )
}

function ReportCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-white p-6 text-center shadow-sm">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
    </div>
  )
}
