// Ported from Oatmeal Farm Network (src/ScaleTickets.jsx). Mechanical adaptations
// only: router package, i18n hook, component paths, API base env var,
// people-id accessor.
import { useState, useEffect, useCallback } from "react";
// ThaiymeChat, the Thaiyme agent widget, is not ported: it needs
// AgentBadge and LanguageContext.

const API = import.meta.env.VITE_LIVESTOCK_API_URL || "";

function apiFetch(path, opts = {}) {
  const token = localStorage.getItem("access_token");
  return fetch(`${API}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...opts.headers },
  });
}

const TABS = ["Tickets", "Summary", "Forward Contracts", "Margin Analysis"];
const GRADE_OPTIONS = ["1", "2", "3", "Feed", "Rejected", "Off-Spec"];
const CONTRACT_STATUS = ["open", "partially_filled", "filled", "cancelled"];

function StatCard({ label, value, unit, color = "text-green-700" }) {
  return (
    <div className="bg-white rounded-xl border border-green-100 p-4 text-center shadow-sm">
      <div className={`text-2xl font-bold ${color}`}>{value ?? "—"}<span className="text-sm font-normal ml-1 text-gray-500">{unit}</span></div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = { open: "bg-blue-100 text-blue-700", partially_filled: "bg-yellow-100 text-yellow-800", filled: "bg-green-100 text-green-700", cancelled: "bg-gray-100 text-gray-500" };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[status] || "bg-gray-100 text-gray-600"}`}>{status?.replace(/_/g, " ")}</span>;
}

