# ---------- Config ----------
NPM := npm
HARDHAT := npx hardhat

# Marker file to know if install was done
INSTALL_MARKER := .installed

# ---------- Rules ----------

.PHONY: install compile demo demo_bonus prune clean

# Run basic demo (depends on compile)
demo: compile
	@echo "==> Running demo"
	$(HARDHAT) run scripts/demo.cjs

# Install dependencies once
install:
	@if [ ! -f $(INSTALL_MARKER) ]; then \
		echo "==> Installing dependencies"; \
		$(NPM) install; \
		touch $(INSTALL_MARKER); \
	else \
		echo "==> Dependencies already installed"; \
	fi

# Compile contracts (depends on install)
compile: install
	@echo "==> Compiling contracts"
	$(HARDHAT) compile

# Run multisig bonus demo (depends on compile)
demo_bonus: compile
	@echo "==> Running multisig bonus demo"
	$(HARDHAT) run scripts/demo_bonus.cjs

# Remove generated files and dependencies
prune:
	@echo "==> Cleaning project"
	rm -rf node_modules artifacts cache typechain-types ignition/deployments
	rm -f $(INSTALL_MARKER)

# Alias
clean: prune