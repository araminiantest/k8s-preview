# Get short Git SHA
GIT_REV := $(shell git rev-parse --short HEAD)
export GIT_REV

.PHONY: build
build:
	@echo "Building with GIT_REV=$(GIT_REV)"
	CI=true skaffold build

.PHONY: render-preview
render-preview:
	@if [ -z "$(GIT_PR_NUMBER)" ]; then \
		echo "Error: GIT_PR_NUMBER is required. Usage: make render-preview GIT_PR_NUMBER=123"; \
		exit 1; \
	fi
	@echo "Rendering preview manifests with GIT_PR_NUMBER=$(GIT_PR_NUMBER) and GIT_REV=$(GIT_REV)"
	mkdir -p manifests/preview/$(GIT_PR_NUMBER)
	CI=true TIER=preview skaffold render -o manifests/preview/$(GIT_PR_NUMBER)/manifests.yaml

.PHONY: render-preview-test
render-preview-test:
	GIT_PR_NUMBER=123
	@echo "Rendering preview manifests with GIT_PR_NUMBER=$(GIT_PR_NUMBER) and GIT_REV=$(GIT_REV)"
	CI=true TIER=preview skaffold render
