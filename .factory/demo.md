# Demo sandbox

Open `/demo` (or `/?demo=1`) to enter the sample run. It starts at a player-specific three-tool offer for the current daily map.

The persistent banner says “Demo — sample data, nothing is saved.” It includes **Reset demo**, which deletes every `demo:` key, and **Start for real**, which first deletes every `demo:` key and then switches to the normal route.

Demo keys are scoped to `demo:player`, `demo:settings`, `demo:history`, and `demo:run:<UTC-date>`. Normal runs use `dawn:` keys; demo mode never reads or writes them.

The demo includes a two-row sample leaderboard. **Check sample submission** sends the completed replay for deterministic verification, returns it among the sample rows, and does not retain it. Real score data is never read or written while the demo banner is present.

After one controlled online visit, the service worker serves `/demo` and its hashed assets offline from the versioned app-shell cache. API responses are never cached.
