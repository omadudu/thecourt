import { DurableObject } from "cloudflare:workers";

export type LiveEvent = {
	eventId: number;
	type: string;
	stepName?: string;
	output?: unknown;
	error?: { name: string; message: string };
};

export function courtRoom(namespace: Env["ROOM"], hearingId: string): DurableObjectStub<CourtRoom> {
	// The config names this Worker as a string, so generated stubs do not see CourtRoom's methods.
	return namespace.getByName(hearingId) as DurableObjectStub<CourtRoom>;
}

export class CourtRoom extends DurableObject<Env> {
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		ctx.blockConcurrencyWhile(async () => {
			this.ctx.storage.sql.exec(`
				CREATE TABLE IF NOT EXISTS events (
					event_id INTEGER PRIMARY KEY,
					type TEXT NOT NULL,
					body TEXT NOT NULL
				)
			`);
		});
	}

	async accept(server: WebSocket): Promise<void> {
		this.ctx.acceptWebSocket(server);
		const rows = this.ctx.storage.sql
			.exec<{ body: string }>("SELECT body FROM events ORDER BY event_id ASC")
			.toArray();
		server.send(
			JSON.stringify({
				type: "history",
				events: rows.map((row) => JSON.parse(row.body) as LiveEvent),
			}),
		);
	}

	async publish(event: LiveEvent): Promise<void> {
		this.ctx.storage.sql.exec(
			"INSERT OR IGNORE INTO events (event_id, type, body) VALUES (?, ?, ?)",
			event.eventId,
			event.type,
			JSON.stringify(event),
		);
		const message = JSON.stringify(event);
		for (const socket of this.ctx.getWebSockets()) {
			socket.send(message);
		}
	}
}
