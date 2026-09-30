/** Shift Tool standalone GAS backend. Configure Script Properties before deployment. */
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    if (!data || !data.action) throw new Error("actionが必要です。");
    var viewActions = ["getShifts", "getShiftHolidays", "getShiftLeaveRequests", "saveShiftLeaveRequest", "cancelShiftLeaveRequest", "updateShiftLeaveRequestWorkTime", "getShiftSpecialDayRules", "getShiftCalendarPeriodSettings", "getShiftPeriodStatus", "getShiftPaidLeaveBalance", "saveShiftPaidLeaveBalance"];
    var adminActions = ["updateShiftLeaveRequestStatus", "deleteShiftLeaveRequest", "saveShiftCorrectionVisibility", "saveShiftSpecialDayRules", "saveShiftCalendarPeriodSettings", "saveShiftPeriodStatus", "saveShift", "saveShiftMonth", "deleteShift"];
    if (viewActions.indexOf(data.action) >= 0) requireShiftSession(data.sessionToken);
    if (adminActions.indexOf(data.action) >= 0) requireShiftSession(data.sessionToken, "admin");
    if (data.action === "previewTemplateReset") return previewTemplateReset(data);
    if (data.action === "runTemplateReset") return runTemplateReset(data);
    if (data.action === "clearTemplateShiftRemarks") return clearTemplateShiftRemarks(data);
    if (data.action === "loginShift") return loginShift(data);
    if (data.action === "loginShiftAdmin") return loginShiftAdmin(data);
    if (data.action === "loginShiftEmployee") return loginShiftEmployee(data);
    if (data.action === "getShiftLoginEmployees") return getShiftLoginEmployees(data);
    if (data.action === "getShiftEmployeeMaster") return getShiftEmployeeMaster(data);
    if (data.action === "saveShiftEmployeeMaster") return saveShiftEmployeeMaster(data);
    if (data.action === "getShiftRoleMaster") return getShiftRoleMaster(data);
    if (data.action === "saveShiftRoleMaster") return saveShiftRoleMaster(data);
    if (data.action === "getShiftHomeLayout") return getShiftHomeLayout(data);
    if (data.action === "saveShiftHomeLayout") return saveShiftHomeLayout(data);
    if (data.action === "getShiftAdminNotices") return getShiftAdminNotices(data);
    if (data.action === "saveShiftAdminNotice") return saveShiftAdminNotice(data);
    if (data.action === "deleteShiftAdminNotice") return deleteShiftAdminNotice(data);
    if (data.action === "getShiftAdminNoticeVisibility") return getShiftAdminNoticeVisibility(data);
    if (data.action === "saveShiftAdminNoticeVisibility") return saveShiftAdminNoticeVisibility(data);
    if (data.action === "getShiftWorkTimeMaster") return getShiftWorkTimeMaster(data);
    if (data.action === "saveShiftWorkTimeMaster") return saveShiftWorkTimeMaster(data);
    if (data.action === "getShiftCycleMaster") return getShiftCycleMaster(data);
    if (data.action === "saveShiftCycleMaster") return saveShiftCycleMaster(data);
    if (data.action === "getShiftPaidLeaveBalance") return getShiftPaidLeaveBalance(data);
    if (data.action === "saveShiftPaidLeaveBalance") return saveShiftPaidLeaveBalance(data);
    if (data.action === "getShiftAutoDraftSettings") return getShiftAutoDraftSettings(data);
    if (data.action === "saveShiftAutoDraftSettings") return saveShiftAutoDraftSettings(data);
    if (data.action === "getShiftStoreBoardVisibility") return getShiftStoreBoardVisibility(data);
    if (data.action === "saveShiftStoreBoardVisibility") return saveShiftStoreBoardVisibility(data);
    if (data.action === "getShiftCorrectionVisibility") return getShiftCorrectionVisibility(data);
    if (data.action === "saveShiftCorrectionVisibility") return saveShiftCorrectionVisibility(data);
    if (data.action === "getShifts") return getShifts(data);
    if (data.action === "getShiftHolidays") return getShiftHolidays(data);
    if (data.action === "getShiftLeaveRequests") return getShiftLeaveRequests(data);
    if (data.action === "saveShiftLeaveRequest") return saveShiftLeaveRequest(data);
    if (data.action === "cancelShiftLeaveRequest") return cancelShiftLeaveRequest(data);
    if (data.action === "updateShiftLeaveRequestWorkTime") return updateShiftLeaveRequestWorkTime(data);
    if (data.action === "updateShiftLeaveRequestStatus") return updateShiftLeaveRequestStatus(data);
    if (data.action === "deleteShiftLeaveRequest") return deleteShiftLeaveRequest(data);
    if (data.action === "getShiftSpecialDayRules") return getShiftSpecialDayRules(data);
    if (data.action === "saveShiftSpecialDayRules") return saveShiftSpecialDayRules(data);
    if (data.action === "getShiftCalendarPeriodSettings") return getShiftCalendarPeriodSettings(data);
    if (data.action === "saveShiftCalendarPeriodSettings") return saveShiftCalendarPeriodSettings(data);
    if (data.action === "getShiftPeriodStatus") return getShiftPeriodStatus(data);
    if (data.action === "saveShiftPeriodStatus") return saveShiftPeriodStatus(data);
    if (data.action === "saveShift") return saveShift(data);
    if (data.action === "saveShiftMonth") return saveShiftMonth(data);
    if (data.action === "deleteShift") return deleteShift(data);
    return createJsonResponse(false, "未対応のシフト操作です。");
  } catch (error) {
    return createJsonResponse(false, error.message || "処理に失敗しました。");
  }
}



/** 文字列を安全な長さに丸めます。想定外に巨大な入力でNotion APIがエラーになるのを防ぎます。 */
/** 文字列の長さを検証します。上限を超えた場合は、黙って切り詰めずエラーにします。 */
function sanitizeText(value, maxLength) {
  var text = value === null || value === undefined ? "" : String(value);
  var limit = maxLength || 2000;
  if (text.length > limit) {
    throw new Error("入力内容が長すぎます（" + limit + "文字以内にしてください）。");
  }
  return text;
}



/** "YYYY-MM-DD"形式かつ実在する日付だけを許可します。形式違反・存在しない日付はエラーにします。 */
function sanitizeDateValue(value) {
  if (!value) return null;
  var text = String(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    throw new Error("日付の形式が正しくありません（YYYY-MM-DD）。");
  }
  var parts = text.split("-").map(Number);
  var dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
  if (dateObj.getFullYear() !== parts[0] || dateObj.getMonth() !== parts[1] - 1 || dateObj.getDate() !== parts[2]) {
    throw new Error("実在しない日付です。");
  }
  return text;
}



function createTitleProperty(text) {
  var safeText = sanitizeText(text, 500);
  return {
    title: safeText
      ? [{ text: { content: safeText } }]
      : []
  };
}



function createRichTextProperty(text) {
  var safeText = sanitizeText(text, 2000);
  return {
    rich_text: safeText
      ? [{ text: { content: safeText } }]
      : []
  };
}



function createJsonResponse(success, message) {
  return ContentService
    .createTextOutput(JSON.stringify({
      success: success,
      message: message
    }))
    .setMimeType(ContentService.MimeType.JSON);
}



/** 日曜日・国民の祝日・年末年始（12/31〜1/3）かどうかを判定します。 */
function isDefaultClosedDate(dateObj) {
  var dayOfWeek = dateObj.getDay();
  if (dayOfWeek === 0) return true;

  var month = dateObj.getMonth() + 1;
  var day = dateObj.getDate();
  if ((month === 12 && day === 31) || (month === 1 && day <= 3)) return true;

  var dateStr = Utilities.formatDate(dateObj, Session.getScriptTimeZone() || "Asia/Tokyo", "yyyy-MM-dd");
  return isJapaneseHoliday(dateStr);
}



/** Googleの「日本の祝日」カレンダーを使って、指定日が祝日かどうかを判定します。 */
function isJapaneseHoliday(dateStr) {
  try {
    var calendar = CalendarApp.getCalendarById("ja.japanese#holiday@group.v.calendar.google.com");
    var parts = dateStr.split("-").map(Number);
    var start = new Date(parts[0], parts[1] - 1, parts[2]);
    var end = new Date(parts[0], parts[1] - 1, parts[2] + 1);
    var events = calendar.getEvents(start, end);
    return events.length > 0;
  } catch (error) {
    console.error(error);
    return false;
  }
}



function statusPageToObject(page) {
  var obj = flattenStatusProperties(page.properties || {});
  obj.id = page.id || "";
  obj.url = page.url || "";
  return obj;
}



function flattenStatusProperties(properties) {
  var result = {};
  Object.keys(properties || {}).forEach(function(name) {
    result[name] = statusPlainValue(properties[name]);
  });
  return result;
}



function statusPlainValue(prop) {
  if (!prop) return null;
  switch (prop.type) {
    case "title": return statusJoinText(prop.title);
    case "rich_text": return statusJoinText(prop.rich_text);
    case "number": return prop.number;
    case "select": return prop.select ? prop.select.name : "";
    case "multi_select": return (prop.multi_select || []).map(function(x){ return x.name; });
    case "date": return prop.date ? { start: prop.date.start || "", end: prop.date.end || "" } : null;
    case "checkbox": return Boolean(prop.checkbox);
    case "url": return prop.url || "";
    case "email": return prop.email || "";
    case "phone_number": return prop.phone_number || "";
    case "status": return prop.status ? prop.status.name : "";
    case "created_time": return prop.created_time || "";
    case "last_edited_time": return prop.last_edited_time || "";
    default: return null;
  }
}



function statusJoinText(items) {
  return (items || []).map(function(x) { return x.plain_text || ""; }).join("");
}



/**
 * Notionデータベースを検索します。Notion APIは1回のリクエストで最大100件までしか
 * 返さない仕様があるため、たくさんの件数が必要な呼び出し（page_size未指定、または
 * 100以上を指定した場合）では、has_more/next_cursorを使って自動的に複数回に
 * 分けて全件取得します。少量だけ欲しい場合（page_sizeに100未満を明示指定した場合）は、
 * 従来通り1回のリクエストだけで終わります。
 */
function queryNotionDatabase(apiKey, databaseId, body) {
  var perfNotionStart = Date.now();
  var perfPageCount = 0;
  var requestBody = {};
  for (var k in body) { requestBody[k] = body[k]; }

  var wantsAll = requestBody.page_size === undefined || requestBody.page_size >= 100;
  if (requestBody.page_size !== undefined && requestBody.page_size > 100) {
    requestBody.page_size = 100;
  }

  var allResults = [];
  var hasMore = true;

  while (hasMore) {
    perfPageCount += 1;
    var response = UrlFetchApp.fetch(
      "https://api.notion.com/v1/databases/" + databaseId + "/query",
      {
        method: "post",
        contentType: "application/json",
        headers: {
          Authorization: "Bearer " + apiKey,
          "Notion-Version": "2022-06-28"
        },
        payload: JSON.stringify(requestBody),
        muteHttpExceptions: true
      }
    );

    var responseCode = response.getResponseCode();
    var responseBody = response.getContentText();

    if (responseCode !== 200) {
      var message = responseBody;
      try {
        var errorJson = JSON.parse(responseBody);
        message = errorJson.message || responseBody;
      } catch (_) {}
      throw new Error("Notion API Error: " + message);
    }

    var parsed = JSON.parse(responseBody);
    allResults = allResults.concat(parsed.results || []);

    hasMore = wantsAll && !!parsed.has_more;
    if (hasMore) {
      requestBody.start_cursor = parsed.next_cursor;
    }
  }

  console.log(
    "[PERF] stage=notion_query_complete" +
    " pages=" + perfPageCount +
    " rows=" + allResults.length +
    " ms=" + (Date.now() - perfNotionStart)
  );

  return allResults;
}



function createJsonDataResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}



function createNotionPage(apiKey, databaseId, properties) {
  return requestNotion(apiKey, "https://api.notion.com/v1/pages", "post", {
    parent: { database_id: databaseId },
    properties: properties
  });
}



/** Notion IDのハイフン有無・大文字小文字の違いを吸収して比較できる形に正規化します。 */
function normalizeNotionId(id) {
  return String(id || "").replace(/-/g, "").toLowerCase();
}



