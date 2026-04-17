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
import "./styles/Ambientes.css";

function getResults(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

const initialForm = {
  descricao: "",
  local: "",
  responsavel: "",
};

export default function Ambientes() {
  const navigate = useNavigate();

  const [usuario, setUsuario] = useState(null);
  const [ambientes, setAmbientes] = useState([]);
  const [locais, setLocais] = useState([]);
  const [responsaveis, setResponsaveis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState(initialForm);

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
    const [a, l, r] = await Promise.all([
      api.get("/api/ambientes/?page_size=200"),
      api.get("/api/locais/?page_size=200"),
      api.get("/api/responsaveis/?page_size=200"),
    ]);

    setAmbientes(getResults(a.data));
    setLocais(getResults(l.data));
    setResponsaveis(getResults(r.data));
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
      setErro("Erro ao carregar ambientes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarTudo();
  }, []);

  const resumo = useMemo(() => {
    return { total: ambientes.length };
  }, [ambientes]);

  function abrirNovo() {
    if (!isAdmin) return;
    setEditingId(null);
    setForm(initialForm);
    setFormError("");
    setModalOpen(true);
  }

  function abrirEditar(ambiente) {
    if (!isAdmin) return;
    setEditingId(ambiente.id);
    setForm({
      descricao: ambiente.descricao || "",
      local: ambiente.local || "",
      responsavel: ambiente.responsavel || "",
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
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function salvar(e) {
    e.preventDefault();
    if (!isAdmin) return;

    setFormError("");

    if (!form.descricao || !form.local || !form.responsavel) {
      setFormError("Preencha todos os campos.");
      return;
    }

    const payload = {
      descricao: form.descricao,
      local: Number(form.local),
      responsavel: Number(form.responsavel),
    };

    try {
      setSaving(true);

      if (editingId) {
        await api.put(`/api/ambientes/${editingId}/`, payload);
      } else {
        await api.post("/api/ambientes/", payload);
      }

      await carregarTudo();
      fecharModal();
    } catch (error) {
      if (error.response?.status === 401) {
        logout();
        return;
      }

      if (error.response?.status === 403) {
        setFormError("Seu usuário não tem permissão para alterar ambientes.");
        return;
      }

      const data = error.response?.data;
      if (typeof data === "string") {
        setFormError(data);
      } else if (data?.detail) {
        setFormError(data.detail);
      } else {
        setFormError("Não foi possível salvar o ambiente.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function excluir(id) {
    if (!isAdmin) return;

    const confirmar = window.confirm("Excluir ambiente?");
    if (!confirmar) return;

    try {
      await api.delete(`/api/ambientes/${id}/`);
      await carregarTudo();
    } catch (error) {
      if (error.response?.status === 401) {
        logout();
        return;
      }
      if (error.response?.status === 403) {
        alert("Seu usuário não tem permissão para excluir ambientes.");
        return;
      }
      alert("Não foi possível excluir o ambiente.");
    }
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div>
          <div className="brand">
            <div class="dashboard-brand-icon">
              <Cpu size={18} />
            </div>
            <div>
              <h2>TecnoVille</h2>
              <p>Smart City Monitor</p>
            </div>
          </div>

          <nav>
            <button onClick={() => navigate("/home")}>
              <LayoutDashboard size={16} /> Dashboard
            </button>
            <button onClick={() => navigate("/sensores")}>
              <Cpu size={16} /> Sensores
            </button>
            <button onClick={() => navigate("/microcontroladores")}>
              <CircuitBoard  size={16} />
              <span>Microcontroladores</span>
            </button>
            <button className="active">
              <MapPin size={16} /> Ambientes
            </button>
            <button onClick={() => navigate("/historico")}>
              <History size={16} /> Histórico
            </button>
          </nav>
        </div>

        <button onClick={logout}>
          <LogOut size={16} /> Sair
        </button>
      </aside>

      <main className="content">
        <header className="header">
          <div>
            <h1>Ambientes</h1>
            <p>
              {resumo.total} ambientes cadastrados · Perfil:{" "}
              <strong>{usuario?.tipo || "-"}</strong>
            </p>
          </div>

          {isAdmin && (
            <button className="btn" onClick={abrirNovo}>
              <Plus size={16} /> Novo Ambiente
            </button>
          )}
        </header>

        {loading && <p>Carregando ambientes...</p>}
        {erro && <p style={{ color: "red" }}>{erro}</p>}

        {!loading && !erro && (
          <div className="card">
            <h3>Ambientes Cadastrados</h3>

            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Descrição</th>
                  <th>Local</th>
                  <th>Responsável</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {ambientes.map((a) => (
                  <tr key={a.id}>
                    <td>#{a.id}</td>
                    <td>{a.descricao}</td>
                    <td>{a.local_nome}</td>
                    <td>{a.responsavel_nome}</td>

                    <td>
                      {isAdmin ? (
                        <>
                          <button onClick={() => abrirEditar(a)}>
                            <Pencil size={14} />
                          </button>

                          <button onClick={() => excluir(a.id)}>
                            <Trash2 size={14} />
                          </button>
                        </>
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
        )}
      </main>

      {modalOpen && isAdmin && (
        <div className="modal">
          <form className="modal-box" onSubmit={salvar}>
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "12px",
              }}
            >
              <div>
                <h3>{editingId ? "Editar Ambiente" : "Novo Ambiente"}</h3>
              </div>

              <button
                type="button"
                onClick={fecharModal}
                style={{
                  width: 38,
                  height: 38,
                  border: "none",
                  borderRadius: 12,
                  background: "#f1f5f9",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={18} />
              </button>
            </div>

            <input
              name="descricao"
              placeholder="Descrição"
              value={form.descricao}
              onChange={handleChange}
            />

            <select name="local" value={form.local} onChange={handleChange}>
              <option value="">Selecione o local</option>
              {locais.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.local}
                </option>
              ))}
            </select>

            <select
              name="responsavel"
              value={form.responsavel}
              onChange={handleChange}
            >
              <option value="">Selecione o responsável</option>
              {responsaveis.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nome}
                </option>
              ))}
            </select>

            {formError && (
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: 12,
                  background: "#fef2f2",
                  color: "#dc2626",
                  fontSize: "0.9rem",
                }}
              >
                {formError}
              </div>
            )}

            <div className="actions">
              <button type="button" onClick={fecharModal} disabled={saving}>
                Cancelar
              </button>
              <button type="submit" disabled={saving}>
                {saving ? "Salvando..." : editingId ? "Salvar Alterações" : "Salvar"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}