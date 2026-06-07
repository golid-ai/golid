# ==============================================================================
# Golid Development Container — Go 1.26 + Node 24 + all dev tools baked in
# ==============================================================================

FROM golang:1.26-bookworm

# Set working directory
WORKDIR /workspace

# Install system dependencies and Google Cloud SDK
RUN apt-get update && apt-get install -y --no-install-recommends \
    apt-transport-https \
    ca-certificates \
    gnupg \
    curl \
    git \
    sudo \
    postgresql-client \
    build-essential \
    && curl -sS https://packages.cloud.google.com/apt/doc/apt-key.gpg | gpg --dearmor -o /usr/share/keyrings/cloud.google.gpg \
    && echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" > /etc/apt/sources.list.d/google-cloud-sdk.list \
    && apt-get update && apt-get install -y google-cloud-sdk \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 24 (Active LTS)
RUN curl -fsSL https://deb.nodesource.com/setup_24.x | bash - \
    && apt-get install -y nodejs

# Playwright browser dependencies (Chromium)
RUN npx playwright install-deps chromium 2>/dev/null || true

# Create the non-root user and hand it ownership of the (still-empty) Go dirs
# BEFORE populating them. Chowning an empty /go is instant; chowning it after a
# full `go install` + `go mod download` previously cost ~150s on every build.
RUN useradd -ms /bin/bash vscode \
    && echo "vscode ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers \
    && mkdir -p /go/pkg/mod /home/vscode/.cache/go-build \
    && chown -R vscode:vscode /go /home/vscode

# Set Go environment for vscode user
ENV GOPATH=/go
ENV PATH=$PATH:/go/bin
ENV GOGC=50

USER vscode

# Install Go development tools as vscode (binaries land in /go/bin, used at runtime)
RUN go install github.com/air-verse/air@v1.61.0 \
    && go install github.com/sqlc-dev/sqlc/cmd/sqlc@v1.28.0 \
    && go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@v4.18.1 \
    && go install github.com/golangci/golangci-lint/v2/cmd/golangci-lint@v2.10.1

# Pre-download Go dependencies as vscode (no post-hoc chown needed). Shadowed by
# the go-mod-cache volume at runtime, but keeps a volume-less `docker run` fast.
COPY --chown=vscode:vscode backend/go.mod backend/go.sum /tmp/backend-deps/
RUN cd /tmp/backend-deps && go mod download && rm -rf /tmp/backend-deps

# Keep container running
CMD ["sleep", "infinity"]
