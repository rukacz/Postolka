import { db } from "./db";
import { blSummaries, blDetails, containers } from "@shared/schema";

export async function seedDatabase() {
  try {
    // Check if data already exists
    const existingBLs = await db.select().from(blSummaries).limit(1);
    if (existingBLs.length > 0) {
      console.log("Database already seeded, skipping...");
      return;
    }

    console.log("Seeding database with sample data...");

    // Sample BL Summaries
    const sampleBLSummaries = [
      {
        blNumber: "MEDU123456",
        date: "2025-01-22", 
        client: "ŠKODA AUTO",
        consignee: "ALICE FREIGHT",
        destination: "Mladá Boleslav",
        podPol: "Hamburg",
        containerCount: 2,
        type: "Import",
        carrier: "MSC",
        carrierStatus: "MIPS Send",
        medlogStatus: "Approved",
        trainScheduled: true,
        weight: "48,000 kg",
        hasChanges: true,
        lastChangedBy: "carrier",
        lastChangedAt: new Date('2025-01-22T14:30:00Z'),
        unseenChangesCarrier: 0,
        unseenChangesMedlog: 2,
        changedFields: ["eta", "carrierStatus"]
      },
      {
        blNumber: "MSCU789012",
        date: "2025-01-23",
        client: "TESCO", 
        consignee: "TESCO STORES",
        destination: "Gan",
        podPol: "Bremerhaven",
        containerCount: 1,
        type: "Import",
        carrier: "MSC",
        carrierStatus: "Pre-Order",
        medlogStatus: "New",
        trainScheduled: false,
        weight: "25,400 kg",
        hasChanges: false,
        lastChangedBy: null,
        lastChangedAt: null,
        unseenChangesCarrier: 0,
        unseenChangesMedlog: 0,
        changedFields: []
      },
      {
        blNumber: "TCLU345678",
        date: "2025-01-25",
        client: "IKEA",
        consignee: "IKEA STORES", 
        destination: "Ružomberok",
        podPol: "Koper",
        containerCount: 3,
        type: "Export",
        carrier: "ONE",
        carrierStatus: "Do Not Release",
        medlogStatus: "Rejected",
        trainScheduled: false,
        weight: "73,950 kg",
        hasChanges: true,
        lastChangedBy: "medlog",
        lastChangedAt: new Date('2025-01-24T09:15:00Z'),
        unseenChangesCarrier: 3,
        unseenChangesMedlog: 0,
        changedFields: ["medlogStatus", "destination", "date"]
      },
      {
        blNumber: "NTBG456789",
        date: "2025-01-20",
        client: "NTB",
        consignee: "NTB SOLUTIONS",
        destination: "Praha",
        podPol: "Rotterdam", 
        containerCount: 2,
        type: "Import",
        carrier: "MSC",
        carrierStatus: "MIPS Send",
        medlogStatus: "Approved",
        trainScheduled: true,
        weight: "49,400 kg",
        hasChanges: true,
        lastChangedBy: "carrier",
        lastChangedAt: new Date('2025-01-21T16:20:00Z'),
        unseenChangesCarrier: 0,
        unseenChangesMedlog: 1,
        changedFields: ["containers"]
      },
      {
        blNumber: "AUDI567890",
        date: "2025-01-24",
        client: "AUDI",
        consignee: "AUDI PARTS",
        destination: "Ingolstadt",
        podPol: "Antwerp",
        containerCount: 1,
        type: "Export", 
        carrier: "Hapag-Lloyd",
        carrierStatus: "Cancelled",
        medlogStatus: "Changed",
        trainScheduled: false,
        weight: "22,300 kg",
        hasChanges: false,
        lastChangedBy: null,
        lastChangedAt: null,
        unseenChangesCarrier: 0,
        unseenChangesMedlog: 0,
        changedFields: []
      }
    ];

    await db.insert(blSummaries).values(sampleBLSummaries);

    // Sample BL Detail
    const sampleBLDetail = {
      blNumber: "MEDU123456",
      customerRef: "SS001546", 
      jobType: "Import",
      status: "In Progress",
      customerName: "ŠKODA AUTO",
      contactName: "MARTIN NOVAK",
      contactPhone: "420 326 811 111",
      consigneeName: "ALICE FREIGHT",
      vesselName: "MSC MAYA/0142E",
      shippingLine: "MSC",
      eta: "22/01/2025",
      availability: "23/01/2025 08:00",
      storageStart: "25/01/2025",
      fromLocation: "Port of Hamburg",
      fromAddress: "Waltershof Terminal, Hamburg 21129",
      fromZone: "Zone A",
      toLocation: "ŠKODA AUTO Mladá Boleslav",
      toAddress: "Václava Klementa 869, 293 60 Mladá Boleslav",
      toZone: "Zone 2",
      hoursOfOperation: "07:00 - 15:00"
    };

    await db.insert(blDetails).values(sampleBLDetail);

    // Sample Containers
    const sampleContainers = [
      {
        blNumber: "MEDU123456",
        jobNumber: "MEDU123456-1",
        containerNumber: "COSU1044551",
        size: "20",
        containerType: "DV",
        dateTime: "2025-01-22T10:30:00",
        status: "In Progress",
        routeStep: "D",
        sealNumber: "SEL123456",
        temperature: null,
        unloadAddress: "Mladá Boleslav Terminal"
      },
      {
        blNumber: "MEDU123456", 
        jobNumber: "MEDU123456-2",
        containerNumber: "COSU9004547",
        size: "40",
        containerType: "HC", 
        dateTime: "2025-01-22T14:45:00",
        status: "In Progress",
        routeStep: "C",
        sealNumber: "SEL789012",
        temperature: null,
        unloadAddress: "Prague Distribution Center"
      }
    ];

    await db.insert(containers).values(sampleContainers);

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}