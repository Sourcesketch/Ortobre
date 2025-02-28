# Preorder Web App
A modern web application for preordering fresh agricultural produce. Built with React, Vite, Tailwind CSS, and Supabase, the application allows users to sign in via email, social providers (Google, Facebook), or phone OTP, view dynamically priced products, and place preorders. The admin dashboard includes features to manage products, set preorder availability, generate reports (with PDF export and email functionality), and manage users.

# Features
## User Authentication:
Email/Password sign-up and login
Social login via Google and Facebook
Phone number login using OTP
## User Dashboard
Daily list of available products (without showing remaining stock)
Dynamic pricing: Product prices automatically drop by a set percentage (e.g., 10%) each hour
Preorder system: Users select products and choose quantities (up to available limits)
## Admin Dashboard
Product management (CRUD) with dynamic product naming (combination of type, variety, and quality)
Preorder availability settings with a switch to disable preordering for the day
Sorting and filtering of products and reports
## Reporting module:
Report 1: Completed preorders with sortable columns (Order ID, Username, Product, etc.)
Report 2: Leftover stock with sortable columns and a username column
Export reports as PDF and email them to the admin
## PDF Export
This project uses @react-pdf/renderer to generate PDF documents directly in the React frontend. See the React PDF documentation for more details.
## Modern UI:
Responsive design using Tailwind CSS (including Grid and Flexbox)
Glassmorphism UI components for a sleek look
# Tech Stack
Frontend: React, Vite, Tailwind CSS, Framer Motion, Lucide Icons
Backend: Supabase (PostgreSQL, Authentication, Storage)
PDF Export: @react-pdf/renderer
Serverless Functions (for emailing reports): Supabase Edge Functions (Deno)
SMS/OTP Authentication: Supabase Auth with SMS provider (Twilio or similar)
# Getting Started
## Prerequisites
Node.js (>=14)
npm or yarn
A Supabase project (with authentication, database, and storage configured)
(Optional) An SMS provider (e.g., Twilio) if using phone number authentication
(Optional) API keys for social providers (Google, Facebook) configured in your Supabase project
# Running the Application
npm run dev
# or
yarn dev

