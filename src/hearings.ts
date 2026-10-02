import { courtRoom, type LiveEvent } from "./room.ts";
import { ensureHearingsTable } from "./schema.ts";

const namePattern = /^[A-Za-z0-9][A-Za-z0-9._-]{0,62}$/;

export type HearingRow = {
	id: string;
	baseline: string;
	repo_name: string;
	remote: string | null;
	status: string;
	score: number | null;
	verdict: string | null;
	report_key: string | null;
	workflow_id: string | null;
	created_at: string;
};

type OpenedHearing = HearingRow & {
	token: string;
};

export async function openHearing(
	env: Env,
	baselineName: string,
): Promise<OpenedHearing> {
	if (!namePattern.test(baselineName)) {
		throw new HearingError(
			400,
			"Baseline names start with a letter or digit and stay within 63 characters.",
		);
	}

	await ensureHearingsTable(env.DB);
	const baseline = await openBaseline(env.ARTIFACTS, baselineName);
	const id = crypto.randomUUID();
	const repoName = `hearing-${id}`;
	const forked = await forkWhenReady(env.ARTIFACTS, baseline.name, repoName, id);
	const createdAt = new Date().toISOString();

	const instance = await env.HEARING.create({
		params: { hearingId: id, repoName: forked.name },
	});

	await env.DB.prepare(
		`INSERT INTO hearings
		 (id, baseline, repo_name, remote, status, workflow_id, created_at)
		 VALUES (?, ?, ?, ?, 'hearing', ?, ?)`,
	)
		.bind(id, baseline.name, forked.name, forked.remote, instance.id, createdAt)
		.run();

	console.log(
		JSON.stringify({
			event: "hearing.opened",
			hearingId: id,
			baseline: baseline.name,
			repoName: forked.name,
			workflowId: instance.id,
		}),
	);

	return {
		id,
		baseline: baseline.name,
		repo_name: forked.name,
		remote: forked.remote,
		status: "hearing",
		score: null,
		verdict: null,
		report_key: null,
		workflow_id: instance.id,
		created_at: createdAt,
		token: forked.token,
	};
}

export async function listHearings(env: Env): Promise<HearingRow[]> {
	await ensureHearingsTable(env.DB);
	const result = await env.DB.prepare(
		`SELECT id, baseline, repo_name, remote, status, score, verdict, report_key, workflow_id, created_at
		 FROM hearings
		 ORDER BY created_at DESC
		 LIMIT 50`,
	).all<HearingRow>();
	return result.results;
}

export async function getHearing(env: Env, id: string): Promise<HearingRow | null> {
	await ensureHearingsTable(env.DB);
	return env.DB.prepare(
		`SELECT id, baseline, repo_name, remote, status, score, verdict, report_key, workflow_id, created_at
		 FROM hearings
		 WHERE id = ?`,
	)
		.bind(id)
		.first<HearingRow>();
}

export async function relayHearing(
	env: Env,
	hearingId: string,
	workflowId: string,
): Promise<void> {
	const instance = await env.HEARING.get(workflowId);
	const room = courtRoom(env.ROOM, hearingId);
	using subscription = await instance.subscribe({
		filter: [
			"step_started",
			"step_completed",
			"workflow_completed",
			"workflow_errored",
			"workflow_terminated",
		],
	});

	while (true) {
		const result = await subscription.next();
		if (result.done) {
			break;
		}
		const value = result.value;
		const event: LiveEvent = {
			eventId: value.eventId,
			type: value.type,
			...("stepName" in value ? { stepName: value.stepName } : {}),
			...("output" in value ? { output: value.output } : {}),
			...("error" in value ? { error: value.error } : {}),
		};
		await room.publish(event);
	}
}

export class HearingError extends Error {
	constructor(
		readonly status: number,
		message: string,
	) {
		super(message);
	}
}

async function forkWhenReady(
	artifacts: Artifacts,
	baseline: string,
	repoName: string,
	hearingId: string,
) {
	let delay = 200;
	for (let attempt = 0; attempt < 6; attempt++) {
		try {
			using repo = await artifacts.get(baseline);
			return await repo.fork(repoName, {
				description: `Hearing ${hearingId}`,
				defaultBranchOnly: true,
			});
		} catch (error) {
			if (attempt === 5) {
				throw error;
			}
			await new Promise((resolve) => setTimeout(resolve, delay));
			delay *= 2;
		}
	}
	throw new HearingError(503, "The baseline repository was not ready to fork.");
}

async function openBaseline(artifacts: Artifacts, name: string) {
	try {
		using repo = await artifacts.get(name);
		return await repo.info();
	} catch (error) {
		console.log(
			JSON.stringify({
				event: "baseline.create",
				name,
				message: error instanceof Error ? error.message : "missing",
			}),
		);
		try {
			return await artifacts.create(name, {
				description: "Reviewed baseline for court hearings",
				setDefaultBranch: "main",
			});
		} catch {
			using repo = await artifacts.get(name);
			return await repo.info();
		}
	}
}
