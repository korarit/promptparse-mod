import { encode, tag, withCrcTag } from '@/lib/tlv'

export interface BillPaymentConfig {
  /** Biller ID (National ID or Tax ID + Suffix) */
  billerId: string

  /** Transaction amount */
  amount?: number

  /** Reference 1 (Customer No. / Ref 1) */
  ref1: string

  /** Reference 2 (Bill No. / Ref 2) */
  ref2?: string

  /** (Undocumented) Reference 3 / Terminal Label (Tag 62 Sub-tag 07) */
  ref3?: string

  /** Merchant Name (Tag 59) */
  merchantName?: string

  /**
   * Point of Initiation Method (Tag 01)
   * Set true for dynamic ('12') or false for static ('11').
   * If omitted, defaults to '12' (dynamic) if amount is present, otherwise '11' (static).
   */
  dynamic?: boolean
}

/**
 * Generate PromptPay Bill Payment (Tag 30) QR Code
 *
 * @returns QR Code Payload
 */
export function billPayment({
  billerId,
  amount,
  ref1,
  ref2,
  ref3,
  merchantName,
  dynamic,
}: BillPaymentConfig) {
  const tag30 = [
    tag('00', 'A000000677010112'),
    tag('01', billerId),
    tag('02', ref1),
  ]

  if (ref2) {
    tag30.push(tag('03', ref2))
  }

  const pointOfInitiation =
    dynamic !== undefined ? (dynamic ? '12' : '11') : !amount ? '11' : '12'

  const payload = [
    tag('00', '01'),
    tag('01', pointOfInitiation),
    tag('30', encode(tag30)),
    tag('53', '764'),
    tag('58', 'TH'),
  ]

  if (amount) {
    payload.push(tag('54', Number(amount).toFixed(2)))
  }

  if (merchantName) {
    payload.push(tag('59', merchantName))
  }

  if (ref3) {
    payload.push(tag('62', encode([tag('07', ref3)])))
  }

  return withCrcTag(encode(payload), '63')
}
