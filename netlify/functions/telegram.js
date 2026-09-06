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
    // Netlify Blobs
    // ==========================================

    const { getStore } = await import("@netlify/blobs");

    const productStore =
      getStore("hamedshop-products");


    // ==========================================
    // ارسال پیام
    // ==========================================

    async function sendMessage(
      chatId,
      text,
      keyboard = null
    ) {

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
    // ویرایش پیام
    // ==========================================

    async function editMessage(
      chatId,
      messageId,
      text,
      keyboard = null
    ) {

      const body = {
        chat_id: chatId,
        message_id: messageId,
        text: text
      };

      if (keyboard) {
        body.reply_markup = {
          inline_keyboard: keyboard
        };
      }

      const response = await fetch(
        `https://api.telegram.org/bot${token}/editMessageText`,
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
    // پاسخ به Callback
    // ==========================================

    async function answerCallbackQuery(
      callbackQueryId
    ) {

      await fetch(
        `https://api.telegram.org/bot${token}/answerCallbackQuery`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            callback_query_id:
              callbackQueryId
          })
        }
      );

    }


    // ==========================================
    // ساخت Product ID
    // ==========================================

    function generateProductId() {

      const now = new Date();

      const yy =
        String(now.getFullYear()).slice(-2);

      const mm =
        String(now.getMonth() + 1)
          .padStart(2, "0");

      const dd =
        String(now.getDate())
          .padStart(2, "0");

      const hh =
        String(now.getHours())
          .padStart(2, "0");

      const min =
        String(now.getMinutes())
          .padStart(2, "0");

      const sec =
        String(now.getSeconds())
          .padStart(2, "0");

      const random =
        Math.floor(Math.random() * 100)
          .toString()
          .padStart(2, "0");

      return `P${yy}${mm}${dd}${hh}${min}${sec}${random}`;
    }


    // ==========================================
    // استخراج قالب محصول
    // ==========================================

    function parseProductTemplate(text) {

      const product = {};

      const lines =
        text.split(/\r?\n/);

      let currentField = null;

      for (const rawLine of lines) {

        const line =
          rawLine.trim();

        if (!line) {
          continue;
        }

        if (line === "#PRODUCT") {
          continue;
        }

        const match =
          line.match(/^([^:]+):\s*(.*)$/);

        if (match) {

          const field =
            match[1].trim();

          const value =
            match[2].trim();

          currentField =
            field;

          product[field] =
            value;

          continue;
        }

        if (currentField) {

          if (!product[currentField]) {

            product[currentField] =
              line;

          } else {

            product[currentField] +=
              "\n" + line;

          }

        }

      }

      return product;
    }


    // ==========================================
    // استانداردسازی محصول
    // ==========================================

    function normalizeProduct(product) {

      return {

        name:
          product["نام محصول"] || "",

        category:
          product["دسته‌بندی"] || "",

        brand:
          product["برند"] || "",

        price:
          product["قیمت"] || "",

        discount:
          product["تخفیف"] || "",

        features:
          product["ویژگی‌های محصول"] || "",

        variant1:
          product["تنوع 1"] || "",

        options1:
          product["گزینه‌ها"] || "",

        variant2:
          product["تنوع 2"] || "",

        options2:
          product["گزینه‌ها 2"] || "",

        variant3:
          product["تنوع 3"] || "",

        options3:
          product["گزینه‌ها 3"] || "",

        description:
          product["توضیحات"] || "",

        status:
          product["وضعیت"] || ""

      };
    }


    // ==========================================
    // اعتبارسنجی
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

      if (
        product.variant1 &&
        !product.options1
      ) {
        errors.push(
          "گزینه‌های تنوع 1"
        );
      }

      if (
        product.variant2 &&
        !product.options2
      ) {
        errors.push(
          "گزینه‌های تنوع 2"
        );
      }

      if (
        product.variant3 &&
        !product.options3
      ) {
        errors.push(
          "گزینه‌های تنوع 3"
        );
      }

      return errors;
    }


    // ==========================================
    // تبدیل گزینه‌ها به آرایه
    // ==========================================

    function parseOptions(text) {

      if (!text) {
        return [];
      }

      return text
        .split(/[,،\n|]+/)
        .map(item => item.trim())
        .filter(Boolean);

    }


    // ==========================================
    // ساخت Product Record
    // ==========================================

    function buildProductRecord(
      product,
      productId,
      draftMessageId
    ) {

      return {

        id:
          productId,

        name:
          product.name,

        category:
          product.category,

        brand:
          product.brand,

        price:
          product.price,

        discount:
          product.discount,

        features:
          product.features,

        variants: [

          ...(product.variant1
            ? [{
                name:
                  product.variant1,
                options:
                  parseOptions(
                    product.options1
                  )
              }]
            : []),

          ...(product.variant2
            ? [{
                name:
                  product.variant2,
                options:
                  parseOptions(
                    product.options2
                  )
              }]
            : []),

          ...(product.variant3
            ? [{
                name:
                  product.variant3,
                options:
                  parseOptions(
                    product.options3
                  )
              }]
            : [])

        ],

        description:
          product.description,

        status:
          product.status,

        workflowStatus:
          "draft",

        images: [],

        stock: {},

        totalStock: 0,

        draftMessageId:
          draftMessageId,

        createdBy:
          "telegram_admin",

        createdAt:
          new Date().toISOString(),

        updatedAt:
          new Date().toISOString()

      };
    }


    // ==========================================
    // ذخیره محصول در Netlify Blobs
    // ==========================================

    async function saveProduct(
      product
    ) {

      return await productStore.setJSON(
        `products/${product.id}`,
        product
      );

    }


    // ==========================================
    // دریافت محصول از Netlify Blobs
    // ==========================================

    async function getProduct(
      productId
    ) {

      if (!productId) {
        return null;
      }

      return await productStore.get(
        `products/${productId}`,
        {
          type: "json"
        }
      );

    }


    // ==========================================
    // به‌روزرسانی محصول
    // ==========================================

    async function updateProduct(
      productId,
      updater
    ) {

      const product =
        await getProduct(
          productId
        );

      if (!product) {
        return null;
      }

      const updatedProduct =
        await updater(product);

      updatedProduct.updatedAt =
        new Date().toISOString();

      await saveProduct(
        updatedProduct
      );

      return updatedProduct;
    }


    // ==========================================
    // لیست محصولات
    // ==========================================

    async function listProducts() {

      const result =
        await productStore.list({
          prefix: "products/"
        });

      const products = [];

      for (
        const blob of result.blobs
      ) {

        const product =
          await productStore.get(
            blob.key,
            {
              type: "json"
            }
          );

        if (product) {
          products.push(product);
        }

      }

      products.sort(
        (a, b) =>
          new Date(
            b.createdAt || 0
          ) -
          new Date(
            a.createdAt || 0
          )
      );

      return products;
    }


    // ==========================================
    // ساخت Draft
    // ==========================================

    function buildDraftMessage(
      product,
      productId
    ) {

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

        `VARIANT_3: ${product.variant3}\n` +

        `OPTIONS_3: ${product.options3}\n\n` +

        `DESCRIPTION: ${product.description}\n\n` +

        `PRODUCT_STATUS: ${product.status}\n\n` +

        "IMAGES: 0\n" +

        "STOCK_STATUS: pending\n" +

        "CREATED_BY: telegram_admin\n" +

        `CREATED_AT: ${new Date().toISOString()}`

      );
    }


    // ==========================================
    // ذخیره تصویر
    // ==========================================

    async function saveImageRecord(
      productId,
      fileId,
      messageId,
      mediaGroupId = ""
    ) {

      const imageRecord = {

        fileId:
          fileId,

        sourceMessageId:
          messageId,

        mediaGroupId:
          mediaGroupId,

        createdAt:
          new Date().toISOString()

      };


      const updatedProduct =
        await updateProduct(
          productId,
          async (product) => {

            if (!Array.isArray(
              product.images
            )) {

              product.images = [];

            }

            product.images.push(
              imageRecord
            );

            return product;

          }
        );


      if (!updatedProduct) {

        return {
          ok: false,
          error:
            "product_not_found"
        };

      }


      // آرشیو در کانال تلگرام

      const archiveText =

        "#PRODUCT_IMAGE\n\n" +

        `PRODUCT_ID: ${productId}\n` +

        `FILE_ID: ${fileId}\n` +

        `SOURCE_MESSAGE_ID: ${messageId}\n` +

        `MEDIA_GROUP_ID: ${mediaGroupId}\n` +

        `CREATED_AT: ${imageRecord.createdAt}`;


      return await sendMessage(
        DATABASE_CHANNEL_ID,
        archiveText
      );

    }


    // ==========================================
    // ذخیره Product Index
    // ==========================================

    async function saveProductIndex(
      productId,
      messageId,
      messageType = "DRAFT"
    ) {

      const indexRecord =

        "#PRODUCT_INDEX\n\n" +

        `PRODUCT_ID: ${productId}\n` +

        `MESSAGE_ID: ${messageId}\n` +

        `CHANNEL_ID: ${DATABASE_CHANNEL_ID}\n` +

        `MESSAGE_TYPE: ${messageType}\n` +

        `CREATED_AT: ${new Date().toISOString()}`;


      return await sendMessage(
        DATABASE_CHANNEL_ID,
        indexRecord
      );
    }


    // ==========================================
    // استخراج Product ID
    // ==========================================

    function extractProductId(text) {

      if (!text) {
        return null;
      }

      const match =
        text.match(
          /Product ID:\s*(P[0-9A-Z-]+)/i
        );

      if (match) {
        return match[1];
      }

      const match2 =
        text.match(
          /PRODUCT_ID:\s*(P[0-9A-Z-]+)/i
        );

      if (match2) {
        return match2[1];
      }

      return null;
    }


    // ==========================================
    // ساخت ترکیب‌های تنوع
    // ==========================================

    function buildCombinationsFromProduct(
      product
    ) {

      const dimensions =
        Array.isArray(
          product.variants
        )
          ? product.variants
          : [];


      if (
        dimensions.length === 0
      ) {

        return {

          dimensions: [],

          combinations: [
            {
              label:
                "موجودی کل",

              values: []
            }
          ]

        };

      }


      let combinations = [

        {
          values: [],
          label: ""
        }

      ];


      for (
        const dimension
        of dimensions
      ) {

        const next = [];


        for (
          const current
          of combinations
        ) {

          for (
            const option
            of dimension.options || []
          ) {

            const values = [

              ...current.values,

              {
                dimension:
                  dimension.name,

                option:
                  option
              }

            ];


            const label =
              values
                .map(
                  item =>
                    `${item.dimension}: ${item.option}`
                )
                .join(" | ");


            next.push({

              values,

              label

            });

          }

        }


        combinations =
          next;

      }


      return {

        dimensions,

        combinations

      };

    }


    // ==========================================
    // ساخت متن وضعیت موجودی
    // ==========================================

    function buildStockMenuText(
      state
    ) {

      const current =
        state.index;

      const total =
        state.combinations.length;

      const combination =
        state.combinations[current];


      return (

        "📦 تنظیم موجودی محصول\n\n" +

        `🆔 Product ID: ${state.productId}\n\n` +

        `مرحله ${current + 1} از ${total}\n\n` +

        `🔹 ${combination.label}\n\n` +

        "لطفاً تعداد موجودی را به صورت عدد وارد کنید.\n\n" +

        "مثال:\n" +

        "25"

      );

    }


    // ==========================================
    // Encode State
    // ==========================================

    function encodeState(
      state
    ) {

      const json =
        JSON.stringify(state);

      return Buffer
        .from(json, "utf8")
        .toString("base64url");

    }


    // ==========================================
    // Decode State
    // ==========================================

    function decodeState(
      encoded
    ) {

      try {

        const json =
          Buffer
            .from(
              encoded,
              "base64url"
            )
            .toString("utf8");

        return JSON.parse(
          json
        );

      } catch (error) {

        console.error(
          "STATE DECODE ERROR:",
          error
        );

        return null;

      }

    }


    // ==========================================
    // ساخت رکورد نهایی Stock
    // ==========================================

    function buildStockRecord(
      state
    ) {

      let text =

        "#PRODUCT_STOCK\n\n" +

        `PRODUCT_ID: ${state.productId}\n` +

        "STATUS: confirmed\n\n" +

        "DIMENSIONS:\n";


      if (
        state.dimensions.length === 0
      ) {

        text +=
          "NONE\n\n";

      } else {

        state.dimensions.forEach(
          (dimension, index) => {

            text +=
              `${index + 1}. ${dimension.name}\n`;

          }
        );

        text += "\n";

      }


      text +=
        "STOCK:\n";


      state.combinations.forEach(
        (combination, index) => {

          const quantity =
            Number(
              state.stocks[index] || 0
            );


          const values =
            combination.values
              .map(
                item =>
                  `${item.dimension}=${item.option}`
              )
              .join(" | ");


          if (values) {

            text +=
              `${values} | QTY=${quantity}\n`;

          } else {

            text +=
              `TOTAL | QTY=${quantity}\n`;

          }

        }
      );


      text +=

        `\nTOTAL_STOCK: ${state.stocks.reduce(
          (sum, value) =>
            sum + Number(value || 0),
          0
        )}\n` +

        `CREATED_AT: ${new Date().toISOString()}`;


      return text;

    }


    // ==========================================
    // ساخت Stock Map
    // ==========================================

    function buildStockMap(
      state
    ) {

      const stock = {};

      state.combinations.forEach(
        (combination, index) => {

          const quantity =
            Number(
              state.stocks[index] || 0
            );

          stock[
            combination.label
          ] = quantity;

        }
      );

      return stock;
    }


    // ==========================================
    // متن لیست محصولات
    // ==========================================

    function buildProductsListText(
      products
    ) {

      if (
        products.length === 0
      ) {

        return (

          "📦 مدیریت محصولات\n\n" +

          "هنوز هیچ محصولی در دیتابیس ثبت نشده است.\n\n" +

          "برای افزودن محصول از گزینه «➕ افزودن محصول» استفاده کنید."

        );

      }


      let text =

        "📦 مدیریت محصولات\n\n" +

        `تعداد محصولات: ${products.length}\n\n`;


      products
        .slice(0, 20)
        .forEach(
          (product, index) => {

            text +=

              `${index + 1}. ${product.name}\n` +

              `🆔 ${product.id}\n` +

              `💰 ${product.price}\n` +

              `📦 موجودی: ${product.totalStock || 0}\n\n`;

          }
        );


      if (
        products.length > 20
      ) {

        text +=

          `\n⚠️ نمایش ۲۰ محصول اول از ${products.length} محصول`;

      }


      return text;

    }


    // ==========================================
    // منوی محصولات
    // ==========================================

    function buildProductsKeyboard(
      products
    ) {

      const keyboard = [];


      products
        .slice(0, 20)
        .forEach(
          (product) => {

            keyboard.push([

              {
                text:
                  `📦 ${product.name}`,

                callback_data:
                  `manage_product:${product.id}`

              }

            ]);

          }
        );


      keyboard.push([

        {
          text:
            "➕ افزودن محصول",

          callback_data:
            "add_product"

        }

      ]);


      keyboard.push([

        {
          text:
            "🔙 بازگشت",

          callback_data:
            "home"

        }

      ]);


      return keyboard;

    }


    // ==========================================
    // منوی یک محصول
    // ==========================================

    function buildProductMenu(
      product
    ) {

      return {

        text:

          "📦 مدیریت محصول\n\n" +

          `🆔 ${product.id}\n\n` +

          `نام: ${product.name}\n` +

          `دسته‌بندی: ${product.category}\n` +

          `برند: ${product.brand || "-"}\n\n` +

          `💰 قیمت: ${product.price}\n` +

          `🏷️ تخفیف: ${product.discount || "-"}\n\n` +

          `📸 تصاویر: ${(product.images || []).length}\n` +

          `📦 موجودی: ${product.totalStock || 0}\n\n` +

          `وضعیت: ${product.status}\n` +

          `Workflow: ${product.workflowStatus || "draft"}`,

        keyboard: [

          [

            {
              text:
                "👁️ پیش‌نمایش",

              callback_data:
                `preview:${product.id}`

            }

          ],

          [

            {
              text:
                "📸 تصاویر",

              callback_data:
                `upload_images:${product.id}`

            },

            {

              text:
                "📦 موجودی",

              callback_data:
                `stock:${product.id}`

            }

          ],

          [

            {
              text:
                "✏️ ویرایش",

              callback_data:
                `edit_draft:${product.id}`

            },

            {

              text:
                "❌ لغو Draft",

              callback_data:
                `cancel_draft:${product.id}`

            }

          ],

          [

            {
              text:
                "🔙 بازگشت به محصولات",

              callback_data:
                "manage_products"

            }

          ]

        ]

      };

    }


    // ==========================================
    // پیام خصوصی متنی
    // ==========================================

    if (
      update.message &&
      update.message.text
    ) {

      const chatId =
        update.message.chat.id;

      const text =
        update.message.text.trim();


      console.log(
        "PRIVATE CHAT ID:",
        chatId
      );

      console.log(
        "MESSAGE:",
        text
      );


      // ========================================
      // پاسخ موجودی
      // ========================================

      const repliedMessage =
        update.message.reply_to_message;


      if (
        repliedMessage &&
        repliedMessage.text &&
        repliedMessage.text.includes(
          "STOCK_STATE:"
        )
      ) {

        const stateMatch =
          repliedMessage.text.match(
            /STOCK_STATE:([A-Za-z0-9_-]+)/
          );


        if (!stateMatch) {

          await sendMessage(

            chatId,

            "❌ اطلاعات جلسه موجودی قابل خواندن نیست.\n" +
            "لطفاً دوباره از دکمه تنظیم موجودی شروع کنید."

          );

          return {

            statusCode: 200,

            body: JSON.stringify({
              success: false,
              error:
                "stock_state_missing"
            })

          };

        }


        const state =
          decodeState(
            stateMatch[1]
          );


        if (!state) {

          await sendMessage(

            chatId,

            "❌ اطلاعات موجودی خراب یا منقضی شده است.\n\n" +
            "لطفاً دوباره موجودی را تنظیم کنید."

          );

          return {

            statusCode: 200,

            body: JSON.stringify({
              success: false,
              error:
                "invalid_stock_state"
            })

          };

        }


        const quantityText =
          text
            .replace(/,/g, "")
            .replace(/،/g, "")
            .trim();


        const quantity =
          Number(
            quantityText
          );


        if (
          !Number.isInteger(quantity) ||
          quantity < 0
        ) {

          await sendMessage(

            chatId,

            "❌ مقدار موجودی نامعتبر است.\n\n" +

            "لطفاً فقط یک عدد صحیح صفر یا بیشتر وارد کنید.\n\n" +

            "مثال:\n" +

            "10"

          );

          return {

            statusCode: 200,

            body: JSON.stringify({
              success: false,
              error:
                "invalid_quantity"
            })

          };

        }


        state.stocks[state.index] =
          quantity;


        const nextIndex =
          state.index + 1;


        // ======================================
        // مرحله بعد
        // ======================================

        if (
          nextIndex <
          state.combinations.length
        ) {

          state.index =
            nextIndex;


          const encodedState =
            encodeState(
              state
            );


          const nextText =

            buildStockMenuText(
              state
            ) +

            "\n\n" +

            `STOCK_STATE:${encodedState}`;


          await sendMessage(

            chatId,

            nextText

          );


          return {

            statusCode: 200,

            body: JSON.stringify({

              success: true,

              action:
                "stock_next",

              product_id:
                state.productId

            })

          };

        }


        // ======================================
        // پایان موجودی
        // ======================================

        const stockRecord =
          buildStockRecord(
            state
          );


        const databaseResponse =
          await sendMessage(

            DATABASE_CHANNEL_ID,

            stockRecord

          );


        if (
          !databaseResponse.ok
        ) {

          console.error(
            "STOCK DATABASE ERROR:",
            databaseResponse
          );


          await sendMessage(

            chatId,

            "❌ ذخیره موجودی در آرشیو تلگرام انجام نشد.\n\n" +

            "موجودی دوباره ثبت نشد تا از ایجاد رکورد ناقص جلوگیری شود."

          );


          return {

            statusCode: 500,

            body: JSON.stringify({
              success: false,
              error:
                "stock_save_failed"
            })

          };

        }


        const stockMap =
          buildStockMap(
            state
          );


        const totalStock =
          state.stocks.reduce(
            (sum, value) =>
              sum + Number(value || 0),
            0
          );


        // ======================================
        // ذخیره موجودی در Netlify Blobs
        // ======================================

        const updatedProduct =
          await updateProduct(

            state.productId,

            async (product) => {

              product.stock =
                stockMap;

              product.totalStock =
                totalStock;

              product.workflowStatus =
                "stock_confirmed";

              return product;

            }

          );


        if (!updatedProduct) {

          await sendMessage(

            chatId,

            "❌ محصول در دیتابیس پیدا نشد.\n\n" +

            "موجودی در آرشیو ثبت شد اما رکورد اصلی محصول به‌روزرسانی نشد."

          );

          return {

            statusCode: 500,

            body: JSON.stringify({
              success: false,
              error:
                "product_update_failed"
            })

          };

        }


        await sendMessage(

          chatId,

          "✅ موجودی محصول با موفقیت ثبت شد.\n\n" +

          `🆔 Product ID: ${state.productId}\n\n` +

          `📦 تعداد ترکیب‌ها: ${state.combinations.length}\n` +

          `📊 مجموع موجودی: ${totalStock}\n\n` +

          "اطلاعات موجودی در Netlify Blobs نیز ذخیره شد.",

          [

            [

              {
                text:
                  "👁️ پیش‌نمایش محصول",

                callback_data:
                  `preview:${state.productId}`

              }

            ],

            [

              {
                text:
                  "✏️ ویرایش موجودی",

                callback_data:
                  `stock:${state.productId}`

              }

            ],

            [

              {
                text:
                  "🔙 مدیریت محصولات",

                callback_data:
                  "manage_products"

              }

            ]

          ]

        );


        return {

          statusCode: 200,

          body: JSON.stringify({

            success: true,

            action:
              "stock_completed",

            product_id:
              state.productId,

            total_stock:
              totalStock

          })

        };

      }


      // ========================================
      // /start
      // ========================================

      if (
        text === "/start"
      ) {

        await sendMessage(

          chatId,

          "🛍️ HamedShop\n\n" +

          "سلام 👋\n\n" +

          "به پنل مدیریت فروشگاه خوش آمدید.\n\n" +

          "لطفاً یک گزینه را انتخاب کنید:",

          [

            [

              {
                text:
                  "➕ افزودن محصول",

                callback_data:
                  "add_product"

              }

            ],

            [

              {
                text:
                  "📦 مدیریت محصولات",

                callback_data:
                  "manage_products"

              }

            ],

            [

              {
                text:
                  "🏷️ دسته‌بندی‌ها",

                callback_data:
                  "categories"

              }

            ],

            [

              {
                text:
                  "⭐ محصولات ویژه",

                callback_data:
                  "featured"

              }

            ],

            [

              {
                text:
                  "🔥 تخفیف‌ها",

                callback_data:
                  "discounts"

              }

            ],

            [

              {
                text:
                  "⚙️ تنظیمات",

                callback_data:
                  "settings"

              }

            ]

          ]

        );

      }


      // ========================================
      // دریافت قالب محصول
      // ========================================

      else if (
        text.startsWith(
          "#PRODUCT"
        )
      ) {

        console.log(
          "PRODUCT TEMPLATE RECEIVED"
        );


        const rawProduct =
          parseProductTemplate(
            text
          );


        const product =
          normalizeProduct(
            rawProduct
          );


        const errors =
          validateProduct(
            product
          );


        if (
          errors.length > 0
        ) {

          await sendMessage(

            chatId,

            "❌ قالب محصول کامل نیست.\n\n" +

            "فیلدهای زیر باید تکمیل شوند:\n\n" +

            errors
              .map(
                item =>
                  `🔴 ${item}`
              )
              .join("\n") +

            "\n\nلطفاً قالب را اصلاح و دوباره ارسال کنید."

          );

          return {

            statusCode: 200,

            body: JSON.stringify({

              success: false,

              error:
                "validation_failed",

              fields:
                errors

            })

          };

        }


        const productId =
          generateProductId();


        console.log(
          "NEW PRODUCT ID:",
          productId
        );


        // ======================================
        // Draft برای آرشیو تلگرام
        // ======================================

        const draftMessage =
          buildDraftMessage(
            product,
            productId
          );


        const databaseResponse =
          await sendMessage(

            DATABASE_CHANNEL_ID,

            draftMessage

          );


        if (
          !databaseResponse.ok
        ) {

          console.error(
            "DATABASE ERROR:",
            databaseResponse
          );


          await sendMessage(

            chatId,

            "❌ خطا در ذخیره Draft در آرشیو تلگرام."

          );


          return {

            statusCode: 500,

            body: JSON.stringify({

              success: false,

              error:
                "database_save_failed"

            })

          };

        }


        const draftMessageId =
          databaseResponse.result.message_id;


        // ======================================
        // ساخت Product Record
        // ======================================

        const productRecord =
          buildProductRecord(

            product,

            productId,

            draftMessageId

          );


        // ======================================
        // ذخیره در Netlify Blobs
        // ======================================

        try {

          await saveProduct(
            productRecord
          );

        } catch (blobError) {

          console.error(
            "BLOBS SAVE ERROR:",
            blobError
          );


          await sendMessage(

            chatId,

            "❌ Draft در آرشیو تلگرام ذخیره شد اما ذخیره محصول در Netlify Blobs ناموفق بود.\n\n" +

            `🆔 Product ID: ${productId}\n\n` +

            "لطفاً قبل از ادامه، خطای Netlify را بررسی کنید."

          );


          return {

            statusCode: 500,

            body: JSON.stringify({

              success: false,

              error:
                "blobs_save_failed",

              product_id:
                productId

            })

          };

        }


        // ======================================
        // Product Index
        // ======================================

        const indexResponse =
          await saveProductIndex(

            productId,

            draftMessageId,

            "DRAFT"

          );


        if (
          !indexResponse.ok
        ) {

          console.error(
            "PRODUCT INDEX ERROR:",
            indexResponse
          );


          await sendMessage(

            chatId,

            "⚠️ محصول در دیتابیس ذخیره شد اما ثبت Product Index انجام نشد.\n\n" +

            `🆔 Product ID: ${productId}\n` +

            `📌 Draft Message ID: ${draftMessageId}`

          );

        }


        // ======================================
        // پاسخ به ادمین
        // ======================================

        await sendMessage(

          chatId,

          "✅ محصول دریافت و در دیتابیس ذخیره شد.\n\n" +

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

          "📸 مرحله بعد:\n\n" +

          "ارسال تصاویر محصول",

          [

            [

              {
                text:
                  "📸 ارسال تصاویر",

                callback_data:
                  `upload_images:${productId}`

              }

            ],

            [

              {
                text:
                  "📦 تنظیم موجودی",

                callback_data:
                  `stock:${productId}`

              }

            ],

            [

              {
                text:
                  "👁️ پیش‌نمایش",

                callback_data:
                  `preview:${productId}`

              }

            ],

            [

              {
                text:
                  "✏️ ویرایش اطلاعات",

                callback_data:
                  `edit_draft:${productId}`

              }

            ],

            [

              {
                text:
                  "❌ لغو",

                callback_data:
                  `cancel_draft:${productId}`

              }

            ]

          ]

        );


        return {

          statusCode: 200,

          body: JSON.stringify({

            success: true,

            action:
              "product_draft_created",

            product_id:
              productId,

            draft_message_id:
              draftMessageId

          })

        };

      }


      return {

        statusCode: 200,

        body: JSON.stringify({
          success: true
        })

      };

    }


    // ==========================================
    // دریافت عکس
    // ==========================================

    if (
      update.message &&
      update.message.photo
    ) {

      const message =
        update.message;

      const chatId =
        message.chat.id;


      console.log(
        "PHOTO RECEIVED"
      );


      const repliedMessage =
        message.reply_to_message;


      if (!repliedMessage) {

        await sendMessage(

          chatId,

          "⚠️ این تصویر به هیچ محصولی متصل نیست.\n\n" +

          "لطفاً ابتدا روی دکمه «📸 ارسال تصاویر» محصول موردنظر بزنید و سپس عکس را در پاسخ به پیام درخواست تصاویر ارسال کنید."

        );


        return {

          statusCode: 200,

          body: JSON.stringify({

            success: false,

            error:
              "photo_without_product"

          })

        };

      }


      const productId =
        extractProductId(
          repliedMessage.text
        );


      if (!productId) {

        await sendMessage(

          chatId,

          "❌ نتوانستم Product ID این تصویر را تشخیص بدهم.\n\n" +

          "لطفاً از دکمه «📸 ارسال تصاویر» همان محصول استفاده کنید."

        );


        return {

          statusCode: 200,

          body: JSON.stringify({

            success: false,

            error:
              "product_id_not_found"

          })

        };

      }


      // بررسی وجود محصول در Blobs

      const product =
        await getProduct(
          productId
        );


      if (!product) {

        await sendMessage(

          chatId,

          "❌ این محصول در دیتابیس HamedShop پیدا نشد.\n\n" +

          `Product ID: ${productId}`

        );


        return {

          statusCode: 404,

          body: JSON.stringify({

            success: false,

            error:
              "product_not_found"

          })

        };

      }


      const photos =
        message.photo;


      const largestPhoto =
        photos[
          photos.length - 1
        ];


      const fileId =
        largestPhoto.file_id;


      const mediaGroupId =
        message.media_group_id || "";


      const saved =
        await saveImageRecord(

          productId,

          fileId,

          message.message_id,

          mediaGroupId

        );


      if (!saved.ok) {

        console.error(
          "IMAGE SAVE ERROR:",
          saved
        );


        await sendMessage(

          chatId,

          "❌ ذخیره تصویر انجام نشد.\nلطفاً دوباره تلاش کنید."

        );


        return {

          statusCode: 500,

          body: JSON.stringify({

            success: false,

            error:
              "image_save_failed"

          })

        };

      }


      const updatedProduct =
        await getProduct(
          productId
        );


      const imageCount =
        updatedProduct &&
        Array.isArray(
          updatedProduct.images
        )
          ? updatedProduct.images.length
          : 0;


      await sendMessage(

        chatId,

        "✅ تصویر دریافت شد.\n\n" +

        `🆔 Product ID: ${productId}\n\n` +

        `📸 تعداد تصاویر ثبت‌شده: ${imageCount}\n\n` +

        "تصویر با موفقیت در دیتابیس محصول ذخیره شد.\n\n" +

        "می‌توانید تصویر بعدی را ارسال کنید یا مرحله موجودی را شروع کنید.",

        [

          [

            {
              text:
                "📸 تصویر بعدی",

              callback_data:
                `upload_images:${productId}`

            }

          ],

          [

            {
              text:
                "📦 تنظیم موجودی",

              callback_data:
                `stock:${productId}`

            }

          ],

          [

            {
              text:
                "👁️ پیش‌نمایش",

              callback_data:
                `preview:${productId}`

            }

          ]

        ]

      );


      return {

        statusCode: 200,

        body: JSON.stringify({

          success: true,

          type:
            "product_image",

          product_id:
            productId,

          file_id:
            fileId,

          image_count:
            imageCount

        })

      };

    }


    // ==========================================
    // Callback Query
    // ==========================================

    if (
      update.callback_query
    ) {

      const callbackQuery =
        update.callback_query;

      const callbackQueryId =
        callbackQuery.id;

      const chatId =
        callbackQuery.message.chat.id;

      const action =
        callbackQuery.data;


      console.log(
        "BUTTON:",
        action
      );


      await answerCallbackQuery(
        callbackQueryId
      );


      // ========================================
      // HOME
      // ========================================

      if (
        action === "home"
      ) {

        await sendMessage(

          chatId,

          "🛍️ HamedShop\n\n" +

          "پنل مدیریت فروشگاه\n\n" +

          "لطفاً یک گزینه را انتخاب کنید:",

          [

            [

              {
                text:
                  "➕ افزودن محصول",

                callback_data:
                  "add_product"

              }

            ],

            [

              {
                text:
                  "📦 مدیریت محصولات",

                callback_data:
                  "manage_products"

              }

            ],

            [

              {
                text:
                  "🏷️ دسته‌بندی‌ها",

                callback_data:
                  "categories"

              }

            ],

            [

              {
                text:
                  "⭐ محصولات ویژه",

                callback_data:
                  "featured"

              }

            ],

            [

              {
                text:
                  "🔥 تخفیف‌ها",

                callback_data:
                  "discounts"

              }

            ],

            [

              {
                text:
                  "⚙️ تنظیمات",

                callback_data:
                  "settings"

              }

            ]

          ]

        );

      }


      // ========================================
      // افزودن محصول
      // ========================================

      else if (
        action === "add_product"
      ) {

        await sendMessage(

          chatId,

          "➕ افزودن محصول\n\n" +

          "مرحله ۱ از ثبت محصول\n\n" +

          "📝 لطفاً قالب محصول را ارسال کنید.\n\n" +

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

          "تنوع 3:\n" +

          "گزینه‌ها 3:\n\n" +

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

          "گزینه‌ها 2: سبز، کرم، مشکی، شیری\n\n" +

          "تنوع 3:\n" +

          "گزینه‌ها 3:\n\n" +

          "توضیحات:\n" +

          "چادر مناسب سفر و کمپینگ\n\n" +

          "وضعیت: فعال"

        );

      }


      // ========================================
      // مدیریت محصولات
      // ========================================

      else if (
        action === "manage_products"
      ) {

        try {

          const products =
            await listProducts();


          const text =
            buildProductsListText(
              products
            );


          const keyboard =
            buildProductsKeyboard(
              products
            );


          await sendMessage(

            chatId,

            text,

            keyboard

          );

        } catch (error) {

          console.error(
            "LIST PRODUCTS ERROR:",
            error
          );


          await sendMessage(

            chatId,

            "❌ خطا در خواندن محصولات از Netlify Blobs.\n\n" +

            `${error.message}`

          );

        }

      }


      // ========================================
      // انتخاب یک محصول
      // ========================================

      else if (
        action.startsWith(
          "manage_product:"
        )
      ) {

        const productId =
          action.substring(
            "manage_product:".length
          );


        const product =
          await getProduct(
            productId
          );


        if (!product) {

          await sendMessage(

            chatId,

            "❌ محصول پیدا نشد.\n\n" +

            `Product ID: ${productId}`

          );

        } else {

          const menu =
            buildProductMenu(
              product
            );


          await sendMessage(

            chatId,

            menu.text,

            menu.keyboard

          );

        }

      }


      // ========================================
      // ارسال تصاویر
      // ========================================

      else if (
        action.startsWith(
          "upload_images:"
        )
      ) {

        const productId =
          action.substring(
            "upload_images:".length
          );


        const product =
          await getProduct(
            productId
          );


        if (!product) {

          await sendMessage(

            chatId,

            "❌ محصول پیدا نشد.\n\n" +

            `Product ID: ${productId}`

          );

        } else {

          const imageCount =
            Array.isArray(
              product.images
            )
              ? product.images.length
              : 0;


          await sendMessage(

            chatId,

            "📸 ارسال تصاویر محصول\n\n" +

            `🆔 Product ID: ${productId}\n\n` +

            `📸 تصاویر ثبت‌شده: ${imageCount}\n\n` +

            "لطفاً عکس یا عکس‌های محصول را ارسال کنید.\n\n" +

            "⚠️ بسیار مهم:\n\n" +

            "عکس را به صورت Reply به همین پیام بفرستید.\n\n" +

            "بعد از اتمام تصاویر، روی دکمه تنظیم موجودی بزنید.",

            [

              [

                {
                  text:
                    "📦 تنظیم موجودی",

                  callback_data:
                    `stock:${productId}`

                }

              ],

              [

                {
                  text:
                    "👁️ پیش‌نمایش",

                  callback_data:
                    `preview:${productId}`

                }

              ]

            ]

          );

        }

      }


      // ========================================
      // تنظیم موجودی
      // ========================================

      else if (
        action.startsWith(
          "stock:"
        )
      ) {

        const productId =
          action.substring(
            "stock:".length
          );


        const product =
          await getProduct(
            productId
          );


        if (!product) {

          await sendMessage(

            chatId,

            "❌ محصول پیدا نشد.\n\n" +

            `Product ID: ${productId}`

          );

          return {

            statusCode: 404,

            body: JSON.stringify({

              success: false,

              error:
                "product_not_found"

            })

          };

        }


        const data =
          buildCombinationsFromProduct(
            product
          );


        const existingStock =
          product.stock || {};


        const stocks =
          data.combinations.map(
            combination => {

              return Number(
                existingStock[
                  combination.label
                ] || 0
              );

            }
          );


        const state = {

          productId:
            productId,

          dimensions:
            data.dimensions,

          combinations:
            data.combinations,

          stocks:
            stocks,

          index:
            0

        };


        const encodedState =
          encodeState(
            state
          );


        const stockText =

          buildStockMenuText(
            state
          ) +

          "\n\n" +

          `STOCK_STATE:${encodedState}`;


        await sendMessage(

          chatId,

          stockText

        );

      }


      // ========================================
      // پیش‌نمایش
      // ========================================

      else if (
        action.startsWith(
          "preview:"
        )
      ) {

        const productId =
          action.substring(
            "preview:".length
          );


        const product =
          await getProduct(
            productId
          );


        if (!product) {

          await sendMessage(

            chatId,

            "❌ محصول پیدا نشد."

          );

        } else {

          let text =

            "👁️ پیش‌نمایش محصول\n\n" +

            `🆔 Product ID: ${product.id}\n\n` +

            `📦 نام: ${product.name}\n` +

            `📂 دسته‌بندی: ${product.category}\n` +

            `🏷️ برند: ${product.brand || "-"}\n\n` +

            `💰 قیمت: ${product.price}\n` +

            `🔥 تخفیف: ${product.discount || "-"}\n\n` +

            `📝 ویژگی‌ها:\n${product.features || "-"}\n\n` +

            `📄 توضیحات:\n${product.description || "-"}\n\n`;


          text +=
            "🔹 تنوع‌ها:\n";


          if (
            product.variants &&
            product.variants.length
          ) {

            product.variants.forEach(
              (variant) => {

                text +=

                  `• ${variant.name}: ` +

                  `${(variant.options || []).join("، ")}\n`;

              }
            );

          } else {

            text +=
              "بدون تنوع\n";

          }


          text +=

            "\n📸 تصاویر: " +

            `${(product.images || []).length}\n` +

            `📦 موجودی کل: ${product.totalStock || 0}\n\n` +

            `📝 وضعیت: ${product.status}\n` +

            `⚙️ Workflow: ${product.workflowStatus || "draft"}`;


          await sendMessage(

            chatId,

            text,

            [

              [

                {
                  text:
                    "📸 تصاویر",

                  callback_data:
                    `upload_images:${product.id}`

                }

              ],

              [

                {
                  text:
                    "📦 تنظیم موجودی",

                  callback_data:
                    `stock:${product.id}`

                }

              ],

              [

                {
                  text:
                    "✏️ ویرایش",

                  callback_data:
                    `edit_draft:${product.id}`

                }

              ],

              [

                {
                  text:
                    "🔙 مدیریت محصولات",

                  callback_data:
                    "manage_products"

                }

              ]

            ]

          );

        }

      }


      // ========================================
      // ویرایش Draft
      // ========================================

      else if (
        action.startsWith(
          "edit_draft:"
        )
      ) {

        const productId =
          action.substring(
            "edit_draft:".length
          );


        const product =
          await getProduct(
            productId
          );


        if (!product) {

          await sendMessage(

            chatId,

            "❌ محصول پیدا نشد."

          );

        } else {

          await sendMessage(

            chatId,

            "✏️ ویرایش محصول\n\n" +

            `Product ID: ${product.id}\n\n` +

            "در این مرحله اطلاعات فعلی محصول در دیتابیس موجود است.\n\n" +

            "ویرایش کامل فیلدها را در مرحله بعد به همین سیستم اضافه می‌کنیم.",

            [

              [

                {
                  text:
                    "🔙 بازگشت",

                  callback_data:
                    `manage_product:${product.id}`

                }

              ]

            ]

          );

        }

      }


      // ========================================
      // لغو Draft
      // ========================================

      else if (
        action.startsWith(
          "cancel_draft:"
        )
      ) {

        const productId =
          action.substring(
            "cancel_draft:".length
          );


        const product =
          await getProduct(
            productId
          );


        if (!product) {

          await sendMessage(

            chatId,

            "❌ محصول پیدا نشد."

          );

        } else {

          await updateProduct(

            productId,

            async (currentProduct) => {

              currentProduct.workflowStatus =
                "cancelled";

              return currentProduct;

            }

          );


          await sendMessage(

            chatId,

            "❌ محصول به وضعیت لغو شده منتقل شد.\n\n" +

            `🆔 Product ID: ${productId}`

          );

        }

      }


      // ========================================
      // دسته‌بندی
      // ========================================

      else if (
        action === "categories"
      ) {

        await sendMessage(

          chatId,

          "🏷️ دسته‌بندی‌ها\n\n" +

          "این بخش در مرحله بعد ساخته می‌شود."

        );

      }


      // ========================================
      // ویژه
      // ========================================

      else if (
        action === "featured"
      ) {

        await sendMessage(

          chatId,

          "⭐ محصولات ویژه\n\n" +

          "این بخش در مرحله بعد ساخته می‌شود."

        );

      }


      // ========================================
      // تخفیف
      // ========================================

      else if (
        action === "discounts"
      ) {

        await sendMessage(

          chatId,

          "🔥 تخفیف‌ها\n\n" +

          "این بخش در مرحله بعد ساخته می‌شود."

        );

      }


      // ========================================
      // تنظیمات
      // ========================================

      else if (
        action === "settings"
      ) {

        await sendMessage(

          chatId,

          "⚙️ تنظیمات\n\n" +

          "این بخش در مرحله بعد ساخته می‌شود."

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

    if (
      update.channel_post
    ) {

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

          type:
            "channel_post",

          channel_id:
            channel.id

        })

      };

    }


    // ==========================================
    // پایان
    // ==========================================

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

        error:
          error.message

      })

    };

  }

};
