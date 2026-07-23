# reprd

repair journal, parts tracker, and toolbox organizer for hardware fixers.
built with tauri (rust + web). currently alpha.

---

## what it does

reprd is a local-first desktop app for people who fix things. whether you're
tracking a pile of broken laptops, waiting on aliexpress parts, or just want
to log that tricky screen swap you pulled off, reprd keeps it organized.

- **repair journal** -- log fixes with markdown notes, difficulty ratings,
  repairability scores, time tracking, and a one-click social export
- **repair queue** -- backlog of upcoming jobs with status from todo to done
- **parts tracker** -- ordered/shipped components with vendor info and
  tracking links
- **toolbox organizer** -- catalog your screwdrivers, bits, opening tools,
  and electronics gear with saveable presets
- **stats dashboard** -- completed repairs, active jobs, inbound parts,
  and total cost at a glance

themes: gruvbox, catppuccin mocha, tokyonight, nord, dracula, solarized,
onedark, rose pine.



---

## status

alpha. things will break and change. data structures are not stable yet.
if you try it, back up your data before updating.

---

## requirements

- [rust](https://rustup.rs/)
- tauri v2 prerequisites for your platform:
  - [linux](https://tauri.app/start/prerequisites/#linux)
  - [macos](https://tauri.app/start/prerequisites/#macos)
  - [windows](https://tauri.app/start/prerequisites/#windows)

---

## installation

```bash
git clone https://github.com/phluxjr/reprd.git
cd reprd
cargo tauri dev        # dev mode
cargo tauri build      # production build
```

pre-built binaries are not available yet. you need to build from source.

---

## license

gpl-v3-or-later. see [license](./LICENSE).
