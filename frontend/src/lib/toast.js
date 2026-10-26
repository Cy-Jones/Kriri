import { sileo } from "sileo";

/**
 * Enhanced Sileo toast wrapper for Kriri.
 * Provides both the fluent Sileo object API and string shorthand helpers.
 *
 * Examples:
 * toast.success("Changes saved");
 * toast.success({ title: "Workspace updated", description: "All changes synced" });
 * toast.error("Failed to save", "Please check your network connection");
 * toast.promise(saveData(), { loading: { title: "Saving..." }, success: { title: "Saved!" }, error: { title: "Failed to save" } });
 */
export const toast = {
  success: (titleOrOpts, description) => {
    if (typeof titleOrOpts === "string") {
      return sileo.success({ title: titleOrOpts, ...(description ? { description } : {}) });
    }
    return sileo.success(titleOrOpts);
  },
  error: (titleOrOpts, description) => {
    if (typeof titleOrOpts === "string") {
      return sileo.error({ title: titleOrOpts, ...(description ? { description } : {}) });
    }
    return sileo.error(titleOrOpts);
  },
  warning: (titleOrOpts, description) => {
    if (typeof titleOrOpts === "string") {
      return sileo.warning({ title: titleOrOpts, ...(description ? { description } : {}) });
    }
    return sileo.warning(titleOrOpts);
  },
  info: (titleOrOpts, description) => {
    if (typeof titleOrOpts === "string") {
      return sileo.info({ title: titleOrOpts, ...(description ? { description } : {}) });
    }
    return sileo.info(titleOrOpts);
  },
  action: (opts) => sileo.action(opts),
  promise: (promise, opts) => sileo.promise(promise, opts),
  dismiss: (id) => sileo.dismiss(id),
  clear: (position) => sileo.clear(position),
};

export { sileo };
export default toast;
