exports.handler = async (event) => {
  try {

    // فقط درخواست‌های POST
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: "HamedShop Telegram Bot is alive 🚀"
        })
      };
    }

    const update = JSON.parse(event.body || "{}");
    const token = process.env.TELEGRAM_BOT_TOKEN;

    /*
     * ==========================================
     * ابزار ارسال پیام
     * ==========================================
     */

    async function sendMessage(chatId, text, keyboard = null) {

      const body = {
        chat_id: chatId,
        text: text
      };

      if (keyboard) {
        body.reply_markup = {
          inline_keyboard: keyboard
        };
      }

      const response = await fetch(
        `https://api.telegram.org/bot${token}/sendMessage`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(body)
        }
      );

      return await response.json();
    }


    /*
     * ==========================================
     * ابزار پاسخ به دکمه‌ها
     * ==========================================
     */

    async function answerCallbackQuery(callbackQueryId) {

      await fetch(
        `https://api.telegram.org/bot${token}/answerCallbackQuery`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            callback_query_id: callbackQueryId
          })
        }
      );

    }


    /*
     * ==========================================
     * /start
     * ==========================================
     */

    if (update.message && update.message.text) {

      const chatId = update.message.chat.id;
      const text = update.message.text.trim();

      console.log("PRIVATE CHAT ID:", chatId);
      console.log("MESSAGE:", text);

      if (text === "/start") {

        await sendMessage(
          chatId,

          "🛍️ HamedShop\n\n" +
          "سلام 👋\n" +
          "به پنل مدیریت فروشگاه خوش آمدید.\n\n" +
          "لطفاً یک گزینه را انتخاب کنید:",

          [
            [
              {
                text: "➕ افزودن محصول",
                callback_data: "add_product"
              }
            ],
            [
              {
                text: "📦 مدیریت محصولات",
                callback_data: "manage_products"
              }
            ],
            [
              {
                text: "🏷️ دسته‌بندی‌ها",
                callback_data: "categories"
              }
            ],
            [
              {
                text: "⭐ محصولات ویژه",
                callback_data: "featured"
              }
            ],
            [
              {
                text: "🔥 تخفیف‌ها",
                callback_data: "discounts"
              }
            ],
            [
              {
                text: "⚙️ تنظیمات",
                callback_data: "settings"
              }
            ]
          ]
        );

      }

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true
        })
      };
    }


    /*
     * ==========================================
     * دکمه‌های Inline Keyboard
     * ==========================================
     */

    if (update.callback_query) {

      const callbackQuery = update.callback_query;

      const callbackQueryId = callbackQuery.id;
      const chatId = callbackQuery.message.chat.id;
      const action = callbackQuery.data;

      console.log("BUTTON:", action);

      await answerCallbackQuery(callbackQueryId);


      const messages = {

        add_product:
          "➕ افزودن محصول\n\nاین بخش در مرحله بعد ساخته می‌شود.",

        manage_products:
          "📦 مدیریت محصولات\n\nاین بخش در مرحله بعد ساخته می‌شود.",

        categories:
          "🏷️ دسته‌بندی‌ها\n\nاین بخش در مرحله بعد ساخته می‌شود.",

        featured:
          "⭐ محصولات ویژه\n\nاین بخش در مرحله بعد ساخته می‌شود.",

        discounts:
          "🔥 تخفیف‌ها\n\nاین بخش در مرحله بعد ساخته می‌شود.",

        settings:
          "⚙️ تنظیمات\n\nاین بخش در مرحله بعد ساخته می‌شود."

      };


      if (messages[action]) {

        await sendMessage(
          chatId,
          messages[action]
        );

      }

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true
        })
      };

    }


    /*
     * ==========================================
     * پیام‌های کانال
     * ==========================================
     */

    if (update.channel_post) {

      const channel = update.channel_post.chat;

      console.log(
        "CHANNEL POST:",
        channel.id,
        channel.title
      );

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          type: "channel_post",
          channel_id: channel.id
        })
      };

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
