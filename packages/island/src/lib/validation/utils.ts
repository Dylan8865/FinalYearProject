import { createClient } from "@supabase/supabase-js";
import type {
  ValidationResponse,
  IslandItemRequest,
  ItemDataRequest,
} from "../gemini/types";

// Create Supabase client with service role for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Generates validation request JSON for an island item
 * @param islandItemId The UUID of the island item
 * @returns Promise<IslandItemRequest | null> The request object or null if invalid
 */
export async function generateValidationRequest(
  islandItemId: string
): Promise<IslandItemRequest | null> {
  try {
    // Fetch island item
    const { data: islandItem, error: islandError } = await supabaseAdmin
      .from("island-item")
      .select("id, title")
      .eq("id", islandItemId)
      .single();

    if (islandError || !islandItem) {
      console.error("Failed to fetch island item:", islandError);
      return null;
    }

    // Check if title exists
    if (!islandItem.title) {
      console.error("Island item has no title");
      return null;
    }

    // Fetch all item-data for this island item
    const { data: itemDataList, error: itemDataError } = await supabaseAdmin
      .from("item-data")
      .select("id, type, content")
      .eq("island_item_id", islandItemId)
      .order("order_index", { ascending: true });

    if (itemDataError) {
      console.error("Failed to fetch item data:", itemDataError);
      return null;
    }

    // Check if at least one item-data has content
    const hasContent = itemDataList?.some((item) => item.content !== null);
    if (!hasContent || !itemDataList || itemDataList.length === 0) {
      console.error("No valid item data with content found");
      return null;
    }

    // Build the request object
    const itemData: ItemDataRequest[] = itemDataList.map((item) => ({
      id: item.id,
      type: item.type || "unknown",
      content: item.content,
    }));

    return {
      island_item_id: islandItem.id,
      title: islandItem.title,
      item_data: itemData,
    };
  } catch (error) {
    console.error("Error generating validation request:", error);
    return null;
  }
}

/**
 * Creates a new validation log entry with status 'queued'
 * @param islandItemId The UUID of the island item
 * @param request The validation request JSON
 * @returns Promise<string | null> The validation log ID or null if failed
 */
export async function createValidationLog(
  islandItemId: string,
  request: IslandItemRequest
): Promise<string | null> {
  try {
    // Set island item validation_status to 'pending'
    const { error: updateError } = await supabaseAdmin
      .from("island-item")
      .update({ validation_status: "pending" })
      .eq("id", islandItemId);

    if (updateError) {
      console.error(
        "Failed to update island item validation status:",
        updateError
      );
      return null;
    }

    // Create validation log entry
    const { data: logEntry, error: logError } = await supabaseAdmin
      .from("validation-log")
      .insert({
        status: "queued",
        item_id: islandItemId,
        request: request,
        retry_count: 0,
      })
      .select("id")
      .single();

    if (logError || !logEntry) {
      console.error("Failed to create validation log:", logError);
      return null;
    }

    return logEntry.id;
  } catch (error) {
    console.error("Error creating validation log:", error);
    return null;
  }
}

/**
 * Processes validation response and updates database
 * @param validationLogIds Array of validation log IDs being processed
 * @param response The validation response from Gemini
 * @returns Promise<void>
 */
export async function processValidationResponse(
  validationLogIds: string[],
  response: ValidationResponse
): Promise<void> {
  try {
    // Process each result
    for (const result of response.results) {
      // Update item-data validities
      for (const itemData of result.item_data) {
        await supabaseAdmin
          .from("item-data")
          .update({ validity: itemData.validity })
          .eq("id", itemData.id);
      }

      // Determine island item status based on validity
      let status: "verified" | "pending" | "declined";
      if (result.validity >= 60) {
        status = "verified";
      } else if (result.validity >= 55) {
        status = "pending";
      } else {
        status = "declined";
      }

      // Update island item with validity, comment, and status
      await supabaseAdmin
        .from("island-item")
        .update({
          validity: result.validity,
          comment: result.comment,
          status: status,
          validation_status: "completed",
        })
        .eq("id", result.island_item_id);
    }

    // Update validation logs status to 'completed' and save response
    await supabaseAdmin
      .from("validation-log")
      .update({
        status: "completed",
        response: response,
      })
      .in("id", validationLogIds);

    console.log(
      `Successfully processed validation for ${response.results.length} items`
    );
  } catch (error) {
    console.error("Error processing validation response:", error);
    throw error;
  }
}

