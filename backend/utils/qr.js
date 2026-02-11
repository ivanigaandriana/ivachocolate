const QRCode = require("qrcode");

async function generatePaymentQR(amount, orderId) {
  const spd = `SPD*1.0*ACC:CZ6508000000192000145399*AM:${amount}*CC:CZK*MSG:Order ${orderId}`;

  return await QRCode.toDataURL(spd); // повертає base64 image
}

module.exports = { generatePaymentQR };