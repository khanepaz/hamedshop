exports.handler = async () => {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;

    const channelId = "-1004369004122";

    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chat_id: channelId,
          text:
            "🟢 HamedShop Database\n\n" +
            "اتصال به کانال با موفقیت تست شد."
        })
      }
    );

    const result = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify(result)
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        error: error.message
      })
    };
  }
};