/** 指定したページIDが、実際に想定するデータベースに属しているかを確認します。属していなければ処理を中断します。 */
function assertPageBelongsToDatabase(apiKey, pageId, expectedDatabaseId) {
  if (!pageId) {
    throw new Error("IDが指定されていません。");
  }
  if (!expectedDatabaseId) {
    throw new Error("対象データベースの設定が未完了です。");
  }
  var page = requestNotion(apiKey, "https://api.notion.com/v1/pages/" + pageId, "get", null);
  var actualDatabaseId = page.parent && page.parent.database_id ? page.parent.database_id : null;
  if (!actualDatabaseId || normalizeNotionId(actualDatabaseId) !== normalizeNotionId(expectedDatabaseId)) {
    throw new Error("指定されたIDが対象のデータベースに属していないため、処理を中断しました。");
  }
  return page;
}



function updateNotionPage(apiKey, pageId, properties) {
  return requestNotion(apiKey, "https://api.notion.com/v1/pages/" + pageId, "patch", {
    properties: properties
  });
}



function requestNotion(apiKey, url, method, body) {
  var options = {
    method: method,
    contentType: "application/json",
    headers: {
      Authorization: "Bearer " + apiKey,
      "Notion-Version": "2022-06-28"
    },
    muteHttpExceptions: true
  };
  if (body !== null && body !== undefined) {
    options.payload = JSON.stringify(body);
  }
  var response = UrlFetchApp.fetch(url, options);
  var responseCode = response.getResponseCode();
  if (responseCode < 200 || responseCode >= 300) {
    var responseBody = response.getContentText();
    var message = responseBody;
    try {
      message = JSON.parse(responseBody).message || responseBody;
    } catch (_) {}
    throw new Error("Notion API Error: " + message);
  }
  return JSON.parse(response.getContentText());
}



/* ============================================================
 * 【追加機能】カレンダー予定・一包化サポート機能
 * ============================================================ */

/** 現在の店舗IDを返します。多店舗化までは固定のスクリプトプロパティを使います。 */
function getStoreId() {
  return PropertiesService.getScriptProperties().getProperty("STORE_ID") || "STORE-NEW";
}



/* ------------------------------------------------------------
 * シフト管理ツール：休み希望の掲示板公開設定
 * 店舗設定DB（NOTION_STORE_DATABASE_ID）を正本とし、店舗ID行に
 * 「休み希望公開設定」プロパティを保存・取得します。端末のlocalStorage
 * には依存せず、全端末が同じ設定を取得できるようにします。
 * ------------------------------------------------------------ */
var SHIFT_BOARD_VISIBILITY_VALUES = ["immediate", "after_approval", "private"];


var SHIFT_BOARD_VISIBILITY_LABELS = {
  immediate: "提出と同時に全員へ公開",
  after_approval: "管理者確認後に全員へ公開",
  private: "本人と編集者だけに表示"
};



function shiftBoardVisibilityLabelToValue(label) {
  var found = Object.keys(SHIFT_BOARD_VISIBILITY_LABELS).filter(function(key) {
    return SHIFT_BOARD_VISIBILITY_LABELS[key] === label;
  });
  return found.length ? found[0] : "immediate";
}



/** 休み希望の掲示板公開設定を店舗設定DBから取得します。DB未設定時は安全側でimmediateを返します。 */
function getShiftStoreBoardVisibility(data) {
  try {
    var p = PropertiesService.getScriptProperties();
    var apiKey = p.getProperty("NOTION_API_KEY");
    var storeDbId = p.getProperty("NOTION_STORE_DATABASE_ID");
    var fallback = p.getProperty("SHIFT_BOARD_VISIBILITY_FALLBACK_" + getStoreId()) || "immediate";
    if (!apiKey || !storeDbId) {
      return createJsonDataResponse({ success: true, visibility: fallback });
    }
    var rows = queryNotionDatabase(apiKey, storeDbId, {
      filter: { property: "店舗ID", rich_text: { equals: getStoreId() } },
      page_size: 1
    });
    if (!rows.length) return createJsonDataResponse({ success: true, visibility: fallback });
    var obj = statusPageToObject(rows[0]);
    var label = obj["休み希望公開設定"] || "";
    var visibility = label ? shiftBoardVisibilityLabelToValue(label) : fallback;
    return createJsonDataResponse({ success: true, visibility: visibility });
  } catch (error) {
    console.error("getShiftStoreBoardVisibility failed: " + error);
    return createJsonDataResponse({ success: true, visibility: "immediate" });
  }
}



/** 休み希望の掲示板公開設定を店舗設定DBへ保存します。編集者用のSHIFT_API_KEYを必須とします。 */
function saveShiftStoreBoardVisibility(data) {
  var lock = LockService.getScriptLock();
  try {
    if (!lock.tryLock(10000)) throw new Error("別の保存処理を実行中です。");
    verifyShiftApiKey(data.shiftApiKey);
    var visibility = sanitizeText(data.visibility, 30);
    if (SHIFT_BOARD_VISIBILITY_VALUES.indexOf(visibility) === -1) throw new Error("公開設定の値が正しくありません。");
    var label = SHIFT_BOARD_VISIBILITY_LABELS[visibility];

    var p = PropertiesService.getScriptProperties();
    p.setProperty("SHIFT_BOARD_VISIBILITY_FALLBACK_" + getStoreId(), visibility);

    var apiKey = p.getProperty("NOTION_API_KEY");
    var storeDbId = p.getProperty("NOTION_STORE_DATABASE_ID");
    if (!apiKey || !storeDbId) {
      return createJsonDataResponse({ success: true, visibility: visibility });
    }

    var databaseUrl = "https://api.notion.com/v1/databases/" + storeDbId;
    var database = requestNotion(apiKey, databaseUrl, "get", null);
    if (!database.properties || !database.properties["休み希望公開設定"]) {
      requestNotion(apiKey, databaseUrl, "patch", {
        properties: { "休み希望公開設定": { select: { options: Object.keys(SHIFT_BOARD_VISIBILITY_LABELS).map(function(key) { return { name: SHIFT_BOARD_VISIBILITY_LABELS[key] }; }) } } }
      });
    }

    var rows = queryNotionDatabase(apiKey, storeDbId, {
      filter: { property: "店舗ID", rich_text: { equals: getStoreId() } },
      page_size: 1
    });
    if (rows.length) {
      updateNotionPage(apiKey, rows[0].id, { "休み希望公開設定": { select: { name: label } } });
    } else {
      createNotionPage(apiKey, storeDbId, {
        "店舗名": createTitleProperty("薬局名を設定"),
        "店舗ID": createRichTextProperty(getStoreId()),
        "休み希望公開設定": { select: { name: label } }
      });
    }
    appendShiftAudit(data, "休み希望掲示板公開設定変更", getStoreId(), null, { visibility: visibility });
    return createJsonDataResponse({ success: true, visibility: visibility });
  } catch (error) {
    console.error("saveShiftStoreBoardVisibility failed: " + error);
    return createJsonResponse(false, error.message || "公開設定を保存できませんでした。");
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}



/* ============================================================
 * シフト管理ツール連携
 * ============================================================ */

/** シフト管理ツールからのリクエストを検証します（Googleログインの代わりに合言葉で確認）。 */
function verifyShiftApiKey(providedKey) {
  var expected = PropertiesService.getScriptProperties().getProperty("SHIFT_API_KEY");
  if (!expected || !providedKey || providedKey !== expected) {
    throw new Error("シフト管理ツールの認証に失敗しました。");
  }
}



function getShiftManagementSettings() {
  var p = PropertiesService.getScriptProperties();
  var apiKey = p.getProperty("NOTION_API_KEY");
  var databaseId = p.getProperty("NOTION_SHIFT_DATABASE_ID");
  if (!apiKey || !databaseId) throw new Error("シフト管理DBの設定が未完了です。");
  return { apiKey: apiKey, databaseId: databaseId };
}



/** シフト管理DBの全レコードを返します。 */
function getShifts(data) {
  try {
    // doPostでログインセッションを確認済み。保存・削除系では接続キーも必須にする。
    var settings = getShiftManagementSettings();
    var pages = queryNotionDatabase(settings.apiKey, settings.databaseId, { page_size: 100 });
    var shifts = pages.map(function(page) {
      var obj = flattenStatusProperties(page.properties || {});
      obj.id = page.id;
      return obj;
    });
    return createJsonDataResponse({ success: true, shifts: shifts });
  } catch (error) {
    console.error(error);
    return createJsonResponse(false, error.message || "シフトの取得エラーが発生しました。");
  }
}



/** 期間別の確定状態。閲覧端末も取得でき、変更だけ管理者キーを必須にします。 */
function getShiftPeriodStatus(data) {
  try {
    var periodStart = sanitizeDateValue(data.periodStart);
    if (!periodStart) throw new Error("対象期間が正しくありません。");
    var raw = PropertiesService.getScriptProperties().getProperty("SHIFT_PERIOD_STATUSES_JSON") || "{}";
    var statuses = JSON.parse(raw);
    // 新しい店舗では全期間を未確定で開始します。
    var locked = Object.prototype.hasOwnProperty.call(statuses, periodStart)
      ? Boolean(statuses[periodStart].locked)
      : false;
    return createJsonDataResponse({ success: true, periodStart: periodStart, locked: locked });
  } catch (error) {
    return createJsonResponse(false, error.message || "確定状態を取得できませんでした。");
  }
}



function saveShiftPeriodStatus(data) {
  try {
    verifyShiftApiKey(data.shiftApiKey);
    var periodStart = sanitizeDateValue(data.periodStart);
    var periodEnd = sanitizeDateValue(data.periodEnd);
    if (!periodStart || !periodEnd || periodStart > periodEnd) throw new Error("対象期間が正しくありません。");
    var p = PropertiesService.getScriptProperties();
    var statuses = JSON.parse(p.getProperty("SHIFT_PERIOD_STATUSES_JSON") || "{}");
    var before = statuses[periodStart] || null;
    statuses[periodStart] = { locked: Boolean(data.locked), periodEnd: periodEnd, updatedAt: new Date().toISOString() };
    p.setProperty("SHIFT_PERIOD_STATUSES_JSON", JSON.stringify(statuses));
    reconcileShiftPaidLeaveForPeriod(periodStart, periodEnd, Boolean(data.locked));
    appendShiftAudit(data, data.locked ? "シフト確定" : "シフト確定解除", periodStart + "〜" + periodEnd, before, statuses[periodStart]);
    return createJsonDataResponse({ success: true, periodStart: periodStart, locked: Boolean(data.locked) });
  } catch (error) {
    return createJsonResponse(false, error.message || "確定状態を保存できませんでした。");
  }
}



function reconcileShiftPaidLeaveForPeriod(periodStart, periodEnd, locked) {
  var p = PropertiesService.getScriptProperties();
  var balances = {};
  var ledger = {};
  try { balances = JSON.parse(p.getProperty("SHIFT_PAID_LEAVE_BALANCES_JSON") || "{}"); } catch (_) { balances = {}; }
  try { ledger = JSON.parse(p.getProperty("SHIFT_PAID_LEAVE_LEDGER_JSON") || "{}"); } catch (_) { ledger = {}; }
  var periodKey = periodStart + "|" + periodEnd;
  var previous = ledger[periodKey] || {};
  if (!locked) {
    Object.keys(previous).forEach(function(employeeId) { if (balances[employeeId]) balances[employeeId].remainingDays = Math.max(0, Number(balances[employeeId].remainingDays || 0) + Number(previous[employeeId] || 0)); });
    delete ledger[periodKey];
  } else if (!ledger[periodKey]) {
    var settings = getShiftManagementSettings();
    var pages = queryNotionDatabase(settings.apiKey, settings.databaseId, { filter: { and: [{ property: "日付", date: { on_or_after: periodStart } }, { property: "日付", date: { on_or_before: periodEnd } }] }, page_size: 100 });
    var deductions = {};
    pages.forEach(function(page) { var flat = flattenStatusProperties(page.properties || {}); if (String(flat["シフト内容"] || "") !== "有休") return; var employeeId = String(flat["従業員ID"] || ""); if (employeeId && balances[employeeId] && balances[employeeId].enabled) deductions[employeeId] = Number(deductions[employeeId] || 0) + 1; });
    Object.keys(deductions).forEach(function(employeeId) { balances[employeeId].remainingDays = Math.max(0, Number(balances[employeeId].remainingDays || 0) - deductions[employeeId]); balances[employeeId].updatedAt = new Date().toISOString(); });
    ledger[periodKey] = deductions;
  }
  p.setProperty("SHIFT_PAID_LEAVE_BALANCES_JSON", JSON.stringify(balances));
  p.setProperty("SHIFT_PAID_LEAVE_LEDGER_JSON", JSON.stringify(ledger));
}



/* ------------------------------------------------------------
 * シフト管理ツール認証（編集者用ID/パスワード、一般用共通ID/パスワード）
 * 初回のみScript Propertiesへ SHIFT_ADMIN_LOGIN_ID と
 * SHIFT_ADMIN_SETUP_PASSWORD を登録し、configureShiftAdmin()を実行します。
 * ------------------------------------------------------------ */
function shiftAuthHash(value, salt) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(salt) + ":" + String(value), Utilities.Charset.UTF_8);
  return bytes.map(function(b) { var n = b < 0 ? b + 256 : b; return ("0" + n.toString(16)).slice(-2); }).join("");
}



