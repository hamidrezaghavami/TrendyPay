import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 20 },
    { duration: '20s', target: 50 },
    { duration: '5s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const userId = `user_${__VU}_${__ITER}`;
  const headers = { 'Content-Type': 'application/json' };
  
  // 1. Create a pending order
  const orderPayload = JSON.stringify({
    userId: userId,
    totalAmount: 25.0,
    items: [{ item_id: 'item_101', quantity: 1, price: 25.0 }],
  });

  const createOrderRes = http.post(`${BASE_URL}/orders`, orderPayload, { headers });

  const orderCreated = check(createOrderRes, {
    'order created status is 201 or 200': (r) => r.status === 201 || r.status === 200,
  });

  if (orderCreated && createOrderRes.body) {
    const orderData = JSON.parse(createOrderRes.body);
    const orderId = orderData.order_id || orderData.id;

    if (orderId) {
      // 1.5 TOP-UP WALLET
      const topUpPayload = JSON.stringify({
        userId: userId,
        amount: 50.0,
        referenceId: `topup_${orderId}`,
        idempotencyKey: `topup_${orderId}`
      });

      const topUpHeaders = {
        'Content-Type': 'application/json',
        'Idempotency-Key': `topup_${orderId}`
      };
      
      const topUpRes = http.post(`${BASE_URL}/wallets/topup`, topUpPayload, { headers: topUpHeaders });
      
      check(topUpRes, {
        'wallet top-up successful': (r) => r.status === 200 || r.status === 201,
      });

      // 2. Execute checkout
      const checkoutPayload = JSON.stringify({
        userId: userId,
        orderId: orderId,
        amount: 25.0,
        idempotencyKey: `idemp_${orderId}`,
        paymentMethod: 'WALLET'
      });

      const checkoutHeaders = {
        'Content-Type': 'application/json',
        'Idempotency-Key': `idemp_${orderId}`,
      };
    }
  }

  sleep(1);
}