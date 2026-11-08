import { createRemoteJWKSet, jwtVerify } from "jose";

// better auth on the client app publishes its public keys here
const jwks = createRemoteJWKSet(
  new URL(`${process.env.CLIENT_URL}/api/auth/jwks`)
);

export async function verifyToken(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Please login first" });

  try {
    const { payload } = await jwtVerify(token, jwks);
    req.user = { email: payload.email, name: payload.name };
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}