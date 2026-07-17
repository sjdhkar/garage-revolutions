// This app currently supports exactly one garage (confirmed 2026-07-17: no
// multi-garage-per-user support needed). Every collection is still scoped by
// garageId so a second garage can be added later without another schema change,
// but for now there is exactly one id, defined here rather than duplicated
// across every service.
export const DEFAULT_GARAGE_ID = 'main';
