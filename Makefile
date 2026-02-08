GIT_REV := $(shell git rev-parse --short HEAD)
export GIT_REV

.PHONY: build
build:
	@echo "Building with GIT_REV=$(GIT_REV)"
	@skaffold config set --kube-context minikube local-cluster false
	CI=true skaffold build

.PHONY: render-preview
render-preview:
	@if [ -z "$(GIT_PR_NUMBER)" ]; then \
		echo "Error: GIT_PR_NUMBER is required. Usage: make render-preview GIT_PR_NUMBER=123"; \
		exit 1; \
	fi
	@echo "Rendering preview manifests with GIT_PR_NUMBER=$(GIT_PR_NUMBER) and GIT_REV=$(GIT_REV)"
	mkdir -p manifests/preview/$(GIT_PR_NUMBER)
	CI=true TIER=preview skaffold render --digest-source=remote -o manifests/preview/$(GIT_PR_NUMBER)/manifests.yaml

.PHONY: render-preview-test
render-preview-test:
	GIT_PR_NUMBER=123
	@echo "Rendering preview manifests with GIT_PR_NUMBER=$(GIT_PR_NUMBER) and GIT_REV=$(GIT_REV)"
	CI=true TIER=preview skaffold render

.PHONY: create-cluster
create-cluster:
	minikube start --kubernetes-version=stable

.PHONY: delete-cluster
delete-cluster:
	minikube delete

.PHONY: enable-istio
enable-istio:
	minikube addons enable istio-provisioner
	minikube addons enable istio

.PHONY: create-gateway
create-istio-gateway:
	kubectl apply -f kubernetes/istio/gateway.yaml

.PHONY: install-keda
install-keda:
	helm repo add kedacore https://kedacore.github.io/charts  
	helm repo update
	helm install keda kedacore/keda --namespace keda --create-namespace

.PHONY: install-keda-http-addon
install-keda-http-addon:
	helm repo add kedacore https://kedacore.github.io/charts  
	helm repo update
	helm install http-add-on kedacore/keda-add-ons-http --namespace keda-http-addon --create-namespace

.PHONY: install-argocd
install-argocd:
	kubectl create namespace argocd
	kubectl apply -n argocd --server-side --force-conflicts -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

.PHONY: access-argocd
access-argocd:
	@echo "Username: admin"
	@echo "Admin password:"
	@kubectl get secret argocd-initial-admin-secret -n argocd -o jsonpath="{.data.password}" | base64 -d
	@echo ""
	@echo "Check the ArgoCD UI at http://localhost:8080"
	kubectl port-forward svc/argocd-server -n argocd 8080:443

.PHONY: add-argocd-applicationset
add-argocd-applicationset:
	@echo "Adding ArgoCD Preview ApplicationSet"
	@echo "Please provide the Github username (e.g. araminian):"; \
	read OWNER; \
	echo "Please provide the repository name (e.g. k8s-preview):"; \
	read REPO; \
	echo "OWNER=$$OWNER"; \
	echo "REPO=$$REPO"; \
	export OWNER REPO; \
	envsubst < kubernetes/argocd/applicationSet.yaml | kubectl apply -f -
