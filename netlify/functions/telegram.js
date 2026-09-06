// exports.handler = async (event) => {
 // try {
    // if (event.httpMethod !== "POST") {
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: "HamedShop Telegram Bot is alive 🚀"
        })
      };
    }

//    const update = JSON.parse(event.body || "{}");

    const token = process.env.TELEGRAM_BOT_TOKEN;

    const DATABASE_CHANNEL_ID = "-1004369004122";

    if (!token) {
      console.error("TELEGRAM_BOT_TOKEN is missing");

      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          error: "TELEGRAM_BOT_TOKEN is missing"
        })
      };
    }

    // =========================================================
    // TELEGRAM HELPERS
    // =========================================================

    async function telegram(method, body = {}) {
      const response = await fetch(
        `https://api.telegram.org/bot${token}/${method}`,
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

//    async function sendMessage(chatId, text, keyboard = null) {
      const body = {
        chat_id: chatId,
        text
      };

      if (keyboard) {
        body.reply_markup = {
          inline_keyboard: keyboard
        };
      }

      return await telegram("sendMessage", body);
    }

    async function editMessage(
      chatId,
      messageId,
      text,
      keyboard = null
    ) {
      const body = {
        chat_id: chatId,
        message_id: messageId,
        text
      };

      if (keyboard) {
        body.reply_markup = {
          inline_keyboard: keyboard
        };
      }

      return await telegram("editMessageText", body);
    }

    async function answerCallbackQuery(callbackQueryId) {
      return await telegram("answerCallbackQuery", {
        callback_query_id: callbackQueryId
      });
    }

    async function getChat(chatId) {
      return await telegram("getChat", {
        chat_id: chatId
      });
    }

    async function pinChatMessage(chatId, messageId) {
      return await telegram("pinChatMessage", {
        chat_id: chatId,
        message_id: messageId,
        disable_notification: true
      });
    }

    async function copyMessage(
      targetChatId,
      fromChatId,
      messageId
    ) {
      return await telegram("copyMessage", {
        chat_id: targetChatId,
        from_chat_id: fromChatId,
        message_id: messageId
      });
    }

    // =========================================================
    // PRODUCT ID
    // =========================================================

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

    // =========================================================
    // PRODUCT TEMPLATE
    // =========================================================

    function parseProductTemplate(text) {
      const product = {};
      const lines = text.split(/\r?\n/);

      let currentField = null;

      for (const rawLine of lines) {
        const line = rawLine.trim();

        if (!line) continue;
        if (line === "#PRODUCT") continue;

        const match = line.match(/^([^:]+):\s*(.*)$/);

        if (match) {
          const field = match[1].trim();
          const value = match[2].trim();

          currentField = field;
          product[field] = value;

          continue;
        }

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

        variant3: product["تنوع 3"] || "",
        options3: product["گزینه‌ها 3"] || "",

        description: product["توضیحات"] || "",
        status: product["وضعیت"] || ""
      };
    }

    function validateProduct(product) {
      const errors = [];

      if (!product.name) errors.push("نام محصول");
      if (!product.category) errors.push("دسته‌بندی");
      if (!product.price) errors.push("قیمت");
      if (!product.status) errors.push("وضعیت");

      if (
        product.variant1 &&
        !product.options1
      ) {
        errors.push("گزینه‌های تنوع 1");
      }

      if (
        product.variant2 &&
        !product.options2
      ) {
        errors.push("گزینه‌های تنوع 2");
      }

      if (
        product.variant3 &&
        !product.options3
      ) {
        errors.push("گزینه‌های تنوع 3");
      }

      return errors;
    }

    function parseOptions(text) {
      if (!text) return [];

      return text
        .split(/[,،\n|]+/)
        .map(item => item.trim())
        .filter(Boolean);
    }

    // =========================================================
    // DRAFT
    // =========================================================

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

        `VARIANT_3: ${product.variant3}\n` +
        `OPTIONS_3: ${product.options3}\n\n` +

        `DESCRIPTION: ${product.description}\n\n` +

        `PRODUCT_STATUS: ${product.status}\n\n` +

        "IMAGES: 0\n" +
        "STOCK_STATUS: pending\n" +

        `CREATED_BY: telegram_admin\n` +
        `CREATED_AT: ${new Date().toISOString()}`
      );
    }

    // =========================================================
    // DATABASE RECORDS
    // =========================================================

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

    async function saveImageRecord(
      productId,
      fileId,
      messageId,
      mediaGroupId = ""
    ) {
      const imageRecord =
        "#PRODUCT_IMAGE\n\n" +
        `PRODUCT_ID: ${productId}\n` +
        `FILE_ID: ${fileId}\n` +
        `SOURCE_MESSAGE_ID: ${messageId}\n` +
        `MEDIA_GROUP_ID: ${mediaGroupId}\n` +
        `CREATED_AT: ${new Date().toISOString()}`;

      return await sendMessage(
        DATABASE_CHANNEL_ID,
        imageRecord
      );
    }

    // =========================================================
    // PRODUCT ID EXTRACTION
    // =========================================================

    function extractProductId(text) {
      if (!text) return null;

      const match =
        text.match(
          /Product ID:\s*(P[0-9A-Z-]+)/i
        );

      if (match) return match[1];

      const match2 =
        text.match(
          /PRODUCT_ID:\s*(P[0-9A-Z-]+)/i
        );

      if (match2) return match2[1];

      const match3 =
        text.match(
          /ID:\s*(P[0-9A-Z-]+)/i
        );

      if (match3) return match3[1];

      return null;
    }

    // =========================================================
    // VARIATIONS
    // =========================================================

    function buildCombinations(
      variant1,
      options1,
      variant2,
      options2,
      variant3,
      options3
    ) {
      const dimensions = [];

      if (
        variant1 &&
        options1.length > 0
      ) {
        dimensions.push({
          name: variant1,
          options: options1
        });
      }

      if (
        variant2 &&
        options2.length > 0
      ) {
        dimensions.push({
          name: variant2,
          options: options2
        });
      }

      if (
        variant3 &&
        options3.length > 0
      ) {
        dimensions.push({
          name: variant3,
          options: options3
        });
      }

      if (dimensions.length === 0) {
        return {
          dimensions: [],
          combinations: [
            {
              label: "موجودی کل",
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

      for (const dimension of dimensions) {
        const next = [];

        for (const current of combinations) {
          for (const option of dimension.options) {
            const values = [
              ...current.values,
              {
                dimension: dimension.name,
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

        combinations = next;
      }

      return {
        dimensions,
        combinations
      };
    }

    // =========================================================
    // STOCK STATE
    // =========================================================

    function buildStockMenuText(state) {
      const current = state.index;
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

    function encodeState(state) {
      const json =
        JSON.stringify(state);

      return Buffer
        .from(json, "utf8")
        .toString("base64url");
    }

    function decodeState(encoded) {
      try {
        const json =
          Buffer
            .from(encoded, "base64url")
            .toString("utf8");

        return JSON.parse(json);

      } catch (error) {
        console.error(
          "STATE DECODE ERROR:",
          error
        );

        return null;
      }
    }

    function buildStockRecord(state) {
      let text =
        "#PRODUCT_STOCK\n\n" +
        `PRODUCT_ID: ${state.productId}\n` +
        "STATUS: confirmed\n\n";

      text += "DIMENSIONS:\n";

      if (
        state.dimensions.length === 0
      ) {
        text += "NONE\n\n";

      } else {
        state.dimensions.forEach(
          (dimension, index) => {
            text +=
              `${index + 1}. ${dimension.name}\n`;
          }
        );

        text += "\n";
      }

      text += "STOCK:\n";

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

      const totalStock =
        state.stocks.reduce(
          (sum, value) =>
            sum + Number(value || 0),
          0
        );

      text +=
        `\nTOTAL_STOCK: ${totalStock}\n` +
        `CREATED_AT: ${new Date().toISOString()}`;

      return text;
    }

    // =========================================================
    // CATALOG
    //
    // Catalog now stores variation information encoded in the
    // final field.
    //
    // PRODUCT|ID|NAME|CATEGORY|STATUS|PRICE|MESSAGE_ID|SETUP
    // =========================================================

    function encodeCatalogSetup(product) {
      const setup = {
        variant1: product.variant1 || "",
        options1: parseOptions(product.options1 || ""),

        variant2: product.variant2 || "",
        options2: parseOptions(product.options2 || ""),

        variant3: product.variant3 || "",
        options3: parseOptions(product.options3 || "")
      };

      return Buffer
        .from(
          JSON.stringify(setup),
          "utf8"
        )
        .toString("base64url");
    }

    function decodeCatalogSetup(encoded) {
      if (!encoded) {
        return {
          variant1: "",
          options1: [],
          variant2: "",
          options2: [],
          variant3: "",
          options3: []
        };
      }

      try {
        return JSON.parse(
          Buffer
            .from(encoded, "base64url")
            .toString("utf8")
        );

      } catch (error) {
        console.error(
          "CATALOG SETUP DECODE ERROR:",
          error
        );

        return {
          variant1: "",
          options1: [],
          variant2: "",
          options2: [],
          variant3: "",
          options3: []
        };
      }
    }

    function parseCatalog(text) {
      if (!text) return [];

      const lines =
        text.split(/\r?\n/);

      const products = [];

      for (const line of lines) {

        // New catalog format
        const match =
          line.match(
            /^PRODUCT\|([^|]+)\|([^|]+)\|([^|]*)\|([^|]*)\|([^|]*)\|(\d+)(?:\|([^|]+))?$/
          );

        if (!match) continue;

        const setup =
          decodeCatalogSetup(
            match[8] || ""
          );

        products.push({
          productId: match[1],
          name: match[2],
          category: match[3],
          status: match[4],
          price: match[5],
          messageId: Number(match[6]),

          variant1:
            setup.variant1 || "",

          options1:
            setup.options1 || [],

          variant2:
            setup.variant2 || "",

          options2:
            setup.options2 || [],

          variant3:
            setup.variant3 || "",

          options3:
            setup.options3 || []
        });
      }

      return products;
    }

    function buildCatalogText(products) {
      let text =
        "#PRODUCT_CATALOG\n\n" +
        "HamedShop Product Catalog\n" +
        "DO NOT DELETE THIS MESSAGE\n\n";

      if (
        products.length === 0
      ) {
        text +=
          "PRODUCTS: 0\n\n" +
          "هنوز محصولی ثبت نشده است.";

        return text;
      }

      text +=
        `PRODUCTS: ${products.length}\n\n`;

      for (
        const product of products
      ) {
        const safeName =
          String(product.name || "")
            .replace(/\|/g, " ")
            .replace(/\r?\n/g, " ");

        const safeCategory =
          String(product.category || "")
            .replace(/\|/g, " ")
            .replace(/\r?\n/g, " ");

        const safeStatus =
          String(product.status || "")
            .replace(/\|/g, " ")
            .replace(/\r?\n/g, " ");

        const safePrice =
          String(product.price || "")
            .replace(/\|/g, " ")
            .replace(/\r?\n/g, " ");

        const setup =
          encodeCatalogSetup({
            variant1:
              product.variant1 || "",
            options1:
              product.options1 || [],

            variant2:
              product.variant2 || "",
            options2:
              product.options2 || [],

            variant3:
              product.variant3 || "",
            options3:
              product.options3 || []
          });

        text +=
          `PRODUCT|${product.productId}|${safeName}|${safeCategory}|${safeStatus}|${safePrice}|${product.messageId}|${setup}\n`;
      }

      return text;
    }

    function buildCatalogKeyboard(products) {
      const keyboard = [];

      for (
        const product of products
      ) {
        keyboard.push([
          {
            text:
              `📦 ${product.name}`.slice(
                0,
                60
              ),

            callback_data:
              `product:${product.productId}`
          }
        ]);
      }

      return keyboard;
    }

    // =========================================================
    // CATALOG MESSAGE
    // =========================================================

    async function getCatalogMessage() {
      const response =
        await getChat(
          DATABASE_CHANNEL_ID
        );

      if (
        !response.ok ||
        !response.result
      ) {
        console.error(
          "GET CHAT ERROR:",
          response
        );

        return null;
      }

      const pinned =
        response.result.pinned_message;

      if (!pinned) {
        return null;
      }

      if (
        !pinned.text ||
        !pinned.text.includes(
          "#PRODUCT_CATALOG"
        )
      ) {
        return null;
      }

      return pinned;
    }

    async function ensureCatalogMessage() {
      const existing =
        await getCatalogMessage();

      if (existing) {
        return existing;
      }

      const created =
        await sendMessage(
          DATABASE_CHANNEL_ID,
          buildCatalogText([])
        );

      if (
        !created.ok ||
        !created.result
      ) {
        console.error(
          "CATALOG CREATE ERROR:",
          created
        );

        return null;
      }

      const messageId =
        created.result.message_id;

      const pinned =
        await pinChatMessage(
          DATABASE_CHANNEL_ID,
          messageId
        );

      if (!pinned.ok) {
        console.error(
          "CATALOG PIN ERROR:",
          pinned
        );
      }

      return created.result;
    }

    async function addProductToCatalog(
      product
    ) {
      const catalog =
        await ensureCatalogMessage();

      if (!catalog) {
        return {
          ok: false,
          error: "catalog_not_available"
        };
      }

      const products =
        parseCatalog(
          catalog.text || ""
        );

      const existingIndex =
        products.findIndex(
          item =>
            item.productId ===
            product.productId
        );

      const catalogItem = {
        productId:
          product.productId,

        name:
          product.name,

        category:
          product.category,

        status:
          product.status,

        price:
          product.price,

        messageId:
          product.messageId,

        variant1:
          product.variant1 || "",

        options1:
          parseOptions(
            product.options1 || ""
          ),

        variant2:
          product.variant2 || "",

        options2:
          parseOptions(
            product.options2 || ""
          ),

        variant3:
          product.variant3 || "",

        options3:
          parseOptions(
            product.options3 || ""
          )
      };

      if (
        existingIndex >= 0
      ) {
        products[existingIndex] =
          catalogItem;

      } else {
        products.push(
          catalogItem
        );
      }

      const newText =
        buildCatalogText(
          products
        );

      if (
        newText.length > 4000
      ) {
        console.error(
          "CATALOG TOO LARGE"
        );

        return {
          ok: false,
          error: "catalog_too_large"
        };
      }

      const edited =
        await editMessage(
          DATABASE_CHANNEL_ID,
          catalog.message_id,
          newText
        );

      if (!edited.ok) {
        console.error(
          "CATALOG UPDATE ERROR:",
          edited
        );

        return {
          ok: false,
          error:
            "catalog_update_failed"
        };
      }

      return {
        ok: true,
        products
      };
    }

    async function getProductsFromCatalog() {
      const catalog =
        await getCatalogMessage();

      if (!catalog) {
        return {
          catalog: null,
          products: []
        };
      }

      return {
        catalog,

        products:
          parseCatalog(
            catalog.text || ""
          )
      };
    }

    async function findProductInCatalog(
      productId
    ) {
      const data =
        await getProductsFromCatalog();

      const product =
        data.products.find(
          item =>
            item.productId ===
            productId
        );

      return product || null;
    }

    // =========================================================
    // PREVIEW
    // =========================================================

    function buildProductPreview(
      product,
      productId
    ) {
      let text =
        "👁️ پیش‌نمایش محصول\n\n" +

        `🆔 Product ID:\n${productId}\n\n` +

        `📦 نام محصول:\n${product.name || "-"}\n\n` +

        `📂 دسته‌بندی:\n${product.category || "-"}\n\n` +

        `🏷️ برند:\n${product.brand || "-"}\n\n` +

        `💰 قیمت:\n${product.price || "-"}\n\n` +

        `🔥 تخفیف:\n${product.discount || "-"}\n\n`;

      if (product.features) {
        text +=
          `⭐ ویژگی‌ها:\n${product.features}\n\n`;
      }

      if (product.variant1) {
        text +=
          `🔹 ${product.variant1}:\n` +
          `${product.options1 || "-"}\n\n`;
      }

      if (product.variant2) {
        text +=
          `🔹 ${product.variant2}:\n` +
          `${product.options2 || "-"}\n\n`;
      }

      if (product.variant3) {
        text +=
          `🔹 ${product.variant3}:\n` +
          `${product.options3 || "-"}\n\n`;
      }

      if (product.description) {
        text +=
          `📝 توضیحات:\n${product.description}\n\n`;
      }

      text +=
        `📌 وضعیت:\n${product.status || "-"}\n`;

      return text;
    }

    async function getProductDraft(
      chatId,
      product
    ) {
      const copied =
        await copyMessage(
          chatId,
          DATABASE_CHANNEL_ID,
          product.messageId
        );

      if (!copied.ok) {
        console.error(
          "COPY PRODUCT ERROR:",
          copied
        );

        return null;
      }

      return copied;
    }

    // =========================================================
    // PRODUCTS MENU
    // =========================================================

    async function showProductsMenu(
      chatId
    ) {
      const data =
        await getProductsFromCatalog();

      if (!data.catalog) {
        const catalog =
          await ensureCatalogMessage();

        if (!catalog) {
          await sendMessage(
            chatId,
            "❌ دفتر محصولات قابل دسترسی نیست.\n\n" +
            "لطفاً بررسی کن که ربات در کانال دیتابیس Admin باشد و اجازه ارسال/ویرایش/Pin پیام داشته باشد."
          );

          return;
        }

        await sendMessage(
          chatId,
          "📦 مدیریت محصولات\n\n" +
          "هنوز محصولی در سیستم ثبت نشده است."
        );

        return;
      }

      const products =
        data.products;

      if (
        products.length === 0
      ) {
        await sendMessage(
          chatId,
          "📦 مدیریت محصولات\n\n" +
          "هنوز محصولی ثبت نشده است.\n\n" +
          "برای شروع، روی «➕ افزودن محصول» بزن."
        );

        return;
      }

      const keyboard =
        buildCatalogKeyboard(
          products
        );

      await sendMessage(
        chatId,

        "📦 مدیریت محصولات\n\n" +
        `تعداد محصولات: ${products.length}\n\n` +
        "محصول موردنظر را انتخاب کنید:",

        keyboard
      );
    }

    // =========================================================
    // PRIVATE TEXT
    // =========================================================

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

      const repliedMessage =
        update.message.reply_to_message;

      // =======================================================
      // STOCK INPUT
      // =======================================================

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
            "❌ اطلاعات جلسه موجودی قابل خواندن نیست.\n\n" +
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
          Number(quantityText);

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

        // -------------------------------------------------------
        // NEXT COMBINATION
        // -------------------------------------------------------

        if (
          nextIndex <
          state.combinations.length
        ) {
          state.index =
            nextIndex;

          const encodedState =
            encodeState(state);

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

        // -------------------------------------------------------
        // SAVE STOCK
        // -------------------------------------------------------

        const stockRecord =
          buildStockRecord(
            state
          );

        const databaseResponse =
          await sendMessage(
            DATABASE_CHANNEL_ID,
            stockRecord
          );

        if (!databaseResponse.ok) {
          console.error(
            "STOCK DATABASE ERROR:",
            databaseResponse
          );

          await sendMessage(
            chatId,
            "❌ ذخیره موجودی در دیتابیس تلگرام انجام نشد.\n\n" +
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

        const totalStock =
          state.stocks.reduce(
            (sum, value) =>
              sum +
              Number(value || 0),
            0
          );

        await sendMessage(
          chatId,

          "✅ موجودی محصول با موفقیت ثبت شد.\n\n" +

          `🆔 Product ID:\n${state.productId}\n\n` +

          `📦 تعداد ترکیب‌ها:\n${state.combinations.length}\n\n` +

          `📊 مجموع موجودی:\n${totalStock}\n\n` +

          "مرحله موجودی با موفقیت تکمیل شد.",

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

      // =======================================================
      // START
      // =======================================================

      if (
        text === "/start"
      ) {
        await sendMessage(
          chatId,

          "🛍️ HamedShop\n\n" +
          "سلام 👋\n" +
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

      // =======================================================
      // PRODUCT TEMPLATE
      // =======================================================

      else if (
        text.startsWith("#PRODUCT")
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
            "❌ خطا در ذخیره Draft در دیتابیس تلگرام."
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
          databaseResponse
            .result
            .message_id;

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

            "⚠️ محصول ذخیره شد اما ثبت Product Index انجام نشد.\n\n" +

            `🆔 Product ID: ${productId}\n` +

            `📌 Draft Message ID: ${draftMessageId}\n\n` +

            "لطفاً این مورد را بررسی کنید."
          );
        }

        // -------------------------------------------------------
        // IMPORTANT:
        // Save variation information into Catalog.
        // -------------------------------------------------------

        const catalogResponse =
          await addProductToCatalog({
            productId,
            name:
              product.name,
            category:
              product.category,
            status:
              product.status,
            price:
              product.price,
            messageId:
              draftMessageId,

            variant1:
              product.variant1,
            options1:
              product.options1,

            variant2:
              product.variant2,
            options2:
              product.options2,

            variant3:
              product.variant3,
            options3:
              product.options3
          });

        if (
          !catalogResponse.ok
        ) {
          console.error(
            "CATALOG ERROR:",
            catalogResponse
          );

          await sendMessage(
            chatId,

            "⚠️ محصول ذخیره شد اما ثبت آن در فهرست مدیریت محصولات انجام نشد.\n\n" +

            `🆔 Product ID: ${productId}\n\n` +

            "لطفاً بعداً Catalog را بررسی کنید."
          );
        }

        await sendMessage(
          chatId,

          "✅ محصول دریافت شد.\n\n" +

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

      // =======================================================
      // UNKNOWN TEXT
      // =======================================================

      else {
        await sendMessage(
          chatId,

          "ℹ️ دستور یا پیام قابل پردازشی دریافت نشد.\n\n" +
          "برای بازگشت به منوی اصلی /start را ارسال کنید."
        );
      }

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true
        })
      };
    }

    // =========================================================
    // PHOTO
    // =========================================================

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

      await sendMessage(
        chatId,

        "✅ تصویر دریافت شد.\n\n" +

        `🆔 Product ID:\n${productId}\n\n` +

        "📸 تصویر با موفقیت به محصول متصل شد.\n\n" +

        "می‌توانید تصویر بعدی را هم ارسال کنید یا مرحله موجودی را شروع کنید.",

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
            fileId
        })
      };
    }

    // =========================================================
    // CALLBACK
    // =========================================================

    if (
      update.callback_query
    ) {
      const callbackQuery =
        update.callback_query;

      const callbackQueryId =
        callbackQuery.id;

      const chatId =
        callbackQuery
          .message
          .chat
          .id;

      const action =
        callbackQuery.data;

      console.log(
        "BUTTON:",
        action
      );

      await answerCallbackQuery(
        callbackQueryId
      );

      // =======================================================
      // ADD PRODUCT
      // =======================================================

      if (
        action ===
        "add_product"
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
          "گزینه‌ها 2: سبز، کرم، مشکی\n\n" +

          "تنوع 3:\n" +
          "گزینه‌ها 3:\n\n" +

          "توضیحات:\n" +
          "چادر مناسب سفر و کمپینگ\n\n" +

          "وضعیت: فعال"
        );
      }

      // =======================================================
      // MANAGE PRODUCTS
      // =======================================================

      else if (
        action ===
        "manage_products"
      ) {
        await showProductsMenu(
          chatId
        );
      }

      // =======================================================
      // PRODUCT
      // =======================================================

      else if (
        action.startsWith(
          "product:"
        )
      ) {
        const productId =
          action.split(":")[1];

        const product =
          await findProductInCatalog(
            productId
          );

        if (!product) {
          await sendMessage(
            chatId,

            "❌ محصول موردنظر در Catalog پیدا نشد.\n\n" +
            `Product ID: ${productId}`
          );

          return {
            statusCode: 200,
            body: JSON.stringify({
              success: false,
              error:
                "product_not_found"
            })
          };
        }

        await sendMessage(
          chatId,

          "📦 مدیریت محصول\n\n" +

          `🆔 Product ID:\n${product.productId}\n\n` +

          `📦 نام:\n${product.name}\n\n` +

          `📂 دسته‌بندی:\n${product.category || "-"}\n\n` +

          `💰 قیمت:\n${product.price || "-"}\n\n` +

          `📌 وضعیت:\n${product.status || "-"}\n\n` +

          "لطفاً عملیات موردنظر را انتخاب کنید:",

          [
            [
              {
                text:
                  "👁️ پیش‌نمایش",

                callback_data:
                  `preview:${product.productId}`
              }
            ],

            [
              {
                text:
                  "📸 مدیریت تصاویر",

                callback_data:
                  `upload_images:${product.productId}`
              }
            ],

            [
              {
                text:
                  "📦 مدیریت موجودی",

                callback_data:
                  `stock:${product.productId}`
              }
            ],

            [
              {
                text:
                  "✏️ ویرایش اطلاعات",

                callback_data:
                  `edit_draft:${product.productId}`
              }
            ],

            [
              {
                text:
                  "❌ لغو محصول",

                callback_data:
                  `cancel_draft:${product.productId}`
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
        );
      }

      // =======================================================
      // UPLOAD IMAGES
      // =======================================================

      else if (
        action.startsWith(
          "upload_images:"
        )
      ) {
        const productId =
          action.split(":")[1];

        await sendMessage(
          chatId,

          "📸 ارسال تصاویر محصول\n\n" +

          `🆔 Product ID:\n${productId}\n\n` +

          "لطفاً عکس یا عکس‌های محصول را ارسال کنید.\n\n" +

          "⚠️ بسیار مهم:\n\n" +

          "عکس را به صورت Reply به همین پیام بفرستید.\n\n" +

          "می‌توانید یک عکس یا چند عکس ارسال کنید.\n\n" +

          "بعد از اتمام تصاویر، روی دکمه تنظیم موجودی بزنید.",

          [
            [
              {
                text:
                  "📦 تنظیم موجودی",

                callback_data:
                  `stock:${productId}`
              }
            ]
          ]
        );
      }

      // =======================================================
      // STOCK
      // =======================================================

      else if (
        action.startsWith(
          "stock:"
        )
      ) {
        const productId =
          action.split(":")[1];

        const product =
          await findProductInCatalog(
            productId
          );

        if (!product) {
          await sendMessage(
            chatId,

            "❌ محصول در Catalog پیدا نشد.\n\n" +
            `Product ID: ${productId}`
          );

          return {
            statusCode: 200,
            body: JSON.stringify({
              success: false,
              error:
                "product_not_found"
            })
          };
        }

        // -------------------------------------------------------
        // Build combinations directly from Catalog
        // -------------------------------------------------------

        const stockData =
          buildCombinations(
            product.variant1,
            product.options1,
            product.variant2,
            product.options2,
            product.variant3,
            product.options3
          );

        const combinations =
          stockData.combinations;

        const dimensions =
          stockData.dimensions;

        const state = {
          productId,
          dimensions,
          combinations,
          stocks:
            new Array(
              combinations.length
            ).fill(0),
          index: 0
        };

        const encodedState =
          encodeState(state);

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

        return {
          statusCode: 200,
          body: JSON.stringify({
            success: true,
            action:
              "stock_started",
            product_id:
              productId,
            combinations:
              combinations.length
          })
        };
      }

      // =======================================================
      // PREVIEW
      // =======================================================

      else if (
        action.startsWith(
          "preview:"
        )
      ) {
        const productId =
          action.split(":")[1];

        const product =
          await findProductInCatalog(
            productId
          );

        if (!product) {
          await sendMessage(
            chatId,

            "❌ محصول موردنظر پیدا نشد.\n\n" +
            `Product ID: ${productId}`
          );

          return {
            statusCode: 200,
            body: JSON.stringify({
              success: false,
              error:
                "product_not_found"
            })
          };
        }

        const copied =
          await copyMessage(
            chatId,
            DATABASE_CHANNEL_ID,
            product.messageId
          );

        if (!copied.ok) {
          console.error(
            "COPY DRAFT ERROR:",
            copied
          );

          await sendMessage(
            chatId,

            "❌ نتوانستم Draft محصول را بخوانم.\n\n" +
            `Product ID: ${productId}`
          );

          return {
            statusCode: 200,
            body: JSON.stringify({
              success: false,
              error:
                "draft_copy_failed"
            })
          };
        }

        await sendMessage(
          chatId,

          "👁️ پیش‌نمایش محصول\n\n" +

          `🆔 Product ID:\n${product.productId}\n\n` +

          `📦 نام محصول:\n${product.name}\n\n` +

          `📂 دسته‌بندی:\n${product.category || "-"}\n\n` +

          `💰 قیمت:\n${product.price || "-"}\n\n` +

          `📌 وضعیت:\n${product.status || "-"}\n\n` +

          "━━━━━━━━━━━━━━\n\n" +

          "Draft اصلی محصول نیز برای بررسی ارسال شد.",

          [
            [
              {
                text:
                  "📸 تصاویر",

                callback_data:
                  `upload_images:${productId}`
              },

              {
                text:
                  "📦 موجودی",

                callback_data:
                  `stock:${productId}`
              }
            ],

            [
              {
                text:
                  "✏️ ویرایش",

                callback_data:
                  `edit_draft:${productId}`
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

      // =======================================================
      // EDIT DRAFT
      // =======================================================

      else if (
        action.startsWith(
          "edit_draft:"
        )
      ) {
        const productId =
          action.split(":")[1];

        const product =
          await findProductInCatalog(
            productId
          );

        if (!product) {
          await sendMessage(
            chatId,

            "❌ محصول پیدا نشد.\n\n" +
            `Product ID: ${productId}`
          );

          return {
            statusCode: 200,
            body: JSON.stringify({
              success: false,
              error:
                "product_not_found"
            })
          };
        }

        await sendMessage(
          chatId,

          "✏️ ویرایش محصول\n\n" +

          `🆔 Product ID:\n${productId}\n\n` +

          "در این مرحله Draft اصلی محصول را برای شما ارسال می‌کنیم.\n\n" +

          "می‌توانید قالب را اصلاح کنید و دوباره با #PRODUCT ارسال کنید.\n\n" +

          "⚠️ توجه:\n" +

          "در این نسخه، ارسال مجدد قالب یک Draft جدید ایجاد می‌کند.\n\n" +

          "ویرایش مستقیم همان Message ID را در مرحله بعد اضافه می‌کنیم."
        );

        const copied =
          await copyMessage(
            chatId,
            DATABASE_CHANNEL_ID,
            product.messageId
          );

        if (!copied.ok) {
          await sendMessage(
            chatId,
            "❌ ارسال Draft اصلی ناموفق بود."
          );
        }
      }

      // =======================================================
      // CANCEL
      // =======================================================

      else if (
        action.startsWith(
          "cancel_draft:"
        )
      ) {
        const productId =
          action.split(":")[1];

        const product =
          await findProductInCatalog(
            productId
          );

        if (!product) {
          await sendMessage(
            chatId,

            "❌ محصول پیدا نشد.\n\n" +
            `Product ID: ${productId}`
          );

          return {
            statusCode: 200,
            body: JSON.stringify({
              success: false,
              error:
                "product_not_found"
            })
          };
        }

        await sendMessage(
          chatId,

          "⚠️ لغو محصول\n\n" +

          `🆔 Product ID:\n${productId}\n\n` +

          "آیا مطمئن هستید که می‌خواهید این محصول لغو شود؟",

          [
            [
              {
                text:
                  "❌ بله، لغو شود",

                callback_data:
                  `confirm_cancel:${productId}`
              }
            ],

            [
              {
                text:
                  "🔙 انصراف",

                callback_data:
                  `product:${productId}`
              }
            ]
          ]
        );
      }

      // =======================================================
      // CONFIRM CANCEL
      // =======================================================

      else if (
        action.startsWith(
          "confirm_cancel:"
        )
      ) {
        const productId =
          action.split(":")[1];

        const data =
          await getProductsFromCatalog();

        const products =
          data.products;

        const productIndex =
          products.findIndex(
            item =>
              item.productId ===
              productId
          );

        if (
          productIndex === -1
        ) {
          await sendMessage(
            chatId,
            "❌ محصول پیدا نشد."
          );

          return {
            statusCode: 200,
            body: JSON.stringify({
              success: false,
              error:
                "product_not_found"
            })
          };
        }

        products.splice(
          productIndex,
          1
        );

        const catalog =
          data.catalog;

        if (catalog) {
          const edited =
            await editMessage(
              DATABASE_CHANNEL_ID,
              catalog.message_id,
              buildCatalogText(
                products
              )
            );

          if (!edited.ok) {
            await sendMessage(
              chatId,

              "❌ حذف محصول از Catalog انجام نشد."
            );

            return {
              statusCode: 500,
              body: JSON.stringify({
                success: false,
                error:
                  "catalog_delete_failed"
              })
            };
          }
        }

        await sendMessage(
          chatId,

          "✅ محصول از فهرست مدیریت محصولات حذف شد.\n\n" +

          `🆔 Product ID:\n${productId}\n\n` +

          "⚠️ رکوردهای تاریخی محصول در کانال دیتابیس حذف نشده‌اند."
        );
      }

      // =======================================================
      // PLACEHOLDER SECTIONS
      // =======================================================

      else if (
        action ===
        "categories"
      ) {
        await sendMessage(
          chatId,

          "🏷️ دسته‌بندی‌ها\n\n" +
          "این بخش در مرحله بعد ساخته می‌شود."
        );
      }

      else if (
        action ===
        "featured"
      ) {
        await sendMessage(
          chatId,

          "⭐ محصولات ویژه\n\n" +
          "این بخش در مرحله بعد ساخته می‌شود."
        );
      }

      else if (
        action ===
        "discounts"
      ) {
        await sendMessage(
          chatId,

          "🔥 تخفیف‌ها\n\n" +
          "این بخش در مرحله بعد ساخته می‌شود."
        );
      }

      else if (
        action ===
        "settings"
      ) {
        await sendMessage(
          chatId,

          "⚙️ تنظیمات\n\n" +
          "این بخش در مرحله بعد ساخته می‌شود."
        );
      }

      else {
        await sendMessage(
          chatId,

          "⚠️ این عملیات شناخته نشد.\n\n" +
          "لطفاً دوباره از /start شروع کنید."
        );
      }

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true
        })
      };
    }

    // =========================================================
    // CHANNEL POST
    // =========================================================

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
