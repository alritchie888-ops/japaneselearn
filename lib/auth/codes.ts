/** Fixed per-user verification codes for this test system.
 *
 * There is no SMS provider configured, so instead of sending a real code we
 * accept a known fixed code per profile. This module is only imported from
 * server route handlers, so the codes are never shipped to the client. */
export const DEV_CODES: Record<string, string> = {
  alistair: "111111",
  "xu-er": "222222",
  josh: "333333",
}
