# Web IDE

A comprehensive Web IDE containing a Node.js backend and a React/Vite frontend. The project is fully containerized using Docker and Docker Compose.

## Project Structure

- `/backend`: Node.js server that spawns Docker containers to run code.
- `/frontend`: React frontend application built with Vite and Tailwind, served via Nginx.
- `docker-compose.yml`: Orchestrates both the frontend and backend services.

## Prerequisites
- Docker and Docker Compose installed
- MongoDB and Redis (External or added to `docker-compose.yml` for production)

---

## Local Development Setup

To run the application locally on your machine:

1. **Set up the Environment Variables:**
   Navigate into the `/backend` folder and create a `.env` file with your configuration secrets (like MongoDB and Redis connection URIs).

2. **Build and Run:**
   In the root directory, execute:
   ```bash
   docker-compose up --build
   ```

3. **Access the application:**
   - Frontend: `http://localhost` (or `http://localhost:5173`)
   - Backend API: `http://localhost:8000`

---

## AWS EC2 Deployment Guide

Deploying this Docker-based application to an AWS EC2 instance is straightforward. Follow the steps below:

### Step 1: Launch an EC2 Instance
1. Go to your **AWS Console** > **EC2** > **Instances** > **Launch instances**.
2. **Name**: `webide-production` (or preferred name).
3. **OS Image (AMI)**: **Ubuntu** (Ubuntu Server 24.04 or 22.04 LTS).
4. **Instance Type**: **t3.medium** or **t3.large** (Recommended due to Docker container spawning inside the backend).
5. **Key Pair**: Create/select your `.pem` key pair to SSH.
6. **Network Settings (Security Groups)**:
   - **SSH (Port 22)**: Allow from anywhere
   - **HTTP (Port 80)**: Allow from anywhere
   - **HTTPS (Port 443)**: Allow from anywhere
   - **Custom TCP (Port 8000)**: Allow from anywhere
7. **Storage**: Allocate at least **20-30 GB**. Click **Launch instance**.

### Step 2: SSH into Your Server
Wait for the instance state to be "Running", copy the **Public IPv4 address**, and run:
```bash
cd Downloads # or where your key is saved
chmod 400 your-key-name.pem
ssh -i "your-key-name.pem" ubuntu@<YOUR-EC2-PUBLIC-IP>
```

### Step 3: Install Docker & Docker Compose
Once logged into your EC2 instance, run the following commands to set up Docker:
```bash
sudo apt update -y
sudo apt install docker.io -y
sudo apt install docker-compose-v2 -y

sudo systemctl start docker
sudo systemctl enable docker

# Allow 'ubuntu' user to run docker commands without 'sudo'
sudo usermod -aG docker ubuntu
```
*Note: Type `exit` to log out, and SSH back in for the `ubuntu` user permissions to apply.*

### Step 4: Add Your Code to the Server
Clone your repository:
```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
```

### Step 5: Configure Environment Variables
Recreate your backend `.env` file on the server (never commit secrets to GitHub!):
```bash
cd backend
nano .env
```
Paste in your environment variables, then save (`Ctrl + O`, `Enter`, `Ctrl + X`).

*Important:* Ensure your MongoDB and Redis connection URLs point to cloud databases (like MongoDB Atlas/ElastiCache) rather than `localhost`, since this is a cloud deployment.

### Step 6: Build and Run the App
From the root of the project (where the `docker-compose.yml` file is):
```bash
cd ..
docker compose up -d --build
```

### Step 7: Access Your Site
Open your web browser and visit: `http://<YOUR-EC2-PUBLIC-IP>`
