exports.handler = async (event) => {
  try {
    // فقط درخواست‌های POST
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

    /*
     * ==========================================
     * پیام‌های کانال
     * ==========================================
     */

    if (update.channel_post) {
      const channel = update.channel_post.chat;

      const channelId = channel.id;
      const channelTitle = channel.title || "Unknown";
      const messageId = update.channel_post.message_id;
      const messageText = update.channel_post.text || "";

      console.log("CHANNEL ID:", channelId);
      console.log("CHANNEL TITLE:", channelTitle);
      console.log("MESSAGE ID:", messageId);
      console.log("MESSAGE TEXT:", messageText);

      // اعلام Chat ID داخل خود کانال
      const token = process.env.TELEGRAM_BOT_TOKEN;

      await fetch(
        `https://api.telegram.org/bot${token}/sendMessage`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            chat_id: channelId,
            text:
              "✅ اتصال کانال به HamedShop برقرار است.\n\n" +
              "Channel ID:\n" +
              channelId +
              "\n\n" +
              "Channel Title:\n" +
              channelTitle +
              "\n\n" +
              "Message ID:\n" +
              messageId
          })
        }
      );

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          type: "channel_post",
          channel_id: channelId
        })
      };
    }

    /*
     * ==========================================
     * پیام خصوصی ربات
     * ==========================================
     */

    if (update.message && update.message.text) {
      const chatId = update.message.chat.id;
      const text = update.message.text.trim();

      console.log("PRIVATE CHAT ID:", chatId);
      console.log("MESSAGE:", text);

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
        error: error.message
      })
    };
  }
};
