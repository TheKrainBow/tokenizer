# ---------- Config ----------
TOOLS_DIR      := .tools
NODE_VERSION   := v22.13.1
NODE_PLATFORM  := linux-x64
NODE_TARBALL   := node-$(NODE_VERSION)-$(NODE_PLATFORM).tar.xz
NODE_URL       := https://nodejs.org/dist/$(NODE_VERSION)/$(NODE_TARBALL)
NODE_DIR       := $(TOOLS_DIR)/node-$(NODE_VERSION)-$(NODE_PLATFORM)

LOCAL_BIN      := $(NODE_DIR)/bin
NODE_BIN       := $(LOCAL_BIN)/node
NPM_BIN        := $(LOCAL_BIN)/npm
NPX_BIN        := $(LOCAL_BIN)/npx

# Run commands with local Node first in PATH
RUN_LOCAL      := PATH="$(LOCAL_BIN):$$PATH"

# Marker file to know if install was done
INSTALL_MARKER := .installed

# Prefer system npm only if it exists AND node is new enough, else use local.
SYSTEM_NODE := $(shell command -v node 2>/dev/null)
SYSTEM_NPM  := $(shell command -v npm 2>/dev/null)

# Default to local (safe)
NPM := $(RUN_LOCAL) $(NPM_BIN)
HARDHAT := $(RUN_LOCAL) $(NPX_BIN) hardhat

ENV_FILE := .env
ENV_VARS := SEPOLIA_RPC PRIVATE_KEY PRIVATE_KEY2 PRIVATE_KEY3

.PHONY: help ensure-npm ensure-env install compile sepolia-deploy sepolia-balance sepolia-transfer sepolia-mint sepolia-fund sepolia-verify sepolia-bonus sepolia-bonus-setup sepolia-bonus-mint sepolia-bonus-submit sepolia-bonus-status sepolia-bonus-accept-1 sepolia-bonus-accept-2 sepolia-bonus-accept-3 sepolia-bonus-execute sepolia-bonus-verify prune clean clean-tools

# ---------- Rules ----------

help:
	@echo "Available targets:"
	@echo "  make compile           Compile contracts"
	@echo "  make sepolia-deploy    Deploy token to Sepolia"
	@echo "  make sepolia-balance   Show Sepolia ETH and M42 balances"
	@echo "  make sepolia-transfer  Transfer 42 M42 from PRIVATE_KEY to PRIVATE_KEY2"
	@echo "  make sepolia-mint      Directly mint M42 from PRIVATE_KEY to PRIVATE_KEY2"
	@echo "  make sepolia-fund      Send Sepolia ETH from PRIVATE_KEY to PRIVATE_KEY2/3"
	@echo "  make sepolia-verify    Verify token source code on Sepolia Etherscan"
	@echo "  make sepolia-bonus     Print Sepolia multisig bonus status"
	@echo "  make sepolia-bonus-setup      Deploy multisig and transfer token ownership"
	@echo "  make sepolia-bonus-mint       Submit a multisig mint transaction"
	@echo "  make sepolia-bonus-accept-1   Accept transaction with PRIVATE_KEY"
	@echo "  make sepolia-bonus-accept-2   Accept transaction with PRIVATE_KEY2"
	@echo "  make sepolia-bonus-accept-3   Accept transaction with PRIVATE_KEY3"
	@echo "  make sepolia-bonus-execute    Execute accepted transaction with PRIVATE_KEY3"
	@echo "  make sepolia-bonus-verify     Verify multisig source code on Sepolia Etherscan"
	@echo "  make prune             Remove generated JS/Hardhat files"
	@echo "  make clean-tools       Remove local Node toolchain"

compile: install ensure-env
	@echo "==> Compiling contracts"
	$(HARDHAT) compile

