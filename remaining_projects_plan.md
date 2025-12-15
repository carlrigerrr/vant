# Remaining Features Implementation Plan

This document outlines the features that are yet to be implemented or are currently in progress. It serves as a guide for future development.

## 1. Feature #23: Jobs Counter
**Goal:** Track the number of jobs completed by each employee.

-   **Implementation Plan:**
    -   **Backend:**
        -   Update `User` model to include a `jobsCompleted` counter or derive it dynamically.
        -   Alternatively, create a `Job` model if jobs are more complex entities than just shifts.
        -   Ideally, calculate this from the `Attendance` or `Schedule` data where a "job" is defined (e.g., a completed shift or a specific task).
    -   **Frontend:**
        -   Display job counts on the **Employee Dashboard** and **Admin Performance Dashboard**.
        -   Add a "Job Completed" action if manual incrementing is needed, or tie it to the "Check-Out" action in `CheckInCheckOut` component.

## 3. Feature #24: Rating System
**Goal:** Allow clients to rate employees or shifts.

-   **Implementation Plan:**
    -   **Backend:**
        -   Create a `Rating` model (fields: `clientId`, `employeeId`, `rating` (1-5), `comment`, `date`).
        -   Create API endpoints: `POST /api/ratings`, `GET /api/ratings/employee/:id`.
    -   **Frontend:**
        -   **Client Side:** Add a rating modal or page in the Client Portal to rate recent services.
        -   **Admin Side:** Display ratings in the **Performance Dashboard**.
        -   **Employee Side:** Optionally show employees their average rating.

## 4. Feature #25: Revenue Tracking
**Goal:** Track revenue generated from clients/jobs.

-   **Implementation Plan:**
    -   **Backend:**
        -   Enhance `Client` or `Schedule`/`Job` model to include billing/revenue data (e.g., `hourlyRate`, `totalAmount`).
        -   Create API endpoints for revenue stats: `GET /api/revenue/stats` (weekly, monthly, total).
    -   **Frontend:**
        -   **Admin Dashboard:** Create a "Revenue" section or page.
        -   Visuals: Use charts (like in Performance Dashboard) to show revenue trends.
        -   Tables: Show revenue breakdown by client or employee.
