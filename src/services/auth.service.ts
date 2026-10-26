import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "../errors/app-error.js";
import { UserRepository } from "../repositories/user.repository.js";

export class AuthService {
  constructor(private readonly userRepository = new UserRepository()) {}

  async login(email: string, password: string): Promise<{ token: string; user: { id: number; email: string; nombre: string } }> {
    const normalizedEmail = (email ?? "").trim();
    if (!normalizedEmail || !password) {
      throw new AppError(400, "INVALID_CREDENTIALS", "Email y contraseña son requeridos.");
    }

    const user = await this.userRepository.getByEmail(normalizedEmail);
    if (!user || user.password_hash !== password) {
      throw new AppError(401, "INVALID_CREDENTIALS", "Credenciales inválidas.");
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, env.JWT_SECRET, { expiresIn: "8h" });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
      },
    };
  }
}
