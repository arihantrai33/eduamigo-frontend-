// Where each role lands after signing in.
export const homeFor = (role) => (role === "driver" ? "/driver" : role === "accountant" ? "/admin/home" : `/${role}/home`);
