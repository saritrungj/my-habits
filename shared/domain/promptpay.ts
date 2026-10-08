export function promptPayPayload(identifier: string, type: 'phone'|'national-id', amountMinor?: number): string {
  const digits=identifier.replace(/\D/g,'')
  if(type==='phone' && !/^0\d{9}$/.test(digits))throw new RangeError('ใช้หมายเลขโทรศัพท์ PromptPay 10 หลักที่ขึ้นต้นด้วย 0')
  if(type==='national-id' && !validThaiId(digits))throw new RangeError('เลขประจำตัวประชาชนไม่ถูกต้อง')
  if(amountMinor!==undefined&&(!Number.isSafeInteger(amountMinor)||amountMinor<=0))throw new RangeError('ยอดชำระต้องมากกว่า 0 บาท')
  const target=type==='phone'?`0066${digits.slice(1)}`:digits
  const account=field('00','A000000677010111')+field(type==='phone'?'01':'02',target)
  const payload=field('00','01')+field('01',amountMinor===undefined?'11':'12')+field('29',account)+field('53','764')+field('58','TH')+(amountMinor===undefined?'':field('54',(amountMinor/100).toFixed(2)))+'6304'
  return `${payload}${crc16(payload).toString(16).toUpperCase().padStart(4,'0')}`
}

function field(tag:string,value:string){return `${tag}${String(value.length).padStart(2,'0')}${value}`}
function crc16(value:string){let crc=0xffff;for(const byte of new TextEncoder().encode(value)){crc^=byte<<8;for(let bit=0;bit<8;bit++)crc=(crc&0x8000)?(crc<<1)^0x1021:crc<<1;crc&=0xffff}return crc}
function validThaiId(value:string){if(!/^\d{13}$/.test(value))return false;let sum=0;for(let index=0;index<12;index++)sum+=Number(value[index])*(13-index);return (11-sum%11)%10===Number(value[12])}
