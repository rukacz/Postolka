import { db } from "./db";
import { blSummaries, blDetails, containers } from "@shared/schema";

export async function seedDatabase() {
  try {
    // Clear existing data to ensure clean state
    console.log("Clearing existing data...");
    await db.delete(containers);
    await db.delete(blDetails);
    await db.delete(blSummaries);

    console.log("Seeding database with sample data...");

    // Sample BL Summaries
    const sampleBLSummaries = [
      {
        blNumber: "MEDU123456",
        date: "2025-01-22", 
        client: "ŠKODA AUTO",
        notificationEmail: "jan.novak@skoda-auto.cz",
        pic: "Jan Novák",
        destination: "Mladá Boleslav",
        podPol: "HAM CTA",
        etaClosing: "25/01/2025",
        vesselVoyage: "MSC MAYA/0142E",
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
        changedFields: ["eta", "carrierStatus"],
        lastChatMessage: "Potvrzeno. ETA updated to 14:30.",
        lastChatAuthor: "Petr Svoboda", 
        unreadChatCount: 2
      },
      {
        blNumber: "MSCU789012",
        date: "2025-01-23",
        client: "TESCO", 
        notificationEmail: "eva.svobodova@tesco.cz",
        pic: "Eva Svobodová",
        destination: "Gan",
        podPol: "BRV MSC",
        etaClosing: "26/01/2025",
        vesselVoyage: "MSC OSCAR/0156E",
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
        changedFields: [],
        lastChatMessage: "Containers ready for pickup",
        lastChatAuthor: "Eva Svobodová",
        unreadChatCount: 1
      },
      {
        blNumber: "TCLU345678",
        date: "2025-01-25",
        client: "IKEA",
        notificationEmail: "tomas.dvorak@ikea.sk",
        pic: "Tomáš Dvořák", 
        destination: "Ružomberok",
        podPol: "Koper",
        etaClosing: "27/01/2025",
        vesselVoyage: "ONE STORK/0523W",
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
        changedFields: ["medlogStatus", "destination", "date"],
        lastChatMessage: "Status změněn na Rejected",
        lastChatAuthor: "Tomáš Dvořák",
        unreadChatCount: 1
      },
      {
        blNumber: "NTBG456789",
        date: "2025-01-20",
        client: "NTB",
        notificationEmail: "marie.cerna@ntb.cz",
        pic: "Marie Černá",
        destination: "Praha",
        podPol: "Rotterdam",
        etaClosing: "22/01/2025", 
        vesselVoyage: "MSC BENEDETTA/0245E",
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
        changedFields: ["containers"],
        lastChatMessage: "Kontejnery připraveny k nakládce",
        lastChatAuthor: "Marie Černá",
        unreadChatCount: 0
      },
      {
        blNumber: "AUDI567890",
        date: "2025-01-24",
        client: "AUDI",
        notificationEmail: "petr.prochazka@audi.de",
        pic: "Petr Procházka",
        destination: "Ingolstadt",
        podPol: "Antwerpen",
        etaClosing: "28/01/2025",
        vesselVoyage: "HAPAG LLOYD BERLIN/0834W",
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
        changedFields: [],
        lastChatMessage: "Dokument připraven",
        lastChatAuthor: "Petr Procházka",
        unreadChatCount: 3
      }
    ];

    await db.insert(blSummaries).values(sampleBLSummaries);

    // Sample BL Details - Multiple entries for different scenarios
    const sampleBLDetails = [
      {
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
        eta: "24/01/2025", // Changed from 22/01/2025 - shows date change
        availability: "25/01/2025 10:00", // Changed from 08:00 - shows time change
        storageStart: "25/01/2025",
        fromLocation: "Port of Hamburg",
        fromAddress: "Waltershof Terminal, Hamburg 21129",
        fromZone: "Zone A",
        toLocation: "ŠKODA AUTO Mladá Boleslav",
        toAddress: "Václava Klementa 869, 293 60 Mladá Boleslav",
        toZone: "Zone 2",
        hoursOfOperation: "07:00 - 15:00"
      },
      {
        blNumber: "TCLU345678",
        customerRef: "IK002789", 
        jobType: "Export",
        status: "Attention Required",
        customerName: "IKEA",
        contactName: "ANNA SVOBODA",
        contactPhone: "420 255 333 444",
        consigneeName: "IKEA STORES",
        vesselName: "ONE MATRIX/0255W",
        shippingLine: "ONE",
        eta: "27/01/2025",
        availability: "28/01/2025 09:00",
        storageStart: "29/01/2025",
        fromLocation: "IKEA Distribution Center",
        fromAddress: "Průmyslová 1523, 252 19 Rudná",
        fromZone: "Zone 3",
        toLocation: "Port of Koper",
        toAddress: "Vojkovo nabrežje 38, 6000 Koper",
        toZone: "Zone A",
        hoursOfOperation: "06:00 - 22:00"
      },
      {
        blNumber: "NTBG456789",
        customerRef: "NTB003456", 
        jobType: "Import",
        status: "Confirmed",
        customerName: "NTB",
        contactName: "PETR NOVOTNY",
        contactPhone: "420 234 567 890",
        consigneeName: "NTB SOLUTIONS",
        vesselName: "MSC GENEVA/0188E",
        shippingLine: "MSC",
        eta: "21/01/2025",
        availability: "22/01/2025 07:30",
        storageStart: "23/01/2025",
        fromLocation: "Port of Rotterdam",
        fromAddress: "Maasvlakte Plaza 1, 3199 DB Rotterdam",
        fromZone: "Zone B",
        toLocation: "NTB Warehouse Praha",
        toAddress: "Pražská 1408, 250 01 Brandýs nad Labem",
        toZone: "Zone 1",
        hoursOfOperation: "08:00 - 16:00"
      }
    ];

    await db.insert(blDetails).values(sampleBLDetails);

    // Sample Containers - Expanded with different scenarios
    const sampleContainers = [
      {
        blNumber: "MEDU123456",
        jobNumber: "MEDU123456-1",
        containerNumber: "COSU1044551",
        sizeType: "20DV",
        dateTime: "2025-01-24T12:30:00", // Changed from 10:30 - shows time change
        status: "In Progress",
        routeStep: "D",
        sealNumber: "SEL123456",
        temperature: null,
        unloadAddress: "Mladá Boleslav Terminal",
        carrierStatus: "MIPS Send",
        medlogStatus: "Approved",
        trainName: "MEH2530R1",
        trainEtd: "2025W30R1",
        lastChangedBy: "system",
        lastChangedAt: "2025-01-22 14:30",
        changedFields: ["size", "containerType"], // Changed from 40HC to 20DV
        carrierNote: "",
        medlogNote: "Kontejner připraven k vyzvednutí"
      },
      {
        blNumber: "MEDU123456", 
        jobNumber: "MEDU123456-2",
        containerNumber: "COSU9004547",
        sizeType: "40HC",
        dateTime: "2025-01-24T16:45:00", // Changed from 14:45 - shows time change
        status: "Delayed", // Changed from "In Progress" - shows status change
        routeStep: "C",
        sealNumber: "SEL789012",
        temperature: null,
        unloadAddress: "Prague Distribution Center",
        carrierStatus: "Do Not Release",
        medlogStatus: "Rejected",
        trainName: "OBH2530R3",
        trainEtd: "2025W30R3",
        lastChangedBy: "carrier",
        lastChangedAt: "2025-01-22 16:15",
        changedFields: ["dateTime", "status"],
        carrierNote: "Zpoždění kvůli dopravě",
        medlogNote: ""
      },
      {
        blNumber: "TCLU345678",
        jobNumber: "TCLU345678-1",
        containerNumber: "TCLU8899001",
        sizeType: "40HC",
        dateTime: "2025-01-27T08:00:00",
        status: "Ready",
        routeStep: "W",
        sealNumber: "SEL445566",
        temperature: null,
        unloadAddress: "Koper Terminal",
        carrierStatus: "Pre-Order",
        medlogStatus: "New",
        trainName: "MEH2532R2",
        trainEtd: "2025W32R2",
        lastChangedBy: null,
        lastChangedAt: null,
        changedFields: [],
        carrierNote: "",
        medlogNote: ""
      },
      {
        blNumber: "TCLU345678",
        jobNumber: "TCLU345678-2",
        containerNumber: "TCLU8899002",
        sizeType: "40HC",
        dateTime: "2025-01-27T08:15:00",
        status: "Ready",
        routeStep: "W",
        sealNumber: "SEL445567",
        temperature: null,
        unloadAddress: "Koper Terminal",
        carrierStatus: "Pre-Order",
        medlogStatus: "New",
        trainName: "MEH2532R2",
        trainEtd: "2025W32R2",
        lastChangedBy: null,
        lastChangedAt: null,
        changedFields: [],
        carrierNote: "",
        medlogNote: ""
      },
      {
        blNumber: "TCLU345678",
        jobNumber: "TCLU345678-3",
        containerNumber: "TCLU8899003", 
        sizeType: "20DV",
        dateTime: "2025-01-27T09:00:00",
        status: "Issues", // Problem container
        routeStep: "W",
        sealNumber: "SEL445568",
        temperature: null,
        unloadAddress: "Koper Terminal",
        carrierStatus: "Cancelled",
        medlogStatus: "Changed",
        trainName: "MEH2532R2",
        trainEtd: "2025W32R2",
        lastChangedBy: "carrier",
        lastChangedAt: "2025-01-22 09:45",
        changedFields: ["status"], // Changed to Issues status
        carrierNote: "Kontejner zrušen kvůli poškození",
        medlogNote: "Nutná výměna kontejneru"
      },
      {
        blNumber: "NTBG456789",
        jobNumber: "NTBG456789-1",
        containerNumber: "NTBU5566789",
        sizeType: "40HC",
        dateTime: "2025-01-22T11:15:00", // Recently added container
        status: "Confirmed",
        routeStep: "R",
        sealNumber: "SEL778899",
        temperature: null,
        unloadAddress: "Praha Distribution",
        carrierStatus: "MIPS Send",
        medlogStatus: "Approved",
        trainName: "OBH2534R4",
        trainEtd: "2025W34R4",
        lastChangedBy: "medlog",
        lastChangedAt: "2025-01-22 11:00",
        changedFields: ["containerNumber", "sealNumber"], // Newly added container
        carrierNote: "",
        medlogNote: "Potvrzeno - připraven k expedici"
      },
      {
        blNumber: "NTBG456789",
        jobNumber: "NTBG456789-2",
        containerNumber: "NTBU5566790",
        sizeType: "20DV",
        dateTime: "2025-01-22T11:30:00", // Recently added container
        status: "Confirmed",
        routeStep: "R",
        sealNumber: "SEL778900",
        temperature: null,
        unloadAddress: "Praha Distribution",
        carrierStatus: "MIPS Send",
        medlogStatus: "Approved",
        trainName: "OBH2534R4",
        trainEtd: "2025W34R4",
        lastChangedBy: "medlog",
        lastChangedAt: "2025-01-22 11:15",
        changedFields: ["containerNumber", "sealNumber"], // Newly added container
        carrierNote: "",
        medlogNote: "Kontrola dokončena"
      }
    ];

    await db.insert(containers).values(sampleContainers);

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}