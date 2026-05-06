# DispatchIQ

This document provides the necessary steps to initialize the local development environment for the DispatchIQ project on Fedora systems.

## Prerequisites

Ensure the following software is installed on your workstation:

- Node.js (Version 18 or higher)
- Docker and Docker Compose
- Git

## 1. System Environment Configuration

The project requires Java 21 to ensure compatibility with the Gradle build system and Nx plugins.

Install Java 21:

```bash
sudo dnf install java-21-openjdk-devel
```

### Configure Active Java Version

If multiple Java versions are installed, use the alternatives system to select version 21:

```bash
sudo alternatives --config java
```

Verify the configuration by running:

```bash
java -version
```

## 2. Repository Initialization

Clone and install:

```bash
git clone https://github.com/Melatwolde/DispatchIQ-se4801-group-3.git
cd DispatchIQ-se4801-group-3
npm install
```

### Nx Workspace Fix

Nx requires the root `package.json` to contain a `name` property. Use the following command to ensure the file is correctly formatted:

```bash
sed -i '1s/^{/{
"name": "dispatch-iq",/' package.json
```

## 3. Local Development Execution

The backend application can be executed using the Nx CLI. This command handles the underlying Gradle processes.

```bash
npx nx reset
npx nx serve backend
```

The API server will be accessible at `http://localhost:8080`.

## 4. Docker Containerization

To build and run the application within a containerized environment, use the following command from the project root:

```bash
docker compose up --build
```

> Note: If the build fails due to execution permissions on the Gradle wrapper, run:
>
> ```bash
> chmod +x gradlew
> ```

## Troubleshooting

- **Gradle cache corruption:** If build errors persist regarding corrupted data blocks, run:

  ```bash
  ./gradlew --stop && rm -rf ~/.gradle/caches/
  ```

- **Port conflicts:** If port `8080` is already in use, modify the `server.port` property in `apps/backend/src/main/resources/application.properties`.
