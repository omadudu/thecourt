import { bindings, defineConfig, exports } from "cf/config";
import * as entrypoint from "./src/index.ts" with { type: "cf-worker" };

export default defineConfig(({ isPreview }) => {
	const suffix = isPreview ? "-preview" : "";
	const hearingName = `the-court-hearing${suffix}`;

	return {
		worker: {
			name: "the-court",
			compatibilityDate: "2026-10-02",
			entrypoint,
			observability: {
				enabled: true,
				traces: { enabled: true },
			},
			exports: {
				CourtRoom: exports.durableObject({ storage: "sqlite" }),
				HearingWorkflow: exports.workflow({ name: hearingName }),
			},
			env: {
				ARTIFACTS: bindings.artifacts({ namespace: `court${suffix}` }),
				DB: bindings.d1({ name: `the-court${suffix}` }),
				BLOBS: bindings.r2({ name: `the-court-blobs${suffix}` }),
				ROOM: bindings.durableObject({
					worker: "the-court",
					exportName: "CourtRoom",
				}),
				HEARING: bindings.workflow({
					name: hearingName,
					worker: "the-court",
					exportName: "HearingWorkflow",
				}),
			},
		},
	};
});
