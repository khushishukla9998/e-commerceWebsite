const Promo = require("../admin/model/promoModel");

const generatePromoCode = async () => {
  const words = ["SAVE", "FLAT", "OFF", "DEAL", "MEGA"];

  let code;
  let exists = true;

  while (exists) {
    const randomWord = words[Math.floor(Math.random() * words.length)];
    const randomNum = Math.floor(100 + Math.random() * 900);

    code = `${randomWord}${randomNum}`;
    exists = !!(await Promo.findOne({ code }));
  }

  return code;
};

module.exports = generatePromoCode;