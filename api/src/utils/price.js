// Hitung harga akhir transaksi. Urutan: voucher -> kupon -> poin (docs/01 BR-02).
// Fungsi ini tidak menyentuh database supaya mudah dites.
function calculatePrice({ subtotal, voucherDiscount = 0, coupon = null, pointBalance = 0, usePoints = false }) {
  const voucherCut = Math.min(voucherDiscount, subtotal);
  const afterVoucher = subtotal - voucherCut;

  let couponCut = 0;
  if (coupon) {
    couponCut = Math.min(Math.floor((afterVoucher * coupon.percent) / 100), coupon.maxDiscount);
  }
  const afterCoupon = afterVoucher - couponCut;

  const pointsUsed = usePoints ? Math.min(pointBalance, afterCoupon) : 0;

  return {
    subtotal,
    voucherDiscount: voucherCut,
    couponDiscount: couponCut,
    pointsUsed,
    total: afterCoupon - pointsUsed,
  };
}

module.exports = { calculatePrice };
