FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

# System packages
RUN apt-get update && apt-get install -y \
    curl \
    git \
    sudo \
    locales \
    ca-certificates \
    gnupg \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Create daytona user
RUN useradd -m -s /bin/bash daytona

# Install Node.js 20
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Install global npm packages
RUN npm install -g \
    typescript \
    vite

# Install Bun
RUN ARCH="$(dpkg --print-architecture)" && \
    if [ "$ARCH" = "amd64" ]; then BUN_ARCH="x64"; else BUN_ARCH="aarch64"; fi && \
    curl -fsSL https://github.com/oven-sh/bun/releases/latest/download/bun-linux-${BUN_ARCH}.zip -o /tmp/bun.zip && \
    unzip /tmp/bun.zip -d /tmp/bun && \
    mv /tmp/bun/bun-linux-${BUN_ARCH}/bun /usr/local/bin/bun && \
    chmod +x /usr/local/bin/bun && \
    rm -rf /tmp/bun /tmp/bun.zip

ARG BOILERPLATE_REPO_URL=https://github.com/rishabhksagi/coder-boilerplate-phaser.git
ARG BOILERPLATE_BRANCH=main
ARG CACHEBUST=1

# Clone boilerplate and install deps
RUN git clone --branch ${BOILERPLATE_BRANCH} --single-branch ${BOILERPLATE_REPO_URL} /home/daytona/project && \
    rm -rf /home/daytona/project/.git

RUN cd /home/daytona/project && npm install

# Set ownership
RUN chown -R daytona:daytona /home/daytona

ENV LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8

USER daytona
WORKDIR /home/daytona

CMD ["sleep", "infinity"]
