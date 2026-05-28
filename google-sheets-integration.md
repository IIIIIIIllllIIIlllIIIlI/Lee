# Google 試算表 + Google Apps Script 整合說明

此文件說明如何把單字資料全部放在 Google 試算表，並用 Google Apps Script 做後端，讓前端第一頁從試算表讀取單字卡，管理頁新增單字時由 Apps Script 寫入試算表。

---

## 1. 建立 Google 試算表

1. 開啟 Google Sheets（https://sheets.google.com）。
2. 建立一個新的試算表，命名例如 `WordBank` 或 `VocabularyLibrary`。
3. 在第一張工作表（Sheet1）設定欄位：
   - A1：English
   - B1：Chinese
   - C1：Root
   - D1：Example
   - E1：POS
4. 建議把工作表名稱改為 `WordBank`。
5. 這張試算表就是你的資料庫，前端讀取卡片、後端寫入都會操作這張試算表。

---

## 2. 建立 Google Apps Script

1. 在試算表中點選「擴充功能」→「Apps Script」。
2. 建立一個新的 Apps Script 專案。
3. 在 `Code.gs` 中貼入以下程式碼：

```javascript
const SHEET_NAME = 'WordBank';

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(SHEET_NAME);
}

function fetchWords() {
  const sheet = getSheet();
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const rows = values.slice(1);
  return rows
    .filter(row => row[0])
    .map(row => ({
      english: row[0],
      chinese: row[1] || '',
      root: row[2] || '',
      example: row[3] || '',
      pos: row[4] || ''
    }));
}

function doGet(e) {
  const output = {
    success: true,
    data: fetchWords()
  };
  return ContentService
    .createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const english = (payload.english || '').trim();
    const chinese = (payload.chinese || '').trim();
    const root = (payload.root || '').trim();
    const example = (payload.example || '').trim();
    const pos = (payload.pos || '').trim();

    if (!english) {
      throw new Error('英文單字不可為空');
    }

    const sheet = getSheet();
    sheet.appendRow([english, chinese, root, example, pos]);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, message: '新增成功' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, message: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

> 這段 Apps Script 程式會：
>
> - `doGet`：回傳試算表中的所有單字資料
> - `doPost`：接收前端送來的單字內容並寫入試算表

---

## 3. 部署為 Web App

1. 在 Apps Script 編輯器中，點選「部署」→「新版部署」。
2. 選擇「網站應用程式」。
3. 設定：
   - 描述：例如 `WordBank API`。
   - 執行應用程式的身分：`我`（你的帳號）。
   - 允許存取的對象：選 `任何人，即使匿名使用者`。
4. 點選「部署」。
5. 取得 Web 應用程式網址（例如 `https://script.google.com/macros/s/XXXX/exec`）。

> 如果你要保護資料，只允許授權存取，可改成 `任何有 Google 帳戶的人`，但前端就需要 OAuth 權限。最簡單的是先使用 `任何人，即使匿名`。

---

## 4. 前端讀取 Google 試算表資料

1. 將前端主頁的卡片頁面改成從 Apps Script Web App 讀資料。
2. 範例 `fetch` 程式：

```javascript
const API_URL = 'https://script.google.com/macros/s/YOUR_DEPLOY_ID/exec';

async function loadFlashcards() {
  const response = await fetch(API_URL);
  const result = await response.json();
  if (result.success) {
    const cards = result.data;
    // 將 cards 渲染到畫面上
  } else {
    console.error('讀取失敗', result.message);
  }
}

loadFlashcards();
```

3. 前端可以在頁面載入時呼叫 `loadFlashcards()`，然後把回傳的每筆資料顯示成卡片。

---

## 5. 管理頁新增單字後存入試算表

1. 管理頁的表單欄位應包含：
   - 英文單字（english）
   - 中文翻譯（chinese）
   - 字根分析（root）
   - 例句（example）
   - 詞性（pos）
2. 使用 `fetch` 做 POST 請求將資料送給 Apps Script：

```javascript
async function saveWord(wordData) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(wordData)
  });
  return await response.json();
}

const newWord = {
  english: 'apple',
  chinese: '蘋果',
  root: '無',
  example: 'I eat an apple every day.',
  pos: 'noun'
};

saveWord(newWord).then(result => {
  if (result.success) {
    alert('已儲存');
  } else {
    alert('儲存失敗：' + result.message);
  }
});
```

3. 成功後，前端應清空表單並顯示成功訊息。

---

## 6. 前端與後端整合流程

### 前端第一頁（讀取單字卡）

1. 網頁載入時呼叫 `GET` API：`fetch(API_URL)`。
2. 取得 JSON 結構後，取出 `data` 陣列。
3. 用 `english` 當卡片正面，`chinese` 當卡片背面。
4. 也可同步顯示 `root`、`example`、`pos` 作為題目補充資訊。

### 管理頁（新增單字）

1. 使用者填寫表單欄位。
2. 按下「儲存單字」按鈕後：
   - 檢查 `english` 不可為空
   - 送出 POST 請求到 Apps Script Web App
3. 後端收到後，寫入試算表。
4. 若成功，前端顯示「新增成功」並可刷新單字庫清單。

---

## 7. Google 試算表資料格式建議

如果你希望試算表同時做管理頁與前端卡片存取，建議每欄位如下：

| 欄位 | 描述 |
| --- | --- |
| English | 英文單字 |
| Chinese | 中文翻譯 |
| Root | 字根 / 詞源分析 |
| Example | 例句 |
| POS | 詞性 |


## 8. 進階建議

- 若未來要更嚴格的存取控制，可改用 Google OAuth + Apps Script `doGet` 驗證。
- 若要在前端顯示資料編輯、刪除功能，可以再實作 `doPut` / `doDelete`。
- 若資料量大，可在試算表中加 `ID` 欄位，並在 Apps Script 端用該 ID 做更新與刪除。

---

## 9. 注意事項

- Apps Script Web App 部署後，若修改程式碼需要重新部署新版。
- 若你的前端是直接打開 `index.html`（file://），可能會遇到瀏覽器跨域或檔案讀取問題，建議使用本機伺服器來開發，例如 `Live Server` 或簡單 `python -m http.server`。
- `ContentService` 會回傳 JSON，前端接收時要用 `response.json()`。

---

## 10. 範例操作順序

1. 建試算表 → 加欄位 → 開 Apps Script
2. 寫 `doGet()` / `doPost()` 程式 → 部署 Web App
3. 前端讀取 `GET` API 顯示卡片
4. 管理頁表單 POST 單字到 API
5. 試算表自動新增資料
6. 若卡片頁需更新，重新讀取 API
