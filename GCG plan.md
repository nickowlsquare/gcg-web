# GUNDAM CARD GAME — 自動組牌網站 開發藍圖 (PROJECT_PLAN.md)

> 給 Claude Code 的開發指南。一個**網站**（web app），不是手機 app。
> 產品 = **兩個入口、共用同一個引擎**。每個里程碑都有可直接複製給 Claude Code 的 prompt。
> **請依里程碑順序開發，不要跳。**

---

## 0. 產品定義：兩個功能，一個引擎

兩個入口共用同一個 autofill 引擎，差別只在功能 2 多餵一個 `counterScore`。

**功能 1 — 順著組（Build）**
揀色 → 揀 1–2 隻或更多 LR 做主軸 → 揀打法 → tool 幫你補滿到合法 50 + 10 張。

**功能 2 — 剋制組（Counter）**
先揀一個熱門 top deck 做**目標** → 然後照樣揀返**自己**嘅色、LR、打法 → tool 幫你組一副剋嗰個 top deck 嘅牌。

```
功能1 = autofill(myColors, myLRs, myStrategy)
功能2 = autofill(myColors, myLRs, myStrategy) + counterScore(目標 top deck)
```

> 設計重點：**功能 2 = 功能 1 + 一個 counterScore**。兩個入口共用 ~90% 的程式。
> counter deck 永遠係「我自己想用嘅牌」去剋對方，唔係照抄一套剋制模板。

---

## 1. 遊戲規則（規則引擎的依據，硬約束）

- 主牌組**剛好 50 張**；資源牌組（resource deck）**剛好 10 張**。
- 同一張卡號**最多 4 張**（資源卡不受此限）。
- 一副牌**最多 2 種顏色**（共 4 色）。
- 四種卡型：**Unit / Pilot / Command / Base**。
- 官方建議配比：Unit 25–28、Pilot 6–8、Command 8–10、Base 4–6。
- **Link**：Pilot 配上符合 Link 條件的 Unit，可當回合攻擊並解鎖額外效果 → 組牌協同的核心。
- 資源每回合 +1，**Level / Cost 曲線**很關鍵，高費卡太多會卡手。

---

## 2. 技術選型

- **Next.js 14 (App Router) + TypeScript + Tailwind CSS** — 純網站。
- 卡表初期：repo 內 JSON；要查詢再上 SQLite（better-sqlite3 或 Drizzle）。
- 測試：**Vitest**。規則引擎與評分邏輯必須有單元測試。
- 部署：Vercel。

**設計原則**：legality / scoring / autofill / counter 一律寫成 `lib/` 純函式，UI 只呼叫與呈現。

---

## 3. 資料模型（兩層，缺一不可）

1. **卡片資料庫** — 每張卡屬性與效果，所有推理的基礎。
2. **牌組語料** — 你**策展**的 top deck 清單（見第 5 節資料來源說明）。

```ts
// types/card.ts
export type CardColor = "blue" | "green" | "red" | "white";
export type CardType = "unit" | "pilot" | "command" | "base" | "resource";
export type Strategy = "aggro" | "midrange" | "control" | "attrition";

export interface Card {
  id: string;            // 卡號，如 "GD01-015"
  name: string;
  type: CardType;
  colors: CardColor[];   // 1+ 色；無色為 []
  level: number | null;
  cost: number | null;
  ap?: number;           // unit / base
  hp?: number;           // unit / base
  isLR?: boolean;        // 是否 LR（可做主軸的卡）
  traits: string[];      // 陣營/系列標籤
  keywords: string[];    // 如 "repair", "blocker"
  linkConditions?: string[]; // pilot：可 Link 的 Unit
  text: string;
  set: string;
  rarity: string;
}

export interface DeckEntry { id: string; count: number; }
export interface Deck {
  colors: CardColor[];   // ≤ 2
  main: DeckEntry[];     // 加總 = 50
  resource: DeckEntry[]; // 加總 = 10
}

// 策展的 top deck 語料（功能 2 + meta 用）
export interface TopDeck {
  name: string;          // archetype 名，如 "PB Barbatos"
  colors: CardColor[];
  keyCards: string[];    // 關鍵卡 id
  strategy: Strategy;
  list?: DeckEntry[];    // 有完整清單就放，冇就靠 keyCards
  source: string;        // 情報來源
  date: string;          // ISO
  placement?: number;    // 名次（1 = 冠軍）
}
```

---

## 4. 核心演算法

### 4.1 合法性引擎 `lib/legality.ts`
純函式 `validateDeck(deck, cardDb)`，回傳結構化錯誤清單：
50 主牌、10 資源、≤4 同卡號、≤2 色、每張卡顏色 ⊆ 牌組顏色、卡型範圍（warning）。

### 4.2 打法 profile `lib/strategy.ts`（4 個，貼鋼彈、好維護）

