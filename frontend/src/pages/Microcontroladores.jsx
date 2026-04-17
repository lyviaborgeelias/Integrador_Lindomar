import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  Cpu,
  MapPin,
  History,
  LogOut,
  Plus,
  Pencil,
  Trash2,
  Search,
  RefreshCcw,
  X,
  Save,
  CircuitBoard,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "./styles/Microcontroladores.css";

const ENDPOINT = "/api/mics/";

function getResults(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
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
      url = data.next
        ? data.next.replace("http://127.0.0.1:8000", "")
        : null;
    }
  }

  return todos;
}

function normalizeMic(item) {
  return {
    id: item.id,
    nome:
      item.nome ||
      item.descricao ||
      item.identificacao ||
      item.mic ||
      `Microcontrolador ${item.id}`,
    mac: item.mac || item.mac_address || "",
    ip: item.ip || item.ip_address || "",
    ambienteId:
      item.ambiente_id ||
      item.ambiente?.id ||
      item.ambiente ||
      "",
    ambienteNome:
      item.ambiente_nome ||
      item.ambiente?.descricao ||
      item.local_nome ||
      "",
    status:
      typeof item.status === "boolean"
        ? item.status
        : item.ativo === true
        ? true
        : false,
  };
}

function getUserType() {
  return (
    localStorage.getItem("tipo_usuario") ||
    localStorage.getItem("user_tipo") ||
    localStorage.getItem("tipo") ||
    localStorage.getItem("role") ||
    ""
  ).toLowerCase();
}

function isAdminUser() {
  const tipo = getUserType();
  const adminFlag = localStorage.getItem("is_admin");

  return (
    tipo === "admin" ||
    tipo === "administrador" ||
    tipo === "adm" ||
    adminFlag === "true"
  );
}

function buildPayload(form) {
  return {
    nome: form.nome,
    mac: form.mac,
    ip: form.ip,
    ambiente: form.ambienteId || null,
    status: form.status,
  };
}

const initialForm = {
  nome: "",
  mac: "",
  ip: "",
  ambienteId: "",
  status: true,
};

