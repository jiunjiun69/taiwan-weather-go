# 台灣天氣行動站

快速比較高雄、嘉義與全台 368 個鄉鎮市區的天氣，協助判斷通勤或出門是否需要帶雨具。

## 資料更新方式

- 天氣預報：使用者開啟或重新整理網頁時，直接讀取 Open-Meteo 最新預報。
- 官方警特報與颱風資訊：GitHub Actions 每 10 分鐘同步中央氣象署公開資訊並重新部署。
- 深色模式與常用地點：保存在使用者自己的瀏覽器中。

不需要手動更新天氣資料。

## 本機執行

```bash
npm ci
npm run fetch:alerts
npm run dev
```

## 正式建置

```bash
npm run fetch:alerts
npm run build
```

## GitHub Pages

Repository 的 Pages 發布來源需設定為 **GitHub Actions**。每次推送到 `main`，以及每 10 分鐘的排程，都會自動建置並發布網站。

一般天氣資料來自 [Open-Meteo](https://open-meteo.com/)，警特報與颱風資訊以[中央氣象署](https://www.cwa.gov.tw/)為準。
