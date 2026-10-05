import { ArcElement, BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Tooltip } from "chart.js"
import { Bar, Doughnut } from "react-chartjs-2"
import { AGENCIES, CATEGORIES, type Incident } from "../incidents.ts"

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend)

const tick = { color: "#94a3b8", font: { size: 10 } }

type AnalyticsPanelProps = {
  incidents: Incident[]
}

export function AnalyticsPanel({ incidents }: AnalyticsPanelProps) {
  const categoryLabels = ["Electrical", "Flooding", "Road", "Signal", "Other"]
  const urgent = CATEGORIES.map(
    (category) => incidents.filter((item) => item.category === category && (item.severity === "CRITICAL" || item.severity === "HIGH")).length,
  )
  const routine = CATEGORIES.map(
    (category) => incidents.filter((item) => item.category === category && (item.severity === "MODERATE" || item.severity === "LOW")).length,
  )
  const agencyCounts = AGENCIES.map((agency) => incidents.filter((item) => item.target_agency === agency).length)

  return (
    <section className="space-y-6 rounded-2xl border border-slate-800 bg-slate-800/60 p-6">
      <div className="flex flex-col gap-2 border-b border-slate-800 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-xs font-semibold tracking-wider text-brand-500 uppercase">Module 02 · Intelligence analytics</p>
          <h3 className="mt-0.5 text-xl font-bold text-slate-100">Agency routing and hazard categories</h3>
        </div>
        <span className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 font-mono text-xs text-slate-400">
          Incident fields from the draft schema
        </span>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs font-bold text-slate-300">Hazard distribution by category and severity</p>
          <div className="h-[220px]">
            <Bar
              data={{
                labels: categoryLabels,
                datasets: [
                  { label: "Critical / High", data: urgent, backgroundColor: "#DC2626" },
                  { label: "Moderate / Low", data: routine, backgroundColor: "#D97706" },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { labels: { color: "#94A3B8", boxWidth: 10, font: { size: 10 } } } },
                scales: {
                  x: { stacked: true, ticks: tick, grid: { color: "#1E293B" } },
                  y: { stacked: true, ticks: tick, grid: { color: "#1E293B" } },
                },
              }}
            />
          </div>
        </div>
        <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs font-bold text-slate-300">Target agency workload</p>
          <div className="h-[220px]">
            <Doughnut
              data={{
                labels: ["Austin Energy", "County Public Works", "311 Dispatch", "Emergency Services"],
                datasets: [
                  {
                    data: agencyCounts,
                    backgroundColor: ["#0284C7", "#EA580C", "#D97706", "#DC2626"],
                    borderWidth: 2,
                    borderColor: "#0F172A",
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: "right", labels: { color: "#94A3B8", boxWidth: 10, font: { size: 10 } } },
                },
              }}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
