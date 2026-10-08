# Lead intake setup

## Form emails (required, 1 minute)

Both forms (the free-plan form on `/hire` and "Let's talk" on plan pages) email every submission to **adam@relative.dev** through [FormSubmit](https://formsubmit.co), a free form-to-email service. It's set up and working:

1. ✅ Done: the form is activated for adam@relative.dev.
2. Every submission arrives in that inbox as a tidy table, and pressing Reply goes straight to the lead.

To use a different inbox, change `LEADS_EMAIL` at the top of `assets/relative.js` (and activate again). Until the form is activated, a visitor who submits sees a polite message with a direct email link instead.

## Lead sheet and plan-open tracking (optional)

The site sends three kinds of events to a small Google Apps Script (`leads.gs`):

| Event | Comes from | What happens |
|---|---|---|
| **lead** | the free-plan form on `/hire` | Logged to the **Leads** sheet with a 0–100 fit score. The lead gets a confirmation. If you add an API key, Claude drafts their plan and you get an alert with the draft. |
| **view** | a prospect opening their personal plan page (`/for/#p=…`) | Logged to the **Plan views** sheet, so you know who's warm |
| **plan_request** | a prospect picking ideas on their plan page and tapping "Let's talk" | Logged to **Leads** as a top-priority "Plan request". They get a confirmation and you get an urgent alert. |

Until you connect the script, forms still email you through FormSubmit (above); you just won't get the sheet or plan-open tracking.

> This folder starts with `_`, so GitHub Pages (Jekyll) doesn't publish it.

## Setup (about 10 minutes)

1. **Create the sheet.** Make a new Google Sheet called "Relative Leads". Use the Google account that should send the emails.
2. **Add the script.** In the sheet, open **Extensions → Apps Script**. Delete the starter code, then paste in all of `leads.gs` and save.
3. **Set properties.** Open **Project Settings (gear) → Script Properties** and add:
   - `NOTIFY_EMAIL` = the address that should get new-lead alerts, e.g. `adam@relative.dev`
   - `ANTHROPIC_API_KEY` = your Claude API key from console.anthropic.com. This is optional; skip it and you won't get auto-drafted plans.
4. **Deploy.** Click **Deploy → New deployment → Web app**, and set:
   - *Execute as:* **Me**
   - *Who has access:* **Anyone**

   Click Deploy, approve the permissions it asks for, and copy the **Web app URL**. It ends in `/exec`.
5. **Connect the site.** In `assets/relative.js`, find this line and paste the URL between the quotes:
   ```js
   var LEADS_ENDPOINT = '';
   ```
   Commit and push.
6. **Test it.** Submit the form on relative.dev/hire using your own email. You should see a new row in the sheet, a confirmation email in your inbox, and an alert containing the draft plan. Then open relative.dev/for/ and try "Let's talk". The sample page doesn't log views; real plan links do.

When you edit `leads.gs` later, go to **Deploy → Manage deployments → Edit → New version**. That keeps the same URL.

## Working the leads

- Sort the sheet by **Score** to see the best fits first.
- Use the **Status** column to track each lead: New → Plan sent → Call booked → Won / Lost.
- Send each person their plan within 2 business days. The form promises this.
- The draft plan from Claude is only a starting point. Check every suggestion before you send it.

## Tracking outreach

Add `?utm_source=outreach&utm_campaign=<niche>` to the links in your cold emails, for example
`https://relative.dev/hire?utm_source=outreach&utm_campaign=dental#start`. The sheet's **Source** column then tells you which campaign each lead came from.
