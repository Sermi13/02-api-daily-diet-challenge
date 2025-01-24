import { execSync } from 'child_process';

import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest';

import { app } from '../src/app';

beforeAll(async () => {
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

beforeEach(async () => {
  execSync('npm run knex migrate:rollback -all');
  execSync('npm run knex migrate:latest');
});

describe('Transactions routes', () => {
  test('User can create a new transaction', async () => {
    await request(app.server)
      .post('/transactions')
      .send({
        title: 'New Transaction',
        amount: 5000,
        type: 'credit',
      })
      .expect(201);
  });

  test('User can list all transactions', async () => {
    const createTransactionRequest = await request(app.server).post('/transactions').send({
      title: 'New Transaction',
      amount: 5000,
      type: 'credit',
    });

    const cookies = createTransactionRequest.get('Set-Cookie');
    if (!cookies) {
      throw new Error("Didn't receive any cookies");
    }

    const listTransactionRequest = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookies);

    expect(listTransactionRequest.body).toEqual({
      transactions: expect.arrayContaining([
        expect.objectContaining({
          title: 'New Transaction',
          amount: 5000,
        }),
      ]),
    });
  });

  test('User can get details from transactions', async () => {
    const createTransactionRequest = await request(app.server).post('/transactions').send({
      title: 'New Transaction',
      amount: 5000,
      type: 'credit',
    });

    const cookies = createTransactionRequest.get('Set-Cookie');
    if (!cookies) {
      throw new Error("Didn't receive any cookies");
    }

    const listTransactionRequest = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookies);

    const transactionId = listTransactionRequest.body.transactions[0].id;

    const getTransactionDetailsRequest = await request(app.server)
      .get(`/transactions/${transactionId}`)
      .set('Cookie', cookies);

    expect(getTransactionDetailsRequest.body.transaction).toEqual(
      expect.objectContaining({
        title: 'New Transaction',
        amount: 5000,
      }),
    );
  });

  test('User can get summary from transactions', async () => {
    const createTransactionRequest = await request(app.server).post('/transactions').send({
      title: 'Credit Transaction',
      amount: 5000,
      type: 'credit',
    });

    const cookies = createTransactionRequest.get('Set-Cookie');
    if (!cookies) {
      throw new Error("Didn't receive any cookies");
    }

    await request(app.server)
      .post('/transactions')
      .send({
        title: 'Debit Transaction',
        amount: 2500,
        type: 'debit',
      })
      .set('Cookie', cookies);

    const getSummaryRequest = await request(app.server)
      .get('/transactions/summary')
      .set('Cookie', cookies);

    expect(getSummaryRequest.body).toEqual({
      summary: expect.objectContaining({
        amount: 2500,
      }),
    });
  });
});
