# omniverseWeb

在試用期內老闆要求趕快把 web 的管理系統在 2 天內生出來，我只能用 AI 生成了 XDDD

---

OmniverseWeb 的 React 前端，提供帳號管理、登入、Admin 控制台與 Project 管理功能。

## 功能

- **登入頁** (`/login`)：Email + 密碼登入，含密碼顯示切換
- **註冊頁** (`/register`)：建立新帳號
- **忘記密碼** (`/forgot-password`)：寄送重設連結（demo 模式直接顯示 token）
- **重設密碼** (`/reset-password?token=...`)：使用 token 重設密碼
- **儀表板** (`/dashboard`)：個人專案總覽
- **帳號設定** (`/account`)：修改個人資料與變更密碼
- **專案管理** (`/projects`)、**專案詳情** (`/projects/:id`)：建立 / 編輯 / 刪除專案、管理成員
- **Session 串流** (`/sessions`)、**Session 詳情** (`/sessions/:id`)：管理 Omniverse Kit App Streaming 的 WebRTC 連線設定，內建 WebRTC viewer（host + port + signaling 路徑），支援即時串流、靜音、全螢幕與連線統計
- **系統管理** (`/admin`)：僅管理員可進入，CRUD 所有使用者、啟用 / 停用、角色切換

## 安裝與啟動

```bash
npm install
npm run dev
```

預設啟動於 http://localhost:5173

## 測試帳號

| 角色 | Email | 密碼 |
| --- | --- | --- |
| Admin | `admin@omniverse.web` | `admin123` |
| User | `demo@omniverse.web` | `demo1234` |

## 架構

```
src/
├── App.jsx                  # 路由設定
├── main.jsx                 # 入口
├── context/
│   └── AuthContext.jsx      # 全域驗證 state
├── services/
│   ├── authService.js       # 帳號 / 認證 (mock，使用 localStorage)
│   ├── projectService.js    # 專案 CRUD (mock)
│   └── sessionService.js    # Session CRUD (mock)
├── components/
│   ├── AppLayout.jsx        # 內部頁 sidebar layout
│   ├── AuthCard.jsx         # 登入相關頁面卡片
│   ├── WebRTCViewer.jsx     # WebRTC 串流播放元件
│   ├── ProtectedRoute.jsx   # 未登入導向 /login
│   └── AdminRoute.jsx       # 非管理員導向 /dashboard
├── pages/                   # 所有頁面
└── styles/global.css
```

目前 `services/` 內為 mock 實作（資料寫入 `localStorage`），若要接上真實 API，
只需替換 `authService.js` / `projectService.js` / `sessionService.js` 內函式為 `fetch` 呼叫即可，
其他元件無需更動。

## WebRTC Session 串流

`src/components/WebRTCViewer.jsx` 內建一個泛用的 WebRTC 接收端：

- WebSocket 連線到 `ws(s)://{host}:{port}{signalingPath}`
- 透過 JSON 訊息協定交換 SDP 與 ICE：
  - 接收 `{ type: 'offer', sdp }` → 回應 `{ type: 'answer', sdp }`
  - 雙向交換 `{ type: 'ice', candidate }`
  - 連線初始送出 `{ type: 'ready', sessionId }`

若您的 Omniverse Kit Streaming Server 使用不同的訊號協定，
在 `WebRTCViewer.jsx` 頂端調整 `MSG` 常數或 `ws.onmessage` 處理邏輯即可。
ICE / STUN server 也可在同檔案的 `ICE_SERVERS` 設定。