install: ensure-npm
	@if [ ! -f $(INSTALL_MARKER) ]; then \
		echo "==> Installing dependencies"; \
		$(NPM) install; \
		touch $(INSTALL_MARKER); \
	else \
		echo "==> Dependencies already installed"; \
	fi

ensure-npm:
	@if command -v npm >/dev/null 2>&1 && command -v node >/dev/null 2>&1; then \
		NODE_MAJOR="$$(node -p 'process.versions.node.split(".")[0]')"; \
		if [ "$$NODE_MAJOR" -ge 22 ]; then \
			echo "==> Using system node/npm: $$(node -v) / $$(npm -v)"; \
			NPM="npm"; \
			HARDHAT="npx hardhat"; \
		fi; \
	fi; \
	if ! command -v npm >/dev/null 2>&1 || [ "$$(node -p 'process.versions.node.split(\".\")[0]' 2>/dev/null || echo 0)" -lt 22 ]; then \
		echo "==> Installing local Node+npm into $(TOOLS_DIR)"; \
		mkdir -p $(TOOLS_DIR); \
		if [ ! -x "$(NPM_BIN)" ]; then \
			curl -fsSL "$(NODE_URL)" -o "$(TOOLS_DIR)/$(NODE_TARBALL)"; \
			tar -xJf "$(TOOLS_DIR)/$(NODE_TARBALL)" -C "$(TOOLS_DIR)"; \
			rm -f "$(TOOLS_DIR)/$(NODE_TARBALL)"; \
		fi; \
		echo "==> Local node: $$($(RUN_LOCAL) $(NODE_BIN) -v)"; \
		echo "==> Local npm : $$($(RUN_LOCAL) $(NPM_BIN) -v)"; \
		echo "==> Local npx : $$($(RUN_LOCAL) $(NPX_BIN) -v)"; \
	fi

ensure-env:
	@set -e; \
	ENV_FILE="$(ENV_FILE)"; \
	ENV_VARS="$(ENV_VARS)"; \
	RED='\033[31m'; \
	YELLOW='\033[33m'; \
	GREEN='\033[32m'; \
	RESET='\033[0m'; \
	create_env_file() { \
		echo "==> Creating $$ENV_FILE"; \
		{ \
			echo "SEPOLIA_RPC="; \
			echo "PRIVATE_KEY="; \
			echo "PRIVATE_KEY2="; \
			echo "PRIVATE_KEY3="; \
		} > "$$ENV_FILE"; \
		echo "==> $$ENV_FILE created."; \
	}; \
	get_value() { \
		VAR="$$1"; \
		if grep -qE "^$${VAR}=" "$$ENV_FILE"; then \
			grep -E "^$${VAR}=" "$$ENV_FILE" | tail -n 1 | sed 's/^[^=]*=//'; \
			return 0; \
		else \
			return 1; \
		fi; \
	}; \
	check_env() { \
		for v in $$ENV_VARS; do \
			if VAL="$$(get_value $$v)"; then \
				[ -n "$$VAL" ] || return 1; \
			else \
				return 1; \
			fi; \
		done; \
		return 0; \
	}; \
	print_env() { \
		for v in $$ENV_VARS; do \
			if VAL="$$(get_value $$v)"; then \
				if [ -n "$$VAL" ]; then \
					printf "$${GREEN}%s=***$${RESET}\n" "$$v"; \
				else \
					printf "$${YELLOW}%s=$${RESET}\n" "$$v"; \
				fi; \
			else \
				printf "$${RED}%s=$${RESET}\n" "$$v"; \
			fi; \
		done; \
	}; \
	if [ ! -f "$$ENV_FILE" ]; then \
		echo "==> $$ENV_FILE not found."; \
		printf "Create it now with empty variables? [y/N] "; \
		read ans; \
		case "$$ans" in y|Y) create_env_file ;; *) echo "==> Aborted."; exit 1 ;; esac; \
	fi; \
	while true; do \
		if check_env; then \
			break; \
		fi; \
		echo "";\
		echo "⚠️  WARNING: Some env variables required for HardHat are not filled."; \
		echo "";\
		print_env; \
		echo ""; \
		echo "Choose an option:"; \
		echo "  1) I want to continue without the env variables"; \
		echo "  2) I filled .env with the missing variables"; \
		echo "  3) Cancel compilation"; \
		printf "> "; \
		read choice; \
		case "$$choice" in \
			1) echo "==> Continuing without full env."; break ;; \
			2) echo "==> Re-checking $$ENV_FILE..."; echo ""; continue ;; \
			3) echo "==> Cancelled."; exit 1 ;; \
			*) echo "==> Invalid choice."; echo "" ;; \
		esac; \
	done

