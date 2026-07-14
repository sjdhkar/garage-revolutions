# Revolution Moto Garage CRM

A responsive and modern Garage CRM system built with **Angular 21** and packaged with **Electron** for desktop execution. It is designed to operate completely offline, utilizing browser local storage, with billing sharing capabilities via WhatsApp.

---

## 🚀 Key Features

*   **📊 Interactive Dashboard**: High-level telemetry of total jobs, pending services, revenue metrics, and inventory overview.
*   **🏍️ Job Card Management**: Streamlined tracking of vehicle details, diagnostic data, custom tasks/parts estimation, and service progress.
*   **📦 Inventory Control**: Real-time management of spare parts, lubricants, fluid stocks, and automatic low-stock alerts.
*   **🧾 Billing & Invoicing**: Automated invoice generation featuring WhatsApp sharing integration and dynamically rendered UPI QR codes.
*   **👤 Customer Management**: Indexed archive of customers and linked vehicles with detailed service histories.
*   **⚡ PWA & Offline Support**: Runs offline, and registers instantly using Angular Service Workers.

---

## 🛠️ Tech Stack & Architecture

*   **Frontend**: Angular 21 (Standalone Components, Signals API, `inject()` pattern, and Router with HashLocationStrategy)
*   **Desktop Shell**: Electron (integrates web app as a standalone multi-platform application)
*   **Styling**: Bootstrap 5 + custom CSS variables for premium look & feel
*   **Testing**: Vitest (`@angular/build:unit-test`)
*   **CI/CD Pipeline**: GitHub Actions (artifacts-based deployment to GitHub Pages)

---

## 💻 Getting Started

### 📋 Prerequisites
Make sure you have [Node.js](https://nodejs.org/) (version 20 or higher) and `npm` installed.

### 📥 Installation
Clone the repository and install all dependencies:
```bash
npm install
```

### 🏃 Running the Application

*   **Web App (Development Server)**:
    ```bash
    npm run start
    ```
    Open `http://localhost:4200/` in your browser.

*   **Electron Desktop Client**:
    ```bash
    npm run electron:start
    ```
    This task automatically compiles production output and launches the native Electron system window.

---

## 🛠️ Testing & Building

*   **Run Unit Tests** (using Vitest):
    ```bash
    npm run test
    ```

*   **Build Web App** (Production bundle):
    ```bash
    npm run build
    ```

*   **Compile Standalone Desktop Installer**:
    ```bash
    npm run electron:build
    ```
    Creates the standalone `.exe` install distribution utilizing `electron-builder`.

---

## 🌐 Deployment CI/CD

Deployments are fully automated via GitHub Actions:
- On code pushes to the `main` branch, [.github/workflows/deploy.yml](.github/workflows/deploy.yml) triggers.
- It runs the Vitest unit tests, compiles the production code with exact base href paths, and deploys directly to GitHub Pages.
