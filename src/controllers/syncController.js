import { getFullSyncData } from "../services/syncService.js";

export async function syncData(req, res) {
  try {
    const data = await getFullSyncData();

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Sync data error:", error);

    return res.status(500).json({
      success: false,
      code: "SYNC_FAILED",
      message: "Failed to synchronize application data.",
    });
  }
}