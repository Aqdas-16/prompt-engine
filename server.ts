import  "dotenv/config";
import express from "express";
let createViteServer: any;

import path from "path";
import admin from "firebase-admin";
import rateLimit from "express-rate-limit";
import { generatePrompt, generateChat } from "./llmService";
import db from "./db";
import Razorpay from "razorpay";
import crypto from "crypto";
import cron from "node-cron";

// =========================
// INIT FIREBASE ONCE
// =========================
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

// =========================
// CRON RESET
// =========================
cron.schedule("0 0 * * *", async () => {
  try {
    const users = await db.user.findMany({
      where: { plan: { in: ["free", "pro"] } },
    });

    const now = new Date();

    for (const user of users) {
      const resetDays = user.billingCycle === "yearly" ? 365 : 30;

      const diff =
        (now.getTime() - user.planStartDate.getTime()) / (1000 * 60 * 60 * 24);

      if (diff >= resetDays) {
        await db.user.update({
          where: { id: user.id },
          data: {
            usageCount: 0,
            normalUsageCount: 0,
            advancedUsageCount: 0,
            planStartDate: now,
          },
        });
      }
    }
  } catch (error) {
    console.error("Cron Job Error:", error);
  }
});

// =========================
// AUTH
// =========================
const verifyAuth = async (req: any, res: any, next: any) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = header.split(" ")[1];
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
};

const verifyAuthOptional = async (req: any, res: any, next: any) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) return next();

    const token = header.split(" ")[1];
    req.user = await admin.auth().verifyIdToken(token);
  } catch {}
  next();
};

