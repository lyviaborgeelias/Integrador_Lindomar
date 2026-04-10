import { useState } from "react";
import { Eye, EyeOff, Cpu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "./styles/Login.css";

export default function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      const response = await api.post("/token/", {
        username: username.trim(),
        password: password.trim(),
      });

      localStorage.setItem("access", response.data.access);
      localStorage.setItem("refresh", response.data.refresh);

      navigate("/home");
    } catch (error) {
      const mensagem =
        error.response?.data?.detail ||
        "Não foi possível entrar. Verifique usuário e senha.";

      setErro(mensagem);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo-box">
          <Cpu size={28} strokeWidth={2.2} />
        </div>

        <h1 className="login-title">TecnoVille</h1>
        <p className="login-subtitle">Smart City Monitor</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label htmlFor="username">Usuário</label>
            <input
              id="username"
              type="text"
              placeholder="Digite seu usuário"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div className="login-field">
            <label htmlFor="password">Senha</label>

            <div className="password-wrapper">
              <input
                id="password"
                type={mostrarSenha ? "text" : "password"}
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />

              <button
                type="button"
                className="toggle-password"
                onClick={() => setMostrarSenha((prev) => !prev)}
                aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
              >
                {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {erro && <div className="login-error">{erro}</div>}

          <button className="login-button" type="submit" disabled={carregando}>
            {carregando ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="login-footer">
          Autenticação JWT integrada com o backend Django
        </p>
      </div>
    </div>
  );
}