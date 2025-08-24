import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertCompanySchema, 
  insertRoleSchema, 
  insertPortSchema, 
  insertCitySchema,
  insertUserSchema, 
  insertBlSchema, 
  insertContainerSchema, 
  insertContainerInBlSchema,
  insertChatMessageSchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // ============================================================================
  // COMPANY ROUTES
  // ============================================================================
  app.get("/api/companies", async (req, res) => {
    try {
      const companies = await storage.getAllCompanies();
      res.json(companies);
    } catch (error) {
      console.error("Error fetching companies:", error);
      res.status(500).json({ message: "Failed to fetch companies" });
    }
  });

  app.get("/api/companies/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const companyId = parseInt(id);
      const company = await storage.getCompany(companyId);
      
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      
      res.json(company);
    } catch (error) {
      console.error("Error fetching company:", error);
      res.status(500).json({ message: "Failed to fetch company" });
    }
  });

  app.get("/api/companies/type/:type", async (req, res) => {
    try {
      const { type } = req.params;
      const companies = await storage.getCompaniesByType(type);
      res.json(companies);
    } catch (error) {
      console.error("Error fetching companies by type:", error);
      res.status(500).json({ message: "Failed to fetch companies by type" });
    }
  });

  app.post("/api/companies", async (req, res) => {
    try {
      const validatedData = insertCompanySchema.parse(req.body);
      const company = await storage.createCompany(validatedData);
      res.status(201).json(company);
    } catch (error) {
      console.error("Error creating company:", error);
      res.status(400).json({ message: "Invalid company data" });
    }
  });

  app.put("/api/companies/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const companyId = parseInt(id);
      const company = await storage.updateCompany(companyId, req.body);
      
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      
      res.json(company);
    } catch (error) {
      console.error("Error updating company:", error);
      res.status(500).json({ message: "Failed to update company" });
    }
  });

  // ============================================================================
  // ROLE ROUTES
  // ============================================================================
  app.get("/api/roles", async (req, res) => {
    try {
      const roles = await storage.getAllRoles();
      res.json(roles);
    } catch (error) {
      console.error("Error fetching roles:", error);
      res.status(500).json({ message: "Failed to fetch roles" });
    }
  });

  app.get("/api/roles/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const roleId = parseInt(id);
      const role = await storage.getRole(roleId);
      
      if (!role) {
        return res.status(404).json({ message: "Role not found" });
      }
      
      res.json(role);
    } catch (error) {
      console.error("Error fetching role:", error);
      res.status(500).json({ message: "Failed to fetch role" });
    }
  });

  app.post("/api/roles", async (req, res) => {
    try {
      const validatedData = insertRoleSchema.parse(req.body);
      const role = await storage.createRole(validatedData);
      res.status(201).json(role);
    } catch (error) {
      console.error("Error creating role:", error);
      res.status(400).json({ message: "Invalid role data" });
    }
  });

  // ============================================================================
  // PORT ROUTES
  // ============================================================================
  app.get("/api/ports", async (req, res) => {
    try {
      const ports = await storage.getAllPorts();
      res.json(ports);
    } catch (error) {
      console.error("Error fetching ports:", error);
      res.status(500).json({ message: "Failed to fetch ports" });
    }
  });

  app.get("/api/ports/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const portId = parseInt(id);
      const port = await storage.getPort(portId);
      
      if (!port) {
        return res.status(404).json({ message: "Port not found" });
      }
      
      res.json(port);
    } catch (error) {
      console.error("Error fetching port:", error);
      res.status(500).json({ message: "Failed to fetch port" });
    }
  });

  app.post("/api/ports", async (req, res) => {
    try {
      const validatedData = insertPortSchema.parse(req.body);
      const port = await storage.createPort(validatedData);
      res.status(201).json(port);
    } catch (error) {
      console.error("Error creating port:", error);
      res.status(400).json({ message: "Invalid port data" });
    }
  });

  app.put("/api/ports/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const portId = parseInt(id);
      const port = await storage.updatePort(portId, req.body);
      
      if (!port) {
        return res.status(404).json({ message: "Port not found" });
      }
      
      res.json(port);
    } catch (error) {
      console.error("Error updating port:", error);
      res.status(500).json({ message: "Failed to update port" });
    }
  });

  // ============================================================================
  // CITY ROUTES
  // ============================================================================
  app.get("/api/cities", async (req, res) => {
    try {
      const cities = await storage.getAllCities();
      res.json(cities);
    } catch (error) {
      console.error("Error fetching cities:", error);
      res.status(500).json({ message: "Failed to fetch cities" });
    }
  });

  app.get("/api/cities/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const cityId = parseInt(id);
      const city = await storage.getCity(cityId);
      
      if (!city) {
        return res.status(404).json({ message: "City not found" });
      }
      
      res.json(city);
    } catch (error) {
      console.error("Error fetching city:", error);
      res.status(500).json({ message: "Failed to fetch city" });
    }
  });

  app.post("/api/cities", async (req, res) => {
    try {
      const validatedData = insertCitySchema.parse(req.body);
      const city = await storage.createCity(validatedData);
      res.status(201).json(city);
    } catch (error) {
      console.error("Error creating city:", error);
      res.status(400).json({ message: "Invalid city data" });
    }
  });

  // ============================================================================
  // USER ROUTES
  // ============================================================================
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Remove passwords from response
      const safeUsers = users.map(({ password, ...user }) => user);
      res.json(safeUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const userId = parseInt(id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response
      const { password, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
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

  app.put("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const userId = parseInt(id);
      const user = await storage.updateUser(userId, req.body);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response
      const { password, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // ============================================================================
  // BL (BILL OF LADING) ROUTES
  // ============================================================================
  app.get("/api/bls", async (req, res) => {
    try {
      const bls = await storage.getAllBLs();
      res.json(bls);
    } catch (error) {
      console.error("Error fetching BLs:", error);
      res.status(500).json({ message: "Failed to fetch BLs" });
    }
  });

  app.get("/api/bls/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const blId = parseInt(id);
      const bl = await storage.getBL(blId);
      
      if (!bl) {
        return res.status(404).json({ message: "BL not found" });
      }
      
      res.json(bl);
    } catch (error) {
      console.error("Error fetching BL:", error);
      res.status(500).json({ message: "Failed to fetch BL" });
    }
  });

  app.get("/api/bls/number/:blNumber", async (req, res) => {
    try {
      const { blNumber } = req.params;
      const bl = await storage.getBLByNumber(blNumber);
      
      if (!bl) {
        return res.status(404).json({ message: "BL not found" });
      }
      
      res.json(bl);
    } catch (error) {
      console.error("Error fetching BL by number:", error);
      res.status(500).json({ message: "Failed to fetch BL by number" });
    }
  });

  app.get("/api/bls/carrier/:carrierId", async (req, res) => {
    try {
      const { carrierId } = req.params;
      const carrierIdNum = parseInt(carrierId);
      const bls = await storage.getBLsByCarrier(carrierIdNum);
      res.json(bls);
    } catch (error) {
      console.error("Error fetching BLs by carrier:", error);
      res.status(500).json({ message: "Failed to fetch BLs by carrier" });
    }
  });

  app.get("/api/bls/client/:clientId", async (req, res) => {
    try {
      const { clientId } = req.params;
      const clientIdNum = parseInt(clientId);
      const bls = await storage.getBLsByClient(clientIdNum);
      res.json(bls);
    } catch (error) {
      console.error("Error fetching BLs by client:", error);
      res.status(500).json({ message: "Failed to fetch BLs by client" });
    }
  });

  app.get("/api/bls/direction/:direction", async (req, res) => {
    try {
      const { direction } = req.params;
      if (!['Import', 'Export'].includes(direction)) {
        return res.status(400).json({ message: "Invalid direction. Must be 'Import' or 'Export'" });
      }
      const bls = await storage.getBLsByDirection(direction as 'Import' | 'Export');
      res.json(bls);
    } catch (error) {
      console.error("Error fetching BLs by direction:", error);
      res.status(500).json({ message: "Failed to fetch BLs by direction" });
    }
  });

  app.get("/api/bls/status", async (req, res) => {
    try {
      const { medlogStatus, carrierStatus } = req.query;
      if (!medlogStatus || !carrierStatus) {
        return res.status(400).json({ message: "Both medlogStatus and carrierStatus are required" });
      }
      const bls = await storage.getBLsByStatus(medlogStatus as string, carrierStatus as string);
      res.json(bls);
    } catch (error) {
      console.error("Error fetching BLs by status:", error);
      res.status(500).json({ message: "Failed to fetch BLs by status" });
    }
  });

  app.post("/api/bls", async (req, res) => {
    try {
      const validatedData = insertBlSchema.parse(req.body);
      const bl = await storage.createBL(validatedData);
      res.status(201).json(bl);
    } catch (error) {
      console.error("Error creating BL:", error);
      res.status(400).json({ message: "Invalid BL data" });
    }
  });

  app.put("/api/bls/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const blId = parseInt(id);
      const bl = await storage.updateBL(blId, req.body);
      
      if (!bl) {
        return res.status(404).json({ message: "BL not found" });
      }
      
      res.json(bl);
    } catch (error) {
      console.error("Error updating BL:", error);
      res.status(500).json({ message: "Failed to update BL" });
    }
  });

  // ============================================================================
  // CONTAINER ROUTES
  // ============================================================================
  app.get("/api/containers", async (req, res) => {
    try {
      const containers = await storage.getAllContainers();
      res.json(containers);
    } catch (error) {
      console.error("Error fetching containers:", error);
      res.status(500).json({ message: "Failed to fetch containers" });
    }
  });

  app.get("/api/containers/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const containerId = parseInt(id);
      const container = await storage.getContainer(containerId);
      
      if (!container) {
        return res.status(404).json({ message: "Container not found" });
      }
      
      res.json(container);
    } catch (error) {
      console.error("Error fetching container:", error);
      res.status(500).json({ message: "Failed to fetch container" });
    }
  });

  app.get("/api/containers/ilu/:containerIlu", async (req, res) => {
    try {
      const { containerIlu } = req.params;
      const container = await storage.getContainerByIlu(containerIlu);
      
      if (!container) {
        return res.status(404).json({ message: "Container not found" });
      }
      
      res.json(container);
    } catch (error) {
      console.error("Error fetching container by ILU:", error);
      res.status(500).json({ message: "Failed to fetch container by ILU" });
    }
  });

  app.get("/api/containers/bl/:blNumber", async (req, res) => {
    try {
      const { blNumber } = req.params;
      const containers = await storage.getContainersByBL(blNumber);
      res.json(containers);
    } catch (error) {
      console.error("Error fetching containers by BL:", error);
      res.status(500).json({ message: "Failed to fetch containers by BL" });
    }
  });

  app.get("/api/containers/status", async (req, res) => {
    try {
      const { medlogStatus, carrierStatus } = req.query;
      if (!medlogStatus || !carrierStatus) {
        return res.status(400).json({ message: "Both medlogStatus and carrierStatus are required" });
      }
      const containers = await storage.getContainersByStatus(medlogStatus as string, carrierStatus as string);
      res.json(containers);
    } catch (error) {
      console.error("Error fetching containers by status:", error);
      res.status(500).json({ message: "Failed to fetch containers by status" });
    }
  });

  app.post("/api/containers", async (req, res) => {
    try {
      const validatedData = insertContainerSchema.parse(req.body);
      const container = await storage.createContainer(validatedData);
      res.status(201).json(container);
    } catch (error) {
      console.error("Error creating container:", error);
      res.status(400).json({ message: "Invalid container data" });
    }
  });

  app.put("/api/containers/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const containerId = parseInt(id);
      const container = await storage.updateContainer(containerId, req.body);
      
      if (!container) {
        return res.status(404).json({ message: "Container not found" });
      }
      
      res.json(container);
    } catch (error) {
      console.error("Error updating container:", error);
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
      console.error("Error deleting container:", error);
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

  // ============================================================================
  // CONTAINER IN BL ROUTES
  // ============================================================================
  app.get("/api/container-in-bl/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const containerInBlId = parseInt(id);
      const containerInBl = await storage.getContainerInBL(containerInBlId);
      
      if (!containerInBl) {
        return res.status(404).json({ message: "Container in BL not found" });
      }
      
      res.json(containerInBl);
    } catch (error) {
      console.error("Error fetching container in BL:", error);
      res.status(500).json({ message: "Failed to fetch container in BL" });
    }
  });

  app.get("/api/container-in-bl/bl/:blId", async (req, res) => {
    try {
      const { blId } = req.params;
      const blIdNum = parseInt(blId);
      const containersInBl = await storage.getContainersForBL(blIdNum);
      res.json(containersInBl);
    } catch (error) {
      console.error("Error fetching containers for BL:", error);
      res.status(500).json({ message: "Failed to fetch containers for BL" });
    }
  });

  app.get("/api/container-in-bl/container/:containerId", async (req, res) => {
    try {
      const { containerId } = req.params;
      const blsForContainer = await storage.getBLsForContainer(containerId);
      res.json(blsForContainer);
    } catch (error) {
      console.error("Error fetching BLs for container:", error);
      res.status(500).json({ message: "Failed to fetch BLs for container" });
    }
  });

  app.post("/api/container-in-bl", async (req, res) => {
    try {
      const validatedData = insertContainerInBlSchema.parse(req.body);
      const containerInBl = await storage.createContainerInBL(validatedData);
      res.status(201).json(containerInBl);
    } catch (error) {
      console.error("Error creating container in BL:", error);
      res.status(400).json({ message: "Invalid container in BL data" });
    }
  });

  app.delete("/api/container-in-bl/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const containerInBlId = parseInt(id);
      const success = await storage.deleteContainerInBL(containerInBlId);
      
      if (!success) {
        return res.status(404).json({ message: "Container in BL not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting container in BL:", error);
      res.status(500).json({ message: "Failed to delete container in BL" });
    }
  });

  // ============================================================================
  // CHAT MESSAGE ROUTES
  // ============================================================================
  app.get("/api/chat-messages", async (req, res) => {
    try {
      const messages = await storage.getAllChatMessages();
      res.json(messages);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ message: "Failed to fetch chat messages" });
    }
  });

  app.get("/api/chat-messages/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const messageId = parseInt(id);
      const message = await storage.getChatMessage(messageId);
      
      if (!message) {
        return res.status(404).json({ message: "Chat message not found" });
      }
      
      res.json(message);
    } catch (error) {
      console.error("Error fetching chat message:", error);
      res.status(500).json({ message: "Failed to fetch chat message" });
    }
  });

  app.get("/api/chat-messages/bl/:blId", async (req, res) => {
    try {
      const { blId } = req.params;
      const blIdNum = parseInt(blId);
      const messages = await storage.getChatMessagesByBL(blIdNum);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching chat messages by BL:", error);
      res.status(500).json({ message: "Failed to fetch chat messages by BL" });
    }
  });

  app.post("/api/chat-messages", async (req, res) => {
    try {
      const validatedData = insertChatMessageSchema.parse(req.body);
      const message = await storage.createChatMessage(validatedData);
      res.status(201).json(message);
    } catch (error) {
      console.error("Error creating chat message:", error);
      res.status(400).json({ message: "Invalid chat message data" });
    }
  });

  // ============================================================================
  // COMPLEX QUERY ROUTES
  // ============================================================================
  app.get("/api/bls/:id/with-containers", async (req, res) => {
    try {
      const { id } = req.params;
      const blId = parseInt(id);
      const blWithContainers = await storage.getBLWithContainers(blId);
      
      if (!blWithContainers) {
        return res.status(404).json({ message: "BL not found" });
      }
      
      res.json(blWithContainers);
    } catch (error) {
      console.error("Error fetching BL with containers:", error);
      res.status(500).json({ message: "Failed to fetch BL with containers" });
    }
  });

  app.get("/api/bls/:id/with-details", async (req, res) => {
    try {
      const { id } = req.params;
      const blId = parseInt(id);
      const blWithDetails = await storage.getBLWithDetails(blId);
      
      if (!blWithDetails) {
        return res.status(404).json({ message: "BL not found" });
      }
      
      res.json(blWithDetails);
    } catch (error) {
      console.error("Error fetching BL with details:", error);
      res.status(500).json({ message: "Failed to fetch BL with details" });
    }
  });

  app.get("/api/search/bls", async (req, res) => {
    try {
      const { query } = req.query;
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ message: "Query parameter is required" });
      }
      const bls = await storage.searchBLs(query);
      res.json(bls);
    } catch (error) {
      console.error("Error searching BLs:", error);
      res.status(500).json({ message: "Failed to search BLs" });
    }
  });

  app.get("/api/dashboard", async (req, res) => {
    try {
      const dashboardData = await storage.getDashboardData();
      res.json(dashboardData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  // ============================================================================
  // AUTHENTICATION ROUTES
  // ============================================================================
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      const user = await storage.getUserWithRoleAndCompany(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      if (!user.use) {
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

  const httpServer = createServer(app);
  return httpServer;
}