export default function Microcontroladores() {
  const navigate = useNavigate();

  const [microcontroladores, setMicrocontroladores] = useState([]);
  const [ambientes, setAmbientes] = useState([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const [modalAberto, setModalAberto] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [registroAtual, setRegistroAtual] = useState(null);
  const [form, setForm] = useState(initialForm);

  const isAdmin = isAdminUser();

  function logout() {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    navigate("/");
  }

  async function carregarDados() {
    try {
      setLoading(true);
      setErro("");

      const [mics, ambientesLista] = await Promise.all([
        buscarTodasPaginas(`${ENDPOINT}?page_size=300`),
        buscarTodasPaginas("/api/ambientes/?page_size=300"),
      ]);

      setMicrocontroladores(mics.map(normalizeMic));
      setAmbientes(ambientesLista);
    } catch (error) {
      if (error.response?.status === 401) {
        logout();
        return;
      }

      console.error(error);
      setErro("Erro ao carregar os microcontroladores.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  function abrirNovo() {
    setModoEdicao(false);
    setRegistroAtual(null);
    setForm(initialForm);
    setModalAberto(true);
  }

  function abrirEdicao(item) {
    setModoEdicao(true);
    setRegistroAtual(item);
    setForm({
      nome: item.nome || "",
      mac: item.mac || "",
      ip: item.ip || "",
      ambienteId: item.ambienteId || "",
      status: !!item.status,
    });
    setModalAberto(true);
  }

  function fecharModal() {
    if (salvando) return;
    setModalAberto(false);
    setModoEdicao(false);
    setRegistroAtual(null);
    setForm(initialForm);
  }

  function atualizarCampo(campo, valor) {
    setForm((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  }

  async function salvarMicrocontrolador(e) {
    e.preventDefault();

    try {
      setSalvando(true);

      const payload = buildPayload(form);

      if (modoEdicao && registroAtual?.id) {
        await api.put(`${ENDPOINT}${registroAtual.id}/`, payload);
      } else {
        await api.post(ENDPOINT, payload);
      }

      await carregarDados();
      fecharModal();
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar o microcontrolador. Verifique os campos e a API.");
    } finally {
      setSalvando(false);
    }
  }

  async function excluirMicrocontrolador(item) {
    const confirmar = window.confirm(
      `Deseja excluir o microcontrolador "${item.nome}"?`
    );

    if (!confirmar) return;

    try {
      await api.delete(`${ENDPOINT}${item.id}/`);
      await carregarDados();
    } catch (error) {
      console.error(error);
      alert("Erro ao excluir o microcontrolador.");
    }
  }

  const microcontroladoresFiltrados = useMemo(() => {
    const termo = busca.toLowerCase().trim();

    if (!termo) return microcontroladores;

    return microcontroladores.filter((item) => {
      const nome = String(item.nome || "").toLowerCase();
      const mac = String(item.mac || "").toLowerCase();
      const ip = String(item.ip || "").toLowerCase();
      const ambiente = String(item.ambienteNome || "").toLowerCase();

      return (
        nome.includes(termo) ||
        mac.includes(termo) ||
        ip.includes(termo) ||
        ambiente.includes(termo)
      );
    });
  }, [microcontroladores, busca]);

  return (
    <div className="micro-layout">
      <aside className="sidebar">
        <div>
          <div className="brand">
            <div className="brand-icon">
              <Cpu size={18} />
            </div>

            <div>
              <h2>TecnoVille</h2>
              <p>Smart City Monitor</p>
            </div>
          </div>

          <nav className="menu">
            <button className="menu-item" onClick={() => navigate("/home")}>
              <LayoutDashboard size={16} />
              <span>Dashboard</span>
            </button>

            <button className="menu-item" onClick={() => navigate("/sensores")}>
              <Cpu size={16} />
              <span>Sensores</span>
            </button>

            <button
              className="menu-item active"
              onClick={() => navigate("/microcontroladores")}
            >
              <CircuitBoard size={16} />
              <span>Microcontroladores</span>
            </button>

            <button className="menu-item" onClick={() => navigate("/ambientes")}>
              <MapPin size={16} />
              <span>Ambientes</span>
            </button>

            <button className="menu-item" onClick={() => navigate("/historico")}>
              <History size={16} />
              <span>Histórico</span>
            </button>
          </nav>
        </div>

        <div className="sidebar-footer">
          <button className="menu-item logout" onClick={logout}>
            <LogOut size={16} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      <main className="micro-content">
        <header className="micro-header">
          <div>
            <h1>Microcontroladores</h1>
            <p>Gerencie os microcontroladores cadastrados no sistema</p>
          </div>

          <div className="micro-header-actions">
            <button className="reload-btn" onClick={carregarDados}>
              <RefreshCcw size={16} />
              <span>Atualizar</span>
            </button>

            {isAdmin && (
              <button className="new-btn" onClick={abrirNovo}>
                <Plus size={16} />
                <span>Novo microcontrolador</span>
              </button>
            )}
          </div>
        </header>

        {loading && (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Carregando microcontroladores...</p>
          </div>
        )}

        {erro && !loading && <p className="micro-message error">{erro}</p>}

        {!loading && !erro && (
          <section className="micro-table-card">
            <div className="micro-table-header">
              <h3>Lista de Microcontroladores</h3>
              <span>{microcontroladoresFiltrados.length} registro(s)</span>
            </div>

            <div className="micro-table-wrapper">
              <table className="micro-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>NOME</th>
                    <th>MAC</th>
                    <th>IP</th>
                    <th>AMBIENTE</th>
                    <th>STATUS</th>
                    {isAdmin && <th>AÇÕES</th>}
                  </tr>
                </thead>

                <tbody>
                  {microcontroladoresFiltrados.length === 0 ? (
                    <tr>
                      <td
                        colSpan={isAdmin ? "7" : "6"}
                        className="empty-cell"
                      >
                        Nenhum microcontrolador encontrado.
                      </td>
                    </tr>
                  ) : (
                    microcontroladoresFiltrados.map((item) => (
                      <tr key={item.id}>
                        <td>{item.id}</td>
                        <td className="name-cell">{item.nome || "-"}</td>
                        <td>{item.mac || "-"}</td>
                        <td>{item.ip || "-"}</td>
                        <td>{item.ambienteNome || "-"}</td>
                        <td>
                          <span
                            className={`status-badge ${
                              item.status ? "ativo" : "inativo"
                            }`}
                          >
                            {item.status ? "Ativo" : "Inativo"}
                          </span>
                        </td>

                        {isAdmin && (
                          <td>
                            <div className="action-buttons">
                              <button
                                className="icon-btn edit"
                                onClick={() => abrirEdicao(item)}
                                title="Editar"
                              >
                                <Pencil size={16} />
                              </button>

                              <button
                                className="icon-btn delete"
                                onClick={() => excluirMicrocontrolador(item)}
                                title="Excluir"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>

      {modalAberto && (
        <div className="modal-overlay" onClick={fecharModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {modoEdicao ? "Editar microcontrolador" : "Novo microcontrolador"}
              </h3>

              <button className="close-btn" onClick={fecharModal}>
                <X size={18} />
              </button>
            </div>

            <form className="modal-form" onSubmit={salvarMicrocontrolador}>
              <div className="form-group">
                <label>Nome</label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => atualizarCampo("nome", e.target.value)}
                  placeholder="Digite o nome"
                  required
                />
              </div>

              <div className="form-group">
                <label>MAC</label>
                <input
                  type="text"
                  value={form.mac}
                  onChange={(e) => atualizarCampo("mac", e.target.value)}
                  placeholder="Digite o MAC"
                />
              </div>

              <div className="form-group">
                <label>IP</label>
                <input
                  type="text"
                  value={form.ip}
                  onChange={(e) => atualizarCampo("ip", e.target.value)}
                  placeholder="Digite o IP"
                />
              </div>

              <div className="form-group">
                <label>Ambiente</label>
                <select
                  value={form.ambienteId}
                  onChange={(e) => atualizarCampo("ambienteId", e.target.value)}
                >
                  <option value="">Selecione um ambiente</option>
                  {ambientes.map((ambiente) => (
                    <option key={ambiente.id} value={ambiente.id}>
                      {ambiente.descricao}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={form.status}
                    onChange={(e) => atualizarCampo("status", e.target.checked)}
                  />
                  Microcontrolador ativo
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={fecharModal}
                >
                  Cancelar
                </button>

                <button type="submit" className="primary-btn" disabled={salvando}>
                  <Save size={16} />
                  <span>{salvando ? "Salvando..." : "Salvar"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}