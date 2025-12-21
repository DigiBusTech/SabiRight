import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Plans
  app.get("/api/plans", async (req, res) => {
    const plans = await storage.getAllPlans();
    res.json(plans);
  });

  app.get("/api/plans/user-type/:userType", async (req, res) => {
    const { userType } = req.params;
    if (userType !== 'user' && userType !== 'vendor') {
      return res.status(400).json({ error: 'Invalid user type' });
    }
    const plans = await storage.getPlansByType('free', userType as 'user' | 'vendor');
    const proPlan = await storage.getPlansByType('pro', userType as 'user' | 'vendor');
    res.json([...plans, ...proPlan]);
  });

  // Credits
  app.get("/api/credits/:userId", async (req, res) => {
    const { userId } = req.params;
    const credits = await storage.getUserCredits(userId);
    if (!credits) {
      return res.status(404).json({ error: 'Credits not found' });
    }
    res.json(credits);
  });

  app.get("/api/credits/:userId/available", async (req, res) => {
    const { userId } = req.params;
    const credits = await storage.getUserCredits(userId);
    if (!credits) {
      return res.status(404).json({ error: 'Credits not found' });
    }
    
    // Refresh daily credits if needed
    const userPlan = await storage.getUserPlan(userId);
    if (userPlan?.dailyCredits) {
      await storage.refreshDailyCredits(userId, userPlan.dailyCredits);
    }
    
    const updatedCredits = await storage.getUserCredits(userId);
    const available = updatedCredits!.totalCredits - updatedCredits!.usedCredits;
    
    res.json({
      totalCredits: updatedCredits!.totalCredits,
      usedCredits: updatedCredits!.usedCredits,
      availableCredits: available,
      renewalDate: updatedCredits!.renewalDate
    });
  });

  app.post("/api/credits/:userId/deduct", async (req, res) => {
    const { userId } = req.params;
    const { amount, feature, description } = req.body;

    if (!amount || !feature) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const success = await storage.deductCredits(userId, amount, feature, description);
    if (!success) {
      return res.status(402).json({ error: 'Insufficient credits' });
    }

    const credits = await storage.getUserCredits(userId);
    res.json({
      success: true,
      remainingCredits: credits!.totalCredits - credits!.usedCredits,
      totalUsed: credits!.usedCredits
    });
  });

  app.post("/api/credits/:userId/refund", async (req, res) => {
    const { userId } = req.params;
    const { amount, feature } = req.body;

    if (!amount || !feature) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await storage.refundCredits(userId, amount, feature);
    const credits = await storage.getUserCredits(userId);
    res.json({
      success: true,
      remainingCredits: credits!.totalCredits - credits!.usedCredits
    });
  });

  app.get("/api/credits/:userId/log", async (req, res) => {
    const { userId } = req.params;
    const logs = await storage.getCreditLog(userId);
    res.json(logs);
  });

  // Subscriptions
  app.get("/api/subscription/:userId", async (req, res) => {
    const { userId } = req.params;
    const subscription = await storage.getUserPlan(userId);
    if (!subscription) {
      return res.status(404).json({ error: 'No active subscription' });
    }
    res.json(subscription);
  });

  app.post("/api/subscription/upgrade", async (req, res) => {
    const { userId, planId } = req.body;
    
    if (!userId || !planId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const plan = await storage.getPlanById(planId);
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    // Cancel existing subscription if any
    const existing = await storage.getUserPlan(userId);
    if (existing?.id) {
      await storage.updateSubscriptionStatus(existing.id, 'cancelled');
    }

    const subscription = await storage.createSubscription({
      userId,
      planId,
      status: 'active'
    });

    res.json({
      success: true,
      subscription,
      message: `Upgraded to ${plan.name} plan`
    });
  });

  return httpServer;
}
