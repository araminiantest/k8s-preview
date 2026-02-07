# Get short Git SHA
GIT_REV := $(shell git rev-parse --short HEAD)

.PHONY: build
build:
	@echo "Building with GIT_REV=$(GIT_REV)"
	CI=true skaffold build
