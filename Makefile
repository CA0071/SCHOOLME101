.PHONY: install build start dev clean docker-build docker-run help

## install   — Install Node.js dependencies
install:
	npm install

## build     — Compile TypeScript to JavaScript
build:
	npm run build

## start     — Start the MCP server (stdio transport)
start: build
	node dist/index.js

## dev       — Run server directly with ts-node (no build step)
dev:
	npx ts-node src/index.ts

## clean     — Remove compiled output
clean:
	npm run clean

## docker-build — Build the Docker image
docker-build:
	docker build -t schoolme101-mcp:latest .

## docker-run   — Run the server in Docker (interactive stdin)
docker-run:
	docker run -i --rm schoolme101-mcp:latest

## help      — Show this help
help:
	@grep -E '^##' Makefile | sed 's/## /  /'
