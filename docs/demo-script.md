# Demo video script (target: 2:30, max 3:00)

Record screen + voiceover. Have the app open, wallet connected, and one goal
pre-created with a deadline ~2 minutes out so the "unlock" happens on camera.

## 0:00–0:20 — The hook (talking over the landing page)

> "I'm broke. Not because I don't earn — because every savings app I've used
> has a withdraw button that works at 2am. So for this hackathon I built
> Brokelock: a vault on Monad that fines me for touching my own savings —
> and pays the fine to my friend."

## 0:20–0:50 — Create a commitment (live)

- Connect wallet (already on Monad testnet).
- Create goal: name "Emergency fund", deadline ~2 minutes from now,
  penalty 10%, partner = your second wallet address.
- Point out the MetaMask confirmation → real transaction on Monad.

> "Name the goal, set the deadline, set the penalty — up to 50% — and pick
> the friend who profits from my weakness. This is a real contract call,
> 400ms blocks, basically instant."

## 0:50–1:30 — Deposit, then rage-quit early (the money shot)

- Deposit 1 MON. Balance updates from chain state.
- Click "Rage-quit early" → show the warning: exact penalty, exact payout.
- Click "Yes, fine me" → confirm in MetaMask.
- Show balance received minus penalty.

> "I stack one MON. Now watch — it's 2am and I want takeout. The vault
> doesn't say no. It says: that'll be 10%. The contract computes the exact
> fine — this number comes from the chain, not the UI — and my friend just
> earned 0.1 MON for doing nothing. Betrayal as a service."

## 1:30–2:00 — Partner claims the fine

- Switch to the partner wallet (second MetaMask account).
- The "Your friends folded" panel shows the claimable penalty.
- Claim it. Balance arrives.

> "On my friend's side, Brokelock shows the bag: my failure, claimable
> on demand. Pull-payment pattern — their claim can never be blocked,
> and they can never touch the principal."

## 2:00–2:30 — Deadline passes, withdraw free + close

- Back on the saver wallet: the pre-made goal flips to UNLOCKED on camera.
- Withdraw with zero penalty.
- Flash the explorer page of the contract (verified source) and the repo.

> "And when I actually hold the line? The lock opens and every token comes
> back to me, free. One small verified contract, no backend, no mock data —
> every number you saw was Monad state. Brokelock: savings with
> consequences. Built solo during Spark."

## Social post draft (X/Twitter)

---

I'm broke because my savings apps all have a frictionless withdraw button.

So I built Brokelock for @monad's Spark hackathon: an onchain vault that
FINES me for touching my savings early — and wires the fine to my friend.

My weakness now has a price and my friend collects it.

[demo video]

Live on Monad testnet → [app URL]
Contract + code → github.com/akored3/brokelock

---

Notes: attach the demo video (or a 30s cut of the rage-quit moment — that's
the viral clip). Tag the hackathon + Monad accounts. Post BEFORE submitting
so you have the post URL for the form.
