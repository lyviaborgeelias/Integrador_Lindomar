import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  Cpu,
  MapPin,
  History,
  LogOut,
  Download,
  Filter,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "./styles/Historico.css";

function getResults(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

function formatNome(nome) {
  if (!nome) return "-";
  const texto = String(nome);
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function formatDateTime(timestamp) {
  const d = new Date(timestamp);
  if (Number.isNaN(d.getTime())) return "-";

  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function withinPeriod(timestamp, periodo) {
  if (periodo === "all") return true;

  const data = new Date(timestamp);
  const agora = new Date();

  if (Number.isNaN(data.getTime())) return false;

  const diffMs = agora - data;
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffHours / 24;

  if (periodo === "6h") return diffHours <= 6;
  if (periodo === "24h") return diffHours <= 24;
  if (periodo === "7d") return diffDays <= 7;
  if (periodo === "30d") return diffDays <= 30;

  return true;
}

function normalizeHistorico(item) {
  return {
    id: item.id,
    timestamp: item.timestamp || item.data_hora || item.data || null,
    sensorNome:
      item.sensor_nome ||
      item.sensor_tipo ||
      item.sensor_nome_exibicao ||
      item.sensor ||
      "",
    ambiente:
      item.ambiente_descricao ||
      item.ambiente_nome ||
      item.ambiente ||
      item.local_nome ||
      "",
    valor: item.valor ?? item.medicao ?? item.value ?? "",
    unidade:
      item.unidade_med ||
      item.unidade ||
      item.sensor_unidade ||
      "",
  };
}

export default function Historico() {
  const navigate = useNavigate();

  const [historicos, setHistoricos] = useState([]);
  const [ambientes, setAmbientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const [filtroSensor, setFiltroSensor] = useState("all");
  const [filtroPeriodo, setFiltroPeriodo] = useState("all");
  const [filtroAmbiente, setFiltroAmbiente] = useState("all");

  function logout() {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    navigate("/");
  }

  useEffect(() => {
    async function carregarDados() {
      try {
        setLoading(true);
        setErro("");

        const [historicosRes, ambientesRes] = await Promise.all([
          api.get("/api/historicos/?ordering=-timestamp&page=1"),
          api.get("/api/ambientes/?page_size=200"),
        ]);

        const historicosRaw = getResults(historicosRes.data);
        const historicosNormalizados = historicosRaw.map(normalizeHistorico);

        setHistoricos(historicosNormalizados);
        setAmbientes(getResults(ambientesRes.data));
      } catch (error) {
        if (error.response?.status === 401) {
          logout();
          return;
        }
        console.error(error);
        setErro("Erro ao carregar o histórico.");
      } finally {
        setLoading(false);
      }
    }

    carregarDados();
  }, []);

  const historicosFiltrados = useMemo(() => {
    return historicos.filter((item) => {
      const tipoSensor = String(item.sensorNome || "").toLowerCase();
      const ambiente = String(item.ambiente || "");

      const passaSensor =
        filtroSensor === "all" ? true : tipoSensor === filtroSensor;

      const passaPeriodo = withinPeriod(item.timestamp, filtroPeriodo);

      const passaAmbiente =
        filtroAmbiente === "all" ? true : ambiente === filtroAmbiente;

      return passaSensor && passaPeriodo && passaAmbiente;
    });
  }, [historicos, filtroSensor, filtroPeriodo, filtroAmbiente]);

  function exportarCSV() {
    if (!historicosFiltrados.length) return;

    const header = ["Horário", "Sensor", "Ambiente", "Valor", "Unidade"];
    const rows = historicosFiltrados.map((item) => [
      formatDateTime(item.timestamp),
      item.sensorNome || "",
      item.ambiente || "",
      item.valor ?? "",
      item.unidade || "",
    ]);

    const csv = [header, ...rows]
      .map((row) =>
        row.map((col) => `"${String(col).replace(/"/g, '""')}"`).join(";")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "historico_filtrado.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="historico-layout">
      <aside className="historico-sidebar">
        <div>
          <div className="historico-brand">
            <div className="historico-brand-icon">
              <Cpu size={18} />
            </div>

            <div>
              <h2>TecnoVille</h2>
              <p>Smart City Monitor</p>
            </div>
          </div>

          <nav className="historico-menu">
            <button
              className="historico-menu-item"
              onClick={() => navigate("/home")}
            >
              <LayoutDashboard size={16} />
              <span>Dashboard</span>
            </button>

            <button
              className="historico-menu-item"
              onClick={() => navigate("/sensores")}
            >
              <Cpu size={16} />
              <span>Sensores</span>
            </button>

            <button
              className="historico-menu-item"
              onClick={() => navigate("/ambientes")}
            >
              <MapPin size={16} />
              <span>Ambientes</span>
            </button>

            <button className="historico-menu-item active">
              <History size={16} />
              <span>Histórico</span>
            </button>
          </nav>
        </div>

        <div className="historico-sidebar-footer">
          <button className="historico-menu-item logout" onClick={logout}>
            <LogOut size={16} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      <main className="historico-content">
        <header className="historico-header">
          <div>
            <h1>Histórico</h1>
            <p>Visualize os valores filtrados dos sensores</p>
          </div>

          <button className="export-btn" onClick={exportarCSV}>
            <Download size={16} />
            <span>Exportar CSV</span>
          </button>
        </header>

        {loading && <p className="historico-message">Carregando histórico...</p>}
        {erro && <p className="historico-message error">{erro}</p>}

        {!loading && !erro && (
          <>
            <section className="filter-card">
              <div className="filter-icon">
                <Filter size={16} />
              </div>

              <select
                value={filtroSensor}
                onChange={(e) => setFiltroSensor(e.target.value)}
              >
                <option value="all">Todos os sensores</option>
                <option value="temperatura">Temperatura</option>
                <option value="umidade">Umidade</option>
                <option value="luminosidade">Luminosidade</option>
                <option value="contador">Contador</option>
              </select>

              <select
                value={filtroPeriodo}
                onChange={(e) => setFiltroPeriodo(e.target.value)}
              >
                <option value="all">Todo o período</option>
                <option value="6h">Últimas 6h</option>
                <option value="24h">Últimas 24h</option>
                <option value="7d">Últimos 7 dias</option>
                <option value="30d">Últimos 30 dias</option>
              </select>

              <select
                value={filtroAmbiente}
                onChange={(e) => setFiltroAmbiente(e.target.value)}
              >
                <option value="all">Todos os ambientes</option>
                {ambientes.map((ambiente) => (
                  <option key={ambiente.id} value={ambiente.descricao}>
                    {ambiente.descricao}
                  </option>
                ))}
              </select>
            </section>

            <section className="historico-table-card">
              <div className="historico-table-header">
                <h3>Valores Filtrados</h3>
                <span>{historicosFiltrados.length} registro(s)</span>
              </div>

              <div className="historico-table-wrapper">
                <table className="historico-table">
                  <thead>
                    <tr>
                      <th>HORÁRIO</th>
                      <th>SENSOR</th>
                      <th>AMBIENTE</th>
                      <th>VALOR</th>
                    </tr>
                  </thead>

                  <tbody>
                    {historicosFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="empty-cell">
                          Nenhum valor encontrado para esse filtro.
                        </td>
                      </tr>
                    ) : (
                      historicosFiltrados.map((item, index) => (
                        <tr key={`${item.id || index}-${item.timestamp || index}`}>
                          <td>{formatDateTime(item.timestamp)}</td>
                          <td className="sensor-cell">
                            {formatNome(item.sensorNome)}
                          </td>
                          <td>{item.ambiente || "-"}</td>
                          <td className="value-cell">
                            {item.valor} {item.unidade}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}