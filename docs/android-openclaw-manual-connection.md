# Android OpenClaw Manual Connection Guide

This guide explains how to manually connect an Android OpenClaw client to the SCHOOLME101 gateway scaffold.

## Prerequisites

- A reachable gateway URL
- A provisioned student API key
- `configs/android_openclaw_connection.json` values adapted for your environment

## Manual setup steps

1. Open OpenClaw settings on Android.
2. Set base URL to your deployed gateway.
3. Set header key name to `x-api-key`.
4. Paste the issued student API key.
5. Set default model to `gemini-2.5-flash` and fallback to `gemini-2.5-pro`.
6. Enable MCP integration and point to the same server registry used by gateway configuration.

## Recommended verification checklist

- Send a low-complexity homework request and confirm Flash routing.
- Send a high-complexity reasoning request and confirm Pro routing.
- Confirm grade and subject filters are required by retrieval flow.
- Confirm request failure behavior for missing/invalid API keys.
