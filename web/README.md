# RKA & RKPD Management System

A comprehensive web application for managing Regional Activity Plans (RKA) and Work Plans (Renja), built with modern web technologies to streamline the budgeting process for government agencies.

## 🚀 Technologies Framework

This project is built using a robust and modern tech stack:

- **Frontend Framework**: [Next.js 15+](https://nextjs.org/) (App Router) - For server-side rendering, routing, and optimal performance.
- **Language**: [TypeScript](https://www.typescriptlang.org/) - Ensuring type safety and better developer experience.
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework for rapid and responsive UI development.
- **UI Components**: Custom components (Cards, Modals, Tables) built with Tailwind and Lucide React icons.
- **Backend / Database**: [Supabase](https://supabase.com/) (PostgreSQL) - For real-time database, authentication, and RESTful APIs.
- **State Management**: React Hooks (useState, useEffect, useContext).

## ✨ Key Features

### 1. **DASHBOARD & MONITORING (Renja)**
- **Hierarchical View**: Visualizes data in a structured format: *Urusan -> Program -> Kegiatan -> Sub Kegiatan*.
- **Real-time Budget Monitoring**:
  - Automatically aggregates "Total Rincian" from detailed inputs.
  - **Traffic Light Indicators**:
    - 🔴 **Red**: Budget Surplus (Sisa) - Pagu Validasi > Total Rincian.
    - 🟢 **Green**: Budget Deficit (Lebih/Over) - Pagu Validasi < Total Rincian.
    - 🔵 **Blue**: Balanced (Sesuai) - Pagu Validasi = Total Rincian.
- **Quick Actions**:
  - Direct **CRUD** for "Pagu Validasi" directly from the table.
  - Search and filter Sub Activities.

### 2. **RKA DETAILED INPUT (Rincian Belanja)**
- **Multi-level Coefficient System**:
  - Supports complex volume calculations (e.g., `25 Orang x 12 Bulan x 3 Kali`).
  - Automatically calculates **Total Volume** and formats coefficient strings (e.g., "25 x 12").
- **Smart Unit Management**:
  - Auto-suggests combined units (e.g., "Orang Bulan").
  - Allows **Manual Override** for final unit adjustment (e.g., change "Meter Meter" to "m²").
- **Price Reference Integration**:
  - Lookup standard prices from SSH (Standar Satuan Harga), SBU, HSPK, and ASB.
- **Automatic Calculations**:
  - Real-time calculation of Total Price based on `Volume x Harga Satuan`.
  - PPN (Tax) calculation support (0% or 11%).

### 3. **DATA INTEGRATION**
- **Connected Modules**: Seamless flow between RKPD (Renja) and RKA (Rincian).
- **History & Tracking**: Keeps track of budget revisions and drafts.

### 4. **SCHEDULE MANAGEMENT (Jadwal)**
- **Phased Planning**: Manage RKA input phases (e.g., Murni, Perubahan).
- **Timeline Visualization**: View active schedules directly on the Dashboard.
- **Status Control**: Lock/Unlock input phases.

## 🛠 Getting Started

1.  **Clone the repository**
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Set up Database**:
    - Create a new project in [Supabase](https://supabase.com/).
    - Go to the **SQL Editor** in your Supabase dashboard.
    - Copy the content of `src/db/schema_complete.sql` and run it.
    - This will create all necessary tables, policies, and triggers.

4.  **Set up Environment Variables**:
    - Copy `.env.example` to `.env.local`
    - Add your Supabase URL and Anon Key.

5.  **Run the development server**:
    ```bash
    npm run dev
    ```

6.  **Open** [http://localhost:3000](http://localhost:3000) inside your browser.

## 📝 License
by hakiem
