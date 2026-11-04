import http from 'k6/http';
import { check } from 'k6';

export const options = {
  scenarios: {
    wallet_race_condition: {
      executor: 'shared-iterations',
      vus: 20,              // 20 concurrent virtual users
      iterations: 40,       // 40 simultaneous top-ups
      maxDuration: '20s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<800'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const TARGET_USER = 'contention_test_user';

export function setup() {
  // Top up target user wallet once before running the race condition test
  const setupRef = `setup_topup_${Date.now()}`;
  
  const topupPayload = JSON.stringify({
    userId: TARGET_USER,
    amount: 100.0,
    referenceId: setupRef,
    idempotencyKey: setupRef
  });

  const headers = { 
    'Content-Type': 'application/json',
    'Idempotency-Key': setupRef 
  };
  
  http.post(`${BASE_URL}/wallets/topup`, topupPayload, { headers });

  return { userId: TARGET_USER };
}

export default function (data) {
  const refId = `contention_topup_${__VU}_${__ITER}_${Date.now()}`;
  
  const headers = { 
    'Content-Type': 'application/json',
    'Idempotency-Key': refId
  };

  // Attempt rapid top-ups of 10.0 against the same account simultaneously
  const payload = JSON.stringify({
    userId: data.userId,
    amount: 10.0,
    referenceId: refId,
    idempotencyKey: refId
  });

  const res = http.post(`${BASE_URL}/wallets/topup`, payload, { headers });

  check(res, {
    'status is 200 or 201': (r) => r.status === 200 || r.status === 201,
    'no internal server crash (500)': (r) => r.status !== 500,
  });
}

export function teardown(data) {
  // Hit the correct route: /wallets/balance/:userId
  const balanceRes = http.get(`${BASE_URL}/wallets/balance/${data.userId}`);
  
  if (balanceRes.status === 200) {
    const wallet = JSON.parse(balanceRes.body);
    console.log(`[Teardown] Final wallet balance after contention: ${wallet.balance || wallet.current_balance}`);
    console.log(`[Teardown] Expected balance: 500 (100 setup + 40 * 10)`);
  } else {
    console.log(`[Teardown] Balance fetch failed with status: ${balanceRes.status}`);
  }
}