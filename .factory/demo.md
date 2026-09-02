# Demo sandbox

Open `/demo` (or `/?demo=1`) to enter the sample run. The first screen is already in room two with Hook selected and one beacon lit. It shows a valid recorded route, a current score, and two sample standings.

The persistent banner says “Demo — sample data, nothing is saved.” It includes **Reset demo**, which deletes every `demo:` key and rebuilds the bundled sample in memory. **Start for real** deletes every `demo:` key and opens the normal route without creating a `dawn:` key.

Fresh demo entry uses no browser-storage key. Playing or changing a setting can create `demo:settings`, `demo:history`, or `demo:run:<UTC-date>`. Normal runs use `dawn:` keys; demo mode never reads or writes them.

The demo includes a two-row sample leaderboard. **Check sample submission** sends the completed replay for deterministic verification, returns it among the sample rows, and does not retain it. Real score data is never read or written while the demo banner is present.

After one controlled online visit, the service worker serves `/demo` and its hashed assets offline from the versioned app-shell cache. API responses are never cached.
