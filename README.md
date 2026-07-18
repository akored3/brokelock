# Brokelock

**I'm broke because I have zero discipline. So I built a vault that fines me for touching my own money.**

Brokelock is a commitment savings vault on [Monad](https://monad.xyz). You create a goal, lock MON toward it, and set a deadline. Withdraw after the deadline: free. Rage-quit early: you pay a penalty that goes to your accountability partner (or gets burned, if you trust no one).

## The personal problem

Every savings app I've tried has a "withdraw" button that works instantly, 24/7, at 2am, when I want takeout. Willpower is not a system. Consequences are a system.

## How it works

1. **Create a goal** — name it, set a deadline, set a penalty rate (e.g. 10%), optionally set an accountability partner's address.
2. **Deposit MON** whenever you can. The contract holds it.
3. **After the deadline** — withdraw everything, free.
4. **Before the deadline** — you *can* withdraw, but the penalty is skimmed off and sent to your accountability partner. Your weakness literally pays your friend.

All state is onchain. No backend, no database, no mock data — the contract is the app.

## Stack

- Solidity vault contract, deployed on Monad Testnet
- Frontend: React + viem, talks straight to the chain
- Built during the [Spark hackathon](https://buildanything.so/hackathons/spark)

## Contract

- Network: Monad Testnet
- Address: _(deployment pending)_
