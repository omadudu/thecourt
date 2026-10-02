import { HearingError, getHearing, listHearings, openHearing, relayHearing } from "./hearings.ts";
import { courtRoom } from "./room.ts";
import { courtPage } from "./page.ts";

export { CourtRoom } from "./room.ts";
export { HearingWorkflow } from "./workflow.ts";

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);
		const hearingMatch = url.pathname.match(/^\/hearings\/([^/]+)(\/live|\/report)?$/);

		try {
			if (request.method === "GET" && url.pathname === "/") {
				return new Response(courtPage(), {
					headers: { "content-type": "text/html; charset=utf-8" },
				});
			}

			if (request.method === "POST" && url.pathname === "/hearings") {
				const body = await readJson(request);
				const baseline = typeof body.baseline === "string" ? body.baseline : "baseline";
				const hearing = await openHearing(env, baseline);
				ctx.waitUntil(
					relayHearing(env, hearing.id, hearing.workflow_id ?? "").catch((error: unknown) => {
						console.log(
							JSON.stringify({
								event: "hearing.relay_failed",
								hearingId: hearing.id,
								message: error instanceof Error ? error.message : "unknown",
							}),
						);
					}),
				);
				return Response.json(hearing, { status: 201 });
			}

			if (request.method === "GET" && url.pathname === "/hearings") {
				return Response.json(await listHearings(env));
			}

			if (hearingMatch && request.method === "GET") {
				const id = hearingMatch[1] ?? "";
				const action = hearingMatch[2] ?? "";
				const hearing = await getHearing(env, id);
				if (hearing === null) {
					return Response.json({ error: "Hearing not found." }, { status: 404 });
				}
				if (action === "/live") {
					return await acceptLive(request, env, id);
				}
				if (action === "/report") {
					return readReport(env, hearing.report_key);
				}
				return Response.json(hearing);
			}

			return Response.json({ error: "Not found." }, { status: 404 });
		} catch (error) {
			if (error instanceof HearingError) {
				return Response.json({ error: error.message }, { status: error.status });
			}
			console.log(
				JSON.stringify({
					event: "request.failed",
					path: url.pathname,
					message: error instanceof Error ? error.message : "unknown",
				}),
			);
			return Response.json({ error: "The court could not complete that request." }, { status: 500 });
		}
	},
} satisfies ExportedHandler<Env>;

async function acceptLive(request: Request, env: Env, hearingId: string): Promise<Response> {
	if (request.headers.get("Upgrade") !== "websocket") {
		return Response.json({ error: "Expected a WebSocket upgrade." }, { status: 426 });
	}
	const pair = new WebSocketPair();
	const client = pair[0];
	const server = pair[1];
	await courtRoom(env.ROOM, hearingId).accept(server);
	return new Response(null, { status: 101, webSocket: client });
}

async function readReport(env: Env, key: string | null): Promise<Response> {
	if (key === null) {
		return Response.json({ error: "The hearing has no report yet." }, { status: 404 });
	}
	const object = await env.BLOBS.get(key);
	if (object === null) {
		return Response.json({ error: "Report object is missing." }, { status: 404 });
	}
	return new Response(object.body, {
		headers: { "content-type": "application/json" },
	});
}

async function readJson(request: Request): Promise<{ baseline?: unknown }> {
	if (request.headers.get("content-type")?.includes("application/json") !== true) {
		return {};
	}
	const body: unknown = await request.json();
	if (typeof body !== "object" || body === null) {
		throw new HearingError(400, "Expected a JSON object.");
	}
	return body as { baseline?: unknown };
}
