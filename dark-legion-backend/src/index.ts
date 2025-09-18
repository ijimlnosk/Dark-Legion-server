import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { devAuth } from "./middleware/auth";
import authRouter from "./routes/auth";

import catalogRouter from "./routes/catalog";
import meRouter from "./routes/me";
import summonRouter from "./routes/summon";
import battlesRouter from "./routes/battles";
import manualBattlesRouter from "./routes/battles.manual";
import unitsRouter from "./routes/units";
import fusionRouter from "./routes/fusion";

const app = express();
app.use(express.json());

// ✅ CORS 설정
app.use(
  cors({
    origin: "http://localhost:5173", // Vite 프론트 주소
    credentials: true, // 필요시 쿠키/인증 허용
  })
);
// 정적 파일(유닛 이미지)
app.use(
  "/units",
  express.static(path.join(__dirname, "..", "public", "units"))
);

// 공개 카탈로그
app.use("/catalog", catalogRouter);

app.use("/auth", authRouter);
// 이후는 인증 필요
app.use(devAuth);
app.use("/me", meRouter);
app.use("/summon", summonRouter);
app.use("/battles", battlesRouter);
app.use("/battles", manualBattlesRouter);
app.use("/units", unitsRouter);
app.use("/fusion", fusionRouter);

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () =>
  console.log(`API listening on http://localhost:${port}`)
);
