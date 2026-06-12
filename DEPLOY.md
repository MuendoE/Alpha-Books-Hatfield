# Deploying Alpha Books Hatfield

A static site (HTML, CSS, JS). Source lives on GitHub, hosting runs on Firebase.

## Before you start
- Node.js and npm installed (check with `node -v`)
- Git installed (check with `git --version`)
- A GitHub account and a Google account

## 1. Put the files in one folder
Copy these into a new folder:
`index.html`, `sell.html`, `thanks.html`, `condition.html`, `styles.css`, `app.js`, `books.js`, `DEPLOY.md`

```bash
mkdir alpha-books-hatfield
cd alpha-books-hatfield
# move the downloaded files into this folder
```

## 2. Push the source to GitHub
Create an empty repo first at github.com (no README), then:

```bash
git init
git add .
git commit -m "Alpha Books Hatfield: initial site"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/alpha-books-hatfield.git
git push -u origin main
```

Or, if you have the GitHub CLI installed, it does all of that in one line:

```bash
gh repo create alpha-books-hatfield --public --source=. --remote=origin --push
```

## 3. Deploy to Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
```

Answer the prompts like this:
- **Project:** create a new one (e.g. `alpha-books-hatfield`) or pick an existing one
- **Public directory:** `.` (a single dot, because your files are in the root)
- **Single-page app, rewrite all URLs to index.html:** No (this is a multi-page site)
- **Set up automatic builds and deploys with GitHub:** Yes for push-to-deploy, otherwise No
- **Overwrite existing index.html / 404.html:** No

Then publish:

```bash
firebase deploy --only hosting
```

Your site goes live at `https://PROJECT_ID.web.app`.

## 4. Updating the site later
If you chose the GitHub option above, every push deploys on its own:

```bash
git add .
git commit -m "update stock"
git push
```

If not, redeploy by hand with `firebase deploy --only hosting`.

## Before going live, fill these in
- In `app.js`, set `SITE.returnUrl` and `SITE.cancelUrl` to your live address,
  e.g. `https://alpha-books-hatfield.web.app/thanks.html` and `.../index.html`
- In `app.js`, set your PayFast `merchantId` and `merchantKey`
- Formspree, email, phone, and WhatsApp are already wired in

## Custom domain (optional)
Firebase console, Hosting, Add custom domain, then follow the DNS records.
For a `.co.za`, buy it from a local registrar such as Afrihost or domains.co.za.
