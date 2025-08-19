import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBLSummarySchema, insertBLDetailSchema, insertContainerSchema, insertUserSchema } from "@shared/schema";

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

  app.post("/api/bl-summaries/:blNumber/acknowledge-changes", async (req, res) => {
    try {
      const { blNumber } = req.params;
      const { userGroup } = req.body;
      
      if (!userGroup || !['carrier', 'medlog'].includes(userGroup)) {
        return res.status(400).json({ message: "Invalid user group. Must be 'carrier' or 'medlog'" });
      }
      
      const blSummary = await storage.acknowledgeChanges(blNumber, userGroup);
      
      if (!blSummary) {
        return res.status(404).json({ message: "BL summary not found" });
      }
      
      res.json(blSummary);
    } catch (error) {
      res.status(500).json({ message: "Failed to acknowledge changes" });
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
  app.get("/api/containers", async (req, res) => {
    try {
      const containers = await storage.getAllContainers();
      res.json(containers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch all containers" });
    }
  });

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

  app.delete("/api/containers/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const containerId = parseInt(id);
      const success = await storage.deleteContainer(containerId);
      
      if (!success) {
        return res.status(404).json({ message: "Container not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete container" });
    }
  });

  // Update container note
  app.patch("/api/containers/:id/note", async (req, res) => {
    try {
      const { id } = req.params;
      const { group, note } = req.body;
      
      if (!group || (group !== 'carrier' && group !== 'medlog')) {
        return res.status(400).json({ error: 'Invalid group. Must be "carrier" or "medlog"' });
      }
      
      const containerId = parseInt(id);
      const updatedContainer = await storage.updateContainerNote(containerId, group, note);
      
      if (!updatedContainer) {
        return res.status(404).json({ error: 'Container not found' });
      }
      
      res.json(updatedContainer);
    } catch (error) {
      console.error('Error updating container note:', error);
      res.status(500).json({ error: 'Failed to update container note' });
    }
  });

  app.patch("/api/containers/bulk/hazardous", async (req, res) => {
    try {
      const { containerIds, hazardous } = req.body;
      
      if (!Array.isArray(containerIds)) {
        return res.status(400).json({ error: "containerIds must be an array" });
      }

      const updatedContainers = [];
      for (const id of containerIds) {
        const container = await storage.getContainer(id);
        if (container) {
          const updated = await storage.updateContainerHazardous(id, hazardous);
          updatedContainers.push(updated);
        }
      }

      res.json(updatedContainers);
    } catch (error) {
      console.error("Error updating container hazardous status:", error);
      res.status(500).json({ error: "Failed to update container hazardous status" });
    }
  });

  // Update individual container field
  app.patch("/api/containers/:id", async (req, res) => {
    try {
      const containerId = parseInt(req.params.id);
      const updates = req.body;

      if (!containerId || Object.keys(updates).length === 0) {
        return res.status(400).json({ error: "Invalid request data" });
      }

      const container = await storage.getContainer(containerId);
      if (!container) {
        return res.status(404).json({ error: "Container not found" });
      }

      const updatedContainer = await storage.updateContainer(containerId, updates);
      res.json(updatedContainer);
    } catch (error) {
      console.error('Error updating container:', error);
      res.status(500).json({ error: "Failed to update container" });
    }
  });

  // User authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      if (!user.isActive) {
        return res.status(401).json({ message: "Account is disabled" });
      }
      
      // Return user without password for security
      const { password: _, ...userWithoutPassword } = user;
      res.json({ 
        user: userWithoutPassword,
        message: "Login successful" 
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.get("/api/users", async (req, res) => {
    try {
      // This would normally be protected with authentication middleware
      // For now, we'll return all active users for testing
      const users = await storage.getAllUsers();
      // Remove passwords from response
      const safeUsers = users.map(({ password, ...user }) => user);
      res.json(safeUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(validatedData);
      // Remove password from response
      const { password, ...safeUser } = user;
      res.status(201).json(safeUser);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
