import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";

export async function devAuth(req: Request, res: Response, next: NextFunction) {
  const name = req.header("x-user-name");
  if (!name)
    return res.status(401).json({ message: "x-user-name header required" });
  const user = await prisma.user.findUnique({ where: { name } });
  if (!user) return res.status(401).json({ message: "unknown user" });
  req.userId = user.id;
  next();
}
