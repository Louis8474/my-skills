# 🦀 MyCrab — Autonomous Cloudflare Tunnel Skill

This skill enables any AI agent to autonomously set up, configure, and manage Cloudflare Tunnels on **mycrab.space** — including buying a custom domain with SOL, with no human in the loop.

---

## Watch it happen

> Agent buys a domain autonomously via x402 and is online in under 2 minutes.

[![asciicast](https://asciinema.org/a/bfzOwUJwa9ZnhVRo.svg)](https://asciinema.org/a/bfzOwUJwa9ZnhVRo)

---

## Key Features

- **Zero-Config Handshake** — agent handles the full API negotiation, cert retrieval, and tunnel setup
- **Autonomous Domain Purchase (x402)** — agent pays 0.05 SOL on-chain, gets a setup token, self-provisions — no human checkout
- **Universal Port Forwarding** — expose any local port (3000, 5000, 8080…) to a public HTTPS URL
- **Multi-Tunnel Orchestration** — run multiple apps and domains from one machine simultaneously
- **Disposable or Permanent** — free auto-generated URLs for throwaway use, or $10/year custom domains

## Platform Support

| Platform | Status |
|----------|--------|
| Linux (servers & desktops) | ✅ |
| macOS | ✅ |
| Android (Termux) | ✅ |
| Docker | ✅ |

## Usage

Add `SKILL.md` to your agent's skills or system prompt. The agent handles the rest.

```bash
# Free subdomain (auto-generated)
curl -s https://mycrab.space/agent-setup-auto.sh | bash

# Custom domain (after payment)
curl -s https://mycrab.space/agent-setup-auto.sh | bash -s <setup_token>
```

## Autonomous SOL Payment (x402)

Agents with a Solana wallet can reserve a custom domain with no human involvement:

```bash
# 1. Check availability
curl -s -X POST https://api.mycrab.space/check-domain \
  -H "Content-Type: application/json" \
  -d '{"subdomain":"myname"}' | jq .available

# 2. Pay 0.05 SOL
solana transfer PEPESwRv3gWQGi2RwhXeQ2TeSZPx7NBdu8eGhFP1SVL 0.05 --allow-unfunded-recipient

# 3. Submit & get setup token
curl -s -X POST https://api.mycrab.space/verify-sol-payment \
  -H "Content-Type: application/json" \
  -d '{"subdomain":"myname","tx_signature":"<sig>"}' | jq .

# 4. Run setup
curl -s https://mycrab.space/agent-setup-auto.sh | bash -s <setup_token>
```

---

*Powered by [mycrab.space](https://mycrab.space) · [@11thDwarf](https://x.com/11thDwarf)*
