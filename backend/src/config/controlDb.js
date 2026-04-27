import mongoose from "mongoose";
import { env } from "./env.js";

let controlConnection;

export const connectControlDb = async () => {
  if (controlConnection?.readyState === 1) {
    return controlConnection;
  }

  controlConnection = await mongoose.createConnection(env.controlDbUri).asPromise();
  return controlConnection;
};

export const getControlConnection = () => {
  if (!controlConnection) {
    throw new Error("Control database is not connected");
  }

  return controlConnection;
};