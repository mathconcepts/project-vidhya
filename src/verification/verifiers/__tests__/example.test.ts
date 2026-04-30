/**
 * Live contract test for the AlwaysTrueVerifier reference example.
 *
 * If this test breaks, the AnswerVerifier interface drifted from what
 * EXTENDING.md tells engineers to copy. Update both together.
 */

import { runAnswerVerifierContract } from '../contract';
import { alwaysTrueVerifier } from '../example';

runAnswerVerifierContract(alwaysTrueVerifier);
