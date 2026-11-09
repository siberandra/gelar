const { z } = require("zod");

// Form upload (multipart) mengirim semua isian sebagai teks, jadi angka dan tanggal di-coerce.
// Daftar tiket dikirim sebagai teks JSON.
const parseJson = (value) => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const password = z.string().min(8, "minimal 8 karakter");

const register = z.object({
  name: z.string().trim().min(2, "minimal 2 karakter").max(100),
  email: z.email("format email tidak valid").trim().toLowerCase(),
  password,
  role: z.enum(["CUSTOMER", "ORGANIZER"]),
  referralCode: z.string().trim().optional().or(z.literal("")),
});

const login = z.object({
  email: z.email("format email tidak valid").trim().toLowerCase(),
  password: z.string().min(1, "wajib diisi"),
});

const forgotPassword = z.object({ email: z.email("format email tidak valid").trim().toLowerCase() });

const resetPassword = z.object({ token: z.string().min(1), password });

const updateProfile = z.object({
  name: z.string().trim().min(2, "minimal 2 karakter").max(100),
  bio: z.string().trim().max(500).optional(),
});

const changePassword = z.object({ oldPassword: z.string().min(1, "wajib diisi"), newPassword: password });

const ticketType = z.object({
  id: z.coerce.number().int().positive().optional(),
  name: z.string().trim().min(1, "nama tiket wajib diisi").max(50),
  price: z.coerce.number().int().min(0, "harga tidak boleh negatif"),
  quota: z.coerce.number().int().min(1, "kuota minimal 1"),
});

const event = z.object({
  title: z.string().trim().min(5, "minimal 5 karakter").max(120),
  categoryId: z.coerce.number().int().positive("pilih kategori"),
  description: z.string().trim().min(20, "minimal 20 karakter"),
  city: z.string().trim().min(2, "wajib diisi"),
  venue: z.string().trim().min(2, "wajib diisi"),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  ticketTypes: z.preprocess(parseJson, z.array(ticketType).min(1, "minimal satu jenis tiket")),
});

const eventQuery = z.object({
  search: z.string().trim().optional(),
  category: z.string().optional(),
  city: z.string().optional(),
  price: z.enum(["free", "paid"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
});

const voucher = z.object({
  code: z.string().trim().min(3, "minimal 3 karakter").max(20).regex(/^[A-Za-z0-9]+$/, "hanya huruf dan angka"),
  discount: z.coerce.number().int().min(1000, "minimal Rp 1.000"),
  quota: z.coerce.number().int().min(1, "minimal 1"),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

const voucherCheck = z.object({
  eventId: z.coerce.number().int().positive(),
  code: z.string().trim().min(1),
});

const checkout = z.object({
  eventId: z.number().int().positive(),
  items: z
    .array(z.object({ ticketTypeId: z.number().int().positive(), quantity: z.number().int().min(1) }))
    .min(1, "pilih minimal satu tiket"),
  voucherCode: z.string().trim().optional().or(z.literal("")),
  couponId: z.number().int().positive().optional().nullable(),
  usePoints: z.boolean().default(false),
});

const review = z.object({
  rating: z.number().int().min(1, "rating 1-5").max(5, "rating 1-5"),
  comment: z.string().trim().min(5, "minimal 5 karakter").max(1000),
});

const stats = z.object({
  period: z.enum(["year", "month", "day"]).default("month"),
  year: z.coerce.number().int().default(() => new Date().getFullYear()),
  month: z.coerce.number().int().min(1).max(12).default(() => new Date().getMonth() + 1),
  eventId: z.coerce.number().int().positive().optional(),
});

const transactionQuery = z.object({
  status: z.string().optional(),
  eventId: z.coerce.number().int().positive().optional(),
});

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  updateProfile,
  changePassword,
  event,
  eventQuery,
  voucher,
  voucherCheck,
  checkout,
  review,
  stats,
  transactionQuery,
};
