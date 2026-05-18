# omniverseWeb

在試用期內老闆要求趕快把 web 的管理系統在 2 天內生出來，我只能用 AI 生成了 XDDD

---

OmniverseWeb 的全端應用，基於 **Next.js 14 (App Router) + TypeScript + Prisma + SQLite**，
提供帳號管理、登入、Admin 控制台、Project 管理、與 Omniverse Kit App Streaming 的 Session 串流。

## 技術棧

- **前端 / 後端**：Next.js 14 App Router、React 18、TypeScript
- **資料庫**：SQLite via Prisma
- **驗證**：自寫 HttpOnly cookie session（JWT signed with `jose`） + `bcryptjs` 密碼雜湊
- **WebRTC**：內建 viewer，WebSocket signaling 交換 SDP / ICE

## 功能

- **登入 / 註冊 / 忘記密碼 / 重設密碼**
- **儀表板**：個人專案 / Session 總覽
- **帳號設定**：修改個人資料與變更密碼
- **專案管理**：建立 / 編輯 / 刪除專案、管理成員
- **Session 串流**：管理 Omniverse Kit App Streaming 的 WebRTC 連線設定，內建 viewer（fps / bitrate / 全螢幕 / 靜音）
- **系統管理**（Admin）：CRUD 全部使用者、啟用 / 停用、角色切換

## 快速開始

```bash
# 1. 安裝相依
npm install

# 2. 複製環境變數範本，並產生 SESSION_SECRET（≥ 32 字元）
cp .env.example .env

# 3. 建立 SQLite schema 並 seed 預設資料
npm run db:push
npm run db:seed

# 4. 啟動開發伺服器
npm run dev
# → http://localhost:3000
```

## 測試帳號

| 角色 | Email | 密碼 |
| --- | --- | --- |
| Admin | `admin@omniverse.web` | `admin123` |
| User | `demo@omniverse.web` | `demo1234` |

## 架構

```
src/
├── app/
│   ├── layout.tsx              # 根 layout (注入 AuthProvider，含 SSR user)
│   ├── globals.css
│   ├── page.tsx                # 重導向到 /dashboard
│   ├── login/                  # 公開頁
│   ├── register/
│   ├── forgot-password/
│   ├── reset-password/
│   ├── (app)/                  # Route group，含 protected layout
│   │   ├── layout.tsx          # 未登入時 redirect 到 /login
│   │   ├── dashboard/
│   │   ├── account/
│   │   ├── projects/
│   │   ├── sessions/
│   │   └── admin/
│   └── api/                    # Route Handlers (後端 API)
│       ├── auth/{login,logout,register,me,change-password,forgot-password,reset-password}/
│       ├── users/[...]/        # Admin 使用者管理
│       ├── projects/[...]/     # 專案 CRUD
│       └── sessions/[...]/     # Session CRUD
├── components/
│   ├── AppLayout.tsx           # 內部頁 sidebar
│   ├── AuthCard.tsx            # 登入頁卡片
│   └── WebRTCViewer.tsx        # WebRTC 串流播放
├── context/
│   └── AuthContext.tsx         # 全域驗證 state
├── lib/
│   ├── auth.ts                 # session cookie / 密碼雜湊 / 權限檢查
│   ├── db.ts                   # PrismaClient singleton
│   ├── api.ts                  # API response helpers (ok / fail / handleError)
│   ├── api-client.ts           # 前端 fetch wrapper
│   └── types.ts                # 共用型別
├── middleware.ts               # Edge middleware：未登入 redirect、Admin 守衛
prisma/
├── schema.prisma               # User / Project / ProjectMember / StreamSession / ResetToken
└── seed.ts                     # 種子資料
```

## WebRTC 訊號協定

`src/components/WebRTCViewer.tsx` 連線到 `ws(s)://{host}:{port}{signalingPath}`，
以 JSON 訊息交換 SDP / ICE：

- 連線後送出 `{ type: 'ready', sessionId }`
- 接收 `{ type: 'offer', sdp }` → 回應 `{ type: 'answer', sdp }`
- 雙向 `{ type: 'ice', candidate }`

若您的 Omniverse Kit Streaming Server 使用不同訊號協定，調整檔案頂端的 `MSG` 常數
或 `ws.onmessage` 處理邏輯即可。ICE / STUN 伺服器在同檔案 `ICE_SERVERS` 設定。

## 環境變數

| 名稱 | 必填 | 說明 |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | SQLite 路徑，預設 `file:./dev.db` |
| `SESSION_SECRET` | ✅ | 至少 32 字元的隨機字串，用以簽署 session cookie |

## 注意事項

- 開發模式下 `/api/auth/forgot-password` 會把 reset token 直接回傳給前端方便測試；
  正式環境應改為寄送 email 並移除 token 回傳。
- 預設使用 STUN（`stun:stun.l.google.com:19302`）；正式部署若需要穿透 NAT，請改為自家 TURN。
