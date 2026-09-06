exports.handler = async (event) => {
  try {

    // ==========================================
    // فقط POST
    // ==========================================

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

    const DATABASE_CHANNEL_ID = "-1004369004122";


    // ==========================================
    // ارسال پیام
    // ==========================================

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


    // ==========================================
    // پاسخ به کلیک دکمه
    // ==========================================

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


    // ==========================================
    // ساخت Product ID
    // ==========================================

    function generateProductId() {

      const now = new Date();

      const yy = String(now.getFullYear()).slice(-2);
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const dd = String(now.getDate()).padStart(2, "0");

      const hh = String(now.getHours()).padStart(2, "0");
      const min = String(now.getMinutes()).padStart(2, "0");
      const sec = String(now.getSeconds()).padStart(2, "0");

      const random = Math.floor(Math.random() * 100)
        .toString()
        .padStart(2, "0");

      return `P${yy}${mm}${dd}${hh}${min}${sec}${random}`;
    }


    // ==========================================
    // استخراج فیلدهای محصول
    // ==========================================

    function parseProductTemplate(text) {

      const product = {};

      const lines = text.split(/\r?\n/);

      let currentField = null;

      for (const rawLine of lines) {

        const line = rawLine.trim();

        if (!line) {
          continue;
        }

        // --------------------------------------
        // فیلدهای تک خطی
        // --------------------------------------

        const match = line.match(/^([^:]+):\s*(.*)$/);

        if (match) {

          const field = match[1].trim();
          const value = match[2].trim();

          currentField = field;

          product[field] = value;

          continue;
        }


        // --------------------------------------
        // ادامه فیلدهای چندخطی
        // --------------------------------------

        if (currentField) {

          if (!product[currentField]) {
            product[currentField] = line;
          } else {
            product[currentField] += "\n" + line;
          }

        }

      }

      return product;
    }


    // ==========================================
    // تبدیل قالب فارسی به ساختار استاندارد
    // ==========================================

    function normalizeProduct(product) {

      return {

        name: product["نام محصول"] || "",

        category: product["دسته‌بندی"] || "",

        brand: product["برند"] || "",

        price: product["قیمت"] || "",

        discount: product["تخفیف"] || "",

        features: product["ویژگی‌های محصول"] || "",

        variant1: product["تنوع 1"] || "",

        options1: product["گزینه‌ها"] || "",

        variant2: product["تنوع 2"] || "",

        options2: product["گزینه‌ها 2"] || "",

        description: product["توضیحات"] || "",

        status: product["وضعیت"] || ""

      };

    }


    // ==========================================
    // اعتبارسنجی محصول
    // ==========================================

    function validateProduct(product) {

      const errors = [];

      if (!product.name) {
        errors.push("نام محصول");
      }

      if (!product.category) {
        errors.push("دسته‌بندی");
      }

      if (!product.price) {
        errors.push("قیمت");
      }

      if (!product.status) {
        errors.push("وضعیت");
      }

      return errors;
    }


    // ==========================================
    // تبدیل Draft به متن دیتابیس
    // ==========================================

    function buildDraftMessage(product, productId) {

      return (

        "#PRODUCT_DRAFT\n\n" +

        `ID: ${productId}\n` +

        "STATUS: draft\n\n" +

        `NAME: ${product.name}\n` +

        `CATEGORY: ${product.category}\n` +

        `BRAND: ${product.brand}\n\n` +

        `PRICE: ${product.price}\n` +

        `DISCOUNT: ${product.discount}\n\n` +

        `FEATURES: ${product.features}\n\n` +

        `VARIANT_1: ${product.variant1}\n` +

        `OPTIONS_1: ${product.options1}\n\n` +

        `VARIANT_2: ${product.variant2}\n` +

        `OPTIONS_2: ${product.options2}\n\n` +

        `DESCRIPTION: ${product.description}\n\n` +

        `PRODUCT_STATUS: ${product.status}\n\n` +

        "IMAGES: 0\n" +

        "CREATED_BY: telegram_admin\n" +

        `CREATED_AT: ${new Date().toISOString()}`

      );

    }


    // ==========================================
    // /start
    // ==========================================

    if (update.message && update.message.text) {

      const chatId = update.message.chat.id;

      const text = update.message.text.trim();

      console.log("PRIVATE CHAT ID:", chatId);
      console.log("MESSAGE:", text);


      // ----------------------------------------
      // /start
      // ----------------------------------------

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


      // ========================================
      // دریافت قالب محصول
      // ========================================

      else if (text.startsWith("#PRODUCT")) {

        console.log("PRODUCT TEMPLATE RECEIVED");


        // --------------------------------------
        // استخراج اطلاعات
        // --------------------------------------

        const rawProduct = parseProductTemplate(text);

        const product = normalizeProduct(rawProduct);


        // --------------------------------------
        // اعتبارسنجی
        // --------------------------------------

        const errors = validateProduct(product);


        if (errors.length > 0) {

          await sendMessage(

            chatId,

            "❌ قالب محصول کامل نیست.\n\n" +

            "فیلدهای زیر باید تکمیل شوند:\n\n" +

            errors
              .map(item => `🔴 ${item}`)
              .join("\n") +

            "\n\nلطفاً قالب را اصلاح و دوباره ارسال کنید."

          );

          return {

            statusCode: 200,

            body: JSON.stringify({
              success: false,
              error: "validation_failed",
              fields: errors
            })

          };

        }


        // --------------------------------------
        // ساخت Product ID
        // --------------------------------------

        const productId = generateProductId();


        console.log("NEW PRODUCT ID:", productId);


        // --------------------------------------
        // ساخت Draft
        // --------------------------------------

        const draftMessage =
          buildDraftMessage(product, productId);


        // --------------------------------------
        // ذخیره Draft در کانال دیتابیس
        // --------------------------------------

        const databaseResponse = await sendMessage(

          DATABASE_CHANNEL_ID,

          draftMessage

        );


        if (!databaseResponse.ok) {

          console.error(
            "DATABASE ERROR:",
            databaseResponse
          );

          await sendMessage(

            chatId,

            "❌ خطا در ذخیره محصول در دیتابیس تلگرام.\n\n" +
            "Product ID ساخته شد اما Draft ذخیره نشد.\n" +
            "لطفاً دوباره تلاش کنید."

          );

          return {

            statusCode: 500,

            body: JSON.stringify({
              success: false,
              error: "database_save_failed"
            })

          };

        }


        const draftMessageId =
          databaseResponse.result.message_id;


        // --------------------------------------
        // پاسخ به ادمین
        // --------------------------------------

        await sendMessage(

          chatId,

          "✅ محصول با موفقیت دریافت شد.\n\n" +

          "📦 نام محصول:\n" +
          `${product.name}\n\n` +

          "🆔 Product ID:\n" +
          `${productId}\n\n` +

          "📂 دسته‌بندی:\n" +
          `${product.category}\n\n` +

          "💰 قیمت:\n" +
          `${product.price}\n\n` +

          "📝 وضعیت:\n" +
          "Draft\n\n" +

          "━━━━━━━━━━━━━━\n\n" +

          "📸 مرحله بعد:\n" +
          "ارسال تصاویر محصول\n\n" +

          "می‌توانید یک یا چند تصویر ارسال کنید.\n\n" +

          `🔐 Draft Message ID: ${draftMessageId}`,

          [

            [
              {
                text: "📸 ارسال تصاویر",
                callback_data: `upload_images:${productId}`
              }
            ],

            [
              {
                text: "✏️ ویرایش اطلاعات",
                callback_data: `edit_draft:${productId}`
              }
            ],

            [
              {
                text: "❌ لغو",
                callback_data: `cancel_draft:${productId}`
              }
            ]

          ]

        );


        return {

          statusCode: 200,

          body: JSON.stringify({

            success: true,

            action: "product_draft_created",

            product_id: productId,

            draft_message_id: draftMessageId

          })

        };

      }


      // ========================================
      // سایر پیام‌ها
      // ========================================

      return {

        statusCode: 200,

        body: JSON.stringify({
          success: true
        })

      };

    }


    // ==========================================
    // Callback Query
    // ==========================================

    if (update.callback_query) {

      const callbackQuery = update.callback_query;

      const callbackQueryId = callbackQuery.id;

      const chatId =
        callbackQuery.message.chat.id;

      const action =
        callbackQuery.data;


      console.log("BUTTON:", action);


      await answerCallbackQuery(
        callbackQueryId
      );


      // ----------------------------------------
      // افزودن محصول
      // ----------------------------------------

      if (action === "add_product") {

        await sendMessage(

          chatId,

          "➕ افزودن محصول\n\n" +

          "مرحله ۱ از ثبت محصول\n\n" +

          "📝 لطفاً قالب محصول را ارسال کنید.\n\n" +

          "قالب:\n\n" +

          "#PRODUCT\n\n" +

          "نام محصول:\n" +
          "دسته‌بندی:\n" +
          "برند:\n\n" +

          "قیمت:\n" +
          "تخفیف:\n\n" +

          "ویژگی‌های محصول:\n\n" +

          "تنوع 1:\n" +
          "گزینه‌ها:\n\n" +

          "تنوع 2:\n" +
          "گزینه‌ها 2:\n\n" +

          "توضیحات:\n\n" +

          "وضعیت:\n\n" +

          "━━━━━━━━━━━━━━\n\n" +

          "مثال:\n\n" +

          "#PRODUCT\n\n" +

          "نام محصول: چادر مسافرتی مدل X\n" +
          "دسته‌بندی: لوازم سفر / چادر\n" +
          "برند: ABC\n\n" +

          "قیمت: 3500000\n" +
          "تخفیف:\n\n" +

          "ویژگی‌های محصول:\n" +
          "ضدآب، دو نفره، سبک\n\n" +

          "تنوع 1: قد\n" +
          "گزینه‌ها: 150، 160، 170، 180\n\n" +

          "تنوع 2: رنگ\n" +
          "گزینه‌ها 2: سبز، کرم، مشکی\n\n" +

          "توضیحات:\n" +
          "چادر مناسب سفر و کمپینگ\n\n" +

          "وضعیت: فعال"

        );

      }


      // ----------------------------------------
      // مدیریت محصولات
      // ----------------------------------------

      else if (action === "manage_products") {

        await sendMessage(

          chatId,

          "📦 مدیریت محصولات\n\n" +
          "این بخش در مرحله بعد ساخته می‌شود."

        );

      }


      // ----------------------------------------
      // دسته‌بندی
      // ----------------------------------------

      else if (action === "categories") {

        await sendMessage(

          chatId,

          "🏷️ دسته‌بندی‌ها\n\n" +
          "این بخش در مرحله بعد ساخته می‌شود."

        );

      }


      // ----------------------------------------
      // ویژه
      // ----------------------------------------

      else if (action === "featured") {

        await sendMessage(

          chatId,

          "⭐ محصولات ویژه\n\n" +
          "این بخش در مرحله بعد ساخته می‌شود."

        );

      }


      // ----------------------------------------
      // تخفیف
      // ----------------------------------------

      else if (action === "discounts") {

        await sendMessage(

          chatId,

          "🔥 تخفیف‌ها\n\n" +
          "این بخش در مرحله بعد ساخته می‌شود."

        );

      }


      // ----------------------------------------
      // تنظیمات
      // ----------------------------------------

      else if (action === "settings") {

        await sendMessage(

          chatId,

          "⚙️ تنظیمات\n\n" +
          "این بخش در مرحله بعد ساخته می‌شود."

        );

      }


      // ----------------------------------------
      // ارسال تصاویر
      // ----------------------------------------

      else if (
        action.startsWith("upload_images:")
      ) {

        const productId =
          action.split(":")[1];

        await sendMessage(

          chatId,

          "📸 ارسال تصاویر محصول\n\n" +

          `🆔 Product ID: ${productId}\n\n` +

          "لطفاً یک یا چند تصویر محصول را ارسال کنید.\n\n" +

          "می‌توانید تصاویر را به صورت تکی یا چندتایی ارسال کنید.\n\n" +

          "بعد از دریافت تصاویر، وارد مرحله تنظیم موجودی می‌شویم."

        );

      }


      // ----------------------------------------
      // ویرایش Draft
      // ----------------------------------------

      else if (
        action.startsWith("edit_draft:")
      ) {

        const productId =
          action.split(":")[1];

        await sendMessage(

          chatId,

          "✏️ ویرایش محصول\n\n" +

          `Product ID: ${productId}\n\n` +

          "این بخش را در مرحله مدیریت محصولات تکمیل می‌کنیم."

        );

      }


      // ----------------------------------------
      // لغو Draft
      // ----------------------------------------

      else if (
        action.startsWith("cancel_draft:")
      ) {

        const productId =
          action.split(":")[1];

        await sendMessage(

          chatId,

          "❌ درخواست لغو ثبت شد.\n\n" +

          `Product ID: ${productId}\n\n` +

          "حذف واقعی Draft را در مرحله مدیریت Draftها پیاده‌سازی می‌کنیم."

        );

      }


      return {

        statusCode: 200,

        body: JSON.stringify({
          success: true
        })

      };

    }


    // ==========================================
    // پیام کانال
    // ==========================================

    if (update.channel_post) {

      const channel =
        update.channel_post.chat;

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

    console.error(
      "Webhook error:",
      error
    );

    return {

      statusCode: 500,

      body: JSON.stringify({

        success: false,

        error: error.message

      })

    };

  }

};
