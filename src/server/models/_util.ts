import mongoose, { type InferSchemaType, type Model, type Schema } from "mongoose";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySchema = Schema<any, any, any, any, any, any, any, any>;

// Voorkomt "OverwriteModelError" bij hot reload: hergebruik een bestaand model. Behoudt de schematypes.
export function defineModel<S extends AnySchema>(name: string, schema: S) {
  type Doc = InferSchemaType<S>;
  return (mongoose.models[name] as Model<Doc> | undefined) ?? mongoose.model<Doc>(name, schema);
}
