# Deployment Guide: School Management System

This guide explains how to deploy the School Management System using either **Option A: VPS (Docker Compose)** or **Option B: PaaS (Render)**.

---

## Option A: VPS Deployment (Docker Compose) - Recommended

This option runs both frontend and backend on a single virtual server (e.g., DigitalOcean, AWS EC2, Linode, Hetzner) using Docker Compose.

### Step 1: Provision your Server
1. Create a Linux VPS (Ubuntu 22.04 LTS or 24.04 LTS recommended).
2. A server with **1 GB or 2 GB of RAM** is recommended.
3. Configure your security group / firewall to allow incoming traffic on ports:
   - `22` (SSH)
   - `80` (HTTP)
   - `443` (HTTPS)

### Step 2: Install Docker and Docker Compose on the Server
SSH into your VPS and install Docker:
```bash
# Update package lists
sudo apt-get update

# Install Docker
sudo apt-get install -y docker.io docker-compose-v2

# Start and enable Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Check installations
docker --version
docker compose version
```

### Step 3: Clone the Repository
Clone your project repository to the VPS:
```bash
git clone <your-repository-url> school-management
cd school-management
```

### Step 4: Configure Environment Variables
Copy the backend environment variable template:
```bash
cp backend/.env.example backend/.env
```
Open `backend/.env` (e.g., using `nano backend/.env`) and configure:
- Change `DEBUG` to `False`.
- Generate a secure `SECRET_KEY` (e.g., `openssl rand -hex 32`).
- Update `ALLOWED_HOSTS` with your server's IP address or custom domain (comma-separated, e.g. `ALLOWED_HOSTS=12.34.56.78,school.example.com`).

### Step 5: Build and Start Containers
Run Docker Compose in detached mode:
```bash
docker compose up --build -d
```
This command will:
1. Build the backend container, run migrations, and collect static files.
2. Build the frontend container and bundle the Vite React app into Nginx.
3. Start the services on port `80`.

Verify they are running:
```bash
docker compose ps
```
You can now access your application by navigating to the server's public IP address in your browser!

### Step 6: Configure SSL / HTTPS (Let's Encrypt)
To secure your application with SSL (HTTPS) and use a custom domain:
1. Point your domain's **A Record** in your DNS provider (e.g., GoDaddy, Cloudflare) to your VPS IP address.
2. We recommend installing **Nginx** or **Caddy** directly on the host to handle HTTPS requests and route them to port `80` of your Docker setup. Or, you can install Certbot and configure Nginx inside Docker.
3. Here is the easiest way using **Caddy** on the host server:
   - Install Caddy: [Caddy Installation Guide](https://caddyserver.com/docs/install#debian-ubuntu-raspbian)
   - Edit the Caddyfile (`/etc/caddy/Caddyfile`):
     ```caddy
     school.example.com {
         reverse_proxy localhost:80
     }
     ```
   - Restart Caddy: `sudo systemctl restart caddy`
   Caddy will automatically provision and renew SSL certificates for your domain!

---

## Option B: PaaS Deployment (Render)

This option deploys the frontend and backend as separate services without managing server OS/Docker installations.

### Step 1: Deploy the Database
Although SQLite works on Render (using a Persistent Disk volume), deploying a managed **Render PostgreSQL database** is recommended for production.
1. Log in to the [Render Dashboard](https://dashboard.render.com/).
2. Click **New** -> **PostgreSQL**.
3. Fill in the Database details and click **Create Database**.
4. Once created, copy the **Internal Database URL** or **External Database URL**.

### Step 2: Deploy the Django Backend
1. Click **New** -> **Web Service**.
2. Select your repository.
3. Configure settings:
   - **Name**: `school-backend`
   - **Runtime**: `Docker`
   - **Root Directory**: `backend` (Important: Set this to the backend folder!)
   - **Docker Command**: Leave blank (uses Dockerfile CMD)
4. Add the following **Environment Variables**:
   - `DEBUG`: `False`
   - `SECRET_KEY`: `your-random-secure-key`
   - `ALLOWED_HOSTS`: `school-backend.onrender.com` (use your actual Render web service URL)
   - `DATABASE_URL`: paste your PostgreSQL connection string here.
5. Click **Deploy Web Service**.

### Step 3: Deploy the React Frontend
1. Click **New** -> **Static Site**.
2. Select your repository.
3. Configure settings:
   - **Name**: `school-frontend`
   - **Root Directory**: `frontend` (Important: Set this to the frontend folder!)
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
4. Add the following **Environment Variables**:
   - `VITE_API_URL`: `https://school-backend.onrender.com/api/` (Use your backend Render URL, ending with `/api/`)
5. Click **Deploy Static Site**.

Once the builds are complete, open the `school-frontend.onrender.com` link in your browser to view your deployed site.

---

## Post-Deployment Validation

Once deployed, verify the system functionality:
1. **Login**: Go to the login page and test logging in using your credentials.
2. **Admin Panel**: Navigate to `/admin/` to verify that Django Admin works and styling loads correctly.
3. **Database Check**: Try adding a record (e.g. creating a course or registering a student) to verify write capability.
