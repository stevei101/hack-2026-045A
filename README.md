# hack-2026-045A

GitOps-driven Kubernetes infrastructure for Inert Synergies, managed via Flux and External Secrets Operator.

## Architecture

- **Flux:** GitOps reconciliation from this repo
- **External Secrets Operator (ESO):** Fetch secrets from GCP Secret Manager
- **Workload Identity Federation:** K8s pods authenticate to GCP without credentials
- **GitHub OIDC:** Flux authenticates to GitHub for repo access
- **Kustomize:** Environment-specific overlays (prod/staging/dev)

## Directory Structure

```
k8s/
├── base/
│   ├── eso/              # External Secrets Operator base
│   ├── flux/             # Flux system base
│   └── rbac/             # Cluster RBAC
├── overlays/
│   ├── prod/             # Production environment
│   ├── staging/          # Staging environment
│   └── dev/              # Development environment
└── kustomization.yaml    # Root kustomization
```

## Setup Instructions

### Prerequisites

- GKE cluster running Kubernetes 1.27+
- Workload Identity Pool configured in GCP
- GitHub repository with OIDC provider enabled
- `gcloud`, `kubectl`, `kustomize` CLI tools

### 1. Create GKE Cluster

```bash
gcloud container clusters create hack-gke-primary \
  --project=inert-synergies-llc \
  --region=us-central1 \
  --num-nodes=3 \
  --machine-type=e2-standard-4 \
  --enable-ip-alias \
  --enable-workload-identity
```

### 2. Create Service Accounts in GCP

#### ESO Service Account

```bash
# Create service account
gcloud iam service-accounts create eso-operator \
  --project=inert-synergies-llc \
  --display-name="External Secrets Operator"

# Grant Secret Manager access
gcloud projects add-iam-policy-binding inert-synergies-llc \
  --member="serviceAccount:eso-operator@inert-synergies-llc.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Bind K8s SA to GCP SA (Workload Identity)
gcloud iam service-accounts add-iam-policy-binding \
  eso-operator@inert-synergies-llc.iam.gserviceaccount.com \
  --project=inert-synergies-llc \
  --role="roles/iam.workloadIdentityUser" \
  --member="serviceAccount:inert-synergies-llc.svc.id.goog[external-secrets/external-secrets-operator]"
```

#### Flux Service Account

```bash
# Create service account
gcloud iam service-accounts create flux-operator \
  --project=inert-synergies-llc \
  --display-name="Flux GitOps"

# Grant necessary permissions (adjust as needed for your workloads)
gcloud projects add-iam-policy-binding inert-synergies-llc \
  --member="serviceAccount:flux-operator@inert-synergies-llc.iam.gserviceaccount.com" \
  --role="roles/container.developer"
```

### 3. Install Flux (Manually or via Bootstrap)

#### Option A: Manual Installation

```bash
kubectl create namespace flux-system

# Apply the base manifests
kubectl apply -k k8s/base/flux/
kubectl apply -k k8s/base/eso/

# Verify
kubectl get pods -n flux-system
kubectl get pods -n external-secrets
```

#### Option B: Flux Bootstrap (Recommended)

```bash
flux bootstrap github \
  --owner=stevei101 \
  --repo=hack-2026-045A \
  --branch=main \
  --path=k8s/overlays/prod \
  --personal
```

This will:
1. Install Flux in `flux-system` namespace
2. Create GitHub deploy key
3. Create `GitRepository` to watch this repo
4. Apply `Kustomization` from the specified path

### 4. Configure GitHub OIDC for Flux

In your GitHub repository settings:

1. **Settings → Deployments → Environments**
2. Create environment: `production` (or `staging`, `development`)
3. **Protection rules:**
   - Add deployment branch: `main`
   - Add reviewers (optional)
4. **Secrets:** Add any cluster-specific secrets here

Flux will automatically use the OIDC token to authenticate.

### 5. Create Secrets in GCP Secret Manager

ESO will fetch secrets and inject them as K8s Secrets.

```bash
# Example: Create a database password secret
echo -n "my-secure-password" | gcloud secrets create db-password \
  --project=inert-synergies-llc \
  --replication-policy="automatic" \
  --data-file=-
```

### 6. Reference Secrets in K8s

Create an `ExternalSecret` resource to fetch the secret:

```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: my-app-secrets
  namespace: default
spec:
  secretStoreRef:
    name: gcp-secrets
    kind: ClusterSecretStore
  target:
    name: my-app-secrets
    creationPolicy: Owner
  data:
  - secretKey: db-password
    remoteRef:
      key: db-password
```

Apply with `kubectl apply -f`. ESO will fetch from GCP and create the K8s Secret.

## Deployment

### Deploy to Production

```bash
# Validate manifests
kustomize build k8s/overlays/prod/

# Apply (via Flux or manually)
kubectl apply -k k8s/overlays/prod/
```

### Deploy to Staging

```bash
kustomize build k8s/overlays/staging/ | kubectl apply -f -
```

### Deploy to Development

```bash
kustomize build k8s/overlays/dev/ | kubectl apply -f -
```

## Monitoring & Troubleshooting

### Check Flux Status

```bash
flux get all -n flux-system
flux logs --all-namespaces
```

### Check ESO Status

```bash
kubectl get externalsecrets -A
kubectl describe externalsecrets -n default

# Debug ESO operator logs
kubectl logs -n external-secrets deployment/external-secrets-operator -f
```

### Workload Identity Debugging

```bash
# Verify service account bindings
gcloud iam service-accounts get-iam-policy \
  eso-operator@inert-synergies-llc.iam.gserviceaccount.com

# Test from pod
kubectl exec -it deployment/external-secrets-operator \
  -n external-secrets -- \
  gcloud auth list
```

## Configuration Files

### Cluster Variables

Update these in the manifests:

- **Cluster Name:** `hack-gke-primary` (in `k8s/base/eso/secretstore.yaml`)
- **Cluster Location:** `us-central1` (in `k8s/base/eso/secretstore.yaml`)
- **GCP Project:** `inert-synergies-llc` (in `k8s/base/eso/secretstore.yaml`)
- **GitHub Repo:** `stevei101/hack-2026-045A` (in Flux bootstrap)

### Environment Customization

Overlays support environment-specific patches:

- **prod:** 3 ESO replicas, prod namespace, stable labels
- **staging:** 2 ESO replicas, staging namespace, candidate labels
- **dev:** 1 ESO replica, dev namespace, latest labels

Add more patches to `overlays/<env>/` as needed.

## References

- [Flux Documentation](https://fluxcd.io/flux/)
- [External Secrets Operator](https://external-secrets.io/)
- [GCP Workload Identity](https://cloud.google.com/kubernetes-engine/docs/how-to/workload-identity)
- [GitHub OIDC](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)