// =========================
// SERVER START
// =========================
async function startServer() {
  const app = express();
  app.set("trust proxy", 1);
  app.use(express.json());

  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      max: 200,
      validate: { trustProxy: false, xForwardedForHeader: false },
    }),
  );

  // =========================
  // USER INFO (/api/me)
  // =========================
  app.get("/api/me", verifyAuth, async (req: any, res) => {
    try {
      const firebaseUid = req.user.uid;
      const userEmail = req.user.email || `${firebaseUid}@anonymous.local`;

      let user = await db.user.findFirst({
        where: req.user.email
          ? { OR: [{ firebaseUid }, { email: req.user.email }] }
          : { firebaseUid },
      });
      if (user) {
        user = await db.user.update({
          where: { id: user.id },
          data: {
            firebaseUid,
            email: userEmail,
            name: req.user.name || null,
            photoURL: req.user.picture || null,
          },
        });
      } else {
        user = await db.user.create({
          data: {
            firebaseUid,
            email: userEmail,
            name: req.user.name || null,
            photoURL: req.user.picture || null,
            plan: "free",
            billingCycle: "monthly",
            usageCount: 0,
            normalUsageCount: 0,
            advancedUsageCount: 0,
            planStartDate: new Date(),
          },
        });
        await db.counter.update({
          where: { id: "global" },
          data: { usersCount: { increment: 1 } },
        });
      }

      console.log(
        `[LOGIN] Firebase UID: ${firebaseUid} | DB User ID: ${user.id}`,
      );

      const subscriptions = await db.subscription.findMany({
        where: {
          userId: user.id,
          status: "active",
        },
        orderBy: {
          endDate: "desc",
        },
        take: 1,
      });

      const activeSub = subscriptions.length > 0 ? subscriptions[0] : null;

      return res.json({
        ...user,
        plan: activeSub?.plan || user.plan || "free",
        billingCycle: activeSub?.billingCycle || user.billingCycle || "monthly",
        subscription: activeSub,
      });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: "User fetch failed" });
    }
  });

  // =========================
  // GLOBAL STATS (/api/stats)
  // =========================
  app.get("/api/stats", async (req, res) => {
    try {
      const counter = await db.counter.findUnique({
        where: { id: "global" }
      });

      return res.json({
        totalPrompts: counter?.promptsGenerated || 0,
        totalUsers: counter?.usersCount || 0,
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Stats fetch failed" });
    }
  });

  // =========================
  // UPDATE /api/generate
  // =========================
  app.post("/api/generate", verifyAuthOptional, async (req: any, res) => {
    try {
      const { user_input, mode } = req.body;
      const validMode = mode === "advanced" ? "advanced" : "normal";

      if (!user_input) {
        return res.status(400).json({ error: "Invalid input" });
      }

      // GUEST
      if (!req.user) {
        if (validMode === "advanced") {
          return res.status(403).json({ error: "Login required" });
        }

        let out = await generatePrompt(user_input, validMode);
        out += "\n\nGenerated by Prompt Engine";

        await db.counter.update({
          where: { id: "global" },
          data: { promptsGenerated: { increment: 1 } },
        });

        return res.json({ prompt: out });
      }

      const firebaseUid = req.user.uid;
      const userEmail = req.user.email || `${firebaseUid}@anonymous.local`;

      let user = await db.user.findFirst({
        where: req.user.email
          ? { OR: [{ firebaseUid }, { email: req.user.email }] }
          : { firebaseUid },
      });
      if (user) {
        user = await db.user.update({
          where: { id: user.id },
          data: {
            firebaseUid,
            email: userEmail,
            name: req.user.name || null,
            photoURL: req.user.picture || null,
          },
        });
      } else {
        user = await db.user.create({
          data: {
            firebaseUid,
            email: userEmail,
            name: req.user.name || null,
            photoURL: req.user.picture || null,
            plan: "free",
            billingCycle: "monthly",
            usageCount: 0,
            normalUsageCount: 0,
            advancedUsageCount: 0,
            planStartDate: new Date(),
          },
        });
        await db.counter.update({
          where: { id: "global" },
          data: { usersCount: { increment: 1 } },
        });
      }

      const userId = user.id;

      const activeSub = await db.subscription.findFirst({
        where: {
          userId,
          status: "active",
          endDate: { gt: new Date() },
        },
        orderBy: { createdAt: "desc" },
      });

      const activePlan = activeSub?.plan || user.plan || "free";
      const userPlanStartDate = activeSub?.startDate || user.planStartDate;

      // RESET
      const now = new Date();
      const resetDays = activeSub?.billingCycle === "yearly" ? 365 : 30;

      const diff =
        (now.getTime() - userPlanStartDate.getTime()) / (1000 * 60 * 60 * 24);

      if (diff >= resetDays && activePlan !== "premium") {
        user = await db.user.update({
          where: { id: userId },
          data: {
            usageCount: 0,
            normalUsageCount: 0,
            advancedUsageCount: 0,
            planStartDate: now, // update the reference date locally as well
          },
        });
      }

      // LIMITS
      if (activePlan === "free" && user.usageCount >= 5) {
        return res.status(403).json({ error: "Limit reached" });
      }

      if (activePlan === "pro") {
        if (validMode === "normal" && user.normalUsageCount >= 30) {
          return res.status(403).json({ error: "Normal limit reached" });
        }
        if (validMode === "advanced" && user.advancedUsageCount >= 10) {
          return res.status(403).json({ error: "Advanced limit reached" });
        }
      }

      let out = await generatePrompt(user_input, validMode);

      if (activePlan === "free") {
        out += "\n\nGenerated by Prompt Engine";
      }

      await db.promptHistory.create({
        data: {
          userId,
          input: user_input,
          output: out,
          mode: validMode,
        },
      });

      // UPDATE USAGE
      if (activePlan === "free") {
        await db.user.update({
          where: { id: userId },
          data: { usageCount: { increment: 1 } },
        });
      } else if (activePlan === "pro") {
        const field =
          validMode === "normal" ? "normalUsageCount" : "advancedUsageCount";

        await db.user.update({
          where: { id: userId },
          data: { [field]: { increment: 1 } },
        });
      }

      await db.counter.update({
        where: { id: "global" },
        data: { promptsGenerated: { increment: 1 } },
      });

      res.json({ prompt: out });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed" });
    }
  });

  // =========================
  // TEMPLATES
  // =========================
  app.post("/api/templates/save", verifyAuth, async (req: any, res) => {
    try {
      let { title, content, tag } = req.body;
      const firebaseUid = req.user.uid;
      const user = await db.user.findFirst({ where: { firebaseUid } });
      if (!user) return res.status(404).json({ error: "User not found" });

      if (title && title.length > 60) {
        title = title.substring(0, 60);
      }
      const finalTitle = title || content?.substring(0, 50) || "Untitled Template";

      const template = await db.template.create({
        data: {
          userId: user.id,
          title: finalTitle,
          content,
          tag,
        },
      });
      res.json(template);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to save template" });
    }
  });

  app.get("/api/templates/user", verifyAuth, async (req: any, res) => {
    try {
      const firebaseUid = req.user.uid;
      const user = await db.user.findFirst({ where: { firebaseUid } });
      if (!user) return res.status(404).json({ error: "User not found" });

      const templates = await db.template.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
      });
      res.json(templates);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  });

  // =========================
  // ASSISTANT CHAT
  // =========================
  app.post("/api/assistant", verifyAuthOptional, async (req: any, res) => {
    try {
      const { messages, userStats, aiContext } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Invalid messages array" });
      }

      // Format messages
      const formattedMessages = messages.map((m) => ({
        role: m.role === "model" ? "assistant" : m.role,
        content: m.content,
      }));

      // Prepend system prompt
      const systemPrompt = {
        role: "system",
        content: `You are the Prompt Engine's built-in AI Assistant.
Help users write better prompts, understand the application features, and optimize their usage.
Be brief, helpful, and friendly.

Website Information:
The Prompt Engine is an AI-powered SaaS that helps users write better prompts for any AI models. It offers:
- A regular prompt generator for standard use cases.
- An "advanced" mode powered by the prompt engineer agent.
- Pricing Plans: Free (isolated basic), Pro (₹470/$10 yearly, limited generation), Premium (₹1199/$24 yearly, unlimited + priority processing). Regular Monthly limits also apply.
- Features include user history tracking, comprehensive global stats, direct integration with an AI coach (you), and more.

Platform AI Features Enabled:
${aiContext ? JSON.stringify(aiContext.featuresEnabled, null, 2) : "All base features"}

Context Engine Data:
${aiContext ? JSON.stringify(aiContext, null, 2) : "No context"}

User Stats:
${JSON.stringify(userStats, null, 2)}

Instructions:
1. READ the Context Engine Data and User Stats carefully to answer questions about their account, their prompt count, their history, or what they search most accurately! The user might ask how many prompts they generated so far. Check 'totalPrompts' in the User Stats. If they ask about their recent requests or searches, look at the history array inside Context Engine Data.
2. GENERATE response based on available features in Platform AI Features Enabled, user behavior, and real usage.
3. If they ask for prompt improvement, explain concepts from Prompt Quality Scoring (clarity, structure, specificity, constraints).
4. If analyticsCount > 0, generate real insights based ONLY on the numbers provided. DO NOT invent data. Always use EXACT stats.
`,
      };

      const finalMessages = [systemPrompt, ...formattedMessages];
      const reply = await generateChat(finalMessages as any);

      res.json({ reply });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Assistant failed" });
    }
  });

  // =========================
  // CREATE ORDER
  // =========================
  app.post("/api/create-order", verifyAuth, async (req: any, res) => {
    try {
      const { plan, billingCycle } = req.body;
      const firebaseUid = req.user.uid;

      const user = await db.user.findUnique({
        where: { firebaseUid },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const userId = user.id;

      const activeSub = await db.subscription.findFirst({
        where: {
          userId,
          status: "active",
        },
        orderBy: {
          startDate: "desc",
        },
      });

      const currentPlan = activeSub?.plan || user.plan || "free";
      const currentCycle = activeSub?.billingCycle || user.billingCycle || "monthly";

      const PLAN_RANK: Record<string, number> = { free: 0, pro: 1, premium: 2 };

      if (currentPlan === plan && currentCycle === billingCycle) {
        return res.status(400).json({ error: "Already active" });
      }

      if (PLAN_RANK[currentPlan] > PLAN_RANK[plan]) {
        return res.status(400).json({ error: "Already on higher plan" });
      }

      if (
        !process.env.RAZORPAY_KEY ||
        !process.env.RAZORPAY_SECRET ||
        process.env.RAZORPAY_KEY === "rzp_test_fallback"
      ) {
        return res
          .status(500)
          .json({ error: "Razorpay credentials not configured" });
      }

      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY,
        key_secret: process.env.RAZORPAY_SECRET,
      });

      let amount =
        plan === "pro"
          ? billingCycle === "yearly"
            ? 470
            : 49
          : billingCycle === "yearly"
            ? 1199
            : 149;

      const order = await razorpay.orders.create({
        amount: amount * 100,
        currency: "INR",
        receipt: "rcpt_" + Date.now(),
        notes: { userId, plan, billingCycle },
      });

      res.json({ ...order, key_id: process.env.RAZORPAY_KEY });
    } catch (e: any) {
      if (e?.error?.description === "Authentication failed") {
        console.error("Order creation failed: Razorpay Authentication failed.");
        return res.status(500).json({
          error:
            "Razorpay Authentication failed. Please check your RAZORPAY_KEY and RAZORPAY_SECRET environment variables.",
        });
      }
      console.error("Order creation failed:", e?.error?.description || e?.message || e);
      res.status(500).json({ error: e?.error?.description || "Order failed" });
    }
  });

  // =========================
  // VERIFY PAYMENT (FINAL FIX)
  // =========================
  app.post("/api/verify-payment", verifyAuth, async (req: any, res) => {
    try {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        selectedPlan,
        billingCycle,
      } = req.body;

      const firebaseUid = req.user.uid;
      const dbUser = await db.user.findUnique({
        where: { firebaseUid },
      });
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const userId = dbUser.id;

      // IDEMPOTENCY
      const exists = await db.subscription.findFirst({
        where: { razorpayPaymentId: razorpay_payment_id },
      });

      if (exists) {
        const user = await db.user.findUnique({
          where: { id: userId },
        });
        return res.json({ success: true, user });
      }

      // VERIFY SIGNATURE
      const body = razorpay_order_id + "|" + razorpay_payment_id;

      const expected = crypto
        .createHmac("sha256", process.env.RAZORPAY_SECRET!)
        .update(body)
        .digest("hex");

      if (expected !== razorpay_signature) {
        return res.status(400).json({ error: "Invalid payment" });
      }

      const start = new Date();
      const end = new Date(start);

      if (billingCycle === "yearly") {
        end.setFullYear(end.getFullYear() + 1);
      } else {
        end.setMonth(end.getMonth() + 1);
      }

      await db.$transaction(async (tx) => {
        await tx.subscription.updateMany({
          where: { userId, status: "active" },
          data: { status: "expired" },
        });

        await tx.subscription.create({
          data: {
            userId,
            plan: selectedPlan,
            billingCycle,
            status: "active",
            startDate: start,
            endDate: end,
            razorpayPaymentId: razorpay_payment_id,
          },
        });

        await tx.user.update({
          where: { id: userId },
          data: {
            plan: selectedPlan,
            billingCycle,
            planStartDate: start,
          },
        });
      });

      const updatedUser = await db.user.findUnique({
        where: { id: userId },
      });

      res.json({ success: true, user: updatedUser });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Verification failed" });
    }
  });

  // =========================
  // FRONTEND
  // =========================
const dist = path.join(process.cwd(), "dist");

app.use(express.static(dist));

app.get("*", (_, res) => {
  res.sendFile(path.join(dist, "index.html"));
});

  app.listen(3000, () => {
    const dbUrl = process.env.DATABASE_URL || "";
    const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ":***@");
    console.log(`Server running - DB: ${maskedUrl}`);
  });
}

startServer();
