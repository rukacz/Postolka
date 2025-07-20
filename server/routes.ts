import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBLSummarySchema, insertBLDetailSchema, insertContainerSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // BL Summary routes
  app.get("/api/bl-summaries", async (req, res) => {
    try {
      const blSummaries = await storage.getAllBLSummaries();
      res.json(blSummaries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch BL summaries" });
    }
  });

  app.get("/api/bl-summaries/:blNumber", async (req, res) => {
    try {
      const { blNumber } = req.params;
      const blSummary = await storage.getBLSummary(blNumber);
      
      if (!blSummary) {
        return res.status(404).json({ message: "BL summary not found" });
      }
      
      res.json(blSummary);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch BL summary" });
    }
  });

  app.post("/api/bl-summaries", async (req, res) => {
    try {
      const validatedData = insertBLSummarySchema.parse(req.body);
      const blSummary = await storage.createBLSummary(validatedData);
      res.status(201).json(blSummary);
    } catch (error) {
      res.status(400).json({ message: "Invalid BL summary data" });
    }
  });

  // BL Detail routes
  app.get("/api/bl-details/:blNumber", async (req, res) => {
    try {
      const { blNumber } = req.params;
      const blDetail = await storage.getBLDetail(blNumber);
      
      if (!blDetail) {
        return res.status(404).json({ message: "BL detail not found" });
      }
      
      res.json(blDetail);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch BL detail" });
    }
  });

  app.post("/api/bl-details", async (req, res) => {
    try {
      const validatedData = insertBLDetailSchema.parse(req.body);
      const blDetail = await storage.createBLDetail(validatedData);
      res.status(201).json(blDetail);
    } catch (error) {
      res.status(400).json({ message: "Invalid BL detail data" });
    }
  });

  // Container routes
  app.get("/api/containers/:blNumber", async (req, res) => {
    try {
      const { blNumber } = req.params;
      const containers = await storage.getContainersByBL(blNumber);
      res.json(containers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch containers" });
    }
  });

  app.post("/api/containers", async (req, res) => {
    try {
      const validatedData = insertContainerSchema.parse(req.body);
      const container = await storage.createContainer(validatedData);
      res.status(201).json(container);
    } catch (error) {
      res.status(400).json({ message: "Invalid container data" });
    }
  });

  app.patch("/api/containers/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const containerId = parseInt(id);
      const container = await storage.updateContainer(containerId, req.body);
      
      if (!container) {
        return res.status(404).json({ message: "Container not found" });
      }
      
      res.json(container);
    } catch (error) {
      res.status(500).json({ message: "Failed to update container" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
