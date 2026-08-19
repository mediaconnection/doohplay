import WatchdogCard from "./WatchdogCard"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            DOOHPLAY Dashboard
          </h1>
          <p className="text-gray-400 mt-3 text-sm md:text-base">
            Monitoramento operacional em tempo real
          </p>
        </div>

        <div className="mb-12">
          <WatchdogCard />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          <div className="p-6 bg-gray-900 rounded-2xl shadow-lg hover:shadow-xl transition">
            <h2 className="text-xl font-semibold mb-4">📊 Proof-of-Play</h2>
            <p className="text-gray-400 text-sm">
              Métricas consolidadas de exibição por campanha.
            </p>
          </div>

          <div className="p-6 bg-gray-900 rounded-2xl shadow-lg hover:shadow-xl transition">
            <h2 className="text-xl font-semibold mb-4">💰 Financeiro</h2>
            <p className="text-gray-400 text-sm">
              Consolidação financeira mensal e faturamento.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}