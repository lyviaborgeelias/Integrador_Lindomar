import { useEffect, useState } from "react";
import {
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

export default function Ambientes() {
  const navigate = useNavigate();

  const [ambientes, setAmbientes] = useState([]);
  const [locais, setLocais] = useState([]);
  const [responsaveis, setResponsaveis] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    descricao: "",
    local: "",
    responsavel: "",
  });

  async function carregarDados() {
    const [a, l, r] = await Promise.all([
      api.get("/api/ambientes/"),
      api.get("/api/locais/"),
      api.get("/api/responsaveis/"),
    ]);

    setAmbientes(getResults(a.data));
    setLocais(getResults(l.data));
    setResponsaveis(getResults(r.data));
  }

  useEffect(() => {
    carregarDados();
  }, []);

  function logout() {
    localStorage.clear();
    navigate("/");
  }

  function abrirNovo() {
    setEditingId(null);
    setForm({ descricao: "", local: "", responsavel: "" });
    setModalOpen(true);
  }

  function abrirEditar(a) {
    setEditingId(a.id);
    setForm({
      descricao: a.descricao,
      local: a.local,
      responsavel: a.responsavel,
    });
    setModalOpen(true);
  }

  async function salvar(e) {
    e.preventDefault();

    if (editingId) {
      await api.put(`/api/ambientes/${editingId}/`, form);
    } else {
      await api.post("/api/ambientes/", form);
    }

    setModalOpen(false);
    carregarDados();
  }

  async function excluir(id) {
    if (!window.confirm("Excluir ambiente?")) return;

    await api.delete(`/api/ambientes/${id}/`);
    carregarDados();
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div>
          <div className="brand">
            <div className="dashboard-brand-icon">
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
            <button className="active">
              <MapPin size={16} /> Ambientes
            </button>
            <button>
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
            <p>{ambientes.length} ambientes cadastrados</p>
          </div>

          <button className="btn" onClick={abrirNovo}>
            <Plus size={16} /> Novo Ambiente
          </button>
        </header>

        <div className="card">
          <h3>Ambientes Cadastrados</h3>

          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Descrição</th>
                <th>Local</th>
                <th>Responsável</th>
                <th>Contato</th>
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
                  <td>{a.responsavel_contato}</td>

                  <td>
                    <button onClick={() => abrirEditar(a)}>
                      <Pencil size={14} />
                    </button>

                    <button onClick={() => excluir(a.id)}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {modalOpen && (
        <div className="modal">
          <form className="modal-box" onSubmit={salvar}>
            <h3>{editingId ? "Editar" : "Novo"} Ambiente</h3>

            <input
              placeholder="Descrição"
              value={form.descricao}
              onChange={(e) =>
                setForm({ ...form, descricao: e.target.value })
              }
            />

            <select
              value={form.local}
              onChange={(e) =>
                setForm({ ...form, local: e.target.value })
              }
            >
              <option value="">Local</option>
              {locais.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nome}
                </option>
              ))}
            </select>

            <select
              value={form.responsavel}
              onChange={(e) =>
                setForm({ ...form, responsavel: e.target.value })
              }
            >
              <option value="">Responsável</option>
              {responsaveis.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nome}
                </option>
              ))}
            </select>

            <div className="actions">
              <button type="button" onClick={() => setModalOpen(false)}>
                Cancelar
              </button>
              <button type="submit">Salvar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}