clean-tools:
	rm -rf $(TOOLS_DIR)
	rm -f $(INSTALL_MARKER)

sepolia-deploy: compile
	@echo "==> Deploying token to Sepolia"
	$(HARDHAT) run scripts/sepolia_deploy.cjs --network sepolia

sepolia-balance: compile
	@echo "==> Reading Sepolia balances"
	$(HARDHAT) run scripts/sepolia_balance.cjs --network sepolia

sepolia-transfer: compile
	@echo "==> Transferring M42 on Sepolia"
	$(HARDHAT) run scripts/sepolia_transfer.cjs --network sepolia

sepolia-mint: compile
	@echo "==> Minting M42 directly on Sepolia"
	$(HARDHAT) run scripts/sepolia_mint.cjs --network sepolia

sepolia-fund: compile
	@echo "==> Funding Sepolia owner2 and owner3 from owner1"
	$(HARDHAT) run scripts/sepolia_fund.cjs --network sepolia

sepolia-verify: compile
	@echo "==> Verifying token on Sepolia Etherscan"
	ACTION=token $(HARDHAT) run scripts/sepolia_verify.cjs --network sepolia

sepolia-bonus: compile
	@echo "==> Reading Sepolia multisig bonus status"
	$(HARDHAT) run scripts/sepolia_bonus.cjs --network sepolia

sepolia-bonus-setup: compile
	@echo "==> Setting up Sepolia multisig bonus"
	ACTION=setup $(HARDHAT) run scripts/sepolia_bonus.cjs --network sepolia

sepolia-bonus-mint: compile
	@echo "==> Submitting Sepolia multisig mint transaction"
	ACTION=mint $(HARDHAT) run scripts/sepolia_bonus.cjs --network sepolia

sepolia-bonus-submit: sepolia-bonus-mint

sepolia-bonus-status: sepolia-bonus

sepolia-bonus-accept-1: compile
	@echo "==> Accepting Sepolia multisig transaction with owner1"
	ACTION=accept OWNER=1 $(HARDHAT) run scripts/sepolia_bonus.cjs --network sepolia

sepolia-bonus-accept-2: compile
	@echo "==> Accepting Sepolia multisig transaction with owner2"
	ACTION=accept OWNER=2 $(HARDHAT) run scripts/sepolia_bonus.cjs --network sepolia

sepolia-bonus-accept-3: compile
	@echo "==> Accepting Sepolia multisig transaction with owner3"
	ACTION=accept OWNER=3 $(HARDHAT) run scripts/sepolia_bonus.cjs --network sepolia

sepolia-bonus-execute: compile
	@echo "==> Executing Sepolia multisig transaction with owner3"
	ACTION=execute OWNER=3 $(HARDHAT) run scripts/sepolia_bonus.cjs --network sepolia

sepolia-bonus-verify: compile
	@echo "==> Verifying multisig on Sepolia Etherscan"
	ACTION=bonus $(HARDHAT) run scripts/sepolia_verify.cjs --network sepolia

prune:
	@echo "==> Cleaning project"
	rm -rf node_modules artifacts cache typechain-types ignition/deployments
	rm -f $(INSTALL_MARKER)

clean: prune
