function addHours(date, hours) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function addDays(date, days) {
  return addHours(date, days * 24);
}

// 28 Des 2023 + 3 bulan = 28 Mar 2024 (sesuai contoh di brief)
function addMonths(date, months) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

module.exports = { addHours, addDays, addMonths };
