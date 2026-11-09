const { calculatePrice } = require("../src/utils/price");

describe("Perhitungan harga (BR-02)", () => {
  test("contoh dari brief: tiket 300.000 dengan 20.000 poin menjadi 280.000", () => {
    const price = calculatePrice({ subtotal: 300000, pointBalance: 20000, usePoints: true });
    expect(price.pointsUsed).toBe(20000);
    expect(price.total).toBe(280000);
  });

  test("urutan potongan: voucher, lalu kupon persen, lalu poin", () => {
    const price = calculatePrice({
      subtotal: 400000,
      voucherDiscount: 50000,
      coupon: { percent: 10, maxDiscount: 50000 },
      pointBalance: 10000,
      usePoints: true,
    });
    // 400.000 - 50.000 = 350.000; kupon 10% = 35.000; 315.000 - 10.000 poin
    expect(price).toEqual({
      subtotal: 400000,
      voucherDiscount: 50000,
      couponDiscount: 35000,
      pointsUsed: 10000,
      total: 305000,
    });
  });

  test("kupon dibatasi maksimal potongannya", () => {
    const price = calculatePrice({ subtotal: 1000000, coupon: { percent: 10, maxDiscount: 50000 } });
    expect(price.couponDiscount).toBe(50000);
    expect(price.total).toBe(950000);
  });

  test("poin hanya dipakai sebesar sisa harga, total tidak pernah negatif", () => {
    const price = calculatePrice({ subtotal: 30000, voucherDiscount: 10000, pointBalance: 50000, usePoints: true });
    expect(price.pointsUsed).toBe(20000);
    expect(price.total).toBe(0);
  });

  test("voucher lebih besar dari harga tidak membuat total negatif", () => {
    const price = calculatePrice({ subtotal: 20000, voucherDiscount: 50000 });
    expect(price.voucherDiscount).toBe(20000);
    expect(price.total).toBe(0);
  });

  test("poin tidak dipakai jika usePoints false", () => {
    const price = calculatePrice({ subtotal: 100000, pointBalance: 20000, usePoints: false });
    expect(price.pointsUsed).toBe(0);
    expect(price.total).toBe(100000);
  });
});