| 打法 | 中文 | 偏好 |
|---|---|---|
| `aggro` | 快攻 | 低 cost 曲線、搶血、低費 Unit 多 |
| `midrange` | 中速 | Link 爆發、節奏、中費為主 |
| `control` | 控場 | 高費、removal、Base/防牆、穩住反殺 |
| `attrition` | 消耗 | 資源優勢、抽牌/回復、拖長局 |

每個 profile = 一組權重（理想 cost 曲線形狀 + 偏好 keyword 清單 + 卡型微調）。

### 4.3 半自動補牌 `lib/autofill.ts`（系統靈魂，兩個功能共用）

輸入：`{ colors, lrs: DeckEntry[], strategy }`

1. **LR 做 core 鎖死必入**：`lrs` 最少 2 隻、可多；autofill 圍住佢哋砌，保證 Link/trait 配合。
2. **算缺口**：卡型目標抓建議配比中點（Unit 26 / Pilot 7 / Command 9 / Base 5），再按 strategy profile 微調。
3. **候選池** = 顏色 ⊆ 選定顏色（含無色）。
4. **評分每張候選**（加權總分）：
   - `linkScore` — 能否同核心 LR/Unit 形成 Link（**最高權重**）。
   - `traitScore` — 同 core 共享 trait / 系列。
   - `curveScore` — 填補 cost 曲線凹洞，曲線理想形狀由 strategy 決定。
   - `strategyScore` — 卡嘅 keyword 符合 strategy profile 嘅程度。
   - `metaScore` — 喺 top deck 語料中嘅共現頻率（語料夠先有效）。
   - `powerScore` — 稀有度 / 基礎強度先驗。
   - `counterScore` — **只在功能 2 啟用**，見 4.4。
5. **分桶貪婪填滿**：每卡型各自填，挑分數最高且不破壞約束嘅卡，塞 1–4 張。
6. **資源牌組**：照主牌組顏色需求比例分配 10 張。
7. **合法性修補** → 違規回頭調整。
8. **輸出牌組 + 每張填充卡理由**。

### 4.4 Counter 評分 `lib/counter.ts`（功能 2）

讀目標 `TopDeck` 嘅指紋（colors / keyCards / strategy / 曲線），算每張候選卡嘅 `counterScore`，加進 4.3 嘅總分。

> 誠實劃線：卡牌「剋制」無法純靠規則算出保證勝率。以下係**有用嘅啟發式近似**。

| 目標特徵 | 提高 counterScore 的方向 |
|---|---|
| 低 cost / aggro | 便宜防牆 Unit、高 HP Base、早期 removal、shield 回復 |
| 高 cost / control | 快速 aggro 搶喺 stabilize 前打死、手牌干擾 |
| 重度依賴 Link | 配對前解掉目標 Unit、拆/退回已配對 Unit |
| 單一色 / 單一關鍵卡 | 針對性 hate 卡、針對該 win condition 嘅解 |

### 4.5 Meta 偵測 `lib/meta.ts`（進階，語料夠先做）
把 top deck 語料分群成 archetype，按 出現頻率 × 時間衰減 × 名次 評分，輸出 tier list 俾功能 2 揀目標。

### 4.6 回饋迴路（最後，突破啟發式天花板）
使用者記低「我這套 vs 對方 archetype，贏/輸」，累積後用真實結果調 counterScore 權重。

---

## 5. 資料來源（重要：策展，唔好爬蟲）

top deck 語料嚟自 tcgtopdecks-hq.com **加網上整合**（賽報 / YouTube / Discord），但要用乾淨方式：

- 嗰個網嘅**卡圖同卡文版權屬 Bandai Namco**、係 WordPress 站、冇公開 API。**唔好成個 scrape**（有 ToS／版權風險，佢改版你就爆）。
- 正確做法：你**策展**一份 `data/top-decks.json`（`TopDeck[]`）—— 邊隻 archetype、咩色、關鍵卡、名次、日期、來源。呢啲係事實／衍生數據，自己手入或半自動整理。
- 卡圖／卡文唔好整批轉存散布；要顯示就指返官方或最小量處理。

換句話：個 tool 食嘅係**你維護嘅 JSON 語料**，嗰個網只係其中一個情報來源。

---

## 6. 里程碑（兩個功能對齊）

