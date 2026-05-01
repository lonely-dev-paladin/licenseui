# FOX PANEL - JS ARCHITECTURE RULES

This project is separated into 4 JavaScript layers:

---

1. api.js (BACKEND LAYER)

---

ONLY handles:

- fetch requests
- API endpoints
- sending/receiving data from server

RULES:

- NO DOM manipulation allowed
- NO document.getElementById
- NO UI logic
- NO rendering HTML

Example:

- addKeyAPI()
- banAPI()
- getUsersAPI()

---

2. ui.js (UI LAYER)

---

ONLY handles:

- DOM updates
- rendering data
- showing messages
- updating tables/cards

RULES:

- NO fetch requests
- NO API calls
- NO business logic

Example:

- showMessage()
- renderStats()
- renderUsers()

---

3. main.js (CONTROLLER LAYER)

---

ONLY handles:

- connecting API + UI
- event logic (button actions)
- workflow flow

RULES:

- Can call API + UI
- NO direct HTML styling
- NO raw DOM rendering logic
- NO fetch inside UI

Example:

- addKey()
- ban()
- loadStats()

---

4. cosmetics.js (UI EFFECTS LAYER)

---

ONLY handles:

- animations
- sidebar behavior
- transitions
- UI interactions (visual only)

RULES:

- NO API calls
- NO business logic
- NO data processing

Example:

- toggleSidebar()
- click outside behavior
- menu animations

---

## GLOBAL RULES

- Keep files single-responsibility
- If unsure where code goes:
  → API logic → api.js
  → UI display → ui.js
  → actions/flow → main.js
  → animations → cosmetics.js

- Avoid mixing layers
- Keep functions small and reusable
