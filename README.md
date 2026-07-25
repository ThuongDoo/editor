# Website editor (back office)

React + Vite app that lets a website owner sign in, pick one of their sites,
and edit its content. This is the "separate back-office app" referenced in
[`template`](../template)'s README — that app renders `websites/{websiteId}`
read-only; this app is where `config` actually gets written.

One Firebase project is shared with `template` (same `firebaseConfig`, see
[`src/lib/firebase.js`](src/lib/firebase.js)). Unlike `template`, this app is
not pinned to one website at build time — a signed-in user can see and edit
every site they own.

## Data model

```
users/{uid}                doc: { role }
templates/{templateId}     doc: { config: "<JSON string>" }
websites/{websiteId}       doc: { ownerId, templateId, config: "<JSON string>" }
```

`websites/{websiteId}.config` is unchanged from `template`: a JSON string,
parsed on read and re-serialized on write (see
[`src/lib/websites.js`](src/lib/websites.js)).

`templates/{templateId}.config` is new — a JSON string (same storage
convention as a website's own `config`) describing the editing form, parsed
by [`src/lib/templates.js`](src/lib/templates.js). Shape:

```json
{
  "name": "Spa Clinic",
  "version": 1,
  "sections": [
    {
      "id": "hero",
      "label": "Hero Banner",
      "fields": [
        { "key": "title1", "label": "Tiêu đề 1", "type": "text" },
        { "key": "image", "label": "Ảnh", "type": "image" },
        {
          "key": "badge", "label": "Badge", "type": "object",
          "fields": [
            { "key": "value", "label": "Số", "type": "text" },
            { "key": "label", "label": "Nhãn", "type": "text" }
          ]
        }
      ]
    },
    {
      "id": "services",
      "label": "Dịch vụ",
      "fields": [
        {
          "key": "items", "label": "Danh sách dịch vụ", "type": "array",
          "item": {
            "type": "object",
            "fields": [
              { "key": "title", "label": "Tên", "type": "text" },
              { "key": "description", "label": "Mô tả", "type": "textarea" },
              { "key": "image", "label": "Ảnh", "type": "image" }
            ]
          }
        }
      ]
    }
  ]
}
```

Each **section** becomes a tab in the editor and a top-level key in the
website's `config` (`config.hero`, `config.services`, ...). Within a
section, each **field**'s `key` is a property under that section, and `type`
is one of:

- Leaves: `text`, `textarea`, `color`, `url`, `number`, `switch` (boolean toggle)
- `image` — uploads to Firebase Storage (see below), stores the download URL
- `object` — a fixed nested group of sub-`fields` (e.g. `hero.badge`)
- `array` — a repeatable list of items, each shaped by `item` (typically
  `{ type: 'object', fields: [...] }`)

There's no UI yet for authoring a `templates/{templateId}.config` doc —
create/edit it directly in the Firebase console for each templateId a
`websites/*` doc references. A website's editing form can't render until its
`templateId`'s config doc exists.

### Array items: hide vs. delete

Every array item gets a reserved `hidden: boolean` alongside its declared
fields, toggled via a checkbox in the editor without touching the item's
content. Deleting an item removes it from the array outright. There's no
reorder (up/down) control in the editor yet — item order in `config` is
append-only from here.

**Consumer contract**: `template`'s rendering code is expected to skip items
with `hidden: true` when it iterates an array field. `template`'s
`SitePage.jsx` doesn't render per-section content yet (it JSON-dumps the raw
config), so nothing there needs to change today — just something to account
for whenever that rendering is built out.

## How editing works

1. Sign in (Firebase Auth, email/password — users are provisioned via the
   Firebase console, there's no self-serve signup).
2. The site list queries `websites` for docs where `ownerId == currentUser.uid`.
3. Opening a site fetches its `websites/{id}` doc once (not a live
   subscription — an in-progress edit shouldn't get overwritten by a
   concurrent remote change) and its template's config schema, then renders
   one tab per section (see [`src/components/SchemaForm.jsx`](src/components/SchemaForm.jsx))
   prefilled with the website's current `config`.
4. Editing recurses through `object`/`array` fields with no dot-paths — each
   nested level just gets its own value slice and an `onChange` for that
   slice (see [`src/components/SchemaFields.jsx`](src/components/SchemaFields.jsx)).
5. Saving writes the edited object back as `config` via `updateDoc`. Since
   `template` reads this doc live via `onSnapshot`, the change shows up on
   the public site immediately.

## Image uploads

`image` fields upload through [`src/lib/storage.js`](src/lib/storage.js) to
Firebase Storage, under `websites/{websiteId}/{timestamp}-{filename}`, and
store the resulting download URL in `config` like any other field value.

## Firebase security rules

[`firestore.rules`](firestore.rules) gates Firestore writes: only a
website's owner may update its `config` field, and only that field.
[`storage.rules`](storage.rules) mirrors this for uploaded images, checking
the same ownership via `firestore.get()` from within Storage rules. Both
keep **reads** public (`allow read: if true`) because `template`'s live
sites read `websites/*` (and reference uploaded images) with no
authentication — locking reads down would break every deployed client site.

Neither rules file is deployed automatically by anything in this repo —
paste them into the Firebase console (Firestore Rules / Storage Rules tabs)
or run `firebase deploy --only firestore:rules,storage` if the Firebase CLI
is set up, when ready to enforce them. Deploying changes access for the
already-live `template` deployments, so treat it as a deliberate, reviewed
step.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run lint` — eslint
"# editor" 
