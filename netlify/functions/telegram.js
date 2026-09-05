exports.handler = async (event) => {
  try {
    // فقط درخواست‌های Telegram باید POST باشند
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: "HamedShop Telegram Webhook is alive 🚀"
        })
      };
    }

    const update = JSON.parse(event.body || "{}");

    console.log("TELEGRAM UPDATE:", JSON.stringify(update, null, 2));

    /*
     * ==========================================
     * 1. پیام‌های کانال
     * ==========================================
     */

    if (update.channel_post) {
      const channel = update.channel_post.chat;

      console.log("CHANNEL ID:", channel.id);
      console.log("CHANNEL TITLE:", channel.title);
      console.log("MESSAGE ID:", update.channel_post.message_id);
      console.log("MESSAGE TEXT:", update.channel_post.text || "");

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          type: "channel_post",
          channel_id: channel.id,
          channel_title: channel.title,
          message_id: update.channel_post.message_id
        })
      };
    }

    /*
     * ==========================================
     * 2. پیام‌های خصوصی ربات
     * ==========================================
     */

    if (update.message && update.message.text) {
      const chatId = update.message.chat.id;
      const text = update.message.text.trim();

      console.log("PRIVATE CHAT ID:", chatId);
      console.log("MESSAGE:", text);

      // پاسخ به /start
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
              text:
                "سلام 👋\n\n" +
                "به HamedShop خوش آمدید 🛍️\n\n" +
                "سیستم فروشگاه با موفقیت متصل است."
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