/**
 * Handles failed validation attempts
 * @param validationLogIds Array of validation log IDs that failed
 * @param errorMessage The error message
 * @returns Promise<void>
 */
export async function handleValidationFailure(
  validationLogIds: string[],
  errorMessage: string
): Promise<void> {
  try {
    // Fetch the failed validation logs
    const { data: failedLogs, error: fetchError } = await supabaseAdmin
      .from("validation-log")
      .select("id, item_id, request, retry_count")
      .in("id", validationLogIds);

    if (fetchError || !failedLogs) {
      console.error("Failed to fetch validation logs:", fetchError);
      return;
    }

    // Update failed logs with error message and status 'failed'
    await supabaseAdmin
      .from("validation-log")
      .update({
        status: "failed",
        error: errorMessage,
      })
      .in("id", validationLogIds);

    // Process each failed log for retry logic
    for (const log of failedLogs) {
      // Check if there are newer queued logs for the same item
      const { data: newerLogs } = await supabaseAdmin
        .from("validation-log")
        .select("id")
        .eq("item_id", log.item_id)
        .eq("status", "queued")
        .gt("created_at", new Date().toISOString());

      const hasNewerQueuedLog = newerLogs && newerLogs.length > 0;

      if (log.retry_count < 5 && !hasNewerQueuedLog) {
        // Create a new retry entry
        await supabaseAdmin.from("validation-log").insert({
          status: "queued",
          item_id: log.item_id,
          request: log.request,
          retry_count: log.retry_count + 1,
        });
      } else if (log.retry_count >= 5) {
        // Max retries reached, update island item
        await supabaseAdmin
          .from("island-item")
          .update({
            status: "pending",
            validity: 0,
            comment: "Gemini error ≥5 times, manual validation required.",
            validation_status: "error",
          })
          .eq("id", log.item_id);
      } else if (hasNewerQueuedLog) {
        // There's a newer queued log, set validation_status to error but don't update other fields
        await supabaseAdmin
          .from("island-item")
          .update({
            validation_status: "error",
          })
          .eq("id", log.item_id);
      }
    }

    console.log(`Handled failure for ${failedLogs.length} validation logs`);
  } catch (error) {
    console.error("Error handling validation failure:", error);
  }
}

/**
 * Fetches queued validation requests, handling superseded entries
 * @param limit Maximum number of items to fetch (default: 5)
 * @returns Promise<Array<{logId: string, request: IslandItemRequest}>>
 */
export async function fetchQueuedValidations(
  limit: number = 5
): Promise<Array<{ logId: string; request: IslandItemRequest }>> {
  try {
    // Fetch queued validation logs ordered by created_at (oldest first)
    const { data: queuedLogs, error: fetchError } = await supabaseAdmin
      .from("validation-log")
      .select("id, item_id, request, created_at")
      .eq("status", "queued")
      .order("created_at", { ascending: true })
      .limit(limit * 2); // Fetch more in case some get superseded

    if (fetchError || !queuedLogs || queuedLogs.length === 0) {
      return [];
    }

    const validLogs: Array<{ logId: string; request: IslandItemRequest }> = [];
    const processedItemIds = new Set<string>();

    // Process logs to find superseded entries
    for (const log of queuedLogs) {
      if (validLogs.length >= limit) break;

      // Check if there's a newer queued log for the same item_id
      const newerLogs = queuedLogs.filter(
        (otherLog) =>
          otherLog.item_id === log.item_id &&
          new Date(otherLog.created_at) > new Date(log.created_at) &&
          otherLog.id !== log.id
      );

      if (newerLogs.length > 0) {
        // This log is superseded, mark it
        await supabaseAdmin
          .from("validation-log")
          .update({ status: "superseeded" })
          .eq("id", log.id);
      } else if (!processedItemIds.has(log.item_id)) {
        // This is a valid log to process
        validLogs.push({
          logId: log.id,
          request: log.request as IslandItemRequest,
        });
        processedItemIds.add(log.item_id);
      }
    }

    // Mark the valid logs as 'processing'
    if (validLogs.length > 0) {
      const logIds = validLogs.map((log) => log.logId);
      await supabaseAdmin
        .from("validation-log")
        .update({ status: "processing" })
        .in("id", logIds);
    }

    return validLogs;
  } catch (error) {
    console.error("Error fetching queued validations:", error);
    return [];
  }
}
