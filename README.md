# ResultPro - Final Exam Results System

ResultPro is a professional browser-based final exam results system. It works offline and stores data in the browser with `localStorage`.

## Features

- Separate admin and student portals
- Admin login with username and password
- Student result lookup by student ID or roll number
- Student registration with roll number, class, and mother's name
- Finance hold/release for blocking and reopening student results
- Custom finance message shown to students when results are held
- Student result page with blue information cards, icons, subject progress bars, special notes, and contact panel
- Subject setup with maximum score
- Marks entry per student
- Automatic totals, averages, grades, decision, and ranking
- Dashboard metrics and grade distribution
- Final results report with search
- Printable result slips
- CSV export
- JSON backup and restore
- School logo upload for the portal and result slips
- Demo data reset

## How to open

Open `index.html` in a web browser.

## Default access

- Admin username: `admin`
- Admin password: `admin123`
- Demo student roll numbers: `F4-001`, `F4-002`, `F4-003`, `F4-004`

Admin credentials can be changed from the Settings page.
The school logo can also be uploaded from Settings. Use a PNG or JPG image under 750 KB.
Call center, WhatsApp, email, Facebook, and address details can be edited from Settings and will appear in the footer/result notices.

## Notes

This is a static app, so no database server is required. For multi-computer or school-wide deployment, the next step would be adding a backend database and user accounts.
