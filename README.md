# PromptParse-MOD

"All-in-one JS library for PromptPay & EMVCo QR Codes with extended Tag 59 (Merchant Name), Dynamic QR, and UTF-8 Checksum support"

Repository: [https://github.com/korarit/promptparse-mod](https://github.com/korarit/promptparse-mod)

No dependency & Cross-platform. You can use it anywhere (Node.js, Deno, Bun), even directly in the browser!

---

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Generate QR Code](#generate-qr-code)
  - [1. PromptPay AnyID (Tag 29)](#1-promptpay-anyid-tag-29)
  - [2. PromptPay Bill Payment (Tag 30)](#2-promptpay-bill-payment-tag-30)
    - [Parameters Detail](#parameters-detail)
    - [Standard Bill Payment (Static QR)](#standard-bill-payment-static-qr)
    - [Bill Payment with All References (Ref 1, Ref 2, Ref 3)](#bill-payment-with-all-references-ref-1-ref-2-ref-3)
    - [Paotung / Merchant QR with Thai Merchant Name & Dynamic QR](#paotung--merchant-qr-with-thai-merchant-name--dynamic-qr)
  - [3. Slip Verify Mini-QR](#3-slip-verify-mini-qr)
  - [4. TrueMoney QR](#4-truemoney-qr)
  - [5. BOT Barcode Standard](#5-bot-barcode-standard)
- [Parse & Manipulate QR](#parse--manipulate-qr)
  - [Parse and Extract Values](#parse-and-extract-values)
  - [Low-level TLV Building & Checksum](#low-level-tlv-building--checksum)
- [Validate & Extract Data](#validate--extract-data)
  - [Validate Bill Payment](#validate-bill-payment)
  - [Validate AnyID](#validate-anyid)
  - [Validate Slip Verify](#validate-slip-verify)
- [Browser / CDN Usage](#browser--cdn-usage)
- [References](#references)
- [License](#license)

---

## Features

- **Parse** &mdash; Parse EMVCo / Thai QR Code payload strings into structured TLV objects with strict CRC validation.
- **Generate** &mdash; Generate QR Code payloads from ready-to-use templates (PromptPay AnyID, Bill Payment Tag 30, TrueMoney, Slip Verify Mini-QR, BOT Barcode).
- **Full Field Customization** &mdash; Full support for optional references (`ref1`, `ref2`, `ref3`), merchant name (`merchantName` Tag 59 supporting Thai UTF-8), and dynamic initiation flags (`dynamic` Tag 01).
- **Validate & Extract** &mdash; Validate checksums and extract structured fields from scanned QR codes directly.
- **Convert** &mdash; Easily convert BOT Barcode strings into PromptPay QR Tag 30 payloads.

---

## Installation

```bash
# npm
npm install promptparse-mod
# หรือติดตั้งตรงจาก GitHub:
npm install github:korarit/promptparse-mod

# pnpm
pnpm add promptparse-mod
# หรือติดตั้งตรงจาก GitHub:
pnpm add github:korarit/promptparse-mod

# yarn
yarn add promptparse-mod

# bun
bun add promptparse-mod
```

---

## Quick Start

```ts
import { generate, parse, validate } from 'promptparse-mod'
// or import specific modules:
// import { billPayment, anyId } from 'promptparse-mod/generate'
// import { billPayment as validateBillPayment } from 'promptparse-mod/validate'
```

---

## Generate QR Code

### 1. PromptPay AnyID (Tag 29)

ใช้สำหรับโอนเงินพร้อมเพย์รายย่อยทั่วไป (Credit Transfer) ผ่านเบอร์มือถือ, เลขบัตรประชาชน, หรือ e-Wallet ID

```ts
import { generate } from 'promptparse-mod'

// โอนเงินผ่านเบอร์โทรศัพท์ (Mobile Number)
const mobileQr = generate.anyId({
  type: 'MSISDN',
  target: '0812345678',
  amount: 150.0, // ใส่หรือไม่ใส่ก็ได้ (Optional)
})

// โอนเงินผ่านเลขประจำตัวประชาชน (National ID / Tax ID)
const idCardQr = generate.anyId({
  type: 'NATID',
  target: '1234567890123',
  amount: 500.0,
})

// โอนเงินผ่าน E-Wallet ID (15 หลัก)
const ewalletQr = generate.anyId({
  type: 'EWALLETID',
  target: '140001234567890',
})
```

| Parameter | Type                                                    | Required | Description                                                                                 |
| :-------- | :------------------------------------------------------ | :------- | :------------------------------------------------------------------------------------------ |
| `type`    | `'MSISDN'` \| `'NATID'` \| `'EWALLETID'` \| `'BANKACC'` | Yes      | ประเภทของ PromptPay Proxy                                                                   |
| `target`  | `string`                                                | Yes      | หมายเลขปลายทาง เช่น เบอร์มือถือ (`08x...`), เลขบัตรประชาชน (13 หลัก), E-Wallet ID (15 หลัก) |
| `amount`  | `number`                                                | No       | ยอดเงินที่ต้องการให้ระบุใน QR (หากไม่ใส่ ผู้โอนจะเป็นคนใส่ยอดเอง)                           |

---

### 2. PromptPay Bill Payment (Tag 30)

ใช้สำหรับระบบรับชำระบิล (Biller Service), ร้านค้านิติบุคคล, ระบบเป๋าตุง, หน่วยงานรัฐ หรือออกใบแจ้งหนี้

#### Parameters Detail

```ts
interface BillPaymentConfig {
  billerId: string // รหัสผู้รับเงิน (Tax ID 13 หลัก + Suffix 2 หลัก เช่น '010753700088201')
  ref1: string // Ref 1: รหัสลูกค้า / Customer No. / เลขอ้างอิง 1 (ไม่เกิน 20 ตัวอักษร)
  ref2?: string // Ref 2: เลขที่บิล / Bill No. / Invoice No. (ไม่เกิน 20 ตัวอักษร)
  ref3?: string // Ref 3: Terminal ID / รหัสเครื่องรูดหรือจุดรับชำระ (Tag 62 Sub-tag 07)
  amount?: number // ยอดเงินชำระ (เช่น 150.00)
  merchantName?: string // ชื่อร้านค้า/ผู้รับเงิน (Tag 59) เช่น 'เป๋าตุง' หรือ 'ร้านค้าของฉัน' (รองรับภาษาไทย)
  dynamic?: boolean // กำหนดให้เป็น Dynamic QR (Tag 01 = '12') แม้ไม่ได้ระบุยอดเงิน (default: true ถ้ามียอดเงิน, false ถ้าไม่มียอดเงิน)
}
```

#### Standard Bill Payment (Static QR)

```ts
import { generate } from 'promptparse-mod'

const payload = generate.billPayment({
  billerId: '010753700088201',
  ref1: 'CUST10001',
})
```

#### Bill Payment with All References (Ref 1, Ref 2, Ref 3)

```ts
const payload = generate.billPayment({
  billerId: '010753700088201',
  amount: 1250.5,
  ref1: 'CUST10001', // Customer No. (Subtag 02)
  ref2: 'INV2024001', // Bill / Invoice No. (Subtag 03)
  ref3: 'POS01', // Terminal ID / Store Label (Tag 62 Subtag 07)
})
```

#### Paotung / Merchant QR with Thai Merchant Name & Dynamic QR

สำหรับสร้าง QR เป๋าตุง หรือร้านค้าที่ต้องการระบุชื่อร้านภาษาไทย (Tag 59) และต้องการให้เป็น Dynamic QR (`Tag 01 = '12'`) เพื่อให้ผู้สแกนระบุยอดเงินเอง:

```ts
const paotungPayload = generate.billPayment({
  billerId: '010753700088201', // Biller ธนาคารกรุงไทย / เป๋าตุง
  ref1: '16448929330994000001', // Reference 1
  ref2: 'THETBANTAMBONMAECHAN', // Reference 2 (เช่น เทศบาลตำบลแม่จัน)
  ref3: '001', // Terminal ID
  merchantName: 'เป๋าตุง', // Tag 59 (คำนวณ Checksum UTF-8 ถูกต้อง 100%)
  dynamic: true, // บังคับเป็น Dynamic QR ('12') แม้ไม่มี amount
})
```

---

### 3. Slip Verify Mini-QR

สร้าง Mini-QR ที่ฝังอยู่ในสลิปการโอนเงิน เพื่อให้ระบบภายนอกหรือธนาคารสามารถตรวจสอบสลิปย้อนหลังได้

```ts
import { generate } from 'promptparse-mod'

const miniQr = generate.slipVerify({
  sendingBank: '014', // รหัสธนาคารต้นทาง เช่น 014 (SCB), 002 (BBL), 004 (KBANK)
  transRef: '202312011234567890', // รหัสอ้างอิงธุรกรรมจากสลิป
})
```

---

### 4. TrueMoney QR

สร้าง QR Code สำหรับรับเงินเข้ากระเป๋า TrueMoney Wallet

```ts
import { generate } from 'promptparse-mod'

const truemoneyQr = generate.trueMoney({
  mobileNo: '0812345678',
  amount: 20.0, // Optional
  message: 'Payment for order #1234', // Optional (ข้อความแนบ)
})
```

---

### 5. BOT Barcode Standard

สร้างและแปลง Barcode ตามมาตรฐานของธนาคารแห่งประเทศไทย (BOT Barcode)

```ts
import { generate, parseBarcode } from 'promptparse-mod'

// 1. สร้าง BOT Barcode String
const barcodeString = generate.botBarcode({
  billerId: '099400016550100',
  ref1: '123456789012',
  ref2: '670429',
  amount: 3649.22,
})
// ผลลัพธ์: '|099400016550100\r123456789012\r670429\r364922'

// 2. แปลง BOT Barcode เป็น PromptPay QR Tag 30 (Bill Payment)
const botBarcode = parseBarcode(barcodeString)
if (botBarcode) {
  const qrPayload = botBarcode.toQrTag30()
  console.log(qrPayload)
}
```

---

## Parse & Manipulate QR

### Parse and Extract Values

ใช้ฟังก์ชัน `parse()` เพื่อแกะโครงสร้าง Tag ต่าง ๆ ของ QR Code ตามมาตรฐาน EMVCo:

```ts
import { parse } from 'promptparse-mod'

// ตัวอย่าง Payload
const qr = parse(
  '00020101021230870016A00000067701011201150107537000882010220164489293309940000010320THETBANTAMBONMAECHAN53037645802TH5907เป๋าตุง620707030016304C30B',
)

if (qr) {
  // อ่านค่าจาก Tag หลัก
  const format = qr.getTagValue('00') // '01'
  const poi = qr.getTagValue('01') // '12' (Dynamic)
  const currency = qr.getTagValue('53') // '764' (THB)
  const merchant = qr.getTagValue('59') // 'เป๋าตุง'

  // อ่านค่าจาก Sub-tag ภายใน Tag 30
  const billerId = qr.getTagValue('30', '01') // '010753700088201'
  const ref1 = qr.getTagValue('30', '02') // '16448929330994000001'
  const ref2 = qr.getTagValue('30', '03') // 'THETBANTAMBONMAECHAN'
  const terminalId = qr.getTagValue('62', '07') // '001'

  // ตรวจสอบความถูกต้องของ Checksum (Tag 63)
  const isValidCrc = qr.validate('63') // true
}

// ตรวจสอบแบบ Strict (เช็ค CRC ทันทีก่อน parse)
const strictQr = parse(payload, true)
```

### Low-level TLV Building & Checksum

ประกอบ Tag และคำนวณ Checksum CRC-16 (XMODEM) ด้วยตนเอง:

```ts
import { encode, tag, withCrcTag, checksum } from 'promptparse-mod'

const tags = [
  tag('00', '01'),
  tag('01', '11'),
  tag('53', '764'),
  tag('58', 'TH'),
]

// แปลงเป็น TLV string พร้อมต่อท้าย Tag 63 และ Checksum
const payloadWithCrc = withCrcTag(encode(tags), '63')

// คำนวณ Checksum เฉพาะจุด (รองรับทั้ง ASCII และ UTF-8 ภาษาไทย)
const crc = checksum('000201010211...')
```

---

## Validate & Extract Data

ตรวจสอบและดึงข้อมูลออกมาเป็น JavaScript Object สำเร็จรูป

### Validate Bill Payment

```ts
import { validate } from 'promptparse-mod'

const result = validate.billPayment(qrPayload)

if (result) {
  console.log(result.billerId) // '010753700088201'
  console.log(result.ref1) // '16448929330994000001'
  console.log(result.ref2) // 'THETBANTAMBONMAECHAN' (ถ้ามี)
  console.log(result.ref3) // '001' (ถ้ามี)
  console.log(result.merchantName) // 'เป๋าตุง' (ถ้ามี)
  console.log(result.amount) // 100 (ถ้ามี)
} else {
  console.error('Invalid Bill Payment QR Payload')
}
```

### Validate AnyID

```ts
const result = validate.anyId(qrPayload)

if (result) {
  console.log(result.type) // 'MSISDN' | 'NATID' | 'EWALLETID' | 'BANKACC'
  console.log(result.target) // '0812345678'
  console.log(result.amount) // number | undefined
}
```

### Validate Slip Verify

```ts
const result = validate.slipVerify(slipQrPayload)

if (result) {
  console.log(result.sendingBank) // '014'
  console.log(result.transRef) // '20231201...'
}
```

---

## Browser / CDN Usage

สามารถใช้งานบน Browser ผ่าน CDN ได้ทันทีโดยไม่ต้อง Bundler:

```html
<script src="https://cdn.jsdelivr.net/npm/promptparse-mod"></script>

<script>
  // เข้าถึงผ่าน global object `promptparse`
  const payload = promptparse.generate.billPayment({
    billerId: '010753700088201',
    ref1: '16448929330994000001',
    ref2: 'THETBANTAMBONMAECHAN',
    ref3: '001',
    merchantName: 'เป๋าตุง',
    dynamic: true,
  })

  // แสดงผลเป็นภาพ QR Code
  document.write(
    `<img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(payload)}">`,
  )
</script>
```

---

## References

- [EMVCo QR Code Specification (QRCPS)](https://www.emvco.com/emv-technologies/qrcodes/)
- [Bank of Thailand Standardized Thai QR Code Policy (BOT Circular 84/2562)](https://www.bot.or.th/content/dam/bot/fipcs/documents/FPG/2562/ThaiPDF/25620084.pdf)
- [BOT Barcode Standard](https://www.bot.or.th/content/dam/bot/documents/th/our-roles/payment-systems/about-payment-systems/Std_Barcode.pdf)
- [SCB Open API - Slip Verify Mini QR Specification](https://developer.scb/assets/documents/documentation/qr-payment/extracting-data-from-mini-qr.pdf)

---

## License

This project is MIT licensed (see [LICENSE.md](LICENSE.md)).
