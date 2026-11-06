
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  auth,
  login,
  signOut,
  onAuthStateChanged
} from './firebase';
import { api } from './api';
import './style.css';

const names = {
  vendedores: 'Situação de Vendedores',
  crm: 'CRM de Clientes',
  propostas: 'Análise de Propostas',
  gerais: 'Relatórios Gerais'
};

function App() {
  const [user, setUser] = useState(undefined);
  const [me, setMe] = useState(null);
  const [module, setModule] = useState('vendedores');
  const [coord, setCoord] = useState('');
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');

  // Autenticação e consulta das permissões
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setMe(null);
      setRows([]);
      setCoord('');
      setError('');

      if (u) {
        api('/api/me')
          .then(setMe)
          .catch((e) => setError(e.message));
      }
    });
  }, []);

  // Selecionar automaticamente um módulo autorizado
  useEffect(() => {
    if (!me) return;

    const modules = Array.isArray(me.modules)
      ? me.modules
      : [];

    if (!modules.includes(module) && modules.length > 0) {
      setModule(modules[0]);
    }
  }, [me, module]);

  // Consultar os relatórios
  useEffect(() => {
    if (!me) return;

    const modules = Array.isArray(me.modules)
      ? me.modules
      : [];

    if (!modules.includes(module)) return;

    let cancelled = false;

    setRows([]);
    setError('');

    const query = coord
      ? '?coordenacao=' + encodeURIComponent(coord)
      : '';

    api('/api/reports/' + module + query)
      .then((data) => {
        if (!cancelled) {
          setRows(Array.isArray(data.rows) ? data.rows : []);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setRows([]);
          setError(e.message);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [me, module, coord]);

  // Tela de carregamento
  if (user === undefined) {
    return <main>Carregando…</main>;
  }

  // Tela de login
  if (!user) {
    return (
      <main className="login">
        <h1>Central Comercial</h1>

        <p>Acesso exclusivo para usuários autorizados.</p>

        <button
          onClick={() =>
            login().catch((e) => setError(e.message))
          }
        >
          Entrar com Google
        </button>

        {error && <p className="error">{error}</p>}
      </main>
    );
  }

  // Validação do acesso pela API
  if (!me) {
    return (
      <main>
        <h1>Central Comercial</h1>

        <p>{error || 'Validando autorização…'}</p>

        <p className="hint">
          Diagnóstico: autenticação Google concluída;
          aguardando resposta de /api/me.
          O token não é exibido.
        </p>

        <button onClick={() => signOut(auth)}>
          Sair
        </button>
      </main>
    );
  }

  const authorizedModules = Array.isArray(me.modules)
    ? me.modules
    : [];

  const coordenacoes = Array.isArray(me.coordenacoes)
    ? me.coordenacoes
    : [];

  return (
    <>
      <header>
        <strong>Central Comercial</strong>

        <span>
          {user.email}{' '}
          <button onClick={() => signOut(auth)}>
            Sair
          </button>
        </span>
      </header>

      <main>
        <nav>
          {Object.entries(names)
            .filter(([key]) => authorizedModules.includes(key))
            .map(([key, name]) => (
              <button
                key={key}
                className={module === key ? 'active' : ''}
                onClick={() => {
                  setModule(key);
                  setCoord('');
                }}
              >
                {name}
              </button>
            ))}
        </nav>

        <section>
          <h1>{names[module] || 'Central Comercial'}</h1>

          <label>
            Coordenação{' '}

            <select
              value={coord}
              onChange={(e) => setCoord(e.target.value)}
            >
              <option value="">
                Todas autorizadas
              </option>

              {coordenacoes.map((c) => (
                <option
                  key={c.id}
                  value={c.codigo}
                >
                  {c.nome}
                </option>
              ))}
            </select>
          </label>

          {error && (
            <p className="error">{error}</p>
          )}

          <p>{rows.length} registros</p>

          <div className="scroll">
            <table>
              <thead>
                <tr>
                  {rows.length > 0 &&
                    Object.keys(rows[0]).map((key) => (
                      <th key={key}>
                        {key}
                      </th>
                    ))}
                </tr>
              </thead>

              <tbody>
                {rows.map((row, index) => (
                  <tr key={index}>
                    {Object.values(row).map((value, j) => (
                      <td key={j}>
                        {value == null
                          ? '—'
                          : typeof value === 'object'
                            ? JSON.stringify(value)
                            : String(value)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="hint">
            Os demais módulos serão ativados após
            a definição de suas bases.
            Exportação PDF será implementada no backend,
            com validação de permissões.
          </p>
        </section>
      </main>
    </>
  );
}

createRoot(
  document.getElementById('root')
).render(<App />);
