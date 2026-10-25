// Where each role lands after signing in.
export const homeFor = (role) => (role === "driver" ? "/driver" : ["accountant", "staff"].includes(role) ? "/admin/home" : `/${role}/home`);
