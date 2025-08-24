import { db } from "./db";
import { 
  company, 
  role, 
  port, 
  city, 
  user, 
  bl, 
  container, 
  containerInBl, 
  chatMessages 
} from "@shared/schema";

export async function seedDatabase() {
  try {
    // Clear existing data to ensure clean state
    console.log("Clearing existing data...");
    await db.delete(chatMessages);
    await db.delete(containerInBl);
    await db.delete(container);
    await db.delete(bl);
    await db.delete(user);
    await db.delete(city);
    await db.delete(port);
    await db.delete(role);
    await db.delete(company);

    console.log("Seeding database with new schema...");

    // ============================================================================
    // SEED ROLES
    // ============================================================================
    const sampleRoles = [
      { name: "Admin" },
      { name: "Medlog User" },
      { name: "MSC User" },
      { name: "Client User" }
    ];
    const insertedRoles = await db.insert(role).values(sampleRoles).returning();

    // ============================================================================
    // SEED COMPANIES
    // ============================================================================
    const sampleCompanies = [
      { 
        name: "Medlog", 
        address: "Praha, Česká republika",
        contact: "info@medlog.cz",
        type: "Medlog"
      },
      { 
        name: "MSC CZ", 
        address: "Praha, Česká republika",
        contact: "info@msc.cz",
        type: "MSC"
      },
      { 
        name: "MSC SK", 
        address: "Bratislava, Slovensko",
        contact: "info@msc.sk",
        type: "MSC"
      },
      { 
        name: "ŠKODA AUTO", 
        address: "Mladá Boleslav, Česká republika",
        contact: "info@skoda-auto.cz",
        type: "Client"
      },
      { 
        name: "TESCO", 
        address: "Praha, Česká republika",
        contact: "info@tesco.cz",
        type: "Client"
      },
      { 
        name: "IKEA", 
        address: "Praha, Česká republika",
        contact: "info@ikea.cz",
        type: "Client"
      },
      { 
        name: "NTB", 
        address: "Praha, Česká republika",
        contact: "info@ntb.cz",
        type: "Client"
      },
      { 
        name: "AUDI", 
        address: "Ingolstadt, Německo",
        contact: "info@audi.de",
        type: "Client"
      },
      { 
        name: "ONE", 
        address: "Tokyo, Japonsko",
        contact: "info@one-line.com",
        type: "Carrier"
      },
      { 
        name: "Hapag-Lloyd", 
        address: "Hamburg, Německo",
        contact: "info@hapag-lloyd.com",
        type: "Carrier"
      }
    ];
    const insertedCompanies = await db.insert(company).values(sampleCompanies).returning();

    // ============================================================================
    // SEED PORTS
    // ============================================================================
    const samplePorts = [
      { 
        name: "Port of Hamburg", 
        state: "Hamburg",
        address: "Waltershof Terminal, Hamburg 21129"
      },
      { 
        name: "Port of Rotterdam", 
        state: "South Holland",
        address: "Maasvlakte Plaza 1, 3199 DB Rotterdam"
      },
      { 
        name: "Port of Koper", 
        state: "Koper",
        address: "Vojkovo nabrežje 38, 6000 Koper"
      },
      { 
        name: "Port of Antwerpen", 
        state: "Antwerp",
        address: "Antwerp Port Authority, 2000 Antwerp"
      }
    ];
    const insertedPorts = await db.insert(port).values(samplePorts).returning();

    // ============================================================================
    // SEED CITIES
    // ============================================================================
    const sampleCities = [
      { 
        name: "Mladá Boleslav", 
        state: "Středočeský kraj",
        postalCode: 29301
      },
      { 
        name: "Praha", 
        state: "Praha",
        postalCode: 11000
      },
      { 
        name: "Gan", 
        state: "Bratislavský kraj",
        postalCode: 90001
      },
      { 
        name: "Ružomberok", 
        state: "Žilinský kraj",
        postalCode: 3401
      },
      { 
        name: "Ingolstadt", 
        state: "Bavaria",
        postalCode: 85049
      },
      { 
        name: "Brandýs nad Labem", 
        state: "Středočeský kraj",
        postalCode: 25001
      }
    ];
    const insertedCities = await db.insert(city).values(sampleCities).returning();

    // ============================================================================
    // SEED USERS
    // ============================================================================
    const sampleUsers = [
      {
        name: "Medlog Admin",
        username: "medlog_admin",
        email: "admin@medlog.cz",
        password: "medlog123",
        role: insertedRoles.find((r: any) => r.name === "Medlog User")!.id,
        office: "Praha",
        company: insertedCompanies.find((c: any) => c.name === "Medlog")!.id
      },
      {
        name: "MSC CZ Import User",
        username: "msc_cz_import",
        email: "import.cz@msc.com",
        password: "msc123",
        role: insertedRoles.find((r: any) => r.name === "MSC User")!.id,
        office: "Praha",
        company: insertedCompanies.find((c: any) => c.name === "MSC CZ")!.id
      },
      {
        name: "MSC CZ Export User",
        username: "msc_cz_export",
        email: "export.cz@msc.com",
        password: "msc123",
        role: insertedRoles.find((r: any) => r.name === "MSC User")!.id,
        office: "Praha",
        company: insertedCompanies.find((c: any) => c.name === "MSC CZ")!.id
      },
      {
        name: "MSC SK Import User",
        username: "msc_sk_import",
        email: "import.sk@msc.com",
        password: "msc123",
        role: insertedRoles.find((r: any) => r.name === "MSC User")!.id,
        office: "Bratislava",
        company: insertedCompanies.find((c: any) => c.name === "MSC SK")!.id
      },
      {
        name: "MSC SK Export User",
        username: "msc_sk_export",
        email: "export.sk@msc.com",
        password: "msc123",
        role: insertedRoles.find((r: any) => r.name === "MSC User")!.id,
        office: "Bratislava",
        company: insertedCompanies.find((c: any) => c.name === "MSC SK")!.id
      }
    ];
    const insertedUsers = await db.insert(user).values(sampleUsers).returning();

    // ============================================================================
    // SEED BL RECORDS
    // ============================================================================
    const sampleBLs = [
      {
        blNumber: "MEDU123456",
        pic: insertedUsers.find((u: any) => u.name === "Medlog Admin")!.id,
        client: insertedCompanies.find((c: any) => c.name === "ŠKODA AUTO")!.id,
        containerAmount: 2,
        direction: "Import",
        eta: new Date('2025-01-25T10:00:00Z'),
        hasDangerous: false,
        hasDt: true,
        localPort: insertedPorts.find((p: any) => p.name === "Port of Hamburg")!.id,
        medlogStatus: "Approved",
        carrierStatus: "MIPS Send",
        location: insertedCities.find((c: any) => c.name === "Mladá Boleslav")!.id,
        train: "MEH2530R1",
        medlogBulb: true,
        carrierBulb: false,
        voyage: "0142E",
        vessel: "MSC MAYA",
        carrier: insertedCompanies.find((c: any) => c.name === "MSC CZ")!.id,
        notifyEmail: "skoda@medlog.cz",
        toBeNotified: true,
        use: true
      },
      {
        blNumber: "MSCU789012",
        pic: insertedUsers.find(u => u.name === "MSC SK Import User")!.id,
        client: insertedCompanies.find(c => c.name === "TESCO")!.id,
        containerAmount: 1,
        direction: "Import",
        eta: new Date('2025-01-26T14:00:00Z'),
        hasDangerous: false,
        hasDt: false,
        localPort: insertedPorts.find(p => p.name === "Port of Koper")!.id,
        medlogStatus: "New",
        carrierStatus: "Pre-Order",
        location: insertedCities.find(c => c.name === "Gan")!.id,
        train: null,
        medlogBulb: false,
        carrierBulb: false,
        voyage: "0156E",
        vessel: "MSC OSCAR",
        carrier: insertedCompanies.find(c => c.name === "MSC SK")!.id,
        notifyEmail: "tesco@medlog.cz",
        toBeNotified: false,
        use: true
      },
      {
        blNumber: "TCLU345678",
        pic: insertedUsers.find(u => u.name === "Medlog Admin")!.id,
        client: insertedCompanies.find(c => c.name === "IKEA")!.id,
        containerAmount: 3,
        direction: "Export",
        eta: new Date('2025-01-27T16:00:00Z'),
        hasDangerous: false,
        hasDt: false,
        localPort: insertedPorts.find(p => p.name === "Port of Koper")!.id,
        medlogStatus: "Rejected",
        carrierStatus: "Do Not Release",
        location: insertedCities.find(c => c.name === "Ružomberok")!.id,
        train: null,
        medlogBulb: true,
        carrierBulb: false,
        voyage: "0523W",
        vessel: "ONE STORK",
        carrier: insertedCompanies.find(c => c.name === "ONE")!.id,
        notifyEmail: "ikea@medlog.cz",
        toBeNotified: true,
        use: true
      },
      {
        blNumber: "NTBG456789",
        pic: insertedUsers.find(u => u.name === "Medlog Admin")!.id,
        client: insertedCompanies.find(c => c.name === "NTB")!.id,
        containerAmount: 2,
        direction: "Import",
        eta: new Date('2025-01-22T12:00:00Z'),
        hasDangerous: false,
        hasDt: false,
        localPort: insertedPorts.find(p => p.name === "Port of Rotterdam")!.id,
        medlogStatus: "Approved",
        carrierStatus: "MIPS Send",
        location: insertedCities.find(c => c.name === "Brandýs nad Labem")!.id,
        train: "OBH2534R4",
        medlogBulb: false,
        carrierBulb: false,
        voyage: "0245E",
        vessel: "MSC BENEDETTA",
        carrier: insertedCompanies.find(c => c.name === "MSC CZ")!.id,
        notifyEmail: "ntb@medlog.cz",
        toBeNotified: false,
        use: true
      },
      {
        blNumber: "AUDI567890",
        pic: insertedUsers.find(u => u.name === "Medlog Admin")!.id,
        client: insertedCompanies.find(c => c.name === "AUDI")!.id,
        containerAmount: 1,
        direction: "Export",
        eta: new Date('2025-01-28T18:00:00Z'),
        hasDangerous: false,
        hasDt: false,
        localPort: insertedPorts.find(p => p.name === "Port of Antwerpen")!.id,
        medlogStatus: "Changed",
        carrierStatus: "Cancelled",
        location: insertedCities.find(c => c.name === "Ingolstadt")!.id,
        train: null,
        medlogBulb: false,
        carrierBulb: false,
        voyage: "0834W",
        vessel: "HAPAG LLOYD BERLIN",
        carrier: insertedCompanies.find(c => c.name === "Hapag-Lloyd")!.id,
        notifyEmail: "audi@medlog.cz",
        toBeNotified: false,
        use: true
      }
    ];
    const insertedBLs = await db.insert(bl).values(sampleBLs).returning();

    // ============================================================================
    // SEED CONTAINERS
    // ============================================================================
    const sampleContainers = [
      {
        containerIlu: "COSU1044551",
        type: "20DV",
        weight: 24.5,
        customs: "Cleared",
        isDangerous: false,
        deliveryDate: new Date('2025-01-24T12:30:00Z'),
        isDirectTruck: true,
        medlogStatus: "Approved",
        carrierStatus: "MIPS Send",
        medlogNote: "Kontejner připraven k vyzvednutí",
        carrierNote: "",
        isSentInMips: true,
        location: "Mladá Boleslav Terminal",
        zip: "29301",
        train: "MEH2530R1",
        trainDate: new Date('2025-01-24T12:30:00Z'),
        deliveryNotPossible: false,
        use: true
      },
      {
        containerIlu: "COSU9004547",
        type: "40HC",
        weight: 23.5,
        customs: "Pending",
        isDangerous: false,
        deliveryDate: new Date('2025-01-24T16:45:00Z'),
        isDirectTruck: false,
        medlogStatus: "Rejected",
        carrierStatus: "Do Not Release",
        medlogNote: "",
        carrierNote: "Zpoždění kvůli dopravě",
        isSentInMips: false,
        location: "Prague Distribution Center",
        zip: "11000",
        train: "OBH2530R3",
        trainDate: new Date('2025-01-24T16:45:00Z'),
        deliveryNotPossible: false,
        use: true
      },
      {
        containerIlu: "TCLU8899001",
        type: "40HC",
        weight: 25.0,
        customs: "Cleared",
        isDangerous: false,
        deliveryDate: new Date('2025-01-27T08:00:00Z'),
        isDirectTruck: false,
        medlogStatus: "New",
        carrierStatus: "Pre-Order",
        medlogNote: "",
        carrierNote: "",
        isSentInMips: false,
        location: "Koper Terminal",
        zip: "6000",
        train: "MEH2532R2",
        trainDate: new Date('2025-01-27T08:00:00Z'),
        deliveryNotPossible: false,
        use: true
      },
      {
        containerIlu: "TCLU8899002",
        type: "40HC",
        weight: 24.8,
        customs: "Cleared",
        isDangerous: false,
        deliveryDate: new Date('2025-01-27T08:15:00Z'),
        isDirectTruck: true,
        medlogStatus: "New",
        carrierStatus: "Pre-Order",
        medlogNote: "",
        carrierNote: "",
        isSentInMips: false,
        location: "Koper Terminal",
        zip: "6000",
        train: "MEH2532R2",
        trainDate: new Date('2025-01-27T08:15:00Z'),
        deliveryNotPossible: false,
        use: true
      },
      {
        containerIlu: "TCLU8899003",
        type: "20DV",
        weight: 12.5,
        customs: "Rejected",
        isDangerous: false,
        deliveryDate: new Date('2025-01-27T09:00:00Z'),
        isDirectTruck: false,
        medlogStatus: "Changed",
        carrierStatus: "Cancelled",
        medlogNote: "Nutná výměna kontejneru",
        carrierNote: "Kontejner zrušen kvůli poškození",
        isSentInMips: false,
        location: "Koper Terminal",
        zip: "6000",
        train: "MEH2532R2",
        trainDate: new Date('2025-01-27T09:00:00Z'),
        deliveryNotPossible: true,
        use: true
      },
      {
        containerIlu: "NTBU5566789",
        type: "40HC",
        weight: 25.2,
        customs: "Cleared",
        isDangerous: false,
        deliveryDate: new Date('2025-01-22T11:15:00Z'),
        isDirectTruck: false,
        medlogStatus: "Approved",
        carrierStatus: "MIPS Send",
        medlogNote: "Potvrzeno - připraven k expedici",
        carrierNote: "",
        isSentInMips: true,
        location: "Praha Distribution",
        zip: "25001",
        train: "OBH2534R4",
        trainDate: new Date('2025-01-22T11:15:00Z'),
        deliveryNotPossible: false,
        use: true
      },
      {
        containerIlu: "NTBU5566790",
        type: "20DV",
        weight: 12.8,
        customs: "Cleared",
        isDangerous: false,
        deliveryDate: new Date('2025-01-22T11:30:00Z'),
        isDirectTruck: true,
        medlogStatus: "Approved",
        carrierStatus: "MIPS Send",
        medlogNote: "Kontrola dokončena",
        carrierNote: "",
        isSentInMips: true,
        location: "Praha Distribution",
        zip: "25001",
        train: "OBH2534R4",
        trainDate: new Date('2025-01-22T11:30:00Z'),
        deliveryNotPossible: false,
        use: true
      }
    ];
    const insertedContainers = await db.insert(container).values(sampleContainers).returning();

    // ============================================================================
    // SEED CONTAINER IN BL RELATIONSHIPS
    // ============================================================================
    const sampleContainerInBl = [
      // MEDU123456 - 2 containers
      { blId: insertedBLs.find((b: any) => b.blNumber === "MEDU123456")!.id, containerId: "COSU1044551" },
      { blId: insertedBLs.find((b: any) => b.blNumber === "MEDU123456")!.id, containerId: "COSU9004547" },
      
      // TCLU345678 - 3 containers
      { blId: insertedBLs.find((b: any) => b.blNumber === "TCLU345678")!.id, containerId: "TCLU8899001" },
      { blId: insertedBLs.find((b: any) => b.blNumber === "TCLU345678")!.id, containerId: "TCLU8899002" },
      { blId: insertedBLs.find((b: any) => b.blNumber === "TCLU345678")!.id, containerId: "TCLU8899003" },
      
      // NTBG456789 - 2 containers
      { blId: insertedBLs.find((b: any) => b.blNumber === "NTBG456789")!.id, containerId: "NTBU5566789" },
      { blId: insertedBLs.find((b: any) => b.blNumber === "NTBG456789")!.id, containerId: "NTBU5566790" }
    ];
    await db.insert(containerInBl).values(sampleContainerInBl);

    // ============================================================================
    // SEED CHAT MESSAGES
    // ============================================================================
    const sampleChatMessages = [
      {
        blId: insertedBLs.find((b: any) => b.blNumber === "MEDU123456")!.id,
        user: insertedUsers.find((u: any) => u.name === "Medlog Admin")!.id,
        message: "Potvrzeno. ETA updated to 14:30."
      },
      {
        blId: insertedBLs.find((b: any) => b.blNumber === "TCLU345678")!.id,
        user: insertedUsers.find((u: any) => u.name === "Medlog Admin")!.id,
        message: "Status změněn na Rejected"
      },
      {
        blId: insertedBLs.find((b: any) => b.blNumber === "NTBG456789")!.id,
        user: insertedUsers.find((u: any) => u.name === "Medlog Admin")!.id,
        message: "Kontejnery připraveny k nakládce"
      }
    ];
    await db.insert(chatMessages).values(sampleChatMessages);

    console.log("Database seeded successfully with new schema!");
    console.log(`Created: ${insertedRoles.length} roles, ${insertedCompanies.length} companies, ${insertedPorts.length} ports, ${insertedCities.length} cities, ${insertedUsers.length} users, ${insertedBLs.length} BLs, ${insertedContainers.length} containers`);
    
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}