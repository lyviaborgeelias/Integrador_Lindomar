import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  Cpu,
  MapPin,
  History,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Thermometer,
  Droplets,
  Sun,
  Hash,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "./styles/Home.css";

function getResults(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

function getSensorIcon(nome) {
  switch ((nome || "").toLowerCase()) {
    case "temperatura":
      return <Thermometer size={16} />;
    case "umidade":
      return <Droplets size={16} />;
    case "luminosidade":
      return <Sun size={16} />;
    case "contador":
      return <Hash size={16} />;
    default:
      return <Cpu size={16} />;
  }
}

function formatNome(nome) {
  if (!nome) return "";
  return nome.charAt(0).toUpperCase() + nome.slice(1);
}

export default function Home() {
  const navigate = useNavigate();

  const [sensores, setSensores] = useState([]);
  const [historicos, setHistoricos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

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

        const [sensoresRes, historicosRes] = await Promise.all([
          api.get("/api/sensores/?page_size=100"),
          api.get("/api/historicos/?ordering=-timestamp&page_size=200"),
        ]);

        setSensores(getResults(sensoresRes.data));
        setHistoricos(getResults(historicosRes.data));
      } catch (error) {
        if (error.response?.status === 401) {
          logout();
          return;
        }
        setErro("Erro ao carregar dados do dashboard.");
      } finally {
        setLoading(false);
      }
    }

    carregarDados();
  }, []);

  const resumo = useMemo(() => {
    const total = sensores.length;
    const ativos = sensores.filter((s) => s.status).length;
    const inativos = sensores.filter((s) => !s.status).length;
    const leituras = historicos.length;

    return [
      {
        icon: <Cpu size={18} />,
        value: total,
        label: "Total de Sensores",
        variant: "blue",
      },
      {
        icon: <CheckCircle2 size={18} />,
        value: ativos,
        label: "Ativos",
        variant: "green",
      },
      {
        icon: <AlertTriangle size={18} />,
        value: inativos,
        label: "Inativos",
        variant: "yellow",
      },
      {
        icon: <Activity size={18} />,
        value: leituras,
        label: "Leituras recentes",
        variant: "purple",
      },
    ];
  }, [sensores, historicos]);

  const categoriasSensores = useMemo(() => {
    const grupos = {};

    sensores.forEach((sensor) => {
      const tipo = sensor.sensor?.toLowerCase();

      if (!grupos[tipo]) {
        grupos[tipo] = {
          tipo,
          unidade: sensor.unidade_med || "-",
          total: 0,
          ativos: 0,
          microcontroladores: new Set(),
          macs: new Set(),
        };
      }

      grupos[tipo].total += 1;

      if (sensor.status) {
        grupos[tipo].ativos += 1;
      }

      if (sensor.mic_mac_address) {
        grupos[tipo].macs.add(sensor.mic_mac_address);
      }

      if (sensor.mic) {
        grupos[tipo].microcontroladores.add(sensor.mic);
      }
    });

    const ordem = ["temperatura", "umidade", "luminosidade", "contador"];

    return Object.values(grupos)
      .map((grupo) => ({
        ...grupo,
        status: grupo.ativos > 0 ? "Ativo" : "Inativo",
        microcontroladorTexto:
          grupo.microcontroladores.size > 0
            ? `${grupo.microcontroladores.size} microcontrolador(es)`
            : "-",
        macTexto:
          grupo.macs.size > 0
            ? Array.from(grupo.macs)[0]
            : "-",
      }))
      .sort((a, b) => ordem.indexOf(a.tipo) - ordem.indexOf(b.tipo));
  }, [sensores]);

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
            <button className="dashboard-menu-item active">
              <LayoutDashboard size={16} />
              <span>Dashboard</span>
            </button>

            <button className="sensores-menu-item" onClick={() => navigate("/sensores")}>
              <Cpu size={16} />
              <span>Sensores</span>
            </button>

            <button className="sensores-menu-item" onClick={() => navigate("/ambientes")}>
              <MapPin size={16} />
              <span>Ambientes</span>
            </button>

            <button className="sensores-menu-item" onClick={() => navigate("/historico")}>
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

      <main className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <h1>Dashboard</h1>
            <p>Visão geral dos sensores da TecnoVille</p>
          </div>
        </header>

        {loading && <p className="dashboard-message">Carregando dados...</p>}
        {erro && <p className="dashboard-message error">{erro}</p>}

        {!loading && !erro && (
          <>
            <section className="dashboard-summary-grid">
              {resumo.map((item, index) => (
                <div className="dashboard-summary-card" key={index}>
                  <div className={`summary-icon ${item.variant}`}>{item.icon}</div>

                  <div className="summary-info">
                    <strong>{item.value}</strong>
                    <span>{item.label}</span>
                  </div>
                </div>
              ))}
            </section>

            <section className="dashboard-panel">
              <div className="dashboard-panel-header">
                <div>
                  <h3>Sensores Cadastrados</h3>
                  <p>Categorias de sensores sem repetição</p>
                </div>

                <div className="dashboard-badge">
                  {categoriasSensores.length} categorias
                </div>
              </div>

              <div className="sensor-table-wrapper">
                <table className="sensor-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>TIPO</th>
                      <th>UNIDADE</th>
                      <th>MICROCONTROLADOR</th>
                      <th>MAC ADDRESS</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoriasSensores.map((sensor, index) => (
                      <tr key={sensor.tipo}>
                        <td>#{index + 1}</td>
                        <td>
                          <div className="sensor-type-cell">
                            <span className="sensor-type-icon">
                              {getSensorIcon(sensor.tipo)}
                            </span>
                            <span>{formatNome(sensor.tipo)}</span>
                          </div>
                        </td>
                        <td>{sensor.unidade}</td>
                        <td>{sensor.microcontroladorTexto}</td>
                        <td>{sensor.macTexto}</td>
                        <td>
                          <span
                            className={`sensor-status-badge ${sensor.status === "Ativo" ? "active" : "inactive"
                              }`}
                          >
                            <span className="status-inline-dot" />
                            {sensor.status}
                          </span>
                        </td>
                      </tr>
                    ))}
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