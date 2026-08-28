/**
 * B1a acceptance criterion: `runAnswerVerifierContract` is real and a live
 * AnswerVerifier implementation (AlwaysTrueVerifier) passes it end to end.
 */

import { describe } from 'vitest';
import { runAnswerVerifierContract } from '../contract';
import { AlwaysTrueVerifier } from '../example';

describe('AlwaysTrueVerifier', () => {
  runAnswerVerifierContract(AlwaysTrueVerifier);
});
