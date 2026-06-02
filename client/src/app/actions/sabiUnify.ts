"use server";

import { runSabiUnify } from "@/lib/sabiUnify";

export async function testSabiUnifyConnection() {
  try {
    const result = await runSabiUnify("Hello, world!");
    if (result.status === "COMPLETED") {
      return { success: true, message: "Connection successful!" };
    } else {
      return { success: false, message: `Connection failed: ${result.status}` };
    }
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
