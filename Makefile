.PHONY: validate setup demo clean
validate: ; ./scripts/validate-all.sh
setup: ; ./scripts/setup-local.sh
demo: ; ./scripts/demo.sh
clean: ; ./scripts/cleanup-local.sh