function configureShiftAdmin() {
  var p = PropertiesService.getScriptProperties();
  var loginId = p.getProperty("SHIFT_ADMIN_LOGIN_ID");
  var password = p.getProperty("SHIFT_ADMIN_SETUP_PASSWORD");
  if (!loginId || !password) throw new Error("SHIFT_ADMIN_LOGIN_ID と SHIFT_ADMIN_SETUP_PASSWORD を設定してください。");
  var salt = Utilities.getUuid();
  p.setProperties({ SHIFT_ADMIN_SALT: salt, SHIFT_ADMIN_PASSWORD_HASH: shiftAuthHash(password, salt) });
  p.deleteProperty("SHIFT_ADMIN_SETUP_PASSWORD");
  return "管理者ログインを設定しました。平文パスワードは削除済みです。";
}



function shiftSessionPropertyKey(token) {
  return "SHIFT_SESSION_" + shiftAuthHash(token, "session").slice(0, 40);
}



function createShiftSession(role, employeeName, employeeId) {
  // 全セッションを1個のJSONへ追記する方式は、同時ログイン時の競合と
  // Script Propertiesの1値サイズ上限に弱いため、1セッション=1プロパティで保存します。
  var p = PropertiesService.getScriptProperties();
  var token = Utilities.getUuid() + Utilities.getUuid();
  var expiresAtMs = Date.now() + 30 * 24 * 60 * 60 * 1000;
  var session = { role: role, employeeName: employeeName || "", employeeId: employeeId || "", expiresAtMs: expiresAtMs };
  p.setProperty(shiftSessionPropertyKey(token), JSON.stringify(session));
  return { token: token, role: role, employeeName: employeeName || undefined, employeeId: employeeId || undefined, expiresAt: new Date(expiresAtMs).toISOString() };
}



function requireShiftSession(token, role) {
  var safeToken = sanitizeText(token, 200);
  if (!safeToken) throw new Error("ログインの有効期限が切れました。もう一度ログインしてください。");
  var p = PropertiesService.getScriptProperties();
  var key = shiftSessionPropertyKey(safeToken);
  var raw = p.getProperty(key);
  var session = null;
  try { session = raw ? JSON.parse(raw) : null; } catch (_) { session = null; }
  var roleAllowed = !role || session && (session.role === role || (role === "employee" && session.role === "admin"));
  if (!session || !roleAllowed || Number(session.expiresAtMs) <= Date.now()) {
    if (raw) p.deleteProperty(key);
    throw new Error("ログインの有効期限が切れました。もう一度ログインしてください。");
  }
  return session;
}



function appendShiftAudit(data, action, target, beforeValue, afterValue) {
  try {
    var session = requireShiftSession(data.sessionToken);
    var p = PropertiesService.getScriptProperties();
    var items = [];
    try { items = JSON.parse(p.getProperty("SHIFT_AUDIT_LOG_JSON") || "[]"); } catch (_) { items = []; }
    items.push({ id: Utilities.getUuid(), at: new Date().toISOString(), operatorId: session.employeeId || "", operatorName: session.employeeName || "", role: session.role, action: action, target: sanitizeText(target, 200), before: beforeValue || null, after: afterValue || null });
    if (items.length > 500) items = items.slice(items.length - 500);
    p.setProperty("SHIFT_AUDIT_LOG_JSON", JSON.stringify(items));
  } catch (error) { console.error("監査ログ保存失敗: " + error); }
}



function readShiftEmployeeMaster() {
  var raw = PropertiesService.getScriptProperties().getProperty("SHIFT_EMPLOYEE_MASTER_JSON");
  try { return raw ? JSON.parse(raw) : []; } catch (_) { return []; }
}



function getShiftLoginEmployees() {
  try {
    var employees = normalizeShiftEmployeeMaster(readShiftEmployeeMaster()).filter(function(item) { var label = item.displayName || item.name || ""; return item.active && !/^従業員[Ａ-ＺA-Zａ-ｚa-z０-９0-9]+$/.test(label); }).map(function(item) { return { id: item.id, name: item.name, displayName: item.displayName, active: item.active }; });
    return createJsonDataResponse({ success: true, employees: employees });
  } catch (error) { return createJsonResponse(false, "操作員一覧を取得できませんでした。"); }
}



function normalizeShiftEmployeeMaster(items) {
  var roles = readShiftRoleMaster();
  return (Array.isArray(items) ? items : []).slice(0, 50).map(function(item, index) {
    var selected = roles.filter(function(role) { return role.id === item.roleId || role.name === item.role; })[0];
    return {
      id: sanitizeText(item.id, 100).trim() || Utilities.getUuid(),
      name: sanitizeText(item.name, 100).trim(),
      displayName: sanitizeText(item.displayName, 100).trim() || sanitizeText(item.name, 100).trim(),
      displayOrder: index + 1,
      active: item.active !== false,
      aliases: (Array.isArray(item.aliases) ? item.aliases : []).slice(0, 20).map(function(name) { return sanitizeText(name, 100).trim(); }).filter(Boolean)
      ,roleId: selected ? selected.id : "", role: selected ? selected.name : ""
    };
  }).filter(function(item) { return item.name || !item.active; });
}

function readShiftRoleMaster() {
  var raw = PropertiesService.getScriptProperties().getProperty("SHIFT_ROLE_MASTER_JSON");
  try { if (raw) return JSON.parse(raw); } catch (_) {}
  return [{ id: "pharmacist", name: "薬剤師" }, { id: "clerk", name: "事務員" }, { id: "seller", name: "登録販売者" }];
}

function getShiftRoleMaster(data) {
  try { requireShiftSession(data.sessionToken); return createJsonDataResponse({ success: true, roles: readShiftRoleMaster() }); }
  catch (error) { return createJsonResponse(false, error.message || "役職を取得できませんでした。"); }
}

function saveShiftRoleMaster(data) {
  try {
    requireShiftSession(data.sessionToken, "admin");
    verifyShiftApiKey(data.shiftApiKey);
    var source = Array.isArray(data.roles) ? data.roles : [];
    if (!source.length) throw new Error("役職を1件以上登録してください。");
    var ids = {}, names = {};
    var roles = source.map(function(role) {
      var id = sanitizeText(role.id, 80).trim(), name = sanitizeText(role.name, 50).trim();
      if (!id || !name || ids[id] || names[name]) throw new Error("役職名とIDは重複せず入力してください。");
      ids[id] = true; names[name] = true;
      return { id: id, name: name };
    });
    var p = PropertiesService.getScriptProperties();
    var before = readShiftRoleMaster();
    p.setProperty("SHIFT_ROLE_MASTER_JSON", JSON.stringify(roles));
    var employees = normalizeShiftEmployeeMaster(readShiftEmployeeMaster()).map(function(item) {
      var current = roles.filter(function(role) { return role.id === item.roleId; })[0];
      item.role = current ? current.name : "";
      return item;
    });
    p.setProperty("SHIFT_EMPLOYEE_MASTER_JSON", JSON.stringify(employees));
    appendShiftAudit(data, "役職マスタ保存", "SHIFT_ROLE_MASTER", before, roles);
    return createJsonDataResponse({ success: true, roles: roles, employees: employees });
  } catch (error) { return createJsonResponse(false, error.message || "役職を保存できませんでした。"); }
}

function getShiftHomeLayout(data) {
  try {
    requireShiftSession(data.sessionToken);
    var raw = PropertiesService.getScriptProperties().getProperty("SHIFT_HOME_LAYOUT_JSON");
    return createJsonDataResponse({ success: true, layout: raw ? JSON.parse(raw) : { visible: true, columns: [["pharmacist"], ["clerk", "seller"]] } });
  } catch (error) { return createJsonResponse(false, error.message || "ホーム表示設定を取得できませんでした。"); }
}

function saveShiftHomeLayout(data) {
  try {
    requireShiftSession(data.sessionToken, "admin"); verifyShiftApiKey(data.shiftApiKey);
    var source = data.layout || {}, roles = readShiftRoleMaster(), ids = {};
    roles.forEach(function(role) { ids[role.id] = true; });
    var columns = (Array.isArray(source.columns) ? source.columns : []).slice(0, 2).map(function(column) {
      return (Array.isArray(column) ? column : []).map(function(id) { return sanitizeText(id, 80); }).filter(function(id) { return ids[id]; });
    });
    while (columns.length < 2) columns.push([]);
    var layout = { visible: source.visible !== false, columns: columns };
    PropertiesService.getScriptProperties().setProperty("SHIFT_HOME_LAYOUT_JSON", JSON.stringify(layout));
    appendShiftAudit(data, "ホーム出勤一覧設定", "SHIFT_HOME_LAYOUT", null, layout);
    return createJsonDataResponse({ success: true, layout: layout });
  } catch (error) { return createJsonResponse(false, error.message || "ホーム表示設定を保存できませんでした。"); }
}

function readShiftAdminNotices() {
  var p = PropertiesService.getScriptProperties();
  var ids = JSON.parse(p.getProperty("SHIFT_ADMIN_NOTICE_IDS") || "[]");
  return ids.map(function(id) {
    try { return JSON.parse(p.getProperty("SHIFT_ADMIN_NOTICE_" + id) || "null"); } catch (_) { return null; }
  }).filter(function(item) { return !!item; });
}
function getShiftAdminNotices(data) {
  try {
    var session = requireShiftSession(data.sessionToken);
    var notices = readShiftAdminNotices().filter(function(item) {
      return session.role === "admin" || item.visibility === "all" ||
        (session.employeeId && item.employeeIds.indexOf(session.employeeId) !== -1);
    });
    return createJsonDataResponse({ success: true, notices: notices });
  } catch (error) { return createJsonResponse(false, error.message || "お知らせを取得できませんでした。"); }
}
function getShiftAdminNoticeVisibility(data) {
  try {
    requireShiftSession(data.sessionToken);
    return createJsonDataResponse({ success: true, visibility: PropertiesService.getScriptProperties().getProperty("SHIFT_ADMIN_NOTICE_VISIBILITY") || "all" });
  } catch (error) { return createJsonResponse(false, error.message || "公開設定を取得できませんでした。"); }
}
function saveShiftAdminNoticeVisibility(data) {
  try {
    requireShiftSession(data.sessionToken, "admin"); verifyShiftApiKey(data.shiftApiKey);
    if (data.visibility !== "all" && data.visibility !== "selected") throw new Error("公開範囲を選んでください。");
    PropertiesService.getScriptProperties().setProperty("SHIFT_ADMIN_NOTICE_VISIBILITY", data.visibility);
    return createJsonDataResponse({ success: true, visibility: data.visibility });
  } catch (error) { return createJsonResponse(false, error.message || "公開設定を保存できませんでした。"); }
}
function saveShiftAdminNotice(data) {
  try {
    requireShiftSession(data.sessionToken, "admin"); verifyShiftApiKey(data.shiftApiKey);
    var text = sanitizeText(data.text, 1200).trim();
    if (!text) throw new Error("お知らせ本文を入力してください。");
    var visibility = data.visibility === "selected" ? "selected" : "all";
    var allowed = {};
    readShiftEmployeeMaster().forEach(function(item) { if (item.active) allowed[item.id] = true; });
    var ids = (Array.isArray(data.employeeIds) ? data.employeeIds : []).map(function(id) { return sanitizeText(id, 100); }).filter(function(id) { return allowed[id]; });
    if (visibility === "selected" && !ids.length) throw new Error("対象の従業員を選んでください。");
    var lock = LockService.getScriptLock(); lock.waitLock(10000);
    try {
      var p = PropertiesService.getScriptProperties();
      var index = JSON.parse(p.getProperty("SHIFT_ADMIN_NOTICE_IDS") || "[]");
      if (index.length >= 100) throw new Error("お知らせは100件までです。不要なものを削除してください。");
      var id = Utilities.getUuid();
      var item = { id: id, text: text, visibility: visibility, employeeIds: visibility === "all" ? [] : ids, createdAt: new Date().toISOString() };
      p.setProperty("SHIFT_ADMIN_NOTICE_" + id, JSON.stringify(item));
      p.setProperty("SHIFT_ADMIN_NOTICE_IDS", JSON.stringify([id].concat(index)));
      return createJsonDataResponse({ success: true, notice: item });
    } finally { lock.releaseLock(); }
  } catch (error) { return createJsonResponse(false, error.message || "お知らせを保存できませんでした。"); }
}
function deleteShiftAdminNotice(data) {
  try {
    requireShiftSession(data.sessionToken, "admin"); verifyShiftApiKey(data.shiftApiKey);
    var id = sanitizeText(data.id, 100);
    var lock = LockService.getScriptLock(); lock.waitLock(10000);
    try {
      var p = PropertiesService.getScriptProperties();
      var index = JSON.parse(p.getProperty("SHIFT_ADMIN_NOTICE_IDS") || "[]");
      if (index.indexOf(id) === -1) throw new Error("対象のお知らせがありません。");
      p.setProperty("SHIFT_ADMIN_NOTICE_IDS", JSON.stringify(index.filter(function(item) { return item !== id; })));
      p.deleteProperty("SHIFT_ADMIN_NOTICE_" + id);
      return createJsonDataResponse({ success: true });
    } finally { lock.releaseLock(); }
  } catch (error) { return createJsonResponse(false, error.message || "お知らせを削除できませんでした。"); }
}



