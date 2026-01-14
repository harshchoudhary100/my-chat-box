import jwt from "jsonwebtoken";

const blacklist = new Map();

export const blacklistToken = (jti, expUnixSeconds) => {
  if (!jti || !expUnixSeconds) return;
  blacklist.set(jti, expUnixSeconds);
};

const isTokenBlacklisted = (jti) => {
  if (!jti) return false;
  const exp = blacklist.get(jti);
  if (!exp) return false;
  const now = Math.floor(Date.now() / 1000);
  if (exp <= now) {
    blacklist.delete(jti);
    return false;
  }
  return true;
};

export const auth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : undefined;

    if (!token) return res.status(401).json({ error: "No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded?.jti && isTokenBlacklisted(decoded.jti)) {
      return res.status(401).json({ error: "Token invalidated" });
    }
    req.userId = decoded.userId;
    req.tokenJti = decoded.jti;
    next();
  } catch (err) {
    res.status(401).json({ error: "Unauthorized" });
  }
};
