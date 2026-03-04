import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { supabase } from "./supabase";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/api/categories", async (_req, res) => {
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, slug");

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json(data);
  });

  return httpServer;
}
