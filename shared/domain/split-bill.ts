export type SplitBillInput = { amountMinor: number; people: { id: string; name: string; share?: number }[]; serviceRate?: number; vatRate?: number }

/** Keep all calculations in integer minor units and distribute leftover satang deterministically. */
export function splitBill(input: SplitBillInput) {
  if (!Number.isSafeInteger(input.amountMinor) || input.amountMinor < 0) throw new RangeError('Bill must be a non-negative amount in satang.')
  if (input.people.length < 1 || input.people.length > 50) throw new RangeError('Add between 1 and 50 people.')
  const serviceRate = input.serviceRate ?? 0
  const vatRate = input.vatRate ?? 0
  if (![serviceRate, vatRate].every(rate => Number.isFinite(rate) && rate >= 0 && rate <= 1)) throw new RangeError('Rates must be between 0 and 1.')
  if (input.people.some(person => !Number.isSafeInteger(person.share ?? 1) || (person.share ?? 1) <= 0)) throw new RangeError('Each share must be a positive whole number.')
  const serviceMinor = Math.round(input.amountMinor * serviceRate)
  const vatMinor = Math.round((input.amountMinor + serviceMinor) * vatRate)
  const totalMinor = input.amountMinor + serviceMinor + vatMinor
  if (![serviceMinor, vatMinor, totalMinor].every(Number.isSafeInteger)) throw new RangeError('The total is too large to calculate safely.')
  const shares = input.people.map(person => person.share ?? 1)
  const sum = shares.reduce((a, b) => a + b, 0)
  let remainder = totalMinor
  const people = input.people.map((person, index) => {
    const amountMinor = Number(BigInt(totalMinor) * BigInt(shares[index] ?? 1) / BigInt(sum))
    remainder -= amountMinor
    return { ...person, amountMinor }
  })
  for (let index = 0; remainder > 0; index = (index + 1) % people.length, remainder--) people[index]!.amountMinor++
  return { amountMinor: input.amountMinor, serviceMinor, vatMinor, totalMinor, people }
}
