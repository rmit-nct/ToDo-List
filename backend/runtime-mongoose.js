// Use the unchanged model schemas with a separate connection per Worker request.
// Standalone Express and teammate tests continue to use default Mongoose.
const mongoose = require("mongoose");
const { AsyncLocalStorage } = require("node:async_hooks");
const scope = new AsyncLocalStorage();
const schemas = new Map();
module.exports = {
  Schema: mongoose.Schema,
  scope,
  schemas,
  model(name, schema) {
    schemas.set(name, schema);
    const fallback = mongoose.models[name] || mongoose.model(name, schema);
    const current = () => {
      const connection = scope.getStore();
      return connection
        ? connection.models[name] || connection.model(name, schema)
        : fallback;
    };
    return new Proxy(fallback, {
      get(target, key) {
        const model = current();
        const value = Reflect.get(model, key);
        return typeof value === "function" ? value.bind(model) : value;
      },
      construct(target, args) {
        return Reflect.construct(current(), args);
      },
    });
  },
};
