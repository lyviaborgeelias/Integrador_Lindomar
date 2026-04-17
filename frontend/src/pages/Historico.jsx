import { useEffect, useMemo, useState } from "react";
import {
  CircuitBoard,
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

function formatDateToYYYYMMDD(date) {
  const ano = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, "0");
  const dia = String(date.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function normalizeHistorico(item) {
  return {
    id: item.id,
    timestamp: item.timestamp || item.data_hora || item.data || null,
    sensorId: item.sensor_id || item.sensor?.id || item.sensor || null,
    sensorNome:
      item.sensor_nome ||
      item.sensor_tipo ||
      item.sensor_nome_exibicao ||
      item.sensor?.sensor ||
      item.sensor?.nome ||
      "",
    ambiente:
      item.ambiente_descricao ||
      item.ambiente_nome ||
      item.sensor?.mic?.ambiente?.descricao ||
      item.ambiente ||
      item.local_nome ||
      "",
    valor: item.valor ?? item.medicao ?? item.value ?? "",
    unidade:
      item.unidade_med ||
      item.unidade ||
      item.sensor_unidade ||
      item.sensor?.unidade_med ||
      "",
  };
}

async function buscarTodasPaginas(urlInicial) {
  let url = urlInicial;
  let todos = [];

  while (url) {
    const response = await api.get(url);
    const data = response.data;

    if (Array.isArray(data)) {
      todos = [...todos, ...data];
      url = null;
    } else {
      const resultados = Array.isArray(data.results) ? data.results : [];
      todos = [...todos, ...resultados];

      if (data.next) {
        url = data.next.replace("http://127.0.0.1:8000", "");
      } else {
        url = null;
      }
    }
  }

  return todos;
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

  async function carregarAmbientes() {
    try {
      const ambientesRaw = await buscarTodasPaginas("/api/ambientes/?page_size=300");
      setAmbientes(ambientesRaw);
    } catch (error) {
      console.error("Erro ao carregar ambientes:", error);
    }
  }

  async function carregarHistoricos() {
    try {
      setLoading(true);
      setErro("");

      let historicosRaw = [];

      if (filtroPeriodo === "6h") {
        historicosRaw = await buscarTodasPaginas("/api/historicos/recentes/?horas=6&page_size=500");
      } else if (filtroPeriodo === "24h") {
        historicosRaw = await buscarTodasPaginas("/api/historicos/recentes/?horas=24&page_size=500");
      } else {
        const params = new URLSearchParams();
        params.append("ordering", "-timestamp");
        params.append("page_size", "500");

        const hoje = new Date();

        if (filtroPeriodo === "7d") {
          const inicio = new Date();
          inicio.setDate(hoje.getDate() - 7);
          params.append("data_inicio", formatDateToYYYYMMDD(inicio));
          params.append("data_fim", formatDateToYYYYMMDD(hoje));
        }

        if (filtroPeriodo === "30d") {
          const inicio = new Date();
          inicio.setDate(hoje.getDate() - 30);
          params.append("data_inicio", formatDateToYYYYMMDD(inicio));
          params.append("data_fim", formatDateToYYYYMMDD(hoje));
        }

        historicosRaw = await buscarTodasPaginas(`/api/historicos/?${params.toString()}`);
      }

      const historicosNormalizados = historicosRaw.map(normalizeHistorico);
      setHistoricos(historicosNormalizados);
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

  useEffect(() => {
    carregarAmbientes();
  }, []);

  useEffect(() => {
    carregarHistoricos();
  }, [filtroPeriodo]);

  const historicosFiltrados = useMemo(() => {
    return historicos.filter((item) => {
      const tipoSensor = String(item.sensorNome || "").toLowerCase().trim();
      const ambiente = String(item.ambiente || "").trim();

      const passaSensor =
        filtroSensor === "all" ? true : tipoSensor.includes(filtroSensor);

      const passaAmbiente =
        filtroAmbiente === "all" ? true : ambiente === filtroAmbiente;

      return passaSensor && passaAmbiente;
    });
  }, [historicos, filtroSensor, filtroAmbiente]);

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
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <div>
          <div className="dashboard-brand">
            <div className="dashboard-brand-icon">
              <Cpu size={18} />
            </div>

            <div>
              <h2>TecnoVille</h2>
              <p>Smart City Monitor</p>
            </div>
          </div>

          <nav className="dashboard-menu">
            <button className="dashboard-menu-item" onClick={() => navigate("/home")}>
              <LayoutDashboard size={16} />
              <span>Dashboard</span>
            </button>

            <button className="dashboard-menu-item" onClick={() => navigate("/sensores")}>
              <Cpu size={16} />
              <span>Sensores</span>
            </button>

            <button className="sensores-menu-item" onClick={() => navigate("/microcontroladores")}>
              <CircuitBoard  size={16} />
              <span>Microcontroladores</span>
            </button>

            <button className="dashboard-menu-item" onClick={() => navigate("/ambientes")}>
              <MapPin size={16} />
              <span>Ambientes</span>
            </button>

            <button className="dashboard-menu-item active">
              <History size={16} />
              <span>Histórico</span>
            </button>
          </nav>
        </div>

        <div className="dashboard-sidebar-footer">
          <button className="dashboard-menu-item logout" onClick={logout}>
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

        {loading && (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Carregando histórico...</p>
          </div>
        )}

        {erro && !loading && <p className="historico-message error">{erro}</p>}

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