function getShiftEmployeeMaster(data) {
  try {
    requireShiftSession(data.sessionToken);
    // Reading must never register names from a browser cache in a new store.
    var master = normalizeShiftEmployeeMaster(readShiftEmployeeMaster());
    return createJsonDataResponse({ success: true, employees: master });
  } catch (error) { return createJsonResponse(false, error.message || "従業員マスターを取得できませんでした。"); }
}



function saveShiftEmployeeMaster(data) {
  try {
    requireShiftSession(data.sessionToken, "admin");
    var master = normalizeShiftEmployeeMaster(data.employees);
    var displayNames = {};
    master.filter(function(item) { return item.active; }).forEach(function(item) {
      if (!item.name || !item.displayName) throw new Error("氏名と表示名を入力してください。");
      if (displayNames[item.displayName]) throw new Error("同じ表示名は登録できません。");
      displayNames[item.displayName] = true;
    });
    var before = readShiftEmployeeMaster();
    PropertiesService.getScriptProperties().setProperty("SHIFT_EMPLOYEE_MASTER_JSON", JSON.stringify(master));
    appendShiftAudit(data, "従業員マスター保存", "SHIFT_EMPLOYEE_MASTER", before, master);
    return createJsonDataResponse({ success: true, employees: master });
  } catch (error) { return createJsonResponse(false, error.message || "従業員マスターを保存できませんでした。"); }
}



function getShiftCycleMaster(data) {
  try {
    requireShiftSession(data.sessionToken);
    var raw = PropertiesService.getScriptProperties().getProperty("SHIFT_CYCLE_MASTER_JSON");
    var master = null;
    try { master = raw ? JSON.parse(raw) : null; } catch (_) { master = null; }
    return createJsonDataResponse({ success: true, master: master });
  } catch (error) { return createJsonResponse(false, error.message || "クールマスターを取得できませんでした。"); }
}



function saveShiftCycleMaster(data) {
  try {
    requireShiftSession(data.sessionToken, "admin");
    var master = data.master;
    if (!master || typeof master !== "object") throw new Error("クールマスターが正しくありません。");
    var names = master.names || {};
    var lengths = master.lengths || {};
    var patterns = master.patterns || {};
    var ids = Object.keys(names).slice(0, 30);
    if (!ids.length) throw new Error("クールは最低1件必要です。");
    var safe = { names: {}, lengths: {}, patterns: {}, assignments: {} };
    ids.forEach(function(id) {
      var length = Math.max(1, Math.min(4, Number(lengths[id]) || 1));
      safe.names[id] = sanitizeText(names[id], 100).trim() || ("クール" + id);
      safe.lengths[id] = length;
      var pattern = Array.isArray(patterns[id]) ? patterns[id].slice(0, 7) : [];
      safe.patterns[id] = pattern.map(function(day) {
        return {
          week1: sanitizeText(day.week1, 100), week2: sanitizeText(day.week2, 100),
          week3: sanitizeText(day.week3, 100), week4: sanitizeText(day.week4, 100)
        };
      });
      while (safe.patterns[id].length < 7) safe.patterns[id].push({ week1: "休み", week2: "休み", week3: "休み", week4: "休み" });
    });
    var validIds = {};
    ids.forEach(function(id) { validIds[String(id)] = true; });
    var assignments = master.assignments && typeof master.assignments === "object" ? master.assignments : {};
    Object.keys(assignments).slice(0, 100).forEach(function(employeeId) {
      var assignment = assignments[employeeId] || {};
      var cycleType = String(Number(assignment.cycleType));
      var anchorDate = sanitizeDateValue(assignment.anchorDate);
      if (validIds[cycleType] && anchorDate) safe.assignments[sanitizeText(employeeId, 100)] = { cycleType: Number(cycleType), anchorDate: anchorDate };
    });
    var beforeRaw = PropertiesService.getScriptProperties().getProperty("SHIFT_CYCLE_MASTER_JSON") || "";
    PropertiesService.getScriptProperties().setProperty("SHIFT_CYCLE_MASTER_JSON", JSON.stringify(safe));
    appendShiftAudit(data, "クールマスター保存", "SHIFT_CYCLE_MASTER", beforeRaw, safe);
    return createJsonDataResponse({ success: true, master: safe });
  } catch (error) { return createJsonResponse(false, error.message || "クールマスターを保存できませんでした。"); }
}



function loginShift(data) {
  try {
    var p = PropertiesService.getScriptProperties();
    var loginId = sanitizeText(data.loginId, 100).trim();
    var password = sanitizeText(data.password, 200);
    var operatorId = sanitizeText(data.employeeId, 100).trim();
    var operatorName = sanitizeText(data.employeeName, 100).trim();
    if (!operatorId || !operatorName) throw new Error("操作員を選択してください。");

    // 操作員は共有従業員マスターに存在する有効な人だけを許可します。
    var master = normalizeShiftEmployeeMaster(readShiftEmployeeMaster());
    var operator = null;
    for (var i = 0; i < master.length; i++) {
      if (master[i].active && master[i].id === operatorId) { operator = master[i]; break; }
    }
    if (!operator) throw new Error("選択した操作員が従業員マスターに見つかりません。画面を再読み込みしてください。");
    operatorName = operator.displayName || operator.name;

    var adminId = p.getProperty("SHIFT_ADMIN_LOGIN_ID") || "";
    var adminSalt = p.getProperty("SHIFT_ADMIN_SALT") || "";
    var adminHash = p.getProperty("SHIFT_ADMIN_PASSWORD_HASH") || "";
    var employeeId = p.getProperty("SHIFT_EMPLOYEE_LOGIN_ID") || "";
    var employeeSalt = p.getProperty("SHIFT_EMPLOYEE_SALT") || "";
    var employeeHash = p.getProperty("SHIFT_EMPLOYEE_PASSWORD_HASH") || "";

    if (loginId === adminId) {
      if (!adminSalt || !adminHash) throw new Error("管理者ログインがまだGAS側で初期設定されていません。");
      if (shiftAuthHash(password, adminSalt) !== adminHash) throw new Error("ログインIDまたはパスワードが違います。");
      return createJsonDataResponse({ success: true, session: createShiftSession("admin", operatorName, operatorId) });
    }
    if (loginId === employeeId) {
      if (!employeeSalt || !employeeHash) throw new Error("従業員ログインがまだGAS側で初期設定されていません。");
      if (shiftAuthHash(password, employeeSalt) !== employeeHash) throw new Error("ログインIDまたはパスワードが違います。");
      return createJsonDataResponse({ success: true, session: createShiftSession("employee", operatorName, operatorId) });
    }
    throw new Error("ログインIDまたはパスワードが違います。");
  } catch (error) {
    return createJsonResponse(false, error.message || "ログインに失敗しました。");
  }
}



function loginShiftAdmin(data) {
  try {
    var p = PropertiesService.getScriptProperties();
    var loginId = sanitizeText(data.loginId, 100).trim();
    var password = sanitizeText(data.password, 200);
    var salt = p.getProperty("SHIFT_ADMIN_SALT") || "";
    var expectedId = p.getProperty("SHIFT_ADMIN_LOGIN_ID") || "";
    var expectedHash = p.getProperty("SHIFT_ADMIN_PASSWORD_HASH") || "";
    if (!salt || !expectedHash) throw new Error("管理者ログインがまだGAS側で初期設定されていません。");
    if (loginId !== expectedId || shiftAuthHash(password, salt) !== expectedHash) throw new Error("ログインIDまたはパスワードが違います。");
    var operatorId = sanitizeText(data.employeeId, 100).trim();
    var operatorName = sanitizeText(data.employeeName, 100).trim();
    if (!operatorId || !operatorName) throw new Error("操作員を選択してください。");
    return createJsonDataResponse({ success: true, session: createShiftSession("admin", operatorName, operatorId) });
  } catch (error) { return createJsonResponse(false, error.message || "管理者ログインに失敗しました。"); }
}



function configureShiftEmployeeLogin() {
  var p = PropertiesService.getScriptProperties();
  var loginId = p.getProperty("SHIFT_EMPLOYEE_LOGIN_ID");
  var password = p.getProperty("SHIFT_EMPLOYEE_SETUP_PASSWORD");
  if (!loginId || !password) throw new Error("SHIFT_EMPLOYEE_LOGIN_ID と SHIFT_EMPLOYEE_SETUP_PASSWORD を設定してください。");
  var salt = Utilities.getUuid();
  p.setProperties({ SHIFT_EMPLOYEE_SALT: salt, SHIFT_EMPLOYEE_PASSWORD_HASH: shiftAuthHash(password, salt) });
  p.deleteProperty("SHIFT_EMPLOYEE_SETUP_PASSWORD");
  return "従業員ログインを設定しました。平文パスワードは削除済みです。";
}



function loginShiftEmployee(data) {
  try {
    var p = PropertiesService.getScriptProperties();
    var loginId = sanitizeText(data.loginId, 100).trim();
    var password = sanitizeText(data.password, 200);
    var expectedId = p.getProperty("SHIFT_EMPLOYEE_LOGIN_ID") || "";
    var salt = p.getProperty("SHIFT_EMPLOYEE_SALT") || "";
    var expectedHash = p.getProperty("SHIFT_EMPLOYEE_PASSWORD_HASH") || "";
    if (!salt || !expectedHash) throw new Error("従業員ログインがまだGAS側で初期設定されていません。");
    if (loginId !== expectedId || shiftAuthHash(password, salt) !== expectedHash) throw new Error("従業員IDまたはパスワードが違います。");
    var operatorId = sanitizeText(data.employeeId, 100).trim();
    var operatorName = sanitizeText(data.employeeName, 100).trim();
    if (!operatorId || !operatorName) throw new Error("操作員を選択してください。");
    return createJsonDataResponse({ success: true, session: createShiftSession("employee", operatorName, operatorId) });
  } catch (error) { return createJsonResponse(false, error.message || "従業員ログインに失敗しました。"); }
}



