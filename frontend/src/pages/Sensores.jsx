import { useEffect, useMemo, useState } from "react";
import {
  CircuitBoard,
  LayoutDashboard,
  Cpu,
  MapPin,
  History,
  LogOut,
  Plus,
  Thermometer,
  Droplets,
  Sun,
  Hash,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "./styles/Sensores.css";

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

const sensorToUnit = {
  temperatura: "ºC",
  umidade: "%",
  luminosidade: "lux",
  contador: "uni",
};

const initialForm = {
  sensor: "temperatura",
  unidade_med: "ºC",
  mic: "",
  status: true,
};

export default function Sensores() {
  const navigate = useNavigate();

  const [usuario, setUsuario] = useState(null);
  const [sensores, setSensores] = useState([]);
  const [microcontroladores, setMicrocontroladores] = useState([]);
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
    const [sensoresRes, microRes] = await Promise.all([
      api.get("/api/sensores/?page_size=500"),
      api.get("/api/microcontroladores/?page_size=500"),
    ]);

    setSensores(getResults(sensoresRes.data));
    setMicrocontroladores(getResults(microRes.data));
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
      setErro("Erro ao carregar sensores.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarTudo();
  }, []);

  const resumo = useMemo(() => {
    const total = sensores.length;
    const ativos = sensores.filter((sensor) => sensor.status).length;
    return { total, ativos };
  }, [sensores]);

  function abrirNovoModal() {
    if (!isAdmin) return;
    setEditingId(null);
    setForm(initialForm);
    setFormError("");
    setModalOpen(true);
  }

  function abrirEditarModal(sensor) {
    if (!isAdmin) return;
    setEditingId(sensor.id);
    setForm({
      sensor: sensor.sensor,
      unidade_med: sensor.unidade_med,
      mic: sensor.mic,
      status: sensor.status,
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

    if (name === "sensor") {
      setForm((prev) => ({
        ...prev,
        sensor: value,
        unidade_med: sensorToUnit[value],
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isAdmin) return;

    setFormError("");

    if (!form.mic) {
      setFormError("Selecione um microcontrolador.");
      return;
    }

    const payload = {
      sensor: form.sensor,
      unidade_med: form.unidade_med,
      mic: Number(form.mic),
      status: Boolean(form.status),
    };

    try {
      setSaving(true);

      if (editingId) {
        await api.put(`/api/sensores/${editingId}/`, payload);
      } else {
        await api.post("/api/sensores/", payload);
      }

      await carregarTudo();
      fecharModal();
    } catch (error) {
      if (error.response?.status === 401) {
        logout();
        return;
      }

      if (error.response?.status === 403) {
        setFormError("Seu usuário não tem permissão para alterar sensores.");
        return;
      }

      const data = error.response?.data;
      if (typeof data === "string") {
        setFormError(data);
      } else if (data?.detail) {
        setFormError(data.detail);
      } else {
        setFormError("Não foi possível salvar o sensor.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(sensor) {
    if (!isAdmin) return;

    const confirmar = window.confirm(
      `Deseja excluir o sensor "${formatNome(sensor.sensor)}" de ID #${sensor.id}?`
    );

    if (!confirmar) return;

    try {
      await api.delete(`/api/sensores/${sensor.id}/`);
      await carregarTudo();
    } catch (error) {
      if (error.response?.status === 401) {
        logout();
        return;
      }
      if (error.response?.status === 403) {
        alert("Seu usuário não tem permissão para excluir sensores.");
        return;
      }
      alert("Não foi possível excluir o sensor.");
    }
  }

  return (
    <div className="sensores-layout">
      <aside className="sensores-sidebar">
        <div>
          <div className="sensores-brand">
            <div className="sensores-brand-icon">
              <Cpu size={18} />
            </div>

            <div>
              <h2>TecnoVille</h2>
              <p>Smart City Monitor</p>
            </div>
          </div>

          <nav className="sensores-menu">
            <button className="sensores-menu-item" onClick={() => navigate("/home")}>
              <LayoutDashboard size={16} />
              <span>Dashboard</span>
            </button>

            <button className="sensores-menu-item active">
              <Cpu size={16} />
              <span>Sensores</span>
            </button>

            <button className="sensores-menu-item" onClick={() => navigate("/microcontroladores")}>
              <CircuitBoard  size={16} />
              <span>Microcontroladores</span>
            </button>

            <button
              className="sensores-menu-item"
              onClick={() => navigate("/ambientes")}
            >
              <MapPin size={16} />
              <span>Ambientes</span>
            </button>

            <button
              className="sensores-menu-item"
              onClick={() => navigate("/historico")}
            >
              <History size={16} />
              <span>Histórico</span>
            </button>
          </nav>
        </div>

        <div className="sensores-sidebar-footer">
          <button className="sensores-menu-item logout" onClick={logout}>
            <LogOut size={16} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      <main className="sensores-content">
        <header className="sensores-header">
          <div>
            <h1>Sensores</h1>
            <p>
              {resumo.total} sensores cadastrados · {resumo.ativos} ativos · Perfil:{" "}
              <strong>{usuario?.tipo || "-"}</strong>
            </p>
          </div>

          {isAdmin && (
            <button className="novo-sensor-btn" type="button" onClick={abrirNovoModal}>
              <Plus size={16} />
              <span>Novo Sensor</span>
            </button>
          )}
        </header>

        {loading && <p className="sensores-message">Carregando sensores...</p>}
        {erro && <p className="sensores-message error">{erro}</p>}

        {!loading && !erro && (
          <section className="sensores-panel">
            <div className="sensores-panel-header">
              <h3>Sensores Cadastrados</h3>
            </div>

            <div className="sensores-table-wrapper">
              <table className="sensores-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>TIPO</th>
                    <th>UNIDADE</th>
                    <th>MICROCONTROLADOR</th>
                    <th>MAC ADDRESS</th>
                    <th>STATUS</th>
                    <th>AÇÕES</th>
                  </tr>
                </thead>

                <tbody>
                  {sensores.map((sensor) => (
                    <tr key={sensor.id}>
                      <td>#{sensor.id}</td>

                      <td>
                        <div className="sensor-tipo-cell">
                          <span className="sensor-tipo-icon">
                            {getSensorIcon(sensor.sensor)}
                          </span>
                          <span>{formatNome(sensor.sensor)}</span>
                        </div>
                      </td>

                      <td>{sensor.unidade_med}</td>
                      <td>{sensor.mic_modelo || sensor.mic || "-"}</td>
                      <td>{sensor.mic_mac_address || "-"}</td>

                      <td>
                        <span
                          className={`sensor-status-badge ${
                            sensor.status ? "active" : "inactive"
                          }`}
                        >
                          <span className="status-inline-dot" />
                          {sensor.status ? "Ativo" : "Inativo"}
                        </span>
                      </td>

                      <td>
                        {isAdmin ? (
                          <div className="acoes-cell">
                            <button
                              className="icon-action-btn edit"
                              type="button"
                              title="Editar"
                              onClick={() => abrirEditarModal(sensor)}
                            >
                              <Pencil size={15} />
                            </button>

                            <button
                              className="icon-action-btn delete"
                              type="button"
                              title="Excluir"
                              onClick={() => handleDelete(sensor)}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: "#94a3b8", fontSize: "0.9rem" }}>
                            Somente leitura
                          </span>
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
                <h3>{editingId ? "Editar Sensor" : "Novo Sensor"}</h3>
                <p>
                  {editingId
                    ? "Atualize as informações do sensor"
                    : "Preencha os dados para cadastrar um novo sensor"}
                </p>
              </div>

              <button className="modal-close" type="button" onClick={fecharModal}>
                <X size={18} />
              </button>
            </div>

            <form className="sensor-form" onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-field">
                  <label>Tipo do Sensor</label>
                  <select name="sensor" value={form.sensor} onChange={handleChange}>
                    <option value="temperatura">Temperatura</option>
                    <option value="umidade">Umidade</option>
                    <option value="luminosidade">Luminosidade</option>
                    <option value="contador">Contador</option>
                  </select>
                </div>

                <div className="form-field">
                  <label>Unidade</label>
                  <input name="unidade_med" value={form.unidade_med} readOnly />
                </div>

                <div className="form-field">
                  <label>Microcontrolador</label>
                  <select name="mic" value={form.mic} onChange={handleChange}>
                    <option value="">Selecione</option>
                    {microcontroladores.map((mic) => (
                      <option key={mic.id} value={mic.id}>
                        {mic.modelo} - {mic.mac_address}
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
                    Sensor ativo
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
                  {saving ? "Salvando..." : editingId ? "Salvar Alterações" : "Cadastrar Sensor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}