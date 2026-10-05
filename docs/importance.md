# BAO BAO - Project Importance

## Problem Statement

| # | Problem | Who |
|---|---------|-----|
| P1 | Passengers waste time searching/waiting for rides | Students, workers, elderly |
| P2 | Drivers waste time and fuel searching for passengers | Drivers |
| P3 | Many drivers cannot or will not use smartphone apps | Older/traditional drivers |

## Goals & Non-Goals

### Goals (MVP)
- G1: A passenger can request a ride and get an assigned driver.
- G2: A driver can accept via App, SMS reply, or a dispatcher on their behalf.
- G3: Honest location status (live / last reported / terminal / GPS tracker).
- G4: Admin can manage drivers, vehicles, terminals, zones and monitor rides.

### Non-Goals (MVP)
- Online payments / fare collection
- Hardware GPS trackers
- Delivery, businesses, rewards (later phases)
- Automatic ML demand prediction

## Success Metrics

- Median passenger wait time (request → pickup)
- Request fulfillment rate (% not expired/no-driver)
- Driver acceptance rate by channel
- Active drivers per channel
- Empty-search reduction (survey-based, pilot)

## Non-Functional Requirements

- **Performance:** ride request → first offer sent in < 5 s (p95).
- **Availability:** target 99% during 5:00–21:00 local time.
- **Low bandwidth:** PWA, small bundles, works on 3G.
- **Honesty:** never display "live" for non-live location.
- **Privacy:** minimal location retention; driver contact never exposed to the passenger without consent.
- **Localization:** English + Cebuano/Bisaya strings (i18n from day one).
- **Auditability:** every ride status change recorded with actor and channel.

## Core Principle

**Inclusive technology.** Drivers participate through one of three channels — **App**, **SMS/Call**, or **Terminal Dispatcher**. The passenger always experiences one unified system.

This design ensures that technology doesn't exclude traditional drivers while providing modern convenience to passengers and tech-savvy drivers.
