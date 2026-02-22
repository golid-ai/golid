# ==============================================================================
# Golid Development Container — Go 1.26 + Node 20 + all dev tools baked in
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

# Install Node.js 20
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# Playwright browser dependencies (Chromium)
RUN npx playwright install-deps chromium 2>/dev/null || true

# Install Go development tools
RUN go install github.com/air-verse/air@v1.61.0 \
    && go install github.com/sqlc-dev/sqlc/cmd/sqlc@v1.28.0 \
    && go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@v4.18.1 \
    && go install github.com/golangci/golangci-lint/v2/cmd/golangci-lint@v2.10.1

# Create non-root user for VS Code
RUN useradd -ms /bin/bash vscode \
    && echo "vscode ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers \
    && mkdir -p /go/pkg/mod \
    && chown -R vscode:vscode /go

# Set Go environment for vscode user
ENV GOPATH=/go
ENV PATH=$PATH:/go/bin

USER vscode

# Keep container running
CMD ["sleep", "infinity"]
