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
templates/{templateId}     doc: { sectionOrder: [...], themes: {...}, schema: {...} }
websites/{websiteId}       doc: { ownerId, templateId, config: {...} }
```

`websites/{websiteId}.config` is written as a **native Firestore map**
(so it's browsable/editable directly in the Firestore console, not an
opaque JSON blob) — see [`src/lib/websites.js`](src/lib/websites.js).
Older docs may still have `config` as a JSON string from before this
change; `useWebsite`'s read tolerates both, and a site is upgraded to the
map form the next time it's saved from the editor. `template`'s reader
(`src/lib/content.js` in that repo) does the same tolerant read.

`templates/{templateId}` is new. Unlike `websites/{id}.config`, its fields
are **native Firestore values** (maps/arrays), not a JSON string — read
as-is by [`src/lib/templates.js`](src/lib/templates.js), no `JSON.parse`.
Three separate top-level fields on the doc:

- **`schema`** (required) — an object map keyed by section id, each
  section's `fields` in turn keyed by field key (not arrays of `{key, ...}`
  — a plain map). This is what actually describes the editing form.
- **`sectionOrder`** (optional) — an array of section ids controlling tab
  order in the editor, since a JS/Firestore map's own key order isn't
  something a template author can rely on for this. Any section present in
  `schema` but missing from `sectionOrder` still shows up, appended after
  the ordered ones — nothing gets silently dropped. Without it, tab order
  falls back to `schema`'s own key order (what the Spa Clinic example below
  uses — it predates `sectionOrder`).

For the same reason, a section's own `fields` (and an `items` block's
`fields`) may declare a sibling `fieldOrder` — an array of field keys
controlling display order within that section/item, since `fields`' own map
key order is just as unreliable as `schema`'s. Any key present in `fields`
but missing from `fieldOrder` still shows up, appended after the ordered
ones. Without `fieldOrder`, field order falls back to `fields`' own
(unreliable) key order.
- **`themes`** (optional) — named color presets; see
  [Theme presets](#theme-presets) below.

`templates.js` assembles these three fields into one object and hands it to
[`src/lib/schemaAdapter.js`](src/lib/schemaAdapter.js)'s `normalizeSchema` /
`normalizeThemes`, which turn it into the flat, render-friendly shape
`SchemaForm`/`SectionNav`/`ThemeEditor` consume.

Authored shape of the `schema` map itself:

```json
{
  "brand": {
    "label": "Thương hiệu",
    "fields": {
      "themePrimary": { "type": "color", "label": "Màu chính" },
      "logo": { "type": "image", "label": "Logo" },
      "name": { "type": "text", "label": "Tên thương hiệu" }
    },
    "fieldOrder": ["logo", "name", "themePrimary"]
  },
  "stats": {
    "label": "Số liệu thống kê",
    "itemLabel": "Số liệu",
    "emptyItem": { "value": "", "label": "" },
    "fields": {
      "value": { "type": "text", "label": "Số liệu" },
      "label": { "type": "text", "label": "Nhãn" }
    }
  },
  "services": {
    "label": "Dịch vụ điều trị",
    "fields": {
      "eyebrow": { "type": "text", "label": "Nhãn nhỏ" },
      "title": { "type": "text", "label": "Tiêu đề" }
    },
    "items": {
      "label": "Danh sách dịch vụ",
      "itemLabel": "Dịch vụ",
      "emptyItem": { "title": "", "tech": "", "desc": "", "image": "" },
      "fields": {
        "title": { "type": "text", "label": "Tên dịch vụ" },
        "tech": { "type": "text", "label": "Công nghệ áp dụng" },
        "desc": { "type": "textarea", "label": "Mô tả" },
        "image": { "type": "image", "label": "Ảnh minh hoạ" }
      }
    }
  },
  "visible": {
    "label": "Hiển thị section",
    "fields": {
      "hero": { "type": "boolean", "label": "Hero" },
      "stats": { "type": "boolean", "label": "Số liệu thống kê" }
    }
  }
}
```

Each top-level key becomes a tab in the editor and a top-level key in the
website's `config` (`config.brand`, `config.services`, ...). A section is one
of three shapes, distinguished structurally (`normalizeSchema` in
`schemaAdapter.js` detects which):

- **Object section** (`brand`, `hero`, `map`, `cta`, `footer`, `promo`,
  `visible`): just `fields` — `config[id]` is an object, one property per
  field key.
- **Pure array section** (`stats`): declares `itemLabel`/`emptyItem`
  alongside `fields` and has no separate `items` key — here `fields`
  describes *one item*, not the section's own properties, so `config[id]` is
  an array directly (not wrapped in `.items`).
- **Mixed section** (`services`, `doctors`, `spaServices`, `process`,
  `branches`, `results`): plain `fields` for the section's own scalar
  properties **plus** a sibling `items` block (itself `{ label, itemLabel,
  emptyItem, fields }`) — `config[id]` is an object whose `items` property is
  the repeatable array.

Leaf field `type`s: `text`, `textarea`, `color`, `number`, `boolean`
(checkbox), `url` (unused by the sample template above but supported).
`image` uploads to Firebase Storage (see below) and stores the download URL.
`object`/`array` container types also exist in the render engine
(`src/components/SchemaFields.jsx`) for schemas that nest more deeply than
this one does, synthesized by the adapter rather than written directly in
the authored JSON.

There's no UI yet for authoring a `templates/{templateId}.schema` doc —
create/edit it directly in the Firebase console for each templateId a
`websites/*` doc references. A website's editing form can't render until its
`templateId`'s config doc exists.

### Section visibility

An object section's own `fields` may include a `visible` (`boolean`) entry
— when present, the editor pulls it out of the form body and renders it as
an eye icon (👁️/🙈) next to that section's name in the sidebar instead
([`lib/sectionVisibility.js`](src/lib/sectionVisibility.js)'s
`hasVisibleToggle` detects this, [`SectionNav.jsx`](src/components/SectionNav.jsx)
renders it). This only applies to object-shaped sections — a pure array
section has no section-level `fields` of its own (see above), so it can't
declare one; give it a sibling `items` block instead (turning it into a
mixed section) if it needs to be hideable as a whole.

The toggle's actual value lives in a single site-wide `config.visible.<sectionId>`
map — **not** `config.<sectionId>.visible` — because that's the contract
every live site built from this template's config actually reads (e.g.
`data.visible?.hero` in `template`'s page component), and what `admin`'s
`createWebsite` seeds a new site's `config.visible` from
(`defaultData.visible` on the template doc). `sectionVisibility.js`'s
`isSectionVisible`/`setSectionVisible` are the one read/write path for this
— missing an entry defaults to visible.

### Theme presets

A template's `schema` map may declare a dedicated `theme` section — an
ordinary object section (see above), conventionally with color-ish fields
like `themePrimary`/`themeAccent`:

```json
{
  "schema": {
    "theme": {
      "label": "Chủ đề",
      "fields": {
        "themePrimary": { "type": "text", "label": "Màu Chính" },
        "themeAccent": { "type": "text", "label": "Màu Phụ" }
      }
    }
  }
}
```

The template's schema doc may also declare a top-level `themes` map, sibling
to `sectionOrder`/`schema`, whose preset color keys match the `theme`
section's field keys:

```json
{
  "themes": {
    "themeA": { "label": "Đỏ", "colors": { "themePrimary": "#000000", "themeAccent": "#111111" } },
    "themeB": { "label": "Xanh", "colors": { "themePrimary": "#0284c7", "themeAccent": "#0891b2" } }
  }
}
```

`schemaAdapter.findColorFields` sources its color-field list from this
`theme` section (falling back to scanning every section for explicit
`color`-type fields, for templates predating this convention). `SchemaForm`
special-cases the `theme` section's tab to render
[`ThemeEditor.jsx`](src/components/ThemeEditor.jsx) instead of the generic
object form: clicking a preset card copies its `colors` into `config.theme`
(matched up by field key); each color also has its own picker for further,
fully custom tuning beyond the presets.

### Array items: hide vs. delete

Every array item gets a reserved `hidden: boolean` alongside its declared
fields, toggled via a checkbox in the editor without touching the item's
content. Deleting an item removes it from the array outright. Adding an item
seeds it from the schema's authored `emptyItem` (falling back to
type-derived empty values if a schema omits it); the "+ Thêm" button and
each item's header label use the schema's `itemLabel` when present. There's
no reorder (up/down) control in the editor yet — item order in `config` is
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
