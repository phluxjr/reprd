# reprd

a desktop workbench for hardware repairers. track your fixes, manage parts queues,
log your repair journal, and keep your toolbox organized, all in one place.

built with tauri (rust + web). fast, native, and runs locally.

> [!WARNING]
> reprd is in early alpha. things will break and change. back up your data.

---

<img width="1863" height="984" alt="image" src="https://github.com/user-attachments/assets/91d91120-be74-4e46-92e7-69b5b4426db8" />

---

## who is this for

if you fix computers, phones, or electronics as a hobby or professionally and you are tired of juggling spreadsheets, notes apps, and browser tabs to track your
workflow, reprd is built for you.

---

## what it does

**repair journal**
log every fix with markdown notes, difficulty ratings, repairability scores, and time
tracking. export entries for social media if you share your work online.

**repair queue**
maintain a backlog of upcoming repairs and mods. move items through statuses from
todo to done.

**parts tracker**
track ordered and incoming components with vendor info and tracking links so you
always know what is on its way.

**toolbox organizer**
catalog your screwdrivers, bits, opening tools, and electronics gear. load presets
for different job types.

**stats dashboard**
get a quick overview of completed repairs, active items, parts in transit, and
total costs.

**themes**
ships with gruvbox, catppuccum, tokyonight, nord, dracula, solarized, onedark,
and rose pine.

---

## installation

### pre-built binaries

[coming soon. check the releases page]

### build from source

you will need the tauri prerequisites for your platform. see:
https://tauri.app/start/prerequisites/

```bash
git clone https://github.com/phluxjr/reprd.git
cd reprd
cargo tauri dev        # development
cargo tauri build      # production build
```

---

## license

gpl-v3-or-later. see LICENSE for details.
