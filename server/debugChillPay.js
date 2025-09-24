const axios = require('axios');
const crypto = require('crypto');
const config = require('./config/env');

const merchantId = config.chillpay.merchantId;
const apiKey = config.chillpay.apiKey;
const secretKey = config.chillpay.secretKey;
const baseUrl = (config.chillpay.paymentBaseUrl || 'https://api.chillpay.co/api/v1').replace(/\/$/, '');

const amount = '100.00';

const now = new Date();
const pad = (n) => `${n}`.padStart(2, '0');
const format = (d) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

const payload = {
  ProductImage: '',
  ProductName: 'Warp Test',
  ProductDescription: 'Warp Test Desc',
  PaymentLimit: '',
  StartDate: format(now),
  ExpiredDate: format(new Date(now.getTime() + 60 * 60 * 1000)),
  Currency: 'THB',
  Amount: `${Math.round(Number(amount) * 100)}`,
};

const checksumSource = [
  payload.ProductImage,
  payload.ProductName,
  payload.ProductDescription,
  payload.PaymentLimit,
  payload.StartDate,
  payload.ExpiredDate,
  payload.Currency,
  payload.Amount,
  secretKey,
].join('');

const checksum = crypto.createHash('md5').update(checksumSource).digest('hex');
payload.Checksum = checksum;

axios
  .post(`${baseUrl}/paylink/generate`, payload, {
    headers: {
      'Content-Type': 'application/json',
      'CHILLPAY-MerchantCode': merchantId,
      'CHILLPAY-ApiKey': apiKey,
    },
  })
  .then((response) => {
    console.log('SUCCESS');
    console.log(response.data);
  })
  .catch((error) => {
    console.error('ERROR');
    if (error.response) {
      console.error('STATUS:', error.response.status);
      console.error('DATA:', error.response.data);
    } else {
      console.error(error.message);
    }
  });
