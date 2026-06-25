# Fintech Platform: Troubleshooting & Error Log

This document serves as a historical record of all the major errors encountered during the development, containerization, and deployment of the Fintech Platform, along with their root causes and solutions.

---

## 1. Python Module Import Errors (`ModuleNotFoundError`)
* **Error Example:** `ModuleNotFoundError: No module named 'app'` or `No module named 'kyc-service'`
* **Root Cause:** The project used hyphens (`-`) in directory names (e.g., `kyc-service`). Python treats hyphens as minus signs and does not allow them in package names, preventing internal imports from working.
* **Solution:** Renamed all backend service folders to use underscores (`kyc_service`, `credit_score_service`, `upi_mandate_service`) and updated the `docker-compose.yml` to reflect the new paths.
* **Commands Used:**
  ```bash
  docker-compose down
  docker-compose up --build -d
  ```

## 2. Supabase Connection Refused (Docker IPv6 Issue)
* **Error Example:** `TimeoutError` or `Connection refused` when connecting to `db.xxxx.supabase.co:5432` from inside the Docker containers.
* **Root Cause:** Docker Compose networks default to IPv4 routing, but the standard direct Supabase connection string relies on IPv6.
* **Solution:** Switched to the **Supabase IPv4 Transaction Pooler** endpoint running on port `6543`.
* **Action:** Updated the `.env` file.
  ```env
  SUPABASE_DATABASE_URL=postgresql://[user]:[password]@[aws-pooler-url]:6543/postgres
  ```

## 3. App Crashing on Database Timeout
* **Error Example:** Containers crashed immediately upon startup and went into an infinite restart loop if the Supabase connection timed out.
* **Root Cause:** The database initialization code (`Base.metadata.create_all(bind=engine)`) was running without error handling. If it failed, it crashed the entire FastAPI app.
* **Solution:** Wrapped the initialization in a `try/except` block inside the FastAPI `lifespan` event.
  ```python
  @asynccontextmanager
  async def lifespan(app: FastAPI):
      try:
          Base.metadata.create_all(bind=engine)
      except Exception as e:
          logger.warning(f"DB unreachable on boot: {e}")
      yield
  ```

## 4. Frontend CORS & Connection Refused Errors
* **Error Example:** `net::ERR_CONNECTION_REFUSED` or CORS blocking errors in the browser console when clicking buttons.
* **Root Cause:** The frontend `index.js` was trying to make requests directly to `http://localhost:8001`. This bypasses the Nginx reverse proxy and often triggers cross-origin (CORS) blocks.
* **Solution:** Updated the frontend code to use relative paths so all traffic flows through the Nginx proxy on port 80.
  ```javascript
  const API_BASE = {
      kyc: '/api/kyc',
      credit: '/api/credit',
      upi: '/api/upi'
  };
  ```

## 5. Jenkins Pipeline Failing at "Test" Stage
* **Error Example:** `Stage "Test" skipped due to earlier failure(s)` in Jenkins.
* **Root Cause:** The `Jenkinsfile` was programmed to run tests (`pytest`), but no tests exist yet in the codebase. This caused the shell step to exit with an error code (1), failing the pipeline.
* **Solution:** Modified the `Jenkinsfile` to safely skip tests for now until they are written.
  ```groovy
  sh 'echo No tests configured yet. Skipping...'
  ```

## 6. Jenkins Missing Environment Variables
* **Error Example:** `level=warning msg="The \"SUPABASE_DATABASE_URL\" variable is not set."`
* **Root Cause:** Jenkins downloads the code freshly from GitHub, but the `.env` file is hidden by `.gitignore` (for security). Thus, the CI/CD pipeline had no database credentials.
* **Solution:** Manually copied the local `.env` file into the Jenkins workspace directory.
* **Commands Used:**
  ```bash
  sudo cp /mnt/c/Users/.../.env /var/lib/jenkins/workspace/Finflow/.env
  ```

## 7. Jenkins Deployment Port Conflict
* **Error Example:** `Error response from daemon: Conflict. The container name "/fintech-redis" is already in use by container "xxxxx".`
* **Root Cause:** Jenkins tried to spin up the containers locally on the same computer where manual testing was previously done, causing a clash over container names and ports.
* **Solution:** Shut down the manually started containers to free up the names for Jenkins.
* **Commands Used:**
  ```bash
  docker-compose down
  ```

## 8. Kubernetes Image Pull Errors (`ErrImageNeverPull`)
* **Error Example:** `ErrImageNeverPull` status on Kubernetes pods after running `kubectl apply`.
* **Root Cause:** Minikube has its own isolated Docker daemon. If images are built in the host machine's normal Docker terminal, Minikube cannot see them.
* **Solution:** Forcefully loaded the locally built images into Minikube.
* **Commands Used:**
  ```bash
  docker build -t fintech-frontend:latest -f ./frontend/Dockerfile .
  minikube image load fintech-frontend:latest
  kubectl delete pods --all  # Forces restart
  ```

## 9. Minikube Browser Tunnel Crash in WSL
* **Error Example:** `xdg-open: no method available for opening 'http://127.0.0.1:35893'` / `Exiting due to HOST_BROWSER`
* **Root Cause:** `minikube service` automatically tries to launch a GUI web browser (like Chrome). Since Windows Subsystem for Linux (WSL) doesn't have a Linux GUI browser installed by default, the command crashes.
* **Solution:** Used the `--url` flag to prevent Minikube from opening a browser, forcing it to just print the link for manual copy-pasting into Windows Chrome.
* **Commands Used:**
  ```bash
  minikube service frontend --url
  ```
