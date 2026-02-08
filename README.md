# Complete Guide to Preview Environment on Kubernetes

This guide will walk you through the process of setting up preview environments on Kubernetes.

It's going to complete my presentation at the KubCon Amsterdam 2026.

## Overview

Preview Environments are temporary environments that are used to test changes before they are merged into the main branch. We let engineers to test and view the changes before they are merged into the main branch.

Those preview environments are scaled to zero when they are not used. This approach is helping to save costs and resources.

We could run integration tests against the preview environments to ensure the changes are working as expected.

This guide is designed to be worked on a local Kubernetes cluster like Minikube. But it can be used on any Kubernetes cluster.

## Prerequisites Tools

- Kubernetes cluster (Minikube, kind, etc.)
- Helm
- Skaffold
- ArgoCD
- KEDA and HTTP Add-on
- Istio

### Kubernetes Cluster

Here I'm using Minikube, it's a lightweight Kubernetes cluster that can be run on your local machine.

You can install it by following the instructions on the [Minikube website](https://minikube.sigs.k8s.io/docs/start).

Then just run the `make create-cluster` command to create the cluster.

### Helm

I'm using to install to install KEDA and render the manifests for the preview environments.

You can install it by following the instructions on the [Helm website](https://helm.sh/docs/intro/install/).

### Skaffold

I'm using Skaffold to build the Docker image and render the manifests for the preview environments.

Skaffold automates building, pushing, and deploying your app. For more information, you can read the [Skaffold documentation](https://skaffold.dev/docs/).

It can be installed by following the instructions on the [Skaffold website](https://skaffold.dev/docs/install/).

### ArgoCD

We are using ArgoCD to deploy the preview environments.

ArgoCD is one of the important components for setting up preview environments on Kubernetes.

To install ArgoCD, you can run the `make install-argocd` command.

### KEDA and HTTP Add-on

KEDA is a Kubernetes-based event-driven autoscaler. For more information, you can read the [KEDA documentation](https://keda.sh/docs/latest/).

HTTP Add-on is a add-on for KEDA that can be used to scale the services based on the incoming HTTP requests. For more information, you can read the [HTTP Add-on documentation](https://github.com/kedacore/http-add-on).

To install KEDA and HTTP Add-on, you can run the `make install-keda` and `make install-keda-http-addon` commands.

### Istio

Istio is a service mesh that can be used to manage the traffic between the services. For more information, you can read the [Istio documentation](https://istio.io/latest/docs/).

`minikube` offers an add-on for Istio that can be used to install Istio on the cluster, You can enable it by running the `make enable-istio` command.

You can also install Istio manually by following the instructions on the [Istio website](https://istio.io/latest/docs/setup/getting-started/).


## Backgroud and Context

Here I'm going to talk about the preview environments setup process and the main components that are involved in the process.

Before we start, let's think about what do we need to setup the preview environments. We should to think about the following questions and find the answers.

### How to generate the Kubernetes manifests for each Pull Request?

A Kubernetes manifest is a YAML file that contains all required resources to deploy the application. It can consists of multiple resources like Deployment, Service, Ingress, etc.

In our case, we are using Helm to generate the Kubernetes manifests. The Helm chart which is used here can be found in the `kubernetes/charts/todo-app` directory.

The Helm chart used for preview environments must have follow an important rules:
- Each preview environment should have a unique namespace.
- Ingress URLs must be unique for each preview environment.

In order to achieve this, we need to use the PR number and the commit ID to generate the unique namespace and Ingress URLs. These values are injecting into the Helm chart in the `render` step by Skaffold.

Here is an example of the Kubernetes manifests for a preview environment:

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: preview-123-todo-app
```

### How to generate the Kubernetes manifests dynamically?

We need to find a way to generate the Kubernetes manifests dynamically for each Pull Request. Manifests should be generated whenever a new commit is pushed to the Pull Request.

In order to achieve this, We are using a Github Workflow to:
- Build and Push the Docker image to Docker Hub
- Render the Kubernetes manifests for the preview environment
- Push the Kubernetes manifests to the GitHub repository into a temporary branch

The Github Workflow is defined in the `.github/workflows/ci-preview.yaml` file.

### How to deploy the Kubernetes manifests to the Kubernetes cluster?

In GitOps approach, we are generating the Kubernetes manifests (By using Helm or kustomize) and deploy them using ArgoCD or other GitOps tools.

`ArgoCD Application` is the main resource that is used to deploy the Kubernetes manifests to the Kubernetes cluster. For static environments like production or stage, we could use `Applications` resources.

We could use `Application` resource for preview environments, but it's complex to achieve:
- Create a new `Application` resource for each Pull Request.
- Remove the `Application` resource when the Pull Request is closed or merged.
- Whole process should be automated.

To simplify the process, we are using `ApplicationSet` resource instead of `Application` resource.

`ApplicationSet` is a resource that is used to generate the `Application` resources dynamically. For more information, you can read the [ArgoCD ApplicationSet documentation](https://argo-cd.readthedocs.io/en/stable/operator-manual/applicationset/).

`ApplicationSet` offer some generators to generate the `Application` resources dynamically. Here we are using the `pullRequest` generator to generate the `Application` resources for each Pull Request. So we don't need to create a new `Application` resource for each Pull Request. One `ApplicationSet` resource can generate multiple `Application` resources for different Pull Requests.

After merging the Pull Request, the `Application` resource will be removed automatically.

Here is an example of the `ApplicationSet` resource for the preview environments:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: todo-app-preview-environment
  namespace: argocd
spec:
  goTemplate: true
  syncPolicy:
    preserveResourcesOnDeletion: false
  generators:
  - pullRequest: # This is the generator that will generate the `Application` resources for each Pull Request.
    # When using a Pull Request generator, the ApplicationSet controller polls every `requeueAfterSeconds` interval (defaulting to every 30 minutes) to detect changes.
      requeueAfterSeconds: 90 # Poll every 90 seconds to detect changes.
      github:
        # This is the Github repository that should be watched for new Pull Requests.
        owner: araminian
        repo: k8s-preview
        labels:
        - preview # This is the label that will be used to filter the Pull Requests that should be watched. here we are watching for Pull Requests with the `preview` label.
  template:
    metadata:
      # This is the name of the `Application` resource that will be generated for each Pull Request.
      # `{{.number}}` is a placeholder for the Pull Request number, it will be replaced with the actual Pull Request number when the `Application` resource is generated.
      name: todo-app-preview-{{.number}}
      labels:
        environment: preview
        app: todo-app
    spec:
      project: default
      source:
        directory:
          include: '{*.yml,*.yaml}'
          # This is the URL of the GitHub repository that contains the Kubernetes manifests for the preview environments.
          repoURL: https://github.com/araminian/k8s-preview.git
          # This is the target revision of the Kubernetes manifests that should be deployed. which is the temporary branch that contains the Kubernetes manifests for the preview environment.
          targetRevision: preview-{{.number}}
```

The Github Action Workflow is adding the `preview` label to the Pull Request.

### How to provide Preview Environments cost efficiency?

Preview Environments are temporary environments that are used to test changes before they are merged into the main branch. We don't need to keep them running all the time. Engineers are using them only when they are needed.

They might be used for a few minutes or a few hours per day and it might take a few days to complete the testing and merging the changes into the main branch.

You might think having a few Preview Environments running all the time is not a big deal, but it's not the case. Suppose you have to handle +100 Preview Environments at the same time, it will be a big problem and it might be more expensive than your production environment.

To solve this problem, we are using KEDA and HTTP Add-on to scale the Preview Environments based on the incoming HTTP requests.

KEDA HTTP-Add-on is a KEDA add-on that can be used to scale the services based on the incoming HTTP requests. It acts as a proxy between the incoming HTTP requests and the services.

So let's see how it works:

1. When a new HTTP request is received:
    - If the `Deployment` scaled to zero, it will be scaled it up, and forward the request to the service.
    - If the `Deployment` is already scaled up, it will forward the request to the service.
2. When the `Deployment` is inactive for a period of time, it will be scaled down to zero.

This approach is helping to save costs and resources.

Here is the Kubernetes manifests for the HTTP Scaled Object:

```yaml
apiVersion: http.keda.sh/v1alpha1
kind: HTTPScaledObject
metadata:
  name: preview-todo-app
  namespace: preview-123-todo-app
spec:
  hosts:
    #  This is the Ingress URL that Preview Environment will be available on. KEDA HTTP Add-on interceptor identifies the request based on this host.
    - todo-123-pr.127.0.0.1.sslip.io
  replicas:
    # This is the maximum number of replicas that the `Deployment` can be scaled to.
    max: 2
    # This is the minimum number of replicas that the `Deployment` can be scaled to. It's set to zero to save costs and resources.
    min: 0
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    # This is the name of the `Deployment` that should be scaled.
    name: preview-todo-app
    # This is the port of the `Service` that should be scaled.
    port: 80
    # This is the name of the `Service` that should be scaled.
    service: preview-todo-app
    # This is the period of time after which the `Deployment` will be scaled down to zero if it's inactive.
  scaledownPeriod: 300
  scalingMetric:
    requestRate:
      # This is the granularity of the scaling metric.
      granularity: 1s
      # This is the target value for the scaling metric.
      targetValue: 1
      # This is the window of time over which the scaling metric is calculated.
      window: 1m
```

For more information regarding the `HTTPScaledObject` resource, you can read the [KEDA HTTP Add-on Scaled Object documentation](https://github.com/kedacore/http-add-on/blob/main/docs/ref/v0.12.1/http_scaled_object.md?plain=1).

### How to access the Preview Environment?

Preview Environment is accessible via Ingress. Here i'm using `Istio` as the Ingress controller.

We are offering two Ingress URLs for each Preview Environment:
- `PR URL`: This is the URL that will be used to access the Preview Environment. It will point to the latest and healthy Pods. It will be used by users to access the Preview Environment.

- `Commit URL`: This is the URL that will be used to access the Preview Environment. It will point to the latest commit changes. all automated tests should be run against this URL.

I'm going to talk about why we are using two Ingress URLs for each Preview Environment in the next section.

Here is the Kubernetes manifests for the Ingress URL for a Preview Environment:

```yaml
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  labels:
    app: todo-app
    app.kubernetes.io/instance: preview
    app.kubernetes.io/managed-by: Helm
    app.kubernetes.io/name: todo-app
    helm.sh/chart: todo-app-0.1.0
    pr_number: pr-123
    tier: preview
    version: 827f6a4
  name: todo
  namespace: preview-123-todo-app
spec:
  gateways:
    # This is the Gateway that will be used to access the Preview Environment.
    - istio-system/ingress-gateway
  hosts:
    # This is the PR Preview URL that will be used to access the Preview Environment.
    - todo-123-pr.127.0.0.1.sslip.io
    # This is the Commit Preview URL that will be used to access the Preview Environment.
    - todo-123-pr-827f6a4.127.0.0.1.sslip.io
  http:
    - match:
        - authority:
            prefix: todo-123-pr
      route:
        - destination:
            host: keda-add-ons-http-interceptor-proxy.keda-http-addon.svc.cluster.local
            port:
              number: 8080
    # Will be discussed in the next section.
    - match:
        - authority:
            prefix: todo-123-pr-827f6a4
      route:
        - destination:
            host: preview-todo-app
            port:
              number: 80
            subset: preview-827f6a4
```

Here we are sending the requests to the `KEDA HTTP Add-on` interceptor, it will scale up the `Deployment` if it's not scaled up yet and forward the request to the service. It acts as a proxy between Istio and the service.

For the second route, we are sending the requests to the `Deployment` directly. This is the URL that will be used to access the Preview Environment. It will point to the latest commit changes.

### Why we are using two Ingress URLs for each Preview Environment? Am i crazy?

You might wondering why we are using two Ingress URLs for each Preview Environment. The `PR URL` should work as well. But it's not going to work as expected. And i'm not crazy.

Let's start with a story. In our first iteration, we were using only one Ingress URL for each Preview Environment. The `PR URL` ! it was working as expected. Until one day, we faced a broken release, one of our services was crashing. I checked the Github actions and everything was green, integration tests were passing. But the service was crashing.

I reopen the merged PR and try to understand what went wrong. I found out that one of the commit in the PR was causing that our service to exit with non-zero exit code. But then why it was passing the integration tests?

So the answer is `Kubernetes rolling update`. When the new broken commit was deployed, the new Pod (version v2) was started but it was broken and it was crashing. And the old Pod (version v1) was still running and it was used by the `Kubernetes Service`. So all requests were going to the old and healthy Pods.

So during the `rolling update`, the old Pods (older version) are removed when the new Pods (new version) are started and become healthy.

I found out that the our first implementation was able to handle `business errors` in the code, but it was not able to handle erorrs or situations that cause non-zero exit code.

So we needed to find a way to access the Preview Environment with the latest commit changes. So we added the `Commit URL` to our setup. It's pointing to the latest commit changes and it's not going to be affected by the `rolling update`.

For `Commit URL`, we are using the `Short SHA` in the URL. It's a unique identifier for each commit and it's going to be changed when a new commit is pushed to the Pull Request.

To achieve this, we are using `DestinationRule`. It lets us to define the subsets of the `Service` based on the labels. We are creating a new subset for each commit and we are routing the requests to the correct subset based on the `Short SHA` in the URL.

By using this approach, we are sure that the requests are always going to the latest change whether it's healthy or not.

Here is the Kubernetes manifests for the `DestinationRule`:

```yaml
apiVersion: networking.istio.io/v1alpha3
kind: DestinationRule
metadata:
  name: todo
  namespace: preview-123-todo-app
spec:
  host: preview-todo-app
  subsets:
    - labels:
        # This is the label that will be used to identify the subset.
        # It's a Pod's label.
        version: 827f6a4
      # This is the name of the subset, we are using it to route the requests to the correct subset.
      name: preview-827f6a4
```

For more information regarding the `DestinationRule` resource, you can read the [Istio DestinationRule documentation](https://istio.io/latest/docs/reference/config/networking/destination-rule/).

This is the end of the our story, i hope that it gives you full context about the preview environments setup process and the main components that are involved in the process.

## Setup and Deployment

Now let's setup everything and deploy our first preview environment.

You need to do following steps:
- [ ] Install and setup all the prerequisites tools.
- [ ] Setup the Github repository
- [ ] Setup the Docker Hub and Configure `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` secrets in the Github repository.
- [ ] Update the `skaffold.yaml` file with your own Docker image registry.
- [ ] Create `Istio Gateway`
- [ ] Update the `values.yaml` with istio load balancer IP.
- [ ] Update the `ci-preview.yaml` with istio load balancer IP.
- [ ] Create `ApplicationSet` resource

### Fork the Github repository

Just fork this repository to your own GitHub account. This repository provides all the necessary resources to set up preview environments on Kubernetes.

Here I'm providing a simple TODO application, but you can use any other application. It can be done by replacing the Dockerfile and adjusting the Helm chart.

You can fork this repository by clicking the `Fork` button on the top right corner of the repository page.

### Configure the Docker Hub

You need to create a free account on Docker Hub, because we're going to push the Docker image to Docker Hub.

You can follow the instructions on the [Docker Hub website](https://docs.docker.com/accounts/create-account/).

You also need to create a `PAT` (Personal Access Token) with the `read` and `write` permissions to the repository. We're going to use this token to push the Docker image to Docker Hub using the GitHub Actions.

Then you need to configure the `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` secrets in the Github repository. You can follow the instructions on the [GitHub Actions documentation](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets).

### Update the `skaffold.yaml` file

You need to update the `skaffold.yaml` file with your own Docker image registry.

```yaml
build:
  artifacts:
    - image: your-docker-image-registry/todo-app
      platforms:
        - linux/amd64
        - linux/arm64
```

### Create `Istio Gateway`

We need to create a new `Istio Gateway` to access the Preview Environment via Ingress.

It can be created by running the following command:

```bash
make create-istio-gateway
```

### Update the `values.yaml` file and `ci-preview.yaml` with istio load balancer IP

We need to access the Preview Environment via Ingress. Minikube lets us access to the Load Balancer IP by running the `minikube tunnel` command.

Just run the `minikube tunnel` command and then check the `istio ingress gateway` IP by running the following command:

```bash
kubectl get svc -n istio-system istio-ingressgateway -o jsonpath='{.status.loadBalancer.ingress[0].ip}'
```

Then update the `values.yaml` file with the `istio ingress gateway` IP.

```yaml
istioLoadBalancerIP: "YOUR_ISTIO_INGRESS_GATEWAY_IP"
```

Then update the `ci-preview.yaml` file with the `istio ingress gateway` IP.

```yaml
istio_load_balancer_ip: "YOUR_ISTIO_INGRESS_GATEWAY_IP"
```

### Create `ApplicationSet` resource

We need to create a `ApplicationSet` resource which will generate the `Application` resources for each Pull Request.

It can be created by running the following command:

```bash
make create-application-set
```

It will ask information about your Github repository, such as `OWNER` and `REPO`.

You can access the ArgoCD UI by running the following command:

```bash
make access-argocd
```

It will give you the username and password to access the ArgoCD UI.

You can access the ArgoCD UI at http://localhost:8080.

## Create Pull Request and Preview Environment

Now let's create a Pull Request and test our preview environment setup.

The application which i provided is a simple TODO application. Following screenshot shows the TODO application:

![TODO Application](resources/pictures/todo-app.png)

Now let's adjust the code and create a Pull Request, go to the `src/components/Heading.jsx` and change the heading text:

```js
function Heading() {
    return (
        <div className="heading">
            <h1>Todo List</h1>
            <h2>Hello From Preview Environment</h2>
        </div>
    )
}
```

Now commit the changes and push them to the Github repository. It will trigger the Github Actions Workflow.

You will find a comment in the Pull Request with the `PR URL` and `Commit URL`.

![PR Comment](resources/pictures/pr-comment.png)

**NOTE**: You need to keep `minikube tunnel` running to access the Preview Environment.

Now we can check `ArgoCD` UI to see the preview environment. As can be seen, a new `Application` resource is created for the Pull Request. It will take up to 90 seconds to create the `Application` resource.

![ArgoCD Application](resources/pictures/argocd-application.png).

As can be seen, there is no Pods running for the `Deployment` as `KEDA` scaled it down to zero.

Here my `PR_NUMBER` is `2`.

```bash
kubectl get pods -n preview-2-todo-app
No resources found in preview-2-todo-app namespace.
```

Now let's open the `PR URL` in the browser and see the Preview Environment, KEDA HTTP Add-on interceptor will keep requests until the `Deployment` is scaled up and then forward the request to the service.

As can be seen, our changes are deployed to the Preview Environment.

![Preview Environment](resources/pictures/todo-app-preview.png)

If you want to access the Preview Environment with the latest commit changes, you can open the `Commit URL` in the browser.

In most of the cases, Both `PR URL` and `Commit URL` should be pointing to the same Pods.

I we don't use the Preview Environment for a few minutes, KEDA will scale the `Deployment` down to zero. It will save costs and resources , isn't cool?

```bash
kubectl get pods -n preview-2-todo-app -w 
NAME                                READY   STATUS    RESTARTS   AGE
preview-todo-app-689b66d84c-bnrjs   2/2     Running   0          5m37s
preview-todo-app-689b66d84c-bnrjs   2/2     Terminating   0          6m6s
preview-todo-app-689b66d84c-bnrjs   2/2     Terminating   0          6m7s
preview-todo-app-689b66d84c-bnrjs   0/2     Completed     0          6m12s
preview-todo-app-689b66d84c-bnrjs   0/2     Completed     0          6m13s
preview-todo-app-689b66d84c-bnrjs   0/2     Completed     0          6m13s

kubectl get pods -n preview-2-todo-app
No resources found in preview-2-todo-app namespace.
```

By merging or closing the Pull Request, the `Application` resource will be removed and the `Deployment` will be scaled down to zero. The Github Actions Workflow will delete the temporary branch which contains the Kubernetes manifests for the preview environment.

## Next Steps

Now you can start using same approach to setup preview environments for your own applications. As you notice, we don't have any automated tests for the preview environments. So you can add your own automated tests to the preview environments. To do that you need to do following steps:

- [ ] Github Runner should be able to access the Preview Environment, you can use `hosted runners` for this purpose.
- [ ] Before starting the tests, you should send the first request to the Preview Environment to scale up the `Deployment`.
- [ ] Before starting the tests, you should run a wait-for-availability against `Commit URL` to wait for the `Deployment` to be available.
- [ ] After passing the wait-for-availability, you can start the tests.


