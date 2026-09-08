
# 🌊 Capacity Connect

> **A web application addressing key requirements proposed by the Ministry of Earth Sciences (MoES).**

Capacity Connect is a modern web application designed to streamline, display, and manage capacity-building initiatives and data visualization aligned with MoES guidelines.

---

## ✨ Features

- **Interactive Dashboard:** Clean, intuitive UI/UX built for smooth navigation and data display.
- **Dynamic Theming:** Custom dark/light mode toggle with consolidated theme management.
- **AI Integration:** Integrated with Gemini API for smart insights and automated analysis.
- **Modern Tech Stack:** High performance powered by React, TypeScript, and Vite.

---

## 🛠️ Tech Stack

- **Frontend Framework:** React + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **AI Capabilities:** Google Gemini API

---

## 🚀 Getting Started

Follow these steps to set up and run the project locally on your machine.

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed on your system (v18.0 or higher recommended).

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/1-divyanshu-raj/Capacity.git](https://github.com/1-divyanshu-raj/Capacity.git)
   cd Capacity




---

## 🔐 Security

The portal runs its security controls on the server, so the UI keeps its
behaviour while nothing sensitive is decided in the browser.

- **Sign-in is server-authoritative.** All three steps — password, OTP, device
  biometric — are verified by the API; the role lives only in a signed,
  HttpOnly, `SameSite=Strict` session cookie. Editing client state cannot grant
  admin access.
- **No credentials in the bundle.** Demo accounts are served by
  `GET /api/auth/demo-credentials` while `DEMO_MODE=true`, and that endpoint
  returns 404 in production. Set `DEMO_MODE=false` before going live.
- **Certificates are signed.** `POST /api/certificates/issue` returns an
  HMAC-sealed serial and integrity hash; `GET /api/certificates/verify` detects
  any tampering with score, name or serial.
- **Input is validated in depth.** 1 MiB body cap, field-level length and
  character rules, bounded object depth and key count, prototype-pollution
  filtering, plus staged rate limits and account lockout.
- **Hard response headers.** Nonce-based CSP (no `unsafe-inline`),
  `nosniff`, HSTS in production, referrer and permissions policies,
  frame/origin isolation, and `no-store` on API responses.
- **Nothing internal is served over HTTP** — server sources, project manifests,
  config files, dotfiles and source maps all 404, in dev as well as in prod.
- **Dependencies stay clean:** `npm audit --omit=dev` reports 0 vulnerabilities,
  and the AI proxy runs on the `express` already in the stack.

Run the built-in verification suite (50+ assertions over headers, disclosure,
auth, CSRF, rate limits and input validation):

```bash
npm run build
npm run security:check -- --built
```

Full findings, the STRIDE table, accepted risks and the deployment checklist
are in **[SECURITY.md](SECURITY.md)**. Please report vulnerabilities via
`/.well-known/security.txt` rather than a public issue.
