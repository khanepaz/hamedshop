exports.handler = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      message: "HamedShop Telegram Bot is alive 🚀"
    })
  };
};
