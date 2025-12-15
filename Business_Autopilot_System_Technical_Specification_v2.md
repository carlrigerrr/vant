# BUSINESS AUTOPILOT SYSTEM
## Complete Technical Specification
### For Cleaning Business Automation

**Document Version:** 2.0  
**Date:** December 10, 2025  
**Status:** CONFIDENTIAL — FOR INTERNAL DEVELOPMENT USE

---

## Table of Contents

1. [Executive Summary & Vision](#1-executive-summary--vision)
2. [Target Audience & Core Pain Points](#2-target-audience--core-pain-points)
3. [Complete Feature List](#3-complete-feature-list)
4. [Google Sheet Architecture](#4-google-sheet-architecture)
5. [Module 1: Lead Capture & Automated Quoting](#5-module-1-lead-capture--automated-quoting)
6. [Module 2: Client Management & Client Bible](#6-module-2-client-management--client-bible)
7. [Module 3: Employee Management](#7-module-3-employee-management)
8. [Module 4: Intelligent Scheduling System](#8-module-4-intelligent-scheduling-system)
9. [Module 5: Invoicing & Payment Automation](#9-module-5-invoicing--payment-automation)
10. [Module 6: Communication & Notifications](#10-module-6-communication--notifications)
11. [Module 7: Cleaner Check-In System](#11-module-7-cleaner-check-in-system)
12. [Module 8: Dashboard & Reporting](#12-module-8-dashboard--reporting)
13. [Module 9: Client Portal](#13-module-9-client-portal)
14. [Module 10: Employee Mobile View](#14-module-10-employee-mobile-view)
15. [Edge Case Handling & Error Prevention](#15-edge-case-handling--error-prevention)
16. [Security & Data Protection](#16-security--data-protection)
17. [External Integrations](#17-external-integrations)
18. [HTML Email Templates](#18-html-email-templates)
19. [Go-to-Market Strategy](#19-go-to-market-strategy)
20. [Development Phases & Timeline](#20-development-phases--timeline)
21. [Appendix: Script Function Reference](#21-appendix-script-function-reference)

---

## 1. Executive Summary & Vision

### 1.1 The Vision

To free cleaning business owners from the tyranny of daily operations, allowing them to stop being dispatchers and start being CEOs.

### 1.2 The Problem

The #1 pain point for cleaning business owners—even those using existing software like ZenMaid—is the constant, overwhelming chaos of communication and scheduling. They are "glued to their phones all day," answering repetitive questions, manually balancing schedules, and chasing payments. This prevents them from focusing on high-value "CEO tasks" like marketing, sales, and strategic growth.

### 1.3 The Solution

The "Business Autopilot System" is a powerful, automated "Mission Control" dashboard built on Google Workspace (Sheets, Docs, Forms, Apps Script). This is not a simple template—it is a sophisticated, productized service that we will personally install and configure for each client.

### 1.4 The Strategy

This system serves as our initial product offering (Phase 1). It allows us to go to market quickly, generate immediate revenue, and build deep relationships with a cohort of "founding members." The insights and revenue from this phase will directly fund and inform the development of our full SaaS application (Phase 2), which these founding members will receive for free for the first year.

### 1.5 Key Differentiators

What separates this from a DIY weekend project:

- **Seamless integrations:** Quote approval → Client database → Client Bible → Daily briefings → Schedule → Invoice chain all working together
- **Robust edge case handling:** Double approvals, schedule conflicts, deleted clients, and more
- **Professional polish:** HTML email templates, formatted PDF invoices, clean dashboard
- **SMS notifications** via Twilio integration
- **Stripe/Square payment integration** with auto-status updates
- **Google Calendar two-way sync**
- **Cleaner check-in/check-out system** with no-show alerts
- **Client portal and employee mobile view**

---

## 2. Target Audience & Core Pain Points

### 2.1 Ideal Customer Profile

| Attribute | Description |
|-----------|-------------|
| **Name** | "Payge" or "Frank" |
| **Business Size** | 2-20 employees |
| **Current State** | Personally handling most administrative work |
| **Technology** | Likely using some software but still overwhelmed |

### 2.2 Core Pain Points

#### Pain Point 1: Communication Chaos
Constantly answering the same "stupid questions" from employees (e.g., "What's the gate code?") and clients. Hours lost to text messages and phone calls that could be automated.

#### Pain Point 2: The "Certainty Gap"
The fundamental conflict between owners needing scheduling flexibility to book jobs and cleaners wanting a predictable schedule they can plan their lives around. This leads to arguments and difficulty staffing last-minute jobs.

#### Pain Point 3: Manual Financial Workflow
Spending hours creating quotes in Word, generating PDF invoices, and manually chasing down late payments via email. No visibility into who has paid and who hasn't.

#### Pain Point 4: Lack of a "Single Source of Truth"
Critical information is scattered across text messages, emails, and multiple spreadsheets, leading to errors, missed appointments, and inefficiency.

#### Pain Point 5: Inability to "Work ON the Business"
All of the above problems keep the owner trapped "in the business," preventing them from focusing on marketing, sales, hiring, and strategic growth.

---

## 3. Complete Feature List

### 3.1 Core Modules (1-8)

| # | Module | Description |
|---|--------|-------------|
| 1 | Lead Capture & Quoting | Google Form → auto-email with approve button → client creation |
| 2 | Client Database | Auto-populated from approved quotes with full contact info |
| 3 | Client Bible | Alarm codes, keys, preferences, photos — eliminates stupid questions |
| 4 | Employee Management | Contact info, pay rates, availability tracking |
| 5 | Schedule Grid | Visual scheduling with conflict detection and recurring jobs |
| 6 | Invoicing & Payments | One-click invoice generation, Stripe webhook for auto-paid status |
| 7 | Feedback Collection | Post-job surveys linked to clients and employees |
| 8 | Dashboard | Jobs today, revenue this month, profit margins, ratings |

### 3.2 Automation & Notifications (9-14)

| # | Feature | Description |
|---|---------|-------------|
| 9 | Daily Briefing Emails | Personalized schedule + Client Bible info sent to each cleaner at 6 AM |
| 10 | SMS Alerts (Twilio) | Schedule changes, emergencies, check-in reminders |
| 11 | Google Calendar Sync | Two-way sync, color-coded by employee |
| 12 | Cleaner Check-In System | One-click arrival confirmation with no-show alerts |
| 13 | Schedule Lock-In | Weekly finalization with automatic notifications |
| 14 | Payment Reminders | Automated 7-day and 14-day follow-ups |

### 3.3 Edge Case Handling (15-19)

| # | Protection | Description |
|---|------------|-------------|
| 15 | Double Approval Prevention | Prevents same quote from being approved twice |
| 16 | Schedule Conflict Detection | Alerts when same employee assigned overlapping times |
| 17 | Deleted Client Protection | Prevents invoicing for removed clients |
| 18 | Protected Headers | Named Ranges prevent accidental structure changes |
| 19 | Emergency Reset | One-click trigger re-initialization menu item |

### 3.4 Client-Facing Features (20-21)

| # | Feature | Description |
|---|---------|-------------|
| 20 | Client Portal | View upcoming appointments, request changes, update info, pay invoices |
| 21 | Employee Mobile View | Today's jobs with Client Bible info — no app install needed |

---

## 4. Google Sheet Architecture

### 4.1 Sheet Structure Overview

The "Mission Control" Google Sheet contains 10 interconnected tabs. All sheets use Named Ranges and protected headers.

| Sheet Name | Purpose |
|------------|---------|
| Dashboard | Visual overview of key metrics and KPIs |
| Leads | Incoming quote requests from Google Form |
| Clients | Master client database (auto-populated from approved quotes) |
| Client_Bible | Entry instructions, alarm codes, key locations, preferences, photos |
| Employees | Staff contact info, pay rates, availability |
| Schedule | Main scheduling grid with job assignments |
| Recurring_Jobs | Templates for auto-generating weekly/biweekly/monthly jobs |
| Jobs_to_Invoice | Completed jobs pending billing |
| Feedback | Post-job client ratings and comments |
| Config | System settings, API keys, business info |

### 4.2 Named Ranges (Critical for Script Stability)

Every column header must be defined as a Named Range to prevent script failures if users accidentally rename columns.

#### Implementation Pattern:
1. Select the header cell (e.g., A1 containing "ClientName")
2. Go to Data → Named Ranges
3. Name it: `Clients_ClientName`
4. Scripts reference `getRange('Clients_ClientName')` instead of hardcoded column letters

#### Header Protection:
- Protect Row 1 on all sheets (Data → Protect sheets and ranges)
- Set permission to "Only you" or add specific editors
- Show warning when editing protected range

---

## 5. Module 1: Lead Capture & Automated Quoting

### 5.1 Objective

Automate the entire lead-to-client pipeline. When a prospect submits a quote request, they receive an immediate professional email. One click approves the quote and creates them as a client.

### 5.2 Leads Sheet Structure

| Column | Type | Description |
|--------|------|-------------|
| Timestamp | DateTime | Auto-generated by Google Form |
| LeadID | String | Auto-generated unique ID (e.g., LEAD-001) |
| Name | String | Client's full name |
| Email | Email | Client's email address |
| Phone | Phone | Client's phone number |
| Address | String | Service address |
| ServiceType | Dropdown | Standard Clean, Deep Clean, Move-In/Out, etc. |
| SquareFootage | Number | Home size for pricing calculation |
| QuotePrice | Currency | Calculated or manually entered price |
| Status | Dropdown | New, Quote Sent, Approved, Declined, Closed |
| ApprovalToken | String | Unique UUID for secure approval link |
| QuoteSentDate | DateTime | When quote email was sent |
| ApprovedDate | DateTime | When client approved (if applicable) |

### 5.3 Script: onFormSubmit_LeadCapture

**Trigger:** Google Form submission

**Logic Flow:**
1. Read the new lead's data from the form submission
2. Generate unique LeadID (format: LEAD-XXX)
3. Generate unique ApprovalToken (UUID v4)
4. Calculate QuotePrice based on ServiceType and SquareFootage (use pricing matrix in Config sheet)
5. Create approval URL: `https://script.google.com/.../exec?action=approve&token=[ApprovalToken]`
6. Send professional HTML email with quote details and "Approve Quote" button
7. Update Status to "Quote Sent" and set QuoteSentDate
8. Send SMS notification to owner: "New lead received: [Name]"

### 5.4 Script: doGet_QuoteApproval (Web App)

**Trigger:** Client clicks approval link

**Logic Flow:**
1. Parse URL parameters: action and token
2. Find lead row by matching ApprovalToken
3. **EDGE CASE:** If Status is already "Approved", display "Already approved" message and exit
4. **EDGE CASE:** If token not found, display "Invalid link" error page
5. Update Status to "Approved" and set ApprovedDate
6. Copy client data to Clients sheet (call createNewClient function)
7. Create blank Client Bible entry for this client
8. Send email to owner: "New Client Won! [Name] approved $[QuotePrice] quote"
9. Send SMS to owner with same notification
10. Display professional "Thank You" confirmation page to client

---

## 6. Module 2: Client Management & Client Bible

### 6.1 Objective

Maintain a master database of all clients and eliminate "stupid questions" by centralizing all property-specific information that cleaners need.

### 6.2 Clients Sheet Structure

| Column | Type | Description |
|--------|------|-------------|
| ClientID | String | Unique ID (e.g., CLIENT-001) |
| ClientName | String | Full name |
| Email | Email | Primary email |
| Phone | Phone | Primary phone |
| Address | String | Service address |
| DefaultService | Dropdown | Their usual service type |
| DefaultPrice | Currency | Their standard rate |
| Frequency | Dropdown | Weekly, Biweekly, Monthly, One-time |
| PreferredDay | Dropdown | Preferred cleaning day |
| PreferredTime | Time | Preferred start time |
| Status | Dropdown | Active, Paused, Inactive |
| CreatedDate | DateTime | When they became a client |
| SourceLeadID | String | Reference to original lead |
| PortalToken | String | Unique token for client portal access |

### 6.3 Client_Bible Sheet Structure

This is the "Stupid Questions Eliminator" — the highest-leverage feature in the system.

| Column | Type | Description |
|--------|------|-------------|
| ClientID | String | Links to Clients sheet |
| ClientName | String | For easy reference (auto-populated via VLOOKUP) |
| Entry_Instructions | Text | "Use side gate, key under blue pot" |
| Alarm_Code | String | Security alarm code |
| Gate_Code | String | Community or property gate code |
| Key_Location | Text | Where spare key is hidden/stored |
| Lockbox_Code | String | If they use a lockbox |
| Wifi_Password | String | For smart home access if needed |
| Parking_Instructions | Text | Where to park, permits needed |
| Pet_Info | Text | "Dog is friendly, cat hides under bed" |
| Client_Preferences | Text | "No bleach on counters, use their vacuum" |
| Areas_to_Avoid | Text | "Don't clean home office, husband works from home" |
| Internal_Notes | Text | "Back door lock is tricky, lift handle up" |
| Photo_URLs | Text | Comma-separated Google Drive links to photos |
| Last_Updated | DateTime | Auto-updated on any edit |

### 6.4 Photo Attachment Feature

Photos are stored in Google Drive and referenced via URLs. This allows cleaners to see visual instructions like "where the key is hidden" or "how to operate the alarm panel."

**Implementation:**
- Create a "Client_Photos" folder in Google Drive
- Subfolders for each client (named by ClientID)
- Photos uploaded manually or via Google Form with file upload
- Photo_URLs column stores shareable links
- Daily briefing emails include thumbnail images with "View Full Size" links

### 6.5 Security Warning

> ⚠️ **CRITICAL:** The Client Bible contains sensitive information (alarm codes, key locations). Cleaners must NEVER have direct access to the Google Sheet. They only receive information via automated daily briefing emails. This must be emphasized during client onboarding.

---

## 7. Module 3: Employee Management

### 7.1 Employees Sheet Structure

| Column | Type | Description |
|--------|------|-------------|
| EmployeeID | String | Unique ID (e.g., EMP-001) |
| EmployeeName | String | Full name |
| Email | Email | For daily briefings |
| Phone | Phone | For SMS notifications |
| PayRate | Currency | Hourly rate for profit calculations |
| PayType | Dropdown | Hourly, Per Job, Salary |
| CalendarColor | String | Hex color for calendar sync (e.g., #4285F4) |
| Status | Dropdown | Active, On Leave, Inactive |
| HireDate | Date | Start date |
| DefaultAvailability | Text | JSON string of typical weekly availability |
| CheckInToken | String | Unique token for check-in links |

---

## 8. Module 4: Intelligent Scheduling System

### 8.1 Objective

Solve the "Certainty Gap" — the fundamental conflict between owners needing flexibility and cleaners wanting predictability. Provide visual scheduling with conflict detection, recurring job support, and Google Calendar integration.

### 8.2 Schedule Sheet Structure

| Column | Type | Description |
|--------|------|-------------|
| JobID | String | Unique ID (e.g., JOB-20251210-001) |
| Date | Date | Job date |
| EmployeeID | String | Assigned cleaner |
| EmployeeName | String | Auto-populated via VLOOKUP |
| StartTime | Time | Scheduled start time |
| EndTime | Time | Estimated end time |
| ClientID | String | Client being serviced |
| ClientName | String | Auto-populated via VLOOKUP |
| Address | String | Auto-populated from Clients sheet |
| ServiceType | Dropdown | Type of service for this job |
| JobPrice | Currency | Price for this specific job |
| JobStatus | Dropdown | Scheduled, Confirmed, In Progress, Completed, Cancelled |
| CertaintyLevel | Dropdown | Guaranteed On, Flexible/On-Call, Guaranteed Off |
| CheckInTime | DateTime | When cleaner clicked check-in link |
| CheckOutTime | DateTime | When cleaner clicked check-out link |
| CalendarEventID | String | Google Calendar event ID for sync |
| RecurringJobID | String | Reference to Recurring_Jobs if auto-generated |
| Notes | Text | Job-specific notes |

### 8.3 Recurring_Jobs Sheet Structure

Templates for jobs that repeat on a schedule. The system auto-generates individual job entries based on these templates.

| Column | Type | Description |
|--------|------|-------------|
| RecurringJobID | String | Unique ID (e.g., REC-001) |
| ClientID | String | Client for this recurring job |
| EmployeeID | String | Default assigned cleaner |
| Frequency | Dropdown | Weekly, Biweekly, Monthly, Custom |
| DayOfWeek | Dropdown | Monday, Tuesday, etc. |
| StartTime | Time | Default start time |
| Duration | Number | Expected hours |
| ServiceType | Dropdown | Type of service |
| Price | Currency | Price per occurrence |
| StartDate | Date | When recurring schedule begins |
| EndDate | Date | When it ends (blank = indefinite) |
| IsActive | Boolean | TRUE/FALSE to pause without deleting |
| LastGenerated | Date | Last date jobs were generated through |

### 8.4 Script: generateRecurringJobs

**Trigger:** Time-driven, runs daily at midnight

**Logic Flow:**
1. Get all active recurring jobs from Recurring_Jobs sheet
2. For each recurring job, calculate next 14 days of occurrences
3. Check if job already exists in Schedule for that date/client combo
4. If not exists, create new row in Schedule sheet
5. Create corresponding Google Calendar event
6. Update LastGenerated date in Recurring_Jobs

### 8.5 Script: onEdit_ScheduleChange

**Trigger:** Edit on Schedule sheet

**Logic Flow:**
1. Detect which column was edited
2. If EmployeeID changed: notify both old and new employee via email + SMS
3. If Date or Time changed: notify assigned employee
4. Run conflict detection (see below)
5. Update corresponding Google Calendar event

### 8.6 Script: detectScheduleConflicts

**Called by:** onEdit_ScheduleChange

**Logic:**
- For the edited row, get EmployeeID, Date, StartTime, EndTime
- Scan all other rows for same EmployeeID and Date
- Check for time overlap: `(Start1 < End2) AND (Start2 < End1)`
- If conflict found: highlight both rows in red, show alert to user
- Send email notification to owner: "Schedule Conflict Detected"

### 8.7 Script: lockInSchedule

**Trigger:** Time-driven, runs Friday at 5 PM

**Logic Flow:**
1. Scan Schedule for all jobs in the next 7 days
2. Find all jobs with CertaintyLevel = "Flexible/On-Call"
3. Change their CertaintyLevel to "Guaranteed On"
4. Change background color to green to visually indicate locked-in
5. Send confirmation email to all employees: "Your schedule for next week is now final"
6. Include their personalized schedule in the email

### 8.8 Google Calendar Two-Way Sync

#### Sync Direction 1: Sheet → Calendar
- When job created in Sheet, create Calendar event via Calendar API
- Event title: "[ClientName] - [ServiceType]"
- Event description: Address + any job notes
- Color-coded by employee (using CalendarColor from Employees sheet)
- Store CalendarEventID in Schedule row for future updates

#### Sync Direction 2: Calendar → Sheet
- Time-driven trigger checks for Calendar changes every 15 minutes
- If event moved/deleted in Calendar, update corresponding Sheet row
- Notify owner of external changes: "Schedule modified via Calendar"

---

## 9. Module 5: Invoicing & Payment Automation

### 9.1 Jobs_to_Invoice Sheet Structure

| Column | Type | Description |
|--------|------|-------------|
| InvoiceID | String | Unique ID (e.g., INV-20251210-001) |
| JobID | String | Reference to completed job |
| ClientID | String | Client being invoiced |
| ClientName | String | Auto-populated |
| ClientEmail | Email | Auto-populated for sending |
| ServiceDate | Date | When service was performed |
| ServiceType | String | Type of service |
| Amount | Currency | Invoice amount |
| Generate_Invoice | Checkbox | Check to include in next invoice batch |
| InvoiceStatus | Dropdown | Pending, Sent, Viewed, Paid, Overdue |
| InvoiceSentDate | DateTime | When invoice was emailed |
| DueDate | Date | Payment due date (typically +7 days) |
| PaymentDate | DateTime | When payment was received |
| StripePaymentID | String | Stripe payment intent ID |
| PaymentLink | URL | Stripe payment link for this invoice |
| RemindersSent | Number | Count of reminder emails sent |
| Notes | Text | Any special notes for this invoice |

### 9.2 Script: markJobComplete (Custom Menu)

**Trigger:** Owner clicks "Mark Selected Jobs Complete" in Schedule sheet

**Logic Flow:**
1. Get selected rows from Schedule sheet
2. For each selected job:
   - Update JobStatus to "Completed"
   - **EDGE CASE:** Verify ClientID still exists in Clients sheet
   - If client deleted, show warning and skip
   - Create new row in Jobs_to_Invoice with job details
   - Set InvoiceStatus to "Pending"
3. Show confirmation: "[X] jobs marked complete and ready for invoicing"

### 9.3 Script: generateInvoices (Custom Menu)

**Trigger:** Owner clicks "Billing > Generate Selected Invoices"

**Logic Flow:**
1. Scan Jobs_to_Invoice for rows where Generate_Invoice checkbox is TRUE
2. For each checked row:
   - Generate unique InvoiceID
   - Create Stripe Payment Link via Stripe API
   - Copy Invoice_Template Google Doc
   - Replace placeholders: `{{ClientName}}`, `{{Address}}`, `{{ServiceDate}}`, `{{ServiceType}}`, `{{Amount}}`, `{{InvoiceID}}`, `{{DueDate}}`, `{{PaymentLink}}`
   - Convert to PDF and save in Invoices folder in Drive
   - Send professional HTML email with PDF attached and prominent "Pay Now" button
3. Update InvoiceStatus to "Sent", set InvoiceSentDate and DueDate (+7 days)
4. Uncheck the Generate_Invoice checkbox
5. Show confirmation: "[X] invoices generated and sent"

### 9.4 Script: sendPaymentReminders

**Trigger:** Time-driven, runs daily at 8 AM

**Logic Flow:**
- Scan Jobs_to_Invoice for InvoiceStatus = "Sent" or "Overdue"
- For each, calculate days since DueDate
- **If 7 days overdue AND RemindersSent = 0:** Send 1st reminder (friendly), increment RemindersSent
- **If 14 days overdue AND RemindersSent = 1:** Send 2nd reminder (firmer), increment RemindersSent
- **If 21 days overdue AND RemindersSent = 2:** Notify owner "Manual follow-up needed for [ClientName]"
- Update InvoiceStatus to "Overdue" if past due date

### 9.5 Stripe Webhook Integration

**Endpoint:** doPost(e) Web App

**Logic Flow:**
1. Receive webhook payload from Stripe
2. Verify webhook signature using Stripe secret
3. If event type = "checkout.session.completed" or "payment_intent.succeeded":
   - Extract InvoiceID from metadata
   - Find matching row in Jobs_to_Invoice
   - Update InvoiceStatus to "Paid"
   - Set PaymentDate to now
   - Store StripePaymentID
   - Send confirmation email to client: "Thank you for your payment!"
   - Notify owner: "Payment received: $[Amount] from [ClientName]"
4. Return 200 OK response to Stripe

---

## 10. Module 6: Communication & Notifications

### 10.1 Daily Briefing Email System

#### Script: sendDailyBriefings

**Trigger:** Time-driven, runs daily at 6:00 AM

**Logic Flow:**
1. Get today's date
2. Loop through each ACTIVE employee in Employees sheet
3. For each employee, scan Schedule for all jobs assigned to them today
4. For each job, look up corresponding client in Client_Bible
5. Build personalized HTML email containing:
   - Greeting with employee name
   - Summary: "You have [X] jobs scheduled today"
   - For each job: Time, Client Name, Address (with Google Maps link), Service Type
   - Client Bible info: Entry instructions, alarm code, pet info, preferences
   - Photo thumbnails with "View Full Size" links (if Photo_URLs exist)
   - CHECK-IN LINK: Unique URL for arrival confirmation
6. Send email via MailApp.sendEmail with HTML body
7. If employee has 0 jobs today, optionally send "No jobs scheduled" email (configurable)

### 10.2 SMS Notification System (Twilio)

#### Configuration:
- Twilio Account SID stored in Config sheet (or Script Properties)
- Twilio Auth Token stored in Script Properties (never in sheet)
- Twilio Phone Number stored in Config sheet

#### Helper Function: sendSMS(toPhone, message)
- Use UrlFetchApp to call Twilio REST API
- Endpoint: `https://api.twilio.com/2010-04-01/Accounts/{SID}/Messages.json`
- Method: POST with Basic Auth
- Log all SMS sends for auditing

#### SMS Trigger Points:
| Event | Recipient |
|-------|-----------|
| New lead received | Owner |
| Quote approved | Owner |
| Schedule change | Affected employee(s) |
| No-show alert | Owner |
| Payment received | Owner |
| Schedule conflict detected | Owner |

---

## 11. Module 7: Cleaner Check-In System

### 11.1 Objective

Provide peace of mind to owners by confirming cleaner arrivals. If a cleaner doesn't check in within a grace period, the owner receives an alert.

### 11.2 Check-In Link Generation

Each job in the Daily Briefing email includes a unique check-in link:

```
https://script.google.com/.../exec?action=checkin&job=[JobID]&emp=[EmployeeID]&token=[CheckInToken]
```

### 11.3 Script: doGet_CheckIn (part of main Web App)

**Logic Flow:**
1. Parse URL parameters: action, job, emp, token
2. Verify token matches employee's CheckInToken
3. Find job row in Schedule by JobID
4. **EDGE CASE:** If already checked in, show "Already checked in at [time]" message
5. Set CheckInTime to current timestamp
6. Update JobStatus to "In Progress"
7. Display confirmation page: "Checked in! Have a great clean at [ClientName]"
8. Include CHECK-OUT link on confirmation page

### 11.4 Script: checkForNoShows

**Trigger:** Time-driven, runs every 15 minutes from 8 AM to 6 PM

**Logic Flow:**
1. Scan Schedule for today's jobs
2. For each job where:
   - StartTime was more than 15 minutes ago
   - CheckInTime is blank
   - JobStatus is not "Cancelled"
3. Send ALERT to owner via email AND SMS:
   - "⚠️ ALERT: [EmployeeName] has not checked in at [ClientName] (scheduled for [StartTime])"
4. Mark job as "Alert Sent" to prevent duplicate alerts

### 11.5 Check-Out System

After clicking Check-In, cleaner sees a Check-Out link. When clicked:
1. Set CheckOutTime to current timestamp
2. Calculate actual job duration: CheckOutTime - CheckInTime
3. Update JobStatus to "Completed"
4. Display confirmation with option to report any issues
5. Trigger job completion flow (add to Jobs_to_Invoice)

---

## 12. Module 8: Dashboard & Reporting

### 12.1 Dashboard Sheet Layout

The Dashboard provides at-a-glance metrics. All values are calculated via formulas or refreshed by a script.

#### Section A: Today's Snapshot
- Jobs Scheduled Today: `COUNTIF(Schedule, Date=TODAY())`
- Jobs Completed Today: `COUNTIFS(Schedule, Date=TODAY(), Status="Completed")`
- Jobs In Progress: `COUNTIFS(Schedule, Date=TODAY(), Status="In Progress")`
- Revenue Today: `SUMIFS(Schedule, Date=TODAY(), Status="Completed", JobPrice)`

#### Section B: This Week
- Total Jobs This Week
- Revenue This Week
- Jobs by Employee (mini bar chart via SPARKLINE)

#### Section C: This Month
- Total Revenue This Month
- Total Labor Cost (Hours × PayRate for all completed jobs)
- Gross Profit: Revenue - Labor Cost
- Profit Margin: Gross Profit / Revenue × 100
- New Clients This Month

#### Section D: Accounts Receivable
- Outstanding Invoices: Count where InvoiceStatus = "Sent" or "Overdue"
- Total Outstanding Amount
- Overdue Amount (past DueDate)

#### Section E: Client Satisfaction
- Average Rating This Month (from Feedback sheet)
- Total Reviews This Month
- 5-Star Reviews Count

### 12.2 Profitability Calculator

For each completed job, calculate profit:

```
Profit = JobPrice - (ActualDuration × EmployeePayRate)
```

Where `ActualDuration = (CheckOutTime - CheckInTime)` in hours

This data feeds into the Dashboard "Gross Profit" and per-job profitability reports.

---

## 13. Module 9: Client Portal

### 13.1 Implementation Option: Google Sites

A simple, password-protected Google Site that pulls data from the Google Sheet via Apps Script web app endpoints.

#### Portal Features:
- View upcoming scheduled appointments
- View past service history
- Request schedule changes (creates notification for owner)
- Update contact information
- View and pay outstanding invoices
- Submit feedback after service

#### Authentication:
- Each client gets a unique access token (stored in Clients sheet as PortalToken)
- Portal URL includes token: `/portal?token=[ClientToken]`
- Token validated on each request
- Optional: Add email-based magic link login

### 13.2 API Endpoints for Portal

| Endpoint | Purpose |
|----------|---------|
| `GET ?action=getSchedule&token=[x]` | Returns client's upcoming jobs as JSON |
| `GET ?action=getHistory&token=[x]` | Returns past services |
| `GET ?action=getInvoices&token=[x]` | Returns outstanding invoices |
| `POST ?action=requestChange&token=[x]` | Submits change request |
| `POST ?action=updateInfo&token=[x]` | Updates client contact info |

---

## 14. Module 10: Employee Mobile View

### 14.1 Objective

A mobile-friendly web page that employees can bookmark on their phones. Shows today's jobs with all relevant Client Bible information. No app installation required.

### 14.2 Implementation

A Google Apps Script Web App that returns a responsive HTML page.

#### URL Structure:
```
/mobile?emp=[EmployeeID]&token=[CheckInToken]
```

#### Page Contents:
- Employee name and today's date
- List of today's jobs in chronological order
- For each job:
  - Time and status indicator (upcoming, in progress, completed)
  - Client name and service type
  - Address with tap-to-navigate (Google Maps link)
  - Expandable "Details" section with Client Bible info
  - Photo gallery (swipeable) if photos exist
  - CHECK-IN button (becomes CHECK-OUT after check-in)
- Auto-refresh every 5 minutes

#### Design Requirements:
- Mobile-first responsive design
- Large touch targets (buttons at least 44px)
- Fast loading (minimal dependencies)
- Works offline-ish (shows cached data if connection lost)

---

## 15. Edge Case Handling & Error Prevention

### 15.1 Double Quote Approval Prevention

**Scenario:** Client clicks "Approve Quote" button twice, or shares link with spouse who also clicks.

**Solution:** In doGet_QuoteApproval, FIRST check if Status already equals "Approved". If so, display friendly "This quote has already been approved!" message and exit without creating duplicate client.

### 15.2 Schedule Conflict Detection

**Scenario:** Owner accidentally assigns same employee to two jobs at overlapping times.

**Solution:** onEdit trigger runs detectScheduleConflicts function. Uses time overlap formula: `(Start1 < End2) AND (Start2 < End1)`. If conflict found: highlight both rows red, show popup alert, send email/SMS to owner.

### 15.3 Deleted Client Invoice Protection

**Scenario:** Client is deleted from Clients sheet, but completed jobs still reference them in Jobs_to_Invoice.

**Solution:** Before generating invoice, verify ClientID exists in Clients sheet. If not found, skip that invoice and add to error log. Notify owner: "Cannot invoice [ClientName] - client record not found."

### 15.4 Protected Headers (Fat Finger Prevention)

**Scenario:** Owner accidentally renames column header from "Status" to "Job Status", breaking all scripts that reference "Status".

**Solution:** Use Named Ranges for all columns. Protect header rows (Row 1) on all sheets. Scripts reference named ranges instead of column letters or header text.

### 15.5 Duplicate Check-In Prevention

**Scenario:** Cleaner clicks check-in link multiple times.

**Solution:** Check if CheckInTime already has a value. If so, display "You already checked in at [time]" instead of updating timestamp again.

### 15.6 Stale Token Prevention

**Scenario:** Employee leaves company but still has bookmarked mobile view link.

**Solution:** Validate employee Status = "Active" on every request. If inactive, show "Access denied - please contact your manager."

### 15.7 Emergency Reset Menu

**Scenario:** Scripts stop working due to trigger deletion or timeout.

**Solution:** Custom menu item "🆘 Emergency Reset" that:
1. Deletes all existing triggers
2. Re-creates all time-based and form-submit triggers
3. Verifies named ranges exist
4. Shows confirmation of system status

---

## 16. Security & Data Protection

### 16.1 Sensitive Data Handling

- Client Bible (alarm codes, keys) is NEVER shared directly with cleaners
- Cleaners only receive relevant info via automated daily emails
- Google Sheet is shared only with owner (and our team during setup)
- Twilio Auth Token stored in Script Properties, never in sheet cells
- Stripe API keys stored in Script Properties

### 16.2 Token Security

- All tokens (approval, check-in, portal) are UUID v4 format
- Tokens are validated on every request
- Approval tokens are single-use (invalidated after approval)
- Employee tokens can be regenerated if compromised

### 16.3 Access Control

- Web app deployed as "Execute as me" (owner's account)
- Access set to "Anyone" for public endpoints (approval, check-in)
- All public endpoints require valid token parameter
- Admin functions only accessible via custom menu (requires sheet edit access)

### 16.4 Onboarding Security Checklist

- [ ] Verify owner understands NOT to share sheet with cleaners
- [ ] Set up owner's personal Gmail/Workspace as script executor
- [ ] Move API keys to Script Properties
- [ ] Protect all header rows
- [ ] Remove our team's edit access after setup complete

---

## 17. External Integrations

### 17.1 Twilio (SMS)

#### Setup Requirements:
- Twilio account (we use one master account for all clients)
- Dedicated phone number per client OR shared number with client identification
- Account SID and Auth Token stored in Script Properties

#### Cost Consideration:
Twilio charges ~$0.0079/SMS. Estimate 50-100 SMS/month per client = $0.40-$0.79/month. Consider including in service or billing overage.

### 17.2 Stripe (Payments)

#### Setup Requirements:
- Client's own Stripe account (they receive payments directly)
- API Secret Key stored in Script Properties
- Webhook endpoint configured in Stripe dashboard
- Webhook signing secret for verification

#### Alternative: Square
If client prefers Square, integration is similar. Square also supports payment links and webhooks.

### 17.3 Google Calendar API

#### Setup:
- Enable Calendar API in Google Cloud Console
- Apps Script has built-in CalendarApp service
- For advanced features (color coding), use Calendar API directly via UrlFetchApp
- Owner grants calendar access during script authorization

### 17.4 Google Drive (Photos/Documents)

#### Folder Structure:
```
📁 Business_Autopilot/
   📁 Client_Photos/ (subfolders by ClientID)
   📁 Invoices/ (generated PDFs)
   📁 Templates/ (Invoice template, Email templates)
```

---

## 18. HTML Email Templates

### 18.1 Template List

1. Quote Email (with Approve button)
2. Quote Approved Confirmation (to client)
3. New Client Notification (to owner)
4. Daily Briefing (to employees)
5. Schedule Change Alert
6. Weekly Schedule Lock-In Confirmation
7. Invoice Email (with Pay Now button)
8. Payment Reminder (1st - friendly)
9. Payment Reminder (2nd - firmer)
10. Payment Received Confirmation
11. No-Show Alert (to owner)
12. Schedule Conflict Alert (to owner)
13. Feedback Request (to client after service)

### 18.2 Template Design Standards

- Mobile-responsive (single column, max-width 600px)
- Company logo at top (configurable in Config sheet)
- Brand colors (configurable)
- Clear call-to-action buttons (minimum 44px height)
- Footer with company contact info
- Tested in Gmail, Apple Mail, Outlook

---

## 19. Go-to-Market Strategy

### 19.1 Positioning

We are NOT selling "a Google Sheet." We are selling the "Business Autopilot System" — a done-for-you service that saves owners 10+ hours per week and gives them their sanity back.

### 19.2 The Offer

| Component | Details |
|-----------|---------|
| **Product** | Business Autopilot System |
| **Price** | $599 one-time setup fee |

#### Deliverables:
- Personal Configuration: Complete "Mission Control" Google Sheet configured for their business
- All automation scripts installed and tested
- Google Forms for lead capture and feedback
- Invoice template customized with their branding
- Twilio SMS integration (using our account, first 100 SMS included)
- Stripe payment link integration
- 2-hour onboarding video call
- 30 days priority email support
- Video tutorial library access

### 19.3 The "Founding Member" Incentive

> "You are a founding member of this system. As a thank you for your early support and feedback, when we launch our full SaaS application (estimated in 6-8 months), you will receive a FREE license for the first year (a $XXX value)."

#### Why This Works:
- Justifies the $599 price as a professional service fee
- Creates scarcity and urgency
- Turns first customers into a loyal, invested focus group
- De-risks SaaS development by validating with paying customers first

---

## 20. Development Phases & Timeline

### Phase 1: Core Foundation (Weeks 1-2)

- [ ] Sheet structure with all tabs and columns
- [ ] Named Ranges and header protection
- [ ] Lead capture form and auto-quoting
- [ ] Quote approval webhook
- [ ] Client and Client Bible auto-population
- [ ] Basic daily briefing emails

### Phase 2: Scheduling & Payments (Weeks 3-4)

- [ ] Schedule management with conflict detection
- [ ] Recurring job auto-generation
- [ ] Google Calendar two-way sync
- [ ] Schedule lock-in automation
- [ ] Invoice generation with Stripe payment links
- [ ] Stripe webhook for auto-paid status
- [ ] Payment reminder automation

### Phase 3: Communication & Check-In (Weeks 5-6)

- [ ] Twilio SMS integration
- [ ] Check-in/check-out system
- [ ] No-show alert automation
- [ ] Employee mobile view
- [ ] Client portal (basic version)
- [ ] All HTML email templates

### Phase 4: Polish & Production (Weeks 7-8)

- [ ] Dashboard with all metrics
- [ ] Profitability calculator
- [ ] Edge case handling and error prevention
- [ ] Emergency Reset function
- [ ] Full testing with sample data
- [ ] Documentation and video tutorials
- [ ] Client onboarding checklist

---

## 21. Appendix: Script Function Reference

### 21.1 Trigger-Based Functions

| Function Name | Trigger Type | Timing |
|---------------|--------------|--------|
| onFormSubmit_LeadCapture | Form Submit | On quote request form submission |
| onFormSubmit_Feedback | Form Submit | On feedback form submission |
| onEdit_ScheduleChange | Edit | On any edit to Schedule sheet |
| sendDailyBriefings | Time-driven | Daily at 6:00 AM |
| generateRecurringJobs | Time-driven | Daily at 12:00 AM |
| lockInSchedule | Time-driven | Friday at 5:00 PM |
| sendPaymentReminders | Time-driven | Daily at 8:00 AM |
| checkForNoShows | Time-driven | Every 15 min, 8 AM - 6 PM |
| syncCalendarChanges | Time-driven | Every 15 minutes |

### 21.2 Web App Endpoints (doGet/doPost)

| Action Parameter | Purpose |
|------------------|---------|
| approve | Quote approval (GET) |
| checkin | Employee arrival check-in (GET) |
| checkout | Employee departure check-out (GET) |
| mobile | Employee mobile view page (GET) |
| portal | Client portal page (GET) |
| getSchedule | API: Get client's upcoming jobs (GET) |
| getHistory | API: Get client's past services (GET) |
| getInvoices | API: Get client's outstanding invoices (GET) |
| requestChange | API: Submit schedule change request (POST) |
| updateInfo | API: Update client contact info (POST) |
| stripe_webhook | Stripe payment notifications (POST) |

### 21.3 Custom Menu Functions

| Menu Item | Function |
|-----------|----------|
| Billing > Generate Selected Invoices | generateInvoices() |
| Schedule > Mark Jobs Complete | markJobsComplete() |
| Schedule > Check for Conflicts | runConflictCheck() |
| System > 🆘 Emergency Reset | emergencyReset() |
| System > Regenerate All Tokens | regenerateTokens() |
| System > Test Email Templates | testEmailTemplates() |
| System > View System Status | showSystemStatus() |

### 21.4 Helper Functions

| Function | Purpose |
|----------|---------|
| sendSMS(phone, message) | Send SMS via Twilio |
| sendEmail(to, subject, htmlBody) | Send formatted HTML email |
| generateUUID() | Create unique token |
| getClientBible(clientID) | Fetch all Client Bible data for a client |
| createCalendarEvent(jobData) | Create Google Calendar event |
| updateCalendarEvent(eventID, jobData) | Update existing calendar event |
| createStripePaymentLink(amount, invoiceID) | Generate Stripe payment link |
| verifyStripeWebhook(payload, signature) | Validate Stripe webhook |
| logActivity(action, details) | Log system activity for auditing |

---

## Document End

**Business Autopilot System Technical Specification v2.0**  
**December 2025**

---

*This document is confidential and intended for internal development use only.*
