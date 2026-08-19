/**
 * What the running process actually sees about its database TLS setup.
 *
 * A certificate failure at `/health` reads the same whichever of these is
 * true, and none of them can be told apart from outside the container:
 *
 *   - the connection string's sslmode is not what somebody just set, because
 *     the platform still serves the previous instance until the new one is
 *     healthy;
 *   - NODE_EXTRA_CA_CERTS is unset, so the extra root was never trusted;
 *   - it is set to a path that is not in the image, which Node warns about
 *     and then ignores, leaving an unexplained verification failure.
 *
 * So the process reports its own state next to the error. Deliberately
 * narrow: the sslmode keyword and a state word for the CA file. Never the
 * URL, the host, or the credential — `/health` is unauthenticated.
 */

export type ExtraCaState = 'unset' | 'loaded' | 'missing' | 'not-a-certificate';

export interface DatabaseTlsStatus {
  /** The sslmode from the connection string, or null when it declares none. */
  sslmode: string | null;
  extra_ca: ExtraCaState;
}

/**
 * @param databaseUrl  the connection string as the process has it
 * @param extraCaPath  NODE_EXTRA_CA_CERTS, or undefined when unset
 * @param readFile     injected so this stays pure and testable
 */
export function describeDatabaseTls(
  databaseUrl: string,
  extraCaPath: string | undefined,
  readFile: (p: string) => string,
): DatabaseTlsStatus {
  const sslmode = /[?&]sslmode=([a-z-]+)/i.exec(databaseUrl)?.[1]?.toLowerCase() ?? null;

  let extra_ca: ExtraCaState;
  if (!extraCaPath) {
    extra_ca = 'unset';
  } else {
    try {
      extra_ca = readFile(extraCaPath).includes('BEGIN CERTIFICATE')
        ? 'loaded'
        : 'not-a-certificate';
    } catch {
      extra_ca = 'missing';
    }
  }

  return { sslmode, extra_ca };
}