/** シフト期間内の日曜・祝日・年末年始を返します。 */
function getShiftHolidays(data) {
  try {
    // 祝日情報は閲覧専用のため公開。
    var startDate = sanitizeDateValue(data.startDate);
    var endDate = sanitizeDateValue(data.endDate);
    if (!startDate || !endDate || startDate > endDate) throw new Error("取得期間が正しくありません。");
    var startParts = startDate.split("-").map(Number);
    var endParts = endDate.split("-").map(Number);
    var cursor = new Date(startParts[0], startParts[1] - 1, startParts[2]);
    var last = new Date(endParts[0], endParts[1] - 1, endParts[2]);
    var holidays = [];
    var days = 0;
    while (cursor <= last) {
      if (++days > 62) throw new Error("祝日の取得期間が長すぎます。");
      if (isDefaultClosedDate(cursor)) {
        holidays.push(Utilities.formatDate(cursor, Session.getScriptTimeZone() || "Asia/Tokyo", "yyyy-MM-dd"));
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    return createJsonDataResponse({ success: true, holidays: holidays });
  } catch (error) {
    console.error(error);
    return createJsonResponse(false, error.message || "祝日の取得エラーが発生しました。");
  }
}



function getShiftPaidLeaveBalance(data) {
  try {
    var session = requireShiftSession(data.sessionToken);
    var employeeId = sanitizeText(data.employeeId, 100).trim();
    if (!employeeId || (session.role !== "admin" && session.employeeId !== employeeId)) throw new Error("本人の有給情報だけを表示できます。");
    var values = {};
    try { values = JSON.parse(PropertiesService.getScriptProperties().getProperty("SHIFT_PAID_LEAVE_BALANCES_JSON") || "{}"); } catch (_) { values = {}; }
    return createJsonDataResponse({ success: true, balance: values[employeeId] || null });
  } catch (error) { return createJsonResponse(false, error.message || "有給情報を取得できませんでした。"); }
}



function getShiftAutoDraftSettings(data) {
  try { requireShiftSession(data.sessionToken, "admin"); var raw = PropertiesService.getScriptProperties().getProperty("SHIFT_AUTO_DRAFT_SETTINGS_JSON"); return createJsonDataResponse({ success: true, settings: raw ? JSON.parse(raw) : { enabled: false, started: false, horizonMonths: 3 } }); }
  catch (error) { return createJsonResponse(false, error.message || "自動作成設定を取得できませんでした。"); }
}



function saveShiftAutoDraftSettings(data) {
  try { requireShiftSession(data.sessionToken, "admin"); verifyShiftApiKey(data.shiftApiKey); var input = data.settings || {}; var safe = { enabled: Boolean(input.enabled), started: Boolean(input.enabled && input.started), horizonMonths: 3, lastRunAt: input.lastRunAt ? sanitizeText(input.lastRunAt, 50) : "" }; PropertiesService.getScriptProperties().setProperty("SHIFT_AUTO_DRAFT_SETTINGS_JSON", JSON.stringify(safe)); appendShiftAudit(data, "シフト案自動作成設定", "SHIFT_AUTO_DRAFT_SETTINGS", null, safe); return createJsonDataResponse({ success: true, settings: safe }); }
  catch (error) { return createJsonResponse(false, error.message || "自動作成設定を保存できませんでした。"); }
}



function saveShiftPaidLeaveBalance(data) {
  var lock = LockService.getScriptLock();
  try {
    if (!lock.tryLock(10000)) throw new Error("別の保存処理を実行中です。");
    var session = requireShiftSession(data.sessionToken);
    var input = data.balance || {};
    var employeeId = sanitizeText(input.employeeId, 100).trim();
    if (!employeeId || (session.role !== "admin" && session.employeeId !== employeeId)) throw new Error("本人の有給情報だけを変更できます。");
    var values = {};
    var p = PropertiesService.getScriptProperties();
    try { values = JSON.parse(p.getProperty("SHIFT_PAID_LEAVE_BALANCES_JSON") || "{}"); } catch (_) { values = {}; }
    var safe = { employeeId: employeeId, enabled: Boolean(input.enabled), remainingDays: Math.max(0, Number(input.remainingDays) || 0), renewalDate: sanitizeDateValue(input.renewalDate) || "", grantDays: Math.max(0, Number(input.grantDays) || 0), updatedAt: new Date().toISOString() };
    var before = values[employeeId] || null;
    values[employeeId] = safe;
    p.setProperty("SHIFT_PAID_LEAVE_BALANCES_JSON", JSON.stringify(values));
    appendShiftAudit(data, "有給情報更新", employeeId, before, safe);
    return createJsonDataResponse({ success: true, balance: safe });
  } catch (error) { return createJsonResponse(false, error.message || "有給情報を保存できませんでした。"); }
  finally { try { lock.releaseLock(); } catch (_) {} }
}



/* ------------------------------------------------------------
 * シフト希望申請（試作版）
 * 月単位でScript Propertiesへ保存し、全端末から共有します。
 * 本人確認は未実装。承認・却下だけSHIFT_API_KEYを必須にします。
 * ------------------------------------------------------------ */
function getShiftLeaveRequestPropertyKey(periodStart) {
  var safeStart = sanitizeDateValue(periodStart);
  if (!safeStart) throw new Error("対象期間が正しくありません。");
  return "SHIFT_LEAVE_REQUESTS_" + safeStart;
}



function readShiftLeaveRequestStore(periodStart) {
  var raw = PropertiesService.getScriptProperties().getProperty(getShiftLeaveRequestPropertyKey(periodStart));
  if (!raw) return [];
  try {
    var parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}



function writeShiftLeaveRequestStore(periodStart, requests) {
  if (requests.length > 100) throw new Error("この期間の希望件数が上限を超えています。");
  PropertiesService.getScriptProperties().setProperty(getShiftLeaveRequestPropertyKey(periodStart), JSON.stringify(requests));
}



function syncShiftLeaveRequestToNotion(request) {
  var p = PropertiesService.getScriptProperties();
  var apiKey = p.getProperty("NOTION_API_KEY");
  var databaseId = p.getProperty("NOTION_SHIFT_REQUEST_DATABASE_ID");
  if (!apiKey || !databaseId || !request) return;
  var databaseUrl = "https://api.notion.com/v1/databases/" + databaseId;
  var database = requestNotion(apiKey, databaseUrl, "get", null);
  var additions = {};
  var schema = { "申請ID": { rich_text: {} }, "従業員ID": { rich_text: {} }, "氏名": { rich_text: {} }, "希望日": { date: {} }, "対象期間開始": { date: {} }, "対象期間終了": { date: {} }, "希望区分": { select: {} }, "コメント": { rich_text: {} }, "公開範囲": { select: {} }, "状態": { select: {} }, "提出日時": { date: {} }, "更新日時": { date: {} }, "希望開始時間": { rich_text: {} }, "希望終了時間": { rich_text: {} }, "却下理由": { rich_text: {} } };
  Object.keys(schema).forEach(function(name) { if (!database.properties || !database.properties[name]) additions[name] = schema[name]; });
  if (Object.keys(additions).length) requestNotion(apiKey, databaseUrl, "patch", { properties: additions });
  var properties = { "記録名": createTitleProperty((request.date || request.periodStart) + " " + request.employeeName + " " + request.type), "申請ID": createRichTextProperty(request.id), "従業員ID": createRichTextProperty(request.employeeId || ""), "氏名": createRichTextProperty(request.employeeName), "希望日": request.date ? { date: { start: request.date } } : { date: null }, "対象期間開始": { date: { start: request.periodStart } }, "対象期間終了": { date: { start: request.periodEnd } }, "希望区分": { select: { name: request.type } }, "コメント": createRichTextProperty(request.comment || ""), "公開範囲": { select: { name: request.commentVisibility === "editors" ? "編集者のみ" : "全員" } }, "状態": { select: { name: request.status } }, "提出日時": { date: { start: request.submittedAt } }, "更新日時": { date: { start: request.updatedAt } } };
  properties["希望開始時間"] = createRichTextProperty(request.desiredWorkStart || "");
  properties["希望終了時間"] = createRichTextProperty(request.desiredWorkEnd || "");
  properties["却下理由"] = createRichTextProperty(request.rejectionReason || "");
  var existing = queryNotionDatabase(apiKey, databaseId, { filter: { property: "申請ID", rich_text: { equals: request.id } }, page_size: 1 });
  if (existing.length) updateNotionPage(apiKey, existing[0].id, properties); else createNotionPage(apiKey, databaseId, properties);
}



function getShiftLeaveRequests(data) {
  try {
    var periodStart = sanitizeDateValue(data.periodStart);
    var periodEnd = sanitizeDateValue(data.periodEnd);
    if (!periodStart || !periodEnd || periodStart > periodEnd) throw new Error("対象期間が正しくありません。");
    var requests = readShiftLeaveRequestStore(periodStart);
    if (data.shiftApiKey) {
      verifyShiftApiKey(data.shiftApiKey);
    } else if (data.employeeToken) {
      requireShiftSession(data.employeeToken, "employee");
    } else {
      requests = [];
    }
    var viewer = requireShiftSession(data.sessionToken);
    if (viewer.role !== "admin") {
      var correctionVisibility = PropertiesService.getScriptProperties().getProperty("SHIFT_CORRECTION_VISIBILITY_" + getStoreId()) || "all";
      requests = requests.filter(function(item) {
        var own = viewer.employeeId && item.employeeId === viewer.employeeId;
        return own || item.type !== "訂正依頼" || correctionVisibility === "all";
      }).map(function(item) {
        if (viewer.employeeId && item.employeeId === viewer.employeeId) return item;
        var visible = Object.assign({}, item);
        delete visible.rejectionReason;
        if (visible.commentVisibility === "editors") visible.comment = "";
        return visible;
      });
    }
    return createJsonDataResponse({ success: true, requests: requests });
  } catch (error) {
    console.error(error);
    return createJsonResponse(false, error.message || "希望申請を取得できませんでした。");
  }
}



function saveShiftLeaveRequest(data) {
  var lock = LockService.getScriptLock();
  try {
    if (!lock.tryLock(10000)) throw new Error("別の申請を処理中です。少し待ってください。");
    var session = requireShiftSession(data.employeeToken, "employee");
    var input = data.request || {};
    var employeeName = sanitizeText(input.employeeName, 100).trim();
    var employeeId = sanitizeText(input.employeeId, 100).trim();
    var periodStart = sanitizeDateValue(input.periodStart);
    var periodEnd = sanitizeDateValue(input.periodEnd);
    var dateValue = input.date ? sanitizeDateValue(input.date) : "";
    var type = sanitizeText(input.type, 30);
    var comment = sanitizeText(input.comment, 300);
    var commentVisibility = input.commentVisibility === "editors" ? "editors" : "all";
    var allowedTypes = ["有給希望", "休み希望", "出勤希望", "午前休希望", "午後休希望", "希望なし", "訂正依頼"];
    if (!employeeId || !employeeName || !periodStart || !periodEnd || periodStart > periodEnd) throw new Error("申請内容が正しくありません。");
    if (session.employeeId && session.employeeId !== employeeId) throw new Error("別の従業員として希望を提出することはできません。");
    if (allowedTypes.indexOf(type) < 0) throw new Error("希望種別が正しくありません。");
    if (type !== "希望なし" && (!dateValue || dateValue < periodStart || dateValue > periodEnd)) throw new Error("希望日が対象期間外です。");
    if (type === "希望なし") dateValue = "";
    if (type === "訂正依頼") {
      if (!comment.trim()) throw new Error("訂正内容をコメントに入力してください。");
      if (!readShiftPeriodStatusForCorrection(periodStart)) throw new Error("確定シフトの期間だけ訂正依頼を提出できます。");
    }

    var requests = readShiftLeaveRequestStore(periodStart);
    var now = new Date().toISOString();
    if (type === "希望なし") {
      requests.forEach(function(item) { if (item.employeeName === employeeName && item.status === "申請中") { item.status = "取消"; item.updatedAt = now; } });
    } else {
      requests = requests.filter(function(item) { return !(item.employeeName === employeeName && item.type === "希望なし" && item.status === "申請中"); });
    }
    var existing = requests.find(function(item) { return (item.employeeId === employeeId || (!item.employeeId && item.employeeName === employeeName)) && item.date === dateValue && (item.type === "訂正依頼") === (type === "訂正依頼") && item.status !== "取消"; });
    if (existing) {
      existing.type = type;
      existing.desiredWorkStart = "";
      existing.desiredWorkEnd = "";
      existing.rejectionReason = "";
      existing.comment = comment;
      existing.commentVisibility = commentVisibility;
      existing.status = "申請中";
      existing.updatedAt = now;
    } else {
      existing = { id: Utilities.getUuid(), employeeId: employeeId, employeeName: employeeName, date: dateValue, periodStart: periodStart, periodEnd: periodEnd, type: type, comment: comment, commentVisibility: commentVisibility, status: "申請中", submittedAt: now, updatedAt: now };
      requests.push(existing);
    }
    writeShiftLeaveRequestStore(periodStart, requests);
    syncShiftLeaveRequestToNotion(existing);
    appendShiftAudit({ sessionToken: data.employeeToken }, "休み希望提出", existing.id, null, existing);
    return createJsonDataResponse({ success: true, request: existing });
  } catch (error) {
    console.error(error);
    return createJsonResponse(false, error.message || "希望を保存できませんでした。");
  } finally { try { lock.releaseLock(); } catch (_) {} }
}



function findShiftLeaveRequestStore(id) {
  var properties = PropertiesService.getScriptProperties().getProperties();
  var keys = Object.keys(properties).filter(function(key) { return key.indexOf("SHIFT_LEAVE_REQUESTS_") === 0; });
  for (var i = 0; i < keys.length; i++) {
    var items;
    try { items = JSON.parse(properties[keys[i]] || "[]"); } catch (_) { items = []; }
    var found = items.find(function(item) { return item.id === id; });
    if (found) return { key: keys[i], items: items, request: found };
  }
  throw new Error("対象の希望申請が見つかりません。");
}



function cancelShiftLeaveRequest(data) {
  var lock = LockService.getScriptLock();
  try {
    if (!lock.tryLock(10000)) throw new Error("別の申請を処理中です。");
    var session = requireShiftSession(data.employeeToken, "employee");
    var store = findShiftLeaveRequestStore(sanitizeText(data.id, 100));
    if (session.role !== "admin" && (!session.employeeId || !store.request.employeeId || session.employeeId !== store.request.employeeId)) throw new Error("本人の希望だけを取り消せます。");
    store.request.status = "取消";
    store.request.updatedAt = new Date().toISOString();
    PropertiesService.getScriptProperties().setProperty(store.key, JSON.stringify(store.items));
    syncShiftLeaveRequestToNotion(store.request);
    appendShiftAudit({ sessionToken: data.employeeToken }, "休み希望取消", store.request.id, null, store.request);
    return createJsonDataResponse({ success: true, request: store.request });
  } catch (error) {
    console.error(error);
    return createJsonResponse(false, error.message || "希望を取り消せませんでした。");
  } finally { try { lock.releaseLock(); } catch (_) {} }
}



function updateShiftLeaveRequestStatus(data) {
  var lock = LockService.getScriptLock();
  try {
    if (!lock.tryLock(10000)) throw new Error("別の処理を実行中です。");
    verifyShiftApiKey(data.shiftApiKey);
    var status = sanitizeText(data.status, 20);
    if (["申請中", "承認", "却下", "取消", "対応済み"].indexOf(status) < 0) throw new Error("状態が正しくありません。");
    var store = findShiftLeaveRequestStore(sanitizeText(data.id, 100));
    if (status === "対応済み" && store.request.type !== "訂正依頼") throw new Error("訂正依頼だけ対応済みにできます。");
    store.request.status = status;
    store.request.rejectionReason = status === "却下" ? sanitizeText(data.rejectionReason || "", 300) : "";
    store.request.updatedAt = new Date().toISOString();
    PropertiesService.getScriptProperties().setProperty(store.key, JSON.stringify(store.items));
    syncShiftLeaveRequestToNotion(store.request);
    appendShiftAudit(data, "休み希望状態変更", store.request.id, null, store.request);
    return createJsonDataResponse({ success: true, request: store.request });
  } catch (error) {
    console.error(error);
    return createJsonResponse(false, error.message || "希望の状態を更新できませんでした。");
  } finally { try { lock.releaseLock(); } catch (_) {} }
}



/** 管理者が希望申請を削除します。Notion上の対応ページは復元可能なアーカイブにします。 */
function deleteShiftLeaveRequest(data) {
  var lock = LockService.getScriptLock();
  try {
    if (!lock.tryLock(10000)) throw new Error("別の処理を実行中です。");
    verifyShiftApiKey(data.shiftApiKey);
    var store = findShiftLeaveRequestStore(sanitizeText(data.id, 100));
    var before = JSON.parse(JSON.stringify(store.request));
    var p = PropertiesService.getScriptProperties();
    var apiKey = p.getProperty("NOTION_API_KEY");
    var databaseId = p.getProperty("NOTION_SHIFT_REQUEST_DATABASE_ID");
    if (apiKey && databaseId) {
      var pages = queryNotionDatabase(apiKey, databaseId, { filter: { property: "申請ID", rich_text: { equals: before.id } }, page_size: 10 });
      pages.forEach(function(page) {
        assertPageBelongsToDatabase(apiKey, page.id, databaseId);
        requestNotion(apiKey, "https://api.notion.com/v1/pages/" + page.id, "patch", { archived: true });
      });
    }
    var remaining = store.items.filter(function(item) { return item.id !== before.id; });
    p.setProperty(store.key, JSON.stringify(remaining));
    appendShiftAudit(data, "休み希望削除", before.id, before, null);
    return createJsonDataResponse({ success: true });
  } catch (error) {
    console.error(error);
    return createJsonResponse(false, error.message || "希望を削除できませんでした。");
  } finally { try { lock.releaseLock(); } catch (_) {} }
}



function updateShiftLeaveRequestWorkTime(data) {
  var lock = LockService.getScriptLock();
  try {
    if (!lock.tryLock(10000)) throw new Error("別の処理を実行中です。");
    var session = requireShiftSession(data.employeeToken, "employee");
    var store = findShiftLeaveRequestStore(sanitizeText(data.id, 100));
    var item = store.request;
    if (!session.employeeId || !item.employeeId || session.employeeId !== item.employeeId) throw new Error("本人の希望だけを変更できます。");
    if (item.type !== "出勤希望" || item.status !== "申請中") throw new Error("申請中の出勤希望だけを変更できます。");
    var start = sanitizeText(data.desiredWorkStart || "", 5);
    var end = sanitizeText(data.desiredWorkEnd || "", 5);
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(start) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(end) || start >= end) throw new Error("希望時間を正しく入力してください。");
    item.desiredWorkStart = start;
    item.desiredWorkEnd = end;
    item.updatedAt = new Date().toISOString();
    PropertiesService.getScriptProperties().setProperty(store.key, JSON.stringify(store.items));
    syncShiftLeaveRequestToNotion(item);
    appendShiftAudit({ sessionToken: data.employeeToken }, "出勤希望時間変更", item.id, null, item);
    return createJsonDataResponse({ success: true, request: item });
  } catch (error) {
    console.error(error);
    return createJsonResponse(false, error.message || "希望時間を更新できませんでした。");
  } finally { try { lock.releaseLock(); } catch (_) {} }
}



/** 薬局固有の休診・当番日ルール。本人認証導入まではシフト画面から共有編集できる試作運用です。 */
function getShiftSpecialDayRules() {
  try {
    var props = PropertiesService.getScriptProperties();
    var raw = props.getProperty("SHIFT_SPECIAL_DAY_RULES_JSON");
    var rules = raw ? JSON.parse(raw) : [];
    if (props.getProperty("SHIFT_BAND_V3_MIGRATED") !== "1") {
      // The duplicate template's old store-specific presets are replaced once.
      rules = [
        { id: "band-v3:closed-0", name: "定休日", color: "red", behavior: "information", enabled: true, mode: "recurring", weekday: 0, weeks: [1,2,3,4,5], dates: [], showName: true, restMode: "none", restEmployeeIds: [] },
        { id: "band-v3:holiday", name: "定休日", color: "red", behavior: "information", enabled: true, mode: "annual", weekday: 0, weeks: [], dates: [], showName: true, restMode: "none", restEmployeeIds: [] }
      ];
      props.setProperty("SHIFT_SPECIAL_DAY_RULES_JSON", JSON.stringify(rules));
      props.setProperty("SHIFT_BAND_V3_MIGRATED", "1");
    }
    return createJsonDataResponse({ success: true, rules: rules });
  } catch (error) { return createJsonResponse(false, error.message || "特殊日設定を取得できませんでした。"); }
}



function saveShiftSpecialDayRules(data) {
  var lock = LockService.getScriptLock();
  try {
    verifyShiftApiKey(data.shiftApiKey);
    if (!lock.tryLock(10000)) throw new Error("別の保存を処理中です。");
    var source = Array.isArray(data.rules) ? data.rules : [];
    if (source.length > 30) throw new Error("特殊日ルールは30件までです。");
    var colors = ["red", "blue", "green", "amber", "purple", "gray"];
    var activeEmployeeIds = {};
    readShiftEmployeeMaster().forEach(function(item) { if (item.active) activeEmployeeIds[item.id] = true; });
    var rules = source.filter(function(rule) { return /^band-v3:/.test(String(rule.id || "")); }).map(function(rule) {
      var dates = Array.isArray(rule.dates) ? rule.dates.map(function(value) { return sanitizeText(value, 10); }).filter(function(value) { return /^\d{4}-\d{2}-\d{2}$/.test(value); }).slice(0, 366) : [];
      var monthDays = Array.isArray(rule.monthDays) ? rule.monthDays.map(function(value) { return sanitizeText(value, 5); }).filter(function(value) { return /^\d{2}-\d{2}$/.test(value); }).slice(0, 366) : [];
      var weeks = Array.isArray(rule.weeks) ? rule.weeks.map(Number).filter(function(value) { return value >= 1 && value <= 5; }) : [];
      var restMode = ["all", "selected"].indexOf(rule.restMode) >= 0 ? rule.restMode : "none";
      var restEmployeeIds = (Array.isArray(rule.restEmployeeIds) ? rule.restEmployeeIds : []).map(function(id) { return sanitizeText(id, 100); }).filter(function(id) { return activeEmployeeIds[id]; });
      if (restMode === "selected" && !restEmployeeIds.length) throw new Error("休みにする従業員を選んでください。");
      return { id: sanitizeText(rule.id, 100), name: sanitizeText(rule.name, 50), color: colors.indexOf(rule.color) >= 0 ? rule.color : "gray", behavior: "information", enabled: rule.enabled !== false, mode: ["recurring", "yearly"].indexOf(rule.mode) >= 0 ? rule.mode : "annual", weekday: Math.max(0, Math.min(6, Number(rule.weekday) || 0)), weeks: weeks, dates: dates, monthDays: monthDays, showName: rule.showName !== false, restMode: restMode, restEmployeeIds: restMode === "selected" ? restEmployeeIds : [] };
    }).filter(function(rule) { return !!rule.name; });
    PropertiesService.getScriptProperties().setProperty("SHIFT_SPECIAL_DAY_RULES_JSON", JSON.stringify(rules));
    PropertiesService.getScriptProperties().setProperty("SHIFT_BAND_V3_MIGRATED", "1");
    return createJsonDataResponse({ success: true, rules: rules });
  } catch (error) { return createJsonResponse(false, error.message || "特殊日設定を保存できませんでした。"); }
  finally { try { lock.releaseLock(); } catch (_) {} }
}



/** 店舗共通の月次シフト期間。開始日を決めると終了日は前日へ自動設定します。 */
function getShiftCalendarPeriodSettings() {
  try {
    var raw = PropertiesService.getScriptProperties().getProperty("SHIFT_CALENDAR_PERIOD_JSON");
    var settings = raw ? JSON.parse(raw) : { startDay: 21, endDay: 20 };
    return createJsonDataResponse({ success: true, settings: settings });
  } catch (error) {
    return createJsonResponse(false, error.message || "カレンダー期間設定を取得できませんでした。");
  }
}



function saveShiftCalendarPeriodSettings(data) {
  try {
    verifyShiftApiKey(data.shiftApiKey);
    var input = data.settings || {};
    var startDay = Number(input.startDay);
    if (!isFinite(startDay) || startDay < 1 || startDay > 28 || Math.floor(startDay) !== startDay) {
      throw new Error("開始日は1日から28日の範囲で指定してください。");
    }
    var settings = { startDay: startDay, endDay: startDay === 1 ? 0 : startDay - 1 };
    PropertiesService.getScriptProperties().setProperty("SHIFT_CALENDAR_PERIOD_JSON", JSON.stringify(settings));
    return createJsonDataResponse({ success: true, settings: settings });
  } catch (error) {
    return createJsonResponse(false, error.message || "カレンダー期間設定を保存できませんでした。");
  }
}



/** シフトDBに監査用の最終更新者プロパティがなければ追加します。 */
function ensureShiftEditorProperty(settings) {
  var databaseUrl = "https://api.notion.com/v1/databases/" + settings.databaseId;
  var database = requestNotion(settings.apiKey, databaseUrl, "get", null);
  if (!database.properties || !database.properties["最終更新者氏名"]) {
    requestNotion(settings.apiKey, databaseUrl, "patch", {
      properties: { "最終更新者氏名": { rich_text: {} } }
    });
  }
}



/** 全体補足（帯色を含む）をシフトDBへ保存するプロパティがなければ追加します。 */
function ensureShiftGlobalRemarkProperties(settings) {
  var databaseUrl = "https://api.notion.com/v1/databases/" + settings.databaseId;
  var database = requestNotion(settings.apiKey, databaseUrl, "get", null);
  var additions = {};
  if (!database.properties || !database.properties["全体補足種別"]) additions["全体補足種別"] = { rich_text: {} };
  if (!database.properties || !database.properties["全体補足内容"]) additions["全体補足内容"] = { rich_text: {} };
  if (Object.keys(additions).length) {
    requestNotion(settings.apiKey, databaseUrl, "patch", { properties: additions });
  }
}



function ensureShiftEmployeeIdProperty(settings) {
  var databaseUrl = "https://api.notion.com/v1/databases/" + settings.databaseId;
  var database = requestNotion(settings.apiKey, databaseUrl, "get", null);
  if (!database.properties || !database.properties["従業員ID"]) requestNotion(settings.apiKey, databaseUrl, "patch", { properties: { "従業員ID": { rich_text: {} } } });
}



/**
 * 表示中の1か月分を1回のリクエストで受け取り、Notionへ差分だけ反映します。
 * - 値がある行: 新規作成または変更時だけ更新
 * - 全項目が空の行: 既存ページがある場合だけアーカイブ
 * - 変更なし: Notion APIへの書き込みなし
 */
function saveShiftMonth(data) {
  var lock = LockService.getScriptLock();
  try {
    verifyShiftApiKey(data.shiftApiKey);
    if (!lock.tryLock(30000)) throw new Error("別の保存処理を実行中です。少し待ってから再度お試しください。");

    var settings = getShiftManagementSettings();
    var updatedBy = sanitizeText(data.updatedBy, 100).trim();
    if (!updatedBy) throw new Error("保存者名が指定されていません。");
    ensureShiftEditorProperty(settings);
    ensureShiftGlobalRemarkProperties(settings);
    ensureShiftEmployeeIdProperty(settings);
    var periodStart = sanitizeDateValue(data.periodStart);
    var periodEnd = sanitizeDateValue(data.periodEnd);
    var incomingRows = Array.isArray(data.shifts) ? data.shifts : [];
    if (!periodStart || !periodEnd || periodStart > periodEnd) throw new Error("保存期間が正しくありません。");
    if (incomingRows.length > 500) throw new Error("一度に保存できる件数は500件までです。");

    // 対象期間を最初に1回だけ読み込み、社員名＋日付で索引化します。
    var existingPages = queryNotionDatabase(settings.apiKey, settings.databaseId, {
      filter: {
        and: [
          { property: "日付", date: { on_or_after: periodStart } },
          { property: "日付", date: { on_or_before: periodEnd } }
        ]
      },
      page_size: 100
    });
    var existingByKey = {};
    existingPages.forEach(function(page) {
      var flat = flattenStatusProperties(page.properties || {});
      var employee = String(flat["社員名"] || "");
      var employeeId = String(flat["従業員ID"] || "");
      var dateObj = flat["日付"];
      var date = dateObj && dateObj.start ? String(dateObj.start).slice(0, 10) : "";
      if (!employee || !date) return;
      var key = (employeeId || employee) + "|" + date;
      if (!existingByKey[key]) existingByKey[key] = [];
      existingByKey[key].push({ page: page, flat: flat });
      if (employeeId) {
        var legacyKey = employee + "|" + date;
        if (!existingByKey[legacyKey]) existingByKey[legacyKey] = existingByKey[key];
      }
    });

    var created = 0;
    var updated = 0;
    var cleared = 0;
    var unchanged = 0;
    var seen = {};

    incomingRows.forEach(function(rawRow) {
      var employeeName = sanitizeText(rawRow["社員名"], 100);
      var employeeId = sanitizeText(rawRow["従業員ID"], 100);
      var dateValue = sanitizeDateValue(rawRow["日付"]);
      if (!employeeName || !dateValue || dateValue < periodStart || dateValue > periodEnd) {
        throw new Error("月次シフト内に不正な社員名または日付があります。");
      }
      var key = (employeeId || employeeName) + "|" + dateValue;
      if (seen[key]) throw new Error("同じ社員・日付のシフトが重複しています。");
      seen[key] = true;

      var shiftContent = sanitizeText(rawRow["シフト内容"], 200);
      var breakTime = sanitizeText(rawRow["休憩時間"], 50);
      var workTime = sanitizeText(rawRow["実働時間"], 50);
      var note = sanitizeText(rawRow["備考"], 500);
      var globalRemarkType = sanitizeText(rawRow["全体補足種別"], 100);
      var globalRemarkText = sanitizeText(rawRow["全体補足内容"], 500);
      // 休憩・実働の初期値（0:00）だけでは空ページを作りません。
      var hasContent = Boolean(shiftContent || note || globalRemarkType || globalRemarkText);
      var matches = existingByKey[key] || existingByKey[employeeName + "|" + dateValue] || [];

      // 空欄は新規ページを作らず、既存ページだけをアーカイブします。
      if (!hasContent) {
        matches.forEach(function(match) {
          requestNotion(settings.apiKey, "https://api.notion.com/v1/pages/" + match.page.id, "patch", { archived: true });
          cleared++;
          Utilities.sleep(350);
        });
        if (!matches.length) unchanged++;
        return;
      }

      var properties = {
        "記録名": createTitleProperty(dateValue + " " + employeeName),
        "社員名": createRichTextProperty(employeeName),
        "従業員ID": createRichTextProperty(employeeId),
        "日付": { date: { start: dateValue } },
        "シフト内容": createRichTextProperty(shiftContent),
        "休憩時間": createRichTextProperty(breakTime),
        "実働時間": createRichTextProperty(workTime),
        "備考": createRichTextProperty(note),
        "全体補足種別": createRichTextProperty(globalRemarkType),
        "全体補足内容": createRichTextProperty(globalRemarkText),
        "最終更新者氏名": createRichTextProperty(updatedBy)
      };

      if (!matches.length) {
        createNotionPage(settings.apiKey, settings.databaseId, properties);
        created++;
        Utilities.sleep(350);
        return;
      }

      var current = matches[0].flat;
      var isChanged =
        String(current["社員名"] || "") !== employeeName ||
        String(current["シフト内容"] || "") !== shiftContent ||
        String(current["休憩時間"] || "") !== breakTime ||
        String(current["実働時間"] || "") !== workTime ||
        String(current["備考"] || "") !== note ||
        String(current["全体補足種別"] || "") !== globalRemarkType ||
        String(current["全体補足内容"] || "") !== globalRemarkText;
      if (isChanged) {
        updateNotionPage(settings.apiKey, matches[0].page.id, properties);
        updated++;
        Utilities.sleep(350);
      } else {
        unchanged++;
      }

      // 過去の不具合等で同じ社員・日付が重複していた場合は1件へ整理します。
      for (var i = 1; i < matches.length; i++) {
        requestNotion(settings.apiKey, "https://api.notion.com/v1/pages/" + matches[i].page.id, "patch", { archived: true });
        cleared++;
        Utilities.sleep(350);
      }
    });

    appendShiftAudit(data, "月次シフト保存", periodStart + "〜" + periodEnd, null, { created: created, updated: updated, cleared: cleared, unchanged: unchanged });
    return createJsonDataResponse({
      success: true,
      message: "月次シフトを保存しました。",
      created: created,
      updated: updated,
      cleared: cleared,
      unchanged: unchanged
    });
  } catch (error) {
    console.error(error);
    return createJsonResponse(false, error.message || "月次シフトの保存エラーが発生しました。");
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}



/** 1人・1日分のシフトを新規作成または上書き保存します（社員名＋日付をキーに検索）。 */
function saveShift(data) {
  try {
    verifyShiftApiKey(data.shiftApiKey);
    var settings = getShiftManagementSettings();
    var row = data.shift || {};
    var employeeName = sanitizeText(row["社員名"], 100);
    var dateValue = sanitizeDateValue(row["日付"]);
    if (!employeeName) throw new Error("社員名が指定されていません。");
    if (!dateValue) throw new Error("日付が正しくありません。");

    var properties = {
      "記録名": createTitleProperty(dateValue + " " + employeeName),
      "社員名": createRichTextProperty(employeeName),
      "日付": { date: { start: dateValue } },
      "シフト内容": createRichTextProperty(String(row["シフト内容"] || "")),
      "休憩時間": createRichTextProperty(String(row["休憩時間"] || "")),
      "実働時間": createRichTextProperty(String(row["実働時間"] || "")),
      "備考": createRichTextProperty(String(row["備考"] || ""))
    };

    var existingPages = queryNotionDatabase(settings.apiKey, settings.databaseId, {
      filter: {
        and: [
          { property: "社員名", rich_text: { equals: employeeName } },
          { property: "日付", date: { equals: dateValue } }
        ]
      },
      page_size: 1
    });

    if (existingPages.length) {
      updateNotionPage(settings.apiKey, existingPages[0].id, properties);
    } else {
      createNotionPage(settings.apiKey, settings.databaseId, properties);
    }
    return createJsonResponse(true, "シフトを保存しました。");
  } catch (error) {
    console.error(error);
    return createJsonResponse(false, error.message || "シフトの保存エラーが発生しました。");
  }
}



/** シフトの1件をアーカイブ（削除扱い）します。 */
function deleteShift(data) {
  try {
    verifyShiftApiKey(data.shiftApiKey);
    var settings = getShiftManagementSettings();
    if (!data.id) throw new Error("IDが指定されていません。");
    assertPageBelongsToDatabase(settings.apiKey, data.id, settings.databaseId);
    requestNotion(settings.apiKey, "https://api.notion.com/v1/pages/" + data.id, "patch", { archived: true });
    return createJsonResponse(true, "シフトを削除しました。");
  } catch (error) {
    console.error(error);
    return createJsonResponse(false, error.message || "シフトの削除エラーが発生しました。");
  }
}



/** 訂正依頼は確定した期間のみ受け付けます。 */
function readShiftPeriodStatusForCorrection(periodStart) {
  var data = getShiftPeriodStatus({ periodStart: periodStart });
  try { return Boolean(JSON.parse(data.getContent()).locked); } catch (_) { return false; }
}



/** 既存の店舗設定DBに訂正依頼の公開範囲を保存します。 */
function getShiftCorrectionVisibility(data) {
  try {
    requireShiftSession(data.sessionToken);
    var p = PropertiesService.getScriptProperties();
    var fallback = p.getProperty("SHIFT_CORRECTION_VISIBILITY_" + getStoreId()) || "all";
    var apiKey = p.getProperty("NOTION_API_KEY"), dbId = p.getProperty("NOTION_STORE_DATABASE_ID");
    if (!apiKey || !dbId) return createJsonDataResponse({ success: true, visibility: fallback });
    var rows = queryNotionDatabase(apiKey, dbId, { filter: { property: "店舗ID", rich_text: { equals: getStoreId() } }, page_size: 1 });
    var label = rows.length ? statusPageToObject(rows[0])["訂正依頼公開設定"] : "";
    return createJsonDataResponse({ success: true, visibility: label === "全員に表示" ? "all" : label === "本人と管理者のみ" ? "private" : fallback });
  } catch (error) { return createJsonResponse(false, error.message || "公開設定を取得できませんでした。"); }
}


function saveShiftCorrectionVisibility(data) {
  try {
    requireShiftSession(data.sessionToken, "admin");
    verifyShiftApiKey(data.shiftApiKey);
    var visibility = data.visibility;
    if (visibility !== "all" && visibility !== "private") throw new Error("公開設定が正しくありません。");
    var p = PropertiesService.getScriptProperties();
    var apiKey = p.getProperty("NOTION_API_KEY"), dbId = p.getProperty("NOTION_STORE_DATABASE_ID");
    var label = visibility === "all" ? "全員に表示" : "本人と管理者のみ";
    if (apiKey && dbId) {
      var url = "https://api.notion.com/v1/databases/" + dbId;
      var db = requestNotion(apiKey, url, "get", null);
      if (!db.properties || !db.properties["訂正依頼公開設定"]) requestNotion(apiKey, url, "patch", { properties: { "訂正依頼公開設定": { select: { options: [{ name: "全員に表示" }, { name: "本人と管理者のみ" }] } } } });
      var rows = queryNotionDatabase(apiKey, dbId, { filter: { property: "店舗ID", rich_text: { equals: getStoreId() } }, page_size: 1 });
      if (rows.length) updateNotionPage(apiKey, rows[0].id, { "訂正依頼公開設定": { select: { name: label } } });
      else createNotionPage(apiKey, dbId, { "店舗名": createTitleProperty("薬局名を設定"), "店舗ID": createRichTextProperty(getStoreId()), "訂正依頼公開設定": { select: { name: label } } });
    }
    p.setProperty("SHIFT_CORRECTION_VISIBILITY_" + getStoreId(), visibility);
    appendShiftAudit(data, "訂正依頼公開設定変更", getStoreId(), null, { visibility: visibility });
    return createJsonDataResponse({ success: true, visibility: visibility });
  } catch (error) { return createJsonResponse(false, error.message || "公開設定を保存できませんでした。"); }
}

/** 新店舗の初期操作員を一人登録します。GASエディタで一度だけ実行してください。 */
function initializeShiftOperator() {
  var props = PropertiesService.getScriptProperties();
  var name = sanitizeText(props.getProperty("SHIFT_INITIAL_OPERATOR_NAME"), 100).trim();
  if (!name) throw new Error("SHIFT_INITIAL_OPERATOR_NAME を設定してください。");
  var master = normalizeShiftEmployeeMaster(readShiftEmployeeMaster());
  if (master.length) throw new Error("操作員が既に登録されています。再実行しないでください。");
  var id = Utilities.getUuid();
  props.setProperty("SHIFT_EMPLOYEE_MASTER_JSON", JSON.stringify([{ id: id, name: name, displayName: name, displayOrder: 1, active: true, aliases: [], role: "" }]));
  props.deleteProperty("SHIFT_INITIAL_OPERATOR_NAME");
  Logger.log("初期操作員を登録しました: " + name + " (" + id + ")");
}


/** 複製環境に混入した本番従業員を無効化する一度限りの復旧処理。 */
function deactivateImportedTemplateEmployees() {
  var p = PropertiesService.getScriptProperties();
  if (p.getProperty("NOTION_SHIFT_DATABASE_ID") !== "665ef4863f6040e9b542586083764148" ||
      p.getProperty("NOTION_SHIFT_REQUEST_DATABASE_ID") !== "a4d434ce8dbc4e9d860167971c631738" ||
      p.getProperty("NOTION_STORE_DATABASE_ID") !== "23de2613332d4ef3b809d21006cec516") {
    throw new Error("複製用Notion DBの設定が一致しません。何も変更していません。");
  }
  var raw = p.getProperty("SHIFT_EMPLOYEE_MASTER_JSON");
  if (!raw) throw new Error("従業員マスターが空です。何も変更していません。");
  var master = normalizeShiftEmployeeMaster(JSON.parse(raw));
  var importedNames = ["降旗", "藤川", "金井", "本道", "児玉"];
  var active = master.filter(function(item) { return item.active; });
  var keep = active.filter(function(item) { return item.name === "tesuto"; });
  if (keep.length !== 1 || active.some(function(item) {
    return item.id !== keep[0].id && importedNames.indexOf(item.name) < 0;
  })) {
    throw new Error("想定外の従業員がいます。何も変更していません。");
  }
  var backupKey = "SHIFT_EMPLOYEE_MASTER_BACKUP_20260927";
  if (p.getProperty(backupKey)) throw new Error("バックアップが既にあります。再実行せず確認してください。");
  p.setProperty(backupKey, raw);
  master.forEach(function(item) { if (item.id !== keep[0].id) item.active = false; });
  p.setProperty("SHIFT_EMPLOYEE_MASTER_JSON", JSON.stringify(master));
  Logger.log("複製用従業員マスターを復旧しました。操作員1名を残し、" + (active.length - 1) + "名を無効化しました。");
}

/** 複製用の3DB以外に向いたGASでは初期化を一切受け付けない。 */
function assertTemplateResetTarget() {
  var p = PropertiesService.getScriptProperties();
  var expected = {
    NOTION_SHIFT_DATABASE_ID: "665ef4863f6040e9b542586083764148",
    NOTION_SHIFT_REQUEST_DATABASE_ID: "a4d434ce8dbc4e9d860167971c631738",
    NOTION_STORE_DATABASE_ID: "23de2613332d4ef3b809d21006cec516"
  };
  Object.keys(expected).forEach(function(key) {
    if (normalizeNotionId(p.getProperty(key)) !== expected[key]) {
      throw new Error("複製用DBの設定が一致しません。初期化できません。");
    }
  });
  if (!p.getProperty("NOTION_API_KEY")) throw new Error("Notion接続が未設定です。");
  return p;
}

/** 複製用DBだけの旧備考欄を消す。シフトや申請は変更しない。1回最大25ページ。 */
function clearTemplateShiftRemarks(data) {
  try {
    requireShiftSession(data.sessionToken, "admin"); verifyShiftApiKey(data.shiftApiKey);
    var p = assertTemplateResetTarget();
    var apiKey = p.getProperty("NOTION_API_KEY"), dbId = p.getProperty("NOTION_SHIFT_DATABASE_ID");
    var rows = queryNotionDatabase(apiKey, dbId, { page_size: 100 });
    var targets = rows.filter(function(page) {
      var row = statusPageToObject(page);
      return String(row["備考"] || row["全体補足種別"] || row["全体補足内容"] || "").trim() !== "";
    });
    if (data.preview === true) return createJsonDataResponse({ success: true, count: targets.length, cleared: 0 });
    targets.slice(0, 25).forEach(function(page) {
      updateNotionPage(apiKey, page.id, {
        "備考": createRichTextProperty(""),
        "全体補足種別": createRichTextProperty(""),
        "全体補足内容": createRichTextProperty("")
      });
    });
    p.deleteProperty("SHIFT_DROPDOWN_MASTER_JSON");
    return createJsonDataResponse({ success: true, cleared: Math.min(targets.length, 25), remaining: Math.max(0, targets.length - 25) });
  } catch (error) { return createJsonResponse(false, error.message || "古い備考を削除できませんでした。"); }
}

function templateResetDatabases(p) {
  return [
    { key: "NOTION_SHIFT_DATABASE_ID", label: "シフト" },
    { key: "NOTION_SHIFT_REQUEST_DATABASE_ID", label: "希望届" },
    { key: "NOTION_STORE_DATABASE_ID", label: "店舗設定" }
  ];
}

function previewTemplateReset(data) {
  try {
    var session = requireShiftSession(data.sessionToken, "admin");
    verifyShiftApiKey(data.apiKey);
    var p = assertTemplateResetTarget();
    var dbs = templateResetDatabases(p);
    var counts = dbs.map(function(db) {
      return { label: db.label, count: queryNotionDatabase(p.getProperty("NOTION_API_KEY"), p.getProperty(db.key), { page_size: 100 }).length };
    });
    var operator = normalizeShiftEmployeeMaster(readShiftEmployeeMaster()).filter(function(item) {
      return item.id === session.employeeId && item.active;
    })[0];
    if (!operator) throw new Error("操作員が見つかりません。ログインし直してください。");
    var token = Utilities.getUuid();
    p.setProperty("SHIFT_TEMPLATE_RESET_AUTH", JSON.stringify({
      token: token, operator: operator, expiresAt: Date.now() + 60 * 60 * 1000
    }));
    return createJsonDataResponse({ success: true, counts: counts, employees: readShiftEmployeeMaster().length, token: token, operatorName: operator.displayName });
  } catch (error) { return createJsonResponse(false, error.message || "初期化対象を確認できませんでした。"); }
}

function runTemplateReset(data) {
  var lock = LockService.getScriptLock();
  try {
    if (!lock.tryLock(10000)) throw new Error("別の処理中です。少し待って再試行してください。");
    var session = requireShiftSession(data.sessionToken, "admin");
    verifyShiftApiKey(data.apiKey);
    var p = assertTemplateResetTarget();
    var authorization = JSON.parse(p.getProperty("SHIFT_TEMPLATE_RESET_AUTH") || "null");
    if (!authorization || authorization.token !== data.token ||
        authorization.operator.id !== session.employeeId || authorization.expiresAt <= Date.now() ||
        data.confirmation !== "初期化") throw new Error("確認が無効です。対象を再確認してください。");
    var apiKey = p.getProperty("NOTION_API_KEY");
    var archived = 0;
    var remaining = 0;
    var budget = 20;
    templateResetDatabases(p).forEach(function(db) {
      var rows = queryNotionDatabase(apiKey, p.getProperty(db.key), { page_size: Math.min(budget + 1, 100) });
      var selected = rows.slice(0, budget);
      selected.forEach(function(page) {
        requestNotion(apiKey, "https://api.notion.com/v1/pages/" + page.id, "patch", { archived: true });
        archived++;
      });
      budget -= selected.length;
      remaining += rows.length - selected.length;
    });
    // 次のバッチで最終確認を行う。失敗時は同じ確認トークンで安全に再試行できる。
    if (budget === 0 || remaining > 0) {
      return createJsonDataResponse({ success: true, done: false, archived: archived });
    }
    var businessKeys = [
      "SHIFT_CYCLE_MASTER_JSON", "SHIFT_AUTO_DRAFT_SETTINGS_JSON", "SHIFT_SPECIAL_DAY_RULES_JSON",
      "SHIFT_CALENDAR_PERIOD_JSON", "SHIFT_PERIOD_STATUSES_JSON", "SHIFT_PAID_LEAVE_BALANCES_JSON",
      "SHIFT_PAID_LEAVE_LEDGER_JSON", "SHIFT_AUDIT_LOG_JSON",
      "SHIFT_BOARD_VISIBILITY_FALLBACK_" + getStoreId(),
      "SHIFT_CORRECTION_VISIBILITY_" + getStoreId()
    ];
    businessKeys.forEach(function(key) { p.deleteProperty(key); });
    // ログイン用に操作員1名だけ残し、接続情報・ログインID・パスワードは保持する。
    p.setProperty("SHIFT_EMPLOYEE_MASTER_JSON", JSON.stringify([authorization.operator]));
    var all = p.getProperties();
    Object.keys(all).forEach(function(key) {
      if (key.indexOf("SHIFT_SESSION_") === 0) p.deleteProperty(key);
    });
    p.deleteProperty("SHIFT_TEMPLATE_RESET_AUTH");
    return createJsonDataResponse({ success: true, done: true, archived: archived });
  } catch (error) {
    return createJsonResponse(false, error.message || "初期化に失敗しました。");
  } finally { if (lock.hasLock()) lock.releaseLock(); }
}

/** Shared working-hour options for this cloned store only. */
function defaultShiftWorkTimeMaster() {
  return { revision: "", items: [
    { id: "default-1", start: "09:00", end: "18:00", nextDay: false, abbreviation: "早番", visible: true },
    { id: "default-2", start: "10:00", end: "19:00", nextDay: false, abbreviation: "遅番", visible: true },
    { id: "default-3", start: "09:00", end: "13:00", nextDay: false, abbreviation: "午前勤務", visible: true }
  ] };
}
function readShiftWorkTimeMaster() {
  var raw = PropertiesService.getScriptProperties().getProperty("SHIFT_WORK_TIME_MASTER_" + getStoreId());
  return raw ? JSON.parse(raw) : defaultShiftWorkTimeMaster();
}
function getShiftWorkTimeMaster(data) {
  try { requireShiftSession(data.sessionToken); return createJsonDataResponse({ success: true, master: readShiftWorkTimeMaster() }); }
  catch (error) { return createJsonResponse(false, error.message || "勤務時間設定を取得できませんでした。"); }
}
function saveShiftWorkTimeMaster(data) {
  var lock = LockService.getScriptLock();
  try {
    requireShiftSession(data.sessionToken, "admin");
    verifyShiftApiKey(data.shiftApiKey);
    if (!Array.isArray(data.items) || data.items.length > 60) throw new Error("勤務時間は60件まで登録できます。");
    var ids = {}, times = {};
    var items = data.items.map(function(item) {
      if (!item || !/^\d{2}:\d{2}$/.test(item.start) || !/^\d{2}:\d{2}$/.test(item.end)) throw new Error("時刻が正しくありません。");
      var start = item.start.split(":").map(Number), end = item.end.split(":").map(Number);
      if (start[0] > 23 || end[0] > 23 || start[1] > 59 || end[1] > 59) throw new Error("時刻が正しくありません。");
      var duration = end[0] * 60 + end[1] + (item.nextDay === true ? 1440 : 0) - start[0] * 60 - start[1];
      if (duration <= 0 || duration > 1440) throw new Error("開始・終了時刻と翌日設定を確認してください。");
      var id = sanitizeText(item.id, 100).trim(), key = item.start + "～" + item.end;
      if (!id || ids[id] || times[key]) throw new Error("勤務時間またはIDが重複しています。");
      ids[id] = true; times[key] = true;
      return { id: id, start: item.start, end: item.end, nextDay: item.nextDay === true, abbreviation: sanitizeText(item.abbreviation || "", 20).trim(), visible: item.visible !== false };
    });
    lock.waitLock(10000);
    var before = readShiftWorkTimeMaster();
    if (String(data.revision || "") !== String(before.revision || "")) throw new Error("他の端末で設定が更新されました。画面を開き直して変更してください。");
    var master = { items: items, revision: Utilities.getUuid() };
    PropertiesService.getScriptProperties().setProperty("SHIFT_WORK_TIME_MASTER_" + getStoreId(), JSON.stringify(master));
    appendShiftAudit(data, "勤務時間設定保存", getStoreId(), before, master);
    return createJsonDataResponse({ success: true, master: master });
  } catch (error) { return createJsonResponse(false, error.message || "勤務時間設定を保存できませんでした。"); }
  finally { if (lock.hasLock()) lock.releaseLock(); }
}
