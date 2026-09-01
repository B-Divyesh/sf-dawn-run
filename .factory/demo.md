# Demo sandbox

Open `/demo` (or `/?demo=1`) to enter the sample run. It starts at tool selection for the current daily seed, so one click begins play.

The persistent banner says “Demo — sample data, nothing is saved.” It includes **Reset demo**, which deletes the demo run and local demo player code, and **Start for real**, which switches to the normal route.

Demo keys are scoped to `demo:run:<UTC-date>` and `demo:player`. Normal runs use `dawn:run:<UTC-date>` and `dawn:player`; demo mode never reads or writes those keys.
