# Spark Hackathon Submission — Brokelock

## Project name

**Brokelock** — savings with consequences.

## Problem statement

I'm broke. Not because I don't earn — because every savings product I've used
has a frictionless withdraw button that works instantly, at 2am, when I'm one
tap away from ordering takeout with my emergency fund. Willpower is not a
system. Consequences are a system.

## Solution

A commitment savings vault on Monad. You create a goal with a deadline, a
penalty rate (up to 50%), and an accountability partner. Deposit MON whenever
you can — the contract holds it, not you.

- **After the deadline:** withdraw everything, free.
- **Before the deadline:** you *can* rage-quit, but the vault fines you on the
  spot and credits the fine to your partner. Your weakness literally pays your
  friend. No partner set? The penalty is burned forever.

Everything on screen is live contract state. No backend, no database, no mock
data — the contract is the app.

## Why it's not a toy

- Penalties use a **pull-payment pattern** (`claim()`), so a malicious or
  reverting partner contract can never block a saver's withdrawal.
- Checks-effects-interactions everywhere; balances zeroed before transfers.
- `previewWithdraw` gives the frontend exact penalty math from the contract
  itself — the UI never estimates, it asks the chain.
- Live integration test suite (`npm test`) runs every code path against the
  deployed testnet contract: creation, validation reverts, deposit, early
  withdrawal with penalty, partner claim, and free post-deadline withdrawal.

## Links

- **Hosted app:** https://brokelock.vercel.app
- **GitHub:** https://github.com/akored3/brokelock
- **Network:** Monad Testnet (chain id 10143)
- **Contract:** `0x52b4f638698000d41f58ff6448538acd98d06b98` — [MonadScan](https://testnet.monadscan.com/address/0x52b4f638698000d41f58ff6448538acd98d06b98) (source verified, perfect match)
- **Demo video:** _(pending)_
- **Social post:** _(pending)_

## Built with

- Solidity 0.8.28, compiled with solc-js — no framework, the toolchain is five
  small scripts (compile / wallet / deploy / test / verify)
- viem for deployment, testing, and all frontend chain access
- React + Vite frontend
- [monskills](https://github.com/therealharpaljadeja/monskills) for Monad
  network guidance, the faucet API, and the multi-explorer verification API
- [Impeccable](https://github.com/pbakaus/impeccable) design principles for the UI
