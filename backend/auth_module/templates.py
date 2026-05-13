from .security import escape_html


def login_page_html(login_action: str, csrf_token: str, error: str | None = None) -> str:
    safe_error = escape_html(error or "")
    error_block = (
        f'<div class="alert">{safe_error}</div>' if safe_error else ""
    )
    return f"""<!doctype html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Поиск конкурентов и запросов для КП — Авторизация</title>
  <style>
    :root {{
      color-scheme: light dark;
      font-family: Inter, Segoe UI, system-ui, sans-serif;
    }}
    body {{
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: radial-gradient(circle at top, #202938 0%, #111827 45%, #030712 100%);
      color: #e5e7eb;
    }}
    .card {{
      width: min(420px, 90vw);
      background: rgba(17, 24, 39, 0.92);
      border: 1px solid rgba(148, 163, 184, 0.3);
      border-radius: 16px;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35);
      padding: 28px;
    }}
    h1 {{
      margin: 0 0 10px;
      font-size: 1.35rem;
      font-weight: 700;
    }}
    p {{
      margin: 0 0 18px;
      color: #cbd5e1;
      font-size: 0.95rem;
    }}
    label {{
      display: block;
      margin: 12px 0 6px;
      font-size: 0.86rem;
      color: #cbd5e1;
    }}
    input {{
      width: 100%;
      box-sizing: border-box;
      padding: 11px 12px;
      border-radius: 10px;
      border: 1px solid #334155;
      background: #0f172a;
      color: #f8fafc;
      outline: none;
      transition: border-color 0.2s ease;
    }}
    input:focus {{
      border-color: #60a5fa;
    }}
    button {{
      width: 100%;
      margin-top: 16px;
      padding: 12px;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      font-weight: 700;
      color: #f8fafc;
      background: linear-gradient(90deg, #2563eb 0%, #1d4ed8 100%);
    }}
    .hint {{
      margin-top: 10px;
      font-size: 0.8rem;
      color: #94a3b8;
      text-align: center;
    }}
    .alert {{
      margin: 0 0 12px;
      border: 1px solid #7f1d1d;
      background: rgba(127, 29, 29, 0.25);
      color: #fecaca;
      padding: 9px 11px;
      border-radius: 10px;
      font-size: 0.86rem;
    }}
  </style>
</head>
<body>
  <main class="card">
    <h1>Вход в систему</h1>
    <p>Авторизуйтесь для доступа к API и интерфейсу анализа.</p>
    {error_block}
    <form id="authForm" method="post" action="{escape_html(login_action)}" autocomplete="off" novalidate>
      <label for="username">Логин</label>
      <input id="username" name="username" type="text" required maxlength="64" />

      <label for="password">Пароль</label>
      <input id="password" name="password" type="password" required maxlength="128" />

      <input id="csrfToken" name="csrf_token" type="hidden" value="{escape_html(csrf_token)}" />
      <button type="submit">Войти</button>
    </form>
    <div class="hint">Сессия сохраняется на 30 дней.</div>
  </main>
  <script>
    (function() {{
      const form = document.getElementById('authForm');
      const csrfInput = document.getElementById('csrfToken');
      form.addEventListener('submit', function (event) {{
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        if (!username || !password || !csrfInput.value) {{
          event.preventDefault();
          alert('Заполните форму и обновите страницу для CSRF токена.');
        }}
      }});
    }})();
  </script>
</body>
</html>
"""
