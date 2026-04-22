import { useEffect, useMemo, useState } from "react";
import {
  CircuitBoard,
  LayoutDashboard,
  Cpu,
  MapPin,
  History,
  LogOut,
  Plus,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "./styles/Microcontroladores.css";

function getResults(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

const initialForm = {
  modelo: "",
  mac_address: "",
  latitude: "",
  longitude: "",
  ambiente: "",
  status: true,
};

export default function Microcontroladores() {
  const navigate = useNavigate();

  const [usuario, setUsuario] = useState(null);
  const [microcontroladores, setMicrocontroladores] = useState([]);
  const [ambientes, setAmbientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState("");

  const isAdmin = usuario?.tipo === "ADMIN";

  function logout() {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    navigate("/");
  }

  async function carregarUsuario() {
    const response = await api.get("/api/me/");
    setUsuario(response.data);
  }

  async function carregarDados() {
    const [microRes, ambientesRes] = await Promise.all([
      api.get("/api/microcontroladores/?page_size=500"),
      api.get("/api/ambientes/?page_size=500"),
    ]);

    setMicrocontroladores(getResults(microRes.data));
    setAmbientes(getResults(ambientesRes.data));
  }

  async function carregarTudo() {
    try {
      setLoading(true);
      setErro("");

      await Promise.all([carregarUsuario(), carregarDados()]);
    } catch (error) {
      if (error.response?.status === 401) {
        logout();
        return;
      }
      setErro("Erro ao carregar microcontroladores.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarTudo();
  }, []);

  const resumo = useMemo(() => {
    const total = microcontroladores.length;
    const ativos = microcontroladores.filter((mic) => mic.status).length;
    return { total, ativos };
  }, [microcontroladores]);

  function abrirNovoModal() {
    if (!isAdmin) return;
    setEditingId(null);
    setForm(initialForm);
    setFormError("");
    setModalOpen(true);
  }

  function abrirEditarModal(micro) {
    if (!isAdmin) return;
    setEditingId(micro.id);
    setForm({
      modelo: micro.modelo || "",
      mac_address: micro.mac_address || "",
      latitude: micro.latitude ?? "",
      longitude: micro.longitude ?? "",
      ambiente: micro.ambiente || "",
      status: micro.status,
    });
    setFormError("");
    setModalOpen(true);
  }

  function fecharModal() {
    if (saving) return;
    setModalOpen(false);
    setEditingId(null);
    setForm(initialForm);
    setFormError("");
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isAdmin) return;

    setFormError("");

    if (!form.ambiente) {
      setFormError("Selecione um ambiente.");
      return;
    }

    const payload = {
      modelo: String(form.modelo || "").trim(),
      mac_address: String(form.mac_address || "").trim(),
      latitude: form.latitude === "" ? null : Number(form.latitude),
      longitude: form.longitude === "" ? null : Number(form.longitude),
      ambiente: Number(form.ambiente),
      status: Boolean(form.status),
    };

    console.log("PAYLOAD ENVIADO:", payload);

    try {
      setSaving(true);

      if (editingId) {
        await api.patch(`/api/microcontroladores/${editingId}/`, payload);
      } else {
        await api.post("/api/microcontroladores/", payload);
      }

      await carregarTudo();
      fecharModal();
    } catch (error) {
      console.error("ERRO COMPLETO:", error);
      console.error("STATUS:", error.response?.status);
      console.error("DATA:", error.response?.data);

      if (error.response?.status === 401) {
        logout();
        return;
      }

      if (error.response?.status === 403) {
        setFormError("Seu usuário não tem permissão para alterar microcontroladores.");
        return;
      }

      const data = error.response?.data;

      if (typeof data === "string") {
        setFormError(data);
      } else if (data?.detail) {
        setFormError(data.detail);
      } else if (data && typeof data === "object") {
        const mensagens = Object.entries(data)
          .map(([campo, valor]) => {
            const texto = Array.isArray(valor) ? valor.join(", ") : String(valor);
            return `${campo}: ${texto}`;
          })
          .join(" | ");
        setFormError(mensagens || "Não foi possível salvar o microcontrolador.");
      } else {
        setFormError("Não foi possível salvar o microcontrolador.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(micro) {
    if (!isAdmin) return;

    const confirmar = window.confirm(
      `Deseja excluir o microcontrolador "${micro.modelo}" de ID #${micro.id}?`
    );

    if (!confirmar) return;

    try {
      await api.delete(`/api/microcontroladores/${micro.id}/`);
      await carregarTudo();
    } catch (error) {
      if (error.response?.status === 401) {
        logout();
        return;
      }
      if (error.response?.status === 403) {
        alert("Seu usuário não tem permissão para excluir microcontroladores.");
        return;
      }
      alert("Não foi possível excluir o microcontrolador.");
    }
  }

  return (
    <div className="micro-layout">
      <aside className="micro-sidebar">
        <div>
          <div className="micro-brand">
            <div className="micro-brand-icon">
              <Cpu size={18} />
            </div>

            <div>
              <h2>TecnoVille</h2>
              <p>Smart City Monitor</p>
            </div>
          </div>

          <nav className="micro-menu">
            <button className="micro-menu-item" onClick={() => navigate("/home")}>
              <LayoutDashboard size={16} />
              <span>Dashboard</span>
            </button>

            <button className="micro-menu-item" onClick={() => navigate("/sensores")}>
              <Cpu size={16} />
              <span>Sensores</span>
            </button>

            <button className="micro-menu-item active">
              <CircuitBoard size={16} />
              <span>Microcontroladores</span>
            </button>

            <button
              className="micro-menu-item"
              onClick={() => navigate("/ambientes")}
            >
              <MapPin size={16} />
              <span>Ambientes</span>
            </button>

            <button
              className="micro-menu-item"
              onClick={() => navigate("/historico")}
            >
              <History size={16} />
              <span>Histórico</span>
            </button>
          </nav>
        </div>

        <div className="micro-sidebar-footer">
          <button className="micro-menu-item logout" onClick={logout}>
            <LogOut size={16} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      <main className="micro-content">
        <header className="micro-header">
          <div>
            <h1>Microcontroladores</h1>
            <p>
              {resumo.total} microcontroladores cadastrados · {resumo.ativos} ativos · Perfil:{" "}
              <strong>{usuario?.tipo || "-"}</strong>
            </p>
          </div>

          {isAdmin && (
            <button className="novo-micro-btn" type="button" onClick={abrirNovoModal}>
              <Plus size={16} />
              <span>Novo Microcontrolador</span>
            </button>
          )}
        </header>

        {loading && <p className="micro-message">Carregando microcontroladores...</p>}
        {erro && <p className="micro-message error">{erro}</p>}

        {!loading && !erro && (
          <section className="micro-panel">
            <div className="micro-panel-header">
              <h3>Microcontroladores Cadastrados</h3>
            </div>

            <div className="micro-table-wrapper">
              <table className="micro-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>MODELO</th>
                    <th>MAC ADDRESS</th>
                    <th>LATITUDE</th>
                    <th>LONGITUDE</th>
                    <th>AMBIENTE</th>
                    <th>STATUS</th>
                    <th>AÇÕES</th>
                  </tr>
                </thead>

                <tbody>
                  {microcontroladores.map((micro) => (
                    <tr key={micro.id}>
                      <td>#{micro.id}</td>
                      <td className="name-cell">{micro.modelo || "-"}</td>
                      <td>{micro.mac_address || "-"}</td>
                      <td>{micro.latitude ?? "-"}</td>
                      <td>{micro.longitude ?? "-"}</td>
                      <td>{micro.ambiente_descricao || micro.ambiente || "-"}</td>

                      <td>
                        <span
                          className={`micro-status-badge ${micro.status ? "active" : "inactive"
                            }`}
                        >
                          <span className="status-inline-dot" />
                          {micro.status ? "Ativo" : "Inativo"}
                        </span>
                      </td>

                      <td>
                        {isAdmin ? (
                          <div className="acoes-cell">
                            <button
                              className="icon-action-btn edit"
                              type="button"
                              title="Editar"
                              onClick={() => abrirEditarModal(micro)}
                            >
                              <Pencil size={15} />
                            </button>

                            <button
                              className="icon-action-btn delete"
                              type="button"
                              title="Excluir"
                              onClick={() => handleDelete(micro)}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        ) : (
                          <span className="somente-leitura">Somente leitura</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>

      {modalOpen && isAdmin && (
        <div className="modal-overlay" onClick={fecharModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>{editingId ? "Editar Microcontrolador" : "Novo Microcontrolador"}</h3>
                <p>
                  {editingId
                    ? "Atualize as informações do microcontrolador"
                    : "Preencha os dados para cadastrar um novo microcontrolador"}
                </p>
              </div>

              <button className="modal-close" type="button" onClick={fecharModal}>
                <X size={18} />
              </button>
            </div>

            <form className="micro-form" onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-field">
                  <label>Modelo</label>
                  <select name="modelo" value={form.modelo} onChange={handleChange}>
                    <option value="">Selecione</option>
                    <option value="ESP32">ESP32</option>
                    <option value="ESP8266">ESP8266</option>
                  </select>
                </div>

                <div className="form-field">
                  <label>MAC Address</label>
                  <input
                    name="mac_address"
                    value={form.mac_address}
                    onChange={handleChange}
                    placeholder="Digite o MAC Address"
                  />
                </div>

                <div className="form-field">
                  <label>Latitude</label>
                  <input
                    name="latitude"
                    type="number"
                    step="any"
                    value={form.latitude}
                    onChange={handleChange}
                    placeholder="Digite a latitude"
                  />
                </div>

                <div className="form-field">
                  <label>Longitude</label>
                  <input
                    name="longitude"
                    type="number"
                    step="any"
                    value={form.longitude}
                    onChange={handleChange}
                    placeholder="Digite a longitude"
                  />
                </div>

                <div className="form-field">
                  <label>Ambiente</label>
                  <select name="ambiente" value={form.ambiente} onChange={handleChange}>
                    <option value="">Selecione</option>
                    {ambientes.map((ambiente) => (
                      <option key={ambiente.id} value={ambiente.id}>
                        {ambiente.descricao}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field checkbox-field">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="status"
                      checked={form.status}
                      onChange={handleChange}
                    />
                    Microcontrolador ativo
                  </label>
                </div>
              </div>

              {formError && <div className="form-error">{formError}</div>}

              <div className="modal-actions">
                <button
                  className="secondary-btn"
                  type="button"
                  onClick={fecharModal}
                  disabled={saving}
                >
                  Cancelar
                </button>

                <button className="primary-btn" type="submit" disabled={saving}>
                  {saving
                    ? "Salvando..."
                    : editingId
                      ? "Salvar Alterações"
                      : "Cadastrar Microcontrolador"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}