/**
 * job-registry — single import point that guarantees the background
 * content jobs are registered with the job-runner. Import this module
 * (side-effectful) before calling startJob/listJobs from routes, the
 * CLI, or the nightly cron chain.
 */

import './content-generation-job';
import './wolfram-verify-job';

export { CONTENT_GENERATION_JOB } from './content-generation-job';
export { WOLFRAM_VERIFY_JOB } from './wolfram-verify-job';
