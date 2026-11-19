# Group website - common commands. Run `make help`.
PY      := .venv/bin/python
REPO    ?= $(notdir $(CURDIR))
VISIBILITY ?= public

.DEFAULT_GOAL := help
.PHONY: help install dev papers build preview stop new github deploy update

help: ## Show this help
	@grep -E '^[a-z]+:.*## ' $(MAKEFILE_LIST) | awk -F':.*## ' '{printf "  make %-9s %s\n", $$1, $$2}'

install: ## Install Node and Python dependencies (needs node >= 22, python >= 3.10)
	npm ci || npm install
	python3 -m venv .venv
	$(PY) -m pip install -q -r requirements.txt
	@echo "Done. Next: make dev"

dev: ## Start the local dev server with live reload (http://localhost:4321)
	npx astro dev

stop: ## Stop a running dev / preview server
	-npx astro dev stop
	-npx astro preview stop

new: ## New content file: make new TYPE=member|project|area|position|news|software NAME="Jane Doe"
	$(PY) scripts/new_content.py $(TYPE) "$(NAME)"

papers: ## Refresh src/data/publications.json from arXiv + OpenAlex
	$(PY) scripts/fetch_publications.py

build: ## Build the static site into dist/
	npx astro build

preview: build ## Build, then serve dist/ locally
	npx astro preview

github: ## First-time publish: create GitHub repo, enable Pages, push (REPO=name VISIBILITY=public|private)
	gh repo create $(REPO) --$(VISIBILITY) --source . --remote origin
	gh api -X POST "repos/{owner}/$(REPO)/pages" -f build_type=workflow >/dev/null \
	  || echo "Could not enable Pages automatically: Settings -> Pages -> Source: GitHub Actions"
	git push -u origin main
	@echo "Deploying... watch with: gh run watch"

deploy: ## Push commits to GitHub (CI fetches papers, builds and deploys)
	git push

update: ## Re-run the GitHub workflow now (refresh papers + redeploy without a commit)
	gh workflow run site.yml && sleep 3 && gh run watch
