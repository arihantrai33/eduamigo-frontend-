// Paid modules the school has (from the sign-in response). The server is the real gatekeeper;
// this only hides screens the school has not bought.
// Sessions saved before plans existed have no list: treat everything as available.
export function hasFeature(user, feature) {
  if (!feature) return true;
  if (!Array.isArray(user?.features)) return true;
  return user.features.includes(feature);
}

// Which feature a student/parent screen belongs to.
export const FEATURE_OF_PATH = {
  "/student/bus": "transport",
  "/student/result": "exams",
  "/student/fee": "fees",
  "/student/chat": "chat",
  "/student/revise": "ai_revision",
  "/student/learn": "ai_revision",
  "/parent/bus": "transport",
  "/parent/result": "exams",
  "/parent/fee": "fees",
  "/parent/chat": "chat",
};

// For lists of tiles/tabs: an item may name its feature, otherwise it is taken from its path.
export const visibleFor = (user) => (item) => hasFeature(user, item.feature || FEATURE_OF_PATH[item.path]);
