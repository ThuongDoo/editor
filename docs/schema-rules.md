# Rule tạo `schema` cho template (Firestore `templates/{templateId}`)

Tài liệu này tóm tắt **quy tắc bắt buộc** để soạn field `schema` (và
`sectionOrder`, `themes`) trên doc `templates/{templateId}`, sao cho editor
(`schemaAdapter.js`) parse đúng, không lỗi. File mẫu đầy đủ:
[`docs/schema-example.json`](schema-example.json). Tham khảo thêm ở
[`README.md`](../README.md#data-model).

## 1. Cấu trúc doc `templates/{templateId}`

```
templates/{templateId}
  schema:        { [sectionId]: Section, ... }   // bắt buộc
  sectionOrder:  [sectionId, ...]                 // tuỳ chọn
  themes:        { [themeId]: { label, colors } } // tuỳ chọn
```

- Ba field này là **native Firestore map/array** — không phải chuỗi JSON.
  Đừng nhập cả cục JSON vào 1 field string trong console; phải tạo đúng map
  con trong Firestore.
- `schema` là map key = `sectionId` (map thường, **không đảm bảo thứ tự
  key**) → mỗi `sectionId` trở thành 1 tab trong editor, và 1 key top-level
  trong `config` của website (`config.<sectionId>`).
- `sectionOrder`: mảng `sectionId` quyết định thứ tự tab. Section nào có
  trong `schema` mà thiếu trong `sectionOrder` vẫn hiện ra, xếp sau cùng —
  không bị mất. Không khai báo thì thứ tự tab = thứ tự key trong `schema`
  (không đáng tin cậy, nên khuyến nghị luôn khai báo `sectionOrder`).

## 2. Mọi Section/field đều khai `type` tường minh

**Luôn khai `"type"` ở section và ở mọi field.** Chỉ 2 giá trị container:
`"object"` (dữ liệu là 1 object phẳng) hoặc `"array"` (dữ liệu là 1 mảng
item lặp lại). Không có type nào khác nhận dạng "mixed" — array chỉ đơn
giản là 1 field bình thường có `type: "array"` nằm trong `fields`.

### a) Object section — dữ liệu là 1 object phẳng

```json
"brand": {
  "type": "object",
  "label": "Thương hiệu",
  "fields": {
    "logo": { "type": "image", "label": "Logo" },
    "name": { "type": "text", "label": "Tên thương hiệu" }
  },
  "fieldOrder": ["logo", "name"]
}
```
→ `config.brand = { logo: "...", name: "..." }`

### b) Array section — dữ liệu là 1 mảng object trực tiếp

`fields` ở đây mô tả **1 phần tử** của mảng, không phải thuộc tính của
section.

```json
"stats": {
  "type": "array",
  "label": "Số liệu thống kê",
  "itemLabel": "Số liệu",
  "emptyItem": { "value": "", "label": "" },
  "fields": {
    "value": { "type": "text", "label": "Số liệu" },
    "label": { "type": "text", "label": "Nhãn" }
  }
}
```
→ `config.stats = [ { value, label }, ... ]`

### c) Object section có 1 field dạng mảng lồng bên trong

Muốn 1 section vừa có thuộc tính riêng vừa có danh sách lặp lại (trước đây
gọi là "mixed section") → khai section là `type: "object"` như bình
thường, rồi thêm 1 field bên trong `fields` có `type: "array"`. Tên field
đó **tuỳ bạn đặt** (không bắt buộc phải là `items`) — nó chính là tên key
sẽ lưu trong `config`.

```json
"services": {
  "type": "object",
  "label": "Dịch vụ điều trị",
  "fields": {
    "eyebrow": { "type": "text", "label": "Nhãn nhỏ" },
    "title": { "type": "text", "label": "Tiêu đề" },
    "items": {
      "type": "array",
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
  }
}
```
→ `config.services = { eyebrow, title, items: [ {title, tech, desc, image}, ... ] }`

### d) Lồng nhiều tầng

Vì mỗi field `object`/`array` tự đệ quy đúng luật ở mục a/b, bạn có thể
lồng bao nhiêu tầng cũng được — ví dụ 1 field `type: "object"` nằm bên
trong `fields` của 1 array section (mỗi item của mảng có 1 field con là
object):

```json
"doctors": {
  "type": "array",
  "label": "Đội ngũ bác sĩ",
  "itemLabel": "Bác sĩ",
  "emptyItem": { "name": "", "contact": { "phone": "", "email": "" } },
  "fields": {
    "name": { "type": "text", "label": "Họ tên" },
    "contact": {
      "type": "object",
      "label": "Liên hệ",
      "fields": {
        "phone": { "type": "text", "label": "Số điện thoại" },
        "email": { "type": "text", "label": "Email" }
      }
    }
  }
}
```

⚠️ Không hỗ trợ **mảng chứa trực tiếp mảng** (1 field `type: "array"` mà
item của nó lại là `type: "array"`, không bọc qua object) — mảng luôn phải
chứa object/record, giống hầu hết hệ schema khác (Sanity, Contentful...).

## 3. `fields` map — khai báo từng field

`fields` luôn là **map** key = tên field (không phải mảng `[{key,...}]`):

```json
"fields": {
  "<fieldKey>": { "type": "<type>", "label": "<Nhãn hiển thị>" }
}
```

- `fieldOrder` (tuỳ chọn, đặt cùng cấp với `fields`): mảng các `fieldKey`
  quyết định thứ tự hiển thị. Key nào có trong `fields` mà thiếu trong
  `fieldOrder` vẫn hiện, xếp sau cùng. Field `type: "object"`/`"array"`
  lồng bên trong cũng có `fieldOrder` riêng cho `fields` của chính nó.
- Field key phải khớp với key thật sự dùng trong `config` — editor ghi
  thẳng `config[sectionId][fieldKey]...` theo đúng key đã đặt, dù lồng sâu
  bao nhiêu tầng.

## 4. Các `type` hợp lệ

**Container** (bắt buộc có `fields`, có thể lồng đệ quy):

| type     | Ý nghĩa                          |
|----------|-----------------------------------|
| `object` | 1 object phẳng, dùng `fields`      |
| `array`  | 1 mảng item, dùng `fields` + `itemLabel`/`emptyItem` |

**Leaf** (giá trị cuối, không có `fields`):

| type       | Input hiển thị              | Giá trị lưu trong `config`      |
|------------|------------------------------|----------------------------------|
| `text`     | ô nhập chữ 1 dòng            | string                            |
| `textarea` | ô nhập chữ nhiều dòng        | string                            |
| `color`    | color picker + ô hex         | string (hex, ví dụ `"#0284c7"`)  |
| `number`   | input number                 | number (hoặc `null` nếu để trống)|
| `boolean`  | checkbox                     | boolean                           |
| `url`      | input url                    | string                            |
| `image`    | upload ảnh (Firebase Storage)| string (download URL)            |

Thiếu `type` hoặc `type` lạ ở field lá → fallback về `text`.

## 5. Field/section đặc biệt — quy ước riêng

### `visible` (ẩn/hiện section)
- Trong 1 **object section**, nếu `fields` có key `visible` kiểu `boolean`
  → editor tự tách nó ra khỏi form, hiển thị thành icon mắt 👁️/🙈 cạnh tên
  section trong sidebar (không hiện như field thường).
- Giá trị thật KHÔNG lưu ở `config.<sectionId>.visible`, mà lưu tập trung ở
  **`config.visible.<sectionId>`** (1 map dùng chung toàn site). Đây là
  field mà site (`template`) đọc thật, nên đừng tự ý đổi chỗ lưu.
- Array section **không** khai báo được `visible` (vì không có `fields`
  cấp section riêng, `fields` ở đó là item shape) — muốn ẩn/hiện cả section
  dạng mảng thì đổi nó thành object section có 1 field `type: "array"` bên
  trong (mục 2c).

### Section `theme` (bảng màu site-wide)
- Đặt tên section là đúng `"theme"` (id cố định), `type: "object"`, để
  editor render UI ThemeEditor riêng (preset + color pickers) thay vì form
  thường:

```json
"theme": {
  "type": "object",
  "label": "Chủ đề",
  "fields": {
    "themePrimary": { "type": "text", "label": "Màu Chính" },
    "themeAccent": { "type": "text", "label": "Màu Phụ" }
  }
}
```
- Mọi field trong section `theme` đều được coi là color picker dù khai
  `type: "text"` hay `type: "color"`.
- `themes` (top-level, ngang hàng `schema`/`sectionOrder`) là các preset,
  key màu trong `colors` phải **khớp đúng** field key của section `theme`:

```json
"themes": {
  "themeA": { "label": "Đỏ", "colors": { "themePrimary": "#000000", "themeAccent": "#111111" } },
  "themeB": { "label": "Xanh", "colors": { "themePrimary": "#0284c7", "themeAccent": "#0891b2" } }
}
```
- Nếu không có section `theme`, editor fallback quét mọi object section
  tìm field `type: "color"` — nhưng nên luôn khai báo `theme` section rõ
  ràng cho template mới.

### `hidden` trên từng phần tử mảng
- Mỗi item trong mọi array field tự động có thêm field ẩn `hidden: boolean`
  do editor quản lý (checkbox "ẩn item"), **không cần** khai báo trong
  `fields`/`emptyItem` — chỉ cần biết khi đọc `config` để tự bỏ qua item có
  `hidden: true` khi render ở site.

## 6. `emptyItem` — giá trị mặc định khi bấm "+ Thêm"

- `emptyItem` là **giá trị thật**, không phải khai báo schema — không có
  `type`/`label` bên trong, chỉ có giá trị rỗng đúng hình dạng dữ liệu.
- Với field con dạng `object`, `emptyItem` cũng lồng 1 object con y hệt
  cấu trúc `fields` của field đó (xem ví dụ `doctors.emptyItem.contact` ở
  mục 2d) — không viết `{ "type": "object", ... }`.
- Giá trị rỗng theo type: `""` cho text/textarea/color/url/image, `false`
  cho boolean, `null` cho number, object rỗng lồng đúng cấu trúc cho
  `object`, `[]` cho `array`.
- Nếu thiếu `emptyItem`, editor tự sinh giá trị rỗng theo `type` của từng
  field (`buildDefault` trong `schemaDefaults.js`) — nhưng khai tay vẫn an
  toàn hơn, tránh phụ thuộc default ngầm.

## 7. Checklist trước khi lưu schema lên Firestore

- [ ] `schema` là **map**, mọi section đều nằm trực tiếp trong đó.
- [ ] Mọi section và mọi field container đều có `"type"` tường minh
      (`"object"` hoặc `"array"`).
- [ ] `fields` luôn là map `{ key: { type, label, ... } }`, không phải mảng.
- [ ] Không có field nào `type: "array"` mà item của nó lại là
      `type: "array"` trực tiếp (mảng-trong-mảng không hỗ trợ).
- [ ] `emptyItem` chỉ chứa **giá trị**, không chứa `type`/`label`.
- [ ] Field key trong `fields`/`emptyItem`/`fieldOrder` viết khớp nhau
      tuyệt đối (phân biệt hoa/thường), ở mọi tầng lồng.
- [ ] Nếu cần ẩn/hiện section → thêm field `visible: boolean` (chỉ object
      section).
- [ ] Nếu cần bảng màu site-wide → đặt đúng section id `"theme"`, và mọi
      `colors` trong `themes` khớp field key của section đó.
- [ ] `sectionOrder`/`fieldOrder` chỉ chứa id/key có thật trong `schema`
      (id lạ không gây lỗi nhưng vô nghĩa — bị lọc bỏ khi build).

## 8. Schema cũ (không có `type`) vẫn chạy được

`schemaAdapter.js` vẫn nhận diện schema soạn theo cách cũ (trước khi có
`type`) để không phá các template đã tồn tại trên Firestore:

- Section không có `type` nhưng có `itemLabel`/`emptyItem` và không có
  `items` → tự hiểu là array section.
- Section không có `type` nhưng có thêm 1 khối `items` (`{ label,
  itemLabel, emptyItem, fields }`) nằm ngoài `fields` → tự hiểu field
  `items` đó là mảng con.

Đây là đường tương thích ngược — **schema mới nên luôn khai `type` tường
minh** như mục 2, đừng dựa vào cách đoán cấu trúc này nữa.
