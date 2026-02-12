# @flufy/ipc-contract

&gt; **The single source of truth for IPC communication in the Flufy ecosystem.**

This package defines the shared contracts, types, and constants required for type-safe Inter-Process Communication (IPC) between Flufy applications and the main process. By centralizing these definitions, we ensure end-to-end type safety and prevent drift between client and server implementations.

---

## Why This Package Exists

In a monorepo setup, IPC channels often become a source of runtime errors when method names or payload shapes change in one place but not another. This package solves that by:

- **Acting as the contract layer** — Both the main process and renderer apps import from here
- **Enforcing type safety** — TypeScript validates all IPC calls at compile time
- **Preventing magic strings** — Method names are constants, not hardcoded strings
- **Enabling IDE autocomplete** — Full IntelliSense support for method names and payloads

---

## Installation

```bash
npm install flufy-ipc-contrac
```