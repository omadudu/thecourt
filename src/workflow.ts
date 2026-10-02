import { WorkflowEntrypoint } from "cloudflare:workers";
import type { WorkflowEvent, WorkflowStep } from "cloudflare:workers";
import { judgeBrief } from "./judge.ts";

export type HearingParams = {
	hearingId: string;
	repoName: string;
};

type ReadyRepo = {
	remote: string;
	defaultBranch: string;
};

export class HearingWorkflow extends WorkflowEntrypoint<Env, HearingParams> {
	override async run(event: WorkflowEvent<HearingParams>, step: WorkflowStep) {
		const ready = await step.do(
			"wait until the attempt repo is ready",
			{
				retries: { limit: 5, delay: "2 seconds", backoff: "exponential" },
				timeout: "1 minute",
			},
			async (): Promise<ReadyRepo> => {
				using repo = await this.env.ARTIFACTS.get(event.payload.repoName);
				const info = await repo.info();
				return { remote: info.remote, defaultBranch: info.defaultBranch };
			},
		);

		const brief = await step.do(
			"read brief.md",
			async (): Promise<string | null> => {
				using repo = await this.env.ARTIFACTS.get(event.payload.repoName);
				const file = await repo.readFile({
					ref: ready.defaultBranch,
					path: "brief.md",
				});
				return file === null ? null : await file.text();
			},
		);

		const judgment = await step.do("judge the brief", async () => judgeBrief(brief));

		const reportKey = `hearings/${event.payload.hearingId}/report.json`;
		await step.do("record the verdict", async () => {
			const report = {
				hearingId: event.payload.hearingId,
				repoName: event.payload.repoName,
				remote: ready.remote,
				...judgment,
			};
			await this.env.BLOBS.put(reportKey, JSON.stringify(report), {
				httpMetadata: { contentType: "application/json" },
			});
			await this.env.DB.prepare(
				`UPDATE hearings
				 SET status = 'decided', score = ?, verdict = ?, report_key = ?
				 WHERE id = ?`,
			)
				.bind(judgment.score, judgment.verdict, reportKey, event.payload.hearingId)
				.run();
			return { reportKey };
		});

		return judgment;
	}
}