| 里程碑 | 內容 | 對應 |
|---|---|---|
| **M0** | 專案骨架、types、樣本卡 JSON、/cards 卡片清單頁 | 地基 |
| **M1** | /builder 手動 deck builder：加減卡、即時合法性、卡型/曲線計數 | 地基 |
| **M2** | `lib/legality.ts` 純函式 + Vitest 測試 | 地基 |
| **M3** | `lib/strategy.ts` 4 個打法 profile + `lib/autofill.ts` v1 | **功能 1 核心** |
| **M4** | **功能 1 完成**：揀色 → 揀 LR(≥2) → 揀打法 → 自動補滿 + 理由 + 資源牌組 + 匯出 | **功能 1 上線** |
| **M5** | 策展 `data/top-decks.json`，做 /top-decks 清單頁俾人瀏覽揀目標 | 功能 2 前置 |
| **M6** | `lib/counter.ts` counterScore + **功能 2**：揀目標 top deck → 揀自己色/LR/打法 → 出 counter deck + 理由 | **功能 2 上線 (A 版)** |
| **M7** | `lib/meta.ts` meta 偵測 + tier list，功能 2 改由 tier list 揀目標 | 功能 2 升級 (B 版) |
| **M8** | 對戰結果回饋迴路、權重學習 | 突破啟發式 |

**M0–M4 完成 = 功能 1 已經係個能用嘅產品。** M5–M6 解鎖功能 2。M7–M8 係升級包。

---

## 7. 可直接複製給 Claude Code 的 Prompt

### M0
```
建立 Next.js 14 (App Router) + TypeScript + Tailwind 專案。
依 PROJECT_PLAN.md 第 3 節定義 types/card.ts。
data/cards.json 放 12 張涵蓋四卡型的範例卡（其中 2 張 isLR:true）。
做 /cards 頁網格渲染，可依顏色/卡型篩選。
```

### M1
```
做 /builder 手動 deck builder：左側卡片清單(可搜尋/篩選)，右側牌組(主50/資源10分開)。
點卡加減、顯示張數(上限4)。即時顯示 主(x/50)、資源(x/10)、各卡型對照建議配比、cost 曲線長條圖。先不自動。
```

### M2
```
寫 lib/legality.ts 純函式 validateDeck(deck, cardDb) 回傳結構化錯誤：
主50、資源10、同卡號≤4、≤2色、每卡顏色⊆牌組色、卡型範圍(warning)。
Vitest 每條規則通過+失敗案例。/builder 即時驗證改用它。
```

### M3
```
寫 lib/strategy.ts：4 個 Strategy profile(aggro/midrange/control/attrition)，
每個含理想 cost 曲線形狀 + 偏好 keyword + 卡型微調。
寫 lib/autofill.ts：autofill({colors, lrs, strategy})，依 PROJECT_PLAN 4.3：
LR 鎖死必入(≥2)、算卡型缺口、評分(link/trait/curve/strategy/power)、分桶貪婪填到 50+10 合法、每張附理由。
Vitest 確保輸出永遠合法。
```

### M4
```
做 /build 頁（功能1）：揀色(≤2) → 揀 LR(≥2，可多) → 揀打法 → 「自動補滿」呼叫 autofill。
顯示成品牌組、每張填充卡理由、cost 曲線、資源牌組(自動配色比例)，可匯出/複製。
```

### M5
```
建立 data/top-decks.json (TopDeck[])，先放 4–6 個熱門 archetype(name/colors/keyCards/strategy/source/date)。
做 /top-decks 頁瀏覽，每個 archetype 顯示指紋(色/關鍵卡/打法)。資料係策展，不要爬蟲。
```

### M6
```
寫 lib/counter.ts：依 PROJECT_PLAN 4.4 弱點表，由目標 TopDeck 算每張候選的 counterScore。
做 /counter 頁（功能2）：先揀一個 top deck 做目標 → 再揀自己的色/LR/打法 →
呼叫 autofill 並把 counterScore 加進總分 → 出 counter deck + 「點解咬到對方」理由。
```

### M7
```
寫 lib/meta.ts：把 top-decks 語料分群成 archetype，按 頻率×時間衰減×名次 評分輸出 tier list。
做 /meta 頁呈現 tier list，功能2 的目標改由 tier list 揀。
```

---

## 8. 設計方向（網站視覺，M1/M4 參考）

- 主題機動戰士。signature 放喺 **cost 曲線視覺化** 同 **Link 連線提示**（核心 LR 同可 Link 卡之間畫關聯）——呢個係產品獨有記憶點。
- 卡型用一致顏色語意(Unit/Pilot/Command/Base 各一色)，全站沿用。
- 功能 1 同功能 2 入口要清楚分流，但牌組呈現元件共用。
- 空狀態做引導：「揀個色同至少兩隻 LR，等系統幫你補滿。」
- 響應式到手機、focus 可見、尊重 reduced motion。
- 避免 AI 預設長相(米色+高對比 serif+赤陶色)，顏色由遊戲四色世界觀去推。

---

## 9. 給開發者的提醒

- 邏輯全入 `lib/` 純函式，UI 只呼叫。**功能 2 = 功能 1 + counterScore**，務必共用 autofill。
- 任何「自動」上線前，先確定 `validateDeck` 正確且有測試。
- 別承諾「保證勝率」；counter 係啟發式近似，文案要誠實。
- top deck 係策展 JSON，唔好爬個網；卡圖/卡文版權屬 Bandai，謹慎散布。
