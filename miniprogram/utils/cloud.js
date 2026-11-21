/** Offline edition compatibility shim. No cloud services are used. */
module.exports = { call() { return Promise.reject(new Error('Offline edition: cloud services are disabled.')); } };
