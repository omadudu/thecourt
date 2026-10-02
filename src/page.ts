export function courtPage(): string {
	return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>The Court</title>
  <style>
    :root {
      --ink: #1c1915;
      --muted: #6a6258;
      --paper: #f4efe6;
      --card: #fffdf8;
      --line: #e3d9c8;
      --brass: #8a5a2b;
      --seal: #7a2e2a;
      --ok: #1f6b45;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background:
        radial-gradient(1200px 420px at 10% -10%, #fff 0%, transparent 55%),
        var(--paper);
      color: var(--ink);
      font: 17px/1.5 Georgia, "Iowan Old Style", Palatino, serif;
    }
    .wrap { max-width: 920px; margin: 0 auto; padding: 3.2rem 1.4rem 4.5rem; }
    .kicker {
      margin: 0;
      font: 600 12px/1 ui-sans-serif, system-ui, sans-serif;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--brass);
    }
    h1 {
      margin: 0.35rem 0 0.4rem;
      font-size: clamp(2.6rem, 6vw, 4.4rem);
      font-weight: 500;
      letter-spacing: -0.035em;
      line-height: 0.95;
    }
    .lede { max-width: 38rem; margin: 0; color: #3c362e; font-size: 1.12rem; }
    form {
      display: flex;
      flex-wrap: wrap;
      gap: 0.8rem;
      align-items: flex-end;
      margin: 1.6rem 0 2.2rem;
      padding-bottom: 1.6rem;
      border-bottom: 1px solid var(--line);
    }
    label {
      display: block;
      margin-bottom: 0.35rem;
      font: 600 11px/1 ui-sans-serif, system-ui, sans-serif;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--muted);
    }
    input, button { font: 15px/1.2 ui-sans-serif, system-ui, sans-serif; }
    input {
      width: 16rem;
      padding: 0.72rem 0.75rem;
      border: 1px solid #cfc3ae;
      border-radius: 2px;
      background: white;
      color: var(--ink);
    }
    button {
      padding: 0.78rem 1rem;
      border: 0;
      border-radius: 2px;
      background: var(--ink);
      color: #f7f1e6;
      cursor: pointer;
    }
    section { margin: 1.35rem 0 0; }
    h2 {
      margin: 0 0 0.7rem;
      font: 600 12px/1 ui-sans-serif, system-ui, sans-serif;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--muted);
    }
    .card, .empty, .event, .row {
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: 3px;
    }
    .empty { padding: 1rem 1.1rem; color: var(--muted); }
    .card { padding: 1.1rem 1.15rem 1rem; }
    .card-top, .row {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      align-items: baseline;
    }
    .card-top { margin-bottom: 0.9rem; }
    .status {
      font: 600 11px/1 ui-sans-serif, system-ui, sans-serif;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--brass);
    }
    .status.decided { color: var(--ok); }
    .score {
      font-family: ui-sans-serif, system-ui, sans-serif;
      font-size: 2.4rem;
      font-weight: 560;
      font-variant-numeric: tabular-nums;
      line-height: 1;
      letter-spacing: -0.04em;
    }
    .score span {
      margin-left: 0.15rem;
      font: 12px/1 ui-sans-serif, system-ui, sans-serif;
      letter-spacing: 0.08em;
      color: var(--muted);
    }
    .verdict { margin: 0.7rem 0 0.9rem; }
    dl { display: grid; grid-template-columns: 7.5rem 1fr; gap: 0.35rem 0.8rem; margin: 0; }
    dt {
      font: 600 11px/1.4 ui-sans-serif, system-ui, sans-serif;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--muted);
    }
    dd { margin: 0; overflow-wrap: anywhere; font-family: ui-sans-serif, system-ui, sans-serif; font-size: 0.92rem; }
    .token {
      margin-top: 0.9rem;
      padding-top: 0.8rem;
      border-top: 1px dashed var(--line);
    }
    .token code, .event code {
      font-family: ui-monospace, "Cascadia Code", monospace;
      font-size: 0.82rem;
    }
    #events, #list { display: grid; gap: 0.45rem; }
    .event, .row { padding: 0.7rem 0.85rem; }
    .event strong, .row strong { font-weight: 600; }
    .event p, .row p { margin: 0.2rem 0 0; color: #3c362e; font-size: 0.98rem; }
    .meta { color: var(--muted); font: 12px/1.4 ui-sans-serif, system-ui, sans-serif; }
  </style>
</head>
<body>
  <main class="wrap">
    <p class="kicker">One repository per attempt</p>
    <h1>The Court</h1>
    <p class="lede">Fork a baseline into its own Artifacts repository, push <code>brief.md</code> to <code>main</code>, and watch the bench score it by word count.</p>
    <form id="open">
      <div>
        <label for="baseline">Baseline repository</label>
        <input id="baseline" name="baseline" value="baseline" required>
      </div>
      <button type="submit">Open a hearing</button>
    </form>
    <section>
      <h2>This hearing</h2>
      <div id="current" class="empty">The bench is empty.</div>
    </section>
    <section>
      <h2>Live transcript</h2>
      <div id="events" class="empty">Events arrive here once a hearing is open.</div>
    </section>
    <section>
      <h2>Docket</h2>
      <div id="list" class="empty">Loading the docket…</div>
    </section>
  </main>
  <script>
    const current = document.querySelector("#current");
    const eventsEl = document.querySelector("#events");
    const listEl = document.querySelector("#list");

    function field(label, value) {
      const term = document.createElement("dt");
      term.textContent = label;
      const detail = document.createElement("dd");
      detail.textContent = value || "—";
      return [term, detail];
    }

    function showHearing(hearing) {
      current.className = "card";
      current.replaceChildren();
      const top = document.createElement("div");
      top.className = "card-top";
      const status = document.createElement("div");
      status.className = "status" + (hearing.status === "decided" ? " decided" : "");
      status.textContent = hearing.status || "hearing";
      top.append(status);
      if (typeof hearing.score === "number") {
        const score = document.createElement("div");
        score.className = "score";
        score.append(String(hearing.score));
        const cap = document.createElement("span");
        cap.textContent = "/ 100";
        score.append(cap);
        top.append(score);
      }
      current.append(top);
      if (hearing.verdict) {
        const verdict = document.createElement("p");
        verdict.className = "verdict";
        verdict.textContent = hearing.verdict;
        current.append(verdict);
      }
      const facts = document.createElement("dl");
      for (const pair of [
        field("Baseline", hearing.baseline),
        field("Attempt", hearing.repo_name),
        field("Remote", hearing.remote),
      ]) facts.append(...pair);
      current.append(facts);
      if (hearing.token) {
        const token = document.createElement("div");
        token.className = "token";
        const note = document.createElement("div");
        note.className = "meta";
        note.textContent = "Write token, shown once";
        const code = document.createElement("code");
        code.textContent = hearing.token;
        token.append(note, code);
        current.append(token);
      }
    }

    function eventTitle(event) {
      if (event.type === "history") return "History";
      if (event.stepName) return event.stepName;
      return (event.type || "event").replaceAll("_", " ");
    }

    function eventBody(event) {
      if (event.output && typeof event.output === "object" && event.output.verdict) return event.output.verdict;
      if (event.error && event.error.message) return event.error.message;
      return "";
    }

    function appendEvent(event) {
      if (eventsEl.classList.contains("empty")) {
        eventsEl.className = "";
        eventsEl.replaceChildren();
      }
      const row = document.createElement("article");
      row.className = "event";
      const title = document.createElement("strong");
      title.textContent = eventTitle(event);
      const meta = document.createElement("div");
      meta.className = "meta";
      meta.textContent = event.type || "";
      row.append(title, meta);
      const body = eventBody(event);
      if (body) {
        const copy = document.createElement("p");
        copy.textContent = body;
        row.append(copy);
      }
      eventsEl.append(row);
    }

    function showDocket(rows) {
      if (!rows.length) {
        listEl.className = "empty";
        listEl.textContent = "No hearings on the docket.";
        return;
      }
      listEl.className = "";
      listEl.replaceChildren();
      for (const hearing of rows) {
        const row = document.createElement("article");
        row.className = "row";
        const copy = document.createElement("div");
        const title = document.createElement("strong");
        title.textContent = hearing.verdict || hearing.repo_name;
        const meta = document.createElement("p");
        meta.className = "meta";
        meta.textContent = hearing.repo_name + " · " + hearing.baseline + " · " + hearing.status;
        copy.append(title, meta);
        row.append(copy);
        if (typeof hearing.score === "number") {
          const score = document.createElement("div");
          score.className = "score";
          score.textContent = String(hearing.score);
          row.append(score);
        }
        listEl.append(row);
      }
    }

    async function refresh() {
      const response = await fetch("/hearings");
      const rows = await response.json();
      showDocket(Array.isArray(rows) ? rows : []);
    }

    function watch(id) {
      eventsEl.className = "empty";
      eventsEl.textContent = "Waiting for the workflow…";
      const socket = new WebSocket((location.protocol === "https:" ? "wss://" : "ws://") + location.host + "/hearings/" + id + "/live");
      socket.onmessage = (message) => {
        const data = JSON.parse(message.data);
        if (data.type === "history" && Array.isArray(data.events)) {
          if (!data.events.length) return;
          for (const event of data.events) appendEvent(event);
          return;
        }
        appendEvent(data);
      };
      socket.onerror = () => {
        appendEvent({ type: "socket", stepName: "Live socket failed" });
      };
    }

    document.querySelector("#open").addEventListener("submit", async (event) => {
      event.preventDefault();
      const baseline = new FormData(event.target).get("baseline");
      const response = await fetch("/hearings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ baseline }),
      });
      const body = await response.json();
      if (!response.ok) {
        current.className = "empty";
        current.textContent = body.error || "The hearing did not open.";
        return;
      }
      showHearing(body);
      watch(body.id);
      refresh();
    });

    refresh();
  </script>
</body>
</html>`;
}
