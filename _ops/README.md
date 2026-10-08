# Lead intake setup

The form on `/hire` sends each submission to a small Google Apps Script (`leads.gs`). That script:

1. logs the lead in a Google Sheet, with a 0–100 fit score,
2. emails the lead a friendly confirmation,
3. if you add an API key, asks Claude to draft their free Time-Back Plan,
4. emails you the lead together with the draft plan, so you can review it and send it.

Until you connect the script, the form still works. It opens a pre-filled email to hello@relative.dev instead.

> This folder starts with `_`, so GitHub Pages (Jekyll) doesn't publish it.

## Setup (about 10 minutes)

1. **Create the sheet.** Make a new Google Sheet called "Relative Leads". Use the Google account that should send the emails.
2. **Add the script.** In the sheet, open **Extensions → Apps Script**. Delete the starter code, then paste in all of `leads.gs` and save.
3. **Set properties.** Open **Project Settings (gear) → Script Properties** and add:
   - `NOTIFY_EMAIL` = the address that should get new-lead alerts, e.g. `hello@relative.dev`
   - `ANTHROPIC_API_KEY` = your Claude API key from console.anthropic.com. This is optional; skip it and you won't get auto-drafted plans.
4. **Deploy.** Click **Deploy → New deployment → Web app**, and set:
   - *Execute as:* **Me**
   - *Who has access:* **Anyone**

   Click Deploy, approve the permissions it asks for, and copy the **Web app URL**. It ends in `/exec`.
5. **Connect the site.** In `hire/index.html`, find this line and paste the URL between the quotes:
   ```js
   var LEADS_ENDPOINT = '';
   ```
   Commit and push.
6. **Test it.** Submit the form on relative.dev/hire using your own email. You should see a new row in the sheet, a confirmation email in your inbox, and an alert containing the draft plan.

When you edit `leads.gs` later, go to **Deploy → Manage deployments → Edit → New version**. That keeps the same URL.

## Working the leads

- Sort the sheet by **Score** to see the best fits first.
- Use the **Status** column to track each lead: New → Plan sent → Call booked → Won / Lost.
- Send each person their plan within 2 business days. The form promises this.
- The draft plan from Claude is only a starting point. Check every suggestion before you send it.

## Tracking outreach

Add `?utm_source=outreach&utm_campaign=<niche>` to the links in your cold emails, for example
`https://relative.dev/hire?utm_source=outreach&utm_campaign=dental#start`. The sheet's **Source** column then tells you which campaign each lead came from.
