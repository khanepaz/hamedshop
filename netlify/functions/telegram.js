
exports.handler = async (event) => {
  try {
    // Telegram باید درخواست POST بفرستد
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: "HamedShop Telegram Webhook is ready 🚀"
        })
      };
    }

    // دریافت اطلاعات ارسال‌شده توسط Telegram
    const update = JSON.parse(event.body || "{}");

    // اگر پیام متنی وجود داشت
    if (update.message && update.message.text) {
      const chatId = update.message.chat.id;
      const text = update.message.text;

      // فعلاً فقط /start را پاسخ می‌دهیم
      if (text === "/start") {
        const token = process.env.TELEGRAM_BOT_TOKEN;

        const response = await fetch(
          `https://api.telegram.org/bot${token}/sendMessage`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              chat_id: chatId,
              text: "سلام 👋\n\nبه HamedShop خوش آمدید 🛍️"
            })
          }
        );

        const result = await response.json();

        console.log("Telegram response:", result);
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true
      })
    };

  } catch (error) {
    console.error("Webhook error:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: "Internal server error"
      })
    };
  }
};

