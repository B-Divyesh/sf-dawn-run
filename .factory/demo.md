# Demo sandbox

Open `/demo` (or `/?demo=1`) to enter the sample run. It starts at tool selection for the current daily seed, so one click begins play.

The persistent banner says “Demo — sample data, nothing is saved.” It includes **Reset demo**, which deletes every `demo:` key, and **Start for real**, which first deletes every `demo:` key and then switches to the normal route.

Demo keys are scoped to `demo:run:<UTC-date>`, `demo:player`, and optional `demo:comparison:<UTC-date>`. Normal runs use `dawn:` keys; demo mode never reads or writes them.

After one controlled online visit, the service worker serves `/demo` and its hashed assets offline from the versioned app-shell cache.
