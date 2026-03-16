# 00 — Overview

## Purpose

WhatsApp Text Scheduler is a local macOS desktop application that lets a user create and manage scheduled WhatsApp messages. It automates sending by combining the `whatsapp://` URL scheme (to pre-fill phone number and message text) with AppleScript + System Events (to press Enter at the right time).

## Who It Is For

Single personal user on macOS. No cloud backend, no accounts, no multi-user support. Designed explicitly for personal productivity.

## Problem It Solves

WhatsApp Desktop has no native scheduling feature. This app fills that gap entirely on-device: no third-party services, no unofficial API, no data leaving the machine.

## Core User Journey

1. Open the app.
2. Create a schedule: pick a contact (from macOS Contacts or enter manually), write a message, choose recurrence (one-time, daily, weekly, quarterly, half-yearly, yearly).
3. Leave the app running in the background.
4. At the scheduled time: app opens WhatsApp chat via URL scheme, waits for the configured delay, then presses Enter via AppleScript.
5. Execution is logged in the Activity tab.

## Current Implementation Maturity

**Status: Confirmed from code — production-quality for personal use.**

All core scheduling types, CRUD, logging, settings, contact search, and WhatsApp automation are implemented. The codebase is TypeScript-strict end-to-end, with a proper SQLite schema, in-process cron scheduler, and full IPC bridge between Electron main and React renderer.

## Repo Reality

| Aspect | Reality |
|---|---|
| Core scheduler | Fully implemented |
| SQLite persistence | Fully implemented |
| WhatsApp automation | Fully implemented (URL scheme + AppleScript) |
| macOS Contacts integration | Fully implemented |
| UI (Dashboard, Logs, Settings) | Fully implemented |
| Authentication | Not applicable (local single-user app) |
| Cloud backend | Not present, not needed |
| Tests | Not found in repository |
| Background daemon | Not implemented (app must stay running) |
| Cross-platform support | macOS only (by design) |
| Bulk / group messaging | Not implemented (stated limitation) |