export default function ScaleTickets() {
  const [tab, setTab] = useState("Tickets");
  const [tickets, setTickets] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [margins, setMargins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddTicket, setShowAddTicket] = useState(false);
  const [showAddContract, setShowAddContract] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedContract, setSelectedContract] = useState(null);
  const [ticketFilter, setTicketFilter] = useState({ commodity: "", grade: "", contract_id: "" });

  const [ticketForm, setTicketForm] = useState({
    ticket_number: "", commodity: "", gross_weight_kg: "", tare_weight_kg: "",
    moisture_pct: "", dockage_pct: "", grade: "", sample_number: "",
    truck_id: "", driver_name: "", origin_field: "", destination_facility: "",
    price_per_tonne: "", freight_cost: "", contract_id: "", notes: "",
  });
  const [contractForm, setContractForm] = useState({
    contract_number: "", counter_party: "", commodity_name: "", contract_qty_tonnes: "",
    price_per_tonne: "", basis_amount: "", futures_month: "",
    delivery_period_start: "", delivery_period_end: "", notes: "",
  });

  const loadTickets = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (ticketFilter.commodity) params.set("commodity", ticketFilter.commodity);
    if (ticketFilter.grade) params.set("grade", ticketFilter.grade);
    if (ticketFilter.contract_id) params.set("contract_id", ticketFilter.contract_id);
    const r = await apiFetch(`/api/scale-tickets/tickets?${params}`);
    if (r.ok) setTickets(await r.json());
    setLoading(false);
  }, [ticketFilter]);

  const loadContracts = useCallback(async () => {
    const r = await apiFetch("/api/scale-tickets/contracts");
    if (r.ok) setContracts(await r.json());
  }, []);

  const loadSummary = useCallback(async () => {
    const r = await apiFetch("/api/scale-tickets/summary");
    if (r.ok) setSummary(await r.json());
  }, []);

  const loadMargins = useCallback(async () => {
    if (tickets.length === 0) return;
    const ids = tickets.slice(0, 20).map(t => t.TicketID);
    const results = await Promise.allSettled(ids.map(id => apiFetch(`/api/scale-tickets/tickets/${id}/margin`).then(r => r.ok ? r.json() : null)));
    setMargins(results.map(r => r.status === "fulfilled" ? r.value : null).filter(Boolean));
  }, [tickets]);

  useEffect(() => { loadTickets(); loadContracts(); loadSummary(); }, [loadTickets, loadContracts, loadSummary]);
  useEffect(() => { if (tab === "Margin Analysis") loadMargins(); }, [tab, loadMargins]);

  async function postToAccounting(ticketId) {
    if (!window.confirm("Post this ticket to accounting as a grain sale revenue entry?")) return;
    const r = await apiFetch(`/api/scale-tickets/tickets/${ticketId}/post-to-accounting`, { method: "POST" });
    const data = await r.json();
    if (r.ok) {
      alert(`Posted! Reference: ${data.reference_number}\nNet Revenue: $${data.net_revenue?.toLocaleString()}`);
      loadTickets();
    } else if (r.status === 409) {
      alert("This ticket has already been posted to accounting.");
    } else {
      alert(data.detail || "Post failed");
    }
  }

  async function createTicket() {
    const body = {
      ticket_number: ticketForm.ticket_number || null,
      commodity: ticketForm.commodity,
      gross_weight_kg: parseFloat(ticketForm.gross_weight_kg),
      tare_weight_kg: parseFloat(ticketForm.tare_weight_kg),
      moisture_pct: ticketForm.moisture_pct ? parseFloat(ticketForm.moisture_pct) : null,
      dockage_pct: ticketForm.dockage_pct ? parseFloat(ticketForm.dockage_pct) : null,
      grade: ticketForm.grade || null,
      sample_number: ticketForm.sample_number || null,
      truck_id: ticketForm.truck_id || null,
      driver_name: ticketForm.driver_name || null,
      origin_field: ticketForm.origin_field || null,
      destination_facility: ticketForm.destination_facility || null,
      price_per_tonne: ticketForm.price_per_tonne ? parseFloat(ticketForm.price_per_tonne) : null,
      freight_cost: ticketForm.freight_cost ? parseFloat(ticketForm.freight_cost) : null,
      contract_id: ticketForm.contract_id ? parseInt(ticketForm.contract_id) : null,
      notes: ticketForm.notes || null,
    };
    const r = await apiFetch("/api/scale-tickets/tickets", { method: "POST", body: JSON.stringify(body) });
    if (r.ok) {
      setShowAddTicket(false);
      setTicketForm({ ticket_number: "", commodity: "", gross_weight_kg: "", tare_weight_kg: "", moisture_pct: "", dockage_pct: "", grade: "", sample_number: "", truck_id: "", driver_name: "", origin_field: "", destination_facility: "", price_per_tonne: "", freight_cost: "", contract_id: "", notes: "" });
      loadTickets(); loadSummary(); loadContracts();
    }
  }

  async function createContract() {
    const body = {
      contract_number: contractForm.contract_number,
      counter_party: contractForm.counter_party,
      commodity_name: contractForm.commodity_name,
      contract_qty_tonnes: parseFloat(contractForm.contract_qty_tonnes),
      price_per_tonne: parseFloat(contractForm.price_per_tonne),
      basis_amount: contractForm.basis_amount ? parseFloat(contractForm.basis_amount) : null,
      futures_month: contractForm.futures_month || null,
      delivery_period_start: contractForm.delivery_period_start || null,
      delivery_period_end: contractForm.delivery_period_end || null,
      notes: contractForm.notes || null,
    };
    const r = await apiFetch("/api/scale-tickets/contracts", { method: "POST", body: JSON.stringify(body) });
    if (r.ok) {
      setShowAddContract(false);
      setContractForm({ contract_number: "", counter_party: "", commodity_name: "", contract_qty_tonnes: "", price_per_tonne: "", basis_amount: "", futures_month: "", delivery_period_start: "", delivery_period_end: "", notes: "" });
      loadContracts();
    }
  }

  function Field({ label, value, onChange, type = "text", step, required }) {
    return (
      <div>
        <label className="block text-xs text-gray-600 mb-1">{label}{required && " *"}</label>
        <input type={type} step={step} value={value} onChange={e => onChange(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
      </div>
    );
  }

  const netKg = t => (parseFloat(t.GrossWeightKg || 0) - parseFloat(t.TareWeightKg || 0));
  const fmtTonne = kg => (kg / 1000).toFixed(3);

  return (
    <div className="min-h-screen bg-green-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-green-900">Scale Tickets & Contract Reconciliation</h1>
            <p className="text-sm text-green-700 mt-0.5">Weigh-bridge tickets, forward contracts, margin tracking</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowAddContract(true)} className="bg-white text-green-700 border border-green-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-50">+ Contract</button>
            <button onClick={() => setShowAddTicket(true)} className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-800">+ Scale Ticket</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-green-100 rounded-xl p-1 mb-6">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${tab === t ? "bg-white text-green-800 shadow" : "text-green-700 hover:bg-green-50"}`}>{t}</button>
          ))}
        </div>

        {/* Tickets */}
        {tab === "Tickets" && (
          <div>
            <div className="flex gap-3 mb-4 flex-wrap">
              <input placeholder="Filter by commodity…" value={ticketFilter.commodity} onChange={e => setTicketFilter(f => ({ ...f, commodity: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
              <select value={ticketFilter.grade} onChange={e => setTicketFilter(f => ({ ...f, grade: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
                <option value="">All grades</option>
                {GRADE_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <select value={ticketFilter.contract_id} onChange={e => setTicketFilter(f => ({ ...f, contract_id: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
                <option value="">All contracts</option>
                {contracts.map(c => <option key={c.ContractID} value={c.ContractID}>{c.ContractNumber} — {c.CounterParty}</option>)}
              </select>
            </div>
            <div className="bg-white rounded-xl border border-green-100 shadow-sm overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-green-50 text-green-800 text-xs uppercase">
                  <tr>{["Ticket #", "Date", "Commodity", "Gross kg", "Tare kg", "Net t", "Moisture %", "Dockage %", "Grade", "Destination", ""].map(h => <th key={h} className="px-3 py-3 text-left whitespace-nowrap">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-green-50">
                  {tickets.map(t => (
                    <tr key={t.TicketID} onClick={() => setSelectedTicket(t)} className="hover:bg-green-50 cursor-pointer">
                      <td className="px-3 py-2 font-medium">{t.TicketNumber ?? `#${t.TicketID}`}</td>
                      <td className="px-3 py-2 text-xs text-gray-500">{t.WeighTime ? new Date(t.WeighTime).toLocaleDateString() : "—"}</td>
                      <td className="px-3 py-2 capitalize">{t.Commodity}</td>
                      <td className="px-3 py-2">{t.GrossWeightKg}</td>
                      <td className="px-3 py-2">{t.TareWeightKg}</td>
                      <td className="px-3 py-2 font-medium">{fmtTonne(netKg(t))}</td>
                      <td className="px-3 py-2">{t.MoisturePct ?? "—"}</td>
                      <td className="px-3 py-2">{t.DockagePct ?? "—"}</td>
                      <td className="px-3 py-2">{t.Grade ?? "—"}</td>
                      <td className="px-3 py-2 text-gray-500">{t.DestinationFacility ?? "—"}</td>
                      <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
                        <button onClick={() => postToAccounting(t.TicketID)} title="Post to Accounting"
                          className="text-xs px-2 py-1 rounded bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 whitespace-nowrap">Post $</button>
                      </td>
                    </tr>
                  ))}
                  {tickets.length === 0 && !loading && <tr><td colSpan={10} className="text-center py-10 text-gray-400">No tickets yet — click "+ Scale Ticket" to add one</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Summary */}
        {tab === "Summary" && summary && (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <StatCard label="Total Tickets" value={summary.ticket_count} />
              <StatCard label="Total Gross (t)" value={(summary.total_gross_kg / 1000).toFixed(1)} />
              <StatCard label="Total Net (t)" value={(summary.total_net_kg / 1000).toFixed(1)} />
              <StatCard label="Avg Moisture %" value={summary.avg_moisture?.toFixed(1)} color="text-blue-700" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-green-100 shadow-sm p-5">
                <h3 className="font-semibold text-green-900 mb-3">By Commodity</h3>
                <div className="space-y-2">
                  {summary.by_commodity?.map(r => (
                    <div key={r.Commodity} className="flex items-center justify-between text-sm">
                      <span className="capitalize text-gray-700">{r.Commodity}</span>
                      <span className="font-medium text-green-800">{(r.TotalNetKg / 1000).toFixed(1)} t</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl border border-green-100 shadow-sm p-5">
                <h3 className="font-semibold text-green-900 mb-3">By Grade</h3>
                <div className="space-y-2">
                  {summary.by_grade?.map(r => (
                    <div key={r.Grade} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{r.Grade || "Ungraded"}</span>
                      <span className="font-medium text-green-800">{r.TicketCount} tickets — {(r.TotalNetKg / 1000).toFixed(1)} t</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Forward Contracts */}
        {tab === "Forward Contracts" && (
          <div className="space-y-4">
            {contracts.map(c => {
              const pct = c.ContractQtyTonnes ? Math.min(100, (c.DeliveredTonnes / c.ContractQtyTonnes) * 100) : 0;
              return (
                <div key={c.ContractID} className="bg-white rounded-xl border border-green-100 shadow-sm p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-semibold text-gray-900">{c.ContractNumber} — <span className="text-green-700">{c.CounterParty}</span></div>
                      <div className="text-sm text-gray-500 capitalize mt-0.5">{c.CommodityName} · {c.FuturesMonth || "No futures month"}</div>
                    </div>
                    <StatusBadge status={c.Status} />
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center mb-4">
                    <div><div className="font-bold text-green-800">{c.ContractQtyTonnes} t</div><div className="text-xs text-gray-500">Contract Qty</div></div>
                    <div><div className="font-bold text-blue-700">{c.DeliveredTonnes?.toFixed(2) ?? "0"} t</div><div className="text-xs text-gray-500">Delivered</div></div>
                    <div><div className="font-bold text-gray-600">${c.PricePerTonne}/t</div><div className="text-xs text-gray-500">Price + {c.BasisAmount >= 0 ? "+" : ""}{c.BasisAmount ?? 0} basis</div></div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{pct.toFixed(1)}% filled · delivery {c.DeliveryPeriodStart ? `${c.DeliveryPeriodStart?.slice(0,10)} – ${c.DeliveryPeriodEnd?.slice(0,10)}` : "open"}</div>
                </div>
              );
            })}
            {contracts.length === 0 && <div className="text-center py-16 text-gray-400 bg-white rounded-xl border border-green-100">No forward contracts — click "+ Contract" to add one</div>}
          </div>
        )}

        {/* Margin Analysis */}
        {tab === "Margin Analysis" && (
          <div className="bg-white rounded-xl border border-green-100 shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-green-50 text-green-800 text-xs uppercase">
                <tr>{["Ticket", "Commodity", "Net (t)", "Price/t", "Gross Rev", "Freight", "Net Margin"].map(h => <th key={h} className="px-4 py-3 text-left whitespace-nowrap">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-green-50">
                {margins.map(m => (
                  <tr key={m.ticket_id} className="hover:bg-green-50">
                    <td className="px-4 py-2 font-medium">{m.ticket_number || `#${m.ticket_id}`}</td>
                    <td className="px-4 py-2 capitalize">{m.commodity}</td>
                    <td className="px-4 py-2">{m.final_net_tonnes?.toFixed(3)}</td>
                    <td className="px-4 py-2">${m.price_per_tonne ?? "—"}</td>
                    <td className="px-4 py-2">${m.gross_revenue?.toFixed(2) ?? "—"}</td>
                    <td className="px-4 py-2 text-red-600">{m.freight_cost ? `-$${m.freight_cost.toFixed(2)}` : "—"}</td>
                    <td className={`px-4 py-2 font-bold ${m.net_margin >= 0 ? "text-green-700" : "text-red-600"}`}>{m.net_margin != null ? `$${m.net_margin.toFixed(2)}` : "—"}</td>
                  </tr>
                ))}
                {margins.length === 0 && <tr><td colSpan={7} className="text-center py-10 text-gray-400">Tickets with price data will show margin here. Add tickets on the Tickets tab.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* Ticket Detail Panel */}
        {selectedTicket && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-end z-50">
            <div className="bg-white w-full max-w-md h-full overflow-y-auto p-6 shadow-xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-green-900">Scale Ticket {selectedTicket.TicketNumber || `#${selectedTicket.TicketID}`}</h3>
                <button onClick={() => setSelectedTicket(null)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
              </div>
              <dl className="space-y-3 text-sm">
                {[
                  ["Commodity", selectedTicket.Commodity],
                  ["Gross Weight", `${selectedTicket.GrossWeightKg} kg`],
                  ["Tare Weight", `${selectedTicket.TareWeightKg} kg`],
                  ["Net Weight", `${(netKg(selectedTicket) / 1000).toFixed(3)} t`],
                  ["Moisture %", selectedTicket.MoisturePct ?? "—"],
                  ["Dockage %", selectedTicket.DockagePct ?? "—"],
                  ["Grade", selectedTicket.Grade ?? "—"],
                  ["Sample #", selectedTicket.SampleNumber ?? "—"],
                  ["Truck ID", selectedTicket.TruckID ?? "—"],
                  ["Driver", selectedTicket.DriverName ?? "—"],
                  ["Origin Field", selectedTicket.OriginField ?? "—"],
                  ["Destination", selectedTicket.DestinationFacility ?? "—"],
                  ["Price/t", selectedTicket.PricePerTonne ? `$${selectedTicket.PricePerTonne}` : "—"],
                  ["Freight Cost", selectedTicket.FreightCost ? `$${selectedTicket.FreightCost}` : "—"],
                  ["Date", selectedTicket.WeighTime ? new Date(selectedTicket.WeighTime).toLocaleString() : "—"],
                  ["Notes", selectedTicket.Notes ?? "—"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between"><dt className="text-gray-500">{k}</dt><dd className="font-medium text-right">{v}</dd></div>
                ))}
              </dl>
            </div>
          </div>
        )}
      </div>

      {/* Add Ticket Modal */}
      {showAddTicket && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 my-4">
            <h3 className="text-lg font-semibold text-green-900 mb-4">New Scale Ticket</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Ticket Number" value={ticketForm.ticket_number} onChange={v => setTicketForm(f => ({ ...f, ticket_number: v }))} />
                <Field label="Commodity *" value={ticketForm.commodity} onChange={v => setTicketForm(f => ({ ...f, commodity: v }))} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Gross Weight (kg) *" value={ticketForm.gross_weight_kg} onChange={v => setTicketForm(f => ({ ...f, gross_weight_kg: v }))} type="number" step="0.001" required />
                <Field label="Tare Weight (kg) *" value={ticketForm.tare_weight_kg} onChange={v => setTicketForm(f => ({ ...f, tare_weight_kg: v }))} type="number" step="0.001" required />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Moisture %" value={ticketForm.moisture_pct} onChange={v => setTicketForm(f => ({ ...f, moisture_pct: v }))} type="number" step="0.01" />
                <Field label="Dockage %" value={ticketForm.dockage_pct} onChange={v => setTicketForm(f => ({ ...f, dockage_pct: v }))} type="number" step="0.01" />
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Grade</label>
                  <select value={ticketForm.grade} onChange={e => setTicketForm(f => ({ ...f, grade: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option value="">—</option>
                    {GRADE_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Truck ID" value={ticketForm.truck_id} onChange={v => setTicketForm(f => ({ ...f, truck_id: v }))} />
                <Field label="Driver Name" value={ticketForm.driver_name} onChange={v => setTicketForm(f => ({ ...f, driver_name: v }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Origin Field" value={ticketForm.origin_field} onChange={v => setTicketForm(f => ({ ...f, origin_field: v }))} />
                <Field label="Destination" value={ticketForm.destination_facility} onChange={v => setTicketForm(f => ({ ...f, destination_facility: v }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Price/tonne ($)" value={ticketForm.price_per_tonne} onChange={v => setTicketForm(f => ({ ...f, price_per_tonne: v }))} type="number" step="0.01" />
                <Field label="Freight Cost ($)" value={ticketForm.freight_cost} onChange={v => setTicketForm(f => ({ ...f, freight_cost: v }))} type="number" step="0.01" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Link to Contract</label>
                <select value={ticketForm.contract_id} onChange={e => setTicketForm(f => ({ ...f, contract_id: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="">None</option>
                  {contracts.filter(c => c.Status !== "filled").map(c => <option key={c.ContractID} value={c.ContractID}>{c.ContractNumber} — {c.CounterParty} ({c.CommodityName})</option>)}
                </select>
              </div>
              <Field label="Notes" value={ticketForm.notes} onChange={v => setTicketForm(f => ({ ...f, notes: v }))} />
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setShowAddTicket(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">Cancel</button>
              <button onClick={createTicket} disabled={!ticketForm.commodity || !ticketForm.gross_weight_kg || !ticketForm.tare_weight_kg} className="px-4 py-2 bg-green-700 text-white text-sm rounded-lg hover:bg-green-800 disabled:opacity-50">Save Ticket</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Contract Modal */}
      {showAddContract && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 my-4">
            <h3 className="text-lg font-semibold text-green-900 mb-4">New Forward Contract</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Contract Number *" value={contractForm.contract_number} onChange={v => setContractForm(f => ({ ...f, contract_number: v }))} required />
                <Field label="Counter Party *" value={contractForm.counter_party} onChange={v => setContractForm(f => ({ ...f, counter_party: v }))} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Commodity *" value={contractForm.commodity_name} onChange={v => setContractForm(f => ({ ...f, commodity_name: v }))} required />
                <Field label="Contract Qty (t) *" value={contractForm.contract_qty_tonnes} onChange={v => setContractForm(f => ({ ...f, contract_qty_tonnes: v }))} type="number" step="0.001" required />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Price/t ($) *" value={contractForm.price_per_tonne} onChange={v => setContractForm(f => ({ ...f, price_per_tonne: v }))} type="number" step="0.01" required />
                <Field label="Basis ($)" value={contractForm.basis_amount} onChange={v => setContractForm(f => ({ ...f, basis_amount: v }))} type="number" step="0.01" />
                <Field label="Futures Month" value={contractForm.futures_month} onChange={v => setContractForm(f => ({ ...f, futures_month: v }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Delivery Start" value={contractForm.delivery_period_start} onChange={v => setContractForm(f => ({ ...f, delivery_period_start: v }))} type="date" />
                <Field label="Delivery End" value={contractForm.delivery_period_end} onChange={v => setContractForm(f => ({ ...f, delivery_period_end: v }))} type="date" />
              </div>
              <Field label="Notes" value={contractForm.notes} onChange={v => setContractForm(f => ({ ...f, notes: v }))} />
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setShowAddContract(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">Cancel</button>
              <button onClick={createContract} disabled={!contractForm.contract_number || !contractForm.counter_party || !contractForm.commodity_name || !contractForm.contract_qty_tonnes || !contractForm.price_per_tonne} className="px-4 py-2 bg-green-700 text-white text-sm rounded-lg hover:bg-green-800 disabled:opacity-50">Create Contract</button>
            </div>
          </div>
        </div>
      )}</div>
  );
}
